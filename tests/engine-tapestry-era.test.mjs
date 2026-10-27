// Tests for the THIS ERA tapestry cards (#19, design §8).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { contextFor, run, resolveEffects } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { moveToken } from '../src/lib/engine/movement.js';
import { upgradable } from '../src/lib/engine/tech.js';
import { advanceBlocked } from '../src/lib/engine/abilities.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import {
	buildingProblem,
	buildingSpots,
	landmarkProblem,
	landmarkSpots,
} from '../src/lib/engine/city.js';
import {
	startedGame,
	answer,
	placeAll,
	resolveTapestry,
} from './helpers/engine.mjs';

/**
 * A started game for `count` players, copied so a test may change it.
 * @param {number} [count]
 */
function game(count = 2) {
	const { state, random } = startedGame(count);
	return { state: structuredClone(state), random };
}

/**
 * Gives a seat an active THIS ERA ability.
 * @param {any} state
 * @param {number} player
 * @param {string} card
 */
function withEra(state, player, card) {
	state.seats[player - 1].era = { card, ability: card };
}

/**
 * A random that returns the given numbers in turn.
 * @param {...number} values
 */
function rolls(...values) {
	return (/** @type {number} */ n) => {
		const value = values.shift();
		if (value === undefined || value >= n) {
			throw new Error(`No roll left for random(${n}).`);
		}
		return value;
	};
}

/**
 * The events of one type, without their numbers.
 * @param {any} state
 * @param {string} type
 */
const eventsOf = (state, type) =>
	state.events
		.filter((/** @type {any} */ e) => e.type === type)
		.map(({ seq: _seq, ...e }) => e);

/** @param {any} state @param {string} kind */
const open = (state, kind) =>
	/** @type {any} */ (openDecisions(state).find((d) => d.kind === kind));

/**
 * Moves a seat's token from one space to another, as an advance would, and runs what follows.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {string} track
 * @param {number} from
 * @param {number} to
 */
function jump(state, random, player, track, from, to) {
	const next = structuredClone(state);
	next.seats[player - 1].tracks[track] = [from];
	moveToken(contextFor(next, random, next.pending), player, {
		track,
		from,
		to,
		benefit: false,
	});
	run(next, random);
	return placeAll(next, random);
}

test('Academia scores 3 VP per tech card invented and per tapestry card gained', () => {
	const { state, random } = game();
	withEra(state, 1, 'academia');
	const invented = resolveEffects(state, 1, [{ invent: {} }], random);
	const done = answer(invented, random, 1, 'chooseInvent', { card: 'deck' });
	assert.equal(done.seats[0].vp, state.seats[0].vp + 3);
	// Democracy gains 3 cards: 9 VP, before its discard question.
	const democracy = resolveTapestry(state, random, 1, 'democracy');
	assert.equal(democracy.seats[0].vp, state.seats[0].vp + 9);
	// Only the holder's own gains count.
	const other = resolveEffects(state, 2, [{ gain: { tapestry: 2 } }], random);
	assert.equal(other.seats[0].vp, state.seats[0].vp);
});

test("Industrialism gains each invented card's circle and leaves it in the bottom row", () => {
	const { state, random } = game();
	withEra(state, 1, 'industrialism');
	state.supply.tech.faceUp = ['irrigation', ...state.supply.tech.faceUp];
	const next = answer(
		resolveEffects(state, 1, [{ invent: {} }], random),
		random,
		1,
		'chooseInvent',
		{ card: 'irrigation' }
	);
	assert.deepEqual(next.seats[0].tech.bottom, ['irrigation']);
	assert.deepEqual(
		eventsOf(next, 'resourcesGained').map((e) => [e.player, e.gained]),
		[[1, { food: 1 }]]
	);
});

test('Industrialism with Steam Tycoon pays the circle twice', () => {
	const { state, random } = game();
	withEra(state, 1, 'industrialism');
	state.supply.tech.faceUp = ['irrigation', ...state.supply.tech.faceUp];
	// Steam Tycoon is played in era 2, so Industrialism is not its era card: set it after.
	const played = resolveTapestry(state, random, 1, 'steam-tycoon', 3);
	withEra(played, 1, 'industrialism');
	const next = answer(played, random, 1, 'chooseInvent', {
		card: 'irrigation',
	});
	assert.deepEqual(
		eventsOf(next, 'resourcesGained')
			.filter((e) => e.player === 1)
			.map((e) => e.gained),
		[{ food: 1 }, { food: 1 }]
	);
});

test('Golden Age ignores prerequisites and scores 3 VP for every upgrade', () => {
	const { state, random } = game();
	state.seats[0].tech = {
		bottom: ['irrigation'],
		middle: ['ammonia'],
		top: [],
	};
	assert.deepEqual(upgradable(state, 1), ['irrigation']);
	withEra(state, 1, 'golden-age');
	assert.deepEqual(upgradable(state, 1), ['irrigation', 'ammonia']);
	const bottom = resolveEffects(state, 1, [{ upgrade: {} }], random);
	const choosing = open(bottom, 'chooseUpgrade');
	const next = answer(bottom, random, 1, choosing.kind, { card: 'ammonia' });
	assert.deepEqual(next.seats[0].tech.top, ['ammonia']);
	assert.equal(next.seats[0].vp, state.seats[0].vp + 3);
	const low = answer(bottom, random, 1, 'chooseUpgrade', {
		card: 'irrigation',
	});
	assert.equal(low.seats[0].vp, state.seats[0].vp + 3);
	// An opponent's upgrade scores nothing for the holder.
	state.seats[1].tech = { bottom: ['irrigation'], middle: [], top: [] };
	const other = resolveEffects(state, 2, [{ upgrade: {} }], random);
	assert.equal(other.seats[0].vp, state.seats[0].vp);
});

test("Golden Age: an Alliance holder's copied benefit scores no Golden Age VP, the upgrader's own does", () => {
	const { state, random } = game(3);
	const allied = resolveTapestry(state, random, 1, 'alliance');
	const next = answer(allied, random, 1, 'choosePartner', { player: 3 });
	for (const seat of next.seats) {
		seat.tech = { bottom: ['irrigation'], middle: [], top: [] };
	}
	withEra(next, 3, 'golden-age');
	withEra(next, 1, 'alliance');
	next.seats[0].era.opponent = 3;
	const done = resolveEffects(next, 3, [{ upgrade: {} }], random);
	assert.equal(done.seats[2].vp, next.seats[2].vp + 3);
	assert.equal(done.seats[0].vp, next.seats[0].vp);
	assert.equal(
		eventsOf(done, 'resourcesGained').filter((e) => e.player === 1).length,
		1
	);
});

test("Broker of Peace blocks its holder's military and scores 3 VP per opponent military advance", () => {
	const { state, random } = game(3);
	withEra(state, 1, 'broker-of-peace');
	assert.equal(advanceBlocked(state, 1, 'military'), true);
	assert.equal(advanceBlocked(state, 1, 'science'), false);
	const next = jump(state, random, 2, 'military', 0, 1);
	assert.equal(next.seats[0].vp, state.seats[0].vp + 3);
	// Not for another track, and not for the holder's own move.
	assert.equal(
		jump(state, random, 2, 'science', 0, 1).seats[0].vp,
		state.seats[0].vp
	);
	assert.equal(
		jump(state, random, 1, 'military', 0, 1).seats[0].vp,
		state.seats[0].vp
	);
});

test('Empiricism rolls twice and lets the player choose, for every science roll', () => {
	const { state } = game();
	withEra(state, 1, 'empiricism');
	const random = rolls(0, 2);
	const choosing = resolveEffects(state, 1, [{ research: {} }], random);
	assert.deepEqual(open(choosing, 'chooseRoll').options, [
		'exploration',
		'technology',
	]);
	// A second science roll (Age of Discovery) also rolls twice.
	const again = rolls(0, 2);
	const discovery = resolveTapestry(state, again, 1, 'age-of-discovery');
	assert.deepEqual(open(discovery, 'chooseRoll').options, [
		'exploration',
		'technology',
	]);
});

test('Empiricism scores 2 VP per science advance', () => {
	const { state, random } = game();
	withEra(state, 1, 'empiricism');
	assert.equal(
		jump(state, random, 1, 'science', 0, 1).seats[0].vp,
		state.seats[0].vp + 2
	);
	assert.equal(
		jump(state, random, 1, 'technology', 0, 1).seats[0].vp,
		state.seats[0].vp
	);
	// Another player's science advance is not the holder's.
	assert.equal(
		jump(state, random, 2, 'science', 0, 1).seats[0].vp,
		state.seats[0].vp
	);
});

test('Theocracy blocks science and scores 4 VP per tier entered, a jump counting each tier', () => {
	const { state, random } = game();
	withEra(state, 1, 'theocracy');
	assert.equal(advanceBlocked(state, 1, 'science'), true);
	const vp = state.seats[0].vp;
	assert.equal(jump(state, random, 1, 'military', 0, 1).seats[0].vp, vp + 4);
	assert.equal(jump(state, random, 1, 'military', 1, 3).seats[0].vp, vp);
	assert.equal(jump(state, random, 1, 'military', 3, 4).seats[0].vp, vp + 4);
	assert.equal(jump(state, random, 1, 'military', 0, 5).seats[0].vp, vp + 8);
	assert.equal(jump(state, random, 1, 'military', 2, 8).seats[0].vp, vp + 8);
	// Not for an opponent.
	assert.equal(jump(state, random, 2, 'military', 0, 1).seats[0].vp, vp);
});

test('Revisionism gains a resource per track landmark, Dystopia included', () => {
	const { state, random } = game();
	withEra(state, 1, 'revisionism');
	// Exploration space 4 holds the Lighthouse, which nobody has.
	const moved = jump(state, random, 1, 'exploration', 3, 4);
	assert.equal(eventsOf(moved, 'landmarkGained').length, 1);
	assert.equal(open(moved, 'chooseResource').player, 1);
	assert.equal(open(moved, 'chooseResource').count, 1);
	const dystopia = placeAll(
		answer(
			resolveTapestry(state, random, 1, 'dystopia'),
			random,
			1,
			'chooseLandmark',
			{ landmark: 'forge' }
		),
		random
	);
	assert.equal(eventsOf(dystopia, 'landmarkGained').length, 1);
	assert.equal(open(dystopia, 'chooseResource').count, 1);
	// A tech card's landmark is not a track landmark, and no one else's gain counts.
	assert.equal(
		open(jump(state, random, 2, 'exploration', 3, 4), 'chooseResource'),
		undefined
	);
});

test('Revisionism gains an armory per claimed landmark space reached or passed', () => {
	const { state, random } = game();
	withEra(state, 1, 'revisionism');
	state.landmarks = state.landmarks.filter(
		(/** @type {string} */ l) => l !== 'lighthouse'
	);
	const before = state.seats[0].capital.buildings.length;
	const next = jump(state, random, 1, 'exploration', 3, 4);
	assert.equal(next.seats[0].capital.buildings.length, before + 1);
	assert.equal(
		jump(state, random, 2, 'exploration', 3, 4).seats[0].capital.buildings
			.length,
		before
	);
});

test('a THIS ERA card works in the same income turn it is played', () => {
	const { state, random } = game();
	state.seats[0].tech = { bottom: ['irrigation'], middle: [], top: [] };
	const played = resolveTapestry(state, random, 1, 'golden-age');
	assert.equal(played.seats[0].era.ability, 'golden-age');
	const vp = played.seats[0].vp;
	const upgraded = resolveEffects(played, 1, [{ upgrade: {} }], random);
	assert.equal(upgraded.seats[0].vp, vp + 3);
});

/**
 * Moves a seat's token from one space to another with the benefit, as an advance would, and runs what follows
 * until the next decision.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {string} track
 * @param {number} from
 * @param {number} to
 */
function advance(state, random, player, track, from, to) {
	const next = structuredClone(state);
	next.seats[player - 1].tracks[track] = [from];
	moveToken(contextFor(next, random, next.pending), player, {
		track,
		from,
		to,
		benefit: true,
	});
	run(next, random);
	return next;
}

/**
 * Pushes operations onto a copy of the state and runs them until the next decision.
 * @param {any} state
 * @param {any} random
 * @param {any[]} ops
 */
function pushed(state, random, ops) {
	const next = structuredClone(state);
	contextFor(next, random, next.pending).push(ops);
	run(next, random);
	return next;
}

/**
 * Runs one income step for a player, as their income turn would, until the next decision.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {string} step
 */
const incomeStep = (state, random, player, step) =>
	pushed(state, random, [
		{ player, kind: 'incomeSteps', turn: 2, steps: [step] },
	]);

/**
 * Gives a seat an active Marriage of State naming an opponent and a track.
 * @param {any} state
 * @param {number} player
 * @param {number} opponent
 * @param {string} track
 */
function married(state, player, opponent, track) {
	state.seats[player - 1].era = {
		card: 'marriage-of-state',
		ability: 'marriage-of-state',
		opponent,
		track,
	};
}

/**
 * Gives every seat the same resources.
 * @param {any} state
 * @param {number} each
 */
function resources(state, each) {
	for (const seat of state.seats) {
		seat.resources = {
			coin: each,
			worker: each,
			food: each,
			culture: each,
		};
	}
}

test("Marriage of State copies the partner's benefits on the chosen track, without the bonus", () => {
	const { state, random } = game();
	married(state, 1, 2, 'military');
	resources(state, 2);
	// Bladed Weapons (military 2) gains a tapestry card; its bonus pays any resource for an armory.
	const next = advance(state, random, 2, 'military', 1, 2);
	assert.deepEqual(eventsOf(next, 'benefitCopied'), [
		{
			type: 'benefitCopied',
			player: 1,
			track: 'military',
			space: 2,
			from: 2,
		},
	]);
	// The partner gains first, then the holder.
	assert.deepEqual(
		eventsOf(next, 'cardsDrawn').map((e) => e.player),
		[2, 1]
	);
	assert.equal(next.seats[0].hand.length, state.seats[0].hand.length + 1);
	// Only the partner is offered the bonus.
	assert.deepEqual(
		openDecisions(next).map((d) => [d.kind, d.player]),
		[['chooseBonus', 2]]
	);
});

test('Marriage of State ignores other tracks and other players', () => {
	const { state, random } = game(3);
	married(state, 1, 2, 'military');
	// Mathematics (science 2) and Bladed Weapons (military 2) each gain a tapestry card.
	for (const [player, track] of /** @type {[number, string][]} */ ([
		[2, 'science'],
		[3, 'military'],
		[1, 'military'],
	])) {
		const next = advance(state, random, player, track, 1, 2);
		assert.deepEqual(eventsOf(next, 'benefitCopied'), [], track);
		assert.equal(
			next.seats[0].hand.length,
			state.seats[0].hand.length + (player === 1 ? 1 : 0)
		);
	}
});

test('a Marriage of State copy does not trigger another copy', () => {
	const { state, random } = game(3);
	// Two Marriages can't name the same track in play; set up by hand, they would loop if a copy set off another.
	married(state, 1, 2, 'military');
	married(state, 3, 1, 'military');
	const next = advance(state, random, 2, 'military', 1, 2);
	assert.deepEqual(
		eventsOf(next, 'benefitCopied').map((e) => e.player),
		[1]
	);
	assert.equal(next.seats[2].hand.length, state.seats[2].hand.length);
});

test('Marriage of State cannot name a track another active Marriage of State names', () => {
	const { state, random } = game();
	married(state, 2, 1, 'military');
	const played = resolveTapestry(state, random, 1, 'marriage-of-state');
	assert.deepEqual(open(played, 'choosePartner').options, [
		{ player: 2, track: 'exploration' },
		{ player: 2, track: 'science' },
		{ player: 2, track: 'technology' },
	]);
	assert.throws(
		() =>
			answer(played, random, 1, 'choosePartner', {
				player: 2,
				track: 'military',
			}),
		{ name: 'PlayerError', message: 'Choose one of the opponents offered.' }
	);
	const chosen = answer(played, random, 1, 'choosePartner', {
		player: 2,
		track: 'science',
	});
	assert.deepEqual(chosen.seats[0].era, {
		card: 'marriage-of-state',
		ability: 'marriage-of-state',
		opponent: 2,
		track: 'science',
	});
});

test('a copied Interstellar Travel explores one of the space tiles it gave (R105)', () => {
	const { state, random } = game();
	married(state, 1, 2, 'exploration');
	state.seats[0].spaceTiles = [9];
	state.supply.space = [13, 5, 7, 2, 3, 14, 1];
	// Interstellar Travel (exploration 11) gains 3 space tiles and explores 1 of them.
	const partner = advance(state, random, 2, 'exploration', 10, 11);
	assert.equal(open(partner, 'chooseSpaceTile').player, 2);
	assert.deepEqual(open(partner, 'chooseSpaceTile').options, [13, 5, 7]);
	// Tile 13 is 13 VP and nothing else.
	const next = answer(partner, random, 2, 'chooseSpaceTile', { tile: 13 });
	assert.deepEqual(
		eventsOf(next, 'benefitCopied').map((e) => [e.player, e.space]),
		[[1, 11]]
	);
	const choosing = open(next, 'chooseSpaceTile');
	assert.equal(choosing.player, 1);
	assert.deepEqual(choosing.options, [2, 3, 14]);
});

test('Capitalism scores 2 VP per coin icon earned and gains a coin per market', () => {
	const { state, random } = game();
	state.seats[0].capital = {
		mat: 1,
		buildings: [],
		landmarks: [],
		cubes: [],
	};
	// Barter and Currency show a coin each; Banking shows none.
	state.seats[0].incomeMat.buildings.market = 3;
	const vp = state.seats[0].vp;
	assert.equal(incomeStep(state, random, 1, 'income').seats[0].vp, vp);
	withEra(state, 1, 'capitalism');
	const income = incomeStep(state, random, 1, 'income');
	assert.equal(income.seats[0].vp, vp + 4);
	assert.equal(income.seats[0].resources.coin, 2);
	// The VP come after the income.
	const types = income.events
		.slice(state.events.length)
		.map((/** @type {any} */ e) => e.type);
	assert.ok(types.lastIndexOf('resourcesGained') < types.indexOf('vpGained'));
	const coin = state.seats[0].resources.coin;
	const market = placeAll(
		resolveEffects(state, 1, [{ building: 'market' }], random),
		random
	);
	assert.equal(market.seats[0].resources.coin, coin + 1);
	const farm = placeAll(
		resolveEffects(state, 1, [{ building: 'farm' }], random),
		random
	);
	assert.equal(farm.seats[0].resources.coin, coin);
	// Only the holder's own markets count.
	const other = placeAll(
		resolveEffects(state, 2, [{ building: 'market' }], random),
		random
	);
	assert.equal(other.seats[0].resources.coin, coin);
});

test('Mercantilism converts food earned into other resources for 2 VP each, or none', () => {
	const { state, random } = game();
	resources(state, 0);
	// Hunting and Farming show a food each; Breeding shows none.
	state.seats[0].incomeMat.buildings.farm = 3;
	assert.equal(
		open(incomeStep(state, random, 1, 'income'), 'chooseConversion'),
		undefined
	);
	withEra(state, 1, 'mercantilism');
	const income = incomeStep(state, random, 1, 'income');
	const choosing = open(income, 'chooseConversion');
	assert.equal(choosing.player, 1);
	assert.equal(choosing.max, 2);
	assert.equal(income.seats[0].resources.food, 2);
	const answers = DECISIONS.chooseConversion.answers(income, choosing);
	assert.deepEqual(answers[0], { resources: {} });
	// Totals 0, 1 and 2 over coin, worker and culture: 1 + 3 + 6.
	assert.equal(answers.length, 10);
	assert.ok(answers.some((a) => a.resources.worker === 2));
	const before = income.seats[0];
	const converted = answer(income, random, 1, 'chooseConversion', {
		resources: { coin: 1, culture: 1 },
	});
	assert.deepEqual(converted.seats[0].resources, {
		coin: before.resources.coin + 1,
		worker: before.resources.worker,
		food: 0,
		culture: before.resources.culture + 1,
	});
	assert.equal(converted.seats[0].vp, before.vp + 4);
	assert.deepEqual(eventsOf(converted, 'resourcesConverted'), [
		{
			type: 'resourcesConverted',
			player: 1,
			resources: { coin: 1, culture: 1 },
			vp: 4,
		},
	]);
	const none = answer(income, random, 1, 'chooseConversion', {
		resources: {},
	});
	assert.deepEqual(none.seats[0].resources, before.resources);
	assert.equal(none.seats[0].vp, before.vp);
	for (const wrong of [{ coin: 3 }, { food: 1 }, { coin: -1 }, undefined]) {
		assert.throws(
			() =>
				answer(income, random, 1, 'chooseConversion', {
					resources: wrong,
				}),
			{
				name: 'PlayerError',
				message: 'Convert at most the food you earned and hold.',
			},
			JSON.stringify(wrong)
		);
	}
	// No more than the food held.
	const spent = structuredClone(income);
	spent.seats[0].resources.food = 1;
	assert.equal(DECISIONS.chooseConversion.answers(spent, choosing).length, 4);
});

test('Monarchy scores 3 VP per income building placed in the capital, and nothing beside the mat', () => {
	const { state, random } = game();
	withEra(state, 1, 'monarchy');
	state.seats[0].capital = {
		mat: 1,
		buildings: [],
		landmarks: [],
		cubes: [],
	};
	const vp = state.seats[0].vp;
	const placed = placeAll(
		resolveEffects(state, 1, [{ building: 'farm' }], random),
		random
	);
	assert.equal(placed.seats[0].capital.buildings.length, 1);
	assert.equal(placed.seats[0].vp, vp + 3);
	// A landmark is not an income building.
	const landmark = placeAll(
		pushed(state, random, [
			{ player: 1, kind: 'placeLandmark', landmark: 'lighthouse' },
		]),
		random
	);
	assert.equal(landmark.seats[0].capital.landmarks.length, 1);
	assert.equal(landmark.seats[0].vp, vp);
	// Another player's building scores nothing for the holder.
	const other = placeAll(
		resolveEffects(state, 2, [{ building: 'farm' }], random),
		random
	);
	assert.equal(other.seats[0].vp, vp);
	// A full city keeps the building beside the mat, which isn't in the city.
	const full = structuredClone(state);
	for (const spot of buildingSpots(full.seats[0])) {
		full.seats[0].capital.buildings.push({ building: 'house', ...spot });
	}
	const beside = resolveEffects(full, 1, [{ building: 'farm' }], random);
	assert.deepEqual(beside.seats[0].besideMat, ['farm']);
	assert.equal(beside.seats[0].vp, vp);
});

test('Terraforming lets buildings and landmarks cover impassable plots, 5 VP per piece', () => {
	const { state, random } = game();
	state.seats[0].capital = {
		mat: 1,
		buildings: [],
		landmarks: [],
		cubes: [],
	};
	const seat = state.seats[0];
	// On mat 1, plots (1, 0) and (1, 1) are impassable.
	assert.equal(
		buildingProblem(seat, { row: 1, col: 0 }),
		"That plot isn't open."
	);
	assert.equal(buildingProblem(seat, { row: 1, col: 0 }, true), null);
	assert.equal(buildingSpots(seat).length, 59);
	assert.equal(buildingSpots(seat, true).length, 81);
	const over = { landmark: 'lighthouse', row: 1, col: 0, rotation: 0 };
	assert.equal(landmarkProblem(seat, over), "That plot isn't open.");
	assert.equal(landmarkProblem(seat, over, true), null);
	const at = (/** @type {any[]} */ spots) =>
		spots.some((s) => s.row === 1 && s.col === 0 && s.rotation === 0);
	assert.equal(at(landmarkSpots(seat, 'lighthouse')), false);
	assert.equal(at(landmarkSpots(seat, 'lighthouse', true)), true);
	// Without Terraforming, the engine refuses the plot.
	const plain = resolveEffects(state, 1, [{ building: 'farm' }], random);
	assert.throws(
		() => answer(plain, random, 1, 'choosePlacement', { row: 1, col: 0 }),
		{ name: 'PlayerError', message: "That plot isn't open." }
	);
	withEra(state, 1, 'terraforming');
	const vp = seat.vp;
	const choosing = resolveEffects(state, 1, [{ building: 'farm' }], random);
	const decision = open(choosing, 'choosePlacement');
	assert.equal(
		DECISIONS.choosePlacement.answers(choosing, decision).length,
		81
	);
	const covered = answer(choosing, random, 1, 'choosePlacement', {
		row: 1,
		col: 0,
	});
	assert.deepEqual(covered.seats[0].capital.buildings, [
		{ building: 'farm', row: 1, col: 0 },
	]);
	assert.equal(covered.seats[0].vp, vp + 5);
	const elsewhere = answer(choosing, random, 1, 'choosePlacement', {
		row: 0,
		col: 0,
	});
	assert.equal(elsewhere.seats[0].vp, vp);
	// The landmark covers both impassable plots, and is one piece: 5 VP.
	const landing = pushed(state, random, [
		{ player: 1, kind: 'placeLandmark', landmark: 'lighthouse' },
	]);
	const landed = answer(landing, random, 1, 'choosePlacement', over);
	assert.equal(landed.seats[0].capital.landmarks.length, 1);
	assert.equal(landed.seats[0].vp, vp + 5);
});

test('Tyranny may play a card just gained on top of itself for 5 VP, once', () => {
	const { state, random } = game();
	const seat = state.seats[0];
	seat.incomeTurns = 2;
	seat.incomeMat.tapestry[1] = ['tyranny'];
	seat.hand = ['academia'];
	withEra(state, 1, 'tyranny');
	const gaining = ['capitalism', 'trap-1'];
	state.supply.tapestry.deck = [
		...gaining,
		...state.supply.tapestry.deck.filter(
			(/** @type {string} */ c) => !gaining.includes(c)
		),
	];
	const gained = resolveEffects(
		state,
		1,
		[{ gain: { tapestry: 2 } }],
		random
	);
	const choosing = open(gained, 'chooseTapestry');
	assert.equal(choosing.player, 1);
	// Only the cards just gained, played on the current era's slot.
	assert.deepEqual(choosing.options, gaining);
	assert.equal(choosing.era, 2);
	assert.deepEqual(DECISIONS.chooseTapestry.answers(gained, choosing)[0], {
		card: null,
	});
	const vp = gained.seats[0].vp;
	// A THIS ERA card covers Tyranny and becomes the active ability.
	const era = answer(gained, random, 1, 'chooseTapestry', {
		card: 'capitalism',
	});
	assert.deepEqual(era.seats[0].incomeMat.tapestry[1], [
		'tyranny',
		'capitalism',
	]);
	assert.equal(era.seats[0].era.ability, 'capitalism');
	assert.equal(era.seats[0].vp, vp + 5);
	assert.deepEqual(era.seats[0].hand, ['academia', 'trap-1']);
	// Tyranny is covered, so the next gain asks nothing.
	const again = resolveEffects(era, 1, [{ gain: { tapestry: 1 } }], random);
	assert.equal(open(again, 'chooseTapestry'), undefined);
	// A WHEN PLAYED card leaves no active ability: 5 VP and the trap's 10 (R22).
	const trap = answer(gained, random, 1, 'chooseTapestry', {
		card: 'trap-1',
	});
	assert.equal(trap.seats[0].era, null);
	assert.equal(trap.seats[0].vp, vp + 15);
	// Declining keeps Tyranny and the cards.
	const declined = answer(gained, random, 1, 'chooseTapestry', {
		card: null,
	});
	assert.equal(declined.seats[0].era.ability, 'tyranny');
	assert.equal(declined.seats[0].vp, vp);
	assert.equal(declined.seats[0].hand.length, 3);
	// Another player's gain, and a gain with no current era (R25), ask nothing.
	const other = resolveEffects(state, 2, [{ gain: { tapestry: 1 } }], random);
	assert.equal(open(other, 'chooseTapestry'), undefined);
	const late = structuredClone(state);
	late.version = 'original';
	late.seats[0].incomeTurns = 5;
	const none = resolveEffects(late, 1, [{ gain: { tapestry: 1 } }], random);
	assert.equal(open(none, 'chooseTapestry'), undefined);
});

test('Wartime Economy makes "any resource" bonuses free but still optional', () => {
	const { state, random } = game();
	resources(state, 0);
	withEra(state, 1, 'wartime-economy');
	// Rafts (exploration 2): pay any resource for a tapestry card.
	const rafts = { kind: 'bonus', track: 'exploration', space: 2 };
	const offered = pushed(state, random, [{ player: 1, ...rafts }]);
	const choosing = open(offered, 'chooseBonus');
	assert.deepEqual(choosing.cost, {});
	assert.deepEqual(DECISIONS.chooseBonus.answers(offered, choosing), [
		{ pay: null },
		{ pay: {} },
	]);
	const taken = answer(offered, random, 1, 'chooseBonus', { pay: {} });
	assert.equal(taken.seats[0].hand.length, state.seats[0].hand.length + 1);
	assert.deepEqual(taken.seats[0].resources, state.seats[0].resources);
	const declined = answer(offered, random, 1, 'chooseBonus', { pay: null });
	assert.equal(declined.seats[0].hand.length, state.seats[0].hand.length);
	// Any other cost is still paid: Chemistry (science 5) asks 2 tapestry cards, which seat 1 doesn't hold.
	const chemistry = pushed(state, random, [
		{ player: 1, kind: 'bonus', track: 'science', space: 5 },
	]);
	assert.equal(open(chemistry, 'chooseBonus'), undefined);
	// Without Wartime Economy, a player with nothing to pay is offered nothing.
	const other = pushed(state, random, [{ player: 2, ...rafts }]);
	assert.equal(open(other, 'chooseBonus'), undefined);
});
