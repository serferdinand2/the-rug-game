// Every base tapestry card's ability runs to the end from a busy mid-game seat (#19, design §8).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { TAPESTRY_CARDS } from '../src/lib/engine/data/tapestry-cards.js';
import {
	startedGame,
	resolveTapestry,
	answerDefaults,
} from './helpers/engine.mjs';

/**
 * Takes these cards out of a deck.
 * @param {string[]} deck
 * @param {string[]} cards
 */
const takeOut = (deck, cards) =>
	deck.filter((/** @type {string} */ c) => !cards.includes(c));

/**
 * A started 3-player game in era 2 where seat 1 has something of everything, and nothing is pending.
 * Seat 2 is ahead on every track and has a trap on its era-2 slot (R22); seat 3 is behind on two tracks.
 * @param {string} card - The card under test, taken out of the deck
 * @returns {{ state: any, random: any }}
 */
function busyGame(card) {
	const { state: started, random } = startedGame(3);
	const state = /** @type {any} */ (structuredClone(started));
	state.pending.length = 0;
	const [me, ahead, behind] = state.seats;
	me.tracks = {
		exploration: [4],
		science: [5],
		technology: [4],
		military: [5],
	};
	ahead.tracks = {
		exploration: [6],
		science: [6],
		technology: [6],
		military: [6],
	};
	behind.tracks = {
		exploration: [2],
		science: [7],
		technology: [2],
		military: [8],
	};
	me.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	me.territoryTiles = state.supply.territory.splice(0, 2);
	const { tapestry, tech } = state.supply;
	tapestry.deck = takeOut(tapestry.deck, [card, 'trap-1']);
	me.hand = tapestry.deck.splice(0, 2);
	me.tech = {
		bottom: ['calendar'],
		middle: ['canned-food'],
		top: ['transistors'],
	};
	tech.deck = takeOut(tech.deck, ['calendar', 'canned-food', 'transistors']);
	// A tile hex seat 1 controls, beside its printed start territory '0_2'.
	state.hexes['-1_2'] = {
		tile: state.supply.territory.shift(),
		orient: 0,
		outposts: [{ seat: 1, toppled: false }],
	};
	me.outposts -= 1;
	me.incomeTurns = 2;
	ahead.incomeTurns = 2;
	ahead.incomeMat.tapestry[1] = ['trap-1'];
	behind.incomeTurns = 1;
	return { state, random };
}

for (const card of TAPESTRY_CARDS) {
	test(`every base tapestry card's ability runs to the end: ${card.name}`, () => {
		// The trap is played as one of its 7 copies (R22).
		const id = card.id === 'trap' ? 'trap-2' : card.id;
		const { state, random } = busyGame(id);
		const played = resolveTapestry(state, random, 1, id);
		const done = answerDefaults(played, random);
		assert.deepEqual(openDecisions(done), []);
		assert.ok(
			done.events.some(
				(e) =>
					e.type === 'tapestryPlayed' &&
					e.player === 1 &&
					e.card === id
			)
		);
		const seat = /** @type {any} */ (done.seats[0]);
		assert.equal(seat.era?.ability === card.id, card.timing === 'era');
	});
}
