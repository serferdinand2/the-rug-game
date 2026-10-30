// A player's capital and tech rows are drawn once (#94): CapitalCity and TechRows, for Your area and the players overview.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { view } from '../src/lib/engine/game.js';
import { capitalView } from '../src/lib/area/capital.js';
import { TECH_ROWS } from '../src/lib/area/tech-rows.js';
import CapitalCity from '../src/lib/components/player/CapitalCity.svelte';
import TechRows from '../src/lib/components/player/TechRows.svelte';
import PlayerTabs from '../src/screens/game/PlayerTabs.svelte';
import { startedGame } from './helpers/engine.mjs';

/** @param {string} path - A path from the project root */
const source = (path) =>
	readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/**
 * How many times a class is used in some HTML.
 * @param {string} html
 * @param {string} name
 */
const countOf = (html, name) =>
	[...html.matchAll(/class="([^"]*)"/g)].filter((match) =>
		match[1].split(/\s+/).includes(name)
	).length;

/** A started two-player game as seat 1 sees it, seat 1 holding tech cards in two rows. */
function dealtGame() {
	const { state } = startedGame(2);
	const seat = /** @type {any} */ (state.seats[0]);
	seat.tech = { top: ['clocks'], middle: [], bottom: ['barn', 'bakery'] };
	return view(state, 1);
}

test('the tech rows are named once, top first, with their shapes', () => {
	assert.deepEqual(
		TECH_ROWS.map((row) => [row.id, row.label, row.shape]),
		[
			['top', 'Top row', 'square'],
			['middle', 'Middle row', 'circle'],
			['bottom', 'Bottom row', 'none'],
		]
	);
	assert.ok(Object.isFrozen(TECH_ROWS));
});

test("CapitalCity draws the title, the grid and the counters from a seat's capital", () => {
	const game = dealtGame();
	const capital = capitalView(game.seats[0], 'ABCD');
	assert.ok(capital);
	const html = render(CapitalCity, {
		props: { capital, owner: 'Capital City', label: "Marko's capital" },
	}).body;
	assert.match(html, /class="rg-capital-city\b/);
	assert.match(
		html,
		new RegExp(
			`Capital City · <span class="rg-capital-city--name[^"]*">${capital.name}</span>`
		)
	);
	assert.equal(countOf(html, 'rg-capital-grid'), 1);
	assert.equal(countOf(html, 'rg-completion-counters'), 1);
	assert.match(html, /aria-label="Marko's capital"/);
	// Nothing is lit until a counter is hovered or pressed.
	assert.doesNotMatch(html, /aria-pressed="true"/);
});

test('TechRows fans each row with its shape, or says it is empty', () => {
	const game = dealtGame();
	const html = render(TechRows, {
		props: { tech: game.seats[0].tech, layout: 'fan' },
	}).body;
	assert.match(html, /rg-tech-rows--fan/);
	assert.equal(countOf(html, 'rg-tech-rows--row'), 3);
	assert.equal(countOf(html, 'rg-card-fan'), 2);
	assert.equal(countOf(html, 'rg-scaled-card'), 3);
	assert.match(html, /--rg-scaled-card-scale: 0\.42/);
	assert.match(html, /rg-tech-rows--shape-square/);
	assert.match(html, /rg-tech-rows--shape-circle/);
	assert.match(html, /aria-label="Top row tech cards"/);
	assert.equal(countOf(html, 'rg-tech-rows--empty'), 1);
	assert.match(html, /No cards yet/);
});

test('TechRows wraps each row, smaller, without the shapes', () => {
	const game = dealtGame();
	const html = render(TechRows, {
		props: { tech: game.seats[0].tech, layout: 'wrap' },
	}).body;
	assert.match(html, /rg-tech-rows--wrap/);
	assert.equal(countOf(html, 'rg-card-fan'), 0);
	assert.equal(countOf(html, 'rg-scaled-card'), 3);
	assert.match(html, /--rg-scaled-card-scale: 0\.4;/);
	assert.doesNotMatch(html, /rg-tech-rows--shape/);
	assert.match(html, /Middle row/);
	assert.match(html, />No cards</);
});

test("Your area's Capital and Tech tabs draw CapitalCity and TechRows", () => {
	const game = dealtGame();
	const tabs = (/** @type {string} */ tab) =>
		render(PlayerTabs, { props: { game, seat: 1, code: 'ABCD', tab } })
			.body;
	assert.equal(countOf(tabs('capital'), 'rg-capital-city'), 1);
	const tech = tabs('tech');
	assert.equal(countOf(tech, 'rg-tech-rows'), 1);
	// The display stays the Tech tab's own row, after the player's three.
	assert.match(tech, /The display · \d+ in the deck/);
});

test('neither screen keeps its own capital or tech rows', () => {
	const playerTabs = source('src/screens/game/PlayerTabs.svelte');
	const capitalTab = source('src/screens/game/CapitalTab.svelte');
	const techTab = source('src/screens/game/TechTab.svelte');
	assert.match(playerTabs, /import CapitalTab from/);
	assert.match(playerTabs, /import TechTab from/);
	assert.match(capitalTab, /import CapitalCity from/);
	assert.match(techTab, /import TechRows from/);

	for (const path of [
		'src/screens/game/PlayerTabs.svelte',
		'src/screens/game/PlayersOverview.svelte',
	]) {
		const text = source(path);
		assert.doesNotMatch(
			text,
			/import (CapitalGrid|CompletionCounters) /,
			path
		);
		assert.doesNotMatch(text, /\bhighlight\b/, path);
		assert.doesNotMatch(text, /TECH_ROWS|'Middle'|'Top row'/, path);
		assert.doesNotMatch(text, /--name\b|--shape|--empty-row/, path);
	}

	const overview = source('src/screens/game/PlayersOverview.svelte');
	assert.match(overview, /import CapitalCity from/);
	assert.match(overview, /import TechRows from/);
});
