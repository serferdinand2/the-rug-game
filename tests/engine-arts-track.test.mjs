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
import { newGame } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

const AA = { expansions: ['aa'] };

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
