// The asset catalog: every asset the game needs, with stable ids, counted per group and expansion.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
	ASSETS,
	GROUPS,
	EXPANSIONS,
	COSMETIC_BOARDS,
	EXPANSION_ISSUES,
} from '../src/lib/art/catalog.js';

/** Counts per group and expansion, copied from the design's §7.4 table. */
const EXPECTED_COUNTS = {
	civ: { base: 16, pp: 10, aa: 5, ff: 10 },
	tapestry: { base: 44, pp: 13, aa: 20, ff: 38 },
	tech: { base: 33, aa: 11, ff: 12 },
	landmark: { base: 18, pp: 7, aa: 8 },
	'landmark-card': { pp: 5, aa: 5 },
	'space-tile': { base: 15, pp: 4 },
	masterpiece: { aa: 20 },
	'resource-24': { base: 5 },
	'resource-48': { base: 5 },
	building: { base: 4 },
	piece: { base: 19 },
	die: { base: 17, aa: 1 }, // 14 faces (#5) and the 3 die bodies the tray rolls (#61)
	terrain: { base: 5 },
	track: { base: 4, aa: 1 },
	symbol: { base: 5 },
	board: { base: 5, ff: 1 },
	hex: { base: 8 },
	'territory-tile': { base: 48 },
	'capital-mat': { base: 6, aa: 6, ff: 6 },
	'capital-terrain': { base: 84, aa: 84, ff: 84 },
	'capital-relief': { base: 6, aa: 6, ff: 6 },
	'inspiration-tile': { aa: 4 },
};

const SLUGGED_GROUPS = [
	'civ',
	'tapestry',
	'tech',
	'landmark',
	'landmark-card',
	'masterpiece',
	'capital-mat',
	'inspiration-tile',
];

/** The design's slug rules, written independently of the catalog. */
function slugify(name) {
	return name
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/['.]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

const byId = new Map(ASSETS.map((asset) => [asset.id, asset]));

test('every id is a group and a lowercase slug', () => {
	for (const { id } of ASSETS) {
		assert.match(id, /^[a-z0-9-]+\/[a-z0-9]+(-[a-z0-9]+)*$/, id);
	}
});

test('ids are unique', () => {
	assert.equal(byId.size, ASSETS.length);
});

test("every asset takes its kind and issue from its group, or its expansion's issue, and its id starts with its group", () => {
	const groups = new Map(GROUPS.map((group) => [group.id, group]));
	for (const asset of ASSETS) {
		const group = groups.get(asset.group);
		assert.ok(group, `${asset.id}: unknown group ${asset.group}`);
		assert.equal(asset.kind, group.kind, asset.id);
		if (!COSMETIC_BOARDS.includes(asset.id)) {
			assert.equal(
				asset.issue,
				EXPANSION_ISSUES[asset.group]?.[asset.expansion] ?? group.issue,
				asset.id
			);
		}
		assert.ok(asset.id.startsWith(`${asset.group}/`), asset.id);
		assert.ok(
			EXPANSIONS.some((e) => e.code === asset.expansion),
			`${asset.id}: unknown expansion ${asset.expansion}`
		);
		assert.ok(asset.name.trim().length > 0, `${asset.id}: empty name`);
	}
});

test('each group has the agreed count per expansion', () => {
	assert.deepEqual(
		GROUPS.map((group) => group.id),
		Object.keys(EXPECTED_COUNTS)
	);
	for (const [group, counts] of Object.entries(EXPECTED_COUNTS)) {
		for (const { code } of EXPANSIONS) {
			const actual = ASSETS.filter(
				(a) => a.group === group && a.expansion === code
			).length;
			assert.equal(actual, counts[code] ?? 0, `${group} · ${code}`);
		}
	}
});

test('there are 294 illustrations, 318 icons and 102 boards', () => {
	const count = (kind) => ASSETS.filter((a) => a.kind === kind).length;
	assert.equal(count('illustration'), 294);
	assert.equal(count('icon'), 318);
	assert.equal(count('board'), 102);
});

test('the slug rules turn awkward names into the agreed slugs', () => {
	assert.equal(slugify('Déjà Vu'), 'deja-vu');
	assert.equal(slugify('S.T.E.A.M.'), 'steam');
	assert.equal(slugify("Wizards' Guild"), 'wizards-guild');
	assert.equal(slugify('Sewage & Plumbing'), 'sewage-plumbing');
});

test('card slugs follow the slug rules', () => {
	for (const asset of ASSETS.filter((a) =>
		SLUGGED_GROUPS.includes(a.group)
	)) {
		assert.equal(
			asset.id,
			`${asset.group}/${slugify(asset.name)}`,
			asset.name
		);
	}
});

test('left-out cards have no entry', () => {
	const names = new Set(ASSETS.map((a) => a.name));
	for (const name of ['Infrastructure Boost']) {
		assert.ok(!names.has(name), name);
	}
});

test('landmarks have no separate board pieces: the board shows their pictures', () => {
	assert.equal(
		ASSETS.some((a) => a.group === 'landmark-marker'),
		false
	);
});

test('spot checks match the agreed spellings', () => {
	const expected = [
		['landmark/lighthouse', 'Lighthouse', 'base', 7],
		['tapestry/deja-vu', 'Déjà Vu', 'ff', 9],
		['tapestry/commercial-center', 'Commercial Center', 'aa', 9],
		['tapestry/trap', 'Trap', 'base', 9],
		['tapestry/pillage-and-plunder', 'Pillage and Plunder', 'base', 9],
		['tapestry/steam', 'S.T.E.A.M.', 'aa', 9],
		['tech/siegecraft', 'Siegecraft', 'base', 10],
		['tech/lithium-ion-battery', 'Lithium-Ion Battery', 'base', 10],
		['civ/the-chosen', 'The Chosen', 'base', 8],
		['die/black-tile-benefit', 'Black die: tile benefit (?)', 'base', 5],
		['resource-24/any', 'Any resource · 24 px', 'base', 5],
		['territory-tile/48', 'Territory tile 48', 'base', 6],
		['capital-mat/city-in-a-bottle', 'City in a Bottle', 'ff', 6],
		['space-tile/technology-5-vp', 'Technology 5 VP', 'pp', 11],
		['board/income-overlay', 'Income-mat overlay [5]', 'ff', 51],
		['board/map-large', 'Large map (4–5 players)', 'base', 6],
		['inspiration-tile/armories', 'Armories', 'aa', 11],
		['landmark/forge', 'Forge', 'base', 7],
		['capital-relief/mountain', 'Mountain relief', 'base', 82],
		[
			'capital-relief/city-in-a-bottle',
			'City in a Bottle relief',
			'ff',
			133,
		],
	];
	for (const [id, name, expansion, issue] of expected) {
		const asset = byId.get(id);
		assert.ok(asset, `${id} is missing`);
		assert.deepEqual(
			{
				name: asset.name,
				expansion: asset.expansion,
				issue: asset.issue,
			},
			{ name, expansion, issue },
			id
		);
	}
});

test('the expansion reliefs belong to #132 and #133, the base reliefs to #82', () => {
	const issue = (/** @type {string} */ id) =>
		ASSETS.find((a) => a.id === id)?.issue;
	assert.equal(issue('capital-relief/mesa'), 132);
	assert.equal(issue('capital-relief/polar'), 133);
	assert.equal(issue('capital-relief/mountain'), 82);
	const expected = { base: 82, aa: 132, ff: 133 };
	for (const asset of ASSETS.filter((a) => a.group === 'capital-relief')) {
		assert.equal(asset.issue, expected[asset.expansion], asset.id);
	}
	assert.deepEqual(EXPANSION_ISSUES, {
		'capital-relief': { aa: 132, ff: 133 },
	});
});

test('the cosmetic boards wait for #51, after the core features', () => {
	assert.deepEqual([...COSMETIC_BOARDS].sort(), [
		'board/income-mat',
		'board/income-overlay',
		'board/table',
		'board/tracks',
	]);
	for (const asset of ASSETS.filter((a) => a.group === 'board')) {
		assert.equal(
			asset.issue,
			COSMETIC_BOARDS.includes(asset.id) ? 51 : 6,
			asset.id
		);
	}
});

test('the catalog imports nothing, so the client can load it', async () => {
	const source = await readFile(
		new URL('../src/lib/art/catalog.js', import.meta.url),
		'utf8'
	);
	assert.doesNotMatch(source, /^\s*import\s/m);
	assert.deepEqual(JSON.parse(JSON.stringify(ASSETS)), ASSETS);
	assert.ok(Object.isFrozen(ASSETS) && Object.isFrozen(GROUPS));
});
