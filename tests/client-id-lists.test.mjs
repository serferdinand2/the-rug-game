// The client's track, resource and building lists (#127): read from the engine, so a new track can't be left out.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { view } from '../src/lib/engine/game.js';
import { RESOURCE_IDS, TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { ASSETS } from '../src/lib/art/catalog.js';
import { RESOURCE_ORDER, RESOURCES, TRACKS } from '../src/lib/ui.js';
import { TRACK_KEYS } from '../src/lib/hotkeys.js';
import { trackBoard } from '../src/lib/board.js';
import { playerCards } from '../src/lib/area/players.js';
import { trackName } from '../src/lib/game-names.js';
import { startedGame } from './helpers/engine.mjs';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));

const tokens = readFileSync(
	new URL('../src/styles/tokens.css', import.meta.url),
	'utf8'
);

test("the client's tracks and track keys are the engine's, in board order", () => {
	assert.deepEqual(
		TRACKS.map((track) => track.id),
		[...TRACK_IDS]
	);
	assert.deepEqual([...TRACK_KEYS], [...TRACK_IDS]);
});

test("the screens list the engine's resources, food before workers", () => {
	assert.deepEqual([...RESOURCE_ORDER].sort(), [...RESOURCE_IDS].sort());
	assert.deepEqual(RESOURCE_ORDER, ['coin', 'food', 'worker', 'culture']);
	assert.deepEqual(
		RESOURCES.map((resource) => resource.id),
		[...RESOURCE_ORDER]
	);
});

test('every engine track has a name, a symbol, a tint, a board track and a place on the player card', () => {
	const { state } = startedGame(2);
	const game = view(state, 1);
	const board = trackBoard(/** @type {any} */ (game));
	const [card] = playerCards(game, 1, 1);
	for (const id of TRACK_IDS) {
		const named = TRACKS.find((track) => track.id === id);
		assert.ok(named?.name, `${id} has a name`);
		assert.equal(named.name, trackName(id));
		assert.ok(
			ASSETS.some((asset) => asset.id === `track/${id}`),
			`${id} has a symbol`
		);
		assert.match(tokens, new RegExp(`--${id}:`), `${id} has a tint`);
		assert.equal(
			board.find((track) => track.id === id)?.name,
			named.name,
			`${id} is on the board`
		);
		assert.ok(id in card.tracks, `${id} is on the player card`);
	}
});

test('no client module writes the track, resource or building list by hand', () => {
	const files = readdirSync(SRC, { recursive: true })
		.map(String)
		.map((file) => file.replaceAll('\\', '/'))
		.filter(
			(file) =>
				/\.(svelte|js)$/.test(file) &&
				!file.startsWith('lib/engine/') &&
				file !== 'lib/ui.js'
		);
	assert.ok(files.length > 100, 'the source files are found');
	for (const file of files) {
		const source = readFileSync(`${SRC}${file}`, 'utf8');
		assert.doesNotMatch(
			source,
			/'exploration',\s*'science',\s*'technology',\s*'military'/,
			`${file} lists the tracks`
		);
		assert.doesNotMatch(
			source,
			/'coin',\s*'(?:food|worker)',\s*'(?:worker|food)',\s*'culture'/,
			`${file} lists the resources`
		);
		assert.doesNotMatch(
			source,
			/'market',\s*'house',\s*'farm',\s*'armory'/,
			`${file} lists the buildings`
		);
	}
});
