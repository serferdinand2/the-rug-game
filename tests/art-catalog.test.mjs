// The asset catalog: every asset the game needs, with stable ids, counted per group and expansion.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ASSETS, GROUPS, EXPANSIONS } from '../art/catalog.js';

/** Counts per group and expansion, copied from the design's §7.4 table. */
const EXPECTED_COUNTS = {
	civ: { base: 16, pp: 10, aa: 5, ff: 10 },
	tapestry: { base: 44, pp: 13, aa: 20, ff: 37 },
	tech: { base: 33, aa: 11, ff: 12 },
	landmark: { base: 18, pp: 7, aa: 8 },
	'landmark-card': { pp: 5, aa: 5 },
	'space-tile': { base: 15, pp: 4 },
	masterpiece: { aa: 20 },
	resource: { base: 5 },
	building: { base: 4 },
	piece: { base: 3 },
	die: { base: 14, aa: 1 },
	terrain: { base: 5 },
	track: { base: 4, aa: 1 },
	'landmark-marker': { base: 18, pp: 7, aa: 8 },
	board: { base: 5, ff: 1 },
	hex: { base: 6 },
	'territory-tile': { base: 48 },
	'capital-mat': { base: 6, aa: 6, ff: 6 },
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
	'landmark-marker',
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

test('every asset takes its kind and issue from its group, and its id starts with its group', () => {
	const groups = new Map(GROUPS.map((group) => [group.id, group]));
	for (const asset of ASSETS) {
		const group = groups.get(asset.group);
		assert.ok(group, `${asset.id}: unknown group ${asset.group}`);
		assert.equal(asset.kind, group.kind, asset.id);
		assert.equal(asset.issue, group.issue, asset.id);
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

test('there are 293 illustrations, 70 icons and 82 boards', () => {
	const count = (kind) => ASSETS.filter((a) => a.kind === kind).length;
	assert.equal(count('illustration'), 293);
	assert.equal(count('icon'), 70);
	assert.equal(count('board'), 82);
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
	for (const name of ['Infrastructure Boost', 'Cloud Colonies']) {
		assert.ok(!names.has(name), name);
	}
});

test('every landmark has a grid marker with the same slug and expansion', () => {
	const landmarks = ASSETS.filter((a) => a.group === 'landmark');
	const markers = ASSETS.filter((a) => a.group === 'landmark-marker');
	assert.deepEqual(
		markers.map((m) => [m.id.split('/')[1], m.name, m.expansion]),
		landmarks.map((l) => [l.id.split('/')[1], l.name, l.expansion])
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
		['resource/any', 'Any resource', 'base', 5],
		['territory-tile/48', 'Territory tile 48', 'base', 6],
		['capital-mat/city-in-a-bottle', 'City in a Bottle', 'ff', 6],
		['space-tile/technology-5-vp', 'Technology 5 VP', 'pp', 11],
		['board/income-overlay', 'Income-mat overlay [5]', 'ff', 6],
		['inspiration-tile/armories', 'Armories', 'aa', 11],
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

test('the catalog imports nothing, so the client can load it', async () => {
	const source = await readFile(
		new URL('../art/catalog.js', import.meta.url),
		'utf8'
	);
	assert.doesNotMatch(source, /^\s*import\s/m);
	assert.deepEqual(JSON.parse(JSON.stringify(ASSETS)), ASSETS);
	assert.ok(Object.isFrozen(ASSETS) && Object.isFrozen(GROUPS));
});
