// The civilization cards drawn from recipes built from the engine's data, in the table's rules version (#107).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import '../src/lib/engine/game.js';
import { CIVS } from '../src/lib/engine/civs/index.js';
import { CRAFTSMEN_COLUMNS } from '../src/lib/engine/civs/craftsmen.js';
import {
	ENTERTAINERS_GRID,
	entertainersMoves,
} from '../src/lib/engine/civs/entertainers.js';
import { MERRYMAKERS_COLUMNS } from '../src/lib/engine/civs/merrymakers.js';
import { MILITANTS_SPACES } from '../src/lib/engine/civs/militants.js';
import { HISTORIANS_SQUARES } from '../src/lib/engine/civs/historians.js';
import {
	ISOLATIONISTS_TOKENS,
	LAND_MASS_VP,
} from '../src/lib/engine/civs/isolationists.js';
import { TRADERS_TOKENS } from '../src/lib/engine/civs/traders.js';
import { INVENTORS_TOKENS } from '../src/lib/engine/civs/inventors.js';
import { HERALDS_TOKENS } from '../src/lib/engine/civs/heralds.js';
import { MYSTICS_PROPHECIES } from '../src/lib/engine/civs/mystics.js';
import { civCard } from '../src/lib/cards/civ-cards.js';
import {
	REVIEWED_CIVILIZATIONS,
	SAMPLE_CIV_DATA,
	SAMPLE_VIEWS,
} from '../src/lib/cards/reviewed-civilizations.js';
import { CARD_CIVS, civCardMarks } from '../src/lib/civ-card.js';
import CivilizationCard from '../src/lib/components/player/CivilizationCard.svelte';

/** A server render's markup without Svelte's hydration comments. @param {{ body: string }} result */
const html = (result) => result.body.replace(/<!--[\s\S]*?-->/g, '');

/** @param {any} recipe @param {string} pattern */
const sectionOf = (recipe, pattern) =>
	recipe.sections.find((/** @type {any} */ s) => s.pattern === pattern);

/** A card's words, segments flattened to text. @param {any} text @returns {string} */
function words(text) {
	return (text ?? [])
		.map((/** @type {any} */ part) =>
			typeof part === 'string'
				? part
				: 'b' in part
					? part.b
					: 'strong' in part
						? words(part.strong)
						: 'resource' in part
							? `[${part.resource}]`
							: '\n'
		)
		.join('');
}

/** The one effect a reward square names. @param {any} effects */
const only = (effects) => effects[0];

test('every base civilization and both built expansion cards have a recipe with a frame and sections', () => {
	for (const id of [...Object.keys(CIVS), 'collectors', 'treasure-hunters']) {
		const recipe = civCard(id);
		assert.ok(recipe.title, id);
		assert.equal(recipe.art, `/art/civ/${id}.svg`, id);
		assert.ok(recipe.complexity >= 1 && recipe.complexity <= 3, id);
		assert.ok(words(recipe.effect).length > 20, id);
		assert.ok(recipe.sections.length > 0, id);
	}
	assert.deepEqual(civCard('collectors').editions, ['aa']);
	assert.deepEqual(civCard('treasure-hunters').editions, ['pp']);
	assert.deepEqual(civCard('the-chosen').editions, ['base']);
	assert.equal(civCard('the-chosen').title, 'The Chosen');
});

test('a civilization without a reviewed layout gets its frame, portrait and name only', () => {
	const recipe = civCard('infiltrators');
	assert.equal(recipe.title, 'Infiltrators');
	assert.deepEqual(recipe.editions, ['pp']);
	assert.equal(recipe.portraitAlt, '');
	assert.deepEqual(recipe.sections, []);
	assert.equal(words(recipe.effect), 'The full card is on its way.');
});

test("the Craftsmen's columns are the engine's, top first", () => {
	const { props } = sectionOf(civCard('craftsmen'), 'rewardColumns');
	assert.equal(props.columns.length, CRAFTSMEN_COLUMNS.length);
	props.columns.forEach((/** @type {any} */ column, index) => {
		const spaces = [...CRAFTSMEN_COLUMNS[index]].reverse();
		assert.equal(column.rows.length, spaces.length);
		assert.equal(column.rows[0].vp, only(spaces[0]).vp);
		column.rows.forEach((/** @type {any} */ row, r) => {
			const gain = only(spaces[r]).gain;
			if (
				gain &&
				(gain.worker || gain.coin || gain.food || gain.culture)
			) {
				assert.equal(row.gain, Object.keys(gain)[0]);
			}
			assert.equal(row.filled, false);
		});
	});
	assert.deepEqual(props.columns[0].rows[1], {
		text: 'Gain 1 territory tile',
		filled: false,
	});
	assert.deepEqual(props.columns[2].rows[1], {
		text: 'Research',
		keep: 'with benefit;',
		after: 'bonus is available',
		filled: false,
	});
});

test("the Entertainers' squares are the engine's grid and their links its moves (R28)", () => {
	const { props } = sectionOf(civCard('entertainers'), 'pathGrid');
	assert.equal(props.spaces.length, 16);
	const space = (/** @type {string} */ id) =>
		props.spaces.find((/** @type {any} */ s) => s.id === id);
	assert.equal(
		space('c1r1').gain,
		Object.keys(only(ENTERTAINERS_GRID[0][0]).gain)[0]
	);
	assert.equal(space('c2r2').text, 'Market');
	assert.equal(
		space('c2r2').picture,
		`/art/building/${only(ENTERTAINERS_GRID[1][1]).building}.svg`
	);
	assert.equal(space('c3r2').text, 'Research without benefit or bonus');
	assert.equal(space('c4r1').text, 'Advance Technology');
	const moves = [1, 2, 3].flatMap((column) =>
		[1, 2, 3, 4].flatMap((row) =>
			entertainersMoves(`c${column}r${row}`).map((to) => [
				`c${column}r${row}`,
				to,
			])
		)
	);
	assert.deepEqual(props.links, moves);
});

test("the Merrymakers' columns, the Militants' spaces and the Historians' squares are the engine's", () => {
	const merry = sectionOf(civCard('merrymakers'), 'rewardColumns').props;
	const { current, ...top } = merry.columns[0].cells[0];
	assert.deepEqual(top, { id: 'm0l3', gains: ['culture'], also: 'armory' });
	assert.ok(!current);
	assert.deepEqual(merry.columns[0].cells[1].gains, ['worker', 'food']);
	assert.deepEqual(merry.columns[1].cells[0].lines, [
		'Explore +',
		'Research',
	]);
	assert.deepEqual(merry.columns[1].cells[1].lines, [
		'Invent +',
		'tapestry card',
	]);
	assert.deepEqual(
		merry.columns[2].cells.map((/** @type {any} */ c) => c.lines[0]),
		[...MERRYMAKERS_COLUMNS[2]].reverse().map((s) => `${only(s).vp} VP`)
	);

	const militants = sectionOf(civCard('militants'), 'placementRows').props;
	const spaces = [...MILITANTS_SPACES.top, ...MILITANTS_SPACES.bottom];
	assert.equal(militants.items.length, spaces.length);
	militants.items.forEach((/** @type {any} */ item, index) => {
		const effect = /** @type {any} */ (spaces[index]);
		if (effect.vp !== undefined) {
			assert.equal(item.vp, effect.vp);
		} else {
			assert.equal(item.gain, Object.keys(effect.gain)[0]);
		}
	});
	assert.equal(militants.items[4].id, 'bottom0');

	const historians = sectionOf(civCard('historians'), 'placementRows').props;
	assert.deepEqual(
		historians.items.map((/** @type {any} */ i) => i.vp ?? i.gain),
		HISTORIANS_SQUARES.map(
			(/** @type {any} */ s) => s.vp ?? Object.keys(s.gain)[0]
		)
	);
});

test("the Isolationists' ladder and the token reserves are the engine's", () => {
	const recipe = civCard('isolationists');
	const ladder = sectionOf(recipe, 'scoreLadder').props;
	assert.deepEqual(
		ladder.steps.map((/** @type {any} */ s) => s.points),
		LAND_MASS_VP.slice(1)
	);
	assert.equal(ladder.steps.at(-1).count, `${LAND_MASS_VP.length - 1}+`);
	assert.equal(ladder.example.result, `= ${LAND_MASS_VP[3]} VP`);
	assert.equal(
		sectionOf(recipe, 'tokenReserve').props.count,
		ISOLATIONISTS_TOKENS
	);
	assert.equal(
		sectionOf(civCard('traders'), 'tokenReserve').props.count,
		TRADERS_TOKENS
	);
	assert.equal(
		sectionOf(civCard('inventors'), 'tokenReserve').props.count,
		INVENTORS_TOKENS
	);
	assert.equal(
		sectionOf(civCard('heralds'), 'tokenReserve').props.count,
		HERALDS_TOKENS
	);
});

test("the Mystics' categories run to the engine's most", () => {
	const { props } = sectionOf(civCard('mystics'), 'predictionTracks');
	assert.deepEqual(
		props.categories.map((/** @type {any} */ c) => [c.id, c.most]),
		MYSTICS_PROPHECIES.map((p) => [p.category, p.most])
	);
});

test("the setup line follows the table's rules version, worded from the engine's adjustment", () => {
	const clarity = (/** @type {string} */ id, /** @type {any} */ version) =>
		sectionOf(civCard(id, { version }), 'clarity');
	assert.equal(
		words(clarity('traders', 'current').setup),
		'Setup, current rules: gain 2 [any] and 10 VP.'
	);
	assert.equal(
		words(clarity('alchemists', 'current').setup),
		'Setup, current rules: gain [any] and 10 VP.'
	);
	assert.equal(
		words(clarity('isolationists', 'current').setup),
		'Setup, current rules: gain 2 territory tiles.'
	);
	assert.equal(
		words(clarity('the-chosen', 'current').setup),
		'Setup, current rules: start with 15 VP per opponent.'
	);
	assert.equal(
		words(clarity('mystics').setup),
		'Setup, current rules: gain [any].'
	);
	for (const id of ['traders', 'alchemists', 'heralds', 'futurists']) {
		assert.equal(clarity(id, 'original')?.setup ?? null, null, id);
	}
	assert.equal(clarity('craftsmen', 'current').setup, null);
	// The Heralds' clarity is only its setup line, so the original version has none.
	assert.equal(clarity('heralds', 'original'), undefined);
});

test('the sample views draw the play look, the card civilizations from their sample data', () => {
	assert.deepEqual(
		Object.keys(SAMPLE_VIEWS).sort(),
		REVIEWED_CIVILIZATIONS.map((card) => card.id).sort()
	);
	for (const civ of CARD_CIVS) {
		assert.deepEqual(
			SAMPLE_VIEWS[civ].marks,
			civCardMarks(civ, SAMPLE_CIV_DATA[civ])
		);
	}
	const craftsmen = civCard('craftsmen', { view: SAMPLE_VIEWS.craftsmen });
	const columnA = sectionOf(craftsmen, 'rewardColumns').props.columns[0];
	assert.deepEqual(
		columnA.rows.map((/** @type {any} */ r) => r.building),
		[undefined, 'farm', 'house']
	);
	const collectors = civCard('collectors', { view: SAMPLE_VIEWS.collectors });
	assert.equal(sectionOf(collectors, 'scoreLadder').props.current, 3);
	assert.equal(
		sectionOf(civCard('collectors'), 'scoreLadder').props.current,
		0
	);
	const inventors = civCard('inventors', { view: SAMPLE_VIEWS.inventors });
	assert.equal(sectionOf(inventors, 'tokenReserve').props.used, 1);
	assert.equal(sectionOf(inventors, 'technologyTransfer').props.active, true);
});

test('CivilizationCard has one layout: no branch per civilization and no art path typed in', () => {
	const source = readFileSync(
		new URL(
			'../src/lib/components/player/CivilizationCard.svelte',
			import.meta.url
		),
		'utf8'
	);
	assert.doesNotMatch(source, /id === '/);
	assert.doesNotMatch(source, /['"`]\/art\//);
	assert.doesNotMatch(source, /state === 'play' \?/);
	const recipes = readFileSync(
		new URL('../src/lib/cards/civ-cards.js', import.meta.url),
		'utf8'
	);
	assert.doesNotMatch(recipes, /['"`]\/art\//);
});

test('every card renders on the server in both versions, and the original leaves out the current setup', () => {
	for (const id of [...Object.keys(CIVS), 'collectors', 'treasure-hunters']) {
		for (const version of ['original', 'current']) {
			const body = html(
				render(CivilizationCard, { props: { id, version } })
			);
			assert.match(body, /class="rg-card-frame/, id);
		}
	}
	const current = html(
		render(CivilizationCard, {
			props: { id: 'traders', version: 'current' },
		})
	);
	const original = html(
		render(CivilizationCard, {
			props: { id: 'traders', version: 'original' },
		})
	);
	assert.match(current, /Setup, current rules/);
	assert.doesNotMatch(original, /Setup, current rules/);
	assert.doesNotMatch(original, /rg-card-clarity--setup/);
});
