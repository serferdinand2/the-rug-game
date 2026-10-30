// The card pattern primitives take their content as data and their state as props, with their own styles (#106).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import CardClarity from '../src/lib/components/player/CardClarity.svelte';
import CardEffectBox from '../src/lib/components/player/CardEffectBox.svelte';
import CardEffectList from '../src/lib/components/player/CardEffectList.svelte';
import CardResource from '../src/lib/components/player/CardResource.svelte';

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
