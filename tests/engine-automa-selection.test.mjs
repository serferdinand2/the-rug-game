// Base bot track selectors apply the card indicators before each bot's own tiebreak order (02 §9.4).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createBotSeat } from '../src/lib/engine/state.js';
import { AUTOMA_CARDS } from '../src/lib/engine/data/automa-cards.js';
import {
	validBotTracks,
	selectBotTrack,
} from '../src/lib/engine/automa-selection.js';

// Literal progress and remaining-landmark fixtures, independent of the selectors.
function fixture(progress = [0, 0, 0, 0], landmarks = []) {
	const bot = createBotSeat(
		1,
		'automa',
		'Automa',
		['exploration', 'science', 'technology', 'military'],
		25
	);
	bot.tracks.exploration = [progress[0]];
	bot.tracks.science = [progress[1]];
	bot.tracks.technology = [progress[2]];
	bot.tracks.military = [progress[3]];
	bot.favouriteTrack = 'technology';
	return { seats: [bot], landmarks: [...landmarks], expansions: [], variants: [] };
}

test('ALL offers every unfinished board track in board order', () => {
	const state = fixture([3, 12, 7, 11]);
	assert.deepEqual(validBotTracks(state, 1, 'ALL'), [
		'exploration',
		'technology',
		'military',
	]);
});

test('END keeps all tracks at the shortest distance to the end', () => {
	const state = fixture([8, 11, 11, 12]);
	assert.deepEqual(validBotTracks(state, 1, 'END'), [
		'science',
		'technology',
	]);
});

test('LMK keeps the shortest distance to an unclaimed landmark rather than the closest track end', () => {
	const state = fixture([3, 8, 9, 7], ['lighthouse', 'laboratory', 'forge']);
	assert.deepEqual(validBotTracks(state, 1, 'LMK'), ['exploration']);
});

test('LMK skips claimed landmarks and compares the next available landmark', () => {
	const state = fixture([3, 5, 1, 1], ['train-station', 'academy']);
	assert.deepEqual(validBotTracks(state, 1, 'LMK'), ['science']);
});

test('LMK treats the end as a target even when all landmarks on that track are claimed', () => {
	const state = fixture([11, 5, 3, 0], ['academy', 'forge', 'barracks']);
	assert.deepEqual(validBotTracks(state, 1, 'LMK'), [
		'exploration',
		'technology',
	]);
});

test('LMK includes an unclaimed landmark at the current space at distance zero', () => {
	const state = fixture([4, 6, 11, 0], ['lighthouse', 'academy']);
	assert.deepEqual(validBotTracks(state, 1, 'LMK'), ['exploration']);
});

test('LMK ignores unclaimed landmarks behind the token', () => {
	const state = fixture([5, 9, 0, 0], ['lighthouse', 'laboratory']);
	assert.deepEqual(validBotTracks(state, 1, 'LMK'), ['science']);
});

test('selectors use the most advanced token and treat a restarted track as complete', () => {
	const state = fixture([1, 0, 3, 2], ['lighthouse', 'forge', 'barracks']);
	state.seats[0].tracks.exploration.push(11);
	state.seats[0].tracks.science = [];
	state.seats[0].restartedTracks.push('science');
	assert.deepEqual(validBotTracks(state, 1, 'ALL'), [
		'exploration',
		'technology',
		'military',
	]);
	assert.deepEqual(validBotTracks(state, 1, 'END'), ['exploration']);
	assert.deepEqual(validBotTracks(state, 1, 'LMK'), [
		'exploration',
		'technology',
	]);
});

test('Automa and Shadow Empire read the same printed tiebreakers in opposite directions', () => {
	const state = fixture();
	const card = AUTOMA_CARDS[0];
	assert.equal(selectBotTrack(state, 1, 'ALL', card, 'automa'), 'technology');
	assert.equal(selectBotTrack(state, 1, 'ALL', card, 'shadow'), 'science');
});

test('favourite resolves to the selected seat and is skipped when that track is invalid', () => {
	const state = fixture([12, 12, 12, 0]);
	assert.equal(
		selectBotTrack(state, 1, 'ALL', AUTOMA_CARDS[0], 'automa'),
		'military'
	);
	const shadow = createBotSeat(
		2,
		'shadow',
		'Shadow Empire',
		['exploration', 'science', 'technology', 'military'],
		25
	);
	shadow.favouriteTrack = 'exploration';
	state.seats.push(shadow);
	// Card 3 has its heart last, so Shadow reads its own favourite first.
	assert.equal(
		selectBotTrack(state, 2, 'ALL', AUTOMA_CARDS[2], 'shadow'),
		'exploration'
	);
});

test('an indicator filters out a card preference before resolving the remaining ties', () => {
	const state = fixture([3, 8, 9, 7], ['lighthouse', 'laboratory']);
	assert.equal(
		selectBotTrack(state, 1, 'LMK', AUTOMA_CARDS[0], 'automa'),
		'exploration'
	);
	assert.equal(
		selectBotTrack(state, 1, 'END', AUTOMA_CARDS[0], 'shadow'),
		'technology'
	);
});

test('all indicators return no candidates and selection returns null when every track is complete', () => {
	const state = fixture([12, 12, 12, 12], ['lighthouse']);
	for (const indicator of ['ALL', 'LMK', 'END']) {
		assert.deepEqual(validBotTracks(state, 1, indicator), []);
		assert.equal(
			selectBotTrack(state, 1, indicator, AUTOMA_CARDS[0], 'automa'),
			null
		);
	}
});

test('selecting a track changes neither state nor the canonical card tiebreakers', () => {
	const state = fixture([1, 2, 3, 4], ['forge', 'academy']);
	const before = structuredClone(state);
	const card = AUTOMA_CARDS[0];
	const tiebreakers = [...card.trackTiebreakers];
	selectBotTrack(state, 1, 'ALL', card, 'shadow');
	selectBotTrack(state, 1, 'LMK', card, 'automa');
	assert.deepEqual(state, before);
	assert.deepEqual(card.trackTiebreakers, tiebreakers);
});
