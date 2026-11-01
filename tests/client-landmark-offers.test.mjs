// Landmark offers (#63): the track and card show the footprint before it is gained.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { render } from 'svelte/server';
import { trackBoard } from '../src/lib/board.js';
import { LANDMARKS } from '../src/lib/engine/data/landmarks.js';
import { view } from '../src/lib/engine/game.js';
import { techCardData } from '../src/lib/cards/game-cards.js';
import TechnologyCard from '../src/lib/components/player/TechnologyCard.svelte';
import TrackBoard from '../src/lib/components/board/TrackBoard.svelte';
import { newGame } from './helpers/engine.mjs';

const landmarkTracks = LANDMARKS.filter((item) => 'track' in item.source);
const techLandmarks = LANDMARKS.filter((item) => 'tech' in item.source);

test('all 12 available track offers show their matching picture and footprint grid', () => {
	const { state } = newGame(2);
	const html = render(TrackBoard, {
		props: { tracks: trackBoard(view(state, 1)) },
	}).body;

	assert.equal(landmarkTracks.length, 12);
	for (const landmark of landmarkTracks) {
		assert.match(
			html,
			new RegExp(
				`<svg[^>]*aria-label="${landmark.name}, capital footprint: ${landmark.footprint.length} rows by ${landmark.footprint[0].length} columns"[^>]*data-landmark-footprint="${landmark.id}"`
			),
			`${landmark.name} is missing its labeled track footprint`
		);
		assert.match(
			html,
			new RegExp(`href="/art/landmark/${landmark.id}\\.svg"`),
			`${landmark.name} does not use its landmark picture`
		);
	}
});

test('a taken track landmark loses its inline footprint with its offer', () => {
	const { state: fresh } = newGame(2);
	const state = structuredClone(fresh);
	const taken = landmarkTracks[0];
	state.landmarks = state.landmarks.filter((id) => id !== taken.id);
	const html = render(TrackBoard, {
		props: { tracks: trackBoard(view(state, 1)) },
	}).body;

	assert.doesNotMatch(
		html,
		new RegExp(`data-landmark-footprint="${taken.id}"`)
	);
	assert.match(html, /data-landmark-footprint="[a-z-]+"/);
});

test('the six landmark tech square benefits show their own labeled footprints', () => {
	assert.equal(techLandmarks.length, 6);
	for (const landmark of techLandmarks) {
		const html = render(TechnologyCard, {
			props: { data: techCardData(landmark.source.tech) },
		}).body;
		assert.match(
			html,
			new RegExp(
				`rg-tech-layout--effect[^>]*data-landmark="${landmark.id}"`
			)
		);
		assert.match(
			html,
			new RegExp(
				`<svg[^>]*aria-label="${landmark.name}, capital footprint: ${landmark.footprint.length} rows by ${landmark.footprint[0].length} columns"[^>]*data-landmark-footprint="${landmark.id}"`
			)
		);
	}
	const ordinary = render(TechnologyCard, {
		props: { data: techCardData('clocks') },
	}).body;
	assert.doesNotMatch(ordinary, /data-landmark-footprint=/);
});
