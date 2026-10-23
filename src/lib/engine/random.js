// Injected randomness: the Random type, a seeded generator for tests, and the shuffle.

/** @typedef {(n: number) => number} Random - A whole number from 0 to n - 1 */

/**
 * A repeatable generator (mulberry32). The same seed gives the same sequence.
 * @param {number} seed
 * @returns {Random}
 */
export function seededRandom(seed) {
	let a = seed >>> 0;
	return (n) => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * n);
	};
}

/**
 * Fisher-Yates shuffle. Returns a new list and leaves the input alone.
 * @template T
 * @param {readonly T[]} list
 * @param {Random} random
 * @returns {T[]}
 */
export function shuffle(list, random) {
	const result = [...list];
	for (let i = result.length - 1; i > 0; i--) {
		const j = random(i + 1);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
