// The tech and tapestry cards as their faces show them, built from the engine's data (#27 design §3) and drawn as
// Svelte markup (#108).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { render } from 'svelte/server';
import {
	techCardData,
	tapestryCardData,
	tapestryTiming,
} from '../src/lib/cards/game-cards.js';
import TechnologyCard from '../src/lib/components/player/TechnologyCard.svelte';
import TapestryCard from '../src/lib/components/player/TapestryCard.svelte';
import { TECH_CARDS } from '../src/lib/engine/data/tech-cards.js';
import { TAPESTRY_CARDS } from '../src/lib/engine/data/tapestry-cards.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';

/** The source folder, for the guard. */
const SRC = fileURLToPath(new URL('../src/', import.meta.url));

/**
 * A tech card as its component draws it.
 * @param {import('../src/lib/cards/game-cards.js').TechnologyCardData} data
 */
const techMarkup = (data) => render(TechnologyCard, { props: { data } }).body;

/**
 * A tapestry card as its component draws it.
 * @param {import('../src/lib/cards/game-cards.js').TapestryCardData} data
 */
const tapestryMarkup = (data) => render(TapestryCard, { props: { data } }).body;

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

test('Clocks reads its prerequisite as Technology 2, as the reviewed card does', () => {
	const data = techCardData('clocks');
	assert.equal(data.track, 'technology');
	assert.equal(data.level, 2);
	assert.equal(data.art, 'clocks');
	assert.equal(
		data.square,
		'Gain 1 VP for each space you have advanced on Technology.'
	);
	const markup = techMarkup(data);
	assert.match(markup, /\/art\/track\/technology\.svg/);
	assert.match(
		markup,
		/rg-tech-layout--track rg-tech-layout--track-technology[^>]*>Technology<\/b>\s*<b>2<\/b>/
	);
	assert.match(markup, /\/art\/tech\/clocks\.svg/);
	assert.match(
		markup,
		/Gain 1 VP for each space you have advanced on Technology\./
	);
});

test('a landmark card needs the income-mat innovation by its printed name (R18)', () => {
	const data = techCardData('bakery');
	assert.equal(data.innovation, 'Farming');
	assert.equal(techCardData('com-tower').innovation, 'Telephone');
	assert.equal(techCardData('stock-market').innovation, 'Banking');
	assert.equal(data.square, 'Gain the Bakery landmark.');
	assert.match(techMarkup(data), /<b>Farming uncovered<\/b>/);
});

test('a card title is escaped in the markup', () => {
	const data = techCardData('sewage-plumbing');
	assert.equal(data.title, 'Sewage & Plumbing');
	assert.match(techMarkup(data), /Sewage &amp; Plumbing/);
	assert.doesNotMatch(techMarkup(data), /Sewage & Plumbing/);
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
	assert.equal(data.timing, 'Trap · Response');
	assert.equal(data.title, 'Trap');
	assert.equal(data.art, 'trap');
	assert.match(data.copy, /conquer/);
	assert.match(/** @type {string} */ (data.note), /10 VP/);
	assert.deepEqual(tapestryCardData('trap-3'), data);
	assert.match(
		tapestryMarkup(data),
		/rg-tapestry-layout rg-tapestry-layout--trap/
	);
	assert.match(
		tapestryMarkup(data),
		/rg-tapestry-layout--timing rg-tapestry-layout--timing-trap[^>]*>Trap · Response</
	);
});

test("a tapestry card's timing names its label's colour: the trap, When Played or This Era (#108)", () => {
	assert.equal(tapestryTiming(tapestryCardData('trap')), 'trap');
	assert.equal(tapestryTiming(tapestryCardData('dark-ages')), 'when-played');
	assert.equal(tapestryTiming(tapestryCardData('academia')), 'this-era');
	assert.equal(
		tapestryTiming({
			title: 'Cartography',
			art: 'cartography',
			timing: '',
			copy: 'Rules text pending',
		}),
		null
	);
	assert.match(
		tapestryMarkup(tapestryCardData('dark-ages')),
		/rg-tapestry-layout--timing-when-played[^>]*>When Played</
	);
	assert.doesNotMatch(
		tapestryMarkup({
			title: 'Cartography',
			art: 'cartography',
			timing: '',
			copy: 'Rules text pending',
		}),
		/rg-tapestry-layout--timing/
	);
});

test('a tapestry card draws its ability and the trap its note, from the engine (#108)', () => {
	const academia = tapestryMarkup(tapestryCardData('academia'));
	assert.match(
		academia,
		/Whenever you invent a tech card or gain a tapestry card, gain 3 VP\./
	);
	assert.match(academia, /\/art\/tapestry\/academia\.svg/);
	const trap = tapestryMarkup(tapestryCardData('trap'));
	assert.match(trap, /rg-tapestry-layout--note[^>]*>[^<]*10 VP/);
});

test('the tech and tapestry cards are Svelte markup: no {@html}, no card-layouts.js builders, and -- class names (#108)', () => {
	for (const name of ['TechnologyCard', 'TapestryCard']) {
		const source = readFileSync(
			`${SRC}lib/components/player/${name}.svelte`,
			'utf8'
		);
		assert.doesNotMatch(source, /\{@html/, name);
	}
	assert.equal(existsSync(`${SRC}lib/cards/card-layouts.js`), false);
	const files = readdirSync(SRC, { recursive: true })
		.map(String)
		.filter((file) => /\.(svelte|js|css)$/.test(file));
	for (const file of files) {
		const source = readFileSync(`${SRC}${file}`, 'utf8');
		assert.doesNotMatch(source, /rg-(?:tech|tapestry)-layout__/, file);
	}
});

test('an unknown card id is refused', () => {
	assert.throws(() => techCardData('no-such-card'), /no-such-card/);
	assert.throws(() => tapestryCardData('no-such-card'), /no-such-card/);
});

test('the card faces the audit checked say exactly what the engine does', () => {
	const tapestry = (/** @type {string} */ id) => tapestryCardData(id).copy;
	// Ties are "otherwise" (02 §3 #4).
	assert.match(tapestry('age-of-wonders'), /otherwise, ties included, gain/);
	// R26: the block lifts when turn order reaches the dictator again.
	assert.match(tapestry('dictatorship'), /until your next turn starts/);
	// One sentence, in any order, with the free bonus optional (02 §3 #33, FAQ #4).
	assert.equal(
		tapestry('renaissance'),
		'Advance once on each track, in any order, without their benefits. You may take each bonus you reach for free.'
	);
	// Only the food earned can be converted (the design's BGA reading).
	assert.match(tapestry('mercantilism'), /convert food you earned/);
	assert.equal(
		tapestry('steam-tycoon'),
		'Invent a face-up tech card and upgrade it. Then each of your neighbours invents the top card of the tech deck.'
	);
	const tech = (/** @type {string} */ id) => techCardData(id);
	// The X: Time Travel's regress gives nothing (02 §4 #28).
	assert.match(tech('time-travel').square, /without its benefit or bonus/);
	// Lithium-Ion Battery may pay the bonus (02 §4 #18), once a turn (FAQ #6).
	assert.match(tech('lithium-ion-battery').square, /you may pay its bonus/);
	assert.match(tech('lithium-ion-battery').square, /once a turn/i);
	// Radio draws from the civilization deck (02 §4 #22).
	assert.match(tech('radio').square, /draw another civilization/i);
});
