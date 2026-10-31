// The component library: every component follows docs/conventions.md and appears on the library page with its states.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const componentsDir = fileURLToPath(
	new URL('../src/lib/components/', import.meta.url)
);
const sectionsDir = fileURLToPath(
	new URL('../src/library/sections/', import.meta.url)
);
const AREAS = ['ui', 'board', 'player', 'prompts', 'lobby', 'log', 'results'];

/**
 * The .svelte files directly inside each area folder, as { area, name, source }.
 * @param {string} dir
 */
function svelteFiles(dir) {
	if (!existsSync(dir)) {
		return [];
	}
	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.flatMap((area) =>
			readdirSync(`${dir}${area.name}`)
				.filter((file) => file.endsWith('.svelte'))
				.map((file) => ({
					area: area.name,
					name: file.replace(/\.svelte$/, ''),
					source: readFileSync(`${dir}${area.name}/${file}`, 'utf8'),
				}))
		);
}

const components = svelteFiles(componentsDir);
const sections = svelteFiles(sectionsDir);

/** @param {string} name - A PascalCase component name */
const kebab = (name) => name.replace(/(?<!^)([A-Z])/g, '-$1').toLowerCase();

test('the library has components in every area', () => {
	for (const area of AREAS) {
		assert.ok(
			components.some((component) => component.area === area),
			`no components in ${area}`
		);
	}
	for (const { area, name } of components) {
		assert.ok(
			AREAS.includes(area),
			`${name} is in an unknown area, ${area}`
		);
		assert.match(name, /^[A-Z][A-Za-z]+$/, `${name} is not PascalCase`);
	}
});

test('every component has a section on the library page that shows it', () => {
	for (const { area, name } of components) {
		const section = sections.find(
			(candidate) => candidate.area === area && candidate.name === name
		);
		assert.ok(
			section,
			`src/library/sections/${area}/${name}.svelte is missing`
		);
		assert.match(
			section.source,
			new RegExp(
				`import ${name} from '[./]*lib/components/${area}/${name}\\.svelte';`
			),
			`the ${name} section does not import ${name}`
		);
		assert.match(
			section.source,
			/<Example\b/,
			`the ${name} section shows no states`
		);
	}
});

test('every section belongs to a component', () => {
	for (const { area, name } of sections) {
		assert.ok(
			components.some((c) => c.area === area && c.name === name),
			`the section ${area}/${name} has no component`
		);
	}
});

test('every component file follows the structure in docs/conventions.md', () => {
	for (const { name, source } of components) {
		assert.match(
			source,
			/^<!-- .+ -->\r?\n/,
			`${name} must start with a one-line comment`
		);
		const moduleScript = source.match(
			/<script module>([\s\S]*?)<\/script>/
		)?.[1];
		assert.ok(moduleScript, `${name} has no <script module>`);
		assert.match(
			moduleScript,
			new RegExp(`@typedef \\{[^}]+\\} ${name}OwnProps\\b`),
			`${name}OwnProps`
		);
		assert.match(
			moduleScript,
			new RegExp(
				`@typedef \\{${name}OwnProps & [^}]+\\} ${name}Props\\b`
			),
			`${name}Props`
		);
		assert.match(moduleScript, /@example/, `${name} has no @example`);
		assert.match(
			source,
			new RegExp(
				`/\\*\\* @type \\{${name}Props\\} \\*/\\s*let \\{[\\s\\S]*?\\} = \\$props\\(\\);`
			),
			`${name} must type its $props()`
		);
		assert.match(
			source,
			/\{\.\.\.attr\}/,
			`${name} must spread {...attr} on its root`
		);
		assert.match(source, /attr\.class/, `${name} must merge attr.class`);
		assert.doesNotMatch(source, /export let /, `${name} uses legacy props`);
	}
});

test('callbacks are named on{Component}{Action} and receive a ComponentEvent', () => {
	for (const { name, source } of components) {
		const callbacks = [
			...source.matchAll(/@property \{[^}]+\} \[?(on[A-Z]\w*)/g),
		].map((m) => m[1]);
		for (const callback of callbacks) {
			assert.match(
				callback,
				new RegExp(`^on${name}[A-Z]`),
				`${name}: ${callback}`
			);
			assert.match(
				source,
				new RegExp(`${callback}\\(\\s*new ComponentEvent\\(`),
				`${name}: ${callback} must be called with a ComponentEvent`
			);
		}
	}
});

test('every class a component styles starts with rg-{component}', () => {
	for (const { name, source } of components) {
		const style = source.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
		const selectors = [
			...style
				.replace(/\/\*[\s\S]*?\*\//g, '')
				// Global selectors style the child component that owns these classes.
				.replace(/:global\([^)]*\)/g, '')
				// A url() can hold dots, such as an inline SVG's www.w3.org namespace.
				.replace(/url\((["'])[\s\S]*?\1\)|url\([^)]*\)/g, '')
				.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g),
		].map((m) => m[1]);
		for (const selector of selectors) {
			assert.ok(
				selector === `rg-${kebab(name)}` ||
					selector.startsWith(`rg-${kebab(name)}--`),
				`${name} styles .${selector}`
			);
		}
	}
});

test('every player token is a PlayerToken (#103)', () => {
	for (const { name, source } of components) {
		if (name === 'PlayerToken') {
			continue;
		}
		assert.doesNotMatch(
			source,
			/playerPieceUrl\(\s*'token'|piece\/token-|PLAYER_ART_COLORS/,
			`${name} draws a player token without PlayerToken`
		);
	}
});

test('the DecisionPanel and TrackBoard sections build from dealt games, not copies of the modules (#131)', () => {
	const source = (/** @type {string} */ area, /** @type {string} */ name) =>
		/** @type {{ source: string }} */ (
			sections.find((s) => s.area === area && s.name === name)
		).source;
	const decision = source('prompts', 'DecisionPanel');
	assert.match(decision, /new PromptState\(/);
	assert.doesNotMatch(
		decision,
		/function payMixes|const sets =|mode: 'pay'|kind: 'chooseTrade'/,
		'the DecisionPanel section hand-builds a pick model'
	);
	const board = source('board', 'TrackBoard');
	assert.match(board, /trackBoard\(/);
	assert.doesNotMatch(
		board,
		/function fixtureTrack|describeEffects|spaceGlyphs/,
		'the TrackBoard section re-implements trackBoard()'
	);
});

