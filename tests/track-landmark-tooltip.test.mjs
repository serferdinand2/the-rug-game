// Track-space landmark tooltips use the board's canonical names and printed footprint shapes.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { render } from 'svelte/server';
import LandmarkHoverDetail from '../src/lib/components/board/LandmarkHoverDetail.svelte';
import TrackSpace from '../src/lib/components/board/TrackSpace.svelte';
import { LANDMARKS } from '../src/lib/engine/data/landmarks.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { trackBoard } from '../src/lib/board.js';

const boardLandmarks = LANDMARKS.filter((item) => 'track' in item.source);

test('the board advertises exactly its twelve earned landmark ids to the shared tooltip', () => {
	const rendered = [];
	for (const [trackId, track] of Object.entries(TRACKS)) {
		for (const [index, space] of track.entries()) {
			if (!space.landmark) continue;
			const html = render(TrackSpace, {
				props: {
					track: trackId,
					space: index + 1,
					name: space.name,
					landmark: space.landmark,
				},
			}).body;
			const id = space.landmark.toLowerCase().replaceAll(' ', '-');
			assert.ok(html.includes(`data-landmark="${id}"`), id);
			rendered.push(id);
		}
	}
	assert.deepEqual(
		rendered.sort(),
		boardLandmarks.map(({ id }) => id).sort()
	);
});

test('each track landmark hover detail uses its catalogue name and printed card footprint', () => {
	assert.equal(boardLandmarks.length, 12);
	for (const landmark of boardLandmarks) {
		const html = render(LandmarkHoverDetail, {
			props: { id: landmark.id },
		}).body;
		assert.ok(html.includes(`>${landmark.name}</span>`), landmark.id);
		assert.ok(
			html.includes(`data-footprint="${landmark.footprint.join('/')}"`),
			landmark.id
		);
		assert.match(html, /rg-landmark-card--footprint/);
		assert.match(html, /Capital footprint:/);
		assert.match(html, new RegExp(`landmark/${landmark.id}\\.svg`));
	}
});

test('claimed track landmarks disappear from the board view and therefore its hover detail', () => {
	const remaining = boardLandmarks.map(({ id }) => id);
	const view = { landmarks: remaining, seats: [], variants: [] };
	const fullBoard = trackBoard(view);
	for (const landmark of boardLandmarks) {
		const { track, space } = landmark.source;
		const entry = fullBoard.find((row) => row.id === track).spaces[
			space - 1
		];
		assert.ok(entry.landmark, `${landmark.id} is available`);

		const afterClaim = trackBoard({
			...view,
			landmarks: remaining.filter((id) => id !== landmark.id),
		});
		assert.equal(
			afterClaim.find((row) => row.id === track).spaces[space - 1]
				.landmark,
			undefined,
			`${landmark.id} is no longer advertised after being claimed`
		);
	}
});
