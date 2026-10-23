// Tests for play(), the setup reveal and the first turn (#13, task 4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { play, PlayerError } from '../src/lib/engine/game.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { newGame, startedGame } from './helpers/engine.mjs';

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
	assert.equal(state.phase, 'play');
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
		const { state } = startedGame(n);
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

test('the first player starts by choosing a turn, and only income is legal (01 §4.1)', () => {
	const { state } = startedGame(4);
	assert.equal(state.current, state.first);
	assert.deepEqual(
		openDecisions(state).map((d) => [d.kind, d.player, d.options]),
		[['chooseTurn', state.first, ['income']]]
	);
	assert.deepEqual(
		state.events.slice(-2).map((e) => e.type),
		['setupDone', 'turnStarted']
	);
});

test('advancing on a first turn is refused', () => {
	const { state, random } = startedGame(3);
	const d = openDecisions(state)[0];
	assert.throws(
		() =>
			play(state, d.player, { decision: d.id, turn: 'advance' }, random),
		/first turn must be an income turn/
	);
});

test('a legal turn choice is not built until #15', () => {
	const { state, random } = startedGame(3);
	const d = openDecisions(state)[0];
	assert.throws(
		() => play(state, d.player, { decision: d.id, turn: 'income' }, random),
		(error) => error instanceof Error && !(error instanceof PlayerError)
	);
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
