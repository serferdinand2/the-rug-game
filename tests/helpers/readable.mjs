// A check that words are a sentence a player can read, shared by the words tests (#126).
import assert from 'node:assert/strict';

/**
 * Checks that a description is a sentence a player can read: never empty, and no JSON or missing value shows through.
 * @param {unknown} text
 * @param {string} what - Named in the failure
 */
export function assertReadable(text, what) {
	assert.equal(typeof text, 'string', `${what} is not a string`);
	const words = /** @type {string} */ (text);
	assert.ok(words.trim().length > 0, `${what} is empty`);
	for (const bad of ['undefined', 'null', 'NaN', '[object', '{', '}', '"']) {
		assert.ok(!words.includes(bad), `${what} reads "${words}"`);
	}
	assert.equal(words, words.trim(), `${what} has stray spaces: "${words}"`);
	assert.ok(!words.includes('  '), `${what} has a double space: "${words}"`);
	assert.match(
		words,
		/^[A-Z0-9]/,
		`${what} starts in lower case: "${words}"`
	);
}
