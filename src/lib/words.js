// The client's English helpers (#123): lists, articles, title case, amounts with their plurals, and places.

/** The minus sign numbers show, as in "hex 2,−1". */
const MINUS = '−';

/** Words a title keeps in lower case, unless they come first. */
const SMALL_WORDS = ['of', 'and', 'for', 'the', 'a', 'an', 'on', 'in'];

/**
 * Each counted thing's name, one and many, in the order amounts are listed: the resources as the player overview
 * lists them, then VP, then tiles and cards.
 */
const NOUNS = /** @type {Readonly<Record<string, [string, string]>>} */ ({
	coin: ['coin', 'coins'],
	food: ['food', 'food'],
	worker: ['worker', 'workers'],
	culture: ['culture', 'culture'],
	any: ['resource of your choice', 'resources of your choice'],
	vp: ['VP', 'VP'],
	territory: ['territory tile', 'territory tiles'],
	space: ['space tile', 'space tiles'],
	tapestry: ['tapestry card', 'tapestry cards'],
	tech: ['tech card', 'tech cards'],
});

/** The counted things, in the order amounts are listed. */
export const AMOUNT_ORDER = Object.freeze(Object.keys(NOUNS));

/**
 * A text with its first letter in upper case.
 * @param {string} text
 * @returns {string}
 */
export function capitalize(text) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * A list in words: "a", "a and b", "a, b and c".
 * @param {readonly string[]} items
 * @param {string} [word] - The last joining word, 'and' or 'or'
 * @returns {string}
 */
export function joinList(items, word = 'and') {
	if (items.length <= 1) {
		return items[0] ?? '';
	}
	return `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`;
}

/**
 * "a" or "an", for the name that follows.
 * @param {string} name
 * @returns {string}
 */
export function article(name) {
	return /^[aeiou]/i.test(name) ? 'an' : 'a';
}

/**
 * A whole number as shown, with a real minus sign.
 * @param {number} n
 * @returns {string}
 */
export function signed(n) {
	return n < 0 ? `${MINUS}${-n}` : String(n);
}

/**
 * An id in words: 'the-chosen' or 'theChosen' to 'the chosen'.
 * @param {string} id
 * @returns {string}
 */
export function wordsOf(id) {
	return id
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[-_]+/g, ' ')
		.toLowerCase()
		.trim();
}

/**
 * An id as a name: 'age-of-sail' to 'Age of Sail'.
 * @param {string} id
 * @returns {string}
 */
export function titleOf(id) {
	return wordsOf(id)
		.split(' ')
		.map((word, i) =>
			i > 0 && SMALL_WORDS.includes(word) ? word : capitalize(word)
		)
		.join(' ');
}

/**
 * A counted thing's noun for an amount: "coin", "coins", "food".
 * @param {string} id - A counted thing (a resource, 'any', 'vp', a tile or card kind), or any other id
 * @param {number} n
 * @returns {string}
 */
export function nounOf(id, n) {
	const [one, many] = NOUNS[id] ?? [wordsOf(id), wordsOf(id)];
	return n === 1 ? one : many;
}

/**
 * An amount of one counted thing, with its plural: "1 coin", "2 coins", "2 food", "2 resources of your choice".
 * @param {string} id - A counted thing (a resource, 'any', 'vp', a tile or card kind), or any other id
 * @param {number} n
 * @returns {string}
 */
export function amountWords(id, n) {
	return `${n} ${nounOf(id, n)}`;
}

/**
 * A name's plural: "Markets", "Armories" after a consonant and y, "Days" after a vowel and y.
 * @param {string} word
 * @returns {string}
 */
export function pluralOf(word) {
	return /[^aeiou]y$/i.test(word) ? `${word.slice(0, -1)}ies` : `${word}s`;
}

/**
 * A name's possessive: "Vera's", and "Marcus'" after a final s (#145).
 * @param {string} name
 * @returns {string}
 */
export function possessive(name) {
	return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

/**
 * A count of any noun: "1 outpost", "2 toppled outposts", "0 territories".
 * @param {number} n
 * @param {string} one
 * @param {string} [many] - The plural, when it is not `one` with an s
 * @returns {string}
 */
export function countWords(n, one, many = `${one}s`) {
	return `${n} ${n === 1 ? one : many}`;
}

/**
 * A place as a word, such as '1st' or '3rd'.
 * @param {number} place
 * @returns {string}
 */
export function ordinal(place) {
	const last = place % 10;
	const teen = place % 100 >= 11 && place % 100 <= 13;
	const suffix =
		!teen && last === 1
			? 'st'
			: !teen && last === 2
				? 'nd'
				: !teen && last === 3
					? 'rd'
					: 'th';
	return `${place}${suffix}`;
}
