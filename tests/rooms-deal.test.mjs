// The deal counter (#29 design §3): a room counts its deals, so the client tells a new deal from the old game.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createRoom, join, roomView, start } from '../api/rooms.mjs';
import { seededRandom } from '../src/lib/engine/random.js';

const NOW = 1_000_000;
const host = { id: 'p1', name: 'Ana' };
const guest = { id: 'p2', name: 'Bo' };

test('a room starts with no deal, and each deal counts up, in the room view too', () => {
	const random = seededRandom(1);
	let room = createRoom('ABCD1234', host, {}, NOW);
	assert.equal(room.deal, 0);
	assert.equal(roomView(room, host.id).deal, 0);
	room = join(room, guest);
	room = start(room, host.id, random);
	assert.equal(room.deal, 1);
	assert.equal(roomView(room, guest.id).deal, 1);
	// The game ends, and the host deals again at the finished table.
	room = { ...room, game: { ...room.game, phase: 'over' } };
	room = start(room, host.id, random);
	assert.equal(room.deal, 2);
	assert.equal(room.game.phase, 'setup');
	assert.equal(roomView(room, host.id).deal, 2);
});
