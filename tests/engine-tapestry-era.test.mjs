// Tests for the THIS ERA cards on tracks and tech cards (#19, design §8).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contextFor, run, resolveEffects } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { moveToken } from '../src/lib/engine/movement.js';
import { upgradable } from '../src/lib/engine/tech.js';
import { advanceBlocked } from '../src/lib/engine/abilities.js';
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
