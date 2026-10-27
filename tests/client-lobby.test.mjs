// The lobby's rules for the screen (#25): five seat slots, who may change what, and the labels of the choices.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	VARIANT_LABELS,
	canChangeMode,
	isHost,
	rulesLabel,
	seatSlots,
	timerChoices,
	validCode,
} from '../src/lib/lobby.js';
import { VARIANTS } from '../src/lib/engine/game.js';

/**
 * A room view as the server sends it.
 * @param {Partial<any>} [over]
 */
function view(over = {}) {
	return {
		code: '3f9a1c07',
		mode: 'online',
		phase: 'lobby',
		host: 1,
		seats: [
			{ seat: 1, name: 'Ana', away: false, ready: true },
			{ seat: 2, name: 'Bo', away: false, ready: false },
		],
		you: [1],
		game: null,
		...over,
	};
}

test('seat slots online, as the host sees them: their own seat is kept, the guest can be removed', () => {
	const slots = seatSlots(view(), 5);
	assert.equal(slots.length, 5);
	assert.deepEqual(slots[0], {
		seat: 1,
		state: 'player',
		name: 'Ana',
		you: true,
		host: true,
		ready: true,
		removable: false,
	});
	assert.deepEqual(slots[1], {
		seat: 2,
		state: 'player',
		name: 'Bo',
		you: false,
		host: false,
		ready: false,
		removable: true,
	});
	assert.deepEqual(slots[2], {
		seat: 3,
		state: 'empty',
		name: '',
		you: false,
		host: false,
		ready: undefined,
		removable: false,
	});
});

test('seat slots online, as a guest sees them: nothing to remove', () => {
	const slots = seatSlots(view({ you: [2] }), 5);
	assert.equal(slots[1].you, true);
	assert.equal(slots[0].you, false);
	assert.ok(slots.every((s) => !s.removable));
});

test('seat slots at a hot-seat table: no YOU and no readiness, and any seat but the last goes', () => {
	const room = view({
		mode: 'hotseat',
		you: [1, 2],
		seats: [
			{ seat: 1, name: 'Ana', away: false, ready: false },
			{ seat: 2, name: 'Bo', away: false, ready: false },
		],
	});
	const slots = seatSlots(room, 5);
	assert.ok(slots.every((s) => !s.you && s.ready === undefined));
	assert.deepEqual(
		slots.map((s) => s.removable),
		[true, true, false, false, false]
	);
	const alone = seatSlots(
		view({ mode: 'hotseat', seats: [view().seats[0]] }),
		5
	);
	assert.equal(alone[0].removable, false, 'a table keeps one player');
});

test('nothing is removable once a game is dealt', () => {
	const slots = seatSlots(view({ game: {}, phase: 'playing' }), 5);
	assert.ok(slots.every((s) => !s.removable));
});

test('only the host with one seat and no game changes the mode', () => {
	const one = view({ seats: [view().seats[0]] });
	assert.ok(isHost(one));
	assert.ok(canChangeMode(one));
	assert.ok(!canChangeMode(view()), 'two seats');
	assert.ok(!canChangeMode({ ...one, you: [2] }), 'not the host');
	assert.ok(!canChangeMode({ ...one, game: {} }), 'a game was dealt');
});

test('a table code is 8 letters or digits, spaces trimmed', () => {
	assert.ok(validCode('3f9a1c07'));
	assert.ok(validCode(' 3F9A1C07 '));
	assert.ok(!validCode('3f9a1c0'));
	assert.ok(!validCode('3f9a1c077'));
	assert.ok(!validCode('3f9a-c07'));
	assert.ok(!validCode(''));
});

test('the rules read as the mockups name them', () => {
	assert.equal(rulesLabel('current'), 'Current rules');
	assert.equal(rulesLabel('original'), 'Original 2019 rules');
	assert.equal(rulesLabel('original', { short: true }), 'Original 2019');
});

test('every variant has a short row title', () => {
	assert.deepEqual(
		Object.keys(VARIANT_LABELS).sort(),
		VARIANTS.map((v) => v.id).sort()
	);
	assert.equal(VARIANT_LABELS['tapestry-draft'], 'Tapestry draft');
	assert.equal(VARIANT_LABELS['closest-island'], 'Closest island');
});

test('the timer choices name off and the minutes', () => {
	assert.deepEqual(timerChoices([0, 1, 2, 5]), [
		{ value: '0', label: 'Off' },
		{ value: '1', label: '1 min' },
		{ value: '2', label: '2 min' },
		{ value: '5', label: '5 min' },
	]);
});
