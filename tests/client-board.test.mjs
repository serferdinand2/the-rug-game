// Tests for the tracks and achievements the board components take from a game view.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	DECISIONS,
	openDecisions,
	play,
	view,
} from '../src/lib/engine/game.js';
import { answer, newGame, readyTurn } from './helpers/engine.mjs';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import {
	trackBoard,
	achievements,
	spaceWords,
	tierSymbols,
} from '../src/lib/board.js';

/**
 * A view of a fresh game, after changes to a copy of its state.
 * @param {number} count
 * @param {(state: any) => void} [change]
 */
function viewOf(count, change) {
	const { state } = newGame(count);
	const copy = structuredClone(state);
	if (change) {
		change(copy);
	}
	return /** @type {any} */ (view(copy, 1));
}

test('trackBoard gives the four tracks of twelve spaces', () => {
	const tracks = trackBoard(viewOf(2));
	assert.deepEqual(
		tracks.map((track) => track.id),
		['exploration', 'science', 'technology', 'military']
	);
	for (const track of tracks) {
		assert.equal(track.spaces.length, 12);
		assert.equal(track.tiers.length, 4);
	}
	assert.equal(tracks[0].spaces[0].name, 'Scouting');
});

test('tier prices use the track resource, one symbol per unit', () => {
	const tracks = trackBoard(viewOf(2));
	assert.deepEqual(tracks[0].tiers, [
		['any'],
		['food', 'any'],
		['food', 'any', 'any'],
		['food', 'food'],
	]);
	assert.deepEqual(tracks[3].tiers[3], ['culture', 'culture']);
});

test('a landmark shows on its space only while unowned', () => {
	const open = trackBoard(viewOf(2));
	assert.ok(open[0].spaces[3].landmark);
	const taken = trackBoard(
		viewOf(2, (state) => {
			state.landmarks = state.landmarks.filter(
				(/** @type {string} */ id) =>
					id !== TRACKS.exploration[4].landmark
			);
		})
	);
	assert.equal(taken[0].spaces[3].landmark, undefined);
	assert.ok(taken[0].spaces[6].landmark);
});

test("a player's lane is their furthest token", () => {
	const tracks = trackBoard(
		viewOf(2, (state) => {
			state.seats[0].tracks.science = [2, 5];
		})
	);
	const lane = tracks[1].players.find((p) => p.seat === 1);
	assert.equal(lane?.position, 5);
	assert.equal(tracks[1].players.length, 2);
});

/**
 * A view of a 2-player game in which the current player advanced onto technology 12, AI Singularity, from
 * military 5, and started the token again on `restart` (01 §3.4).
 * @param {'exploration' | 'science' | 'technology' | 'military'} restart
 */
function afterSingularity(restart) {
	const ready = readyTurn(2, (seat) => {
		seat.tracks.technology = [11];
		seat.tracks.military = [5];
		seat.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	});
	const { random, player } = ready;
	const chosen = answer(ready.state, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	const [decision] = openDecisions(chosen);
	const move = DECISIONS.chooseAdvance
		.answers(chosen, decision)
		.find((a) => a.track === 'technology' && a.from === 11);
	const state = answer(
		play(chosen, player, { decision: decision.id, ...move }, random),
		random,
		player,
		'chooseRestart',
		{ track: restart }
	);
	return { game: /** @type {any} */ (view(state, player)), player };
}

test('after AI Singularity the technology lane stays complete, at space 12 (#147, FAQ #9, R109)', () => {
	const { game, player } = afterSingularity('military');
	assert.deepEqual(game.seats[player - 1].tracks.technology, []);
	assert.deepEqual(game.seats[player - 1].tracks.military, [5, 0]);
	const lane = (/** @type {number} */ index) =>
		trackBoard(game)[index].players.find((p) => p.seat === player);
	assert.equal(lane(2)?.position, 12);
	// Only the most advanced token counts when positions are compared (01 §3.1).
	assert.equal(lane(3)?.position, 5);
});

test('AI Singularity onto the technology track itself keeps its lane complete (#147)', () => {
	const { game, player } = afterSingularity('technology');
	assert.deepEqual(game.seats[player - 1].tracks.technology, [0]);
	const lane = trackBoard(game)[2].players.find((p) => p.seat === player);
	assert.equal(lane?.position, 12);
});

test('achievements list claimants in order and the next VP by map size', () => {
	const large = achievements(
		viewOf(4, (state) => {
			state.achievements['complete-track'] = [3, 1];
		})
	);
	assert.equal(large.length, 3);
	assert.deepEqual(large[0].claimed, [3, 1]);
	assert.equal(large[0].vp, 5);
	assert.equal(large[1].vp, 15);
	assert.equal(large[2].vp, 10);
	const small = achievements(viewOf(2));
	assert.equal(small[0].vp, 10);
	const done = achievements(
		viewOf(2, (state) => {
			state.achievements['middle-island'] = [1, 2];
		})
	);
	assert.equal(done[2].vp, null);
});

test('each space carries its benefit, its bonus and both in words (#59)', () => {
	const [exploration, , technology] = trackBoard(viewOf(2));
	const ships = exploration.spaces[4];
	assert.ok(ships.benefit && ships.benefit.length > 0);
	assert.deepEqual(ships.bonus?.gain, [
		{ kind: 'building', id: 'farm', count: 1 },
	]);
	assert.match(ships.words ?? '', /VP/);
	assert.match(ships.words ?? '', /Bonus: /);
	// Scouting has no bonus.
	assert.equal(exploration.spaces[0].bonus, null);
	assert.doesNotMatch(exploration.spaces[0].words ?? '', /Bonus/);
	// Nanotechnology's bonus costs 3 tech cards, or 2 with the neoprene variant (#53).
	assert.deepEqual(technology.spaces[10].bonus?.pay, [
		{ kind: 'word', text: 'Tech', count: 3 },
	]);
	const [, , neoprene] = trackBoard(
		viewOf(2, (state) => {
			state.variants = ['neoprene-nanotechnology'];
		})
	);
	assert.deepEqual(neoprene.spaces[10].bonus?.pay, [
		{ kind: 'word', text: 'Tech', count: 2 },
	]);
});

test("the footer words a space as its track does, Navigation's effects joined by then (#84)", () => {
	const game = viewOf(2);
	for (const track of trackBoard(game)) {
		for (const [at, entry] of track.spaces.entries()) {
			assert.equal(
				spaceWords(game, track.id, at + 1),
				entry.words,
				`${track.id} ${at + 1}`
			);
		}
	}
	const navigation = TRACKS.exploration.findIndex(
		(space) => space.name === 'Navigation'
	);
	assert.match(spaceWords(game, 'exploration', navigation), /, then /);
});

test("tierSymbols is each tier's price, as the board shows it (#86)", () => {
	const board = trackBoard(viewOf(2));
	for (const track of board) {
		track.tiers.forEach((tier, index) => {
			assert.deepEqual(tierSymbols(track.id, index + 1), tier);
		});
	}
	assert.deepEqual(tierSymbols('science', 1), ['any']);
	assert.deepEqual(tierSymbols('science', 4), ['worker', 'worker']);
});
