// Tests for the simulation's own checks: they pass on real games and catch every planted break (#21 design §5).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { checkState } from './helpers/invariants.mjs';
import { allOps } from './helpers/views.mjs';
import { newGame, startedGame } from './helpers/engine.mjs';
import { GAMES, gameOf, simulate } from './helpers/simulation.mjs';
import { VARIANTS } from '../src/lib/engine/game.js';

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
	[
		'an open decision with no legal answer',
		(s) =>
			(s.pending[0] = {
				...s.pending[0],
				kind: 'chooseCiv',
				options: [],
			}),
		/no legal answer/,
	],
	[
		'a building on a Craftsmen column out of nowhere',
		(s) => (s.seats[0].civData.craftsmen = [['farm'], [], []]),
		/seat 1.*farm/,
	],
	[
		'a Nomads piece out of nowhere',
		(s) => {
			const hex = Object.values(s.hexes).find((h) => h.outposts.length);
			hex.outposts.push({
				seat: 1,
				toppled: false,
				piece: { building: 'farm' },
			});
		},
		/seat 1.*farm/,
	],
]);

test('the state checks count the pieces that pending placements hold', () => {
	const { state } = startedGame(2);
	const placing = structuredClone(state);
	const landmark = /** @type {string} */ (placing.landmarks.pop());
	placing.seats[0].incomeMat.buildings.farm -= 1;
	// Under an open decision, as a second landmark of one Socialism jump would wait.
	placing.pending.push(
		{ id: 9001, batch: 9001, player: 1, kind: 'placeLandmark', landmark },
		{
			id: 9002,
			batch: 9002,
			player: 1,
			kind: 'placeBuilding',
			building: 'farm',
		}
	);
	checkState(placing);
});

test('the state checks follow civilizations and mats through setup', () => {
	for (const count of [2, 4]) {
		const lostCiv = structuredClone(newGame(count).state);
		const pick = allOps(lostCiv).find((op) => op.kind === 'chooseCiv');
		pick.options.pop();
		assert.throws(() => checkState(lostCiv), /civilizations/);
	}
	const lostMat = structuredClone(newGame(2).state);
	allOps(lostMat)
		.find((op) => op.kind === 'chooseCapital')
		.options.pop();
	assert.throws(() => checkState(lostMat), /capital mats/);
});

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

test('the 200 games cover every player count, version and policy 10 times, 5 of them with every variant, 2 of those 5 with Plans & Ploys', () => {
	/** @type {Map<string, number>} */
	const combos = new Map();
	/** @type {Map<string, number>} */
	const withPp = new Map();
	for (let index = 0; index < GAMES; index++) {
		const { seed, players, version, policy, variants, expansions } =
			gameOf(index);
		assert.equal(seed, index + 1);
		assert.ok(variants.length === 0 || variants.length === VARIANTS.length);
		assert.ok(expansions.length === 0 || expansions[0] === 'pp');
		const key = `${players} ${version} ${policy} ${variants.length}`;
		combos.set(key, (combos.get(key) ?? 0) + 1);
		withPp.set(key, (withPp.get(key) ?? 0) + expansions.length);
	}
	assert.equal(GAMES, 200);
	assert.equal(combos.size, 5 * 2 * 2 * 2);
	assert.ok([...combos.values()].every((n) => n === 5));
	assert.ok([...withPp.values()].every((n) => n === 2));
});

test('a simulated game ends with every player finished and ranked', () => {
	// Every player answers at least one turn choice for each of their 5 income turns.
	for (const index of [0, 15, 24]) {
		const { actions } = simulate(index);
		const { players } = gameOf(index);
		assert.ok(
			actions >= 5 * players,
			`game ${index + 1} took ${actions} actions`
		);
	}
});

test('a failing game names its seed and how to replay it', () => {
	let calls = 0;
	const check = () => {
		calls += 1;
		if (calls === 4) {
			throw new Error('planted');
		}
	};
	assert.throws(
		() => simulate(0, { check }),
		(/** @type {Error} */ error) => {
			assert.match(
				error.message,
				/^seed 1, 1 players, original, random play, no variants, action 3 \(\w+\): planted\n/
			);
			assert.match(
				error.message,
				/Replay: SIM_SEED=1 npx vitest run tests\/simulation.test.mjs$/
			);
			return true;
		}
	);
});

test("the first check sees createGame()'s events as new, so the setup events are searched for leaks too", () => {
	/** @type {(State | null)[]} */
	const befores = [];
	const check = (
		/** @type {State} */ _state,
		/** @type {State | null} */ before
	) => {
		befores.push(before);
		if (befores.length === 2) {
			throw new Error('enough');
		}
	};
	assert.throws(() => simulate(0, { check }), /enough/);
	assert.equal(befores[0], null);
	assert.ok(befores[1]);
});
