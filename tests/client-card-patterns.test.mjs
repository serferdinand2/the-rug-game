// The card pattern primitives take their content as data and their state as props, with their own styles (#106).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { spotChoice } from '../src/lib/card-spots.js';
import CardClarity from '../src/lib/components/player/CardClarity.svelte';
import CardEffectBox from '../src/lib/components/player/CardEffectBox.svelte';
import CardEffectList from '../src/lib/components/player/CardEffectList.svelte';
import CardPredictionTracks from '../src/lib/components/player/CardPredictionTracks.svelte';
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
	assert.equal(body.match(/rg-card-slot-surface--picked/g)?.length, 1);
});

test('CivilizationCard writes no prediction row by hand (#106)', () => {
	assert.doesNotMatch(
		source('CivilizationCard'),
		/rg-card-mystic-|mysticNumbers/
	);
});
