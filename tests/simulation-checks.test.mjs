// Tests for the simulation's own checks: they pass on real games and catch every planted break (#21 design §5).
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkState } from './helpers/invariants.mjs';
import { newGame, startedGame } from './helpers/engine.mjs';

/** @typedef {import('../src/lib/engine/state.js').State} State */

test('the state checks pass on new and started games of every size', () => {
	for (const count of [1, 2, 3, 4, 5]) {
		checkState(newGame(count).state);
		checkState(startedGame(count).state);
	}
});

/**
 * A started 2-player game with one thing broken.
 * @param {(state: any) => void} breakIt
 * @returns {State}
 */
function broken(breakIt) {
	const state = structuredClone(startedGame(2).state);
	breakIt(state);
	return state;
}

const BREAKS = /** @type {[string, (state: any) => void, RegExp][]} */ ([
	[
		'a tech card in two places',
		(s) => s.supply.tech.discard.push(s.supply.tech.deck[0]),
		/tech cards/,
	],
	[
		'a lost tapestry card',
		(s) => s.supply.tapestry.deck.pop(),
		/tapestry cards/,
	],
	[
		'a lost territory tile',
		(s) => s.supply.territory.pop(),
		/territory tiles/,
	],
	['a lost space tile', (s) => s.supply.space.pop(), /space tiles/],
	['a lost landmark', (s) => s.landmarks.pop(), /landmarks/],
	['a lost civilization', (s) => s.supply.civs.pop(), /civilizations/],
	['a lost capital mat', (s) => s.supply.capitals.pop(), /capital mats/],
	[
		'a lost income building',
		(s) => (s.seats[0].incomeMat.buildings.farm = 4),
		/seat 1.*farm/,
	],
	['a lost outpost', (s) => (s.seats[1].outposts = 7), /seat 2.*outposts/],
	['a resource over the cap', (s) => (s.seats[0].resources.coin = 9), /coin/],
	['a VP that is not whole', (s) => (s.seats[0].vp = 1.5), /VP/],
	[
		'a token off the track',
		(s) => (s.seats[0].tracks.science = [13]),
		/science/,
	],
	['a gap in the event numbers', (s) => (s.events.at(-1).seq += 1), /seq/],
	[
		'an era card that is not on the mat',
		(s) => (s.seats[0].era = { card: 'monarchy', ability: 'monarchy' }),
		/era/,
	],
	[
		'an era on a finished player',
		(s) => {
			s.seats[1].finished = true;
			s.seats[1].era = { card: null, ability: 'espionage' };
		},
		/finished.*era/,
	],
	[
		'a game in play with nothing to answer',
		(s) => (s.pending.length = 0),
		/no decision is open/,
	],
	[
		'two decisions with one id',
		(s) => s.pending.push({ ...s.pending[0] }),
		/decision ids/,
	],
]);

for (const [what, breakIt, message] of BREAKS) {
	test(`the state checks catch ${what}`, () => {
		assert.throws(() => checkState(broken(breakIt)), message);
	});
}

test('the state checks catch an event numbered below the previous state', () => {
	const { state } = startedGame(2);
	assert.throws(() => checkState(state, state.seq + 1), /seq/);
});

test("the state checks count the Traders' and Isolationists' tokens", () => {
	for (const civ of ['traders', 'isolationists']) {
		const { state } = startedGame(2, { civs: [civ, 'leaders'] });
		checkState(state);
		const lost = structuredClone(state);
		lost.seats[0].civData[civ].tokens -= 1;
		assert.throws(() => checkState(lost), new RegExp(`${civ} tokens`));
	}
});
