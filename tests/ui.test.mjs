// The interface helpers: ids of tracks, resources, terrain and players become references to existing design tokens.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	TRACKS,
	RESOURCES,
	TERRAINS,
	SEATS,
	trackColor,
	playerColor,
	resourceColor,
	terrainColor,
	artUrl,
	playerPieceUrl,
	capitalTileUrl,
	roman,
} from '../src/lib/ui.js';

const tokens = readFileSync(
	new URL('../src/styles/tokens.css', import.meta.url),
	'utf8'
);

test('every seat resolves to its released player-piece SVGs', () => {
	for (const [index, color] of [
		'blue',
		'red',
		'green',
		'yellow',
		'purple',
	].entries()) {
		for (const piece of ['token', 'outpost', 'outpost-toppled']) {
			const url = playerPieceUrl(piece, index + 1);
			assert.equal(url, `/art/piece/${piece}-${color}.svg`);
			assert.match(
				readFileSync(
					new URL(`../static${url}`, import.meta.url),
					'utf8'
				),
				/<svg/
			);
		}
	}
});

test('capital compositions use released tiles and retain the supplied plot state', () => {
	for (const biome of [
		'mountain',
		'wetland',
		'tropical',
		'desert',
		'grassland',
		'forest',
	]) {
		for (const blocked of [false, true]) {
			for (let index = 0; index < 81; index++) {
				const url = capitalTileUrl(biome, blocked, index, 42);
				assert.match(
					url,
					new RegExp(
						`/${biome}-${blocked ? 'blocked' : 'open'}-0[1-${blocked ? 6 : 8}]\\.svg$`
					)
				);
				assert.match(
					readFileSync(
						new URL(`../static${url}`, import.meta.url),
						'utf8'
					),
					/<svg/
				);
				assert.equal(url, capitalTileUrl(biome, blocked, index, 42));
			}
		}
	}
	assert.notEqual(
		capitalTileUrl('wetland', true, 0, 42),
		capitalTileUrl('wetland', true, 0, 43)
	);
});

/** @param {string} reference - A value such as 'var(--exploration)' */
function assertDeclared(reference) {
	const name = reference.match(/^var\((--[\w-]+)\)$/)?.[1];
	assert.ok(name, `${reference} is not a var() reference`);
	assert.match(tokens, new RegExp(`${name}\\s*:`), `${name} is not declared`);
}

test('the four tracks are listed in board order with their names', () => {
	assert.deepEqual(
		TRACKS.map((track) => `${track.id}:${track.name}`),
		[
			'exploration:Exploration',
			'science:Science',
			'technology:Technology',
			'military:Military',
		]
	);
});

test('the resources are listed in the overview order', () => {
	assert.deepEqual(
		RESOURCES.map((resource) => resource.id),
		['coin', 'food', 'worker', 'culture']
	);
});

test('every track, resource, terrain and seat colour is a declared token', () => {
	for (const track of TRACKS) {
		assertDeclared(trackColor(track.id));
	}
	for (const resource of RESOURCES) {
		assertDeclared(resourceColor(resource.id));
	}
	for (const terrain of TERRAINS) {
		assertDeclared(terrainColor(terrain.id));
	}
	for (const seat of SEATS) {
		assertDeclared(playerColor(seat));
	}
	assert.equal(trackColor('science'), 'var(--science)');
	assert.equal(playerColor(5), 'var(--player-5)');
});

test('an asset id becomes its URL under /art', () => {
	assert.equal(artUrl('landmark/lighthouse'), '/art/landmark/lighthouse.svg');
});

test('eras and tiers are written as Roman numerals', () => {
	assert.deepEqual([1, 2, 3, 4, 5].map(roman), ['I', 'II', 'III', 'IV', 'V']);
	assert.throws(() => roman(0), /1 to 10/);
});
