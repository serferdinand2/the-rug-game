// Tests for play(), the setup reveal and the first turn (#13, task 4).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { play, PlayerError } from '../src/lib/engine/game.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { newGame, startedGame, answerSetup } from './helpers/engine.mjs';

const answerOf = (state, decision) => ({
	decision: decision.id,
	...DECISIONS[decision.kind].answers(state, decision)[0],
});

test('players may answer their setup picks in any order', () => {
	const { state: start, random } = newGame(3, { seed: 5 });
	let state = start;
	for (const seat of [3, 1, 2]) {
		const mine = openDecisions(state)
			.filter((d) => d.player === seat)
			.reverse();
		for (const decision of mine) {
			state = play(state, seat, answerOf(state, decision), random);
		}
	}
	// A civilization's setup may still ask for a resource; the reveal has happened.
	assert.equal(answerSetup(state, random).phase, 'play');
});

test('every pick stays hidden until the last one, then setupRevealed shows them all', () => {
	const { state: start, random } = newGame(2);
	let state = start;
	const all = openDecisions(state);
	const last = all.pop();
	for (const decision of all) {
		state = play(state, decision.player, answerOf(state, decision), random);
	}
	assert.equal(state.phase, 'setup');
	const lastSeat = state.seats.find((s) => s.seat === last.player);
	assert.equal(lastSeat.capital.mat, null);
	for (const seat of state.seats.filter((s) => s.seat !== last.player)) {
		assert.deepEqual(seat.civs, []);
		assert.equal(seat.capital.mat, null);
		assert.ok(
			seat.picks.civ !== undefined || seat.picks.capital !== undefined
		);
	}
	state = play(state, last.player, answerOf(state, last), random);
	const reveal = state.events.find((e) => e.type === 'setupRevealed');
	assert.equal(reveal.picks.length, 2);
	for (const seat of state.seats) {
		assert.equal(seat.civs.length, 1);
		assert.notEqual(seat.capital.mat, null);
		assert.deepEqual(seat.picks, {});
		const entry = reveal.picks.find((p) => p.seat === seat.seat);
		assert.equal(entry.civ, seat.civs[0]);
		assert.equal(entry.capital, seat.capital.mat);
	}
});

test('the other mat of each pair goes face up only at the reveal', () => {
	const { state: start, random } = newGame(2);
	const before = [...start.supply.capitals];
	let state = start;
	const all = openDecisions(state);
	const last = all.filter((d) => d.kind === 'chooseCapital').pop();
	for (const decision of all) {
		if (decision === last) {
			continue;
		}
		state = play(state, decision.player, answerOf(state, decision), random);
		assert.deepEqual(state.supply.capitals, before);
	}
	state = play(state, last.player, answerOf(state, last), random);
	assert.equal(state.supply.capitals.length, before.length + 2);
});

test('after setup the unkept civilizations form the civilization deck (01 §2.2 step 3)', () => {
	for (const n of [1, 2, 4]) {
		// Real deals: startedGame() puts its inert civilizations back into the deck.
		const { state: dealt, random } = newGame(n);
		const state = answerSetup(dealt, random);
		assert.equal(state.supply.civs.length, 16 - n);
		for (const seat of state.seats.filter((s) => s.kind === 'player')) {
			assert.ok(!state.supply.civs.includes(seat.civs[0]));
		}
		assert.ok(
			state.events.some(
				(e) => e.type === 'deckShuffled' && e.deck === 'civs'
			)
		);
	}
});

test('when setup ends, every seat takes income turn 1 in turn order, and nobody is asked (01 §4.1, #77)', () => {
	const { state } = startedGame(3, { keepIncome: true });
	const first = /** @type {number} */ (state.first);
	const order = [0, 1, 2].map((i) => ((first - 1 + i) % 3) + 1);
	assert.deepEqual(
		state.events
			.filter((e) =>
				['turnStarted', 'turnChosen', 'incomeTurnStarted'].includes(
					e.type
				)
			)
			.map((e) => [e.type, e.player]),
		[
			...order.flatMap((p) => [
				['turnStarted', p],
				['turnChosen', p],
				['incomeTurnStarted', p],
			]),
			['turnStarted', first],
		]
	);
	for (const seat of state.seats) {
		assert.equal(seat.incomeTurns, 1);
	}
	assert.equal(state.current, first);
	assert.deepEqual(
		openDecisions(state).map((d) => [d.kind, d.player, d.options]),
		[['chooseTurn', first, ['income', 'advance']]]
	);
});

test('the automatic income turn 1 emits turnChosen with turn income, so the log still reads as before (#77)', () => {
	const { state } = startedGame(2, { keepIncome: true });
	const chosen = state.events.filter((e) => e.type === 'turnChosen');
	assert.equal(chosen.length, 2);
	for (const event of chosen) {
		assert.equal(event.turn, 'income');
	}
});

test("answering another player's choice is refused", () => {
	const { state, random } = newGame(2);
	const d = openDecisions(state).find((x) => x.player === 1);
	assert.throws(() => play(state, 2, answerOf(state, d), random), {
		name: 'PlayerError',
		message: /another player/,
	});
});

test('an unknown, answered or not-yet-open choice is refused', () => {
	const { state, random } = newGame(2);
	assert.throws(
		() => play(state, 1, { decision: 999 }, random),
		/no longer open/
	);
	const d = openDecisions(state).find((x) => x.player === 1);
	const next = play(state, 1, answerOf(state, d), random);
	assert.throws(
		() => play(next, 1, { decision: d.id }, random),
		/no longer open/
	);

	const { state: started, random: r2 } = startedGame(2);
	const turn = openDecisions(started)[0];
	const clone = structuredClone(started);
	clone.pending.unshift({
		id: 900,
		batch: 900,
		player: turn.player,
		kind: 'chooseTurn',
		options: ['income'],
	});
	assert.throws(
		() =>
			play(clone, turn.player, { decision: turn.id, turn: 'income' }, r2),
		/isn't open yet/
	);
});

test('a malformed action or a seat not in the game is refused', () => {
	const { state, random } = newGame(2);
	const d = openDecisions(state).find((x) => x.player === 1);
	const validAction = answerOf(state, d);
	for (const action of [
		null,
		{},
		{ decision: '7' },
		{ decision: 1.5 },
		'civ',
	]) {
		assert.throws(() => play(state, 1, action, random), {
			name: 'PlayerError',
		});
	}
	assert.throws(() => play(state, 9, validAction, random), {
		name: 'PlayerError',
	});
});

test('an option that was not offered is refused', () => {
	const { state, random } = newGame(2);
	const civ = openDecisions(state).find(
		(x) => x.player === 1 && x.kind === 'chooseCiv'
	);
	assert.throws(
		() => play(state, 1, { decision: civ.id, civ: 'nobody' }, random),
		{ name: 'PlayerError' }
	);
	const cap = openDecisions(state).find(
		(x) => x.player === 1 && x.kind === 'chooseCapital'
	);
	const bad = [1, 2, 3, 4, 5, 6].find((m) => !cap.options.includes(m));
	assert.throws(
		() => play(state, 1, { decision: cap.id, capital: bad }, random),
		{ name: 'PlayerError' }
	);
});

test('play never changes the state it was given, even when it throws', () => {
	const { state, random } = newGame(2);
	const before = structuredClone(state);
	const decision = openDecisions(state)[0];
	play(state, decision.player, answerOf(state, decision), random);
	assert.throws(() =>
		play(
			state,
			decision.player,
			{ decision: decision.id, civ: 'nobody' },
			random
		)
	);
	assert.deepEqual(state, before);
});

test('a finished game refuses every action', () => {
	const { state, random } = newGame(2);
	const over = structuredClone(state);
	over.phase = 'over';
	const d = openDecisions(over)[0];
	assert.throws(() => play(over, d.player, answerOf(over, d), random), {
		name: 'PlayerError',
		message: /finished/,
	});
});
