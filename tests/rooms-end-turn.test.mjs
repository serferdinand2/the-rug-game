// A turn waits on the player's End turn, and the server ends it 6 seconds later; undo works meanwhile (#146).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	createRoom,
	join,
	nextDeadline,
	play,
	roomView,
	start,
	tick,
	timeout,
} from '../api/rooms.mjs';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play as playGame } from '../src/lib/engine/play.js';
import { readyTurn, answer } from './helpers/engine.mjs';

const timing = {
	minuteMs: 1000,
	declineMinMs: 3000,
	declineMaxMs: 10000,
	endTurnMs: 6000,
};
const P = (id) => ({ id, name: id.toUpperCase() });

/** An online table whose current player has taken income and answered all it asked, so End turn is open. */
function endOpen() {
	const g = readyTurn(2, (_seat, state) => {
		state.confirmEnd = true;
	});
	let state = answer(g.state, g.random, g.player, 'chooseTurn', {
		turn: 'income',
	});
	for (;;) {
		const [open] = openDecisions(state).filter(
			(op) => op.kind !== 'confirmEndTurn'
		);
		if (!open) {
			break;
		}
		const [first] = DECISIONS[open.kind].answers(state, open);
		state = playGame(
			state,
			open.player,
			{ decision: open.id, ...first },
			g.random
		);
	}
	const lobby = join(createRoom('3f9a1c07', P('a'), {}, 0), P('b'));
	const room = { ...start(lobby, 'a', seededRandom(7)), game: state };
	return { room, player: g.player, state };
}

test('6 seconds after End turn opens, the server answers it and the next turn starts', () => {
	const { room, player, state } = endOpen();
	const ticked = tick(room, 1000, timing, seededRandom(1));
	assert.equal(ticked.ends.length, 1);
	assert.deepEqual(
		{ player: ticked.ends[0].player, at: ticked.ends[0].at },
		{ player, at: 7000 }
	);
	assert.equal(nextDeadline(ticked), 7000);
	assert.equal(timeout(ticked, 6999, seededRandom(1)), ticked, 'not yet');
	const after = timeout(ticked, 7000, seededRandom(1));
	assert.equal(after.game.turn, state.turn + 1);
	assert.notEqual(after.game.current, player);
	assert.deepEqual(
		openDecisions(after.game).map((op) => `${op.kind}:${op.player}`),
		['chooseTurn:1']
	);
	assert.deepEqual(tick(after, 7000, timing, seededRandom(1)).ends, []);
});

test('the view tells the screens when the turn will end, and whose', () => {
	const { room, player } = endOpen();
	const ticked = tick(room, 1000, timing, seededRandom(1));
	const view = roomView(ticked, ticked.seats[player - 1].player);
	assert.deepEqual(view.endsTurn, { seat: player, at: 7000 });
});

test('answering End turn by hand ends the turn and leaves nothing to undo', () => {
	const { room, player } = endOpen();
	const ticked = tick(room, 1000, timing, seededRandom(1));
	const confirm = openDecisions(ticked.game).find(
		(op) => op.kind === 'confirmEndTurn'
	);
	const person = ticked.seats[player - 1].player;
	const next = play(
		ticked,
		person,
		player,
		{ decision: confirm.id },
		seededRandom(1)
	);
	assert.notEqual(next.game.current, player);
	assert.deepEqual(next.history, []);
});
