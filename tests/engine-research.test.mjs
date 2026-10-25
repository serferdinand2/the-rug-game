// Tests for research with the science die, and for advancing and regressing as a benefit (#14).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { startedGame } from './helpers/engine.mjs';

const ALL_BUT_SCIENCE = ['exploration', 'technology', 'military'];

/**
 * A random that returns the given numbers in turn: science die faces 0 to 3 are exploration, science, technology and military.
 * @param {...number} values
 */
function rolls(...values) {
	return (/** @type {number} */ n) => {
		const value = values.shift();
		if (value === undefined || value >= n) {
			throw new Error(`No roll left for random(${n}).`);
		}
		return value;
	};
}

/**
 * A started 2-player game with seat 1's tracks set and a benefit run for it.
 * @param {Record<string, number[]>} tracks
 * @param {object[]} effects
 * @param {(n: number) => number} random
 */
function benefit(tracks, effects, random) {
	const { state: started } = startedGame(2);
	const state = structuredClone(started);
	Object.assign(state.seats[0].tracks, tracks);
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects, ordered: true },
	]);
	run(state, random);
	return state;
}

/**
 * The open move decision.
 * @param {any} state
 */
const moveChoice = (state) =>
	openDecisions(state).find((d) => d.kind === 'chooseMove');

test('research rolls the science die and the player may advance on that track (01 §3.3)', () => {
	const random = rolls(2);
	const state = benefit({}, [{ research: {} }], random);
	const { seq: _seq, ...rolled } = state.events.at(-1);
	assert.deepEqual(rolled, {
		type: 'scienceDieRolled',
		player: 1,
		track: 'technology',
	});
	const move = moveChoice(state);
	assert.deepEqual(
		[move.direction, move.benefit, move.optional],
		['advance', true, true]
	);
	assert.deepEqual(DECISIONS.chooseMove.answers(state, move), [
		{ track: 'technology', from: 0 },
		{ track: null },
	]);
	const stayed = play(state, 1, { decision: move.id, track: null }, random);
	assert.deepEqual(stayed.seats[0].tracks.technology, [0]);
	const moved = play(
		state,
		1,
		{ decision: move.id, track: 'technology', from: 0 },
		random
	);
	assert.deepEqual(moved.seats[0].tracks.technology, [1]);
	// Pottery's invent is built: it asks for a face-up card or the deck.
	assert.deepEqual(
		openDecisions(moved).map((d) => [d.kind, d.player, d.left]),
		[['chooseInvent', 1, 1]]
	);
});

test('research with the X gives no benefit or bonus, but still the landmark', () => {
	const random = rolls(1);
	const state = benefit(
		{ science: [3] },
		[{ research: { noBenefit: true } }],
		random
	);
	const move = moveChoice(state);
	assert.equal(move.benefit, false);
	const next = play(
		state,
		1,
		{ decision: move.id, track: 'science', from: 3 },
		random
	);
	assert.deepEqual(next.seats[0].tracks.science, [4]);
	assert.deepEqual(
		openDecisions(next).map((d) => [d.kind, d.player, d.landmark]),
		[['choosePlacement', 1, 'apothecary']]
	);
	assert.ok(!next.events.some((e) => e.type === 'spaceActivated'));
});

test('Alien Biology rolls 4 times and scores 5 VP for each roll that would push past space 12', () => {
	const random = rolls(0, 3, 2, 0);
	const state = benefit(
		{ exploration: [12], military: [12] },
		[{ research: { noBenefit: true, rolls: 4, offTrackVp: 5 } }],
		random
	);
	assert.equal(state.seats[0].vp, 10);
	const move = moveChoice(state);
	assert.deepEqual(move.options, [{ track: 'technology', from: 0 }]);
	const next = play(state, 1, { decision: move.id, track: null }, random);
	assert.equal(next.seats[0].vp, 15);
	assert.equal(
		next.events.filter((e) => e.type === 'scienceDieRolled').length,
		4
	);
});

test('research on a track whose tokens are all at the end does nothing without Alien Biology', () => {
	const state = benefit({ military: [12] }, [{ research: {} }], rolls(3));
	assert.equal(state.seats[0].vp, 0);
	assert.equal(moveChoice(state), undefined);
});

test('Physics advances on exploration, technology or military, with benefit', () => {
	const random = rolls();
	const state = benefit(
		{},
		[{ advance: { tracks: ALL_BUT_SCIENCE } }],
		random
	);
	const move = moveChoice(state);
	assert.deepEqual(
		[move.direction, move.benefit, move.optional],
		['advance', true, false]
	);
	assert.deepEqual(DECISIONS.chooseMove.answers(state, move), [
		{ track: 'exploration', from: 0 },
		{ track: 'technology', from: 0 },
		{ track: 'military', from: 0 },
	]);
	const next = play(
		state,
		1,
		{ decision: move.id, track: 'exploration', from: 0 },
		random
	);
	assert.deepEqual(next.seats[0].tracks.exploration, [1]);
	assert.equal(next.seats[0].territoryTiles.length, 2);
});

test('Quantum Physics advances twice, on the same or another track', () => {
	const random = rolls();
	let state = benefit(
		{},
		[
			{ advance: { tracks: ALL_BUT_SCIENCE } },
			{ advance: { tracks: ALL_BUT_SCIENCE } },
		],
		random
	);
	for (const from of [0, 1]) {
		state = play(
			state,
			1,
			{ decision: moveChoice(state).id, track: 'exploration', from },
			random
		);
	}
	assert.deepEqual(state.seats[0].tracks.exploration, [2]);
	// Scouting gave 2 territory tiles, so the explore at Rafts asks where to put one (#17).
	assert.deepEqual(
		openDecisions(state).map((d) => [d.kind, d.player]),
		[['chooseExplore', 1]]
	);
});

test('two tokens on one track are offered as two moves', () => {
	const state = benefit(
		{ technology: [2, 5] },
		[{ advance: { tracks: ['technology'] } }],
		rolls()
	);
	assert.deepEqual(moveChoice(state).options, [
		{ track: 'technology', from: 2 },
		{ track: 'technology', from: 5 },
	]);
});

test('Neuroscience regresses on technology or military, then gains that space', () => {
	const random = rolls();
	const state = benefit(
		{ technology: [2], military: [5] },
		[{ regress: { tracks: ['technology', 'military'] } }],
		random
	);
	const move = moveChoice(state);
	assert.equal(move.direction, 'regress');
	assert.deepEqual(move.options, [
		{ track: 'technology', from: 2 },
		{ track: 'military', from: 5 },
	]);
	const next = play(
		state,
		1,
		{ decision: move.id, track: 'military', from: 5 },
		random
	);
	// Standing Army: 1 worker, and 1 VP per territory tile (none).
	assert.deepEqual(next.seats[0].tracks.military, [4]);
	assert.equal(next.seats[0].resources.worker, 1);
	assert.ok(next.landmarks.includes('barracks'), 'R9');
});

test('regressing to the start gains nothing', () => {
	const state = benefit(
		{ technology: [1] },
		[{ regress: { tracks: ['technology', 'military'] } }],
		rolls()
	);
	assert.deepEqual(state.seats[0].tracks.technology, [0]);
	assert.ok(!state.events.some((e) => e.type === 'spaceActivated'));
});

test('an advance with only one possible move makes it without asking', () => {
	const state = benefit(
		{ technology: [12], military: [12] },
		[{ advance: { tracks: ALL_BUT_SCIENCE } }],
		rolls()
	);
	assert.equal(moveChoice(state), undefined);
	assert.deepEqual(state.seats[0].tracks.exploration, [1]);
});

test('with no possible move, an advance does nothing', () => {
	const state = benefit(
		{ exploration: [12], technology: [12], military: [12] },
		[{ advance: { tracks: ALL_BUT_SCIENCE } }],
		rolls()
	);
	assert.equal(moveChoice(state), undefined);
	assert.ok(!state.events.some((e) => e.type === 'tokenMoved'));
});

test('a move answer must be one of the offered moves', () => {
	const random = rolls();
	const state = benefit(
		{},
		[{ advance: { tracks: ALL_BUT_SCIENCE } }],
		random
	);
	const move = moveChoice(state);
	for (const answer of [
		{ track: 'science', from: 0 },
		{ track: 'exploration', from: 5 },
		{ track: 'exploration' },
		{ track: null },
		{},
	]) {
		assert.throws(
			() => play(state, 1, { decision: move.id, ...answer }, random),
			{ name: 'PlayerError' },
			JSON.stringify(answer)
		);
	}
});

test('until #54 decides, Alien Biology scores 5 VP on a track whose token AI Singularity took off (FAQ #9)', () => {
	const { state: started } = startedGame(2);
	const state = structuredClone(started);
	state.seats[0].tracks.technology = [];
	state.seats[0].restartedTracks = ['technology'];
	push(state, state.pending, [
		{
			player: 1,
			kind: 'effects',
			effects: [{ research: { noBenefit: true, offTrackVp: 5 } }],
		},
	]);
	run(state, rolls(2));
	assert.equal(state.seats[0].vp, 5);
});
