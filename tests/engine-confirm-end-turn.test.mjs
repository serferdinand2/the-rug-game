// A turn waits on a one-answer decision before it ends, so the player can see the outcome and undo (#146).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readyTurn, answer } from './helpers/engine.mjs';
import { openDecisions } from '../src/lib/engine/stack.js';
import { play } from '../src/lib/engine/play.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';

/** The turn of an income-only table: `chooseTurn` offers income and the player takes it. */
function incomeTaken() {
	const game = readyTurn(2, (_seat, state) => {
		state.confirmEnd = true;
	});
	const state = answer(game.state, game.random, game.player, 'chooseTurn', {
		turn: 'income',
	});
	return { ...game, state: untilConfirm(state, game.random) };
}

/** Answers what the turn asks with the first answer, and stops at the confirmation. */
function untilConfirm(state, random) {
	for (let step = 0; step < 100; step++) {
		const [open] = openDecisions(state).filter(
			(op) => op.kind !== 'confirmEndTurn'
		);
		if (!open) {
			return state;
		}
		const [first] = DECISIONS[open.kind].answers(state, open);
		state = play(
			state,
			open.player,
			{ decision: open.id, ...first },
			random
		);
	}
	throw new Error('The turn never reached its end.');
}

test('the last choice of a turn leaves the player a confirmEndTurn, not the next turn', () => {
	const { state, player } = incomeTaken();
	const open = openDecisions(state);
	const confirm = open.find((op) => op.kind === 'confirmEndTurn');
	assert.ok(confirm, 'the turn waits to be ended');
	assert.equal(confirm.player, player);
	assert.equal(state.current, player, 'the turn has not passed');
});

test('answering confirmEndTurn starts the next seat’s turn', () => {
	const { state, random, player } = incomeTaken();
	const next = answer(state, random, player, 'confirmEndTurn', {});
	assert.notEqual(next.current, player);
	assert.equal(next.turn, state.turn + 1);
});

test('confirmEndTurn has one answer, and nobody else may give it', () => {
	const { state, player } = incomeTaken();
	const confirm = openDecisions(state).find(
		(op) => op.kind === 'confirmEndTurn'
	);
	assert.ok(confirm);
	assert.throws(() =>
		play(state, 3 - player, { decision: confirm.id }, () => 0)
	);
});

test('a table that does not ask for confirmation passes the turn at once, as before', () => {
	const game = readyTurn(2);
	assert.equal(game.state.confirmEnd, false);
	const state = untilConfirm(
		answer(game.state, game.random, game.player, 'chooseTurn', {
			turn: 'income',
		}),
		game.random
	);
	assert.ok(!openDecisions(state).some((op) => op.kind === 'confirmEndTurn'));
});

test('End turn is not open beside the turn choice, only after the turn is done', () => {
	const game = readyTurn(2, (_seat, state) => {
		state.confirmEnd = true;
	});
	assert.deepEqual(
		openDecisions(game.state).map((op) => op.kind),
		['chooseTurn']
	);
});
