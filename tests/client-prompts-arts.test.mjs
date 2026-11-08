// The arts track's choices in the client (#35 part 4): create and firing on the masterpiece shelf, Stop, inspire in
// the panel with the Income tab, Rock Opera's refresh, the science die and the income strip's masterpiece step.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	incomeView,
	panelControls,
	promptFor,
	shelfCards,
} from '../src/lib/prompts.js';
import { answerConfirm, kindFacts } from '../src/lib/decision-kinds.js';
import { decisionTitle } from '../src/lib/decision-words.js';
import { masterpieceText } from '../src/lib/cards/masterpiece-text.js';

/** A table with the arts track: three players and a masterpiece deck of 14. */
const TABLE = {
	expansions: ['aa'],
	variants: [],
	seats: [{ name: 'Ana' }, { name: 'Ben' }, { name: 'Cy' }],
	supply: {
		masterpieces: {
			deck: 14,
			faceUp: ['painting', 'ballet', 'topiary'],
			discard: [],
		},
	},
};

const CREATE = {
	id: 1,
	player: 1,
	kind: 'chooseCreate',
	options: ['painting', 'ballet', 'topiary', 'deck'],
	answers: [
		{ card: 'painting' },
		{ card: 'ballet' },
		{ card: 'topiary' },
		{ card: 'deck' },
	],
};

/** Streaming Implants with Ana's Fresco, Ben's Theater and Cy's Graffiti on offer, Stop first. */
const IMPLANTS = {
	id: 2,
	player: 1,
	kind: 'chooseMasterpiece',
	purpose: 'implants',
	left: 3,
	chosen: [],
	options: [
		{ seat: 1, card: 'fresco' },
		{ seat: 2, card: 'theater' },
		{ seat: 3, card: 'graffiti' },
	],
	answers: [
		{ card: null },
		{ seat: 1, card: 'fresco' },
		{ seat: 2, card: 'theater' },
		{ seat: 3, card: 'graffiti' },
	],
};

test('create puts the 3 face-up masterpieces and the deck on the masterpiece shelf, and takes a card', () => {
	const prompt = promptFor(CREATE, TABLE, 1);
	assert.equal(prompt.shelf, 'masterpiece');
	assert.equal(prompt.confirmLabel, 'Take card');
	const cards = shelfCards(prompt, CREATE, TABLE);
	assert.equal(cards.length, 4);
	assert.deepEqual(cards[0].face, {
		masterpiece: 'painting',
		id: 'painting',
		title: 'Painting',
		artwork: '/art/masterpiece/painting.svg',
		text: masterpieceText('painting'),
	});
	assert.deepEqual(cards[3].face, { deck: 'masterpiece', count: 14 });
});

test("an income turn's firing asks which fires next, on the shelf, and fires it", () => {
	const decision = {
		...IMPLANTS,
		purpose: 'income',
		options: [
			{ seat: 1, card: 'fresco' },
			{ seat: 1, card: 'krav-maga' },
		],
		answers: [
			{ seat: 1, card: 'fresco' },
			{ seat: 1, card: 'krav-maga' },
		],
	};
	assert.equal(
		decisionTitle(decision, TABLE),
		'Your masterpieces fire: choose the next'
	);
	const prompt = promptFor(decision, TABLE, 1);
	assert.equal(prompt.confirmLabel, 'Fire');
	assert.deepEqual(
		shelfCards(prompt, decision, TABLE).map((card) => card.face),
		[
			{
				masterpiece: 'fresco',
				id: 'fresco',
				title: 'Fresco',
				artwork: '/art/masterpiece/fresco.svg',
				text: masterpieceText('fresco'),
			},
			{
				masterpiece: 'krav-maga',
				id: 'krav-maga',
				title: 'Krav Maga',
				artwork: '/art/masterpiece/krav-maga.svg',
				text: masterpieceText('krav-maga'),
			},
		]
	);
});

test('Broadcast names itself', () => {
	assert.equal(
		decisionTitle({ ...IMPLANTS, purpose: 'broadcast' }, TABLE),
		'Broadcast: choose a masterpiece to fire'
	);
});

test("Streaming Implants marks a neighbour's card with its owner and counts the cards fired", () => {
	assert.equal(
		decisionTitle(IMPLANTS, TABLE),
		'Streaming Implants: choose a masterpiece to fire (1 of 3)'
	);
	assert.equal(
		decisionTitle({ ...IMPLANTS, left: 1 }, TABLE),
		'Streaming Implants: choose a masterpiece to fire (3 of 3)'
	);
	const prompt = promptFor(IMPLANTS, TABLE, 1);
	const cards = shelfCards(prompt, IMPLANTS, TABLE);
	assert.deepEqual(
		cards.map((card) => [card.index, /** @type {any} */ (card.face).owner]),
		[
			[1, undefined],
			[2, { seat: 2, name: 'Ben' }],
			[3, { seat: 3, name: 'Cy' }],
		]
	);
});

test('Streaming Implants may stop: Stop is a panel option, and Confirm says Stop', () => {
	const prompt = promptFor(IMPLANTS, TABLE, 1);
	const stop = prompt.options.find((option) => option.index === 0);
	assert.equal(stop?.place, 'panel');
	assert.equal(stop?.label, 'Stop');
	assert.equal(answerConfirm(IMPLANTS, IMPLANTS.answers[0]), 'Stop');
});

test('inspire lists the rows in the panel with their buildings, opens the Income tab and places the tile', () => {
	const decision = {
		id: 3,
		player: 1,
		kind: 'chooseInspire',
		options: ['house', 'farm', 'armory'],
		answers: [{ row: 'house' }, { row: 'farm' }, { row: 'armory' }],
	};
	assert.equal(kindFacts('chooseInspire').tab, 'income');
	const prompt = promptFor(decision, TABLE, 1);
	assert.equal(prompt.confirmLabel, 'Place tile');
	assert.deepEqual(
		prompt.options.map((option) => [
			option.place,
			option.label,
			option.art,
		]),
		[
			['panel', 'The Houses row', [{ kind: 'building', id: 'house' }]],
			['panel', 'The Farms row', [{ kind: 'building', id: 'farm' }]],
			['panel', 'The Armories row', [{ kind: 'building', id: 'armory' }]],
		]
	);
});

test("Rock Opera's refresh keeps or refreshes the face-up masterpieces", () => {
	const decision = {
		id: 4,
		player: 1,
		kind: 'chooseRefresh',
		answers: [{ refresh: false }, { refresh: true }],
	};
	assert.deepEqual(
		promptFor(decision, TABLE, 1).options.map((option) => option.label),
		['Keep them', 'Refresh them']
	);
});

test('the die to roll shows each die and rolls it', () => {
	const decision = {
		id: 5,
		player: 1,
		kind: 'chooseScienceDie',
		options: ['d20', 'd12'],
		answers: [{ die: 'd20' }, { die: 'd12' }],
	};
	const prompt = promptFor(decision, TABLE, 1);
	assert.equal(prompt.confirmLabel, 'Roll');
	assert.deepEqual(
		prompt.options.map((option) => option.art),
		[
			[{ kind: 'die-body', id: 'science-d20' }],
			[{ kind: 'die-body', id: 'science' }],
		]
	);
});

test('the income strip shows the masterpieces step with the arts track, and not without it', () => {
	/** @param {any} game */
	const steps = (game) =>
		incomeView(
			{
				...game,
				events: [
					{ seq: 5, type: 'incomeTurnStarted', player: 1, turn: 2 },
				],
				pending: [],
			},
			1
		)?.steps.map((step) => step.label);
	assert.equal(steps(TABLE)?.[0], 'Masterpieces');
	assert.ok(!steps({ ...TABLE, expansions: [] })?.includes('Masterpieces'));
});

test('a picked masterpiece fires with Fire, and the deck with Take card', () => {
	const prompt = promptFor(CREATE, TABLE, 1);
	const controls = panelControls(prompt, {
		picked: 3,
		pick: null,
		pickStatus: null,
		pickIndex: -1,
		offering: false,
		offered: false,
		tradeAnswer: -1,
		decline: -1,
		exploring: false,
		docked: false,
		hex: null,
		options: false,
		sending: false,
	});
	assert.equal(controls.confirmLabel, 'Take card');
	assert.equal(controls.confirmDisabled, false);
});

test("R121: Cloud City's moves sit in the panel beside the masterpieces on the shelf, and Confirm says Move buildings (#36 joined)", () => {
	const decision = {
		...IMPLANTS,
		purpose: 'income',
		cloud: 2,
		options: [{ seat: 1, card: 'krav-maga' }],
		answers: [{ seat: 1, card: 'krav-maga' }, { cloudMove: true }],
	};
	const prompt = promptFor(decision, TABLE, 1);
	assert.deepEqual(
		prompt.options.map((option) => [option.place, option.label]),
		[
			['shelf', 'Krav Maga'],
			['panel', 'Cloud City: move up to 2 income buildings'],
		]
	);
	assert.equal(
		answerConfirm(decision, { cloudMove: true }),
		'Move buildings'
	);
	assert.equal(answerConfirm(decision, { seat: 1, card: 'krav-maga' }), null);
	const controls = panelControls(
		prompt,
		/** @type {any} */ ({
			pick: null,
			picked: 1,
			tradeAnswer: -1,
			sending: false,
		})
	);
	assert.equal(controls.confirmLabel, 'Move buildings');
});
