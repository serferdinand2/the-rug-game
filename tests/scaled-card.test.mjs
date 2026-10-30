// Cards are scaled one way (#92): ScaledCard takes its size from CARD_SIZES, and the decision shelf fans with CardFan.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import CardFan from '../src/lib/components/player/CardFan.svelte';
import ScaledCard from '../src/lib/components/player/ScaledCard.svelte';
import CardShelf from '../src/lib/components/prompts/CardShelf.svelte';
import { CARD_SIZES } from '../src/lib/cards/card-sizes.js';
import { shelfFace } from '../src/lib/prompts.js';

/**
 * Shelf cards named by id, with the faces the shelf takes (#118).
 * @param {'tapestry' | 'tech' | 'civ' | 'mat'} kind
 * @param {{ index: number, id: string, label: string, deck?: number }[]} cards
 */
const faced = (kind, cards) =>
	cards.map(({ index, id, label, deck }) => ({
		index,
		label,
		face: shelfFace(kind, id, deck),
	}));

/** @param {string} path - A path from the project root */
const source = (path) =>
	readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/** A snippet drawing a plain card, for the components that take one. */
const face = createRawSnippet(() => ({
	render: () => '<i class="test-face">card</i>',
}));

/** One CardFan card per item, as its `card` snippet draws it. */
const fanCard = createRawSnippet((/** @type {() => string} */ item) => ({
	render: () => `<i class="test-card">${item()}</i>`,
}));

/**
 * The opening tags of the buttons, in order.
 * @param {string} html
 * @returns {string[]}
 */
const buttons = (html) => [...html.matchAll(/<button\s[^>]*>/g)].map(String);

/**
 * A CSS rule's body from a stylesheet: the rule for that selector alone, not a list it ends.
 * @param {string} css
 * @param {string} selector
 */
function rule(css, selector) {
	const found = new RegExp(
		`(^|[}/]\\s*\\n)${selector.replace(/[.*]/g, '\\$&')} \\{`
	).exec(css);
	assert.ok(found, `no ${selector} rule`);
	return css.slice(found.index, css.indexOf('}', found.index + 1));
}

/**
 * The class names on the first tag that has the given class.
 * @param {string} html
 * @param {string} name
 * @returns {string[]}
 */
function classesOf(html, name) {
	const tag = [...html.matchAll(/<[a-z]+\s[^>]*>/g)]
		.map(String)
		.find((candidate) =>
			(/class="([^"]*)"/.exec(candidate)?.[1] ?? '')
				.split(/\s+/)
				.includes(name)
		);
	assert.ok(tag, `no element with class ${name}`);
	return (/class="([^"]*)"/.exec(tag)?.[1] ?? '')
		.split(/\s+/)
		.filter((one) => one && !one.startsWith('svelte-'));
}

/**
 * How many elements have the given class.
 * @param {string} html
 * @param {string} name
 */
const countOf = (html, name) =>
	[...html.matchAll(/class="([^"]*)"/g)].filter((m) =>
		m[1].split(/\s+/).includes(name)
	).length;

test('CARD_SIZES are the sizes the card styles draw', () => {
	const layouts = source('src/styles/card-layouts.css');
	const tech = rule(layouts, '.rg-tech-layout');
	assert.match(tech, new RegExp(`width: ${CARD_SIZES.tech.width}px;`));
	assert.match(tech, new RegExp(`min-height: ${CARD_SIZES.tech.height}px;`));
	// The rows are fixed, so a tech card is never taller: its rows and its 2 px border, top and bottom.
	const rows = /grid-template-rows: ([^;]+);/.exec(tech)?.[1] ?? '';
	const sum = rows
		.split(/\s+/)
		.reduce((total, size) => total + Number.parseFloat(size), 0);
	assert.match(
		rule(layouts, '.rg-tech-layout,\n.rg-tapestry-layout'),
		/border: 2px/
	);
	assert.equal(sum + 2 * 2, CARD_SIZES.tech.height);

	const tapestry = rule(layouts, '.rg-tapestry-layout');
	assert.match(
		tapestry,
		new RegExp(`width: ${CARD_SIZES.tapestry.width}px;`)
	);
	assert.equal('height' in CARD_SIZES.tapestry, false);

	const patterns = source('src/styles/card-patterns.css');
	assert.match(
		rule(patterns, '.rg-card-frame'),
		new RegExp(`width: ${CARD_SIZES.civilization.width}px;`)
	);
	assert.equal('height' in CARD_SIZES.civilization, false);
});

test('a ScaledCard is its card at the scale given, the card kept at full size inside', () => {
	const html = render(ScaledCard, {
		props: { scale: 0.42, ...CARD_SIZES.tech, children: face },
	}).body;
	const [outer, inner] = [...html.matchAll(/<span\s[^>]*>/g)].map(String);
	assert.deepEqual(classesOf(outer, 'rg-scaled-card'), ['rg-scaled-card']);
	assert.match(outer, /--rg-scaled-card-scale: 0\.42/);
	assert.match(outer, /--rg-scaled-card-width: 425px/);
	assert.match(outer, /--rg-scaled-card-height: 298px/);
	assert.deepEqual(classesOf(inner, 'rg-scaled-card--face'), [
		'rg-scaled-card--face',
	]);
	assert.match(inner, /width: 425px/);
	assert.match(inner, /height: 298px/);
	assert.match(html, /<i class="test-face">card<\/i>/);
});

test('a ScaledCard without a height measures its card', () => {
	const html = render(ScaledCard, {
		props: {
			scale: 0.7,
			...CARD_SIZES.tapestry,
			children: face,
			'aria-hidden': 'true',
			class: 'extra',
		},
	}).body;
	const [outer, inner] = [...html.matchAll(/<span\s[^>]*>/g)].map(String);
	assert.deepEqual(classesOf(outer, 'rg-scaled-card'), [
		'rg-scaled-card',
		'extra',
	]);
	assert.match(outer, /aria-hidden="true"/);
	assert.match(outer, /--rg-scaled-card-width: 319px/);
	assert.match(inner, /width: 319px/);
	assert.doesNotMatch(inner, /height/);
	// The scaler's own rules, which the shelf, the tabs and the overview shared before.
	const css = source('src/lib/components/player/ScaledCard.svelte');
	assert.match(css, /transform: scale\(var\(--rg-scaled-card-scale\)\);/);
	assert.match(css, /transform-origin: top left;/);
});

test("the hand's fan is drawn as before: no pressed state, names or disabled cards", () => {
	const html = render(CardFan, {
		props: { items: ['a', 'b', 'c'], card: fanCard, overlap: 70 },
	}).body;
	assert.deepEqual(classesOf(html, 'rg-card-fan'), [
		'rg-card-fan',
		'rg-card-fan--hand',
	]);
	const tags = buttons(html);
	assert.equal(tags.length, 3);
	for (const tag of tags) {
		assert.doesNotMatch(tag, /aria-pressed|aria-label|disabled/);
	}
	assert.match(tags[0], /margin-left: 0/);
	assert.match(tags[1], /margin-left: -70px/);
});

test('a fan can have several cards chosen and some disabled, each with its name', () => {
	const html = render(CardFan, {
		props: {
			items: ['a', 'b', 'c', 'd'],
			card: fanCard,
			selected: [0, 2],
			disabled: [3],
			labels: ['Alpha', 'Beta', 'Gamma', 'Delta'],
			look: 'shelf',
			lift: false,
		},
	}).body;
	assert.deepEqual(classesOf(html, 'rg-card-fan'), [
		'rg-card-fan',
		'rg-card-fan--shelf',
		'rg-card-fan--flat',
	]);
	const tags = buttons(html);
	assert.deepEqual(
		tags.map((tag) => /aria-pressed="(\w+)"/.exec(tag)?.[1]),
		['true', 'false', 'true', 'false']
	);
	assert.deepEqual(
		tags.map((tag) => /aria-label="(\w+)"/.exec(tag)?.[1]),
		['Alpha', 'Beta', 'Gamma', 'Delta']
	);
	assert.deepEqual(
		tags.map((tag) => /\sdisabled/.test(tag)),
		[false, false, false, true]
	);
	assert.deepEqual(
		tags.map((tag) => /rg-card-fan--selected/.test(tag)),
		[true, false, true, false]
	);
});

test('an empty choice still says each card is not pressed, and one index chooses one card', () => {
	const none = buttons(
		render(CardFan, {
			props: { items: ['a', 'b'], card: fanCard, selected: [] },
		}).body
	);
	assert.deepEqual(
		none.map((tag) => /aria-pressed="(\w+)"/.exec(tag)?.[1]),
		['false', 'false']
	);
	const one = buttons(
		render(CardFan, {
			props: { items: ['a', 'b'], card: fanCard, selected: 1 },
		}).body
	);
	assert.deepEqual(
		one.map((tag) => /aria-pressed="(\w+)"/.exec(tag)?.[1]),
		['false', 'true']
	);
});

test('the shelf fans with CardFan, its cards pressed and disabled by answer index', () => {
	const html = render(CardShelf, {
		props: {
			kind: 'tapestry',
			cards: faced('tapestry', [
				{ index: 4, id: 'academia', label: 'Academia' },
				{ index: 7, id: 'capitalism', label: 'Capitalism' },
				{ index: 9, id: 'monarchy', label: 'Monarchy' },
			]),
			selected: [7],
			disabled: [9],
		},
	}).body;
	assert.deepEqual(classesOf(html, 'rg-card-fan'), [
		'rg-card-fan',
		'rg-card-fan--shelf',
		'rg-card-shelf--row',
	]);
	assert.match(
		html,
		/role="group" aria-label="Tapestry cards to choose from"/
	);
	assert.equal(html.match(/role="group"/g)?.length, 1);
	const tags = buttons(html);
	assert.equal(tags.length, 3);
	assert.deepEqual(
		tags.map((tag) => /aria-pressed="(\w+)"/.exec(tag)?.[1]),
		['false', 'true', 'false']
	);
	assert.deepEqual(
		tags.map((tag) => /\sdisabled/.test(tag)),
		[false, false, true]
	);
	assert.deepEqual(
		tags.map((tag) => /aria-label="(\w+)"/.exec(tag)?.[1]),
		['Academia', 'Capitalism', 'Monarchy']
	);
	assert.equal(countOf(html, 'rg-scaled-card'), 3);
	assert.match(html, /--rg-scaled-card-scale: 0\.7/);
});

test('more than four tapestry cards overlap by 72 px on the shelf; fewer sit apart', () => {
	const six = [
		'academia',
		'age-of-discovery',
		'capitalism',
		'monarchy',
		'colonialism',
		'trap-1',
	].map((id, index) => ({
		index,
		label: id,
		face: shelfFace('tapestry', id),
	}));
	const fanned = render(CardShelf, {
		props: { kind: 'tapestry', cards: six },
	}).body;
	assert.match(fanned, /rg-card-shelf--fanned/);
	const tags = buttons(fanned);
	assert.match(tags[0], /margin-left: 0/);
	for (const tag of tags.slice(1)) {
		assert.match(tag, /margin-left: -72px/);
	}
	const apart = buttons(
		render(CardShelf, {
			props: { kind: 'tapestry', cards: six.slice(0, 4) },
		}).body
	);
	for (const tag of apart.slice(1)) {
		assert.match(tag, /margin-left: -0px|margin-left: 0/);
	}
});

test('the shelf draws tech cards and the deck in a ScaledCard; civilizations and mats do not lift', () => {
	const tech = render(CardShelf, {
		props: {
			kind: 'tech',
			cards: faced('tech', [
				{ index: 0, id: 'clocks', label: 'Clocks' },
				{ index: 1, id: 'deck', label: 'Top of the deck', deck: 21 },
			]),
		},
	}).body;
	assert.equal(countOf(tech, 'rg-scaled-card'), 2);
	assert.match(tech, /--rg-scaled-card-scale: 0\.65/);
	assert.match(tech, /Deck · 21/);
	assert.doesNotMatch(tech, /rg-card-fan--flat/);
	for (const kind of ['civ', 'mat']) {
		const html = render(CardShelf, {
			props: {
				kind,
				cards: faced(kind, [
					{
						index: 0,
						id: kind === 'civ' ? 'nomads' : '1',
						label: 'One',
					},
				]),
			},
		}).body;
		assert.match(html, /rg-card-fan--flat/, kind);
	}
});

test('no caller types a card size, and every scaled card goes through ScaledCard', () => {
	for (const path of [
		'src/screens/game/PlayerTabs.svelte',
		'src/screens/game/PlayersOverview.svelte',
		'src/lib/components/prompts/CardShelf.svelte',
	]) {
		const text = source(path);
		assert.doesNotMatch(text, /\b(425|298|319)\b/, path);
		assert.doesNotMatch(
			text,
			/--scale\b|--scaled\b|transform: scale/,
			path
		);
	}
	assert.equal(
		existsSync(
			new URL(
				'../src/lib/components/player/ScaledTapestryCard.svelte',
				import.meta.url
			)
		),
		false
	);
	assert.doesNotMatch(
		source('src/lib/components/prompts/CardShelf.svelte'),
		/margin-left|SCALED|CIV_WIDTH/
	);
});
