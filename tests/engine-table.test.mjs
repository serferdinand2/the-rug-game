// Tests for what the table needs from the engine: the turn number, who is asked, default answers, decline-only responses, revealed(), timedOut() and restore() (#24).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	askedSeats,
	defaultAction,
	declineOnly,
	revealed,
	view,
	timedOut,
	restore,
	play,
} from '../src/lib/engine/game.js';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { emit } from '../src/lib/engine/events.js';
import {
	newGame,
	startedGame,
	readyTurn,
	conquestGame,
} from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

/**
 * Answers a seat's open decision with its default action.
 * @param {any} state
 * @param {any} random
 * @param {number} seat
 */
function playDefault(state, random, seat) {
	return play(
		state,
		seat,
		/** @type {any} */ (defaultAction(state, seat)),
		random
	);
}

test('the turn number is 0 in setup and rises by 1 with each turn', () => {
	const { state: fresh } = newGame(2);
	assert.equal(fresh.turn, 0);
	const { state: started, random } = startedGame(2);
	assert.equal(started.turn, 1);
	// Income turn 1 ends the turn, and the next seat starts turn 2.
	const next = playDefault(
		started,
		random,
		/** @type {number} */ (started.current)
	);
	assert.equal(next.turn, 2);
	assert.notEqual(next.current, started.current);
});

test('the default action takes an income turn, and a seat with nothing open has none', () => {
	const { state } = startedGame(2);
	const current = /** @type {number} */ (state.current);
	const action = /** @type {any} */ (defaultAction(state, current));
	const [decision] = openDecisions(state);
	assert.equal(action.decision, decision.id);
	assert.equal(action.turn, 'income');
	assert.equal(defaultAction(state, current === 1 ? 2 : 1), null);
});

test('askedSeats lists both players in setup, and the turn player once play starts', () => {
	const { state: fresh } = newGame(2);
	assert.deepEqual(askedSeats(fresh), [1, 2]);
	const { state } = startedGame(2);
	assert.deepEqual(askedSeats(state), [state.current]);
});

test('a defender holding cards but no trap is listed as decline-only, and a trap holder is not', () => {
	const trap = conquestGame(['trap-3']);
	const idle = conquestGame([trap.supply.tapestry.deck[0]]);
	for (const state of [trap, idle]) {
		push(state, state.pending, [
			{ player: 1, kind: 'effects', effects: [{ conquer: {} }] },
		]);
		run(state, () => 0);
	}
	assert.deepEqual(declineOnly(trap), []);
	const [question] = openDecisions(idle).filter(
		(d) => d.kind === 'chooseResponse'
	);
	assert.deepEqual(declineOnly(idle), [{ decision: question.id, player: 2 }]);
});

test('revealed: answering a placement reveals nothing', () => {
	const { state, random } = startedGame(2);
	const player = /** @type {number} */ (state.current);
	const asked = resolveEffects(state, player, [{ building: 'farm' }], random);
	assert.equal(openDecisions(asked)[0].kind, 'choosePlacement');
	const placed = playDefault(asked, random, player);
	assert.equal(revealed(asked, placed), false);
});

/**
 * Every path in the supply where view() turns an array into a count, found by comparing view() with the state.
 * @param {any} state
 * @returns {string[][]}
 */
function hiddenSupplyPaths(state) {
	/** @type {string[][]} */
	const found = [];
	const walk = (
		/** @type {any} */ real,
		/** @type {any} */ seen,
		/** @type {string[]} */ path
	) => {
		if (Array.isArray(real) && typeof seen === 'number') {
			found.push(path);
		} else if (real && typeof real === 'object' && !Array.isArray(real)) {
			for (const key of Object.keys(real)) {
				walk(real[key], seen[key], [...path, key]);
			}
		}
	};
	walk(state.supply, view(state, 1).supply, []);
	return found;
}

test('revealed: every part view() hides counts', () => {
	const { state: before } = startedGame(2);
	/** @type {[string, (s: any) => void][]} */
	const changes = [
		...hiddenSupplyPaths(before).map(
			(path) =>
				/** @type {[string, (s: any) => void]} */ ([
					`supply.${path.join('.')}`,
					(s) => path.reduce((o, key) => o[key], s.supply).push('x'),
				])
		),
		['a hand', (s) => s.seats[0].hand.push('x')],
		['a pick', (s) => (s.seats[1].picks = { capital: 3 })],
		['the face-down cards', (s) => s.seats[0].incomeMat.faceDown.push('x')],
		[
			'a secret event',
			(s) => emit(s, { type: 'drew', player: 1, secret: { card: 'x' } }),
		],
	];
	assert.ok(hiddenSupplyPaths(before).length >= 5);
	assert.equal(revealed(before, structuredClone(before)), false);
	for (const [name, change] of changes) {
		const after = structuredClone(before);
		change(after);
		assert.equal(revealed(before, after), true, name);
	}
});

test('revealed: a secret event from before the action does not count', () => {
	const { state } = startedGame(2);
	const before = structuredClone(state);
	emit(before, { type: 'drew', player: 1, secret: { card: 'x' } });
	const after = structuredClone(before);
	emit(after, { type: 'plain', player: 1 });
	assert.equal(revealed(before, after), false);
});

test('revealed: a hidden decision field alone does not count', () => {
	const { state: before } = startedGame(2);
	const after = structuredClone(before);
	const player = /** @type {number} */ (after.current);
	push(after, after.pending, [
		{
			player,
			kind: 'chooseTapestry',
			options: [.../** @type {any} */ (after.seats[player - 1]).hand],
		},
	]);
	assert.equal(revealed(before, after), false);
});

test('restore takes the game back and keeps the numbers rising', () => {
	const { state: before, random } = readyTurn(2);
	const player = /** @type {number} */ (before.current);
	const current = playDefault(before, random, player);
	assert.ok(current.seq > before.seq);
	const restored = restore(before, current, player);
	const { seq, events, nextId, ...rest } = restored;
	const { seq: _s, events: _e, nextId: _n, ...original } = before;
	assert.deepEqual(rest, original);
	assert.equal(seq, current.seq + 1);
	assert.deepEqual(events.at(-1), {
		type: 'undone',
		player,
		from: before.seq + 1,
		seq: current.seq + 1,
	});
	assert.ok(nextId >= current.nextId);
	checkState(restored, current.seq);
	// The inputs are left alone.
	assert.notEqual(restored, before);
	assert.equal(before.events.at(-1)?.seq, before.seq);
});

test('timedOut adds one event and changes nothing else', () => {
	const { state } = startedGame(2);
	const next = timedOut(state, 2);
	assert.equal(next.seq, state.seq + 1);
	assert.deepEqual(next.events.at(-1), {
		type: 'timedOut',
		player: 2,
		seq: state.seq + 1,
	});
	const { seq, events, ...rest } = next;
	const { seq: _s, events: _e, ...original } = state;
	assert.deepEqual(rest, original);
	assert.equal(events.length, state.events.length + 1);
	assert.equal(state.events.at(-1)?.seq, state.seq);
	checkState(next, state.seq);
});

test('checkState rejects an undone event whose numbers go backwards', () => {
	const { state: before, random } = readyTurn(2);
	const player = /** @type {number} */ (before.current);
	const current = playDefault(before, random, player);
	const restored = restore(before, current, player);
	checkState(restored, current.seq);
	const backwards = structuredClone(restored);
	/** @type {any} */ (backwards.events.at(-1)).seq = before.seq;
	assert.throws(() => checkState(backwards, 0));
	const ahead = structuredClone(restored);
	/** @type {any} */ (ahead.events.at(-1)).from = before.seq + 5;
	assert.throws(() => checkState(ahead, 0));
	const below = structuredClone(restored);
	/** @type {any} */ (below.events.at(-1)).from = before.seq;
	assert.throws(() => checkState(below, 0));
});
