// The card pattern primitives take their content as data and their state as props, with their own styles (#106).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { spotChoice } from '../src/lib/card-spots.js';
import CardClarity from '../src/lib/components/player/CardClarity.svelte';
import CardEffectBox from '../src/lib/components/player/CardEffectBox.svelte';
import CardEffectList from '../src/lib/components/player/CardEffectList.svelte';
import CardFrame from '../src/lib/components/player/CardFrame.svelte';
import CardSlot from '../src/lib/components/player/CardSlot.svelte';
import CardPathGrid from '../src/lib/components/player/CardPathGrid.svelte';
import CardPlacementRows from '../src/lib/components/player/CardPlacementRows.svelte';
import CardPredictionTracks from '../src/lib/components/player/CardPredictionTracks.svelte';
import CardRewardColumns from '../src/lib/components/player/CardRewardColumns.svelte';
import CardResource from '../src/lib/components/player/CardResource.svelte';
import CardScoreLadder from '../src/lib/components/player/CardScoreLadder.svelte';
import CardTerrainRewards from '../src/lib/components/player/CardTerrainRewards.svelte';
import CardTechnologyTransfer from '../src/lib/components/player/CardTechnologyTransfer.svelte';
import CardTokenReserve from '../src/lib/components/player/CardTokenReserve.svelte';

/** @param {string} name - A component in src/lib/components/player/ */
const source = (name) =>
	readFileSync(
		new URL(`../src/lib/components/player/${name}.svelte`, import.meta.url),
		'utf8'
	);

/** @param {string} markup */
const snippet = (markup) => createRawSnippet(() => ({ render: () => markup }));

/** A server render's markup without Svelte's hydration comments. @param {{ body: string }} result */
const html = (result) => result.body.replace(/<!--[\s\S]*?-->/g, '');

/** The primitives this issue has given data, state props and their own styles so far. */
const DONE = ['CardResource', 'CardClarity', 'CardEffectBox', 'CardEffectList'];

/** The pattern classes that left card-patterns.css; the Militants' guide stays until the card is drawn from data. */
const CIVILIZATION_CLASS_PATTERNS =
	/rg-card-(?:collector|leader|treasure|craftsmen|entertainer|mystic|alchemist|isolation|merry|histor|inventor)/;

/** Words that name one civilization in a class, as the primitives used to. */
const CIVILIZATION_CLASS =
	/rg-card-(?:collector|architect|leader|treasure|craftsmen|entertainer|militant|mystic|alchemist|isolation|trader|merry|histor|inventor|futurist|herald|nomad|chosen)/;

test('no finished primitive renders a civilization class or a play-state class, and each styles itself (#106)', () => {
	for (const name of DONE) {
		const text = source(name);
		assert.doesNotMatch(text, CIVILIZATION_CLASS, name);
		assert.doesNotMatch(text, /rg-card-is-/, name);
		assert.doesNotMatch(text, /rg-card-frame--/, name);
		assert.match(text, /<style>[\s\S]+<\/style>/, `${name} has no <style>`);
	}
});

test('CardResource draws a native 24 px icon, and `fine` sets it for supporting text', () => {
	const plain = html(render(CardResource, { props: { symbol: 'coin' } }));
	assert.match(plain, /class="rg-card-resource(?: [^"]*)?"/);
	assert.match(plain, /class="rg-card-resource--art/);
	assert.doesNotMatch(plain, /rg-card-resource--fine/);
	const fine = html(
		render(CardResource, {
			props: { symbol: 'any', fine: true },
		})
	);
	assert.match(fine, /rg-card-resource--fine/);
	assert.match(
		source('CardResource'),
		/var\(--card-resource-center, -5px\)/,
		'a container centres its icons through --card-resource-center'
	);
});

test('CardClarity draws its own paragraph, with the setup line after a break', () => {
	const body = html(
		render(CardClarity, {
			props: {
				children: snippet(
					'<span>Each terrain can be used once.</span>'
				),
				setup: snippet(
					'<span>Setup, current rules: gain 2 tiles.</span>'
				),
			},
		})
	);
	assert.match(body, /<div class="rg-card-clarity[^"]*"/);
	assert.match(
		body,
		/<p class="rg-card-clarity--text[^"]*">[\s\S]*used once\.[\s\S]*<br[^>]*>[\s\S]*<span class="rg-card-clarity--setup[^"]*">[\s\S]*gain 2 tiles\./
	);
	const setupOnly = html(
		render(CardClarity, {
			props: { setup: snippet('<span>Current rules: instead.</span>') },
		})
	);
	assert.doesNotMatch(setupOnly, /<br/);
	const spaced = html(
		render(CardClarity, {
			props: {
				above: 16,
				minHeight: 70,
				children: snippet('<span>x</span>'),
			},
		})
	);
	assert.match(spaced, /margin-top: 16px/);
	assert.match(spaced, /min-height: 70px/);
});

test('CardEffectBox takes its title, and a gained resource or a word as its symbol', () => {
	const gain = html(
		render(CardEffectBox, {
			props: {
				title: 'Place a token',
				gain: 'any',
				symbolText: 13,
				children: snippet('<span>Gain any resource.</span>'),
			},
		})
	);
	assert.match(
		gain,
		/class="rg-card-effect-box [^"]*rg-card-effect-box--gain/
	);
	assert.match(gain, /rg-card-effect-box--text-13/);
	assert.match(
		gain,
		/<div class="rg-card-effect-box--symbol[^"]*">\+ <span class="rg-card-resource/
	);
	assert.match(
		gain,
		/<b class="rg-card-effect-box--title[^"]*">Place a token<\/b><span class="rg-card-effect-box--body[^"]*">[\s\S]*Gain any resource\./
	);
	const label = html(
		render(CardEffectBox, {
			props: {
				title: 'Final income turn',
				label: '10 VP',
				symbolText: 15,
			},
		})
	);
	assert.match(
		label,
		/<div class="rg-card-effect-box--symbol[^"]*">10 VP<\/div>/
	);
	assert.doesNotMatch(label, /rg-card-effect-box--gain/);
	assert.match(label, /rg-card-effect-box--text-15/);
});

test('CardEffectList holds the effect boxes, with the space above it as a prop', () => {
	const body = html(
		render(CardEffectList, {
			props: { above: 14, children: snippet('<div>box</div>') },
		})
	);
	assert.match(
		body,
		/<div class="rg-card-effect-list[^"]*" style="margin-top: 14px;">/
	);
	const plain = html(
		render(CardEffectList, {
			props: { children: snippet('<div>box</div>') },
		})
	);
	assert.doesNotMatch(plain, /style=/);
});

test('CivilizationCard writes no effect list, clarity paragraph or effect title by hand (#106)', () => {
	const card = source('CivilizationCard');
	assert.doesNotMatch(card, /rg-card-ability-/);
	assert.doesNotMatch(card, /rg-card-fine|rg-card-setup/);
	assert.doesNotMatch(card, /rg-card-resource-icon/);
});

test('CardScoreLadder draws its steps from data: the stepped ladder with the current step, and the flat row with its example', () => {
	const steps = [1, 3, 6].map((points, index) => ({
		count: index + 1,
		points,
	}));
	const stepped = html(
		render(CardScoreLadder, {
			props: { steps, current: 2, noun: 'different items' },
		})
	);
	assert.equal(stepped.match(/<li /g)?.length, 3);
	assert.match(stepped, /aria-label="2 different items: 3 VP"/);
	assert.equal(stepped.match(/rg-card-score-ladder--current/g)?.length, 1);
	assert.match(
		stepped,
		/<li class="rg-card-score-ladder--step[^"]*rg-card-score-ladder--current"[^>]*style="height: 46px;"/
	);
	assert.match(
		stepped,
		/<span[^>]*>1<\/span><span[^>]*>2<\/span><span[^>]*>3<\/span>/
	);
	const none = html(render(CardScoreLadder, { props: { steps } }));
	assert.doesNotMatch(none, /rg-card-score-ladder--current/);
	const flat = html(
		render(CardScoreLadder, {
			props: {
				kind: 'flat',
				label: 'Final income turn',
				steps: [
					{ count: 5, points: 31 },
					{ count: '6+', points: 40 },
				],
				example: {
					pictures: ['/art/terrain/grassland.svg'],
					text: '1 grassland territory',
					result: '= 5 VP',
				},
			},
		})
	);
	assert.match(flat, /rg-card-score-ladder--flat/);
	assert.match(flat, /<small[^>]*>6\+<\/small>40 VP/);
	assert.match(
		flat,
		/<img src="\/art\/terrain\/grassland\.svg" alt=""[^>]*\/?><span>1 grassland territory<\/span><b[^>]*>= 5 VP<\/b>/
	);
	assert.doesNotMatch(flat, /<ol/);
});

test('CardTokenReserve empties the used squares from the left', () => {
	const body = html(
		render(CardTokenReserve, { props: { count: 4, used: 1 } })
	);
	assert.equal(body.match(/rg-player-token/g)?.length, 3);
	assert.match(body, /aria-label="3 of 4 player tokens remain"/);
});

test('CardTechnologyTransfer marks the top row it leaves and the bottom row it reaches only when active', () => {
	const idle = html(render(CardTechnologyTransfer, {}));
	assert.doesNotMatch(
		idle,
		/rg-card-technology-transfer--target|rg-player-token/
	);
	const active = html(
		render(CardTechnologyTransfer, { props: { active: true } })
	);
	assert.equal(
		active.match(/rg-card-technology-transfer--target/g)?.length,
		2
	);
	assert.equal(active.match(/rg-player-token/g)?.length, 2);
	assert.match(active, /Opponent's tech/);
});

test('CivilizationCard draws both score ladders with CardScoreLadder (#106)', () => {
	const card = source('CivilizationCard');
	assert.doesNotMatch(
		card,
		/rg-card-isolation-score|rg-card-inventor-tech|values=/
	);
	assert.equal(card.match(/<CardScoreLadder/g)?.length, 2);
});

test('CardTerrainRewards draws each row from data: marker, name, then the resource with its + and the effect', () => {
	const body = html(
		render(CardTerrainRewards, {
			props: {
				rows: [
					{
						terrain: 'desert',
						name: 'Desert',
						gain: 'coin',
						effect: 'roll the black conquer die twice.',
						used: true,
					},
					{
						terrain: 'forest',
						name: 'Forest',
						gain: 'food',
						effect: 'roll the red conquer die twice.',
					},
				],
			},
		})
	);
	assert.equal(body.match(/<li /g)?.length, 2);
	assert.match(body, /src="\/art\/terrain\/desert\.svg"/);
	assert.match(
		body,
		/rg-card-terrain-rewards--name[^"]*">Forest<\/span><span class="rg-card-terrain-rewards--effect[^"]*">\+ <span class="rg-card-resource[\s\S]*?<\/span><\/span>; roll the red conquer die twice\.<\/span>/
	);
	assert.equal(body.match(/rg-card-terrain-rewards--used/g)?.length, 1);
});

test('CivilizationCard writes no terrain row by hand (#106)', () => {
	assert.doesNotMatch(source('CivilizationCard'), /rg-card-treasure-/);
});

test('spotChoice makes a spot the decision offers a button, gold when picked, and leaves the others alone', () => {
	const pick = () => {};
	assert.deepEqual(spotChoice('c1r1', ['c2r1'], null, pick), {});
	assert.deepEqual(spotChoice('c2r1', ['c2r1', 'c2r2'], 'c2r1', pick), {
		pickable: true,
		picked: true,
		value: 'c2r1',
		'data-id': 'civ-spot-c2r1',
		onCardSlotPick: pick,
	});
	assert.equal(
		spotChoice('c2r2', ['c2r1', 'c2r2'], 'c2r1', pick).picked,
		false
	);
});

test('CardPredictionTracks draws each category from data, its selected number and the offered numbers as buttons', () => {
	const body = html(
		render(CardPredictionTracks, {
			props: {
				categories: [
					{
						id: 'techCards',
						label: 'Tech cards',
						note: 'you have',
						most: 9,
						selected: 4,
					},
					{
						id: 'tracks',
						label: 'Completed advancement tracks',
						most: 4,
					},
				],
				choices: ['tracks:1', 'tracks:2'],
				picked: 'tracks:2',
			},
		})
	);
	assert.equal(
		body.match(/rg-card-prediction-tracks--number\b/g)?.length,
		13
	);
	assert.match(body, /Tech cards\s*<small[^>]*>you have<\/small>/);
	assert.equal(body.match(/rg-card-prediction-tracks--selected/g)?.length, 1);
	assert.match(body, /rg-card-prediction-tracks--selected[^>]*>4</);
	assert.match(body, /style="grid-template-columns: repeat\(4, 39px\);"/);
	assert.equal(body.match(/<button/g)?.length, 2);
	assert.match(body, /data-id="civ-spot-tracks:2"/);
	assert.equal(body.match(/rg-card-slot--picked/g)?.length, 1);
});

test('CivilizationCard writes no prediction row by hand (#106)', () => {
	assert.doesNotMatch(
		source('CivilizationCard'),
		/rg-card-mystic-|mysticNumbers/
	);
});

test('CardRewardColumns draws columns beside from data: titles, benefits by kind, and a filled square with its building', () => {
	const body = html(
		render(CardRewardColumns, {
			props: {
				columns: [
					{
						title: 'Column A',
						note: 'fill from bottom',
						rows: [
							{ vp: 5 },
							{
								text: 'Gain 1 territory tile',
								building: 'farm',
								filled: true,
							},
							{ gain: 'worker' },
						],
					},
					{
						title: 'Column C',
						rows: [
							{
								text: 'Research',
								keep: 'with benefit;',
								after: 'bonus is available',
							},
						],
					},
				],
			},
		})
	);
	assert.equal(body.match(/<section /g)?.length, 2);
	assert.match(body, /Column A\s*<small[^>]*>fill from bottom<\/small>/);
	assert.match(body, /rg-card-reward-columns--vp[^"]*">5 VP</);
	assert.match(
		body,
		/rg-card-reward-columns--gain[^"]*">\+ <span class="rg-card-resource/
	);
	assert.equal(body.match(/rg-card-reward-columns--filled/g)?.length, 1);
	assert.equal(
		body.match(/<img src="\/art\/building\/farm\.svg"/g)?.length,
		1
	);
	assert.match(
		body,
		/Research <span class="rg-card-reward-columns--keep[^"]*">with benefit;<\/span> bonus is available/
	);
});

test('CardRewardColumns draws columns inside from data: rewards, the token on the current square, the start token until it moves, and the offered squares', () => {
	const body = html(
		render(CardRewardColumns, {
			props: {
				kind: 'inside',
				seat: 2,
				columns: [
					{
						id: 'm0',
						moved: true,
						cells: [
							{
								id: 'm0l2',
								gains: ['worker', 'food'],
								current: true,
							},
							{ id: 'm0l1', gains: ['culture'], also: 'armory' },
						],
					},
					{
						id: 'm1',
						cells: [
							{ id: 'm1l1', lines: ['Explore +', 'Research'] },
						],
					},
				],
				choices: ['m1l1'],
			},
		})
	);
	assert.match(body, /rg-card-reward-columns--inside/);
	assert.equal(body.match(/rg-card-reward-columns--current/g)?.length, 1);
	assert.match(body, /<\/span> \+ <span class="rg-card-resource/);
	assert.match(body, /<\/span> \+ armory<\/span>/);
	assert.match(body, /Explore \+<br\/?>Research/);
	assert.equal(
		body.match(/rg-player-token/g)?.length,
		2,
		'the current token and one start token'
	);
	assert.equal(body.match(/<button/g)?.length, 1);
	assert.match(body, /data-id="civ-spot-m1l1"/);
});

test('CivilizationCard writes no reward column by hand (#106)', () => {
	assert.doesNotMatch(
		source('CivilizationCard'),
		/rg-card-(craftsmen|merry)-|merryToken/
	);
});

/** A two-column path grid, as the Entertainers' first two columns. */
const PATH = {
	heads: ['1st move', '2nd'],
	spaces: [
		{ id: 'c1r1', gain: 'worker' },
		{ id: 'c2r1', picture: '/art/building/farm.svg', text: 'Farm' },
		{ id: 'c1r2', gain: 'culture' },
		{ id: 'c2r2', text: 'Conquer' },
	],
	links: [
		['c1r1', 'c2r1'],
		['c1r1', 'c2r2'],
		['c1r2', 'c2r2'],
	],
	start: 'Start at the left.',
};

test('CardPathGrid draws its squares from data and its links from the moves, one path per gap', () => {
	const body = html(render(CardPathGrid, { props: PATH }));
	assert.match(body, /<span>1st move<\/span><span>2nd<\/span>/);
	assert.match(body, /viewBox="0 0 401 157"/);
	assert.equal(body.match(/<path /g)?.length, 1);
	assert.match(
		body,
		/d="M75 37\.5L326 37\.5 M75 37\.5L326 119\.5 M75 119\.5L326 119\.5"/
	);
	assert.match(
		body,
		/rg-card-path-grid--gain[^>]*>\+ <span class="rg-card-resource/
	);
	assert.match(
		body,
		/<img src="\/art\/building\/farm\.svg" alt=""[^>]*\/?><span>Farm<\/span>/
	);
	assert.doesNotMatch(
		body,
		/rg-card-path-grid--current|rg-card-path-grid--away/
	);
	assert.match(body, /Start at the left\./);
});

test("CardPathGrid marks the token's square, fades the start token, and offers the decision's squares", () => {
	const away = html(
		render(CardPathGrid, {
			props: {
				...PATH,
				current: 'c1r2',
				choices: ['c2r2'],
				picked: 'c2r2',
			},
		})
	);
	assert.equal(away.match(/rg-card-path-grid--current/g)?.length, 1);
	assert.match(away, /rg-card-path-grid--away/);
	assert.equal(away.match(/<button/g)?.length, 1);
	assert.match(away, /data-id="civ-spot-c2r2"/);
	const home = html(
		render(CardPathGrid, { props: { ...PATH, current: 'start' } })
	);
	assert.doesNotMatch(
		home,
		/rg-card-path-grid--current|rg-card-path-grid--away/
	);
});

test('CivilizationCard writes no path grid by hand (#106)', () => {
	assert.doesNotMatch(
		source('CivilizationCard'),
		/rg-card-entertainer-|ENTERTAINER_GAPS|<svg/
	);
});

test('CardPlacementRows draws the collection from data: each item greyed until collected, cards face down, its name and gain', () => {
	const body = html(
		render(CardPlacementRows, {
			props: {
				kind: 'collection',
				items: [
					{
						name: 'Outpost*',
						picture: '/art/piece/outpost.svg',
						placed: '/art/piece/outpost-blue.svg',
						large: true,
						gain: 'any',
						collected: true,
					},
					{
						name: 'Tech',
						picture: '/art/tech/eyeglasses.svg',
						facedown: true,
						gain: 'any',
					},
				],
			},
		})
	);
	assert.match(
		body,
		/^<ol class="rg-card-placement-rows rg-card-placement-rows--collection/
	);
	assert.equal(body.match(/rg-card-placement-rows--collected/g)?.length, 1);
	assert.match(body, /src="\/art\/piece\/outpost-blue\.svg"/);
	assert.equal(
		body.match(/<span class="rg-card-placement-rows--card/g)?.length,
		1
	);
	assert.match(
		body,
		/rg-card-placement-rows--name[^"]*">Tech<\/span><span class="rg-card-placement-rows--gain[^"]*">\+<span class="rg-card-resource/
	);
});

test("CardPlacementRows draws covered rewards in rows with a rule between, each exposed one uncovered, and offers the decision's spots", () => {
	const items = ['top0', 'top1', 'bottom0', 'bottom1'].map((id, index) => ({
		id,
		...(index % 2 ? { vp: index } : { gain: 'coin' }),
		exposed: index === 0,
	}));
	const body = html(
		render(CardPlacementRows, {
			props: {
				kind: 'covered',
				items,
				perRow: 2,
				choices: ['top1'],
				picked: null,
			},
		})
	);
	assert.equal(body.match(/rg-card-placement-rows--divider/g)?.length, 1);
	assert.equal(body.match(/rg-card-placement-rows--exposed/g)?.length, 1);
	assert.match(body, /rg-card-placement-rows--vp[^>]*>1 VP</);
	assert.equal(body.match(/<button/g)?.length, 1);
	assert.match(body, /data-id="civ-spot-top1"/);
	assert.match(body, /style="grid-template-columns: repeat\(2, 1fr\);"/);
});

test('CardPlacementRows draws rolled tracks, used leader tracks and uncovered history squares from their state', () => {
	const tracks = ['exploration', 'science'].map((track, index) => ({
		id: track,
		name: track,
		picture: `/art/track/${track}.svg`,
		rolled: index === 0,
		used: index === 0,
	}));
	const rolled = html(
		render(CardPlacementRows, { props: { kind: 'tracks', items: tracks } })
	);
	assert.equal(rolled.match(/rg-card-placement-rows--rolled/g)?.length, 1);
	assert.equal(rolled.match(/rg-player-token/g)?.length, 2);
	const leaders = html(
		render(CardPlacementRows, {
			props: {
				kind: 'leaders',
				items: tracks,
				choices: ['science'],
				picked: 'science',
			},
		})
	);
	assert.equal(leaders.match(/rg-card-placement-rows--used/g)?.length, 1);
	assert.equal(leaders.match(/rg-card-placement-rows--offered/g)?.length, 1);
	assert.match(leaders, /aria-label="exploration placement"/);
	assert.equal(leaders.match(/rg-card-slot--picked/g)?.length, 1);
	const history = html(
		render(CardPlacementRows, {
			props: {
				kind: 'history',
				seat: 3,
				items: [
					{ id: 'square0', vp: 3, exposed: true },
					{ id: 'square1', gain: 'food' },
				],
			},
		})
	);
	assert.equal(
		history.match(/rg-card-placement-rows--uncovered/g)?.length,
		1
	);
	assert.match(history, />3 VP<img/);
	assert.match(history, /token-green/);
});

test("the Alchemists' rolled token is a player's token marking its track, not a grey icon (owner, 2026-10-30)", () => {
	const rolled = html(
		render(CardPlacementRows, {
			props: {
				kind: 'tracks',
				seat: 3,
				items: [
					{
						name: 'Science',
						picture: '/art/track/science.svg',
						rolled: true,
					},
				],
			},
		})
	);
	assert.match(rolled, /token-green/);
	const css = source('CardPlacementRows');
	const token = css.match(
		/\.rg-card-placement-rows--track :global\(\.rg-card-placement-rows--token\) \{([^}]*)\}/
	);
	assert.ok(token, 'the rolled token has its own rule');
	assert.doesNotMatch(token[1], /filter|opacity/);
	// It marks the square in its corner, as the Merrymakers' token does, so the track's icon stays readable.
	assert.match(token[1], /width: 21px;/);
	assert.match(token[1], /top: 3px;/);
	assert.match(token[1], /right: 3px;/);
	assert.match(
		source('CivilizationCard'),
		/kind="tracks"\s+\{seat\}/,
		'the Alchemists pass their seat'
	);
});

test('a library example of a given width shows the component at that width (owner, 2026-10-30)', () => {
	const example = readFileSync(
		new URL('../src/library/Example.svelte', import.meta.url),
		'utf8'
	);
	assert.match(
		example,
		/\.rg-library-example--stage \{[^}]*box-sizing: content-box;/
	);
});

test('CivilizationCard writes no placement square or play-state class by hand (#106)', () => {
	const card = source('CivilizationCard');
	assert.doesNotMatch(
		card,
		/rg-card-is-|<CardSlot|rg-card-slot|rg-card-(leader|alchemist|history)-|rg-card-militant-space/
	);
});

test('CardSlot draws its own filled border, and the patterns pass filled for a mark in the player colour (#106)', () => {
	assert.match(
		html(render(CardSlot, { props: { filled: true } })),
		/rg-card-slot--filled/
	);
	assert.doesNotMatch(html(render(CardSlot, {})), /rg-card-slot--filled/);
	for (const name of [
		'CardPredictionTracks',
		'CardPathGrid',
		'CardRewardColumns',
		'CardPlacementRows',
	]) {
		assert.match(source(name), /filled=\{/, name);
	}
	const filled = html(
		render(CardPathGrid, {
			props: {
				heads: ['1st'],
				spaces: [{ id: 'c1r1', text: 'x' }],
				current: 'c1r1',
			},
		})
	);
	assert.match(filled, /rg-card-slot--filled/);
});

test('CardFrame has a plain mode, only the paper, and takes its reviewed spacing as props', () => {
	const plain = html(
		render(CardFrame, {
			props: { plain: true, children: snippet('<p>x</p>') },
		})
	);
	assert.match(plain, /^<article class="rg-card-frame rg-card-frame--plain/);
	assert.doesNotMatch(plain, /rg-card-band|rg-card-frame--portrait|<footer/);
	const full = html(
		render(CardFrame, {
			props: {
				title: 'Leaders',
				portrait: '/art/civ/leaders.svg',
				bodyMinHeight: 184,
				textLeading: 1.5,
			},
		})
	);
	assert.match(full, /rg-card-frame--body[^"]*" style="min-height: 184px;"/);
	assert.match(full, /rg-card-frame--text[^"]*" style="line-height: 1.5;"/);
});

test('the library sections draw the patterns on a plain CardFrame, never a fake frame (#106)', () => {
	for (const file of readdirSync(
		new URL('../src/library/sections/player/', import.meta.url)
	)) {
		const text = readFileSync(
			new URL(`../src/library/sections/player/${file}`, import.meta.url),
			'utf8'
		);
		assert.doesNotMatch(text, /class="rg-card-frame"/, file);
	}
});

test('CivilizationCard gives its frames no civilization class (#106)', () => {
	assert.doesNotMatch(source('CivilizationCard'), /rg-card-frame--/);
});

test('card-patterns.css keeps the frame palette and the symbols, and no pattern or dead rule (#106)', () => {
	const css = readFileSync(
		new URL('../src/styles/card-patterns.css', import.meta.url),
		'utf8'
	);
	assert.equal(css.match(/^\.rg-card-frame \{/gm)?.length, 1);
	assert.doesNotMatch(
		css,
		/rg-card-(slot|any|notch|shadow|option|cx|vp|ability|fine|setup|resource-icon|frame--(body|text|foot|portrait|band))/
	);
	assert.doesNotMatch(css, CIVILIZATION_CLASS_PATTERNS);
});
