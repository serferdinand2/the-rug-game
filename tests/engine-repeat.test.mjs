// Tests for repeating a track space (Academic Research), the once-per-turn limit, and AI Singularity (#14).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { isActivated, spacesAdvanced } from '../src/lib/engine/movement.js';
import { readyTurn, answer, placeAll, startedGame } from './helpers/engine.mjs';

/**
 * Chooses an advance turn, then answers chooseAdvance.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {Record<string, any>} move
 */
function advance(state, random, player, move) {
	const next = answer(state, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	return answer(next, random, player, 'chooseAdvance', move);
}

test('R19: Academic Research repeats any current space except itself', () => {
	const { state, random, player } = readyTurn(2, (seat) => {
		seat.tracks = {
			exploration: [1],
			science: [6],
			technology: [0],
			military: [3],
		};
		seat.resources.worker = 3;
	});
	const advanced = advance(state, random, player, {
		track: 'science',
		from: 6,
		pay: { worker: 3 },
	});
	// The Academy is placed before the space's benefit (FAQ #1).
	const [place] = openDecisions(advanced);
	assert.deepEqual(
		[place.kind, place.player, place.landmark],
		['choosePlacement', player, 'academy']
	);
	const next = placeAll(advanced, random);
	const [repeat] = openDecisions(next);
	assert.equal(repeat.kind, 'chooseRepeat');
	assert.deepEqual(DECISIONS.chooseRepeat.answers(next, repeat), [
		{ track: 'exploration', space: 1 },
		{ track: 'military', space: 3 },
	]);
	const after = answer(next, random, player, 'chooseRepeat', {
		track: 'exploration',
		space: 1,
	});
	assert.equal(after.seats[player - 1].territoryTiles.length, 2);
	assert.throws(
		() =>
			answer(next, random, player, 'chooseRepeat', {
				track: 'science',
				space: 7,
			}),
		{ name: 'PlayerError' }
	);
});

test('R19: a space activated this turn cannot be repeated, but one an opponent activated can', () => {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	Object.assign(state.seats[0].tracks, { exploration: [1], military: [3] });
	state.activated.push(
		{ player: 1, track: 'exploration', space: 1 },
		{ player: 2, track: 'military', space: 3 }
	);
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ repeat: {} }] },
	]);
	run(state, random);
	// Walls: the only space left to repeat, so it runs without asking.
	const [walls] = openDecisions(state);
	assert.equal(walls.kind, 'chooseOption');
	assert.equal(isActivated(state, 1, 'military', 3), true);
});

test('activations are per player, and every turn starts with nothing activated', () => {
	const { state, random, player } = readyTurn(2, (seat) => {
		seat.resources.coin = 1;
	});
	const other = player === 1 ? 2 : 1;
	push(state, state.pending, [
		{
			player: other,
			kind: 'effects',
			effects: [{ advance: { tracks: ['exploration'] } }],
		},
	]);
	run(state, random);
	assert.equal(isActivated(state, other, 'exploration', 1), true);
	const next = advance(state, random, player, {
		track: 'exploration',
		from: 0,
		pay: { coin: 1 },
	});
	assert.equal(next.seats[player - 1].territoryTiles.length, 2);
	assert.equal(next.current, other);
	assert.deepEqual(next.activated, []);
});

test('AI Singularity moves the token to the start of any track, and technology still counts 12 (FAQ #9)', () => {
	const { state, random, player } = readyTurn(2, (seat) => {
		seat.tracks.technology = [11];
		seat.tracks.exploration = [5];
		seat.resources.coin = 2;
	});
	const next = advance(state, random, player, {
		track: 'technology',
		from: 11,
		pay: { coin: 2 },
	});
	const [restart] = openDecisions(next);
	assert.equal(restart.kind, 'chooseRestart');
	assert.deepEqual(DECISIONS.chooseRestart.answers(next, restart), [
		{ track: 'exploration' },
		{ track: 'science' },
		{ track: 'technology' },
		{ track: 'military' },
	]);
	const seat = next.seats[player - 1];
	assert.deepEqual(seat.resources, {
		coin: 1,
		worker: 1,
		food: 1,
		culture: 1,
	});
	const after = answer(next, random, player, 'chooseRestart', {
		track: 'exploration',
	});
	const moved = after.seats[player - 1];
	assert.deepEqual(moved.tracks.technology, []);
	assert.deepEqual(moved.tracks.exploration, [5, 0]);
	assert.deepEqual(moved.restartedTracks, ['technology']);
	assert.equal(spacesAdvanced(moved, 'technology'), 12);
	assert.ok(
		after.events.some(
			(e) =>
				e.type === 'tokenRestarted' &&
				e.player === player &&
				e.from === 'technology' &&
				e.to === 'exploration'
		)
	);
	assert.throws(
		() => answer(next, random, player, 'chooseRestart', { track: 'arts' }),
		{ name: 'PlayerError' }
	);
});

test('after AI Singularity, Academic Research cannot repeat it (FAQ #9)', () => {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	state.seats[0].tracks.technology = [];
	state.seats[0].restartedTracks = ['technology'];
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ repeat: {} }] },
	]);
	const before = state.events.length;
	run(state, random);
	assert.deepEqual(state.events.slice(before), []);
	assert.ok(!openDecisions(state).some((d) => d.kind === 'chooseRepeat'));
});
