// One Dialog for How to play, Table settings and the help panel (#87): it names itself by its title, says whether it
// is modal, closes with Close unless given other actions, and the three panels keep only their content.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import Dialog from '../src/lib/components/ui/Dialog.svelte';

/** Content, as a panel passes it. */
const content = createRawSnippet(() => ({
	render: () => '<p>Enter your name.</p>',
}));

/** Actions in place of Close. */
const done = createRawSnippet(() => ({
	render: () => '<button type="button">Done</button>',
}));

/**
 * A Dialog drawn on the server, as HTML.
 * @param {Record<string, any>} props
 * @returns {string}
 */
function draw(props) {
	return render(Dialog, {
		props: { title: 'How to play', children: content, ...props },
	}).body;
}

/**
 * The attributes of the element with this role.
 * @param {string} html
 * @param {string} role
 * @returns {Record<string, string>}
 */
function withRole(html, role) {
	const tag = [...html.matchAll(/<\w+\s([^>]*)>/g)]
		.map((m) => m[1])
		.find((text) => text.includes(`role="${role}"`));
	assert.ok(tag, `no element with role ${role}`);
	return Object.fromEntries(
		[...tag.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((m) => [
			m[1],
			m[2] ?? '',
		])
	);
}

test('the title names a modal dialog, with Close as its action', () => {
	const html = draw({});
	const dialog = withRole(html, 'dialog');
	assert.equal(dialog['aria-modal'], 'true');
	const title = new RegExp(
		`<h2[^>]*id="${dialog['aria-labelledby']}"[^>]*>\\s*How to play\\s*</h2>`
	);
	assert.match(html, title);
	assert.match(html, /<p>Enter your name\.<\/p>/);
	assert.match(html, /<button[^>]*>(?:(?!<\/button>)[\s\S])*\bClose\b/);
});

test('a dialog that is not modal says so', () => {
	const html = draw({ title: 'Table settings', modal: false });
	assert.equal(withRole(html, 'dialog')['aria-modal'], 'false');
	assert.match(html, /class="rg-dialog\b[^"]*\brg-dialog--modeless\b/);
});

test('actions take the place of Close', () => {
	const html = draw({ actions: done });
	assert.match(html, /<button type="button">Done<\/button>/);
	assert.doesNotMatch(html, /\bClose\b/);
});

test('a dialog is narrow unless asked to be wide', () => {
	assert.match(draw({}), /class="rg-dialog\b[^"]*\brg-dialog--narrow\b/);
	assert.match(
		draw({ size: 'wide' }),
		/class="rg-dialog\b[^"]*\brg-dialog--wide\b/
	);
});

test('the three panels are built on Dialog and read no markup', () => {
	for (const file of [
		'screens/HelpPanel.svelte',
		'screens/game/RulesPanel.svelte',
		'screens/game/TableSettings.svelte',
	]) {
		const source = readFileSync(
			new URL(`../src/${file}`, import.meta.url),
			'utf8'
		);
		assert.match(source, /<Dialog\b/, `${file} uses Dialog`);
		assert.doesNotMatch(source, /svelte:window/, `${file} listens`);
		assert.doesNotMatch(source, /role="dialog"/, `${file} is a dialog`);
		assert.doesNotMatch(source, /aria-modal/, `${file} sets aria-modal`);
		assert.doesNotMatch(source, /querySelector/, `${file} queries`);
		assert.doesNotMatch(source, /activeElement/, `${file} moves focus`);
	}
});
