// The global styles: tokens.css is the single source of the phase-one look, and the fonts are self-hosted.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** @param {string} path - A path relative to the repository root */
const read = (path) =>
	readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');
const tokensCss = read('src/styles/tokens.css');
const baseCss = read('src/styles/base.css');
const fontsDir = fileURLToPath(new URL('../static/fonts/', import.meta.url));

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

/**
 * A colour as [r, g, b] from 0 to 255: a hex value, a token reference, or an sRGB color-mix of two of them.
 * @param {string} value
 * @returns {number[]}
 */
function rgb(value) {
	const hex = value.match(/^#([0-9a-f]{6})$/i)?.[1];
	if (hex) {
		return [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16));
	}
	const reference = value.match(/^var\((--[\w-]+)\)$/)?.[1];
	if (reference) {
		return rgb(tokens.get(reference) ?? `undeclared ${reference}`);
	}
	const mix = value.match(
		/^color-mix\(\s*in srgb,\s*(.+?)\s+(\d+)%,\s*(.+?)\s*\)$/
	);
	if (mix) {
		const share = Number(mix[2]) / 100;
		const other = rgb(mix[3]);
		return rgb(mix[1]).map(
			(channel, i) => channel * share + other[i] * (1 - share)
		);
	}
	throw new Error(`cannot read the colour ${value}`);
}

/**
 * A colour's channels in linear light, from 0 to 1.
 * @param {number[]} color
 */
const linear = (color) =>
	color.map((channel) => {
		const value = channel / 255;
		return value <= 0.04045
			? value / 12.92
			: ((value + 0.055) / 1.055) ** 2.4;
	});

/**
 * The WCAG contrast ratio of two colours.
 * @param {number[]} a
 * @param {number[]} b
 */
function contrast(a, b) {
	const [high, low] = [a, b]
		.map((color) => {
			const [r, g, b] = linear(color);
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		})
		.sort((x, y) => y - x);
	return (high + 0.05) / (low + 0.05);
}

/** Every stylesheet and Svelte component under src, as [path, contents]. */
const sources = readdirSync(
	fileURLToPath(new URL('../src/', import.meta.url)),
	{ recursive: true }
)
	.map(String)
	.filter((path) => /\.(css|svelte)$/.test(path))
	.map((path) => [path, read(`src/${path}`)]);

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
	assert.equal(players[4], '#b07fd0');
	assert.equal(new Set(players).size, 5);
	const tracks = ['exploration', 'science', 'technology', 'military'].map(
		(track) => tokens.get(`--${track}`)
	);
	for (const player of players) {
		assert.ok(!tracks.includes(player), `${player} is also a track colour`);
	}
});

test('every seat colour reads at 4.5:1 as text on the chrome bars', () => {
	for (const seat of [1, 2, 3, 4, 5]) {
		const ratio = contrast(
			rgb(`var(--player-${seat})`),
			rgb('var(--chrome)')
		);
		assert.ok(ratio >= 4.5, `--player-${seat} is ${ratio.toFixed(2)}:1`);
	}
});

test('no font-size token is below 10px', () => {
	for (const [name, value] of tokens) {
		if (!name.startsWith('--font-size-') || value.startsWith('clamp(')) {
			continue;
		}
		const size = Number(value.match(/^(\d+)px$/)?.[1]);
		assert.ok(size >= 10, `${name} is ${value}`);
	}
});

test('screens and components take every font size from tokens.css (#67)', () => {
	for (const [path, contents] of sources) {
		if (!/^(screens|lib[/\\]components)[/\\]/.test(path)) {
			continue;
		}
		for (const [declaration] of cssOf(path, contents).matchAll(
			/(?<![\w-])font(?:-size)?\s*:[^;]+;/g
		)) {
			assert.doesNotMatch(
				declaration,
				/\d(px|r?em|vw|vh)\b|clamp\(/,
				`${path}: ${declaration}`
			);
		}
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
		// Components also set custom properties with Svelte's style:--name directive.
		for (const [, name] of contents.matchAll(/style:(--[\w-]+)/g)) {
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

test('the progress lines and the chip fill animate a transform, not the layout (#72)', () => {
	for (const path of [
		'lib/components/board/ProgressLanes.svelte',
		'lib/components/player/PlayerChip.svelte',
	]) {
		const css = cssOf(path, read(`src/${path}`));
		for (const [, value] of css.matchAll(
			/transition(?:-property)?\s*:([^;]+);/g
		)) {
			assert.doesNotMatch(
				value,
				/(^|[\s,])(width|height|left|top)\b/,
				path
			);
		}
		assert.match(css, /transition:[^;]*\btransform\b/, path);
	}
});

test('the font tokens name Cinzel for titles and Atkinson Hyperlegible for the rest', () => {
	assert.match(tokens.get('--font-title') ?? '', /^'Cinzel', serif$/);
	assert.match(
		tokens.get('--font-body') ?? '',
		/^'Atkinson Hyperlegible', sans-serif$/
	);
});

test('base.css loads every weight the design uses from static/fonts', () => {
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

test('static/fonts holds only the chosen fonts and their licences', () => {
	assert.deepEqual(readdirSync(fontsDir).sort(), [
		'LICENSE-atkinson-hyperlegible.txt',
		'LICENSE-cinzel.txt',
		'atkinson-hyperlegible-bold.woff2',
		'atkinson-hyperlegible-regular.woff2',
		'cinzel.woff2',
	]);
	for (const licence of ['cinzel', 'atkinson-hyperlegible']) {
		assert.match(
			readFileSync(`${fontsDir}LICENSE-${licence}.txt`, 'utf8'),
			/SIL Open Font License, Version 1\.1/
		);
	}
});

test('the game page and the library preload the body and title fonts', () => {
	for (const page of ['index.html', 'components.html']) {
		const links = [...read(page).matchAll(/<link\b[^>]*>/g)].map(
			([link]) => link
		);
		for (const file of [
			'atkinson-hyperlegible-regular.woff2',
			'cinzel.woff2',
		]) {
			const link = links.find((tag) => tag.includes(`"/fonts/${file}"`));
			assert.ok(link, `${page} does not preload ${file}`);
			assert.match(link, /rel="preload"/, `${page}: ${file}`);
			assert.match(link, /as="font"/, `${page}: ${file}`);
			assert.match(link, /type="font\/woff2"/, `${page}: ${file}`);
			// Fonts are always fetched in CORS mode, so a preload without it is fetched twice.
			assert.match(link, /\bcrossorigin\b/, `${page}: ${file}`);
		}
	}
});

test('no stylesheet loads fonts or images from another site', () => {
	for (const [path, contents] of sources) {
		const css = cssOf(path, contents);
		assert.doesNotMatch(css, /@import/, path);
		assert.doesNotMatch(css, /url\(\s*['"]?(https?:)?\/\//, path);
	}
	assert.doesNotMatch(read('index.html'), /<link[^>]+href="(https?:)?\/\//);
});

test('the pixel texture token points at the texture beside tokens.css', () => {
	const url = tokens.get('--texture')?.match(/^url\('\.\/([^']+)'\)$/)?.[1];
	assert.ok(url, 'tokens.css has no --texture url');
	assert.ok(
		existsSync(
			fileURLToPath(new URL(`../src/styles/${url}`, import.meta.url))
		),
		`missing ${url}`
	);
});

test('the scrims, the floating surface and the disabled look are tokens (#97)', () => {
	for (const name of [
		'--scrim',
		'--scrim-strong',
		'--float-surface',
		'--opacity-disabled',
	]) {
		assert.ok(tokens.has(name), `${name} is declared`);
	}
});

test('no component or screen copies a scrim, the floating surface or the disabled opacity (#97)', () => {
	for (const [path, contents] of sources) {
		if (!path.endsWith('.svelte') || path.startsWith('library/')) {
			continue;
		}
		assert.doesNotMatch(
			contents,
			/var\(--ink\) (?:52|60|70)%, transparent/,
			`${path} mixes its own scrim or surface`
		);
		// The dimmer look of a blocked choice (0.3–0.35) is its own, and #116's.
		assert.doesNotMatch(
			contents,
			/disabled[^{]*\{[^}]*opacity: 0\.5;/,
			`${path} writes its own disabled opacity`
		);
	}
});

test('Button has an aria-disabled look, so no screen reaches into it (#97)', () => {
	const button = sources.find(
		([path]) => path.replaceAll('\\', '/') === 'lib/components/ui/Button.svelte'
	)?.[1];
	assert.match(String(button), /\.rg-button\[aria-disabled='true'\]/);
	for (const [path, contents] of sources) {
		assert.doesNotMatch(
			contents,
			/:global\([^)]*\[aria-disabled/,
			`${path} styles another component's aria-disabled look`
		);
	}
});

test("no screen fights Panel over its heading's font (#97)", () => {
	for (const [path, contents] of sources) {
		assert.doesNotMatch(
			contents,
			/\.(rg-[\w-]+)\.\1(?![\w-])/,
			`${path} doubles a class to win`
		);
	}
	const lobby = sources.find(
		([path]) => path === 'screens/Lobby.svelte'
	)?.[1];
	assert.doesNotMatch(String(lobby), /rg-lobby--players-title/);
});
