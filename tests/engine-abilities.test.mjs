// Tests for abilities that last: triggers, advance blocks and allies (#19, design §5, §6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, contextFor, resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { moveToken } from '../src/lib/engine/movement.js';
import { placePiece } from '../src/lib/engine/placing.js';
import { buildingSpots } from '../src/lib/engine/city.js';
import { conquerTargets } from '../src/lib/engine/map.js';
import { advances } from '../src/lib/engine/decisions/choose-advance.js';
import { ERA_HOOKS } from '../src/lib/engine/eras.js';
import {
	triggered,
	advanceBlocked,
	allies,
	opponents,
} from '../src/lib/engine/abilities.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { startedGame, readyTurn, answer, placeAll } from './helpers/engine.mjs';

/**
 * Registers a test ability until the test ends. Each of its handlers records its call and gives its owner 1 VP.
 * @param {import('node:test').TestContext} t
 * @param {string[]} hooks - The hooks the ability has
 * @returns {{ hook: string, owner: number, payload: any }[]} The calls, in order
 */
function testAbility(t, hooks) {
	/** @type {{ hook: string, owner: number, payload: any }[]} */
	const calls = [];
	ERA_HOOKS.test = Object.fromEntries(
		hooks.map((hook) => [
			hook,
			(
				/** @type {any} */ state,
				/** @type {number} */ owner,
				/** @type {any} */ payload
			) => {
				calls.push({ hook, owner, payload: structuredClone(payload) });
				return [
					{ player: owner, kind: 'effects', effects: [{ vp: 1 }] },
				];
			},
		])
	);
	t.after(() => {
		delete ERA_HOOKS.test;
	});
	return calls;
}

/**
 * Gives seats the test ability as their THIS ERA ability.
 * @param {any} state
 * @param {...number} seats
 */
function holdTest(state, ...seats) {
	for (const seat of seats) {
		state.seats[seat - 1].era = { card: null, ability: 'test' };
	}
}

/**
 * A copy of a started game, to change before anything runs.
 * @param {number} count
 */
function game(count) {
	const { state: started, random } = startedGame(count);
	return { state: structuredClone(started), random };
}

/**
 * The event types emitted after a sequence number, in order.
 * @param {any} state
 * @param {number} since
 * @returns {string[]}
 */
const typesSince = (state, since) =>
	state.events
		.filter((/** @type {any} */ e) => e.seq > since)
		.map((/** @type {any} */ e) => e.type);

/**
 * The events of one type, without their numbers.
 * @param {any} state
 * @param {string} type
 */
const eventsOf = (state, type) =>
	state.events
		.filter((/** @type {any} */ e) => e.type === type)
		.map(({ seq: _seq, ...e }) => e);

/**
 * Ends a seat's turn on a copy of the state, and runs until the next seat's turn choice.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 */
function endTurnOf(state, random, player) {
	const next = structuredClone(state);
	next.pending.length = 0;
	push(next, next.pending, [{ player, kind: 'endTurn' }]);
	run(next, random);
	return next;
}

/**
 * A random that returns the given numbers in turn: science die faces 0 to 3 are exploration, science, technology and military.
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

const PLENTY = { coin: 3, worker: 3, food: 3, culture: 3 };

/**
 * The tracks a player could advance on in an advance turn.
 * @param {any} state
 * @param {number} player
 */
const advanceTracks = (state, player) => [
	...new Set(advances(state, player).map((a) => a.track)),
];

test('a trigger handler runs for the seat whose era ability has it, with the payload', (t) => {
	const calls = testAbility(t, ['invented']);
	const { state, random } = game(2);
	holdTest(state, 2);
	const inventing = resolveEffects(state, 1, [{ invent: {} }], random);
	const card = inventing.supply.tech.faceUp[0];
	const next = answer(inventing, random, 1, 'chooseInvent', { card });
	assert.deepEqual(calls, [
		{ hook: 'invented', owner: 2, payload: { player: 1, card } },
	]);
	assert.equal(next.seats[1].vp - state.seats[1].vp, 1);
	assert.equal(next.seats[0].vp, state.seats[0].vp);
});

test('triggered asks seats in seat order from the acting player', (t) => {
	const calls = testAbility(t, ['invented']);
	const { state } = game(3);
	holdTest(state, 1, 2, 3);
	const ops = triggered(state, 'invented', { player: 2, card: 'paper' });
	assert.deepEqual(
		calls.map((c) => c.owner),
		[2, 3, 1]
	);
	assert.deepEqual(
		ops.map((op) => op.player),
		[2, 3, 1]
	);
	assert.deepEqual(triggered(state, 'upgraded', { player: 2 }), []);
});

test("an upgrade trigger resolves after the card's own benefit", (t) => {
	const calls = testAbility(t, ['upgraded']);
	const { state, random } = game(2);
	holdTest(state, 1);
	// Calendar's circle is 1 culture.
	state.seats[0].tech.bottom = ['calendar'];
	const since = state.seq;
	const next = resolveEffects(state, 1, [{ upgrade: {} }], random);
	assert.deepEqual(
		calls.map((c) => c.payload),
		[{ player: 1, card: 'calendar', icon: 'circle' }]
	);
	const types = typesSince(next, since);
	assert.ok(types.includes('resourcesGained'));
	assert.ok(types.indexOf('resourcesGained') < types.indexOf('vpGained'));
});

test('a multi-card invent asks for the next card only after the triggers of the first, keeping its options', (t) => {
	const calls = testAbility(t, ['invented']);
	const { state, random } = game(2);
	holdTest(state, 1);
	const inventing = resolveEffects(
		state,
		1,
		[{ invent: { count: 2, refresh: true, faceUpOnly: true } }],
		random
	);
	const first = inventing.supply.tech.faceUp[0];
	const since = inventing.seq;
	const asked = answer(inventing, random, 1, 'chooseInvent', {
		card: first,
	});
	const types = typesSince(asked, since);
	assert.ok(types.indexOf('techInvented') < types.indexOf('vpGained'));
	const again = openDecisions(asked).find((d) => d.kind === 'chooseInvent');
	assert.deepEqual(
		[again?.left, again?.refresh, again?.invent],
		[1, false, { faceUpOnly: true }]
	);
	const second = asked.supply.tech.faceUp[0];
	const done = answer(asked, random, 1, 'chooseInvent', { card: second });
	assert.deepEqual(
		calls.map((c) => c.payload.card),
		[first, second]
	);
	assert.deepEqual(done.seats[0].tech.bottom, [first, second]);
});

test('advanced fires only for forward moves, with claimedPassed', (t) => {
	const calls = testAbility(t, ['advanced']);
	const { state, random } = game(2);
	holdTest(state, 1);
	state.seats[0].tracks.exploration = [3];
	// Someone already owns the Lighthouse, on exploration 4.
	state.landmarks = state.landmarks.filter((l) => l !== 'lighthouse');
	const advanced = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['exploration'], noBenefit: true } }],
		random
	);
	assert.deepEqual(
		calls.map((c) => c.payload),
		[
			{
				player: 1,
				track: 'exploration',
				from: 3,
				to: 4,
				claimedPassed: 1,
			},
		]
	);
	assert.equal(advanced.seats[0].vp - state.seats[0].vp, 1);
	const back = resolveEffects(
		advanced,
		1,
		[{ regress: { tracks: ['exploration'], noBenefit: true } }],
		random
	);
	assert.deepEqual(back.seats[0].tracks.exploration, [3]);
	assert.equal(calls.length, 1);
});

test('claimedPassed counts the landmark spaces a move reaches or passes whose landmark was already owned', (t) => {
	const calls = testAbility(t, ['advanced']);
	const { state, random } = game(2);
	holdTest(state, 1);
	state.seats[0].tracks.exploration = [2];
	state.landmarks = state.landmarks.filter(
		(l) => l !== 'lighthouse' && l !== 'launch-pad'
	);
	moveToken(contextFor(state, random, state.pending), 1, {
		track: 'exploration',
		from: 2,
		to: 10,
		benefit: false,
	});
	// The Train Station is still free: this move gains it, so it doesn't count.
	assert.equal(calls[0].payload.claimedPassed, 2);
	assert.ok(!state.landmarks.includes('train-station'));
});

test('landmarkGained fires once the landmark is placed: fromTrack for a track landmark, not for a tech card', (t) => {
	const calls = testAbility(t, ['landmarkGained']);
	const { state, random } = game(2);
	holdTest(state, 1);
	state.seats[0].tracks.exploration = [3];
	const since = state.seq;
	const placing = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['exploration'], noBenefit: true } }],
		random
	);
	assert.equal(openDecisions(placing)[0].kind, 'choosePlacement');
	const placed = placeAll(placing, random);
	const types = typesSince(placed, since);
	assert.ok(types.includes('landmarkPlaced'));
	assert.ok(types.indexOf('landmarkPlaced') < types.indexOf('vpGained'));
	placeAll(
		resolveEffects(placed, 1, [{ landmark: 'bakery' }], random),
		random
	);
	assert.deepEqual(
		calls.map((c) => c.payload),
		[
			{ player: 1, landmark: 'lighthouse', fromTrack: true },
			{ player: 1, landmark: 'bakery', fromTrack: false },
		]
	);
});

test("benefitGained fires between a space's benefit and its bonus", (t) => {
	const calls = testAbility(t, ['benefitGained']);
	const { state, random } = game(2);
	holdTest(state, 1);
	// Science 2 draws a tapestry card; its bonus pays 1 any resource for a house.
	state.seats[0].tracks.science = [1];
	state.seats[0].resources = { ...PLENTY };
	const since = state.seq;
	const next = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['science'] } }],
		random
	);
	assert.deepEqual(
		calls.map((c) => c.payload),
		[{ player: 1, track: 'science', space: 2 }]
	);
	const types = typesSince(next, since);
	assert.ok(types.includes('cardsDrawn'));
	assert.ok(types.indexOf('cardsDrawn') < types.indexOf('vpGained'));
	assert.equal(openDecisions(next)[0].kind, 'chooseBonus');
});

test('tapestryGained fires when tapestry cards are drawn, and not when none is left', (t) => {
	const calls = testAbility(t, ['tapestryGained']);
	const { state, random } = game(2);
	holdTest(state, 2);
	const top = state.supply.tapestry.deck.slice(0, 2);
	resolveEffects(state, 1, [{ gain: { tapestry: 2 } }], random);
	assert.deepEqual(calls, [
		{
			hook: 'tapestryGained',
			owner: 2,
			payload: { player: 1, cards: top },
		},
	]);
	state.supply.tapestry.deck = [];
	state.supply.tapestry.discard = [];
	resolveEffects(state, 1, [{ gain: { tapestry: 1 } }], random);
	assert.equal(calls.length, 1);
});

test('buildingGained fires for a gained building, and piecePlaced once it is on the capital mat, not beside it', (t) => {
	const calls = testAbility(t, ['buildingGained', 'piecePlaced']);
	const { state, random } = game(2);
	holdTest(state, 1);
	state.seats[0].capital.mat = 1;
	placeAll(resolveEffects(state, 1, [{ building: 'farm' }], random), random);
	assert.deepEqual(
		calls.map((c) => [c.hook, c.payload]),
		[
			['buildingGained', { player: 1, building: 'farm' }],
			['piecePlaced', { player: 1, building: 'farm', impassable: 0 }],
		]
	);
	calls.length = 0;
	const full = structuredClone(state);
	for (const spot of buildingSpots(full.seats[0])) {
		full.seats[0].capital.buildings.push({ building: 'house', ...spot });
	}
	const beside = resolveEffects(full, 1, [{ building: 'farm' }], random);
	assert.deepEqual(beside.seats[0].besideMat, ['farm']);
	assert.deepEqual(
		calls.map((c) => c.hook),
		['buildingGained']
	);
});

test('piecePlaced counts the impassable plots of the mat that a piece covers on the grid', (t) => {
	const calls = testAbility(t, ['piecePlaced']);
	const { state, random } = game(2);
	holdTest(state, 1);
	// Mat 1's rows 1 and 2 are '110001110' and '000111000'.
	state.seats[0].capital.mat = 1;
	state.pending.length = 0;
	const ctx = contextFor(state, random, state.pending);
	placePiece(ctx, 1, { building: 'farm', row: 1, col: 0 }, false);
	placePiece(
		ctx,
		1,
		{ landmark: 'lighthouse', row: 1, col: 5, rotation: 0 },
		false
	);
	// Hanging off the right edge: the plots off the grid are not plots of the mat.
	placePiece(
		ctx,
		1,
		{ landmark: 'forge', row: 0, col: 8, rotation: 0 },
		false
	);
	assert.deepEqual(
		calls.map((c) => c.payload),
		[
			{ player: 1, building: 'farm', impassable: 1 },
			{ player: 1, landmark: 'lighthouse', impassable: 3 },
			{ player: 1, landmark: 'forge', impassable: 0 },
		]
	);
});

test('opponents are the other seats, clockwise from the left', () => {
	const { state } = game(4);
	assert.deepEqual(opponents(state, 2), [3, 4, 1]);
	assert.deepEqual(opponents(state, 4), [1, 2, 3]);
});

test("Broker of Peace and Theocracy block their holder's own track", () => {
	const { state } = game(2);
	state.seats[0].resources = { ...PLENTY };
	state.seats[1].resources = { ...PLENTY };
	assert.deepEqual(advanceTracks(state, 1), TRACK_IDS);
	state.seats[0].era = {
		card: 'broker-of-peace',
		ability: 'broker-of-peace',
	};
	assert.equal(advanceBlocked(state, 1, 'military'), true);
	assert.equal(advanceBlocked(state, 1, 'science'), false);
	assert.equal(advanceBlocked(state, 2, 'military'), false);
	assert.deepEqual(advanceTracks(state, 1), [
		'exploration',
		'science',
		'technology',
	]);
	assert.deepEqual(advanceTracks(state, 2), TRACK_IDS);
	state.seats[0].era = { card: 'theocracy', ability: 'theocracy' };
	assert.equal(advanceBlocked(state, 1, 'science'), true);
	assert.equal(advanceBlocked(state, 1, 'military'), false);
	assert.deepEqual(advanceTracks(state, 1), [
		'exploration',
		'technology',
		'military',
	]);
});

test('a Dictatorship block stops opponents but not its player, and lifts when turn order reaches its player (R26)', () => {
	const { state, random } = game(3);
	for (const seat of state.seats) {
		seat.resources = { ...PLENTY };
	}
	state.blocks = [{ player: 1, track: 'military' }];
	assert.equal(advanceBlocked(state, 2, 'military'), true);
	assert.equal(advanceBlocked(state, 3, 'military'), true);
	assert.equal(advanceBlocked(state, 1, 'military'), false);
	assert.equal(advanceBlocked(state, 2, 'science'), false);
	assert.ok(!advanceTracks(state, 2).includes('military'));
	assert.ok(advanceTracks(state, 1).includes('military'));
	// Seat 3's turn starts: the block holds.
	const third = endTurnOf(state, random, 2);
	assert.equal(third.current, 3);
	assert.deepEqual(third.blocks, [{ player: 1, track: 'military' }]);
	assert.deepEqual(eventsOf(third, 'trackUnblocked'), []);
	// Turn order reaches seat 1: the block lifts.
	const first = endTurnOf(third, random, 3);
	assert.equal(first.current, 1);
	assert.deepEqual(first.blocks, []);
	assert.deepEqual(eventsOf(first, 'trackUnblocked'), [
		{ type: 'trackUnblocked', player: 1, track: 'military' },
	]);
	assert.ok(advanceTracks(first, 2).includes('military'));
});

test('a block of a finished player lifts when turn order skips them (R26)', () => {
	const { state, random } = game(3);
	state.seats[0].finished = true;
	state.blocks = [
		{ player: 1, track: 'science' },
		{ player: 2, track: 'military' },
	];
	const next = endTurnOf(state, random, 3);
	assert.equal(next.current, 2);
	// Seat 2's own block lifts too, as its turn starts.
	assert.deepEqual(next.blocks, []);
	assert.deepEqual(eventsOf(next, 'trackUnblocked'), [
		{ type: 'trackUnblocked', player: 1, track: 'science' },
		{ type: 'trackUnblocked', player: 2, track: 'military' },
	]);
});

test('an advance effect offers no blocked track, regressing still works, and an advance turn refuses a blocked track', () => {
	const { state, random } = game(2);
	state.blocks = [{ player: 2, track: 'military' }];
	const choosing = resolveEffects(
		state,
		1,
		[{ advance: { tracks: [...TRACK_IDS] } }],
		random
	);
	const move = openDecisions(choosing).find((d) => d.kind === 'chooseMove');
	assert.deepEqual(
		move?.options.map((/** @type {any} */ o) => o.track),
		['exploration', 'science', 'technology']
	);
	state.seats[0].tracks.military = [1];
	const back = resolveEffects(
		state,
		1,
		[{ regress: { tracks: ['military'], noBenefit: true } }],
		random
	);
	assert.deepEqual(back.seats[0].tracks.military, [0]);
	const only = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['military'] } }],
		random
	);
	assert.deepEqual(only.seats[0].tracks.military, [1]);

	const ready = readyTurn(2, (seat, s) => {
		seat.resources = { ...PLENTY };
		s.blocks = [{ player: seat.seat === 1 ? 2 : 1, track: 'military' }];
	});
	const chosen = answer(
		ready.state,
		ready.random,
		ready.player,
		'chooseTurn',
		{
			turn: 'advance',
		}
	);
	const [decision] = openDecisions(chosen);
	const answers = DECISIONS.chooseAdvance.answers(chosen, decision);
	assert.ok(!answers.some((a) => a.track === 'military'));
	assert.throws(
		() =>
			answer(chosen, ready.random, ready.player, 'chooseAdvance', {
				track: 'military',
				from: 0,
				pay: answers[0].pay,
			}),
		{ name: 'PlayerError', message: "You can't advance on that track now." }
	);
});

test('a blocked research roll offers no move', () => {
	const { state } = game(2);
	state.blocks = [{ player: 2, track: 'technology' }];
	// Face 2 is technology.
	const blocked = resolveEffects(state, 1, [{ research: {} }], rolls(2));
	assert.equal(
		openDecisions(blocked).find((d) => d.kind === 'chooseMove'),
		undefined
	);
	// Alien Biology's VP are for a track with no token to move, not a blocked one (design §10).
	const alien = resolveEffects(
		state,
		1,
		[{ research: { offTrackVp: 5 } }],
		rolls(2)
	);
	assert.equal(alien.seats[0].vp, state.seats[0].vp);
	state.blocks = [];
	const open = resolveEffects(state, 1, [{ research: {} }], rolls(2));
	assert.ok(openDecisions(open).some((d) => d.kind === 'chooseMove'));
});

test("allies cannot conquer each other's territories", () => {
	const { state } = game(3);
	for (const hex of Object.values(state.hexes)) {
		hex.outposts = [];
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	state.hexes['-2_-1'].outposts = [{ seat: 2, toppled: false }];
	assert.ok(conquerTargets(state, 1, false).includes('-2_-1'));
	assert.ok(conquerTargets(state, 2, false).includes('-2_-2'));
	for (const [holder, named] of [
		[1, 2],
		[2, 1],
	]) {
		const allied = structuredClone(state);
		allied.seats[holder - 1].era = {
			card: 'alliance',
			ability: 'alliance',
			opponent: named,
		};
		assert.deepEqual(allies(allied, 1), [2]);
		assert.deepEqual(allies(allied, 2), [1]);
		assert.deepEqual(allies(allied, 3), []);
		assert.ok(!conquerTargets(allied, 1, false).includes('-2_-1'));
		assert.ok(!conquerTargets(allied, 2, false).includes('-2_-2'));
		assert.ok(conquerTargets(allied, 1, true).length > 0);
	}
	// An Alliance with a third seat changes nothing between seats 1 and 2.
	state.seats[2].era = { card: 'alliance', ability: 'alliance', opponent: 2 };
	assert.deepEqual(allies(state, 1), []);
	assert.ok(conquerTargets(state, 1, false).includes('-2_-1'));
	assert.ok(!conquerTargets(state, 3, true).includes('-2_-1'));
});
