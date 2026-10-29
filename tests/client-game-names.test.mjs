// The game's names (#123): one function per name, and no copies of them anywhere else in the client.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	achievementName,
	buildingName,
	civilizationName,
	civilizationOf,
	hexName,
	landmarkName,
	resourceName,
	roman,
	seatName,
	spaceName,
	tapestryCardOf,
	tapestryName,
	techName,
	trackName,
} from '../src/lib/game-names.js';
import * as describe from '../src/lib/describe.js';
import { ASSETS } from '../src/lib/art/catalog.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { TAPESTRY_CARDS } from '../src/lib/engine/data/tapestry-cards.js';
import { TECH_CARDS } from '../src/lib/engine/data/tech-cards.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { HEIGHT_RANKING } from '../src/lib/engine/data/landmarks.js';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));

/** The copies other issues remove, with the issue that does. */
const LEFT = /** @type {Readonly<Record<string, string>>} */ ({
	// Its own price words, joined by hand, go with #124's remainder after #85.
	'lib/components/board/TierPrice.svelte': '#124',
});

test('a track is named, and an id no track has reads as a title', () => {
	assert.deepEqual(TRACK_IDS.map(trackName), [
		'Exploration',
		'Science',
		'Technology',
		'Military',
	]);
	assert.equal(trackName('arts'), 'Arts');
	assert.equal(trackName(undefined), 'a track');
});

test("a space is named from the engine's track, and space 0 is the start", () => {
	for (const track of TRACK_IDS) {
		for (let space = 1; space <= 12; space++) {
			assert.equal(
				spaceName(track, space),
				TRACKS[track][space].name,
				`${track} ${space}`
			);
		}
		assert.equal(spaceName(track, 0), 'the start');
	}
	assert.equal(spaceName('exploration', 13), 'space 13');
	assert.equal(spaceName('nowhere', 'far'), 'a space');
});

test('a resource has one name, and "any" is a resource of your choice (#124)', () => {
	assert.equal(resourceName('coin'), 'Coin');
	assert.equal(resourceName('food'), 'Food');
	assert.equal(resourceName('worker'), 'Worker');
	assert.equal(resourceName('culture'), 'Culture');
	assert.equal(resourceName('any'), 'Resource of your choice');
	assert.equal(resourceName('vp'), 'vp');
});

test('an income building is named', () => {
	assert.equal(buildingName('market'), 'Market');
	assert.equal(buildingName('house'), 'House');
	assert.equal(buildingName('farm'), 'Farm');
	assert.equal(buildingName('armory'), 'Armory');
	assert.equal(buildingName(undefined), 'Building');
});

test('a landmark takes its name from the art catalog, so TV Station keeps its capitals (#84)', () => {
	assert.equal(landmarkName('tv-station'), 'TV Station');
	assert.equal(landmarkName('train-station'), 'Train Station');
	assert.equal(landmarkName('com-tower'), 'Com Tower');
	for (const id of HEIGHT_RANKING) {
		assert.match(landmarkName(id), /^[A-Z]/, id);
	}
	assert.equal(landmarkName(null), 'Landmark');
});

test("all 33 landmarks, the expansions' too, have their catalog names", () => {
	const landmarks = ASSETS.filter((asset) => asset.group === 'landmark');
	assert.equal(landmarks.length, 33);
	for (const asset of landmarks) {
		assert.equal(
			landmarkName(asset.id.slice('landmark/'.length)),
			asset.name
		);
	}
});

test("a tapestry card is named through the engine's lookup, and each trap copy is the trap", () => {
	for (const card of TAPESTRY_CARDS) {
		assert.equal(tapestryName(card.id), card.name);
	}
	for (let copy = 1; copy <= 7; copy++) {
		assert.equal(tapestryName(`trap-${copy}`), 'Trap');
		assert.equal(tapestryCardOf(`trap-${copy}`)?.id, 'trap');
	}
	assert.equal(tapestryCardOf('no-such-card'), null);
	assert.equal(tapestryCardOf(undefined), null);
	assert.equal(tapestryName('no-such-card'), 'No Such Card');
	assert.equal(tapestryName(null), 'a face-down card');
});

test('a tech card is named', () => {
	for (const card of TECH_CARDS) {
		assert.equal(techName(card.id), card.name);
	}
	assert.equal(techName(undefined), 'a tech card');
});

test('a civilization reads by its catalog name', () => {
	assert.equal(civilizationName('the-chosen'), 'The Chosen');
	assert.equal(civilizationName('alchemists'), 'Alchemists');
	for (const asset of ASSETS.filter((a) => a.id.startsWith('civ/'))) {
		assert.equal(
			civilizationName(asset.id.slice('civ/'.length)),
			asset.name
		);
	}
	assert.equal(civilizationName(undefined), 'a civilization');
});

test("a player's civilization is their first, or Setting up before they have one", () => {
	assert.equal(
		civilizationOf({ civs: ['the-chosen', 'alchemists'] }),
		'The Chosen'
	);
	assert.equal(civilizationOf({ civs: [] }), 'Setting up');
	assert.equal(civilizationOf({}), 'Setting up');
});

test('a seat is named by its player, as Player N without a name, and as a player without a seat', () => {
	const table = { seats: [{ name: 'Ana' }, {}] };
	assert.equal(seatName(table, 1), 'Ana');
	assert.equal(seatName(table, 2), 'Player 2');
	assert.equal(seatName(undefined, 3), 'Player 3');
	assert.equal(seatName(table, 0), 'a player');
	assert.equal(seatName(table, null), 'a player');
});

test('a hex has one name, from its axial key, with true minus signs', () => {
	assert.equal(hexName('2_-1'), 'hex 2,−1');
	assert.equal(hexName('0_0'), 'hex 0,0');
	assert.equal(hexName('-3_12'), 'hex −3,12');
	assert.equal(hexName('nowhere'), 'a territory');
	assert.equal(hexName(undefined), 'a territory');
});

test('an achievement takes the short name the strip shows', () => {
	assert.equal(achievementName('complete-track'), 'Complete a track');
	assert.equal(achievementName('topple-two'), 'Topple two outposts');
	assert.equal(achievementName('middle-island'), 'Conquer the middle');
	assert.equal(achievementName('some-new-one'), 'Some New One');
});

test('eras and tiers are written as Roman numerals', () => {
	assert.deepEqual([1, 2, 3, 4, 5].map(roman), ['I', 'II', 'III', 'IV', 'V']);
	assert.throws(() => roman(0), /1 to 10/);
});

test('describe.js names nothing itself: the names come from game-names.js and words.js', () => {
	for (const name of [
		'trackName',
		'spaceName',
		'resourceName',
		'buildingName',
		'landmarkName',
		'tapestryName',
		'techName',
		'civilizationName',
		'seatName',
		'hexName',
		'joinList',
		'article',
		'amountWords',
	]) {
		assert.equal(name in describe, false, `describe.js exports ${name}`);
	}
});

test('no client module keeps its own copy of a name or an English helper', () => {
	const files = readdirSync(SRC, { recursive: true })
		.map(String)
		.filter(
			(file) =>
				/\.(svelte|js)$/.test(file) &&
				!file.startsWith('lib/engine/') &&
				file !== 'lib/words.js' &&
				file !== 'lib/game-names.js'
		);
	assert.ok(files.length > 100, 'the source files are found');
	for (const file of files) {
		const source = readFileSync(`${SRC}${file}`, 'utf8');
		if (!(file in LEFT)) {
			assert.doesNotMatch(
				source,
				/\.join\(', '\)\}? (?:and|or) /,
				`${file} joins a list by hand`
			);
		}
		assert.doesNotMatch(source, /trap-\\d/, `${file} matches trap ids`);
		assert.doesNotMatch(
			source,
			/\b(?:LANDMARK_NAMES|BUILDING_NAMES|ACHIEVEMENT_NAMES|SHORT_NAMES|TRACK_NAMES|NUMERALS|ROMAN)\b/,
			`${file} keeps its own names`
		);
		assert.doesNotMatch(
			source,
			/\?\?\s*`(?:Seat|Player) \$\{/,
			`${file} names a seat itself`
		);
		assert.doesNotMatch(
			source,
			/'(?:A|Another|another) player'/,
			`${file} names a missing seat itself`
		);
		assert.doesNotMatch(
			source,
			/TRACKS\[[^\]]+\]\[[^\]]+\]\.name/,
			`${file} reads a space's name from the engine`
		);
		assert.doesNotMatch(
			source,
			/function (?:capitalize|titleCase|titleOf|wordsOf|article|joinList|listWords|joinNames|words|ordinal|signed|hexName|seatName|roman)\(/,
			`${file} defines its own English helper`
		);
	}
});
