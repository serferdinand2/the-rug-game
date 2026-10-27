// Tests for players finishing at different times and the end of the game (#15; 01 §4.3).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { play } from '../src/lib/engine/play.js';
import { rankPlayers } from '../src/lib/engine/ranking.js';
import { startedGame, readyTurn, answer } from './helpers/engine.mjs';

/**
 * A 2-player game where the current player has taken `mine` income turns and the other `theirs`.
 * @param {number} mine
 * @param {number} theirs
 * @param {(seat: any, other: any) => void} [fill]
 */
function lateGame(mine, theirs, fill = () => {}) {
	const ready = readyTurn(2, (seat, state) => {
		const other = state.seats.find((s) => s !== seat);
		seat.incomeTurns = mine;
		other.incomeTurns = theirs;
		fill(seat, other);
	});
	return { ...ready, other: ready.player === 1 ? 2 : 1 };
}

test('a finished player is skipped while the others play on', () => {
	const g = lateGame(4, 2);
	let state = answer(g.state, g.random, g.player, 'chooseTurn', {
		turn: 'income',
	});
	assert.equal(state.seats[g.player - 1].finished, true);
	assert.equal(state.current, g.other);
	state = answer(state, g.random, g.other, 'chooseTurn', { turn: 'income' });
	assert.equal(state.current, g.other, 'the finished seat is skipped');
	assert.deepEqual(
		openDecisions(state).map((d) => [d.kind, d.player]),
		[['chooseTurn', g.other]]
	);
	assert.equal(state.phase, 'play');
});

test('the game ends when the last player finishes, with the ranking stored and announced', () => {
	const g = lateGame(4, 4, (seat, other) => {
		seat.vp = 10;
		other.vp = 5;
	});
	let state = answer(g.state, g.random, g.player, 'chooseTurn', {
		turn: 'income',
	});
	assert.equal(state.phase, 'play');
	state = answer(state, g.random, g.other, 'chooseTurn', { turn: 'income' });
	assert.equal(state.phase, 'over');
	assert.equal(state.current, null);
	assert.deepEqual(state.pending, []);
	assert.deepEqual(state.result, rankPlayers(state));
	assert.deepEqual(
		state.result?.ranking.map((p) => p.seat),
		[g.player, g.other]
	);
	const [finished, ended] = state.events.slice(-2);
	assert.deepEqual(
		[finished.type, finished.player, ended.type],
		['playerFinished', g.other, 'gameEnded']
	);
	assert.deepEqual(ended.result, state.result);
});

test('once the game is over, no action is accepted', () => {
	const g = lateGame(4, 5, (seat, other) => {
		other.finished = true;
	});
	const over = answer(g.state, g.random, g.player, 'chooseTurn', {
		turn: 'income',
	});
	assert.equal(over.phase, 'over');
	assert.throws(
		() => play(over, g.player, { decision: 1, turn: 'income' }, g.random),
		{ name: 'PlayerError', message: /finished/ }
	);
});

test('an effect for a finished player does nothing, and one marked passive still gains its VP', () => {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	state.seats[1].finished = true;
	const before = state.events.length;
	push(state, state.pending, [
		{
			player: 2,
			kind: 'effects',
			effects: [{ gain: { coin: 2 } }, { vp: 3 }],
		},
	]);
	run(state, random);
	assert.equal(state.seats[1].resources.coin, 0);
	assert.equal(state.seats[1].vp, 0);
	assert.equal(state.events.length, before);
	push(state, state.pending, [
		{ player: 2, kind: 'effects', effects: [{ vp: 3 }], passive: true },
	]);
	run(state, random);
	assert.equal(state.seats[1].vp, 3);
});

test('a passive effect for a finished player keeps its mark through a choice, and only its VP runs (#20 design §4)', () => {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	state.seats[1].finished = true;
	// A choice in a finished player's passive effect is skipped like every other part but VP.
	const before = state.events.length;
	push(state, state.pending, [
		{
			player: 2,
			kind: 'effects',
			effects: [{ choice: [[{ vp: 2 }], [{ vp: 5 }]] }],
			passive: true,
		},
	]);
	run(state, random);
	assert.equal(state.events.length, before);
	assert.ok(!openDecisions(state).some((d) => d.kind === 'chooseOption'));
	// A choice already asked keeps the mark, so its VP still reaches the finished player.
	push(state, state.pending, [
		{
			player: 2,
			kind: 'chooseOption',
			options: [[{ vp: 2 }], [{ vp: 5 }, { gain: { coin: 1 } }]],
			passive: true,
		},
	]);
	const after = answer(state, random, 2, 'chooseOption', { option: 1 });
	assert.equal(after.seats[1].vp, 5);
	assert.equal(after.seats[1].resources.coin, 0);
});

test('a passive effect for a finished player keeps its mark through a choice of order, and only its VP runs (#20 design §4)', () => {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	state.seats[1].finished = true;
	// With only VP left, nothing is asked.
	push(state, state.pending, [
		{
			player: 2,
			kind: 'effects',
			effects: [{ upgrade: {} }, { techBenefit: { icon: 'circle' } }],
			ordered: false,
			passive: true,
		},
	]);
	run(state, random);
	assert.ok(!openDecisions(state).some((d) => d.kind === 'chooseOrder'));
	push(state, state.pending, [
		{
			player: 2,
			kind: 'chooseOrder',
			effects: [{ upgrade: {} }, { vp: 3 }],
			passive: true,
		},
	]);
	const after = answer(state, random, 2, 'chooseOrder', { effect: 0 });
	// Both parts kept the mark: the upgrade was skipped, and the VP ran.
	assert.equal(after.seats[1].vp, 3);
	assert.ok(
		!after.events.some(
			(e) =>
				(e.type === 'noUpgrade' || e.type === 'techUpgraded') &&
				e.player === 2
		)
	);
});
