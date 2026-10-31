// Each decision kind's client facts in one table (#129): every engine kind has its entry and its words.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import {
	ART_SHAPES,
	DECISION_KINDS,
	kindFacts,
} from '../src/lib/decision-kinds.js';
import { TABS } from '../src/lib/area/tabs.js';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));

/** The card shelves a decision's answers can be on. */
const SHELVES = ['tapestry', 'tech', 'civ', 'mat', 'landmark'];

test('every engine decision kind has its client facts, and no entry names a kind the engine lacks', () => {
	assert.deepEqual(
		Object.keys(DECISION_KINDS).sort(),
		Object.keys(DECISIONS).sort()
	);
});

test('each fact is one the client knows: a shelf, a player tab, words and an art shape', () => {
	const tabs = TABS.map((tab) => tab.id);
	for (const kind of Object.keys(DECISIONS)) {
		const { shelf, tab, confirm, art } = kindFacts(kind);
		assert.ok(shelf === null || SHELVES.includes(shelf), `${kind} shelf`);
		assert.ok(tab === null || tabs.includes(tab), `${kind} tab`);
		assert.ok(
			confirm === null || /^[A-Z]\w/.test(confirm),
			`${kind} confirm`
		);
		assert.ok(art === null || ART_SHAPES.includes(art), `${kind} art`);
		assert.ok(
			shelf === null || art === null,
			`${kind}: a shelf's answers are drawn from the shelf`
		);
	}
});

test('a kind the table does not know has no facts', () => {
	assert.deepEqual(kindFacts('chooseSomethingNew'), {
		shelf: null,
		tab: null,
		confirm: null,
		art: null,
	});
});

test('the shelves, tabs and Confirm words read as before', () => {
	assert.equal(kindFacts('chooseTapestry').shelf, 'tapestry');
	assert.equal(kindFacts('chooseTapestry').tab, 'hand');
	assert.equal(kindFacts('chooseTapestry').confirm, 'Play card');
	assert.equal(kindFacts('chooseCapital').shelf, 'mat');
	assert.equal(kindFacts('chooseCopy').tab, 'eras');
	assert.equal(kindFacts('choosePlacement').art, 'placement');
	assert.equal(kindFacts('chooseConversion').art, 'resources');
	assert.equal(kindFacts('chooseTrade').art, 'payment');
	assert.equal(kindFacts('choosePartner').art, 'track');
	assert.equal(kindFacts('chooseTurn').confirm, null);
});

test('every engine decision kind has its own title and answer words in decision-words.js', () => {
	const source = readFileSync(`${SRC}lib/decision-words.js`, 'utf8');
	const titles = source.slice(
		source.indexOf('const TITLES'),
		source.indexOf('export function decisionTitle')
	);
	const answers = source.slice(
		source.indexOf('const ANSWERS'),
		source.indexOf('export function describeAnswer')
	);
	for (const kind of Object.keys(DECISIONS)) {
		assert.match(titles, new RegExp(`\\n\\t${kind}\\b`), `${kind} title`);
		assert.match(
			answers,
			new RegExp(`\\n\\t${kind}\\b`),
			`${kind} answers`
		);
	}
});

test('no client module keeps its own per-kind map', () => {
	const files = readdirSync(SRC, { recursive: true })
		.map(String)
		.filter(
			(file) =>
				/\.(svelte|js)$/.test(file) &&
				!file.startsWith('lib/engine/') &&
				file !== 'lib/decision-kinds.js'
		);
	assert.ok(files.length > 100, 'the source files are found');
	for (const file of files) {
		const source = readFileSync(`${SRC}${file}`, 'utf8');
		assert.doesNotMatch(
			source,
			/\b(?:SHELVES|CONFIRM_LABELS|TRACK_ANSWERS|TAB_OF)\b/,
			`${file} keeps a per-kind map`
		);
	}
	const prompts = readFileSync(`${SRC}lib/prompts.js`, 'utf8');
	assert.doesNotMatch(
		prompts,
		/case 'choose/,
		'prompts.js switches on kinds'
	);
});
