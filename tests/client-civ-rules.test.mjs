// The base civilizations' full abilities in words, in each table version (#42), checked against the engine's own rules.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { civAbilityText, civRules } from '../src/lib/cards/civ-rules.js';
// game.js first: it loads the civilization modules in an order free of their import cycle.
import { VERSIONS } from '../src/lib/engine/game.js';
import { CIVS } from '../src/lib/engine/civs/index.js';
import { CRAFTSMEN_COLUMNS } from '../src/lib/engine/civs/craftsmen.js';
import { ENTERTAINERS_GRID } from '../src/lib/engine/civs/entertainers.js';
import { MERRYMAKERS_COLUMNS } from '../src/lib/engine/civs/merrymakers.js';
import { MILITANTS_SPACES } from '../src/lib/engine/civs/militants.js';
import { ASSETS } from '../src/lib/art/catalog.js';

/** @typedef {import('../src/lib/engine/data/effects.js').Effect} Effect */

const VERSION_IDS = VERSIONS.map((version) => version.id);

/**
 * Civilizations whose rules, not a setup adjustment, change with the version: the Inventors' top-row benefit (the
 * F&F rulebook r10-1, 03 FF.8.2), which civs/inventors.js gives only under the original rules.
 */
const VERSIONED_RULES = ['inventors'];

/** The words for a resource, a tile or a card, one and several. @type {Record<string, [string, string]>} */
const NOUNS = {
	coin: ['coin', 'coins'],
	worker: ['worker', 'workers'],
	food: ['food', 'food'],
	culture: ['culture', 'culture'],
	any: ['resource of your choice', 'resources of your choice'],
	territory: ['territory tile', 'territory tiles'],
	tapestry: ['tapestry card', 'tapestry cards'],
};

/** @type {Record<string, string>} */
const TRACK_NAMES = {
	exploration: 'Exploration',
	science: 'Science',
	technology: 'Technology',
	military: 'Military',
};

/**
 * The phrases a civilization's text must show, in order, for one of the engine's effects. Unknown kinds throw, so a
 * changed grid fails here instead of passing unread.
 * @param {Effect} effect
 * @returns {string[]}
 */
function phrasesOf(effect) {
	const [[kind, value]] = Object.entries(effect);
	if (kind === 'gain' || kind === 'lose') {
		return Object.entries(value).map(([key, n]) => {
			const [one, several] = NOUNS[key];
			return `${n} ${n === 1 ? one : several}`;
		});
	}
	if (kind === 'vp') {
		return typeof value === 'number'
			? [`${value} VP`]
			: [`${value.each} VP for each ${value.per}`];
	}
	if (kind === 'building') {
		return [value[0].toUpperCase() + value.slice(1)];
	}
	if (kind === 'invent' || kind === 'upgrade') {
		return [`${kind} a tech card`];
	}
	if (kind === 'explore' || kind === 'conquer') {
		return [`${kind} a territory`];
	}
	if (kind === 'research') {
		return value.noBenefit
			? ['roll the science die', 'without its benefit or bonus']
			: ['roll the science die'];
	}
	if (kind === 'advance') {
		return value.tracks.map((/** @type {string} */ t) => TRACK_NAMES[t]);
	}
	throw new Error(`No phrase for the effect kind ${kind}.`);
}

/**
 * Asserts that each phrase shows in the text in order, starting at a marker.
 * @param {string} text
 * @param {string} marker - Where the part of the text being checked starts
 * @param {string[]} phrases
 * @param {string} what - Named in the failure
 */
function assertInOrder(text, marker, phrases, what) {
	let from = text.indexOf(marker);
	assert.ok(from >= 0, `${what}: "${marker}" is missing from "${text}"`);
	for (const phrase of phrases) {
		const at = text.indexOf(phrase, from);
		assert.ok(
			at >= 0,
			`${what}: "${phrase}" is missing or out of order in "${text.slice(from)}"`
		);
		from = at + phrase.length;
	}
}

/**
 * The paragraphs one version has and the other lacks.
 * @param {string} id
 * @returns {string[]}
 */
function currentOnly(id) {
	const original = /** @type {string[]} */ (civRules(id, 'original'));
	return /** @type {string[]} */ (civRules(id, 'current')).filter(
		(paragraph) => !original.includes(paragraph)
	);
}

test('every base civilization the engine knows has its ability in words, in both versions', () => {
	assert.equal(Object.keys(CIVS).length, 16);
	for (const id of Object.keys(CIVS)) {
		for (const version of VERSION_IDS) {
			const paragraphs = civRules(id, version);
			const what = `${id} (${version})`;
			assert.ok(Array.isArray(paragraphs), `${what} has no text`);
			assert.ok(paragraphs.length > 0, `${what} has no paragraphs`);
			for (const paragraph of paragraphs) {
				assert.equal(typeof paragraph, 'string');
				assert.ok(paragraph.trim().length > 0, `${what}: empty`);
				assert.equal(paragraph, paragraph.trim(), `${what}: spaces`);
				assert.ok(!paragraph.includes('  '), `${what}: "${paragraph}"`);
				assert.match(paragraph, /^[A-Z]/, `${what}: "${paragraph}"`);
				assert.match(paragraph, /[^.]\.$/, `${what}: "${paragraph}"`);
			}
			assert.equal(civAbilityText(id, version), paragraphs.join('\n\n'));
		}
	}
});

test('the versions differ exactly for the civilizations the current rules change', () => {
	for (const [id, civ] of Object.entries(CIVS)) {
		const changed =
			civ.adjustment !== undefined || VERSIONED_RULES.includes(id);
		const original = civRules(id, 'original');
		const current = civRules(id, 'current');
		assert.ok(
			original?.every((p) => !p.includes('Current rules')),
			`${id}'s original text names the current rules`
		);
		if (!changed) {
			assert.deepEqual(current, original, `${id} differs by version`);
			continue;
		}
		assert.notDeepEqual(current, original, `${id} is the same in both`);
		const added = currentOnly(id);
		assert.ok(
			added.length > 0,
			`${id} adds nothing under the current rules`
		);
		for (const paragraph of added) {
			assert.match(
				paragraph,
				/^Current rules: /,
				`${id}: "${paragraph}"`
			);
		}
		// R34: an adjustment is only for the civilization a player starts with.
		if (civ.adjustment) {
			assert.ok(
				added.some((p) => p.includes('if you start the game with')),
				`${id}'s adjustment doesn't say it is for a starting civilization`
			);
		}
	}
});

test('an expansion or unknown civilization has no text', () => {
	const expansion = ASSETS.filter(
		(asset) => asset.group === 'civ' && asset.expansion !== 'base'
	).map((asset) => asset.id.slice('civ-'.length));
	assert.ok(expansion.includes('treasure-hunters'));
	for (const id of [
		...expansion,
		'unknown',
		'',
		'constructor',
		'__proto__',
	]) {
		for (const version of VERSION_IDS) {
			assert.equal(civRules(id, version), null, id);
			assert.equal(civAbilityText(id, version), null, id);
		}
	}
});

test('a civilization’s text is a fresh list, so changing it changes nothing else', () => {
	const first = /** @type {string[]} */ (civRules('leaders', 'current'));
	first.push('Changed.');
	assert.ok(!civRules('leaders', 'current')?.includes('Changed.'));
});

test('the Craftsmen columns read as the engine pays them, bottom to top', () => {
	const text = /** @type {string} */ (
		civAbilityText('craftsmen', 'original')
	);
	['First column', 'Second column', 'Third column'].forEach((marker, i) => {
		assertInOrder(
			text,
			marker,
			CRAFTSMEN_COLUMNS[i].flat().flatMap(phrasesOf),
			`Craftsmen ${marker}`
		);
	});
});

test('the Merrymakers columns read as the engine pays them, bottom to top', () => {
	const text = /** @type {string} */ (
		civAbilityText('merrymakers', 'original')
	);
	['First column', 'Second column', 'Third column'].forEach((marker, i) => {
		assertInOrder(
			text,
			marker,
			MERRYMAKERS_COLUMNS[i].flat().flatMap(phrasesOf),
			`Merrymakers ${marker}`
		);
	});
});

test('the Militants spaces read as the engine pays them, left to right', () => {
	const text = /** @type {string} */ (
		civAbilityText('militants', 'original')
	);
	assertInOrder(
		text,
		'Top row',
		MILITANTS_SPACES.top.flatMap(phrasesOf),
		'Militants top row'
	);
	assertInOrder(
		text,
		'Bottom row',
		MILITANTS_SPACES.bottom.flatMap(phrasesOf),
		'Militants bottom row'
	);
});

test('the Entertainers grid reads as the engine pays it, top to bottom (R29)', () => {
	const text = /** @type {string} */ (
		civAbilityText('entertainers', 'original')
	);
	[1, 2, 3, 4].forEach((column) => {
		assertInOrder(
			text,
			`Column ${column}`,
			ENTERTAINERS_GRID[column - 1].flat().flatMap(phrasesOf),
			`Entertainers column ${column}`
		);
	});
	assert.match(text, /may pay the bonus/);
});

test('each current-rules adjustment gives what the engine gives (R34)', () => {
	for (const id of [
		'alchemists',
		'entertainers',
		'futurists',
		'isolationists',
		'merrymakers',
		'mystics',
		'the-chosen',
		'traders',
	]) {
		const { setup, firstTurnEnd } = CIVS[id].adjustment ?? {};
		/** @type {any[]} */
		const pushed = [];
		const ctx = /** @type {any} */ ({
			state: { version: 'current' },
			push: (/** @type {any[]} */ ops) => pushed.push(...ops),
		});
		(setup ?? firstTurnEnd)?.(ctx, 1);
		const effects = pushed.flatMap((op) => {
			assert.equal(op.kind, 'effects', `${id} pushes ${op.kind}`);
			return op.effects;
		});
		assert.ok(effects.length > 0, `${id} has no adjustment`);
		const [paragraph] = currentOnly(id);
		assertInOrder(
			paragraph,
			'Current rules: ',
			effects.flatMap(phrasesOf),
			`${id}'s adjustment`
		);
		const lost = effects.some((effect) => 'lose' in effect);
		assert.equal(paragraph.includes(' lose '), lost, paragraph);
		assert.equal(
			paragraph.includes('end of your first income turn'),
			firstTurnEnd !== undefined && setup === undefined,
			paragraph
		);
	}
});
