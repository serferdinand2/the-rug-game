// What is open over the game screen (#88): the rules for opening a layer, and the one layer each Escape closes.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	NO_LAYERS,
	closeLayer,
	escapeLayer,
	openLayer,
} from '../src/lib/layers.js';

/** @typedef {import('../src/lib/layers.js').Layers} Layers */
/** @typedef {import('../src/lib/layers.js').Layer} Layer */

/** Every way to open something, as the screen does. */
const OPENERS = /** @type {[Layer, { player?: number | null }][]} */ ([
	['rules', {}],
	['settings', {}],
	['overview', { player: null }],
	['overview', { player: 2 }],
	['log', {}],
	['income', {}],
	['track', {}],
]);

/**
 * How many things are open: each layer, and the notice when it shows.
 * @param {Layers} layers
 * @param {boolean} notice
 */
function openCount(layers, notice) {
	return (
		Number(layers.rules) +
		Number(layers.settings) +
		Number(layers.overview) +
		Number(layers.log) +
		Number(layers.question !== null) +
		Number(notice)
	);
}

/** Every combination the screen can reach by opening layers in any order. */
function reachable() {
	const seen = new Map([[JSON.stringify(NO_LAYERS), NO_LAYERS]]);
	const queue = [NO_LAYERS];
	while (queue.length > 0) {
		const layers = /** @type {Layers} */ (queue.shift());
		for (const [layer, options] of OPENERS) {
			const next = openLayer(layers, layer, options);
			const key = JSON.stringify(next);
			if (!seen.has(key)) {
				seen.set(key, next);
				queue.push(next);
			}
		}
	}
	return [...seen.values()];
}

test('How to play, Table settings and the overview each open alone', () => {
	const busy = openLayer(openLayer(NO_LAYERS, 'income'), 'log');
	assert.deepEqual(openLayer(busy, 'rules'), { ...NO_LAYERS, rules: true });
	assert.deepEqual(openLayer(busy, 'settings'), {
		...NO_LAYERS,
		settings: true,
	});
	assert.deepEqual(openLayer(busy, 'overview', { player: 3 }), {
		...NO_LAYERS,
		overview: true,
		player: 3,
	});
});

test('the log closes the overview and leaves the question under it', () => {
	const asked = openLayer(NO_LAYERS, 'track');
	assert.deepEqual(openLayer(asked, 'log'), {
		...NO_LAYERS,
		question: 'track',
		log: true,
	});
	const looking = openLayer(NO_LAYERS, 'overview', { player: 1 });
	assert.deepEqual(openLayer(looking, 'log'), { ...NO_LAYERS, log: true });
});

test('a question closes the overview, whose close bar would hide it, and replaces the other question', () => {
	const looking = openLayer(NO_LAYERS, 'overview', { player: 1 });
	assert.deepEqual(openLayer(looking, 'income'), {
		...NO_LAYERS,
		question: 'income',
	});
	const asked = openLayer(NO_LAYERS, 'income');
	assert.equal(openLayer(asked, 'track').question, 'track');
});

test('closing a layer closes it alone, and the overview forgets its player', () => {
	const open = openLayer(openLayer(NO_LAYERS, 'income'), 'log');
	assert.deepEqual(closeLayer(open, 'log'), {
		...NO_LAYERS,
		question: 'income',
	});
	assert.deepEqual(closeLayer(open, 'income'), { ...NO_LAYERS, log: true });
	assert.deepEqual(closeLayer(open, 'track'), open);
	const looking = openLayer(NO_LAYERS, 'overview', { player: 4 });
	assert.deepEqual(closeLayer(looking, 'overview'), NO_LAYERS);
});

test('I, L and Esc close the log and keep the question; Esc again closes the question (#88)', () => {
	let layers = openLayer(NO_LAYERS, 'income');
	layers = openLayer(layers, 'log');
	assert.equal(escapeLayer(layers, false), 'log');
	layers = closeLayer(layers, 'log');
	assert.equal(escapeLayer(layers, false), 'income');
	layers = closeLayer(layers, 'income');
	assert.equal(escapeLayer(layers, false), null);
});

test('Escape closes the layer on top: How to play, the settings, the overview, the log, the question, then the notice', () => {
	assert.equal(escapeLayer({ ...NO_LAYERS, rules: true }, true), 'rules');
	assert.equal(
		escapeLayer({ ...NO_LAYERS, settings: true, log: true }, true),
		'settings'
	);
	assert.equal(
		escapeLayer({ ...NO_LAYERS, overview: true }, true),
		'overview'
	);
	assert.equal(
		escapeLayer({ ...NO_LAYERS, log: true, question: 'track' }, true),
		'log'
	);
	assert.equal(
		escapeLayer({ ...NO_LAYERS, question: 'track' }, true),
		'track'
	);
	assert.equal(escapeLayer(NO_LAYERS, true), 'notice');
	assert.equal(escapeLayer(NO_LAYERS, false), null);
});

test('in every combination the screen can reach, each Escape closes exactly one thing', () => {
	const combinations = reachable();
	assert.ok(combinations.length >= 8, `only ${combinations.length} reached`);
	for (const start of combinations) {
		for (const notice of [false, true]) {
			let layers = start;
			let shown = notice;
			let open = openCount(layers, shown);
			for (let press = 0; open > 0; press++) {
				assert.ok(
					press < 7,
					`Escape never empties ${JSON.stringify(start)}`
				);
				const layer = escapeLayer(layers, shown);
				assert.notEqual(
					layer,
					null,
					`nothing closes ${JSON.stringify(layers)}`
				);
				if (layer === 'notice') {
					shown = false;
				} else {
					layers = closeLayer(layers, /** @type {Layer} */ (layer));
				}
				const now = openCount(layers, shown);
				assert.equal(now, open - 1, `${layer} closed more than itself`);
				open = now;
			}
			assert.equal(escapeLayer(layers, shown), null);
		}
	}
});
