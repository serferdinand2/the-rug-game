// Every base tech card's circle and square run to the end (#18, 02 §4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run, contextFor } from '../src/lib/engine/loop.js';
import { upgradeCard } from '../src/lib/engine/effects/tech.js';
import { TECH_CARDS } from '../src/lib/engine/data/tech-cards.js';
import {
	startedGame,
	stubHandoffs,
	answerDefaults,
} from './helpers/engine.mjs';

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
		// In era 2, Printing Press's square has a slot to play its card on (R25).
		if (card.id === 'printing-press') {
			seat.incomeTurns = 2;
		}
		for (const _ of [1, 2]) {
			upgradeCard(contextFor(state, random, state.pending), 1, card.id);
			run(state, random);
			state = answerDefaults(state, random);
		}
		const upgraded = state.events.filter(
			(e) => e.type === 'techUpgraded' && e.card === card.id
		);
		assert.equal(upgraded.length, 2);
		assert.ok(state.seats[0].tech.top.includes(card.id));
		const kinds = handoffs.calls.map((c) => c.kind);
		if (card.id === 'printing-press') {
			// The circle drew a card, and the square played it on top of era 2.
			const [drawn] = state.events.filter(
				(e) => e.type === 'tapestryPlayed'
			);
			assert.ok(drawn, 'a card was played');
			assert.deepEqual(
				[drawn.player, drawn.era, drawn.faceDown],
				[1, 2, false]
			);
			assert.deepEqual(state.seats[0].incomeMat.tapestry[1], [
				drawn.card,
			]);
		}
		if (card.id === 'radio') {
			assert.ok(kinds.includes('gainCiv'));
		}
	});
}
