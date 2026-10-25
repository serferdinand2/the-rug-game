// Tests for the map items and the engine hooks civilizations need: tokens and Nomads pieces on hexes, takeOutpost, jumps, noBonus, offTrackVp and Inventors upgrades (#20, design §8, §9).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, contextFor, resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { moveToken } from '../src/lib/engine/movement.js';
import { upgradeCard } from '../src/lib/engine/effects/tech.js';
import { takeOutpost } from '../src/lib/engine/outposts.js';
import { conquerTargets, loneOpponent } from '../src/lib/engine/map.js';
import { controlledTerritories } from '../src/lib/engine/control.js';
import { toppledBy } from '../src/lib/engine/achievements.js';
import { countVp, landmarksOwned } from '../src/lib/engine/effects/vp.js';
import { cityPlots } from '../src/lib/engine/city.js';
import { groupsOf } from '../src/lib/capital.js';
import { CIVS } from '../src/lib/engine/civs/index.js';
import { startedGame, answer, placeAll } from './helpers/engine.mjs';

/**
 * A small-map game with every outpost cleared, where seat 1 controls '-2_-2'. Only '-2_-2' and the listed hexes
 * stay explored (all printed territories), so the conquer targets are known.
 * @param {number} [count]
 * @param {string[]} [explored]
 * @returns {{ state: any, random: any }}
 */
function game(count = 2, explored = ['-2_-1']) {
	const { state: started, random } = startedGame(count);
	const state = structuredClone(started);
	for (const [key, hex] of Object.entries(state.hexes)) {
		hex.outposts = [];
		if (key !== '-2_-2' && !explored.includes(key)) {
			/** @type {any} */ (hex).tile = null;
		}
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	return { state, random };
}

/**
 * Gives seats a test civilization, registered until the test ends, whose hooks record each payload they get.
 * @param {import('node:test').TestContext} t
 * @param {any} state
 * @param {number[]} seats - The seats that hold it
 * @param {string[]} hooks
 * @param {(owner: number, hook: string, payload: any) => any[]} [reply] - The operations each hook returns
 * @returns {{ hook: string, owner: number, payload: any }[]}
 */
function watch(t, state, seats, hooks, reply = () => []) {
	/** @type {{ hook: string, owner: number, payload: any }[]} */
	const calls = [];
	const saved = CIVS.watcher;
	CIVS.watcher = {
		id: 'watcher',
		hooks: Object.fromEntries(
			hooks.map((hook) => [
				hook,
				(
					/** @type {any} */ _state,
					/** @type {number} */ owner,
					/** @type {any} */ payload
				) => {
					calls.push({
						hook,
						owner,
						payload: structuredClone(payload),
					});
					return reply(owner, hook, payload);
				},
			])
		),
	};
	t.after(() => {
		if (saved) {
			CIVS.watcher = saved;
		} else {
			delete CIVS.watcher;
		}
	});
	for (const seat of seats) {
		state.seats[seat - 1].civs = ['watcher'];
	}
	return calls;
}

/** A random that gives every roll the same face. */
const face = (/** @type {number} */ n) => () => n;

/** The kinds of the open decisions, without the waiting turn choice. */
const open = (/** @type {any} */ state) =>
	openDecisions(state)
		.map((d) => d.kind)
		.filter((k) => k !== 'chooseTurn');

/** The event types after index `from`. */
const typesSince = (/** @type {any} */ state, /** @type {number} */ from) =>
	state.events.slice(from).map((/** @type {any} */ e) => e.type);

/**
 * Answers a player's open decision of a kind with its first answer.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {string} kind
 */
function answerFirst(state, random, player, kind) {
	const decision = openDecisions(state).find(
		(d) => d.kind === kind && d.player === player
	);
	if (!decision) {
		throw new Error(`Seat ${player} has no open ${kind}.`);
	}
	const [first] = DECISIONS[kind].answers(state, decision);
	return play(state, player, { decision: decision.id, ...first }, random);
}

/**
 * The seats each countsChanged was fired for, in order.
 * @param {{ hook: string, payload: any }[]} calls
 */
const counted = (calls) =>
	calls
		.filter((c) => c.hook === 'countsChanged')
		.map((c) => c.payload.player);

test('a hex with an outpost and a token cannot be conquered', () => {
	const { state, random } = game();
	state.hexes['-2_-1'].outposts = [{ seat: 2, toppled: false }];
	assert.deepEqual(conquerTargets(state, 1, false), ['-2_-1']);
	// The token may be anyone's, the attacker's own included.
	for (const seat of [1, 2]) {
		state.hexes['-2_-1'].tokens = [{ seat, civ: 'traders' }];
		assert.deepEqual(conquerTargets(state, 1, false), []);
		assert.deepEqual(conquerTargets(state, 1, true), []);
		assert.equal(loneOpponent(state, '-2_-1', 1), null);
		const next = resolveEffects(state, 1, [{ conquer: {} }], random);
		assert.equal(next.events.at(-1).type, 'noConquer');
		assert.deepEqual(next.hexes['-2_-1'].outposts, [
			{ seat: 2, toppled: false },
		]);
	}
	// Two tokens are two items too.
	state.hexes['-2_-1'].outposts = [];
	state.hexes['-2_-1'].tokens = [
		{ seat: 2, civ: 'traders' },
		{ seat: 2, civ: 'isolationists' },
	];
	assert.deepEqual(conquerTargets(state, 1, true), []);
});

test('a hex with only a token can be conquered and nothing topples', () => {
	const { state } = game();
	state.hexes['-2_-1'].tokens = [{ seat: 2, civ: 'traders' }];
	state.seats[1].hand = ['trap-1'];
	assert.deepEqual(conquerTargets(state, 1, false), ['-2_-1']);
	assert.equal(loneOpponent(state, '-2_-1', 1), null);
	const next = resolveEffects(state, 1, [{ conquer: {} }], face(0));
	assert.deepEqual(next.hexes['-2_-1'].outposts, [
		{ seat: 1, toppled: false },
	]);
	assert.deepEqual(next.hexes['-2_-1'].tokens, [{ seat: 2, civ: 'traders' }]);
	assert.ok(controlledTerritories(next, 1).includes('-2_-1'));
	// No opponent controlled it: nothing topples, and the token's owner is asked for no response.
	assert.ok(!next.events.some((e) => e.type === 'outpostToppled'));
	assert.deepEqual(open(next), ['chooseDie']);
	assert.equal(
		next.events.find((e) => e.type === 'conquered').trapped,
		false
	);
});

test('a Nomads piece gives control and topples like an outpost, but never counts toward topple two', () => {
	const { state, random } = game(2, ['-2_-1', '-1_-2']);
	state.hexes['-2_-1'].outposts = [
		{ seat: 2, toppled: false, piece: { building: 'farm' } },
	];
	// Seat 1 has already toppled one opponent outpost, still toppled.
	state.hexes['-1_-2'].outposts = [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	];
	assert.deepEqual(controlledTerritories(state, 2), ['-2_-1']);
	assert.equal(loneOpponent(state, '-2_-1', 1), 2);
	assert.equal(toppledBy(state, 1), 1);
	const before = state.events.length;
	const next = resolveEffects(state, 1, [{ conquer: {} }], face(0));
	assert.deepEqual(next.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: true, toppledBy: 1, piece: { building: 'farm' } },
		{ seat: 1, toppled: false },
	]);
	assert.ok(
		next.events
			.slice(before)
			.some(
				(e) =>
					e.type === 'outpostToppled' &&
					e.player === 2 &&
					e.hex === '-2_-1' &&
					e.by === 1
			)
	);
	assert.deepEqual(controlledTerritories(next, 2), []);
	assert.ok(controlledTerritories(next, 1).includes('-2_-1'));
	// The piece never came from the supply, and doesn't count as a toppled outpost.
	assert.equal(next.seats[1].outposts, state.seats[1].outposts);
	assert.equal(toppledBy(next, 1), 1);
	assert.ok(!typesSince(next, before).includes('achievementClaimed'));
	// An outpost in its place would have made two.
	const outpost = structuredClone(state);
	outpost.hexes['-2_-1'].outposts = [{ seat: 2, toppled: false }];
	const two = resolveEffects(outpost, 1, [{ conquer: {} }], face(0));
	assert.ok(
		two.events.some(
			(e) =>
				e.type === 'achievementClaimed' &&
				e.player === 1 &&
				e.achievement === 'topple-two'
		)
	);
	// Revolution offers only a hex with a toppled outpost, never one with only a toppled piece: '-1_-2' is taken at once.
	const revolution = resolveEffects(next, 2, [{ revolution: {} }], random);
	assert.deepEqual(
		revolution.hexes['-2_-1'].outposts,
		next.hexes['-2_-1'].outposts
	);
	assert.deepEqual(revolution.hexes['-1_-2'].outposts, [
		{ seat: 2, toppled: false },
		{ seat: 1, toppled: true, toppledBy: 2 },
	]);
	// A revolt raises no piece and topples none.
	const mixed = structuredClone(state);
	mixed.pending.length = 0;
	mixed.hexes['-1_-2'].outposts = [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 2, toppled: true, toppledBy: 1, piece: { building: 'farm' } },
		{ seat: 1, toppled: false },
		{ seat: 1, toppled: false, piece: { landmark: 'lighthouse' } },
	];
	push(mixed, mixed.pending, [
		{ player: 2, kind: 'revolt', hex: '-1_-2', left: 0 },
	]);
	run(mixed, random);
	assert.deepEqual(mixed.hexes['-1_-2'].outposts, [
		{ seat: 2, toppled: false },
		{ seat: 2, toppled: true, toppledBy: 1, piece: { building: 'farm' } },
		{ seat: 1, toppled: true, toppledBy: 2 },
		{ seat: 1, toppled: false, piece: { landmark: 'lighthouse' } },
	]);
});

test('landmarks on the map count as owned (R71)', () => {
	const { state } = game(3);
	const me = state.seats[0];
	me.capital.landmarks = [
		{ landmark: 'apothecary', row: 0, col: 0, rotation: 0 },
	];
	me.besideMat = ['farm', 'academy'];
	state.hexes['-2_-1'].outposts = [
		{ seat: 1, toppled: false, piece: { landmark: 'lighthouse' } },
	];
	// A toppled piece is still the player's.
	state.hexes['-1_-2'].outposts = [
		{
			seat: 1,
			toppled: true,
			toppledBy: 2,
			piece: { landmark: 'train-station' },
		},
		{ seat: 2, toppled: false },
	];
	state.hexes['0_0'].outposts = [
		{ seat: 1, toppled: false, piece: { building: 'house' } },
		{ seat: 2, toppled: false, piece: { landmark: 'launch-pad' } },
	];
	assert.deepEqual(landmarksOwned(state, 1).sort(), [
		'academy',
		'apothecary',
		'lighthouse',
		'train-station',
	]);
	assert.equal(countVp(state, 1, 'landmark'), 4);
	assert.deepEqual(landmarksOwned(state, 2), ['launch-pad']);
	assert.deepEqual(landmarksOwned(state, 3), []);
});

test('takeOutpost fires outpostTaken', (t) => {
	const { state, random } = game();
	const calls = watch(t, state, [2], ['outpostTaken'], (owner) => [
		{ player: owner, kind: 'effects', effects: [{ vp: 1 }] },
	]);
	const direct = structuredClone(state);
	takeOutpost(contextFor(direct, random, direct.pending), 1);
	assert.equal(direct.seats[0].outposts, state.seats[0].outposts - 1);
	assert.deepEqual(calls, [
		{ hook: 'outpostTaken', owner: 2, payload: { player: 1 } },
	]);
	// The hook's operation is pushed, marked passive like every civilization operation.
	assert.deepEqual(
		[
			direct.pending[0].player,
			direct.pending[0].kind,
			direct.pending[0].passive,
		],
		[2, 'effects', true]
	);
	// Conquering and Militarism's outpost both take theirs through it.
	calls.length = 0;
	const conquered = resolveEffects(state, 1, [{ conquer: {} }], face(0));
	assert.equal(conquered.seats[0].outposts, state.seats[0].outposts - 1);
	const placed = resolveEffects(
		state,
		1,
		[{ placeOutpost: { hex: '-2_-1' } }],
		random
	);
	assert.equal(placed.seats[0].outposts, state.seats[0].outposts - 1);
	assert.deepEqual(
		calls.map((c) => [c.hook, c.owner, c.payload]),
		[
			['outpostTaken', 2, { player: 1 }],
			['outpostTaken', 2, { player: 1 }],
		]
	);
	assert.equal(placed.seats[1].vp, state.seats[1].vp + 1);
});

test('countsChanged fires at each check point', (t) => {
	const { state: base, random } = game();
	const calls = watch(t, base, [1], ['countsChanged']);
	const copy = () => structuredClone(base);

	// Inventing a card.
	let next = resolveEffects(copy(), 1, [{ invent: {} }], random);
	assert.deepEqual(counted(calls), []);
	next = answerFirst(next, random, 1, 'chooseInvent');
	assert.deepEqual(counted(calls), [1]);

	// Upgrading a card.
	calls.length = 0;
	let state = copy();
	state.seats[0].tech.bottom = ['irrigation'];
	resolveEffects(state, 1, [{ upgrade: {} }], random);
	assert.deepEqual(counted(calls), [1]);

	// Placing a piece in the capital.
	calls.length = 0;
	next = resolveEffects(copy(), 1, [{ building: 'farm' }], random);
	assert.deepEqual(counted(calls), []);
	placeAll(next, random);
	assert.deepEqual(counted(calls), [1]);

	// A conquest: once, when it ends.
	calls.length = 0;
	next = resolveEffects(copy(), 1, [{ conquer: {} }], face(0));
	assert.deepEqual(counted(calls), [1]);

	// A trap: for the defender, then the attacker's conquest ends.
	calls.length = 0;
	state = copy();
	state.hexes['-2_-1'].outposts = [{ seat: 2, toppled: false }];
	state.seats[1].hand = ['trap-1'];
	next = resolveEffects(state, 1, [{ conquer: {} }], face(0));
	assert.deepEqual(counted(calls), []);
	next = answer(next, face(0), 2, 'chooseResponse', { card: 'trap-1' });
	assert.deepEqual(counted(calls), [2]);
	next = answerFirst(next, face(0), 2, 'chooseResource');
	assert.deepEqual(counted(calls), [2, 1]);

	// A Revolution hex.
	calls.length = 0;
	state = copy();
	state.hexes['-2_-1'].outposts = [
		{ seat: 1, toppled: true, toppledBy: 2 },
		{ seat: 2, toppled: false },
	];
	resolveEffects(state, 1, [{ revolution: {} }], random);
	assert.deepEqual(counted(calls), [1]);

	// Militarism's outpost.
	calls.length = 0;
	resolveEffects(copy(), 1, [{ placeOutpost: { hex: '-2_-1' } }], random);
	assert.deepEqual(counted(calls), [1]);

	// A token reaching space 12, and not one stopping short of it.
	calls.length = 0;
	state = copy();
	state.seats[0].tracks.science = [10];
	moveToken(contextFor(state, random, state.pending), 1, {
		track: 'science',
		from: 10,
		to: 11,
		benefit: false,
	});
	assert.deepEqual(counted(calls), []);
	moveToken(contextFor(state, random, state.pending), 1, {
		track: 'science',
		from: 11,
		to: 12,
		benefit: false,
	});
	assert.deepEqual(counted(calls), [1]);
});

test('dieKept names the face not kept', (t) => {
	const { state } = game();
	const calls = watch(t, state, [2], ['dieKept'], (owner) => [
		{ player: owner, kind: 'effects', effects: [{ vp: 1 }] },
	]);
	const rolled = resolveEffects(state, 1, [{ conquer: {} }], face(0));
	assert.deepEqual(calls, []);
	// Face 0 of each die: 4 VP on the red one, 1 coin on the black one.
	const before = rolled.events.length;
	const red = answer(rolled, face(0), 1, 'chooseDie', { die: 'red' });
	assert.deepEqual(calls, [
		{
			hook: 'dieKept',
			owner: 2,
			payload: { player: 1, hex: '-2_-1', other: { gain: { coin: 1 } } },
		},
	]);
	// The kept face comes first.
	assert.deepEqual(
		red.events
			.slice(before)
			.filter((e) => e.type === 'vpGained')
			.map((e) => [e.player, e.vp]),
		[
			[1, 4],
			[2, 1],
		]
	);
	calls.length = 0;
	answer(rolled, face(0), 1, 'chooseDie', { die: 'black' });
	assert.deepEqual(
		calls.map((c) => c.payload),
		[{ player: 1, hex: '-2_-1', other: { vp: 4 } }]
	);
	// With both dice, no face is left.
	calls.length = 0;
	resolveEffects(state, 1, [{ conquer: { bothDice: 'always' } }], face(0));
	assert.deepEqual(calls, []);
});

test('districtsCompleted fires after the district reward', (t) => {
	const { state, random } = game();
	const seat = state.seats[0];
	// Fill district 0 but for one plot.
	const plots = cityPlots(seat);
	const [last, ...rest] = groupsOf('districts')[0].filter(
		(p) => plots[p] === 'empty'
	);
	for (const p of rest) {
		seat.capital.buildings.push({
			building: 'house',
			row: Math.floor(p / 9),
			col: p % 9,
		});
	}
	const calls = watch(t, state, [1], ['districtsCompleted'], (owner) => [
		{ player: owner, kind: 'effects', effects: [{ vp: 7 }] },
	]);
	const gained = resolveEffects(state, 1, [{ building: 'farm' }], random);
	// A plot outside the district completes none.
	const elsewhere = cityPlots(seat).findIndex(
		(kind, p) => kind === 'empty' && !groupsOf('districts')[0].includes(p)
	);
	answer(gained, random, 1, 'choosePlacement', {
		row: Math.floor(elsewhere / 9),
		col: elsewhere % 9,
	});
	assert.deepEqual(calls, []);
	let next = answer(gained, random, 1, 'choosePlacement', {
		row: Math.floor(last / 9),
		col: last % 9,
	});
	assert.deepEqual(
		calls.map((c) => [c.owner, c.payload]),
		[[1, { player: 1, districts: [0] }]]
	);
	// The reward asks first; the trigger's operation waits below it.
	assert.deepEqual(open(next), ['chooseResource']);
	assert.equal(next.seats[0].vp, state.seats[0].vp);
	next = answerFirst(next, random, 1, 'chooseResource');
	assert.equal(next.seats[0].vp, state.seats[0].vp + 7);
});

test('a jump gains no landmark and fires no advanced trigger but claims complete any track', (t) => {
	const { state, random } = game();
	const calls = watch(
		t,
		state,
		[1],
		['advanced', 'landmarkGained', 'countsChanged']
	);
	state.seats[0].tracks.science = [2];
	const landmarks = [...state.landmarks];
	const before = state.events.length;
	// Past space 4's landmark, and with `benefit` set: a jump still gains neither.
	moveToken(contextFor(state, random, state.pending), 1, {
		track: 'science',
		from: 2,
		to: 6,
		benefit: true,
		jump: true,
	});
	run(state, random);
	assert.deepEqual(state.seats[0].tracks.science, [6]);
	assert.deepEqual(state.landmarks, landmarks);
	assert.deepEqual(typesSince(state, before), ['tokenMoved']);
	assert.deepEqual(open(state), []);
	assert.deepEqual(calls, []);
	// Space 12 still claims "complete any track", and the counts are checked.
	const vp = state.seats[0].vp;
	const at = state.events.length;
	moveToken(contextFor(state, random, state.pending), 1, {
		track: 'science',
		from: 6,
		to: 12,
		benefit: false,
		jump: true,
	});
	run(state, random);
	assert.deepEqual(typesSince(state, at), [
		'tokenMoved',
		'achievementClaimed',
		'vpGained',
	]);
	assert.ok(state.seats[0].vp > vp);
	assert.deepEqual(
		calls.map((c) => c.hook),
		['countsChanged']
	);
});

test('noBonus gives the benefit without the bonus', () => {
	const { state, random } = game();
	const me = state.seats[0];
	me.tracks.science = [1];
	me.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	// Science space 2 gives 1 tapestry card; its bonus pays 1 resource for a house.
	const plain = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['science'] } }],
		random
	);
	assert.deepEqual(open(plain), ['chooseBonus']);
	const next = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['science'], noBonus: true } }],
		random
	);
	assert.deepEqual(next.seats[0].tracks.science, [2]);
	assert.equal(next.seats[0].hand.length, me.hand.length + 1);
	assert.deepEqual(open(next), []);
	// A move the player chooses carries it.
	const asked = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['science'], noBonus: true, optional: true } }],
		random
	);
	const move = openDecisions(asked).find((d) => d.kind === 'chooseMove');
	assert.equal(move?.noBonus, true);
	const moved = answer(asked, random, 1, 'chooseMove', {
		track: 'science',
		from: 1,
	});
	assert.equal(moved.seats[0].hand.length, me.hand.length + 1);
	assert.deepEqual(open(moved), []);
});

test('offTrackVp scores when every token is on 12', () => {
	const { state, random } = game();
	const vp = state.seats[0].vp;
	const alchemy = {
		tracks: ['science'],
		noBenefit: true,
		optional: true,
		offTrackVp: 5,
	};
	state.seats[0].tracks.science = [12];
	const full = resolveEffects(state, 1, [{ advance: alchemy }], random);
	assert.equal(full.seats[0].vp, vp + 5);
	assert.deepEqual(open(full), []);
	// Without it, a token on 12 gives nothing.
	const plain = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['science'] } }],
		random
	);
	assert.equal(plain.seats[0].vp, vp);
	// A token that can still advance is offered the move instead.
	state.seats[0].tracks.science = [12, 3];
	const behind = resolveEffects(state, 1, [{ advance: alchemy }], random);
	assert.equal(behind.seats[0].vp, vp);
	assert.deepEqual(open(behind), ['chooseMove']);
	// A blocked track gives nothing.
	state.seats[0].tracks.science = [12];
	state.blocks = [{ player: 2, track: 'science' }];
	const blocked = resolveEffects(state, 1, [{ advance: alchemy }], random);
	assert.equal(blocked.seats[0].vp, vp);
});

test('an Inventors upgrade names its Inventors seat and gives no Golden Age VP', (t) => {
	const { state, random } = game();
	const calls = watch(t, state, [2], ['upgraded']);
	state.seats[0].era = { card: 'golden-age', ability: 'golden-age' };
	state.seats[0].tech.bottom = ['irrigation'];
	const { vp } = state.seats[0];
	const { food } = state.seats[0].resources;
	const invented = structuredClone(state);
	upgradeCard(
		contextFor(invented, random, invented.pending),
		1,
		'irrigation',
		2
	);
	run(invented, random);
	assert.deepEqual(invented.seats[0].tech.middle, ['irrigation']);
	// Irrigation's circle is 1 food.
	assert.equal(invented.seats[0].resources.food, food + 1);
	assert.equal(invented.seats[0].vp, vp);
	assert.deepEqual(
		calls.map((c) => c.payload),
		[{ player: 1, card: 'irrigation', icon: 'circle', inventors: 2 }]
	);
	// The player's own upgrade still scores Golden Age, and names no Inventors seat.
	calls.length = 0;
	const own = structuredClone(state);
	upgradeCard(contextFor(own, random, own.pending), 1, 'irrigation');
	run(own, random);
	assert.equal(own.seats[0].vp, vp + 3);
	assert.deepEqual(
		calls.map((c) => c.payload),
		[{ player: 1, card: 'irrigation', icon: 'circle' }]
	);
});
