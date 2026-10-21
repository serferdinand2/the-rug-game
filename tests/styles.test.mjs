// The global styles: tokens.css is the single source of the phase-one look, and the fonts are self-hosted.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** @param {string} path - A path relative to the repository root */
const read = (path) =>
	readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');
const tokensCss = read('client/src/styles/tokens.css');
const baseCss = read('client/src/styles/base.css');
const fontsDir = fileURLToPath(
	new URL('../client/static/fonts/', import.meta.url)
);

/**
 * The custom properties declared in a block of CSS, as name → value.
 * @param {string} css
 * @returns {Map<string, string>}
 */
function declarations(css) {
	const found = new Map();
	for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
		found.set(name, value.trim());
	}
	return found;
}

const rootBlock = tokensCss.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
const tokens = declarations(rootBlock);

/** Every stylesheet and Svelte component under client/src, as [path, contents]. */
const sources = readdirSync(
	fileURLToPath(new URL('../client/src/', import.meta.url)),
	{ recursive: true }
)
	.map(String)
	.filter((path) => /\.(css|svelte)$/.test(path))
	.map((path) => [path, read(`client/src/${path}`)]);

/**
 * The CSS of a source file: the whole file for a stylesheet, the <style> blocks for a component.
 * @param {string} path
 * @param {string} contents
 */
const cssOf = (path, contents) =>
	path.endsWith('.css')
		? contents
		: [...contents.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
				.map((m) => m[1])
				.join('\n');

test('tokens.css holds the phase-one surfaces, text and accents', () => {
	const expected = {
		'--ink': '#121517',
		'--chrome': '#171a1d',
		'--control': '#202529',
		'--surface': '#242a2e',
		'--raised': '#30383c',
		'--line': '#465257',
		'--text': '#e8ddc4',
		'--muted': '#b9af9b',
		'--gold': '#e2b857',
		'--bronze': '#b88746',
		'--action': '#79b99b',
		'--ok': '#8fd0aa',
		'--danger': '#e05f5f',
	};
	for (const [name, value] of Object.entries(expected)) {
		assert.equal(tokens.get(name), value, name);
	}
});

test('tokens.css holds one colour per track, expansion and terrain', () => {
	const expected = {
		'--exploration': '#3f83a8',
		'--science': '#579274',
		'--technology': '#b57a3b',
		'--military': '#a94f4f',
		'--arts-architecture': '#bd9155',
		'--plans-ploys': '#7e9f86',
		'--fantasies-futures': '#9d83ae',
		'--sea': '#396d98',
		'--desert': '#c9a55d',
		'--forest': '#477a50',
		'--grassland': '#91a85a',
		'--mountain': '#85878a',
	};
	for (const [name, value] of Object.entries(expected)) {
		assert.equal(tokens.get(name), value, name);
	}
});

test('five player colours exist and none of them is a track colour', () => {
	const players = [1, 2, 3, 4, 5].map((n) => tokens.get(`--player-${n}`));
	assert.deepEqual(players.slice(0, 4), [
		'#4ea1d3',
		'#e06a55',
		'#64ae67',
		'#e1b84d',
	]);
	assert.match(players[4] ?? '', /^#[0-9a-f]{6}$/);
	assert.equal(new Set(players).size, 5);
	const tracks = ['exploration', 'science', 'technology', 'military'].map(
		(track) => tokens.get(`--${track}`)
	);
	for (const player of players) {
		assert.ok(!tracks.includes(player), `${player} is also a track colour`);
	}
});

test('no stylesheet or component outside tokens.css hard-codes a colour', () => {
	for (const [path, contents] of sources) {
		if (path.endsWith('tokens.css')) {
			continue;
		}
		const css = cssOf(path, contents);
		assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i, path);
		assert.doesNotMatch(css, /\b(rgba?|hsla?)\(/i, path);
	}
});

test('every custom property a component uses is declared somewhere', () => {
	const declared = new Set();
	for (const [, contents] of sources) {
		for (const name of declarations(contents).keys()) {
			declared.add(name);
		}
	}
	for (const [path, contents] of sources) {
		for (const [, name] of contents.matchAll(/var\(\s*(--[\w-]+)/g)) {
			assert.ok(declared.has(name), `${path} uses undeclared ${name}`);
		}
	}
});

test('the corners are square everywhere', () => {
	assert.equal(tokens.get('--radius'), '0');
});

test('reduced motion turns every motion duration off', () => {
	const durations = [...tokens.keys()].filter((name) =>
		name.startsWith('--duration-')
	);
	assert.ok(durations.length > 0);
	const reduced = tokensCss.match(
		/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*:root\s*\{([^}]*)\}/
	)?.[1];
	assert.ok(reduced, 'tokens.css has no reduced-motion block');
	const off = declarations(reduced);
	for (const name of durations) {
		assert.equal(off.get(name), '0ms', name);
	}
});

test('the font tokens name Cinzel for titles and Atkinson Hyperlegible for the rest', () => {
	assert.match(tokens.get('--font-title') ?? '', /^'Cinzel', serif$/);
	assert.match(
		tokens.get('--font-body') ?? '',
		/^'Atkinson Hyperlegible', sans-serif$/
	);
});

test('base.css loads every weight the design uses from client/static/fonts', () => {
	const faces = [...baseCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(
		([, body]) => ({
			family: body.match(/font-family:\s*'([^']+)'/)?.[1],
			weight: body.match(/font-weight:\s*([^;]+);/)?.[1].trim(),
			file: body.match(/url\('\/fonts\/([^']+)'\)/)?.[1],
		})
	);
	assert.deepEqual(
		faces.map(({ family, weight }) => `${family} ${weight}`),
		[
			'Cinzel 400 900',
			'Atkinson Hyperlegible 400',
			'Atkinson Hyperlegible 700',
		]
	);
	for (const { file } of faces) {
		assert.ok(file && existsSync(fontsDir + file), `missing font ${file}`);
	}
});

test('client/static/fonts holds only the chosen fonts and their licences', () => {
	assert.deepEqual(readdirSync(fontsDir).sort(), [
		'LICENSE-atkinson-hyperlegible.txt',
		'LICENSE-cinzel.txt',
		'atkinson-hyperlegible-bold.ttf',
		'atkinson-hyperlegible-regular.ttf',
		'cinzel.ttf',
	]);
	for (const licence of ['cinzel', 'atkinson-hyperlegible']) {
		assert.match(
			readFileSync(`${fontsDir}LICENSE-${licence}.txt`, 'utf8'),
			/SIL Open Font License, Version 1\.1/
		);
	}
});

test('no stylesheet loads fonts or images from another site', () => {
	for (const [path, contents] of sources) {
		const css = cssOf(path, contents);
		assert.doesNotMatch(css, /@import/, path);
		assert.doesNotMatch(css, /url\(\s*['"]?(https?:)?\/\//, path);
	}
	assert.doesNotMatch(
		read('client/index.html'),
		/<link[^>]+href="(https?:)?\/\//
	);
});

test('the pixel texture token points at the texture beside tokens.css', () => {
	const url = tokens.get('--texture')?.match(/^url\('\.\/([^']+)'\)$/)?.[1];
	assert.ok(url, 'tokens.css has no --texture url');
	assert.ok(
		existsSync(
			fileURLToPath(
				new URL(`../client/src/styles/${url}`, import.meta.url)
			)
		),
		`missing ${url}`
	);
});
