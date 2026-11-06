// The arts track (#35 part 1): the switch, the fifth track, its prices, landmarks and spaces, the d20 and R118.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	checkOptions,
	createGame,
	EXPANSIONS_BUILT,
} from '../src/lib/engine/setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { artsInPlay, tracksOf } from '../src/lib/engine/tracks-in-play.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { TRACKS, advanceCost } from '../src/lib/engine/data/tracks.js';
import { countVp } from '../src/lib/engine/effects/vp.js';
import {
	EXPANSION_LANDMARKS,
	LANDMARKS,
	landmarksFor,
} from '../src/lib/engine/data/landmarks.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { advances } from '../src/lib/engine/decisions/choose-advance.js';
import {
	answer,
	newGame,
	placeAll,
	readyTurn,
	resolveTapestry,
} from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

const AA = { expansions: ['aa'] };
const ARTS_LANDMARKS = ['clock-tower', 'opera-house', 'holocenter'];

test('Arts & Architecture is built, and its two variants need it', () => {
	assert.deepEqual(EXPANSIONS_BUILT, ['pp', 'aa']);
	assert.doesNotThrow(() =>
		checkOptions({
			version: 'current',
			expansions: ['aa'],
			variants: ['no-arts-track'],
		})
	);
	assert.throws(
		() =>
			checkOptions({
				version: 'current',
				variants: ['either-science-die'],
			}),
		{ name: 'PlayerError', message: /needs Arts & Architecture/ }
	);
});

test('either science die is refused without the arts track', () => {
	assert.throws(
		() =>
			checkOptions({
				version: 'current',
				expansions: ['aa'],
				variants: ['no-arts-track', 'either-science-die'],
			}),
		{ name: 'PlayerError', message: /arts track/ }
	);
});

test('a game with the arts track puts every token on its start, and tracksOf lists five', () => {
	const { state } = newGame(3, AA);
	for (const seat of state.seats) {
		assert.deepEqual(seat.tracks.arts, [0]);
	}
	assert.deepEqual(tracksOf(state), [...TRACK_IDS, 'arts']);
	assert.equal(artsInPlay(state), true);
	checkState(state);
});

test('without the arts track no seat has an arts token', () => {
	for (const options of [
		{},
		{ expansions: ['pp'] },
		{ expansions: ['aa'], variants: ['no-arts-track'] },
	]) {
		const { state } = newGame(3, options);
		for (const seat of state.seats) {
			assert.ok(!('arts' in seat.tracks));
		}
		assert.deepEqual(tracksOf(state), [...TRACK_IDS]);
		assert.equal(artsInPlay(state), false);
	}
});

test('R59: a one-player game with the arts track is refused', () => {
	assert.throws(
		() =>
			createGame({
				players: [{ name: 'Ana' }],
				version: 'current',
				expansions: ['aa'],
				random: seededRandom(1),
			}),
		{ name: 'PlayerError', message: /2 or more players/ }
	);
	assert.doesNotThrow(() =>
		createGame({
			players: [{ name: 'Ana' }],
			version: 'current',
			expansions: ['aa'],
			variants: ['no-arts-track'],
			random: seededRandom(1),
		})
	);
});

const BOARD = ['exploration', 'science', 'technology', 'military'];
const payAny = (/** @type {object[]} */ gain) => ({ pay: { any: 1 }, gain });

test('the arts track has 12 spaces in four tiers, named as printed (03 §2.3)', () => {
	assert.deepEqual(
		TRACKS.arts.slice(1).map((s) => s.name),
		[
			'Cave Paintings',
			'Flutes',
			'Dance',
			'Epic Poetry',
			'Symphony',
			'Carved Marble Sculpture',
			'Rock Opera',
			'CGI Animation',
			'Flash Mob',
			'Virtual Reality Holocenter',
			'Infinite Spectrum Photography',
			'Streaming Implants',
		]
	);
	assert.deepEqual(
		TRACKS.arts.map((s) => s.tier),
		[0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]
	);
	assert.deepEqual(
		TRACKS.arts.map((s) => s.landmark),
		[
			null,
			null,
			null,
			null,
			'clock-tower',
			null,
			null,
			'opera-house',
			null,
			null,
			'holocenter',
			null,
			null,
		]
	);
});

test('each arts space has the benefit and bonus of 03 §2.3', () => {
	const flashMob = [{ advance: { tracks: BOARD } }];
	const expected = [
		[[{ gain: { tapestry: 1 } }], null, false],
		[[{ vp: 5 }], payAny([{ anyBuilding: {} }]), false],
		[[{ create: {} }], null, false],
		[
			[{ vp: { per: 'territoryTile' } }, { vp: { per: 'techCard' } }],
			null,
			false,
		],
		[[{ inspire: {} }], payAny([{ create: {} }]), false],
		[
			[{ choice: [[{ broadcast: {} }], [{ anyBuilding: {} }]] }],
			null,
			false,
		],
		[
			[{ refreshMasterpieces: { optional: true } }, { create: {} }],
			null,
			false,
		],
		[[{ inspire: {} }], payAny([{ anyBuilding: {} }]), false],
		[flashMob, null, false],
		[[{ anyBuilding: {} }, { vp: { per: 'incomeBuilding' } }], null, true],
		[flashMob, payAny([{ create: {} }]), false],
		[[{ streamingImplants: {} }], null, false],
	];
	expected.forEach(([benefit, bonus, ordered], index) => {
		const space = TRACKS.arts[index + 1];
		assert.deepEqual(space.benefit, benefit, space.name);
		assert.deepEqual(space.bonus, bonus, space.name);
		assert.equal(space.ordered, ordered, space.name);
	});
});

test('the arts tiers cost any 1, 2 different, any 3, then 2 of one type (03 §2.2)', () => {
	const tiers = [{ any: 1 }, { different: 2 }, { any: 3 }, { same: 2 }];
	for (let space = 1; space <= 12; space++) {
		assert.deepEqual(
			advanceCost('arts', space),
			tiers[Math.ceil(space / 3) - 1],
			`arts ${space}`
		);
	}
	assert.deepEqual(advanceCost('science', 4), { worker: 1, any: 1 });
});

test('Holocenter counts every income building off the mat (R71)', () => {
	const { state } = newGame(2, AA);
	state.seats[0].incomeMat.buildings = {
		market: 3,
		house: 5,
		farm: 4,
		armory: 5,
	};
	assert.equal(countVp(state, 1, 'incomeBuilding'), 3);
});

test('the arts track adds its 3 landmarks, with the shared footprints, only when it is in play (03 §2.10)', () => {
	assert.deepEqual(
		EXPANSION_LANDMARKS.filter((l) => l.expansion === 'aa').map((l) => [
			l.id,
			l.source,
			l.arts,
		]),
		[
			['clock-tower', { track: 'arts', tier: 2, space: 4 }, true],
			['opera-house', { track: 'arts', tier: 3, space: 7 }, true],
			['holocenter', { track: 'arts', tier: 4, space: 10 }, true],
		]
	);
	for (const id of ARTS_LANDMARKS) {
		const landmark = EXPANSION_LANDMARKS.find((l) => l.id === id);
		assert.equal(landmark?.footprint, FOOTPRINTS[id], id);
	}
	assert.equal(landmarksFor(['aa']).length, 21);
	assert.equal(landmarksFor(['aa'], ['no-arts-track']).length, 18);
	assert.equal(landmarksFor(['pp', 'aa']).length, 28);
});

test('the arts landmarks are in the supply only with the arts track', () => {
	const on = newGame(2, AA).state;
	for (const id of ARTS_LANDMARKS) {
		assert.ok(on.landmarks.includes(id), id);
	}
	checkState(on);
	for (const options of [
		{},
		{ expansions: ['aa'], variants: ['no-arts-track'] },
	]) {
		const off = newGame(2, options).state;
		for (const id of ARTS_LANDMARKS) {
			assert.ok(!off.landmarks.includes(id), id);
		}
		checkState(off);
	}
});

test('Dystopia may take an arts-track landmark (03 §2.2)', () => {
	const boardTrack = LANDMARKS.filter((l) => 'track' in l.source).map(
		(l) => l.id
	);
	const { state, random, player } = readyTurn(
		2,
		(_seat, state) => {
			state.landmarks = state.landmarks.filter(
				(id) => !boardTrack.includes(id)
			);
		},
		AA
	);
	const next = resolveTapestry(state, random, player, 'dystopia');
	const [decision] = openDecisions(next);
	assert.equal(decision.kind, 'chooseLandmark');
	assert.deepEqual([...decision.options].sort(), [...ARTS_LANDMARKS].sort());
});

/**
 * Advances the current player of a 2-player A&A game onto an arts space from the space before it, holding 2 of each
 * resource, paying the first way the engine offers; `fill` changes their seat (and the state) first.
 * @param {number} space
 * @param {(seat: any, state: any) => void} [fill]
 */
function ontoArts(space, fill = () => {}) {
	const ready = readyTurn(
		2,
		(seat, state) => {
			seat.tracks.arts = [space - 1];
			seat.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
			fill(seat, state);
		},
		AA
	);
	const { random, player } = ready;
	const chosen = answer(ready.state, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	const [decision] = openDecisions(chosen);
	const move = DECISIONS.chooseAdvance
		.answers(chosen, decision)
		.find((a) => a.track === 'arts' && a.from === space - 1);
	assert.ok(move, `an advance onto arts ${space}`);
	const state = play(
		chosen,
		player,
		{ decision: decision.id, ...move },
		random
	);
	return { state, random, player, seat: state.seats[player - 1] };
}

/** @param {{ state: any }} result */
const kinds = ({ state }) => openDecisions(state).map((d) => d.kind);

/**
 * Answers the open decision of a kind for the player who advanced.
 * @param {any} r - Changed: its state becomes the new one
 * @param {string} kind
 * @param {Record<string, any>} reply
 */
function reply(r, kind, reply) {
	r.state = answer(r.state, r.random, r.player, kind, reply);
	r.seat = r.state.seats[r.player - 1];
	return r;
}

/** @param {any} r - Changed: every open placement is answered */
function place(r) {
	r.state = placeAll(r.state, r.random);
	r.seat = r.state.seats[r.player - 1];
	return r;
}

test('the advance turn offers the arts track at its tier price', () => {
	const { state, player } = readyTurn(
		2,
		(seat) => {
			seat.tracks.arts = [3];
			seat.resources = { coin: 1, worker: 1, food: 0, culture: 0 };
		},
		AA
	);
	assert.deepEqual(
		advances(state, player).filter((a) => a.track === 'arts'),
		[{ track: 'arts', from: 3, cost: { different: 2 } }]
	);
	const poor = readyTurn(
		2,
		(seat) => {
			seat.tracks.arts = [3];
			seat.resources = { coin: 2, worker: 0, food: 0, culture: 0 };
		},
		AA
	);
	assert.ok(
		!advances(poor.state, poor.player).some((a) => a.track === 'arts')
	);
});

test('a game without the arts track never offers it', () => {
	const { state, player } = readyTurn(2, (seat) => {
		seat.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	});
	assert.ok(advances(state, player).length > 0);
	assert.ok(!advances(state, player).some((a) => a.track === 'arts'));
});

test('arts 1 Cave Paintings: a tapestry card', () => {
	const r = ontoArts(1);
	assert.deepEqual(r.seat.tracks.arts, [1]);
	assert.equal(r.seat.hand.length, 1);
	checkState(r.state);
});

test('arts 2 Flutes: 5 VP; the bonus pays 1 any for an income building of your choice', () => {
	const r = ontoArts(2);
	assert.equal(r.seat.vp, 5);
	reply(r, 'chooseBonus', { pay: { coin: 1 } });
	assert.deepEqual(kinds(r), ['chooseOption']);
	reply(r, 'chooseOption', { option: 0 });
	assert.equal(r.seat.incomeMat.buildings.market, 4);
});

test('the first player into arts tier II takes the Clock Tower before the benefit, then Epic Poetry scores', () => {
	const r = ontoArts(4, (seat, state) => {
		seat.territoryTiles = state.supply.territory.splice(0, 2);
		seat.tech.bottom = state.supply.tech.deck.splice(0, 1);
	});
	const landmarks = openDecisions(r.state)
		.filter((d) => d.kind === 'choosePlacement' && d.landmark)
		.map((d) => d.landmark);
	assert.deepEqual(landmarks, ['clock-tower']);
	assert.ok(!r.state.landmarks.includes('clock-tower'));
	assert.equal(r.seat.vp, 0, 'the benefit waits for the landmark');
	place(r);
	assert.equal(r.seat.vp, 3, '2 territory tiles and 1 tech card');
	checkState(r.state);
});

test('arts 9 Flash Mob: advance on one of the four board tracks, never the arts track (R118)', () => {
	const r = ontoArts(9);
	const [move] = openDecisions(r.state).filter(
		(d) => d.kind === 'chooseMove'
	);
	assert.deepEqual(
		[...new Set(move.options.map((/** @type {any} */ o) => o.track))],
		BOARD
	);
});

test('arts 10 Holocenter: the Holocenter, an income building, then 1 VP per income building (R71)', () => {
	const r = ontoArts(10, (seat) => {
		seat.incomeMat.buildings.house = 3;
	});
	const landmarks = openDecisions(r.state)
		.filter((d) => d.kind === 'choosePlacement' && d.landmark)
		.map((d) => d.landmark);
	assert.deepEqual(landmarks, ['holocenter']);
	place(r);
	reply(r, 'chooseOption', { option: 0 });
	place(r);
	assert.equal(r.seat.vp, 3, '2 houses and the market just gained');
});

test('arts 11 Infinite Spectrum Photography: as Flash Mob', () => {
	const r = ontoArts(11);
	const [move] = openDecisions(r.state).filter(
		(d) => d.kind === 'chooseMove'
	);
	assert.deepEqual(
		[...new Set(move.options.map((/** @type {any} */ o) => o.track))],
		BOARD
	);
});
