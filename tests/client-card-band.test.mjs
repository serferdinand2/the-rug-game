// One card band and one edition chip for every card family (#109): each expansion's chip in its own card colour.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { render } from 'svelte/server';
import CardBand from '../src/lib/components/player/CardBand.svelte';
import CardEdition from '../src/lib/components/player/CardEdition.svelte';
import CardFrame from '../src/lib/components/player/CardFrame.svelte';
import LandmarkCard from '../src/lib/components/player/LandmarkCard.svelte';
import MasterpieceCard from '../src/lib/components/player/MasterpieceCard.svelte';
import TapestryCard from '../src/lib/components/player/TapestryCard.svelte';
import TechnologyCard from '../src/lib/components/player/TechnologyCard.svelte';
import { cardEditionColor } from '../src/lib/ui.js';
import { tapestryCardData } from '../src/lib/cards/game-cards.js';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const tokens = readFileSync(
	new URL('../src/styles/tokens.css', import.meta.url),
	'utf8'
);

/** The card families that draw a band and an edition chip. */
const FAMILIES = [
	'CardFrame',
	'TechnologyCard',
	'TapestryCard',
	'LandmarkCard',
	'MasterpieceCard',
];

test("each edition's chip has its own card colour: base brown, Plans & Ploys green, Arts & Architecture purple, Fantasies & Futures teal (owner, #109)", () => {
	assert.equal(cardEditionColor('base'), 'var(--card-band-start)');
	assert.equal(cardEditionColor('pp'), 'var(--card-plans-ploys)');
	assert.equal(cardEditionColor('aa'), 'var(--card-expansion)');
	assert.equal(cardEditionColor('ff'), 'var(--card-fantasies-futures)');
	assert.match(tokens, /--card-plans-ploys: #3f6b4b;/);
	assert.match(tokens, /--card-fantasies-futures: #276966;/);
	assert.match(tokens, /--card-expansion: #715398;/);
});

test('an edition chip names its edition and takes its colour; the base chip keeps its lighter border', () => {
	const pp = render(CardEdition, { props: { code: 'pp' } }).body;
	assert.match(pp, />Plans &amp; Ploys</);
	assert.match(pp, /--rg-card-edition-color: var\(--card-plans-ploys\)/);
	const base = render(CardEdition, { props: { code: 'base' } }).body;
	assert.match(base, />Base game</);
	assert.match(base, /rg-card-edition--base/);
	assert.doesNotMatch(pp, /rg-card-edition--base/);
});

test('a card band draws its title at its size, and the trap in red', () => {
	const civ = render(CardBand, {
		props: { title: 'Collectors', size: 'large' },
	}).body;
	assert.match(
		civ,
		/<header[^>]*class="rg-card-band rg-card-band--large[^"]*"/
	);
	assert.match(civ, /<h3 class="rg-card-band--title[^"]*">Collectors<\/h3>/);
	const trap = render(CardBand, {
		props: { title: 'Trap', size: 'small', trap: true },
	}).body;
	assert.match(trap, /rg-card-band--small/);
	assert.match(trap, /rg-card-band--trap/);
});

test('every card family draws its edition chip in its own colour (#109)', () => {
	const tapestry = render(TapestryCard, {
		props: { data: { ...tapestryCardData('academia'), edition: 'pp' } },
	}).body;
	assert.match(
		tapestry,
		/--rg-card-edition-color: var\(--card-plans-ploys\)/
	);
	assert.match(tapestry, />Plans &amp; Ploys</);
	assert.match(
		render(TapestryCard, { props: { id: 'academia' } }).body,
		/>Base game</
	);
	assert.match(
		render(TechnologyCard, { props: { id: 'clocks' } }).body,
		/>Base game</
	);
	const landmark = render(LandmarkCard, {
		props: {
			title: 'Game Store',
			artwork: '/art/landmark-card/game-store.svg',
			footprint: ['XX'],
			edition: 'pp',
		},
	}).body;
	assert.match(
		landmark,
		/--rg-card-edition-color: var\(--card-plans-ploys\)/
	);
	const masterpiece = render(MasterpieceCard, {
		props: {
			title: 'Painting',
			artwork: '/art/masterpiece/painting.svg',
			effects: /** @type {any} */ (() => {}),
		},
	}).body;
	assert.match(
		masterpiece,
		/--rg-card-edition-color: var\(--card-expansion\)/
	);
	assert.match(masterpiece, />Arts &amp; Architecture</);
	const frame = render(CardFrame, {
		props: {
			title: 'Fantasy Civ',
			portrait: '/art/civ/x.svg',
			editions: ['ff'],
		},
	}).body;
	assert.match(
		frame,
		/--rg-card-edition-color: var\(--card-fantasies-futures\)/
	);
	assert.match(frame, />Fantasies &amp; Futures</);
});

test('every card family draws its band and chip through CardBand and CardEdition, with -- class names (#109)', () => {
	for (const name of FAMILIES) {
		const source = readFileSync(
			`${SRC}lib/components/player/${name}.svelte`,
			'utf8'
		);
		assert.match(
			source,
			/import CardBand from '\.\/CardBand\.svelte';/,
			`${name} uses CardBand`
		);
		assert.match(
			source,
			/import CardEdition from '\.\/CardEdition\.svelte';/,
			`${name} uses CardEdition`
		);
	}
	const files = readdirSync(SRC, { recursive: true })
		.map(String)
		.map((file) => file.replaceAll('\\', '/'))
		.filter((file) => /\.(svelte|js|css)$/.test(file));
	for (const file of files) {
		const source = readFileSync(`${SRC}${file}`, 'utf8');
		assert.doesNotMatch(
			source,
			/rg-card-badge-(?:aa|base)|rg-card-edition--arts|rg-(?:landmark|masterpiece)-card__/,
			`${file} keeps an old band, chip or __ class`
		);
	}
});
