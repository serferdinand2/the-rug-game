// Tests for the tech deck, the face-up display and inventing (#18, 01 §9.1, FAQ #11 and #24).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, contextFor } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { pay } from '../src/lib/engine/payment.js';
import { TECH_CARDS } from '../src/lib/engine/data/tech-cards.js';
import { startedGame, readyTurn, answer, placeAll } from './helpers/engine.mjs';

/**
 * A started 2-player game where seat 1 runs an invent effect.
 * @param {object} value - The invent effect's value
 * @param {(state: any) => void} [fill] - Changes the state first
 */
function inventGame(value, fill = () => {}) {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	fill(state);
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ invent: value }] },
	]);
	run(state, random);
	return { state, random };
}

/** @param {any} state */
const inventing = (state) =>
	openDecisions(state).filter((d) => d.kind === 'chooseInvent').length;

/** @param {any} state */
const decision = (state) => openDecisions(state)[0];

/**
 * @param {any} state
 * @param {string} type
 */
const events = (state, type) => state.events.filter((e) => e.type === type);

test('inventing a face-up card puts it in the bottom row and refills the display', () => {
	const { state, random } = inventGame({});
	const open = decision(state);
	assert.equal(open.kind, 'chooseInvent');
	const [first, , third] = state.supply.tech.faceUp;
	const top = state.supply.tech.deck[0];
	const next = play(state, 1, { decision: open.id, card: third }, random);
	assert.deepEqual(next.seats[0].tech.bottom, [third]);
	assert.deepEqual(next.supply.tech.faceUp.length, 3);
	assert.ok(next.supply.tech.faceUp.includes(first));
	assert.equal(next.supply.tech.faceUp[2], top);
	assert.equal(inventing(next), 0);
	const invented = events(next, 'techInvented').at(-1);
	assert.equal(invented.player, 1);
	assert.equal(invented.card, third);
});

test('inventing from the deck takes the top card', () => {
	const { state, random } = inventGame({});
	const before = state.supply.tech.deck.length;
	const top = state.supply.tech.deck[0];
	const faceUp = [...state.supply.tech.faceUp];
	const next = play(
		state,
		1,
		{ decision: decision(state).id, card: 'deck' },
		random
	);
	assert.equal(next.supply.tech.deck.length, before - 1);
	assert.deepEqual(next.seats[0].tech.bottom, [top]);
	assert.deepEqual(next.supply.tech.faceUp, faceUp);
	assert.equal(events(next, 'techInvented').at(-1).from, 'deck');
});

test('an empty deck is reshuffled from the discards (FAQ #24)', () => {
	const { state, random } = inventGame({}, (s) => {
		s.supply.tech.discard = s.supply.tech.deck.splice(0);
	});
	assert.equal(state.supply.tech.deck.length, 0);
	const discards = [...state.supply.tech.discard];
	const next = play(
		state,
		1,
		{ decision: decision(state).id, card: 'deck' },
		random
	);
	assert.deepEqual(
		events(next, 'techDeckShuffled').at(-1).count,
		discards.length
	);
	assert.equal(next.supply.tech.discard.length, 0);
	assert.ok(discards.includes(next.seats[0].tech.bottom[0]));
	assert.equal(next.supply.tech.deck.length, discards.length - 1);
});

test('with nothing to invent, nothing happens', () => {
	const { state } = inventGame({}, (s) => {
		s.supply.tech.faceUp = [];
		s.supply.tech.deck = [];
		s.supply.tech.discard = [];
	});
	assert.equal(events(state, 'noInvent').length, 1);
	assert.equal(events(state, 'noInvent')[0].player, 1);
	assert.equal(inventing(state), 0);
});

test('a single option is invented automatically', () => {
	const { state } = inventGame({}, (s) => {
		s.supply.tech.faceUp = [];
		s.supply.tech.discard = [];
		s.supply.tech.deck = [s.supply.tech.deck[0]];
	});
	assert.equal(state.seats[0].tech.bottom.length, 1);
	assert.equal(events(state, 'techInvented').at(-1).from, 'deck');
	assert.equal(inventing(state), 0);
});

test('Rubber may refresh first, then invents 2', () => {
	const ready = readyTurn(2, (seat) => {
		seat.tracks.technology = [6];
		seat.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	});
	const { random, player } = ready;
	const chosen = answer(ready.state, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	const [adv] = openDecisions(chosen);
	const move = DECISIONS.chooseAdvance
		.answers(chosen, adv)
		.find((a) => a.track === 'technology' && a.from === 6);
	let state = play(chosen, player, { decision: adv.id, ...move }, random);
	state = placeAll(state, random);
	const open = openDecisions(state).find((d) => d.kind === 'chooseInvent');
	assert.deepEqual([open.left, open.refresh], [2, true]);
	const old = [...state.supply.tech.faceUp];
	const first = DECISIONS.chooseInvent.answers(state, open);
	assert.deepEqual(first.at(-1), { refresh: true });
	state = play(state, player, { decision: open.id, refresh: true }, random);
	assert.equal(state.supply.tech.faceUp.length, 3);
	assert.ok(old.every((c) => !state.supply.tech.faceUp.includes(c)));
	assert.ok(old.every((c) => state.supply.tech.discard.includes(c)));
	const refreshed = events(state, 'techDisplayRefreshed').at(-1);
	assert.deepEqual(refreshed.discarded, old);
	assert.deepEqual(refreshed.faceUp, state.supply.tech.faceUp);
	const again = openDecisions(state).find((d) => d.kind === 'chooseInvent');
	assert.deepEqual([again.left, again.refresh], [2, false]);
	assert.ok(
		!DECISIONS.chooseInvent.answers(state, again).some((a) => a.refresh)
	);
	const card = state.supply.tech.faceUp[0];
	state = play(state, player, { decision: again.id, card }, random);
	const second = openDecisions(state).find((d) => d.kind === 'chooseInvent');
	assert.deepEqual([second.left, second.refresh], [1, false]);
	state = play(state, player, { decision: second.id, card: 'deck' }, random);
	assert.equal(state.seats[player - 1].tech.bottom.length, 2);
	assert.equal(state.seats[player - 1].tech.bottom[0], card);
});

test('Rubber with nothing left for the second card stops quietly', () => {
	const { state, random } = inventGame({ count: 2, refresh: true }, (s) => {
		s.supply.tech.faceUp = s.supply.tech.faceUp.slice(0, 1);
		s.supply.tech.deck = [];
		s.supply.tech.discard = [];
	});
	// One card and a refresh: two answers, so it asks.
	const open = decision(state);
	const next = play(
		state,
		1,
		{ decision: open.id, card: open.id && state.supply.tech.faceUp[0] },
		random
	);
	assert.equal(next.seats[0].tech.bottom.length, 1);
	assert.equal(events(next, 'noInvent').length, 1);
	assert.equal(inventing(next), 0);
});

test('a refresh with fewer than 3 cards to deal shows only what it could deal', () => {
	const { state, random } = inventGame({ refresh: true }, (s) => {
		s.supply.tech.deck = s.supply.tech.deck.slice(0, 1);
	});
	const old = [...state.supply.tech.faceUp];
	const next = play(
		state,
		1,
		{ decision: decision(state).id, refresh: true },
		random
	);
	// Discarded first, so the lone deck card and the old cards are reshuffled: 3 dealt.
	assert.equal(next.supply.tech.faceUp.length, 3);
	assert.equal(
		next.supply.tech.faceUp.length +
			next.supply.tech.deck.length +
			next.supply.tech.discard.length,
		old.length + 1
	);
});

test('every tech card stays accounted for', () => {
	let { state, random } = inventGame({ count: 3, refresh: true });
	/** @param {any} s */
	const check = (s) => {
		const { deck, faceUp, discard } = s.supply.tech;
		const all = [
			...deck,
			...faceUp,
			...discard,
			...s.seats.flatMap((/** @type {any} */ seat) =>
				seat.tech
					? [
							...seat.tech.bottom,
							...seat.tech.middle,
							...seat.tech.top,
						]
					: []
			),
		];
		assert.deepEqual([...all].sort(), TECH_CARDS.map((c) => c.id).sort());
		assert.equal(new Set(faceUp).size, faceUp.length);
	};
	check(state);
	// Refresh, then two cards from the display and the deck.
	state = play(
		state,
		1,
		{ decision: decision(state).id, refresh: true },
		random
	);
	check(state);
	state = play(
		state,
		1,
		{ decision: decision(state).id, card: state.supply.tech.faceUp[1] },
		random
	);
	check(state);
	state = play(
		state,
		1,
		{ decision: decision(state).id, card: 'deck' },
		random
	);
	check(state);
	// Run the deck dry to force a reshuffle: put the rest into the discards.
	state = structuredClone(state);
	state.supply.tech.discard.push(...state.supply.tech.deck.splice(0));
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ invent: { count: 3 } }] },
	]);
	run(state, random);
	state = play(
		state,
		1,
		{ decision: decision(state).id, card: 'deck' },
		random
	);
	assert.equal(events(state, 'techDeckShuffled').length, 1);
	check(state);
	// Nanotechnology's bonus pays 3 tech cards into the discards (FAQ #11).
	state = structuredClone(state);
	const mine = state.seats[0].tech.bottom.splice(0, 3);
	state.seats[0].tech.bottom.push(...mine);
	pay(contextFor(state, random, state.pending), 1, { tech: mine });
	assert.equal(state.seats[0].tech.bottom.length, 0);
	check(state);
});

test('an answer not offered is refused', () => {
	const { state, random } = inventGame({ refresh: true });
	const open = decision(state);
	/** @param {Record<string, any>} reply @param {any} s */
	const tries = (reply, s = state) =>
		assert.throws(
			() => play(s, 1, { decision: open.id, ...reply }, random),
			{ name: 'PlayerError', message: "You can't invent that card." },
			JSON.stringify(reply)
		);
	tries({});
	tries({ card: 'not-a-card' });
	tries({ card: 'bakery', refresh: true });
	// After the first card a refresh is no longer offered.
	const two = inventGame({ count: 2, refresh: true });
	const next = play(
		two.state,
		1,
		{
			decision: decision(two.state).id,
			card: two.state.supply.tech.faceUp[0],
		},
		two.random
	);
	assert.throws(
		() =>
			play(
				next,
				1,
				{ decision: decision(next).id, refresh: true },
				two.random
			),
		{ name: 'PlayerError', message: "You can't invent that card." }
	);
	// 'deck' with nothing to draw.
	const dry = inventGame({}, (s) => {
		s.supply.tech.deck = [];
		s.supply.tech.discard = [];
	});
	assert.throws(
		() =>
			play(
				dry.state,
				1,
				{ decision: decision(dry.state).id, card: 'deck' },
				dry.random
			),
		{ name: 'PlayerError', message: "You can't invent that card." }
	);
});
