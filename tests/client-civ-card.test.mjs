// The civilization cards' live state (#78): what each spot shows from a seat's civData, and the spots a decision offers.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { openDecisions, view } from '../src/lib/engine/game.js';
import { entertainersMoves } from '../src/lib/engine/civs/entertainers.js';
import {
	CARD_CIVS,
	SAMPLE_CIV_DATA,
	cardCivOf,
	cardSpot,
	civCardMarks,
	civCardView,
	spotWords,
} from '../src/lib/civ-card.js';
import { answer, startedGame } from './helpers/engine.mjs';

/**
 * A view with one seat holding `civData`, for the pure cases.
 * @param {Record<string, any>} civData
 */
function table(civData) {
	return {
		seats: [
			{ seat: 1, kind: 'player', name: 'Ana', civData },
			{ seat: 2, kind: 'player', name: 'Bo', civData: {} },
		],
	};
}

test('the six civilizations with choices on their cards', () => {
	assert.deepEqual(
		[...CARD_CIVS],
		[
			'entertainers',
			'merrymakers',
			'leaders',
			'militants',
			'historians',
			'mystics',
		]
	);
});

test("the Entertainers' token sits on its space, or on the start", () => {
	assert.deepEqual(civCardMarks('entertainers', { at: 'c2r3' }), {
		c2r3: ['token'],
	});
	assert.deepEqual(civCardMarks('entertainers', { at: 'start' }), {
		start: ['token'],
	});
});

test("the Merrymakers' tokens climb their columns; a moved column is marked", () => {
	assert.deepEqual(civCardMarks('merrymakers', { levels: [2, 0, 1] }), {
		m0: ['moved'],
		m0l2: ['token'],
		m1l0: ['token'],
		m2: ['moved'],
		m2l1: ['token'],
	});
});

test("the Leaders' used tracks are covered", () => {
	assert.deepEqual(
		civCardMarks('leaders', { used: ['science', 'military'] }),
		{ science: ['used'], military: ['used'] }
	);
});

test("the Militants' outposts cover their spaces; a space taken off is exposed", () => {
	assert.deepEqual(
		civCardMarks('militants', {
			top: [false, true, true, true],
			bottom: [false, false, true, true],
		}),
		{
			top0: ['exposed'],
			top1: ['token'],
			top2: ['token'],
			top3: ['token'],
			bottom0: ['exposed'],
			bottom1: ['exposed'],
			bottom2: ['token'],
			bottom3: ['token'],
		}
	);
});

test("the Historians' tokens cover their squares until given away", () => {
	assert.deepEqual(
		civCardMarks('historians', {
			squares: [false, true, true, false],
			given: { 2: 2 },
		}),
		{
			square0: ['exposed'],
			square1: ['token'],
			square2: ['token'],
			square3: ['exposed'],
		}
	);
});

test("the Mystics' predictions are chosen numbers, and a reached one is marked", () => {
	assert.deepEqual(
		civCardMarks('mystics', {
			predictions: { techCards: 4, tracks: 2 },
			reached: ['tracks'],
		}),
		{
			'techCards:4': ['chosen'],
			'tracks:2': ['chosen'],
			tracks: ['reached'],
		}
	);
});

test('a civilization without data shows nothing yet', () => {
	assert.deepEqual(civCardMarks('merrymakers', undefined), {});
	assert.deepEqual(civCardMarks('nomads', { anything: 1 }), {});
});

test("each card decision's answer is a spot: the space, cell, track, row's next space, square or number", () => {
	const game = table({
		merrymakers: { levels: [1, 0, 3] },
		militants: {
			top: [false, true, true, true],
			bottom: [false, false, false, true],
		},
	});
	const slot = (/** @type {string} */ purpose) => ({
		kind: 'chooseSlot',
		player: 1,
		purpose,
	});
	assert.equal(
		cardSpot(slot('entertainers'), { slot: 'c3r2' }, game),
		'c3r2'
	);
	assert.equal(cardSpot(slot('merrymakers'), { slot: 0 }, game), 'm0l2');
	assert.equal(cardSpot(slot('merrymakers'), { slot: 1 }, game), 'm1l1');
	assert.equal(
		cardSpot(slot('leaders'), { slot: 'science' }, game),
		'science'
	);
	assert.equal(cardSpot(slot('militantsRow'), { slot: 'top' }, game), 'top1');
	assert.equal(
		cardSpot(slot('militantsPlace'), { slot: 'bottom' }, game),
		'bottom2'
	);
	assert.equal(
		cardSpot(slot('historians'), { slot: { to: 2, square: 3 } }, game),
		'square3'
	);
	assert.equal(
		cardSpot(
			{ kind: 'chooseProphecy', player: 1, category: 'districts' },
			{ value: 6 },
			game
		),
		'districts:6'
	);
});

test('a decline, another purpose or another kind is not on the card', () => {
	const game = table({});
	const leaders = { kind: 'chooseSlot', player: 1, purpose: 'leaders' };
	assert.equal(cardSpot(leaders, { slot: null }, game), null);
	assert.equal(
		cardSpot(
			{ kind: 'chooseSlot', player: 1, purpose: 'historiansTile' },
			{ slot: 3 },
			game
		),
		null
	);
	assert.equal(
		cardSpot({ kind: 'chooseTurn', player: 1 }, { turn: 'income' }, game),
		null
	);
	assert.equal(cardCivOf(leaders), 'leaders');
	assert.equal(
		cardCivOf({ kind: 'chooseSlot', purpose: 'militantsRow' }),
		'militants'
	);
	assert.equal(cardCivOf({ kind: 'chooseProphecy' }), 'mystics');
	assert.equal(
		cardCivOf({ kind: 'chooseSlot', purpose: 'historiansTile' }),
		null
	);
	assert.equal(cardCivOf(null), null);
});

test('a spot is worded by what it gives', () => {
	const game = table({
		merrymakers: { levels: [1, 0, 0] },
		militants: {
			top: [false, true, true, true],
			bottom: [true, true, true, true],
		},
	});
	const slot = (/** @type {string} */ purpose) => ({
		kind: 'chooseSlot',
		player: 1,
		purpose,
	});
	assert.equal(
		spotWords(slot('entertainers'), { slot: 'c2r1' }, game),
		'Gain a Farm'
	);
	assert.equal(
		spotWords(slot('merrymakers'), { slot: 0 }, game),
		'Gain 1 food and 1 worker'
	);
	assert.equal(
		spotWords(slot('leaders'), { slot: 'science' }, game),
		'Advance on Science without its bonus'
	);
	assert.equal(
		spotWords(slot('militantsRow'), { slot: 'top' }, game),
		'Uncover the 2 VP space'
	);
	assert.equal(
		spotWords(slot('militantsPlace'), { slot: 'top' }, game),
		'Cover the 1 coin space'
	);
	assert.equal(
		spotWords(slot('historians'), { slot: { to: 2, square: 1 } }, game),
		'Give Bo a token, uncovering the 1 food square'
	);
	assert.equal(spotWords(slot('leaders'), { slot: null }, game), null);
});

test("the library's play state is drawn from sample data, as the reviewed illustration showed it", () => {
	assert.deepEqual(
		civCardMarks('entertainers', SAMPLE_CIV_DATA.entertainers),
		{
			c3r2: ['token'],
		}
	);
	assert.deepEqual(
		Object.keys(SAMPLE_CIV_DATA).sort(),
		[...CARD_CIVS].sort()
	);
});

test("an Entertainers income turn offers the token's next spaces on the viewer's card, from the view", () => {
	const { state, random } = startedGame(2, {
		civs: ['entertainers', 'merrymakers'],
	});
	const player = /** @type {number} */ (state.current);
	const civ = player === 1 ? 'entertainers' : 'merrymakers';
	const next = answer(state, random, player, 'chooseTurn', {
		turn: 'income',
	});
	const game = view(next, player);
	const decision = openDecisions(game).find(
		(d) => d.player === player && d.kind === 'chooseSlot'
	);
	assert.ok(decision, 'the income turn asks for the move');
	const card = civCardView(game, player, civ, decision);
	if (civ === 'entertainers') {
		assert.deepEqual(card.marks, { start: ['token'] });
		assert.deepEqual(Object.keys(card.choices), entertainersMoves('start'));
	} else {
		assert.deepEqual(Object.keys(card.choices), ['m0l1', 'm1l1', 'm2l1']);
	}
	for (const indices of Object.values(card.choices)) {
		assert.equal(indices.length, 1);
	}
	const other = civCardView(
		game,
		player === 1 ? 2 : 1,
		'merrymakers',
		decision
	);
	assert.deepEqual(
		other.choices,
		{},
		"no one chooses on another player's card"
	);
});
