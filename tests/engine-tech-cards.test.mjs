// Every base tech card's circle and square run to the end (#18, 02 §4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { run, contextFor } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { upgradeCard } from '../src/lib/engine/effects/tech.js';
import { TECH_CARDS } from '../src/lib/engine/data/tech-cards.js';
import { startedGame, stubHandoffs } from './helpers/engine.mjs';

/**
 * Answers every open decision with its first answer until none is open.
 * @param {any} state
 * @param {any} random
 * @returns {any}
 */
function answerAll(state, random) {
	for (let step = 0; step < 200; step++) {
		const [open] = openDecisions(state);
		if (!open) {
			return state;
		}
		const first = DECISIONS[open.kind].answers(state, open)[0];
		state = play(
			state,
			/** @type {number} */ (open.player),
			{ decision: open.id, ...first },
			random
		);
	}
	throw new Error('A decision never ended.');
}

for (const card of TECH_CARDS) {
	test(`every base tech card's circle and square run to the end: ${card.name}`, (t) => {
		const handoffs = stubHandoffs();
		t.after(handoffs.restore);
		const { state: started, random } = startedGame(2);
		let state = structuredClone(started);
		state.pending.length = 0;
		const seat = state.seats[0];
		for (const track of Object.keys(seat.tracks)) {
			seat.tracks[track] = [10];
		}
		for (const row of Object.keys(seat.incomeMat.buildings)) {
			seat.incomeMat.buildings[row] = 0;
		}
		seat.tech.bottom = [card.id];
		for (const _ of [1, 2]) {
			upgradeCard(contextFor(state, random, state.pending), 1, card.id);
			run(state, random);
			state = answerAll(state, random);
		}
		const upgraded = state.events.filter(
			(e) => e.type === 'techUpgraded' && e.card === card.id
		);
		assert.equal(upgraded.length, 2);
		assert.ok(
			seat.tech.top.includes(card.id) ||
				state.seats[0].tech.top.includes(card.id)
		);
		const kinds = handoffs.calls.map((c) => c.kind);
		if (card.id === 'printing-press') {
			assert.ok(kinds.includes('tapestryOnTop'));
		}
		if (card.id === 'radio') {
			assert.ok(kinds.includes('gainCiv'));
		}
	});
}
