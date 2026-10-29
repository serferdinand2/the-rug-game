// The lobby's rules for the screen (#25): five seat slots, who may change what, and the labels of the choices.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	UNDO_CHOICES,
	YES_NO_CHOICES,
	canChangeMode,
	expansionChoices,
	isHost,
	modeChoices,
	modeLock,
	rulesChoices,
	seatSlots,
	settingsLock,
	timerChoices,
	toggleVariant,
	validCode,
	variantRows,
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

test('the timer choices name off and the minutes, in the exploration colour', () => {
	const color = 'var(--exploration)';
	assert.deepEqual(timerChoices([0, 1, 2, 5]), [
		{ value: '0', label: 'Off', color },
		{ value: '1', label: '1 min', color },
		{ value: '2', label: '2 min', color },
		{ value: '5', label: '5 min', color },
	]);
});

test('an empty seat the viewer cannot open is closed: a hot-seat table they do not host (#98)', () => {
	const hotseat = view({
		mode: 'hotseat',
		seats: [{ seat: 1, name: 'Ana', away: false, ready: false }],
	});
	assert.equal(seatSlots(hotseat, 5)[1].state, 'empty', 'the host opens it');
	const watching = seatSlots({ ...hotseat, you: [] }, 5);
	assert.equal(watching[0].state, 'player');
	assert.deepEqual(
		watching.slice(1).map((slot) => slot.state),
		['closed', 'closed', 'closed', 'closed']
	);
	// Online, anyone shares the code to fill a seat.
	assert.equal(seatSlots(view({ you: [2] }), 5)[2].state, 'empty');
});

test("the modes come from the server's list, in its order (#98)", () => {
	assert.deepEqual(modeChoices(['online', 'hotseat']), [
		{ value: 'online', label: 'Online mode', color: 'var(--exploration)' },
		{ value: 'hotseat', label: 'Local mode', color: 'var(--exploration)' },
	]);
	assert.deepEqual(
		modeChoices(['hotseat', 'solo']).map((choice) => choice.label),
		['Local mode', 'Solo mode']
	);
});

test('the mode and the settings say why they are locked, or nothing (#98)', () => {
	const one = view({ seats: [view().seats[0]] });
	assert.equal(modeLock(one), null);
	assert.equal(
		modeLock(view()),
		'The mode changes only while you are alone at the table.'
	);
	assert.equal(
		modeLock({ ...one, game: {} }),
		'The mode changes only while you are alone at the table.'
	);
	assert.equal(
		modeLock({ ...one, you: [2] }),
		'Only the host changes the mode.'
	);
	assert.equal(settingsLock(view()), null);
	assert.equal(
		settingsLock(view({ you: [2] })),
		'Only the host changes the table.'
	);
});

test('the rules list the current rules first, with the short labels and their colours (#98)', () => {
	assert.deepEqual(
		rulesChoices([
			{ id: 'original', name: 'Original 2019 printing' },
			{ id: 'current', name: 'Current official rules' },
		]),
		[
			{
				value: 'current',
				label: 'Current rules',
				color: 'var(--science)',
			},
			{
				value: 'original',
				label: 'Original 2019',
				color: 'var(--technology)',
			},
		]
	);
	assert.deepEqual(rulesChoices(undefined), []);
});

test('the expansions are named and coloured, not shown by code (#98)', () => {
	assert.deepEqual(expansionChoices(['aa', 'pp', 'ff']), [
		{
			value: 'aa',
			label: 'Arts & Architecture',
			color: 'var(--arts-architecture)',
		},
		{
			value: 'pp',
			label: 'Plans & Ploys',
			color: 'var(--plans-ploys)',
		},
		{
			value: 'ff',
			label: 'Fantasies & Futures',
			color: 'var(--fantasies-futures)',
		},
	]);
	assert.deepEqual(expansionChoices(undefined), []);
});

test('each variant row has its short title, its full name and whether the table plays it (#98)', () => {
	const config = {
		variants: [
			{
				id: 'tapestry-draft',
				name: 'Income turn 1: draw 2 tapestry cards, keep 1',
			},
			{ id: 'mystery', name: 'A variant without a short title' },
		],
	};
	const room = { options: { variants: ['mystery'] } };
	assert.deepEqual(variantRows(config, room), [
		{
			id: 'tapestry-draft',
			label: 'Tapestry draft',
			name: 'Income turn 1: draw 2 tapestry cards, keep 1',
			value: 'no',
		},
		{
			id: 'mystery',
			label: 'A variant without a short title',
			name: 'A variant without a short title',
			value: 'yes',
		},
	]);
	assert.deepEqual(variantRows(null, room), []);
});

test('toggling a variant adds it once at the end, or takes it out (#98)', () => {
	assert.deepEqual(toggleVariant(['civ-draft'], 'tapestry-draft', true), [
		'civ-draft',
		'tapestry-draft',
	]);
	assert.deepEqual(
		toggleVariant(['tapestry-draft', 'civ-draft'], 'tapestry-draft', true),
		['civ-draft', 'tapestry-draft']
	);
	assert.deepEqual(
		toggleVariant(['tapestry-draft', 'civ-draft'], 'tapestry-draft', false),
		['civ-draft']
	);
});

test('undo and the variants choose between two coloured answers (#98)', () => {
	assert.deepEqual(UNDO_CHOICES, [
		{ value: 'on', label: 'Allow undo', color: 'var(--exploration)' },
		{ value: 'off', label: 'No undo', color: 'var(--military)' },
	]);
	assert.deepEqual(YES_NO_CHOICES, [
		{ value: 'yes', label: 'Yes', color: 'var(--science)' },
		{ value: 'no', label: 'No', color: 'var(--text)' },
	]);
});
