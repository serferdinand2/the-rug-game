// Plans & Ploys' tapestry cards (#33; 03 §1.4): what each does played as a tapestry card, the Stadium, and the deck.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { tapestryCard } from '../src/lib/engine/data/tapestry-cards.js';
import { landmarksFor } from '../src/lib/engine/data/landmarks.js';
import {
	startedGame,
	resolveTapestry,
	answerDefaults,
} from './helpers/engine.mjs';

const PP = { expansions: ['pp'] };

/**
 * A started two-player Plans & Ploys game in era 2 where nothing is pending, seat 1 holding 2 of each resource.
 * @returns {{ state: any, random: any }}
 */
function ppGame() {
	const { state: started, random } = startedGame(2, PP);
	const state = /** @type {any} */ (structuredClone(started));
	state.pending.length = 0;
	state.seats[0].resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	state.seats[0].incomeTurns = 2;
	return { state, random };
}

/**
 * Plays a card for seat 1, answering its own questions with `pick` or their first answer.
 * @param {string} card
 * @param {(decision: any) => Record<string, any> | undefined} [pick]
 */
function played(card, pick = () => undefined) {
	const { state, random } = ppGame();
	let next = resolveTapestry(state, random, 1, card);
	for (let step = 0; step < 50; step++) {
		const [open] = openDecisions(next);
		if (!open) {
			break;
		}
		const answer =
			pick(open) ?? DECISIONS[open.kind].answers(next, open)[0];
		next = play(
			next,
			/** @type {number} */ (open.player),
			{ decision: open.id, ...answer },
			random
		);
	}
	return { before: state, after: next };
}

test('the five response cards are Plans & Ploys cards that answer a conquest or a trap', () => {
	for (const id of ['retreat', 'surprise-party', 'surrender']) {
		assert.equal(tapestryCard(id).response, 'conquest', id);
		assert.equal(tapestryCard(id).expansion, 'pp', id);
	}
	for (const id of ['double-cross', 'stolen-plans']) {
		assert.equal(tapestryCard(id).response, 'trap', id);
	}
	assert.equal(tapestryCard('trap-4').response, 'conquest');
	assert.equal(tapestryCard('trap').expansion, 'base');
	assert.equal(tapestryCard('academia').response, undefined);
});

test('the five response cards played as tapestry cards gain their printed reward (R45)', () => {
	const vp = (/** @type {any} */ s) => s.seats[0].vp;
	{
		const { before, after } = played('double-cross');
		assert.equal(vp(after) - vp(before), 9);
		assert.equal(
			after.seats[0].territoryTiles.length -
				before.seats[0].territoryTiles.length,
			1
		);
	}
	{
		const { before, after } = played('retreat');
		assert.equal(vp(after) - vp(before), 9);
		assert.equal(
			after.seats[0].hand.length - before.seats[0].hand.length,
			1
		);
	}
	{
		const { before, after } = played('stolen-plans');
		const techs = (/** @type {any} */ s) =>
			Object.values(s.seats[0].tech).flat().length;
		assert.equal(vp(after) - vp(before), 8);
		assert.equal(techs(after) - techs(before), 1);
	}
	{
		const { before, after } = played('surrender');
		const held = (/** @type {any} */ s) =>
			Object.values(s.seats[0].resources).reduce(
				(/** @type {number} */ a, /** @type {number} */ b) => a + b,
				0
			);
		assert.equal(vp(after) - vp(before), 7);
		assert.equal(held(after) - held(before), 1);
	}
	{
		const { before, after } = played('surprise-party');
		assert.equal(vp(after) - vp(before), 10);
	}
	{
		const { before, after } = played('surprise-party', (d) =>
			d.kind === 'chooseOption' ? { option: 1 } : undefined
		);
		assert.equal(vp(after) - vp(before), 0);
		assert.equal(
			before.seats[0].incomeMat.buildings.armory -
				after.seats[0].incomeMat.buildings.armory,
			1
		);
	}
});

test('Entertain the Masses gains the Stadium and places it; a copy finds none left', () => {
	const { after } = played('entertain-the-masses');
	assert.ok(!after.landmarks.includes('stadium'));
	const seat = after.seats[0];
	assert.ok(
		seat.capital.landmarks.some(
			(/** @type {any} */ l) => l.landmark === 'stadium'
		) || seat.besideMat.includes('stadium')
	);
	assert.ok(
		after.events.some(
			(/** @type {any} */ e) =>
				e.type === 'landmarkGained' &&
				e.landmark === 'stadium' &&
				e.tapestry === 'entertain-the-masses'
		)
	);
	const { random } = ppGame();
	const again = answerDefaults(
		resolveTapestry(after, random, 1, 'entertain-the-masses', 3),
		random
	);
	assert.ok(
		again.events.some(
			(/** @type {any} */ e) =>
				e.type === 'noLandmarkLeft' && e.landmark === 'stadium'
		)
	);
});

test('a Plans & Ploys game has 25 landmarks with the Stadium, a base game 18', () => {
	assert.equal(landmarksFor([]).length, 18);
	assert.equal(landmarksFor(['pp']).length, 25);
	assert.ok(landmarksFor(['pp']).some((l) => l.id === 'stadium'));
	const { state } = ppGame();
	assert.ok(state.landmarks.includes('stadium'));
});
