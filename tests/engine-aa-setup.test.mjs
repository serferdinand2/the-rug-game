// Tests for setup with Arts & Architecture (#36): an advanced mat dealt to each player, kept together with a civilization.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { EXPANSIONS_BUILT, checkOptions } from '../src/lib/engine/setup.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { view } from '../src/lib/engine/view.js';
import { PlayerError } from '../src/lib/engine/errors.js';
import {
	CAPITAL_MATS,
	SMALL_MAP_PAIRS,
} from '../src/lib/engine/data/capitals.js';
import { newGame, answerSetup } from './helpers/engine.mjs';

const AA = { expansions: ['aa'] };

/**
 * A&A's options for a game of `count` players: alone, without the arts track, which needs 2 or more (R59, #35).
 * @param {number} count
 */
const aaFor = (count) =>
	count === 1 ? { ...AA, variants: ['no-arts-track'] } : AA;

/**
 * The open setup picks of a game, in seat order.
 * @param {import('../src/lib/engine/state.js').State} state
 */
function picks(state) {
	return openDecisions(state)
		.filter((d) => d.kind === 'chooseMatAndCiv')
		.sort((a, b) => /** @type {number} */ (a.player) - b.player);
}

test('a table may switch Arts & Architecture on', () => {
	assert.ok(EXPANSIONS_BUILT.includes('aa'));
	assert.doesNotThrow(() =>
		checkOptions({ version: 'current', expansions: ['aa'] })
	);
	assert.doesNotThrow(() =>
		checkOptions({ version: 'current', expansions: ['pp', 'aa'] })
	);
});

test('without A&A, setup is unchanged: a mat and a civilization asked apart', () => {
	for (const count of [2, 4]) {
		const { state } = newGame(count);
		const kinds = openDecisions(state).map((d) => d.kind);
		assert.ok(!kinds.includes('chooseMatAndCiv'));
		assert.ok(kinds.includes('chooseCiv'));
	}
});

test('A&A deals each player one advanced mat, face up, beside their basic mat(s)', () => {
	for (const count of [1, 2, 3, 4, 5]) {
		const { state } = newGame(count, aaFor(count));
		const asked = picks(state);
		assert.equal(asked.length, count, `${count} players`);
		const advanced = asked.map((d) => d.mats.at(-1));
		assert.equal(new Set(advanced).size, count);
		for (const d of asked) {
			assert.ok(d.mats.at(-1) >= 7 && d.mats.at(-1) <= 12);
			const basic = d.mats.slice(0, -1);
			if (state.map === 'small') {
				assert.ok(
					SMALL_MAP_PAIRS.some(
						(pair) => pair[0] === basic[0] && pair[1] === basic[1]
					)
				);
			} else {
				assert.equal(basic.length, 1);
			}
			assert.equal(d.civs.length, 2);
			// The start is the basic mat's (R40: alone, always 2/4).
			const seat = state.seats[/** @type {number} */ (d.player) - 1];
			const start =
				count === 1
					? '0_2'
					: state.map === 'small'
						? CAPITAL_MATS[basic[0] - 1].start.small
						: CAPITAL_MATS[basic[0] - 1].start.large;
			assert.equal(seat.start, start);
		}
		const dealt = state.events.filter((e) => e.type === 'capitalDealt');
		assert.deepEqual(
			dealt.map((e) => e.advanced),
			advanced
		);
		// Every mat is somewhere once: dealt, or in the supply.
		assert.deepEqual(
			[...asked.flatMap((d) => d.mats), ...state.supply.capitals].sort(
				(a, b) => a - b
			),
			[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
		);
	}
});

test('the joint pick hides the civilizations from the others until the reveal', () => {
	for (const count of [2, 4]) {
		const { state, random } = newGame(count, AA);
		const mine = picks(state)[0];
		const seen = view(state, 2).pending;
		const json = JSON.stringify(seen);
		assert.ok(json.includes('"mats"'));
		for (const civ of mine.civs) {
			assert.ok(!json.includes(`"${civ}"`), `${civ} leaks`);
		}
		const kept = { capital: mine.mats.at(-1), civ: mine.civs[1] };
		let next = play(state, 1, { decision: mine.id, ...kept }, random);
		assert.equal(next.seats[0].capital.mat, null);
		for (const d of picks(next)) {
			next = play(
				next,
				/** @type {number} */ (d.player),
				{
					decision: d.id,
					...DECISIONS.chooseMatAndCiv.answers(next, d)[0],
				},
				random
			);
		}
		const revealed = next.events.find((e) => e.type === 'setupRevealed');
		assert.deepEqual(revealed?.picks[0], {
			seat: 1,
			capital: kept.capital,
			civ: kept.civ,
		});
		assert.equal(next.seats[0].capital.mat, kept.capital);
		// The mats nobody kept are in the supply, every one of the twelve once.
		const held = next.seats.map((s) => s.capital.mat);
		assert.deepEqual(
			[...held, ...next.supply.capitals].sort((a, b) => a - b),
			[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
		);
	}
});

test('R120: under the current rules, the Riverfolk may not keep Cloud City', () => {
	for (const version of /** @type {const} */ (['current', 'original'])) {
		const { state, random } = newGame(2, { ...AA, version });
		const pick = picks(state)[0];
		pick.mats[pick.mats.length - 1] = 10;
		pick.civs[0] = 'riverfolk';
		const offered = DECISIONS.chooseMatAndCiv
			.answers(state, pick)
			.some((a) => a.capital === 10 && a.civ === 'riverfolk');
		const answer = { decision: pick.id, capital: 10, civ: 'riverfolk' };
		if (version === 'current') {
			assert.ok(!offered);
			assert.throws(
				() => play(state, 1, answer, random),
				(error) =>
					error instanceof PlayerError &&
					error.message ===
						'Under the current rules, the Riverfolk may not keep Cloud City.'
			);
		} else {
			assert.ok(offered);
			assert.doesNotThrow(() => play(state, 1, answer, random));
		}
	}
});

test('a mat or civilization not dealt is refused', () => {
	const { state, random } = newGame(2, AA);
	const pick = picks(state)[0];
	const other = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find(
		(n) => !pick.mats.includes(n)
	);
	assert.throws(
		() =>
			play(
				state,
				1,
				{ decision: pick.id, capital: other, civ: pick.civs[0] },
				random
			),
		PlayerError
	);
	assert.throws(
		() =>
			play(
				state,
				1,
				{ decision: pick.id, capital: pick.mats[0], civ: 'nobody' },
				random
			),
		PlayerError
	);
});

test('an A&A game plays on from the setup defaults', () => {
	for (const count of [1, 3, 5]) {
		const { state, random } = newGame(count, aaFor(count));
		const started = answerSetup(state, random);
		assert.equal(started.phase, 'play');
		assert.ok(started.seats.every((s) => s.capital.mat !== null));
	}
});
