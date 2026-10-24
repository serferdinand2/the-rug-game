// The base game data (#12): counts, spot values from the research, the effect vocabulary and the shared ids.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	VERSIONS,
	TRACK_IDS,
	RESOURCE_IDS,
	BUILDING_IDS,
	TERRAIN_IDS,
} from '../src/lib/engine/data/ids.js';
import { EFFECT_KINDS, VP_COUNTERS } from '../src/lib/engine/data/effects.js';
import {
	TRACKS,
	TIER_COSTS,
	TRACK_RESOURCE,
	TRACK_BUILDING,
	advanceCost,
} from '../src/lib/engine/data/tracks.js';
import {
	INCOME_MAT,
	TAPESTRY_SLOTS,
} from '../src/lib/engine/data/income-mat.js';
import {
	CAPITAL_MATS,
	SMALL_MAP_PAIRS,
	impassablePlots,
} from '../src/lib/engine/data/capitals.js';
import { MAPS, HEX_SIDES, hexNeighbours } from '../src/lib/engine/data/maps.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import { SPACE_TILES } from '../src/lib/engine/data/space-tiles.js';
import { LANDMARKS, HEIGHT_RANKING } from '../src/lib/engine/data/landmarks.js';
import { ACHIEVEMENTS } from '../src/lib/engine/data/achievements.js';
import {
	SCIENCE_DIE,
	RED_DIE,
	BLACK_DIE,
} from '../src/lib/engine/data/dice.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { ASSETS } from '../src/lib/art/catalog.js';
import { GRID_SIZE, plotIndex } from '../src/lib/capital.js';
import * as ui from '../src/lib/ui.js';

const ENGINE_DIR = new URL('../src/lib/engine/', import.meta.url).pathname;

/** Every .js file under a folder. */
function jsFiles(/** @type {string} */ dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap(
		(/** @type {import('node:fs').Dirent} */ entry) =>
			entry.isDirectory()
				? jsFiles(join(dir, entry.name))
				: entry.name.endsWith('.js')
					? [join(dir, entry.name)]
					: []
	);
}

/** A terrain list from the research's letters, such as 'S,D,S,S,S,S'. */
function corners(/** @type {string} */ letters) {
	/** @type {Record<string, string>} */
	const names = {
		S: 'sea',
		D: 'desert',
		F: 'forest',
		G: 'grassland',
		M: 'mountain',
	};
	return letters.split(',').map((letter) => names[letter]);
}

/** Every effect list the data holds, with where it came from. */
function effectLists() {
	/** @type {[string, readonly object[]][]} */
	const lists = [];
	for (const track of TRACK_IDS) {
		for (const space of TRACKS[track]) {
			lists.push([`${track} ${space.name}`, space.benefit]);
			if (space.bonus) {
				lists.push([`${track} ${space.name} bonus`, space.bonus.gain]);
			}
		}
	}
	for (const row of BUILDING_IDS) {
		for (const space of INCOME_MAT[row]) {
			lists.push([`${space.name} income`, space.income]);
			lists.push([`${space.name} score`, space.score]);
		}
	}
	for (const tile of TERRITORY_TILES) {
		lists.push([`territory tile ${tile.id}`, tile.benefit]);
	}
	for (const tile of SPACE_TILES) {
		lists.push([`space tile ${tile.id}`, tile.benefit]);
	}
	RED_DIE.forEach((face, i) => lists.push([`red die ${i}`, [face]]));
	BLACK_DIE.forEach((face, i) => lists.push([`black die ${i}`, [face]]));
	return lists;
}

/** Calls back for every effect in a list, inside choices too. */
function eachEffect(
	/** @type {readonly object[]} */ list,
	/** @type {(effect: Record<string, any>) => void} */ visit
) {
	for (const effect of /** @type {Record<string, any>[]} */ (list)) {
		visit(effect);
		if (effect.choice) {
			for (const option of effect.choice) {
				eachEffect(option, visit);
			}
		}
	}
}

/** A track space by name. */
function spaceNamed(/** @type {string} */ name) {
	for (const track of TRACK_IDS) {
		const space = TRACKS[track].find((s) => s.name === name);
		if (space) {
			return space;
		}
	}
	throw new Error(`no track space named ${name}`);
}

/** An income space by name. */
function incomeNamed(/** @type {string} */ name) {
	for (const row of BUILDING_IDS) {
		const space = INCOME_MAT[row].find((s) => s.name === name);
		if (space) {
			return space;
		}
	}
	throw new Error(`no income space named ${name}`);
}

// Shared

test('engine modules import only relative paths, never the DOM, Svelte or Node, and never Math.random', () => {
	const files = jsFiles(ENGINE_DIR);
	assert.ok(files.length >= 11, `found ${files.length} engine modules`);
	for (const file of files) {
		const source = readFileSync(file, 'utf8');
		const specifiers = [
			...source.matchAll(/(?:import|export)\s[^'"]*?from\s+'([^']+)'/g),
			...source.matchAll(/import\(\s*'([^']+)'\s*\)/g),
		].map((match) => match[1]);
		for (const specifier of specifiers) {
			assert.match(specifier, /^\.\.?\//, `${file} imports ${specifier}`);
		}
		assert.doesNotMatch(source, /\b(window|document|navigator)\./, file);
		assert.doesNotMatch(source, /Math\.random/, file);
	}
});

test('the data is frozen all the way down', () => {
	assert.ok(Object.isFrozen(TRACKS));
	assert.ok(Object.isFrozen(TRACKS.exploration));
	assert.ok(Object.isFrozen(TRACKS.exploration[4].benefit[0]));
	assert.ok(Object.isFrozen(INCOME_MAT.market[5].score));
	assert.ok(Object.isFrozen(CAPITAL_MATS[0].grid));
	assert.ok(Object.isFrozen(MAPS.small.printed['0_3'].corners));
	assert.ok(Object.isFrozen(TERRITORY_TILES[46].benefit[0]));
	assert.ok(Object.isFrozen(SPACE_TILES[10]));
	assert.ok(Object.isFrozen(LANDMARKS[0].source));
	assert.ok(Object.isFrozen(ACHIEVEMENTS[0].vp.large));
	assert.ok(Object.isFrozen(RED_DIE[4]));
	assert.throws(() => {
		/** @type {any} */ (TRACKS.science[1]).name = 'Astrology';
	}, TypeError);
});

test('every effect in the data has exactly one known kind', () => {
	for (const [where, list] of effectLists()) {
		assert.ok(Array.isArray(list), `${where} is a list`);
		eachEffect(list, (effect) => {
			const kinds = Object.keys(effect);
			assert.equal(
				kinds.length,
				1,
				`${where}: ${JSON.stringify(effect)}`
			);
			assert.ok(
				EFFECT_KINDS.includes(/** @type {any} */ (kinds[0])),
				`${where}: unknown kind ${kinds[0]}`
			);
			if (effect.vp && typeof effect.vp === 'object') {
				assert.ok(
					VP_COUNTERS.includes(effect.vp.per),
					`${where}: unknown counter ${effect.vp.per}`
				);
				if (effect.vp.per === 'trackSpace') {
					assert.ok(TRACK_IDS.includes(effect.vp.track), where);
				}
			}
			if (effect.building) {
				assert.ok(BUILDING_IDS.includes(effect.building), where);
			}
			for (const key of ['advance', 'regress']) {
				if (effect[key]) {
					assert.ok(effect[key].tracks.length > 0, where);
					for (const track of effect[key].tracks) {
						assert.ok(TRACK_IDS.includes(track), where);
					}
				}
			}
		});
	}
});

test('the shared ids are the same strings as the interface uses', () => {
	assert.deepEqual(
		TRACK_IDS,
		ui.TRACKS.map((track) => track.id)
	);
	assert.deepEqual(
		[...RESOURCE_IDS].sort(),
		ui.RESOURCES.map((resource) => resource.id).sort()
	);
	assert.deepEqual(
		TERRAIN_IDS,
		ui.TERRAINS.map((terrain) => terrain.id).filter(
			(id) => id !== 'unexplored'
		)
	);
	assert.deepEqual(BUILDING_IDS, ['market', 'house', 'farm', 'armory']);
});

test('every landmark, capital mat and tile has an asset in the catalog', () => {
	const ids = new Set(ASSETS.map((asset) => asset.id));
	for (const landmark of LANDMARKS) {
		assert.ok(ids.has(`landmark/${landmark.id}`), landmark.id);
	}
	for (const mat of CAPITAL_MATS) {
		assert.ok(ids.has(`capital-mat/${mat.id}`), mat.id);
	}
	for (const tile of TERRITORY_TILES) {
		assert.ok(ids.has(`territory-tile/${tile.id}`), String(tile.id));
	}
	for (const tile of SPACE_TILES) {
		assert.ok(ids.has(`space-tile/${tile.id}`), String(tile.id));
	}
});

// Versions

test('R1, R5: both versions share the base board data, and only the current tiebreak uses the height ranking (R10, R11)', () => {
	assert.deepEqual(
		VERSIONS.map((version) => version.id),
		['original', 'current']
	);
	const [original, current] = VERSIONS;
	assert.deepEqual(original.tiebreak, ['vp', 'resources']);
	assert.deepEqual(current.tiebreak, ['vp', 'tallestLandmark', 'resources']);
	// No board data is keyed by version: the same tracks, mats, maps and tiles serve both.
	/** @param {unknown} value */
	const keyedByVersion = (value) =>
		JSON.stringify(value).match(/"(original|current)":/);
	for (const data of [
		TRACKS,
		INCOME_MAT,
		TAPESTRY_SLOTS,
		CAPITAL_MATS,
		MAPS,
		TERRITORY_TILES,
		SPACE_TILES,
		LANDMARKS,
		ACHIEVEMENTS,
		RED_DIE,
		BLACK_DIE,
	]) {
		assert.equal(keyedByVersion(data), null);
	}
});

// Tracks

test('each track has a start and 12 spaces, 48 spaces in all', () => {
	assert.deepEqual(Object.keys(TRACKS), TRACK_IDS);
	let spaces = 0;
	for (const track of TRACK_IDS) {
		assert.equal(TRACKS[track].length, 13, track);
		const start = TRACKS[track][0];
		assert.deepEqual(start, {
			id: 'start',
			space: 0,
			name: 'Start',
			tier: 0,
			benefit: [],
			ordered: false,
			bonus: null,
			landmark: null,
		});
		spaces += TRACKS[track].length - 1;
	}
	assert.equal(spaces, 48);
});

test('a space is found by its number and tiered in threes', () => {
	for (const track of TRACK_IDS) {
		TRACKS[track].forEach((space, index) => {
			assert.equal(space.space, index);
			assert.equal(space.tier, Math.ceil(index / 3));
		});
	}
	const names = TRACK_IDS.flatMap((track) =>
		TRACKS[track].slice(1).map((space) => space.name)
	);
	assert.equal(new Set(names).size, 48, 'every space has its own name');
});

test('the track names follow 01 §3.2–3.5', () => {
	assert.deepEqual(
		TRACKS.exploration.slice(1).map((space) => space.name),
		[
			'Scouting',
			'Rafts',
			'Wagons',
			'Navigation',
			'Ships',
			'Tunnels',
			'Trains',
			'Cars',
			'Airplanes',
			'Space Shuttle',
			'Interstellar Travel',
			'Warpgates',
		]
	);
	assert.deepEqual(
		TRACKS.science.slice(1).map((space) => space.name),
		[
			'Astronomy',
			'Mathematics',
			'Herbalism',
			'Medicine',
			'Chemistry',
			'Biology',
			'Academic Research',
			'Nutrition',
			'Physics',
			'Neuroscience',
			'Quantum Physics',
			'Alien Biology',
		]
	);
	assert.deepEqual(
		TRACKS.technology.slice(1).map((space) => space.name),
		[
			'Pottery',
			'Carpentry',
			'Stone Tools',
			'Metallurgy',
			'Glass',
			'Steel',
			'Rubber',
			'Plastic',
			'Electronics',
			'Computers',
			'Nanotechnology',
			'AI Singularity',
		]
	);
	assert.deepEqual(
		TRACKS.military.slice(1).map((space) => space.name),
		[
			'Archery',
			'Bladed Weapons',
			'Walls',
			'Standing Army',
			'Cavalry',
			'Gunpowder',
			'Tanks',
			'Warplanes',
			'Anti-Aircraft Defense',
			'Nuclear Bomb',
			'Drone Assassins',
			'Mechs',
		]
	);
});

test('Navigation is exploration space 4: a territory tile, then explore, and the Lighthouse', () => {
	assert.deepEqual(TRACKS.exploration[4], {
		id: 'navigation',
		space: 4,
		name: 'Navigation',
		tier: 2,
		benefit: [{ gain: { territory: 1 } }, { explore: {} }],
		ordered: true,
		bonus: null,
		landmark: 'lighthouse',
	});
});

test('AI Singularity gives one of each resource and moves the token to the start of any track', () => {
	assert.deepEqual(TRACKS.technology[12].benefit, [
		{ gain: { coin: 1, worker: 1, food: 1, culture: 1 } },
		{ restartToken: {} },
	]);
	assert.equal(TRACKS.technology[12].bonus, null);
});

test('more spot values from 01 §3', () => {
	assert.deepEqual(spaceNamed('Wagons').benefit, [
		{ choice: [[{ explore: {} }], [{ building: 'farm' }]] },
	]);
	assert.deepEqual(spaceNamed('Ships').benefit, [
		{ vp: { per: 'territory' } },
	]);
	assert.deepEqual(spaceNamed('Ships').bonus, {
		pay: { any: 1 },
		gain: [{ building: 'farm' }],
	});
	assert.deepEqual(spaceNamed('Cars').benefit, [
		{ building: 'farm' },
		{ vp: { per: 'farm' } },
	]);
	assert.equal(spaceNamed('Cars').ordered, true);
	assert.deepEqual(spaceNamed('Cars').bonus, {
		pay: { territory: 2 },
		gain: [{ vp: 5 }],
	});
	assert.deepEqual(spaceNamed('Airplanes').benefit, [
		{ gain: { territory: 2 } },
		{ explore: { anywhere: true } },
	]);
	assert.deepEqual(spaceNamed('Space Shuttle').benefit, [
		{ vp: { per: 'trackSpace', track: 'technology' } },
	]);
	assert.deepEqual(spaceNamed('Interstellar Travel').benefit, [
		{ gain: { space: 3 } },
		{ exploreSpace: {} },
	]);
	assert.deepEqual(spaceNamed('Warpgates').bonus, {
		pay: { any: 1 },
		gain: [{ exploreSpace: {} }],
	});
	assert.deepEqual(spaceNamed('Astronomy').benefit, [
		{ research: { noBenefit: true } },
	]);
	assert.deepEqual(spaceNamed('Chemistry').bonus, {
		pay: { tapestry: 2 },
		gain: [{ vp: 5 }],
	});
	assert.deepEqual(spaceNamed('Academic Research').benefit, [{ repeat: {} }]);
	assert.deepEqual(spaceNamed('Physics').benefit, [
		{ advance: { tracks: ['exploration', 'technology', 'military'] } },
	]);
	assert.equal(spaceNamed('Quantum Physics').benefit.length, 2);
	assert.deepEqual(spaceNamed('Alien Biology').benefit, [
		{ research: { noBenefit: true, rolls: 4, offTrackVp: 5 } },
	]);
	assert.deepEqual(spaceNamed('Metallurgy').benefit, [
		{ invent: { refresh: true } },
	]);
	assert.deepEqual(spaceNamed('Rubber').benefit, [
		{ invent: { refresh: true, count: 2 } },
	]);
	assert.deepEqual(spaceNamed('Glass').benefit, [
		{
			choice: [
				[{ building: 'farm' }],
				[{ building: 'house' }],
				[{ building: 'armory' }],
			],
		},
	]);
	assert.deepEqual(spaceNamed('Electronics').benefit, [
		{ upgrade: {} },
		{ techBenefit: { icon: 'circle' } },
	]);
	assert.equal(spaceNamed('Electronics').ordered, false);
	assert.deepEqual(spaceNamed('Computers').benefit, [
		{ vp: { per: 'trackSpace', track: 'military' } },
		{ vp: { per: 'trackSpace', track: 'science' } },
	]);
	assert.deepEqual(spaceNamed('Standing Army').benefit, [
		{ gain: { worker: 1 } },
		{ vp: { per: 'territoryTile' } },
	]);
	assert.deepEqual(spaceNamed('Tanks').benefit, [
		{ conquer: { bothDice: 'ifOpponent' } },
	]);
	assert.deepEqual(spaceNamed('Warplanes').benefit, [
		{ conquer: { anywhere: true } },
	]);
	assert.deepEqual(spaceNamed('Anti-Aircraft Defense').benefit, [
		{ building: 'armory' },
		{ vp: { per: 'tapestryCard' } },
	]);
	assert.deepEqual(spaceNamed('Nuclear Bomb').benefit, [
		{ vp: { per: 'trackSpace', track: 'exploration' } },
		{ tapestryOnTop: {} },
	]);
	assert.deepEqual(spaceNamed('Drone Assassins').benefit, [
		{ scoreCapital: {} },
	]);
	assert.deepEqual(spaceNamed('Mechs').benefit, [
		{ conquer: { bothDice: 'always' } },
		{ gainCiv: {} },
	]);
});

test('Neuroscience regresses on technology or military only, never exploration', () => {
	assert.deepEqual(spaceNamed('Neuroscience').benefit, [
		{ regress: { tracks: ['technology', 'military'] } },
	]);
});

test('Nanotechnology’s bonus discards 3 tech cards, as on the cardboard board', () => {
	assert.deepEqual(spaceNamed('Nanotechnology').benefit, [
		{ upgrade: {} },
		{ techBenefit: { icon: 'square' } },
	]);
	assert.deepEqual(spaceNamed('Nanotechnology').bonus, {
		pay: { tech: 3 },
		gain: [{ vp: 10 }],
	});
});

test('only the 18 spaces of 01 §3.6 have a bonus', () => {
	const withBonus = TRACK_IDS.flatMap((track) =>
		TRACKS[track].filter((space) => space.bonus).map((space) => space.name)
	);
	assert.deepEqual(withBonus.sort(), [
		'Airplanes',
		'Bladed Weapons',
		'Carpentry',
		'Cars',
		'Chemistry',
		'Drone Assassins',
		'Glass',
		'Gunpowder',
		'Mathematics',
		'Nanotechnology',
		'Plastic',
		'Rafts',
		'Ships',
		'Space Shuttle',
		'Steel',
		'Tunnels',
		'Warpgates',
		'Warplanes',
	]);
	const payAny = TRACK_IDS.flatMap((track) =>
		TRACKS[track].filter(
			(space) => space.bonus && space.bonus.pay.any === 1
		)
	);
	assert.equal(payAny.length, 13);
});

test('the landmarks sit on spaces 4, 7 and 10 of every track, and every one exists', () => {
	const slugs = new Set(LANDMARKS.map((landmark) => landmark.id));
	for (const track of TRACK_IDS) {
		const spaces = TRACKS[track].filter((space) => space.landmark);
		assert.deepEqual(
			spaces.map((space) => space.space),
			[4, 7, 10],
			track
		);
		for (const space of spaces) {
			assert.ok(slugs.has(/** @type {string} */ (space.landmark)));
		}
	}
	assert.deepEqual(
		TRACK_IDS.flatMap((track) =>
			TRACKS[track].flatMap((space) =>
				space.landmark ? [space.landmark] : []
			)
		),
		[
			'lighthouse',
			'train-station',
			'launch-pad',
			'apothecary',
			'academy',
			'laboratory',
			'forge',
			'rubber-works',
			'tech-hub',
			'barracks',
			'tank-factory',
			'fusion-reactor',
		]
	);
});

test('each track has its resource and income building (01 §1.2)', () => {
	assert.deepEqual(TRACK_RESOURCE, {
		exploration: 'food',
		science: 'worker',
		technology: 'coin',
		military: 'culture',
	});
	assert.deepEqual(TRACK_BUILDING, {
		exploration: 'farm',
		science: 'house',
		technology: 'market',
		military: 'armory',
	});
});

test('a tier costs 1 any, then the track resource and 1 or 2 any, then 2 of the track resource (01 §3.1)', () => {
	assert.deepEqual(TIER_COSTS, {
		1: { any: 1 },
		2: { track: 1, any: 1 },
		3: { track: 1, any: 2 },
		4: { track: 2 },
	});
	assert.deepEqual(advanceCost('exploration', 1), { any: 1 });
	assert.deepEqual(advanceCost('exploration', 5), { food: 1, any: 1 });
	assert.deepEqual(advanceCost('science', 7), { worker: 1, any: 2 });
	assert.deepEqual(advanceCost('technology', 9), { coin: 1, any: 2 });
	assert.deepEqual(advanceCost('military', 10), { culture: 2 });
	assert.throws(() => advanceCost('military', 0), RangeError);
	assert.throws(() => advanceCost('military', 13), RangeError);
});

// Income mat

test('the income mat has 4 rows of 6 spaces, 24 in all', () => {
	assert.deepEqual(Object.keys(INCOME_MAT), BUILDING_IDS);
	let count = 0;
	for (const row of BUILDING_IDS) {
		assert.equal(INCOME_MAT[row].length, 6, row);
		INCOME_MAT[row].forEach((space, index) => {
			assert.equal(space.row, row);
			assert.equal(space.space, index + 1);
			count++;
		});
	}
	assert.equal(count, 24);
	assert.deepEqual(
		BUILDING_IDS.map((row) => INCOME_MAT[row].map((space) => space.name)),
		[
			[
				'Barter',
				'Currency',
				'Banking',
				'Credit Cards',
				'E-Commerce',
				'Biometrics',
			],
			[
				'Symbology',
				'Language',
				'Writing',
				'Telephone',
				'Email',
				'Neural Implants',
			],
			[
				'Hunting',
				'Farming',
				'Breeding',
				'Preservation',
				'Fertilization',
				'Food Printing',
			],
			[
				'Ceremony',
				'Racing',
				'Team Sports',
				'Tabletop Games',
				'Video Games',
				'Virtual Reality',
			],
		]
	);
});

test('the last space of every income row scores 10 VP, and Biometrics is one of them', () => {
	assert.deepEqual(incomeNamed('Biometrics'), {
		id: 'biometrics',
		name: 'Biometrics',
		row: 'market',
		space: 6,
		income: [],
		score: [{ vp: 10 }],
		prerequisite: false,
	});
	for (const row of BUILDING_IDS) {
		assert.deepEqual(INCOME_MAT[row][5].score, [{ vp: 10 }]);
		assert.deepEqual(INCOME_MAT[row][5].income, []);
	}
});

test('the first space of each row pays income and scores, as printed (01 §5)', () => {
	assert.deepEqual(incomeNamed('Barter').income, [{ gain: { coin: 1 } }]);
	assert.deepEqual(incomeNamed('Barter').score, [
		{ vp: { per: 'techCard' } },
	]);
	assert.deepEqual(incomeNamed('Symbology').income, [
		{ gain: { worker: 1 } },
	]);
	assert.deepEqual(incomeNamed('Symbology').score, [{ scoreCapital: {} }]);
	assert.deepEqual(incomeNamed('Hunting').income, [
		{ gain: { food: 1, territory: 1 } },
	]);
	assert.deepEqual(incomeNamed('Hunting').score, []);
	assert.deepEqual(incomeNamed('Ceremony').income, [
		{ gain: { culture: 1, tapestry: 1 } },
	]);
	assert.deepEqual(incomeNamed('Team Sports').score, [
		{ vp: { per: 'territory' } },
	]);
	assert.deepEqual(incomeNamed('Breeding').score, [{ vp: 4 }]);
	assert.deepEqual(incomeNamed('Fertilization').score, [{ vp: 7 }]);
});

test('a fully uncovered income mat gives 4 of each resource, a tile and a card, and 51 fixed VP (01 §5)', () => {
	/** @type {Record<string, number>} */
	const income = {};
	let fixedVp = 0;
	for (const row of BUILDING_IDS) {
		for (const space of INCOME_MAT[row]) {
			for (const effect of /** @type {any[]} */ (space.income)) {
				for (const [key, amount] of Object.entries(effect.gain)) {
					income[key] = (income[key] ?? 0) + amount;
				}
			}
			for (const effect of /** @type {any[]} */ (space.score)) {
				if (typeof effect.vp === 'number') {
					fixedVp += effect.vp;
				}
			}
		}
	}
	assert.deepEqual(income, {
		coin: 4,
		worker: 4,
		food: 4,
		territory: 1,
		culture: 4,
		tapestry: 1,
	});
	assert.equal(fixedVp, 51);
});

test('R18: the six innovations that landmark tech cards need are marked', () => {
	const marked = BUILDING_IDS.flatMap((row) =>
		INCOME_MAT[row]
			.filter((space) => space.prerequisite)
			.map((space) => `${space.id} ${space.row} ${space.space}`)
	);
	assert.deepEqual(marked, [
		'currency market 2',
		'banking market 3',
		'writing house 3',
		'telephone house 4',
		'farming farm 2',
		'breeding farm 3',
	]);
});

test('the tapestry strip: Maker of Fire, then 1, 2 and 3 any for the first of your neighbours', () => {
	assert.deepEqual(TAPESTRY_SLOTS, [
		{ era: 1, printed: 'Maker of Fire', firstBonus: null },
		{ era: 2, printed: null, firstBonus: { any: 1 } },
		{ era: 3, printed: null, firstBonus: { any: 2 } },
		{ era: 4, printed: null, firstBonus: { any: 3 } },
	]);
});

// Capital mats

test('R1: six capital mats, each 9 by 9 with 22 impassable and 59 open plots', () => {
	assert.deepEqual(
		CAPITAL_MATS.map((mat) => `${mat.number} ${mat.name} ${mat.id}`),
		[
			'1 Mountain mountain',
			'2 Wetland wetland',
			'3 Tropical tropical',
			'4 Desert desert',
			'5 Grassland grassland',
			'6 Forest forest',
		]
	);
	for (const mat of CAPITAL_MATS) {
		assert.equal(mat.grid.length, GRID_SIZE, mat.name);
		for (const row of mat.grid) {
			assert.match(row, /^[01]{9}$/, mat.name);
		}
		assert.equal(impassablePlots(mat).length, 22, mat.name);
		assert.equal(GRID_SIZE * GRID_SIZE - impassablePlots(mat).length, 59);
	}
});

test('mat 4’s first row and mat 1’s grid match 01 §6.2', () => {
	const desert = CAPITAL_MATS[3];
	assert.equal(desert.grid[0], '000110000');
	assert.deepEqual(impassablePlots(desert).slice(0, 2), [
		plotIndex(0, 3),
		plotIndex(0, 4),
	]);
	assert.deepEqual(CAPITAL_MATS[0].grid, [
		'000000000',
		'110001110',
		'000111000',
		'000111110',
		'000001100',
		'011100001',
		'001000000',
		'000000010',
		'001000000',
	]);
	assert.equal(CAPITAL_MATS[5].grid[8], '000000011');
});

test('each mat names its start hex on both maps, and the small-map pairs share one (01 §2.3)', () => {
	assert.deepEqual(
		CAPITAL_MATS.map((mat) => [
			mat.number,
			mat.start.large,
			mat.start.small,
		]),
		[
			[1, '-3_-3', '-2_-2'],
			[2, '-3_0', '0_2'],
			[3, '0_3', '2_0'],
			[4, '3_3', '0_2'],
			[5, '3_0', '2_0'],
			[6, '0_-3', '-2_-2'],
		]
	);
	assert.deepEqual(SMALL_MAP_PAIRS, [
		[1, 6],
		[2, 4],
		[3, 5],
	]);
	for (const [a, b] of SMALL_MAP_PAIRS) {
		assert.equal(
			CAPITAL_MATS[a - 1].start.small,
			CAPITAL_MATS[b - 1].start.small
		);
	}
	for (const mat of CAPITAL_MATS) {
		assert.ok(MAPS.large.printed[mat.start.large], mat.name);
		assert.ok(MAPS.small.printed[mat.start.small], mat.name);
	}
});

// Maps

test('R2: the large map is a radius-4 hexagon of 61 hexes, 25 of them printed', () => {
	const large = MAPS.large;
	assert.equal(large.hexes.length, 61);
	assert.equal(new Set(large.hexes).size, 61);
	for (const key of large.hexes) {
		const [a, b] = key.split('_').map(Number);
		assert.ok(Math.abs(a) <= 4 && Math.abs(b) <= 4 && Math.abs(a - b) <= 4);
	}
	assert.equal(Object.keys(large.printed).length, 25);
	assert.deepEqual(large.players, [4, 5]);
});

test('R3: the small map is 34 hexes, radius 3 without 0_-3, -3_0 and 3_3, 13 of them printed', () => {
	const small = MAPS.small;
	assert.equal(small.hexes.length, 34);
	assert.equal(new Set(small.hexes).size, 34);
	for (const missing of ['0_-3', '-3_0', '3_3']) {
		assert.ok(!small.hexes.includes(missing), missing);
	}
	for (const key of small.hexes) {
		const [a, b] = key.split('_').map(Number);
		assert.ok(Math.abs(a) <= 3 && Math.abs(b) <= 3 && Math.abs(a - b) <= 3);
	}
	assert.equal(Object.keys(small.printed).length, 13);
	assert.deepEqual(small.players, [1, 2, 3]);
});

test('every printed hex is on its map, and the middle island is 0_0 on both', () => {
	for (const map of [MAPS.large, MAPS.small]) {
		for (const key of Object.keys(map.printed)) {
			assert.ok(map.hexes.includes(key), `${map.id} ${key}`);
		}
		assert.equal(map.middle, '0_0');
		assert.deepEqual(map.printed['0_0'], {
			tile: 49,
			orient: 0,
			corners: corners('S,S,S,S,S,S'),
			island: ['desert', 'forest', 'grassland', 'mountain'],
		});
	}
});

test('a printed tile has the same corners on both maps', () => {
	/** @type {Map<number, string>} */
	const seen = new Map();
	for (const map of [MAPS.large, MAPS.small]) {
		for (const territory of Object.values(map.printed)) {
			const terrains = JSON.stringify([
				territory.corners,
				territory.island,
			]);
			const earlier = seen.get(territory.tile);
			if (earlier) {
				assert.equal(terrains, earlier, `tile ${territory.tile}`);
			}
			seen.set(territory.tile, terrains);
		}
	}
	assert.equal(seen.size, 29, 'tile ids 49–77');
	assert.deepEqual(
		[...seen.keys()].sort((a, b) => a - b),
		Array.from({ length: 29 }, (_, i) => 49 + i)
	);
});

test('printed territories match 01 Appendix A and the BGA orientations', () => {
	assert.deepEqual(MAPS.large.printed['3_0'], {
		tile: 55,
		orient: 5,
		corners: corners('G,G,S,S,S,G'),
		island: [],
	});
	assert.deepEqual(MAPS.large.printed['-3_0'], {
		tile: 59,
		orient: 4,
		corners: corners('S,S,S,G,G,D'),
		island: [],
	});
	assert.deepEqual(
		MAPS.large.printed['-3_-3'].corners,
		corners('S,M,M,M,S,S')
	);
	assert.deepEqual(MAPS.small.printed['0_3'], {
		tile: 77,
		orient: 2,
		corners: corners('S,S,S,G,S,S'),
		island: [],
	});
	assert.deepEqual(MAPS.small.printed['1_2'].corners, corners('S,D,G,F,D,D'));
	const turned = Object.entries(MAPS.small.printed).filter(
		([, territory]) => territory.orient !== 0
	);
	assert.deepEqual(
		turned.map(([key]) => key),
		['0_3']
	);
	assert.deepEqual(
		Object.entries(MAPS.large.printed)
			.filter(([, territory]) => territory.orient !== 0)
			.map(([key, territory]) => `${key}:${territory.orient}`)
			.sort(),
		['-2_0:4', '-3_0:4', '0_3:5', '2_0:5', '3_0:5', '4_1:5']
	);
});

test('the six hex sides face the six neighbours of 01 §2.3, each opposite its side + 3', () => {
	assert.equal(HEX_SIDES.length, 6);
	HEX_SIDES.forEach(([da, db], side) => {
		const [oa, ob] = HEX_SIDES[(side + 3) % 6];
		assert.deepEqual([da + oa, db + ob], [0, 0], `side ${side}`);
	});
	assert.deepEqual(hexNeighbours('0_0'), [
		'-1_-1',
		'-1_0',
		'0_1',
		'1_1',
		'1_0',
		'0_-1',
	]);
	assert.deepEqual(
		[...hexNeighbours('2_-1')].sort(),
		['1_-2', '1_-1', '2_-2', '2_0', '3_-1', '3_0'].sort()
	);
});

// Territory tiles

test('R4: 48 territory tiles, numbered 1 to 48, with the benefit counts', () => {
	assert.deepEqual(
		TERRITORY_TILES.map((tile) => tile.id),
		Array.from({ length: 48 }, (_, i) => i + 1)
	);
	/** @type {Record<string, number>} */
	const counts = {};
	for (const tile of TERRITORY_TILES) {
		const key = JSON.stringify(tile.benefit);
		counts[key] = (counts[key] ?? 0) + 1;
	}
	assert.deepEqual(counts, {
		[JSON.stringify([{ gain: { coin: 1 } }])]: 8,
		[JSON.stringify([{ gain: { worker: 1 } }])]: 8,
		[JSON.stringify([{ gain: { food: 1 } }])]: 8,
		[JSON.stringify([{ gain: { culture: 1 } }])]: 8,
		[JSON.stringify([{ gain: { tapestry: 1 } }])]: 4,
		[JSON.stringify([{ invent: {} }])]: 3,
		[JSON.stringify([{ research: { noBenefit: true } }])]: 2,
		[JSON.stringify([{ gain: { territory: 2 } }])]: 2,
		[JSON.stringify([{ building: 'farm' }])]: 1,
		[JSON.stringify([{ building: 'house' }])]: 1,
		[JSON.stringify([{ building: 'market' }])]: 1,
		[JSON.stringify([{ building: 'armory' }])]: 1,
		[JSON.stringify([{ upgrade: {} }])]: 1,
	});
});

test('tile 47 has its corners and gives 2 territory tiles (01 Appendix B)', () => {
	assert.deepEqual(TERRITORY_TILES[46], {
		id: 47,
		corners: corners('S,F,F,M,M,S'),
		island: [],
		benefit: [{ gain: { territory: 2 } }],
	});
	assert.deepEqual(TERRITORY_TILES[0].corners, corners('S,D,S,S,S,S'));
	assert.deepEqual(TERRITORY_TILES[24].benefit, [{ building: 'house' }]);
	assert.deepEqual(TERRITORY_TILES[21].benefit, [{ upgrade: {} }]);
});

test('the island tiles have 6 sea corners and one island terrain', () => {
	const islands = TERRITORY_TILES.filter((tile) => tile.island.length);
	assert.deepEqual(
		islands.map((tile) => `${tile.id} ${tile.island.join()}`),
		[
			'5 desert',
			'7 desert',
			'16 forest',
			'17 forest',
			'26 grassland',
			'28 grassland',
			'40 mountain',
			'41 mountain',
		]
	);
	for (const tile of islands) {
		assert.deepEqual(tile.corners, corners('S,S,S,S,S,S'));
	}
});

test('the tiles come in 4 terrain pairings of 12 (01 §7.1)', () => {
	const pairings = [
		['desert', 'mountain'],
		['forest', 'grassland'],
		['grassland', 'desert'],
		['forest', 'mountain'],
	];
	TERRITORY_TILES.forEach((tile, index) => {
		const pairing = pairings[Math.floor(index / 12)];
		for (const terrain of [...tile.corners, ...tile.island]) {
			assert.ok(
				terrain === 'sea' || pairing.includes(terrain),
				`tile ${tile.id} shows ${terrain}`
			);
		}
	});
});

// Space tiles

test('15 space tiles, numbered 1 to 15 (01 §7.2)', () => {
	assert.deepEqual(
		SPACE_TILES.map((tile) => tile.id),
		Array.from({ length: 15 }, (_, i) => i + 1)
	);
});

test('R5: space tile 11 conquers, then scores 1 VP per territory you control', () => {
	assert.deepEqual(SPACE_TILES[10], {
		id: 11,
		benefit: [{ conquer: {} }, { vp: { per: 'territory' } }],
		ordered: true,
	});
});

test('only space tile 11 says "then", so only its benefit is ordered (R5)', () => {
	assert.deepEqual(
		SPACE_TILES.filter((tile) => tile.ordered).map((tile) => tile.id),
		[11]
	);
	assert.ok(SPACE_TILES.every((tile) => typeof tile.ordered === 'boolean'));
});

test('space tiles 13, 15 and 5 read as the BGG photo shows', () => {
	assert.deepEqual(SPACE_TILES[12].benefit, [{ vp: 13 }]);
	assert.deepEqual(SPACE_TILES[14].benefit, [
		{ building: 'market' },
		{ vp: { per: 'market' } },
	]);
	assert.deepEqual(SPACE_TILES[4].benefit, [
		{ gain: { coin: 1, worker: 1 } },
		{ vp: 8 },
	]);
	assert.deepEqual(SPACE_TILES[0].benefit, [
		{ advance: { tracks: ['science'] } },
		{ vp: { per: 'trackSpace', track: 'science' } },
	]);
	assert.deepEqual(SPACE_TILES[3].benefit, [
		{ gain: { tapestry: 1 } },
		{ tapestryOnTop: {} },
		{ vp: { per: 'tapestryCard' } },
	]);
	assert.deepEqual(SPACE_TILES[7].benefit, [
		{ gain: { culture: 1 } },
		{ scoreCapital: {} },
	]);
	assert.deepEqual(SPACE_TILES[9].benefit, [
		{ invent: {} },
		{ upgrade: {} },
		{ vp: { per: 'techCard' } },
	]);
});

// Landmarks

test('18 base landmarks: 12 from the tracks and 6 from tech cards', () => {
	assert.equal(LANDMARKS.length, 18);
	assert.equal(
		LANDMARKS.filter((landmark) => 'track' in landmark.source).length,
		12
	);
	assert.deepEqual(
		LANDMARKS.filter((landmark) => 'tech' in landmark.source).map(
			(landmark) => landmark.id
		),
		['bakery', 'barn', 'com-tower', 'library', 'stock-market', 'treasury']
	);
	for (const landmark of LANDMARKS) {
		if ('tech' in landmark.source) {
			assert.equal(landmark.source.tech, landmark.id);
		}
	}
});

test('a landmark’s footprint is the shared one from footprints.js, never a copy', () => {
	for (const landmark of LANDMARKS) {
		assert.equal(landmark.footprint, FOOTPRINTS[landmark.id], landmark.id);
	}
});

test('the Fusion Reactor is military tier IV, space 10, and covers .XX/XXX/XXX', () => {
	const reactor = LANDMARKS.find(
		(landmark) => landmark.id === 'fusion-reactor'
	);
	assert.deepEqual(reactor, {
		id: 'fusion-reactor',
		name: 'Fusion Reactor',
		footprint: ['.XX', 'XXX', 'XXX'],
		source: { track: 'military', tier: 4, space: 10 },
	});
});

test('each track landmark’s source is the space that names it', () => {
	for (const landmark of LANDMARKS) {
		if ('track' in landmark.source) {
			const { track, tier, space } = landmark.source;
			assert.equal(TRACKS[track][space].landmark, landmark.id);
			assert.equal(TRACKS[track][space].tier, tier);
		}
	}
});

test('R12: the height ranking lists all 33 landmarks once, the Fusion Reactor tallest and the Treasury lowest', () => {
	assert.equal(HEIGHT_RANKING.length, 33);
	assert.deepEqual(
		[...HEIGHT_RANKING].sort(),
		Object.keys(FOOTPRINTS).sort()
	);
	assert.equal(HEIGHT_RANKING[0], 'fusion-reactor');
	assert.equal(HEIGHT_RANKING[1], 'skyscraper');
	assert.equal(HEIGHT_RANKING[2], 'holocenter');
	assert.equal(HEIGHT_RANKING[32], 'treasury');
	assert.ok(
		HEIGHT_RANKING.indexOf('digital-studio') + 1 ===
			HEIGHT_RANKING.indexOf('tv-station')
	);
});

// Achievements

test('R24: the three achievements and their VP boxes on each side', () => {
	assert.deepEqual(ACHIEVEMENTS, [
		{
			id: 'complete-track',
			name: 'Complete any advancement track',
			vp: { large: [15, 10, 5], small: [10, 5] },
		},
		{
			id: 'topple-two',
			name: 'Topple two opponent outposts',
			vp: { large: [15, 10, 5], small: [10, 5] },
		},
		{
			id: 'middle-island',
			name: 'Conquer middle island',
			vp: { large: [10, 5], small: [10, 5] },
		},
	]);
});

// Dice

test('R6: the science die shows each track on 3 of its 12 faces', () => {
	assert.equal(SCIENCE_DIE.length, 12);
	for (const track of TRACK_IDS) {
		assert.equal(
			SCIENCE_DIE.filter((face) => face === track).length,
			3,
			track
		);
	}
});

test('R7: the red die is 4, 5, 6 and 7 VP, and 1 VP per territory twice', () => {
	assert.deepEqual(RED_DIE, [
		{ vp: 4 },
		{ vp: 5 },
		{ vp: 6 },
		{ vp: 7 },
		{ vp: { per: 'territory' } },
		{ vp: { per: 'territory' } },
	]);
});

test('R8: the black die is coin, worker, food, culture, and the tile benefit twice', () => {
	assert.deepEqual(BLACK_DIE, [
		{ gain: { coin: 1 } },
		{ gain: { worker: 1 } },
		{ gain: { food: 1 } },
		{ gain: { culture: 1 } },
		{ tileBenefit: {} },
		{ tileBenefit: {} },
	]);
});
