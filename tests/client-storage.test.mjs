// The browser fallbacks (#100): storage that a private window or an iframe refuses, and the random source.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	forgetfulStorage,
	randomInt,
	safeStorage,
} from '../src/lib/storage.js';

/** A storage kept in a Map, as a browser's would be. */
function working() {
	/** @type {Map<string, string>} */
	const items = new Map();
	return {
		getItem: (/** @type {string} */ key) => items.get(key) ?? null,
		setItem: (/** @type {string} */ key, /** @type {string} */ value) => {
			items.set(key, value);
		},
		removeItem: (/** @type {string} */ key) => {
			items.delete(key);
		},
	};
}

test('safeStorage hands back the browser storage when it can be read', () => {
	const store = working();
	assert.equal(
		safeStorage(() => /** @type {any} */ (store)),
		store
	);
});

test('safeStorage falls back to a storage that forgets when the getter throws', () => {
	const store = safeStorage(() => {
		throw new Error('SecurityError');
	});
	assert.equal(store.getItem('rg-seat'), null);
	store.setItem('rg-seat', '2');
	assert.equal(store.getItem('rg-seat'), '2');
	store.removeItem('rg-seat');
	assert.equal(store.getItem('rg-seat'), null);
});

test('safeStorage falls back when reading the storage throws', () => {
	const refusing = {
		...working(),
		getItem: () => {
			throw new Error('SecurityError');
		},
	};
	const store = safeStorage(() => /** @type {any} */ (refusing));
	assert.notEqual(store, refusing);
	store.setItem('rg-sound', 'off');
	assert.equal(store.getItem('rg-sound'), 'off');
});

test('two fallbacks keep their own items', () => {
	const refuse = () => {
		throw new Error('SecurityError');
	};
	const one = safeStorage(refuse);
	const two = safeStorage(refuse);
	one.setItem('rg-seat', '1');
	assert.equal(two.getItem('rg-seat'), null);
});

test('randomInt gives whole numbers from 0 to n − 1', () => {
	const seen = new Set();
	for (let i = 0; i < 600; i++) {
		const n = randomInt(6);
		assert.ok(Number.isInteger(n) && n >= 0 && n < 6, `${n}`);
		seen.add(n);
	}
	assert.equal(seen.size, 6);
	assert.equal(randomInt(1), 0);
});

test('forgetfulStorage keeps items for as long as the page lives, each its own (#88)', () => {
	const one = forgetfulStorage();
	const two = forgetfulStorage();
	assert.equal(one.getItem('rg-first-income:abc:1'), null);
	one.setItem('rg-first-income:abc:1', '1');
	assert.equal(one.getItem('rg-first-income:abc:1'), '1');
	assert.equal(two.getItem('rg-first-income:abc:1'), null);
	one.removeItem('rg-first-income:abc:1');
	assert.equal(one.getItem('rg-first-income:abc:1'), null);
});
