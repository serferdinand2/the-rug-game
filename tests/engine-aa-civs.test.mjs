// Arts & Architecture's 5 civilizations (#37 part 3), numbers as 03 §2.4: the deck, then each civilization.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	AA_CIVS,
	BASE_CIVS,
	PP_CIVS,
	civsFor,
} from '../src/lib/engine/decks.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { endTurn } from '../src/lib/engine/turn.js';
import { emit } from '../src/lib/engine/events.js';
import { answer, answerDefaults, startedGame } from './helpers/engine.mjs';
import { AA } from './helpers/arts.mjs';

/**
 * A started A&A game for 3 players, seat 1 holding `civ`, its pending stack cleared, after `fill` changes it.
 * @param {string} civ
 * @param {(state: any) => void} [fill]
 * @param {Record<string, any>} [options]
 */
function holding(civ, fill = () => {}, options = {}) {
	const { state, random } = startedGame(3, {
		...AA,
		...options,
		civs: [civ, 'leaders', 'nomads'],
	});
	state.pending.length = 0;
	fill(state);
	return { state, random };
}

/**
 * Ends seat 1's turn of a kind, as the engine does once the turn's work is done, and runs what follows until a
 * question.
 * @param {any} state
 * @param {any} random
 * @param {'advance' | 'income'} kind
 * @param {string[]} [gained] - Event types emitted during the turn first, such as 'buildingGained'
 */
function endOf(state, random, kind, gained = []) {
	state.current = 1;
	state.turnKind = kind;
	emit(state, { type: 'turnStarted', player: 1 });
	for (const type of gained) {
		emit(state, { type, player: 1, building: 'farm', landmark: 'forge' });
	}
	endTurn(contextFor(state, random, state.pending), {
		id: 0,
		batch: 0,
		player: 1,
		kind: 'endTurn',
	});
	run(state, random);
	return state;
}

// The deck

test("A&A's civilizations join its deck after the base and P&P ones, as they are built", () => {
	assert.deepEqual(civsFor([]), [...BASE_CIVS]);
	assert.deepEqual(civsFor(['pp']), [...BASE_CIVS, ...PP_CIVS]);
	assert.deepEqual(civsFor(['aa']), [...BASE_CIVS, ...AA_CIVS]);
	assert.deepEqual(civsFor(['pp', 'aa']), [
		...BASE_CIVS,
		...PP_CIVS,
		...AA_CIVS,
	]);
	assert.ok(AA_CIVS.includes('relentless'));
	// The one-expansion variant stays Plans & Ploys' (#37 design §4).
	assert.deepEqual(civsFor(['pp', 'aa'], ['civs-from-pp']), [...PP_CIVS]);
});

// The Relentless

test('the Relentless: a token at the end of an income or advance turn on which a building or landmark was gained', () => {
	const { state, random } = holding('relentless');
	const tokens = () => state.seats[0].civData.relentless.tokens;
	assert.equal(tokens(), 0);
	endOf(state, random, 'income', ['buildingGained']);
	assert.equal(tokens(), 1);
	state.pending.length = 0;
	endOf(state, random, 'advance', ['landmarkGained']);
	assert.equal(tokens(), 2);
	// An income turn without a building keeps them.
	state.pending.length = 0;
	endOf(state, random, 'income');
	assert.equal(tokens(), 2);
});

test('the Relentless: an advance turn without one cashes them in: 2 tokens are 3 VP and a tapestry card', () => {
	const { state, random } = holding('relentless', (s) => {
		s.seats[0].civData.relentless.tokens = 2;
	});
	const vp = state.seats[0].vp;
	const hand = state.seats[0].hand.length;
	endOf(state, random, 'advance');
	assert.equal(state.seats[0].civData.relentless.tokens, 0);
	assert.equal(state.seats[0].vp, vp + 3);
	assert.equal(state.seats[0].hand.length, hand + 1);
});

test("the Relentless' chart: 1, 3, 6, 10 and 15 VP, with a choice of extras from 3 tokens (R62: the teal icon is explore)", () => {
	/** @type {[number, number, number][]} */
	const chart = [
		[1, 1, 0],
		[3, 6, 2],
		[4, 10, 3],
		[5, 15, 4],
		[7, 15, 4],
	];
	for (const [count, vp, extras] of chart) {
		const { state, random } = holding('relentless', (s) => {
			s.seats[0].civData.relentless.tokens = count;
		});
		const before = state.seats[0].vp;
		endOf(state, random, 'advance');
		assert.equal(state.seats[0].vp, before + vp, `${count} tokens`);
		const [choice] = openDecisions(state);
		if (extras === 0) {
			assert.notEqual(choice?.kind, 'chooseOption', `${count} tokens`);
			continue;
		}
		assert.equal(choice.kind, 'chooseOption', `${count} tokens`);
		assert.deepEqual(
			choice.options,
			[
				[{ gain: { tapestry: 1 } }],
				[{ gain: { any: 1 } }],
				[{ explore: {} }],
				[{ invent: {} }],
			].slice(0, extras),
			`${count} tokens`
		);
		const next = answer(state, random, 1, 'chooseOption', { option: 0 });
		assert.equal(next.seats[0].civData.relentless.tokens, 0);
	}
});

// The Renegades

test('the Renegades: an advance into a tier that matches their next space may take it instead of the benefit and bonus (03 §2.4)', () => {
	const { state, random } = holding('renegades', (s) => {
		s.seats[0].territoryTiles = [];
	});
	assert.deepEqual(state.seats[0].civData.renegades, { at: 0 });
	const moved = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['exploration'] } }],
		random
	);
	const [decision] = openDecisions(moved);
	assert.equal(decision.kind, 'chooseRenegades');
	assert.deepEqual(DECISIONS.chooseRenegades.answers(moved, decision), [
		{ renegades: false },
		{ renegades: true },
	]);
	// Space I: a tapestry card and an income building of your choice, instead of Scouting's 2 territory tiles.
	const hand = moved.seats[0].hand.length;
	const taken = answerDefaults(
		answer(moved, random, 1, 'chooseRenegades', { renegades: true }),
		random
	);
	assert.deepEqual(taken.seats[0].civData.renegades, { at: 1 });
	assert.equal(taken.seats[0].hand.length, hand + 1);
	assert.deepEqual(taken.seats[0].territoryTiles, []);
	assert.ok(
		!taken.events.some(
			(/** @type {any} */ e) =>
				e.type === 'spaceActivated' && e.track === 'exploration'
		)
	);
	const kept = answer(moved, random, 1, 'chooseRenegades', {
		renegades: false,
	});
	assert.equal(kept.seats[0].territoryTiles.length, 2);
	assert.deepEqual(kept.seats[0].civData.renegades, { at: 0 });
});

test("the Renegades: no offer when the tiers don't match, without a benefit, or going back", () => {
	const offered = (
		/** @type {Record<string, any>} */ effect,
		/** @type {(s: any) => void} */ fill
	) => {
		const { state, random } = holding('renegades', fill);
		const moved = resolveEffects(state, 1, [effect], random);
		return openDecisions(moved).some((d) => d.kind === 'chooseRenegades');
	};
	const at =
		(/** @type {number} */ space, /** @type {number} */ renegades) =>
		(/** @type {any} */ s) => {
			s.seats[0].tracks.technology = [space];
			s.seats[0].civData.renegades.at = renegades;
			// Taken already, so no placement asks first.
			s.landmarks = [];
		};
	// Into tier II (space 4) while the next Renegades space is I.
	assert.equal(
		offered({ advance: { tracks: ['technology'] } }, at(3, 0)),
		false
	);
	assert.equal(
		offered({ advance: { tracks: ['technology'] } }, at(3, 1)),
		true
	);
	// Within tier II.
	assert.equal(
		offered({ advance: { tracks: ['technology'] } }, at(4, 1)),
		true
	);
	assert.equal(
		offered(
			{ advance: { tracks: ['technology'], noBenefit: true } },
			at(3, 1)
		),
		false
	);
	assert.equal(
		offered({ regress: { tracks: ['technology'] } }, at(5, 1)),
		false
	);
});

test("the Renegades' last space: 20 VP, and their track's end counts for completing a track", () => {
	const { state, random } = holding('renegades', (s) => {
		s.seats[0].tracks.military = [9];
		s.seats[0].civData.renegades.at = 3;
		s.landmarks = [];
	});
	const vp = state.seats[0].vp;
	const moved = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['military'] } }],
		random
	);
	const done = answer(moved, random, 1, 'chooseRenegades', {
		renegades: true,
	});
	assert.deepEqual(done.seats[0].civData.renegades, { at: 4 });
	assert.deepEqual(done.achievements['complete-track'], [1]);
	// 20 VP and the achievement's first box (10 VP on the small map).
	assert.equal(done.seats[0].vp, vp + 20 + 10);
});
