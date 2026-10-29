// The browser's fallbacks (#100): storage that a private window or an iframe may refuse, and the random source.

/**
 * The browser's storage, or one that forgets, where a private window refuses it.
 * @param {() => Storage} get - Reads the storage, such as `() => sessionStorage`; it may throw
 * @returns {import('./api.js').SessionStore}
 */
export function safeStorage(get) {
	try {
		const store = get();
		store.getItem('rg-check');
		return store;
	} catch {
		/** @type {Map<string, string>} */
		const items = new Map();
		return {
			getItem: (key) => items.get(key) ?? null,
			setItem: (key, value) => {
				items.set(key, value);
			},
			removeItem: (key) => {
				items.delete(key);
			},
		};
	}
}

/**
 * The store's random source, from the browser's crypto.
 * @param {number} n
 * @returns {number} A whole number from 0 to n − 1
 */
export function randomInt(n) {
	return crypto.getRandomValues(new Uint32Array(1))[0] % n;
}
