// The income mat (#27): a covered space is the printed space under its building, which lifts on hover or focus to show it (#142).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import IncomeMat from '../src/lib/components/player/IncomeMat.svelte';
import { incomeRows } from '../src/lib/area/income.js';

const source = readFileSync(
	new URL('../src/lib/components/player/IncomeMat.svelte', import.meta.url),
	'utf8'
);
const style = source.slice(source.indexOf('<style>'));

/** A mid-game mat: three markets, houses and farms taken, one armory. */
const ROWS = incomeRows({
	incomeMat: { buildings: { market: 3, house: 3, farm: 3, armory: 4 } },
});

/**
 * Each space of the rendered mat, as its list item's HTML.
 * @param {Record<string, unknown>} [props]
 * @returns {string[]}
 */
function spaces(props = {}) {
	const { body } = render(IncomeMat, {
		props: { rows: ROWS, era: 3, ...props },
	});
	return [...body.matchAll(/<li\b[\s\S]*?<\/li>/g)].map(([html]) => html);
}

test('a covered space draws its printed name and reward under the building (#142)', () => {
	const html = spaces();
	assert.equal(html.length, 24);
	const creditCards = html[3];
	assert.match(creditCards, /rg-income-mat--space-covered/);
	assert.match(
		creditCards,
		/<b class="rg-income-mat--name[^"]*">Credit Cards<\/b>/
	);
	assert.match(
		creditCards,
		/<span class="rg-income-mat--reward[^"]*">Income: Gain 1 coin<\/span>/
	);
	assert.match(creditCards, /class="rg-income-mat--cover/);
	assert.match(creditCards, /<img[^>]*building\/market/);
	// An exposed space has no cover and no building over it.
	assert.doesNotMatch(html[0], /rg-income-mat--cover|<img/);
	assert.match(
		html[0],
		/Income: Gain 1 coin\. Score: Gain 1 VP for each tech card you have/
	);
});

test('only a covered space takes the keyboard focus, to lift its building (#142)', () => {
	const html = spaces();
	const focusable = html.filter((space) => /tabindex="0"/.test(space));
	const covered = html.filter((space) =>
		/rg-income-mat--space-covered/.test(space)
	);
	assert.equal(covered.length, 3 + 3 + 3 + 4);
	assert.deepEqual(focusable, covered);
});

test('lifted holds one covered building up, as if pointed at (#142)', () => {
	const html = spaces({ lifted: 'Credit Cards' });
	const lifted = html.filter((space) =>
		/rg-income-mat--space-lifted/.test(space)
	);
	assert.equal(lifted.length, 1);
	assert.match(lifted[0], />Credit Cards</);
	// An exposed space has no building to lift.
	assert.equal(
		spaces({ lifted: 'Barter' }).filter((space) =>
			/rg-income-mat--space-lifted/.test(space)
		).length,
		0
	);
	assert.equal(
		spaces().filter((space) => /rg-income-mat--space-lifted/.test(space))
			.length,
		0
	);
});

test('the building lifts straight up over the medium duration, with a dragged piece shadow, and only fades under reduced motion (owner, #142)', () => {
	assert.match(style, /var\(--duration-medium\) var\(--ease-out\)/);
	assert.match(style, /drop-shadow\(var\(--shadow-float\)\)/);
	assert.match(style, /scale\(1\.15\)/);
	assert.match(style, /@media \(prefers-reduced-motion: no-preference\)/);
	assert.match(style, /@media \(prefers-reduced-motion: reduce\)/);
	const reduced = style.slice(
		style.indexOf('@media (prefers-reduced-motion: reduce)')
	);
	assert.match(reduced, /opacity: 0/);
	assert.doesNotMatch(reduced, /scale|top:|drop-shadow/);
	// The lift replaces the row-coloured hover tint.
	assert.doesNotMatch(style, /--rg-income-mat-hover/);
});
