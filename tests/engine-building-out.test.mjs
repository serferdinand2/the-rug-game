// R117 (#181): an option that would only gain income buildings none of which is left can't be picked, nor a bonus
// for one, so a player never throws a benefit away unwarned (FAQ #23).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { PlayerError, openDecisions, play } from '../src/lib/engine/game.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { buildingsOut } from '../src/lib/engine/effects/building.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { startedGame } from './helpers/engine.mjs';

/**
 * A started 2-player game where seat 1 has `left` of each income building, and runs `ops` for seat 1.
 * @param {Record<string, number>} left
 * @param {Record<string, any>[]} ops
 */
function game(left, ops) {
	const { state, random } = startedGame(2);
	const seat = state.seats[0];
	Object.assign(seat.incomeMat.buildings, left);
	seat.resources = { coin: 3, worker: 3, food: 3, culture: 3 };
	state.pending.length = 0;
	push(
		state,
		state.pending,
		ops.map((op) => ({ player: 1, ...op }))
	);
	run(state, random);
	const [open] = openDecisions(state);
	return { state, random, open };
}

/** Biology's choice: research, or a House. */
const BIOLOGY = [[{ research: {} }], [{ building: 'house' }]];

test('R117: an option that only gains a building with none left is not among the answers', () => {
	const { state, open } = game({ house: 0 }, [
		{ kind: 'effects', effects: [{ choice: BIOLOGY }] },
	]);
	assert.equal(open.kind, 'chooseOption');
	// The one option left is still asked, so the player sees the House greyed out (owner, #181).
	assert.deepEqual(DECISIONS.chooseOption.answers(state, open), [
		{ option: 0 },
	]);
});

test('R117: answering an option whose building is used up throws a PlayerError', () => {
	const { state, random, open } = game({ house: 0 }, [
		{ kind: 'effects', effects: [{ choice: BIOLOGY }] },
	]);
	assert.throws(
		() => play(state, 1, { decision: open.id, option: 1 }, random),
		(error) =>
			error instanceof PlayerError &&
			error.message === 'You have no House left.'
	);
});

test('R117: with a building left, every option is offered as before', () => {
	const { state, open } = game({ house: 1 }, [
		{ kind: 'effects', effects: [{ choice: BIOLOGY }] },
	]);
	assert.deepEqual(DECISIONS.chooseOption.answers(state, open), [
		{ option: 0 },
		{ option: 1 },
	]);
});

test('R117: when every option is out, nothing is asked and the log says which buildings were missing', () => {
	const glass = [
		[{ building: 'farm' }],
		[{ building: 'house' }],
		[{ building: 'armory' }],
	];
	const { state, open } = game({ farm: 0, house: 0, armory: 0 }, [
		{ kind: 'effects', effects: [{ choice: glass }] },
	]);
	assert.equal(open, undefined);
	const { seq: _seq, ...event } = state.events.at(-1);
	assert.deepEqual(event, {
		type: 'noBuildingLeft',
		player: 1,
		building: null,
		buildings: ['farm', 'house', 'armory'],
	});
});

test('R117: an option with something besides the building stays, as does one of two buildings with one left', () => {
	const { state } = startedGame(2);
	Object.assign(state.seats[0].incomeMat.buildings, { farm: 0, house: 1 });
	assert.deepEqual(buildingsOut(state, 1, [{ building: 'farm' }]), ['farm']);
	assert.equal(buildingsOut(state, 1, [{ building: 'house' }]), null);
	assert.equal(
		buildingsOut(state, 1, [{ building: 'farm' }, { vp: 1 }]),
		null
	);
	assert.equal(
		buildingsOut(state, 1, [{ building: 'farm' }, { building: 'house' }]),
		null
	);
	assert.equal(buildingsOut(state, 1, []), null);
});

test('R117: a decision with every option out still keeps them all, so it can be answered', () => {
	// Only the choice effect asks nothing then; another question offering two used-up buildings stays as it was.
	const { state, open } = game({ farm: 0, house: 0 }, [
		{
			kind: 'chooseOption',
			options: [[{ building: 'farm' }], [{ building: 'house' }]],
			purpose: 'treasureHunters',
		},
	]);
	assert.deepEqual(DECISIONS.chooseOption.answers(state, open), [
		{ option: 0 },
		{ option: 1 },
	]);
});

test('R117: a bonus for a building with none left is offered, but only its decline can be answered', () => {
	const ships = TRACKS.exploration.findIndex((s) => s.id === 'ships');
	const { state, random, open } = game({ farm: 0 }, [
		{ kind: 'bonus', track: 'exploration', space: ships },
	]);
	assert.equal(open.kind, 'chooseBonus');
	assert.deepEqual(DECISIONS.chooseBonus.answers(state, open), [
		{ pay: null },
	]);
	assert.throws(
		() => play(state, 1, { decision: open.id, pay: { coin: 1 } }, random),
		(error) =>
			error instanceof PlayerError &&
			error.message === 'You have no Farm left.'
	);
	const declined = play(state, 1, { decision: open.id, pay: null }, random);
	assert.equal(openDecisions(declined).length, 0);
});
