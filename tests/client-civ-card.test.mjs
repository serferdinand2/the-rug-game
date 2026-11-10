// The civilization cards' live state (#78): what each spot shows from a seat's civData, and the spots a decision offers.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { openDecisions, view } from '../src/lib/engine/game.js';
import { entertainersMoves } from '../src/lib/engine/civs/entertainers.js';
import {
	CARD_CIVS,
	cardCivOf,
	cardSpot,
	civCardMarks,
	civCardView,
	spotWords,
} from '../src/lib/civ-card.js';
import { SAMPLE_CIV_DATA } from '../src/lib/cards/reviewed-civilizations.js';
import { civCard } from '../src/lib/cards/civ-cards.js';
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

test('the seventeen civilizations whose cards show live state, six with choices on them', () => {
	assert.deepEqual(
		[...CARD_CIVS],
		[
			'entertainers',
			'merrymakers',
			'leaders',
			'militants',
			'historians',
			'mystics',
			'treasure-hunters',
			'tinkerers',
			'spies',
			'utilitarians',
			'traders',
			'isolationists',
			'heralds',
			'collectors',
			'relentless',
			'renegades',
			'urban-planners',
		]
	);
});

test("the Relentless' tokens, the Renegades' space and the Urban Planners' kept landmarks show on their cards (#37)", () => {
	assert.deepEqual(civCardMarks('relentless', { tokens: 2 }), {
		tokens: ['token', 'token'],
	});
	assert.deepEqual(civCardMarks('renegades', { at: 0 }), {});
	assert.deepEqual(civCardMarks('renegades', { at: 2 }), {
		tier2: ['token'],
	});
	assert.deepEqual(
		civCardMarks('urban-planners', { stored: ['forge', 'villa'] }),
		{ 'stored-forge': ['token'], 'stored-villa': ['token'] }
	);
	const relentless = civCard('relentless', {
		view: { marks: civCardMarks('relentless', { tokens: 3 }), choices: {} },
	});
	assert.equal(relentless.sections[0].effects[0].label, '3 here');
	const planners = civCard('urban-planners', {
		view: {
			marks: civCardMarks('urban-planners', { stored: ['forge'] }),
			choices: {},
		},
	});
	assert.match(
		planners.sections[0].effects[1].text.join(' '),
		/On this mat now: the Forge\./
	);
});

test("the Collectors' card marks each item on their mat (#37)", () => {
	assert.deepEqual(
		civCardMarks('collectors', {
			items: { outpost: true, tech: 'paper' },
			turn: 3,
		}),
		{ outpost: ['token'], tech: ['token'] }
	);
	assert.deepEqual(civCardMarks('collectors', { items: {}, turn: null }), {});
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

test("the Treasure Hunters' used treasures are struck through; the treasure to claim is chosen in the panel (#33)", () => {
	assert.deepEqual(
		civCardMarks('treasure-hunters', {
			tokens: 2,
			used: ['desert', 'forest'],
		}),
		{ desert: ['used'], forest: ['used'] }
	);
	assert.deepEqual(
		civCardMarks('treasure-hunters', { tokens: 4, used: [] }),
		{}
	);
	const pick = { kind: 'chooseSlot', player: 1, purpose: 'treasureHunters' };
	assert.equal(cardCivOf(pick), null);
	assert.equal(cardSpot(pick, { slot: 'desert' }, table({})), null);
	assert.deepEqual(
		civCardView(
			table({ 'treasure-hunters': { tokens: 3, used: ['mountain'] } }),
			1,
			'treasure-hunters',
			pick
		),
		{ marks: { mountain: ['used'] }, choices: {} }
	);
});

test("the Tinkerers' used options are marked; the option is chosen in the panel (#33)", () => {
	assert.deepEqual(civCardMarks('tinkerers', { used: [3, 1] }), {
		option3: ['used'],
		option1: ['used'],
	});
	assert.deepEqual(civCardMarks('tinkerers', { used: [] }), {});
	const pick = { kind: 'chooseSlot', player: 1, purpose: 'tinkerers' };
	assert.equal(cardCivOf(pick), null);
	assert.equal(cardSpot(pick, { slot: 2 }, table({})), null);
	assert.deepEqual(
		civCardView(table({ tinkerers: { used: [4] } }), 1, 'tinkerers', pick),
		{ marks: { option4: ['used'] }, choices: {} }
	);
});

test("the Spies' used options are marked, whatever they watch; the option and its target are chosen in the panel (#33)", () => {
	assert.deepEqual(
		civCardMarks('spies', {
			used: [2, 4],
			watching: [{ tile: 16, from: 2 }],
		}),
		{ option2: ['used'], option4: ['used'] }
	);
	assert.deepEqual(civCardMarks('spies', { used: [], watching: [] }), {});
	for (const purpose of [
		'spies',
		'spiesCard',
		'spiesTile',
		'spiesSpace',
		'spiesTech',
		'spiesLook',
	]) {
		const pick = { kind: 'chooseSlot', player: 1, purpose };
		assert.equal(cardCivOf(pick), null, purpose);
	}
	const pick = { kind: 'chooseSlot', player: 1, purpose: 'spies' };
	assert.equal(cardSpot(pick, { slot: 1 }, table({})), null);
	assert.deepEqual(
		civCardView(
			table({ spies: { used: [1], watching: [] } }),
			1,
			'spies',
			pick
		),
		{ marks: { option1: ['used'] }, choices: {} }
	);
});

test("the Utilitarians' tokens out sit beside their landmarks and leave the reserve; the landmark and the token are chosen in the panel (#33)", () => {
	assert.deepEqual(
		civCardMarks('utilitarians', { active: ['academy', 'forge'] }),
		{
			academy: ['token'],
			forge: ['token'],
			token0: ['used'],
			token1: ['used'],
		}
	);
	assert.deepEqual(civCardMarks('utilitarians', { active: ['barracks'] }), {
		barracks: ['token'],
		token0: ['used'],
	});
	assert.deepEqual(civCardMarks('utilitarians', { active: [] }), {});
	for (const purpose of [
		'utilitariansLandmark',
		'utilitariansPlace',
		'utilitariansToken',
	]) {
		assert.equal(
			cardCivOf({ kind: 'chooseSlot', player: 1, purpose }),
			null,
			purpose
		);
	}
	assert.deepEqual(
		civCardView(
			table({ utilitarians: { active: ['lighthouse'] } }),
			1,
			'utilitarians',
			{ kind: 'chooseSlot', player: 1, purpose: 'utilitariansToken' }
		),
		{ marks: { lighthouse: ['token'], token0: ['used'] }, choices: {} }
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

test('a token reserve empties one square from the left for each token out: Traders, Isolationists, Heralds (#180)', () => {
	assert.deepEqual(civCardMarks('traders', { tokens: 4 }), {});
	assert.deepEqual(civCardMarks('traders', { tokens: 3 }), {
		token0: ['used'],
	});
	assert.deepEqual(civCardMarks('isolationists', { tokens: 1 }), {
		token0: ['used'],
		token1: ['used'],
		token2: ['used'],
	});
	assert.deepEqual(civCardMarks('heralds', { tokens: 2, cards: [] }), {
		token0: ['used'],
		token1: ['used'],
	});
});

test("the Traders' card counts the token they placed, from the game's view (#180)", () => {
	const game = table({ traders: { tokens: 3 } });
	assert.deepEqual(civCardView(game, 1, 'traders').marks, {
		token0: ['used'],
	});
	const recipe = civCard('traders', {
		view: civCardView(game, 1, 'traders'),
	});
	assert.deepEqual(
		recipe.sections.find((s) => s.pattern === 'tokenReserve')?.props,
		{ count: 4, used: 1 }
	);
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
