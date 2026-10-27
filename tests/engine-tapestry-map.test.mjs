// Tests for the tapestry cards for exploring and conquering, and Alliance (#19, design §7, §8).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { play } from '../src/lib/engine/play.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { controlledTerritories } from '../src/lib/engine/control.js';
import { startedGame, answer, resolveTapestry } from './helpers/engine.mjs';

/**
 * A started small-map game for `count` players with every outpost cleared, where seat 1 controls '-2_-2'.
 * @param {number} [count]
 * @returns {{ state: any, random: any }}
 */
function game(count = 2) {
	const { state: started, random } = startedGame(count);
	const state = structuredClone(started);
	for (const hex of Object.values(state.hexes)) {
		hex.outposts = [];
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	return { state, random };
}

/**
 * A 2-player game where seat 1 at '-2_-2' can conquer only '-2_-1', which seat 2 holds with a lone outpost.
 * Every other hex is unexplored.
 * @param {string[]} hand - Seat 2's tapestry cards
 */
function conquerGame(hand) {
	const { state } = game();
	for (const [key, hex] of Object.entries(state.hexes)) {
		if (key !== '-2_-2' && key !== '-2_-1') {
			/** @type {any} */ (hex).tile = null;
		}
	}
	state.hexes['-2_-1'].outposts = [{ seat: 2, toppled: false }];
	state.seats[1].hand = [...hand];
	return state;
}

/** A random that gives every roll the same face. */
const face = (/** @type {number} */ n) => () => n;

/**
 * The events of one type, without their numbers.
 * @param {any} state
 * @param {string} type
 * @param {number} [from]
 */
const eventsOf = (state, type, from = 0) =>
	state.events
		.slice(from)
		.filter((/** @type {any} */ e) => e.type === type)
		.map(({ seq: _seq, ...e }) => e);

/**
 * The event types from `from` on.
 * @param {any} state
 * @param {number} [from]
 */
const types = (state, from = 0) =>
	state.events.slice(from).map((/** @type {any} */ e) => e.type);

/**
 * The decisions open besides the turn choice every started game has.
 * @param {any} state
 */
const questions = (state) =>
	openDecisions(state).filter((d) => d.kind !== 'chooseTurn');

/** @param {any} state @param {string} kind */
const open = (state, kind) =>
	/** @type {any} */ (openDecisions(state).find((d) => d.kind === kind));

/**
 * Answers every open question with its first answer until only the turn choice is left.
 * @param {any} state
 * @param {any} random
 */
function settle(state, random) {
	for (let step = 0; step < 100; step++) {
		const [next] = questions(state);
		if (!next) {
			return state;
		}
		const [first] = DECISIONS[next.kind].answers(state, next);
		state = play(
			state,
			next.player,
			{ decision: next.id, ...first },
			random
		);
	}
	throw new Error('A decision never ended.');
}

test('Coal Baron gains a tile and explores with that tile only, then gives each neighbour one', () => {
	const { state, random } = game(3);
	state.seats[0].territoryTiles = [5];
	// Tile 3's benefit is 1 food, so the supply only feeds Coal Baron and the neighbours.
	state.supply.territory = [3, 9, 13, 20];
	const before = state.events.length;
	let next = resolveTapestry(state, random, 1, 'coal-baron');
	const explore = open(next, 'chooseExplore');
	assert.equal(explore.tile, 3);
	const offered = DECISIONS.chooseExplore.answers(next, explore);
	assert.ok(offered.length > 1);
	assert.ok(offered.every((a) => a.tile === 3));
	// Nothing reaches the neighbours before the explore is done.
	assert.deepEqual(
		eventsOf(next, 'tilesGained', before).map((e) => [e.player, e.tiles]),
		[[1, [3]]]
	);
	next = answer(next, random, 1, 'chooseExplore', offered[0]);
	assert.equal(eventsOf(next, 'explored', before)[0].tile, 3);
	// Right, then left: seat 3 then seat 2.
	assert.deepEqual(
		eventsOf(next, 'tilesGained', before).map((e) => [e.player, e.tiles]),
		[
			[1, [3]],
			[3, [9]],
			[2, [13]],
		]
	);
	assert.deepEqual(next.seats[0].territoryTiles, [5]);
	assert.deepEqual(next.supply.territory, [20]);
	assert.deepEqual(questions(next), []);
});

test('Coal Baron with no tile left still gives the neighbours what is left and explores nothing', () => {
	const { state, random } = game(3);
	// Seat 1 holds a tile it could explore with, but Coal Baron only explores with the tile it gains.
	state.seats[0].territoryTiles = [5];
	state.supply.territory = [];
	const before = state.events.length;
	const next = resolveTapestry(state, random, 1, 'coal-baron');
	assert.deepEqual(
		eventsOf(next, 'tilesGained', before).map((e) => [e.player, e.tiles]),
		[
			[1, []],
			[3, []],
			[2, []],
		]
	);
	assert.ok(!types(next, before).includes('explored'));
	assert.ok(!types(next, before).includes('noExplore'));
	assert.deepEqual(next.seats[0].territoryTiles, [5]);
	assert.deepEqual(questions(next), []);
});

test('Colonialism gains a resource per land terrain on a controlled tile, and never for a printed territory (R27)', () => {
	const { state, random } = game();
	// The middle island is printed with all four land terrains, and gives nothing (R27).
	state.hexes['0_0'].outposts = [{ seat: 1, toppled: false }];
	const printedOnly = resolveTapestry(state, random, 1, 'colonialism');
	assert.deepEqual(eventsOf(printedOnly, 'noColonialism'), [
		{ type: 'noColonialism', player: 1 },
	]);
	assert.deepEqual(printedOnly.seats[0].resources, state.seats[0].resources);
	assert.deepEqual(questions(printedOnly), []);

	// Tile 8 is sea, mountain and desert: 1 worker and 1 coin. One tile is taken without asking.
	state.hexes['-3_-2'].tile = 8;
	state.hexes['-3_-2'].outposts = [{ seat: 1, toppled: false }];
	const one = resolveTapestry(state, random, 1, 'colonialism');
	assert.deepEqual(questions(one), []);
	assert.deepEqual(one.seats[0].resources, {
		...state.seats[0].resources,
		worker: state.seats[0].resources.worker + 1,
		coin: state.seats[0].resources.coin + 1,
	});

	// Tile 5 is an island of desert: only its island counts, 1 coin.
	state.hexes['-3_-1'].tile = 5;
	state.hexes['-3_-1'].outposts = [{ seat: 1, toppled: false }];
	// A tile whose only upright outpost is another seat's isn't controlled.
	state.hexes['-2_-3'].tile = 14;
	state.hexes['-2_-3'].outposts = [{ seat: 2, toppled: false }];
	const two = resolveTapestry(state, random, 1, 'colonialism');
	const choice = open(two, 'chooseHex');
	assert.deepEqual(
		{
			options: choice.options,
			optional: choice.optional,
			purpose: choice.purpose,
		},
		{
			options: ['-3_-2', '-3_-1'],
			optional: false,
			purpose: 'colonialism',
		}
	);
	assert.deepEqual(DECISIONS.chooseHex.answers(two, choice), [
		{ hex: '-3_-2' },
		{ hex: '-3_-1' },
	]);
	assert.throws(
		() => answer(two, random, 1, 'chooseHex', { hex: null }),
		/Choose one of the territories offered\./
	);
	assert.throws(
		() => answer(two, random, 1, 'chooseHex', { hex: '-2_-3' }),
		/Choose one of the territories offered\./
	);
	const island = answer(two, random, 1, 'chooseHex', { hex: '-3_-1' });
	assert.deepEqual(island.seats[0].resources, {
		...state.seats[0].resources,
		coin: state.seats[0].resources.coin + 1,
	});
});

test('Revolution raises up to three of your toppled outposts, topples the opponents there, and can claim topple two', () => {
	const { state, random } = game(3);
	// In map order: four territories where seat 1's outpost was toppled.
	state.hexes['-3_-3'].outposts = [
		{ seat: 1, toppled: true, toppledBy: 2 },
		{ seat: 2, toppled: false },
	];
	state.hexes['-2_-1'].outposts = [
		{ seat: 2, toppled: false },
		{ seat: 1, toppled: true, toppledBy: 2 },
	];
	state.hexes['-1_-2'].outposts = [
		{ seat: 1, toppled: true, toppledBy: 3 },
		{ seat: 3, toppled: false },
	];
	state.hexes['1_-1'].outposts = [
		{ seat: 1, toppled: true, toppledBy: 2 },
		{ seat: 2, toppled: false },
	];
	let next = resolveTapestry(state, random, 1, 'revolution');
	next = answer(next, random, 1, 'chooseOption', { option: 1 });
	const before = next.events.length;
	// The first territory is required.
	let pick = open(next, 'chooseHex');
	assert.deepEqual(
		[pick.options, pick.optional, pick.purpose],
		[['-3_-3', '-2_-1', '-1_-2', '1_-1'], false, 'revolution']
	);
	next = answer(next, random, 1, 'chooseHex', { hex: '-2_-1' });
	assert.deepEqual(next.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	]);
	assert.deepEqual(eventsOf(next, 'achievementClaimed', before), []);
	// The rest are optional.
	pick = open(next, 'chooseHex');
	assert.deepEqual(
		[pick.options, pick.optional],
		[['-3_-3', '-1_-2', '1_-1'], true]
	);
	assert.deepEqual(DECISIONS.chooseHex.answers(next, pick)[0], {
		hex: null,
	});
	next = answer(next, random, 1, 'chooseHex', { hex: '-1_-2' });
	assert.deepEqual(next.hexes['-1_-2'].outposts, [
		{ seat: 1, toppled: false },
		{ seat: 3, toppled: true, toppledBy: 1 },
	]);
	// Two opponent outposts toppled by seat 1, still toppled: "topple two" (design §9).
	assert.deepEqual(
		eventsOf(next, 'achievementClaimed', before).map((e) => [
			e.player,
			e.achievement,
		]),
		[[1, 'topple-two']]
	);
	next = answer(next, random, 1, 'chooseHex', { hex: '1_-1' });
	// Three territories at most: nothing more is asked, and '-3_-3' stays as it was.
	assert.deepEqual(questions(next), []);
	assert.deepEqual(
		next.hexes['-3_-3'].outposts,
		state.hexes['-3_-3'].outposts
	);
	assert.deepEqual(
		eventsOf(next, 'outpostRaised', before).map((e) => e.hex),
		['-2_-1', '-1_-2', '1_-1']
	);
	assert.deepEqual(eventsOf(next, 'outpostToppled', before), [
		{ type: 'outpostToppled', player: 2, hex: '-2_-1', by: 1 },
		{ type: 'outpostToppled', player: 3, hex: '-1_-2', by: 1 },
		{ type: 'outpostToppled', player: 2, hex: '1_-1', by: 1 },
	]);
	// Not a conquest: no dice.
	assert.ok(!types(next, before).includes('conquered'));
	assert.ok(!types(next, before).includes('conquerDiceRolled'));
});

test('Revolution takes a lone first territory without asking, and its later picks may be declined', () => {
	const { state, random } = game(3);
	state.hexes['-3_-3'].outposts = [
		{ seat: 1, toppled: true, toppledBy: 2 },
		{ seat: 2, toppled: false },
	];
	let next = resolveTapestry(state, random, 1, 'revolution');
	next = answer(next, random, 1, 'chooseOption', { option: 1 });
	assert.deepEqual(next.hexes['-3_-3'].outposts, [
		{ seat: 1, toppled: false },
		{ seat: 2, toppled: true, toppledBy: 1 },
	]);
	assert.deepEqual(questions(next), []);

	state.hexes['-2_-1'].outposts = [
		{ seat: 2, toppled: false },
		{ seat: 1, toppled: true, toppledBy: 2 },
	];
	next = resolveTapestry(state, random, 1, 'revolution');
	next = answer(next, random, 1, 'chooseOption', { option: 1 });
	next = answer(next, random, 1, 'chooseHex', { hex: '-3_-3' });
	// One territory left, but an optional pick still asks.
	assert.deepEqual(open(next, 'chooseHex').options, ['-2_-1']);
	next = answer(next, random, 1, 'chooseHex', { hex: null });
	assert.deepEqual(questions(next), []);
	assert.deepEqual(
		next.hexes['-2_-1'].outposts,
		state.hexes['-2_-1'].outposts
	);
	// With no toppled outpost, Revolution does nothing.
	const none = game(3);
	const empty = answer(
		resolveTapestry(none.state, none.random, 1, 'revolution'),
		none.random,
		1,
		'chooseOption',
		{ option: 1 }
	);
	assert.deepEqual(questions(empty), []);
});

test('Age of Sail draws 3 tiles on every explore and may give one to an opponent for 3 VP', () => {
	const { state, random } = game();
	state.seats[0].territoryTiles = [2];
	state.supply.territory = [3, 9, 13, 20];
	const sailing = resolveTapestry(state, random, 1, 'age-of-sail');
	let next = resolveEffects(sailing, 1, [{ explore: {} }], random);
	assert.deepEqual(next.seats[0].territoryTiles, [2, 3, 9, 13]);
	const gift = open(next, 'chooseGift');
	assert.deepEqual(DECISIONS.chooseGift.answers(next, gift), [
		{ tile: null },
		{ tile: 2, player: 2 },
		{ tile: 3, player: 2 },
		{ tile: 9, player: 2 },
		{ tile: 13, player: 2 },
	]);
	assert.throws(
		() => answer(next, random, 1, 'chooseGift', { tile: 20, player: 2 }),
		/Give a territory tile from your supply to an opponent, or decline\./
	);
	assert.throws(
		() => answer(next, random, 1, 'chooseGift', { tile: 9, player: 1 }),
		/Give a territory tile from your supply to an opponent, or decline\./
	);
	const vp = next.seats[0].vp;
	next = answer(next, random, 1, 'chooseGift', { tile: 9, player: 2 });
	assert.deepEqual(next.seats[0].territoryTiles, [2, 3, 13]);
	assert.deepEqual(next.seats[1].territoryTiles, [9]);
	assert.equal(next.seats[0].vp, vp + 3);
	assert.deepEqual(eventsOf(next, 'tileGiven'), [
		{ type: 'tileGiven', player: 1, to: 2, tile: 9 },
	]);
	// Then the explore itself, without drawing again.
	assert.deepEqual(
		questions(next).map((d) => d.kind),
		['chooseExplore']
	);
	assert.deepEqual(next.supply.territory, [20]);
	next = answer(next, random, 1, 'chooseExplore', {
		tile: 2,
		hex: '-3_-2',
		orient: 0,
	});
	assert.equal(next.hexes['-3_-2'].tile, 2);
	// Tile 2's benefit draws the last tile; the next explore draws what is left, here nothing, and the gift may be declined.
	next = settle(next, random);
	assert.deepEqual(next.supply.territory, []);
	const held = next.seats[0].territoryTiles.length;
	const before = next.events.length;
	next = resolveEffects(next, 1, [{ explore: {} }], random);
	assert.deepEqual(
		eventsOf(next, 'tilesGained', before).map((e) => e.tiles),
		[[]]
	);
	next = answer(next, random, 1, 'chooseGift', { tile: null });
	assert.equal(next.seats[0].territoryTiles.length, held);
	assert.deepEqual(
		questions(next).map((d) => d.kind),
		['chooseExplore']
	);
});

test('Age of Sail draws even when the explore then has no hex', () => {
	const { state, random } = game();
	// Seat 1 controls nothing, so no hex can be explored.
	state.hexes['-2_-2'].outposts = [];
	state.supply.territory = [3, 9];
	const sailing = resolveTapestry(state, random, 1, 'age-of-sail');
	let next = resolveEffects(sailing, 1, [{ explore: {} }], random);
	// Fewer than 3 tiles left: it draws what there is.
	assert.deepEqual(next.seats[0].territoryTiles, [3, 9]);
	const before = next.events.length;
	next = answer(next, random, 1, 'chooseGift', { tile: null });
	assert.deepEqual(types(next, before), ['noExplore']);
	assert.deepEqual(questions(next), []);
	// With nothing to draw and nothing held, no gift is offered.
	const bare = structuredClone(sailing);
	bare.supply.territory = [];
	next = resolveEffects(bare, 1, [{ explore: {} }], random);
	assert.deepEqual(questions(next), []);
	assert.equal(eventsOf(next, 'noExplore').length, 1);
	// Nor without an opponent to give to.
	const solo = startedGame(1);
	const alone = resolveTapestry(solo.state, solo.random, 1, 'age-of-sail');
	alone.supply.territory = [3];
	next = resolveEffects(alone, 1, [{ explore: {} }], solo.random);
	assert.deepEqual(next.seats[0].territoryTiles, [3]);
	assert.ok(!questions(next).some((d) => d.kind === 'chooseGift'));
});

test('Exploitation offers the benefit twice instead of the matching-side VP', () => {
	const { state, random } = game();
	state.seats[0].territoryTiles = [2];
	const exploiting = resolveTapestry(state, random, 1, 'exploitation');
	let next = resolveEffects(exploiting, 1, [{ explore: {} }], random);
	const vp = next.seats[0].vp;
	// Tile 2 there scores 3 matching sides, and its benefit is 2 territory tiles.
	next = answer(next, random, 1, 'chooseExplore', {
		tile: 2,
		hex: '-3_-2',
		orient: 0,
	});
	assert.equal(next.seats[0].vp, vp);
	const choice = open(next, 'chooseOption');
	assert.deepEqual(
		{
			options: choice.options,
			purpose: choice.purpose,
			source: choice.source,
		},
		{
			options: [
				[{ vp: 3 }, { gain: { territory: 2 } }],
				[{ gain: { territory: 2 } }, { gain: { territory: 2 } }],
			],
			purpose: 'exploitation',
			source: { hex: '-3_-2' },
		}
	);
	const twice = answer(next, random, 1, 'chooseOption', { option: 1 });
	assert.equal(twice.seats[0].vp, vp);
	assert.equal(twice.seats[0].territoryTiles.length, 4);
	const usual = answer(next, random, 1, 'chooseOption', { option: 0 });
	assert.equal(usual.seats[0].vp, vp + 3);
	assert.equal(usual.seats[0].territoryTiles.length, 2);
});

test('Exploitation never applies to space tiles', () => {
	const { state, random } = game();
	// Space tile 5: 1 coin, 1 worker and 8 VP.
	state.seats[0].spaceTiles = [5];
	const exploiting = resolveTapestry(state, random, 1, 'exploitation');
	const next = resolveEffects(exploiting, 1, [{ exploreSpace: {} }], random);
	assert.deepEqual(questions(next), []);
	assert.equal(next.seats[0].vp, exploiting.seats[0].vp + 8);
	assert.equal(
		next.seats[0].resources.coin,
		exploiting.seats[0].resources.coin + 1
	);
});

test('Militarism may put an outpost on the explored hex, which the player then controls, without dice or an achievement', () => {
	const { state, random } = game();
	state.seats[0].territoryTiles = [2];
	const militant = resolveTapestry(state, random, 1, 'militarism');
	let next = resolveEffects(militant, 1, [{ explore: {} }], random);
	const vp = next.seats[0].vp;
	next = answer(next, random, 1, 'chooseExplore', {
		tile: 2,
		hex: '-3_-2',
		orient: 0,
	});
	// The matching-side VP come at once; the outpost is offered before the tile's benefit.
	assert.equal(next.seats[0].vp, vp + 3);
	assert.equal(next.seats[0].territoryTiles.length, 0);
	const choice = open(next, 'chooseOption');
	assert.deepEqual(
		[choice.options, choice.purpose],
		[[[], [{ placeOutpost: { hex: '-3_-2' } }]], 'militarism']
	);
	const outposts = next.seats[0].outposts;
	const before = next.events.length;
	const placed = answer(next, random, 1, 'chooseOption', { option: 1 });
	assert.deepEqual(placed.hexes['-3_-2'].outposts, [
		{ seat: 1, toppled: false },
	]);
	assert.equal(placed.seats[0].outposts, outposts - 1);
	assert.ok(controlledTerritories(placed, 1).includes('-3_-2'));
	assert.deepEqual(
		types(placed, before).filter((t) => t !== 'resourcesGained'),
		['outpostPlaced', 'tilesGained']
	);
	assert.deepEqual(eventsOf(placed, 'outpostPlaced', before), [
		{ type: 'outpostPlaced', player: 1, hex: '-3_-2', militarism: true },
	]);
	assert.deepEqual(questions(placed), []);
	// Declining places nothing; the benefit still comes.
	const declined = answer(next, random, 1, 'chooseOption', { option: 0 });
	assert.deepEqual(declined.hexes['-3_-2'].outposts, []);
	assert.equal(declined.seats[0].territoryTiles.length, 2);
	// With no outpost left, nothing is offered.
	const spent = structuredClone(militant);
	spent.seats[0].outposts = 0;
	next = resolveEffects(spent, 1, [{ explore: {} }], random);
	next = answer(next, random, 1, 'chooseExplore', {
		tile: 2,
		hex: '-3_-2',
		orient: 0,
	});
	assert.deepEqual(questions(next), []);
});

test('Pillage and Plunder skips the response and gives both dice against an opponent', () => {
	const state = conquerGame(['trap-1']);
	const plundering = resolveTapestry(
		state,
		face(0),
		1,
		'pillage-and-plunder'
	);
	const { coin } = plundering.seats[0].resources;
	const next = resolveEffects(plundering, 1, [{ conquer: {} }], face(0));
	// Face 0 of each die: 1 coin (black) and 4 VP (red), both without a choice.
	assert.deepEqual(questions(next), []);
	assert.equal(next.seats[0].resources.coin, coin + 1);
	assert.equal(next.seats[0].vp, plundering.seats[0].vp + 4);
	assert.deepEqual(next.seats[1].hand, ['trap-1']);
	assert.deepEqual(next.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	]);
	// An empty territory has no opponent: one die, as usual.
	const empty = structuredClone(plundering);
	empty.hexes['-2_-1'].outposts = [];
	const alone = resolveEffects(empty, 1, [{ conquer: {} }], face(0));
	assert.deepEqual(
		questions(alone).map((d) => d.kind),
		['chooseDie']
	);
});

test("Pirate Rule adds the tile's benefit after the dice, even after a trap", () => {
	const state = conquerGame(['trap-1']);
	// Tile 1's benefit is 1 coin.
	state.hexes['-2_-1'].tile = 1;
	const pirate = resolveTapestry(state, face(0), 1, 'pirate-rule');
	const { coin } = pirate.seats[0].resources;
	let next = resolveEffects(pirate, 1, [{ conquer: {} }], face(0));
	next = answer(next, face(0), 2, 'chooseResponse', { card: 'trap-1' });
	next = answer(next, face(0), 2, 'chooseResource', {
		resources: { food: 1 },
	});
	assert.equal(eventsOf(next, 'conquered').at(-1).trapped, true);
	const before = next.events.length;
	next = answer(next, face(0), 1, 'chooseDie', { die: 'red' });
	assert.deepEqual(
		types(next, before).filter((t) => t !== 'resourcesGained'),
		['vpGained', 'tileBenefit']
	);
	assert.equal(eventsOf(next, 'tileBenefit', before)[0].tile, 1);
	assert.equal(next.seats[0].resources.coin, coin + 1);
	assert.deepEqual(questions(next), []);
});

test('Pirate Rule gives nothing for a printed territory', () => {
	const state = conquerGame([]);
	const pirate = resolveTapestry(state, face(0), 1, 'pirate-rule');
	let next = resolveEffects(pirate, 1, [{ conquer: {} }], face(0));
	const resources = { ...next.seats[0].resources };
	next = answer(next, face(0), 1, 'chooseDie', { die: 'red' });
	assert.deepEqual(eventsOf(next, 'tileBenefit'), [
		{ type: 'tileBenefit', player: 1, hex: '-2_-1', tile: null },
	]);
	assert.deepEqual(next.seats[0].resources, resources);
	assert.deepEqual(questions(next), []);
});

test("Alliance asks for an opponent; that opponent's upgrades give the holder the same benefit after them, without Golden Age VP", () => {
	const { state, random } = game(3);
	let next = resolveTapestry(state, random, 1, 'alliance');
	const partner = open(next, 'choosePartner');
	assert.deepEqual(DECISIONS.choosePartner.answers(next, partner), [
		{ player: 2 },
		{ player: 3 },
	]);
	assert.throws(
		() => answer(next, random, 1, 'choosePartner', { player: 1 }),
		/Choose one of the opponents offered\./
	);
	next = answer(next, random, 1, 'choosePartner', { player: 3 });
	assert.deepEqual(next.seats[0].era, {
		card: 'alliance',
		ability: 'alliance',
		opponent: 3,
	});
	assert.deepEqual(eventsOf(next, 'partnerChosen'), [
		{ type: 'partnerChosen', player: 1, opponent: 3 },
	]);
	// Irrigation's circle is 1 food. Seat 3 upgrades under Golden Age, which scores only its own upgrades.
	for (const seat of next.seats) {
		seat.tech.bottom = ['irrigation'];
	}
	next.seats[2].era = { card: 'golden-age', ability: 'golden-age' };
	const before = next.events.length;
	const upgraded = resolveEffects(next, 3, [{ upgrade: {} }], random);
	assert.deepEqual(
		eventsOf(upgraded, 'resourcesGained', before).map((e) => [
			e.player,
			e.gained,
		]),
		[
			[3, { food: 1 }],
			[1, { food: 1 }],
		]
	);
	// The holder gains the benefit, not an upgrade: its cards stay put and it scores nothing for it.
	assert.deepEqual(
		eventsOf(upgraded, 'techUpgraded', before).map((e) => e.player),
		[3]
	);
	assert.deepEqual(upgraded.seats[0].tech.bottom, ['irrigation']);
	assert.equal(upgraded.seats[0].vp, next.seats[0].vp);
	// Only the named opponent's upgrades count, and only for the holder.
	for (const seat of [2, 1]) {
		const other = resolveEffects(next, seat, [{ upgrade: {} }], random);
		assert.deepEqual(
			eventsOf(other, 'resourcesGained', before).map((e) => e.player),
			[seat]
		);
	}
	// With one opponent, it is named without asking.
	const pair = game(2);
	const two = resolveTapestry(pair.state, pair.random, 1, 'alliance');
	assert.deepEqual(questions(two), []);
	assert.equal(two.seats[0].era.opponent, 2);
});

test("allies cannot conquer each other's territories", () => {
	const state = conquerGame([]);
	const random = face(0);
	// Without the Alliance, each could conquer the other.
	assert.deepEqual(
		questions(resolveEffects(state, 1, [{ conquer: {} }], random)).map(
			(d) => d.kind
		),
		['chooseDie']
	);
	const allied = resolveTapestry(state, random, 1, 'alliance');
	assert.equal(allied.seats[0].era.opponent, 2);
	for (const [seat, hex] of [
		[1, '-2_-1'],
		[2, '-2_-2'],
	]) {
		const before = allied.events.length;
		const next = resolveEffects(allied, seat, [{ conquer: {} }], random);
		assert.deepEqual(types(next, before), ['noConquer'], hex);
		assert.deepEqual(next.hexes[hex], allied.hexes[hex]);
	}
});

test('placeOutpost with an empty supply places nothing and says so', () => {
	const { state, random } = game();
	state.seats[0].outposts = 0;
	const before = state.events.length;
	const next = resolveEffects(
		state,
		1,
		[{ placeOutpost: { hex: '-3_-2' } }],
		random
	);
	assert.equal(next.seats[0].outposts, 0);
	assert.deepEqual(next.hexes['-3_-2'].outposts, []);
	assert.deepEqual(eventsOf(next, 'noOutpost', before), [
		{ type: 'noOutpost', player: 1 },
	]);
	assert.deepEqual(eventsOf(next, 'outpostPlaced', before), []);
});
