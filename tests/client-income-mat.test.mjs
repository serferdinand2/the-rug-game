// The income mat (#27): all printed tiles share one visual layout; covered building covers slide left to reveal them (#151).
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

test('covered and exposed spaces draw the same printed tile structure (#151)', () => {
	const html = spaces();
	assert.equal(html.length, 24);
	const covered = html[3];
	assert.match(covered, /rg-income-mat--space-covered/);
	assert.match(covered, /rg-income-mat--tile-content/);
	assert.match(covered, /rg-income-mat--name[^>]*>Credit Cards<\/b>/);
	assert.match(covered, /rg-income-mat--effect-label[^>]*>Income:<\/b>/);
	assert.match(covered, /rg-income-mat--reward/);
	assert.match(covered, /rg-income-mat--cover/);
	assert.match(covered, /<img[^>]*building\/market/);
	assert.match(html[0], /rg-income-mat--tile-content/);
	assert.match(html[0], /rg-income-mat--name/);
	assert.match(html[0], /rg-income-mat--symbols/);
	assert.doesNotMatch(html[0], /rg-income-mat--cover/);
});

test('only covered tiles are keyboard-focusable to reveal their printed content (#151)', () => {
	const html = spaces();
	const focusable = html.filter((space) => /tabindex="0"/.test(space));
	const covered = html.filter((space) =>
		/rg-income-mat--space-covered/.test(space)
	);
	assert.equal(covered.length, 3 + 3 + 3 + 4);
	assert.deepEqual(focusable, covered);
});

test('covered building covers slide left; row glows and hover tint remain (#151)', () => {
	assert.match(style, /var\(--duration-medium\) var\(--ease-out\)/);
	assert.match(style, /transform: translateX\(-100%\)/);
	assert.match(style, /@media \(prefers-reduced-motion: reduce\)/);
	const reduced = style.slice(
		style.indexOf('@media (prefers-reduced-motion: reduce)')
	);
	assert.match(reduced, /transform: translateX\(-100%\)/);
	assert.match(style, /--rg-income-mat-hover/);
	assert.doesNotMatch(source, /lifted|space-lifted|shadow-float/);
});

