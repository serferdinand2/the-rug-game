// The tech and tapestry cards as their faces show them, built from the engine's data (#27 design §3).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { techCardData, tapestryCardData } from '../src/lib/cards/game-cards.js';
import {
	TECHNOLOGY_CARDS,
	TAPESTRY_CARDS as TAPESTRY_FIXTURES,
	technologyCardMarkup,
	technologyFixture,
	tapestryCardMarkup,
	tapestryFixture,
} from '../src/lib/cards/card-layouts.js';
import { TECH_CARDS } from '../src/lib/engine/data/tech-cards.js';
import { TAPESTRY_CARDS } from '../src/lib/engine/data/tapestry-cards.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';

/** The folder the drawn card art is committed in. */
const ART = fileURLToPath(new URL('../static/art/', import.meta.url));

/**
 * Checks that a card's text is a sentence a player can read: never empty, and no missing value or JSON shows through.
 * @param {unknown} text
 * @param {string} what - Named in the failure
 */
function assertText(text, what) {
	assert.equal(typeof text, 'string', `${what} is not a string`);
	const words = /** @type {string} */ (text);
	assert.ok(words.trim().length > 0, `${what} is empty`);
	for (const bad of ['undefined', 'null', 'NaN', '[object', '{', '}']) {
		assert.ok(!words.includes(bad), `${what} reads "${words}"`);
	}
	assert.match(
		words,
		/^[A-Z0-9]/,
		`${what} starts in lower case: "${words}"`
	);
}

test('every tech card builds its face from the engine data', () => {
	for (const card of TECH_CARDS) {
		const data = techCardData(card.id);
		assert.equal(data.title, card.name);
		assertText(data.circle, `${card.id}'s circle`);
		assertText(data.square, `${card.id}'s square`);
		assert.match(data.circle, /\.$/, `${card.id}'s circle is a sentence`);
		assert.match(data.square, /\.$/, `${card.id}'s square is a sentence`);
		assert.ok(
			existsSync(`${ART}tech/${data.art}.svg`),
			`${card.id} has no art at tech/${data.art}.svg`
		);
		if (data.innovation === undefined) {
			assert.ok(TRACK_IDS.includes(/** @type {any} */ (data.track)));
			assert.ok([2, 3, 4].includes(/** @type {number} */ (data.level)));
		} else {
			assertText(data.innovation, `${card.id}'s innovation`);
			assert.equal(data.track, undefined);
			assert.equal(data.level, undefined);
		}
	}
});

test('Clocks reads its prerequisite as Technology 2, like the reviewed fixture', () => {
	const data = techCardData('clocks');
	assert.equal(data.track, TECHNOLOGY_CARDS.clocks.track);
	assert.equal(data.level, TECHNOLOGY_CARDS.clocks.level);
	assert.equal(data.art, 'clocks');
	assert.equal(
		data.square,
		'Gain 1 VP for each space you have advanced on Technology.'
	);
	const markup = technologyCardMarkup(data);
	assert.match(markup, /\/art\/track\/technology\.svg/);
	assert.match(markup, />Technology<\/b><b>2<\/b>/);
	assert.match(markup, /\/art\/tech\/clocks\.svg/);
});

test('a landmark card needs the income-mat innovation by its printed name (R18)', () => {
	const data = techCardData('bakery');
	assert.equal(data.innovation, TECHNOLOGY_CARDS.bakery.innovation);
	assert.equal(techCardData('com-tower').innovation, 'Telephone');
	assert.equal(techCardData('stock-market').innovation, 'Banking');
	assert.equal(data.square, 'Gain the Bakery landmark.');
	assert.match(technologyCardMarkup(data), /<b>Farming uncovered<\/b>/);
});

test('a card title is escaped in the markup', () => {
	const data = techCardData('sewage-plumbing');
	assert.equal(data.title, 'Sewage & Plumbing');
	assert.match(technologyCardMarkup(data), /Sewage &amp; Plumbing/);
	assert.doesNotMatch(technologyCardMarkup(data), /Sewage & Plumbing/);
});

test('every tapestry card builds its face from the engine data', () => {
	for (const card of TAPESTRY_CARDS) {
		const data = tapestryCardData(card.id);
		assert.equal(data.title, card.name);
		assertText(data.copy, `${card.id}'s ability`);
		assert.match(data.copy, /\.$/, `${card.id}'s ability is a sentence`);
		assert.notEqual(data.copy, 'Nothing.', `${card.id} has no words`);
		assert.doesNotMatch(
			data.copy,
			/\bresolve\b/i,
			`${card.id} only names itself: "${data.copy}"`
		);
		if (data.note !== undefined) {
			assertText(data.note, `${card.id}'s note`);
		}
		assert.ok(
			existsSync(`${ART}tapestry/${data.art}.svg`),
			`${card.id} has no art at tapestry/${data.art}.svg`
		);
	}
});

test('a tapestry card shows its timing as This Era or When Played', () => {
	assert.equal(tapestryCardData('academia').timing, 'This Era');
	assert.equal(
		tapestryCardData('academia').copy,
		'Whenever you invent a tech card or gain a tapestry card, gain 3 VP.'
	);
	assert.equal(tapestryCardData('age-of-discovery').timing, 'When Played');
	assert.equal(
		tapestryCardData('meritocracy').copy,
		'Invent a tech card, then gain 2 VP for each tech card you have.'
	);
	for (const card of TAPESTRY_CARDS) {
		const { timing, trap } = tapestryCardData(card.id);
		if (card.id !== 'trap') {
			assert.equal(trap, undefined);
			assert.equal(
				timing,
				card.timing === 'era' ? 'This Era' : 'When Played'
			);
		}
	}
});

test('a trap is a response card, and every trap copy is the trap (R22)', () => {
	const data = tapestryCardData('trap');
	assert.equal(data.trap, true);
	assert.equal(data.timing, TAPESTRY_FIXTURES.trap.timing);
	assert.equal(data.title, 'Trap');
	assert.equal(data.art, 'trap');
	assert.match(data.copy, /conquer/);
	assert.match(/** @type {string} */ (data.note), /10 VP/);
	assert.deepEqual(tapestryCardData('trap-3'), data);
	assert.match(tapestryCardMarkup(data), /rg-tapestry-layout--trap/);
	assert.match(
		tapestryCardMarkup(data),
		/rg-tapestry-layout__timing--trap">Trap · Response</
	);
});

test('the reviewed fixtures still draw by id', () => {
	assert.equal(technologyFixture('clocks'), TECHNOLOGY_CARDS.clocks);
	assert.equal(tapestryFixture('academia'), TAPESTRY_FIXTURES.academia);
	assert.throws(() => technologyFixture('no-such-card'), /no-such-card/);
	assert.throws(() => tapestryFixture('no-such-card'), /no-such-card/);
	assert.match(
		tapestryCardMarkup(tapestryFixture('age-of-discovery')),
		/rg-tapestry-layout__timing--when-played/
	);
});

test('an unknown card id is refused', () => {
	assert.throws(() => techCardData('no-such-card'), /no-such-card/);
	assert.throws(() => tapestryCardData('no-such-card'), /no-such-card/);
});
