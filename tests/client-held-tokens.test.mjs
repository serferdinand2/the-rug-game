// Another player's token moves while their advance shows (#179): where the queue holds each token, and the track board drawn with the holds.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { EMPTY_QUEUE, queueAdd, queueNext } from '../src/lib/player-actions.js';
import { heldTokens, holdKey, holdTokens } from '../src/lib/held-tokens.js';

/**
 * A display item for an advance, with only what the holds read.
 * @param {string} id
 * @param {number} player
 * @param {string} track
 * @param {number} from
 * @param {number} to
 */
function advance(id, player, track, from, to) {
	return /** @type {any} */ ({
		id,
		player,
		kind: 'advance',
		picture: { track, space: to, from, landmark: null },
	});
}

/** A display item that moves no token. */
function tapestry(id, player) {
	return /** @type {any} */ ({
		id,
		player,
		kind: 'tapestry',
		picture: { card: 'industrialism' },
	});
}

/**
 * A track board with each player's position.
 * @param {Record<string, Record<number, number>>} positions - Track id to seat to position
 */
function board(positions) {
	return Object.entries(positions).map(([id, seats]) => ({
		id,
		name: id,
		players: Object.entries(seats).map(([seat, position]) => ({
			seat: Number(seat),
			name: `Seat ${seat}`,
			position,
		})),
	}));
}

test('a queued advance holds its token on the space it left', () => {
	const queue = queueAdd(EMPTY_QUEUE, [advance('5', 2, 'science', 3, 4)]);
	assert.deepEqual(
		heldTokens(queue, false),
		new Map([[holdKey(2, 'science'), { position: 3, final: 4 }]])
	);
});

test('the advance on show puts its token on the space it reached once its display has moved it', () => {
	const queue = queueAdd(EMPTY_QUEUE, [advance('5', 2, 'science', 3, 4)]);
	assert.deepEqual(heldTokens(queue, true).get(holdKey(2, 'science')), {
		position: 4,
		final: 4,
	});
});

test('two queued advances on one track move the token one display at a time', () => {
	let queue = queueAdd(EMPTY_QUEUE, [
		advance('5', 2, 'science', 3, 4),
		tapestry('9', 2),
		advance('12', 2, 'science', 4, 5),
	]);
	const key = holdKey(2, 'science');
	assert.deepEqual(heldTokens(queue, false).get(key), {
		position: 3,
		final: 5,
	});
	assert.deepEqual(heldTokens(queue, true).get(key), {
		position: 4,
		final: 5,
	});
	queue = queueNext(queue);
	// The tapestry card on show moves nothing: the second advance still waits.
	assert.deepEqual(heldTokens(queue, true).get(key), {
		position: 4,
		final: 5,
	});
	queue = queueNext(queue);
	assert.deepEqual(heldTokens(queue, false).get(key), {
		position: 4,
		final: 5,
	});
	assert.deepEqual(heldTokens(queue, true).get(key), {
		position: 5,
		final: 5,
	});
});

test('advances already shown, other kinds and other tracks hold nothing of their own', () => {
	let queue = queueAdd(EMPTY_QUEUE, [
		advance('5', 2, 'science', 3, 4),
		tapestry('9', 3),
		advance('12', 3, 'military', 0, 1),
	]);
	queue = queueNext(queue);
	assert.deepEqual(
		heldTokens(queue, false),
		new Map([[holdKey(3, 'military'), { position: 0, final: 1 }]])
	);
	assert.deepEqual(heldTokens(EMPTY_QUEUE, true), new Map());
});

test('the board draws a held token on its held space, and leaves the other players where they are', () => {
	const tracks = board({
		science: { 1: 2, 2: 4 },
		military: { 1: 1, 2: 0 },
	});
	const held = new Map([[holdKey(2, 'science'), { position: 3, final: 4 }]]);
	const drawn = holdTokens(tracks, held);
	assert.deepEqual(
		drawn.map((track) => track.players.map((player) => player.position)),
		[
			[2, 3],
			[1, 0],
		]
	);
	assert.equal(
		tracks[0].players[1].position,
		4,
		'the board given is left as it was'
	);
	assert.equal(drawn[1], tracks[1], 'a track with no hold is the same track');
});

test("a hold is drawn only while the game's position is where the queued advances leave the token", () => {
	// A step back, an income turn's advance or AI Singularity's restart took the token elsewhere.
	const tracks = board({ science: { 1: 2, 2: 6 } });
	const held = new Map([[holdKey(2, 'science'), { position: 3, final: 4 }]]);
	assert.equal(holdTokens(tracks, held)[0].players[1].position, 6);
});

test('Skip all marks every player still, so the tokens go to their spaces without a hop', () => {
	const tracks = board({ science: { 1: 2, 2: 4 } });
	const drawn = holdTokens(tracks, new Map(), true);
	assert.deepEqual(
		drawn[0].players.map((player) => player.still),
		[true, true]
	);
	assert.equal(holdTokens(tracks, new Map())[0], tracks[0]);
});
