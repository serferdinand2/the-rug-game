// The interface helpers: ids of tracks, resources, terrain and players become references to existing design tokens.
import test from 'node:test';
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
	roman,
} from '../src/lib/ui.js';

const tokens = readFileSync(
	new URL('../src/styles/tokens.css', import.meta.url),
	'utf8'
);

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
