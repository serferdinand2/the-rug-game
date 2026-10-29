// Tests for the painting code the game shares with the art toolkit (#134): where it lives and what it may import.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PAINT = new URL('../src/lib/art/paint/', import.meta.url).pathname;

/** Every module under src/lib/art/paint/, as paths relative to it. */
function paintModules(dir = PAINT, prefix = '') {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
		entry.isDirectory()
			? paintModules(join(dir, entry.name), `${prefix}${entry.name}/`)
			: entry.name.endsWith('.js')
				? [`${prefix}${entry.name}`]
				: []
	);
}

test('the painting code imports nothing from the toolkit, the DOM or Svelte', () => {
	const modules = paintModules();
	assert.ok(modules.includes('painter.js'));
	for (const name of modules) {
		const source = readFileSync(join(PAINT, name), 'utf8');
		const imports = [...source.matchAll(/from '([^']+)'/g)].map(
			(m) => m[1]
		);
		for (const path of imports) {
			assert.ok(path.startsWith('.'), `${name} imports ${path}`);
			assert.ok(!path.includes('tools/'), `${name} imports ${path}`);
		}
		assert.doesNotMatch(source, /\b(document|window)\./, name);
	}
});

test('the toolkit re-exports the painter and the palette from their new home', async () => {
	const tools = await import('../tools/art/painter.js');
	const lib = await import('../src/lib/art/paint/painter.js');
	assert.equal(tools.toSvg, lib.toSvg);
	const toolsPalette = await import('../tools/art/palette.js');
	const libPalette = await import('../src/lib/art/paint/palette.js');
	assert.equal(toolsPalette.PALETTE, libPalette.PALETTE);
});
