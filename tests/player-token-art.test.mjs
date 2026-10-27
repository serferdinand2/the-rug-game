// Every shaded token preserves all visible RGB values and the original alpha channel.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { decodePng } from './helpers/png.mjs';
import { fromSvg } from '../tools/art/painter.js';
import { renderAsset } from '../tools/art/build.mjs';
for (const color of ['blue', 'red', 'green', 'yellow', 'purple']) {
	test(`shaded ${color} token exactly matches its supplied PNG`, async () => {
		const { width, height, pixels } = decodePng(
			await readFile(
				new URL(
					`../tools/art/imported-pngs/player-tokens/token-${color}.png`,
					import.meta.url
				)
			)
		);
		const vector = fromSvg(await renderAsset(`piece/token-${color}`));
		assert.deepEqual([width, height, vector.w, vector.h], [32, 32, 32, 32]);
		for (let i = 0; i < width * height; i++) {
			const alpha = pixels[i * 4 + 3];
			assert.ok(
				alpha === 0 || alpha === 255,
				'supplied pixels have binary alpha'
			);
			assert.equal(
				vector.p[i] === null,
				alpha === 0,
				`alpha at pixel ${i}`
			);
			if (alpha) {
				assert.equal(
					vector.p[i],
					'#' + pixels.subarray(i * 4, i * 4 + 3).toString('hex'),
					`RGB at pixel ${i}`
				);
			}
		}
		assert.ok(new Set(vector.p).size > 3, 'preserve the supplied shading');
	});
}
