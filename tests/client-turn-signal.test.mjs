// The browser tab's word for the viewer's turn (#174): its title and icon, online only.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { turnSignal } from '../src/lib/turn-signal.js';

test("an online player's tab says when it is their turn, with the dotted icon", () => {
	assert.deepEqual(turnSignal({ yours: true, online: true }), {
		title: '● Your turn · The Rug Game',
		icon: '/favicon-turn.svg',
	});
});

test('the tab keeps its title and icon while it is not your turn', () => {
	assert.deepEqual(turnSignal({ yours: false, online: true }), {
		title: 'The Rug Game',
		icon: '/favicon.svg',
	});
});

test('a hot-seat table keeps its title: the screen is shared', () => {
	assert.deepEqual(turnSignal({ yours: true, online: false }), {
		title: 'The Rug Game',
		icon: '/favicon.svg',
	});
});
