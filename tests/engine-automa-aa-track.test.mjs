// Arts is a valid unfinished bot track when the expansion's track is in play (#38).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	validBotTracks,
	selectBotTrack,
} from '../src/lib/engine/automa-selection.js';

test('Automa can select the arts track using a printed tiebreak', () => {
	const tracks = Object.fromEntries(
		['exploration', 'science', 'technology', 'military', 'arts'].map(
			(track) => [track, [0]]
		)
	);
	const state = {
		expansions: ['aa'],
		variants: [],
		landmarks: [],
		seats: [
			{
				seat: 1,
				kind: 'automa',
				tracks,
				favouriteTrack: 'exploration',
				restartedTracks: [],
			},
		],
	};
	assert.ok(validBotTracks(state, 1, 'ALL').includes('arts'));
	assert.equal(
		selectBotTrack(
			state,
			1,
			'ALL',
			{
				trackTiebreakers: [
					'arts',
					'favourite',
					'science',
					'technology',
					'military',
					'exploration',
				],
			},
			'automa'
		),
		'arts'
	);
});
