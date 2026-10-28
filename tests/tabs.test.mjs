// Tabs owns its ids, its panel and its focus (#91): each row prefixes its ids and draws the selected tab's panel, and
// no caller builds those ids or reads another component's markup.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import Tabs from '../src/lib/components/ui/Tabs.svelte';
import TwoTabRows from './helpers/TwoTabRows.svelte';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));

const TABS = [
	{ id: 'capital', label: 'Capital' },
	{ id: 'hand', label: 'Hand', count: 4 },
	{ id: 'income', label: 'Income' },
];

/** A panel's content, as a caller passes it. */
const content = createRawSnippet(() => ({
	render: () => '<p>The capital.</p>',
}));

/**
 * A row of Tabs drawn on the server, as HTML.
 * @param {Record<string, any>} props
 * @returns {string}
 */
function draw(props) {
	return render(Tabs, {
		props: {
			label: 'Your city and cards',
			tabs: TABS,
			value: 'capital',
			...props,
		},
	}).body;
}

/**
 * The attributes of an opening tag's text, by name.
 * @param {string} text
 * @returns {Record<string, string>}
 */
function attributes(text) {
	return Object.fromEntries(
		[...text.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((m) => [
			m[1],
			m[2] ?? '',
		])
	);
}

/**
 * The attributes of every element with this role, in document order.
 * @param {string} html
 * @param {string} role
 * @returns {Record<string, string>[]}
 */
function withRole(html, role) {
	return [...html.matchAll(/<\w+\s([^>]*)>/g)]
		.map((m) => attributes(m[1]))
		.filter((element) => element.role === role);
}

/**
 * Every id in the HTML.
 * @param {string} html
 * @returns {string[]}
 */
function ids(html) {
	return [...html.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]);
}

test('a row given a prefix names its tabs and its panel with it', () => {
	const html = draw({ idPrefix: 'rules', children: content });
	assert.deepEqual(
		withRole(html, 'tab').map((tab) => tab.id),
		['rules-capital-tab', 'rules-hand-tab', 'rules-income-tab']
	);
	const [panel] = withRole(html, 'tabpanel');
	assert.equal(panel.id, 'rules-capital-panel');
	assert.equal(panel['aria-labelledby'], 'rules-capital-tab');
	assert.equal(panel.tabindex, '0');
	assert.match(html, /<p>The capital\.<\/p>/);
});

test('the panel follows the selected tab', () => {
	const html = draw({ idPrefix: 'area', value: 'income', children: content });
	const [panel] = withRole(html, 'tabpanel');
	assert.equal(panel.id, 'area-income-panel');
	assert.equal(panel['aria-labelledby'], 'area-income-tab');
});

test('only the selected tab names the panel, and a row without children draws none', () => {
	const tabs = withRole(
		draw({ idPrefix: 'rules', children: content }),
		'tab'
	);
	assert.deepEqual(
		tabs.map((tab) => tab['aria-controls'] ?? null),
		['rules-capital-panel', null, null]
	);

	const bare = draw({ idPrefix: 'rules' });
	assert.deepEqual(withRole(bare, 'tabpanel'), []);
	assert.ok(
		withRole(bare, 'tab').every((tab) => !('aria-controls' in tab)),
		'a tab names a panel that is not drawn'
	);
});

test('a panel can carry the classes its caller lays it out with', () => {
	const [panel] = withRole(
		draw({ children: content, panelClass: 'rg-player-tabs--body' }),
		'tabpanel'
	);
	assert.match(panel.class, /\brg-tabs--panel\b/);
	assert.match(panel.class, /\brg-player-tabs--body\b/);
});

test('a row without a prefix takes its own, so two rows with the same tab ids share no id', () => {
	const html = render(TwoTabRows).body;
	const all = ids(html);
	assert.equal(all.length, 6, 'two rows of two tabs, and two panels');
	assert.equal(new Set(all).size, all.length, `repeated ids: ${all}`);
	assert.ok(!all.includes('capital-tab'), 'a tab id is not prefixed');

	const tabIds = withRole(html, 'tab').map((tab) => tab.id);
	const panels = withRole(html, 'tabpanel');
	assert.equal(panels.length, 2);
	for (const panel of panels) {
		assert.ok(tabIds.includes(panel['aria-labelledby']));
	}
	assert.notEqual(panels[0]['aria-labelledby'], panels[1]['aria-labelledby']);
});

test('no other component draws a tab panel, builds tab ids or reads the tabs', () => {
	const files = readdirSync(SRC, { recursive: true })
		.map(String)
		.filter(
			(file) =>
				file.endsWith('.svelte') &&
				file !== 'lib/components/ui/Tabs.svelte'
		);
	assert.ok(files.length > 50, 'the Svelte files are found');
	for (const file of files) {
		const source = readFileSync(`${SRC}${file}`, 'utf8');
		assert.doesNotMatch(source, /role="tabpanel"/, `${file} draws a panel`);
		assert.doesNotMatch(
			source,
			/(?:id|aria-labelledby|aria-controls)="\{[^}]*\}-(?:tab|panel)"/,
			`${file} builds a tab or panel id`
		);
		assert.doesNotMatch(
			source,
			/\[role="tab"\]/,
			`${file} reads the tabs' markup`
		);
	}
});

test('the screen parts with tabs or player cards move the focus without reading markup', () => {
	for (const file of [
		'screens/game/RulesPanel.svelte',
		'screens/game/PlayersOverview.svelte',
		'screens/game/PlayerTabs.svelte',
		'screens/game/LogPanel.svelte',
	]) {
		assert.doesNotMatch(
			readFileSync(`${SRC}${file}`, 'utf8'),
			/querySelector/,
			`${file} queries the DOM`
		);
	}
});
