// The client's English helpers (#123): lists, articles, title case, amounts with their plurals and places.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	AMOUNT_ORDER,
	amountWords,
	article,
	capitalize,
	countWords,
	joinList,
	nounOf,
	ordinal,
	signed,
	titleOf,
	wordsOf,
} from '../src/lib/words.js';

test('a list reads as English, joined by and or or', () => {
	assert.equal(joinList([]), '');
	assert.equal(joinList(['Ana']), 'Ana');
	assert.equal(joinList(['Ana', 'Bo']), 'Ana and Bo');
	assert.equal(joinList(['Ana', 'Bo', 'Cy']), 'Ana, Bo and Cy');
	assert.equal(
		joinList(['Science', 'Technology'], 'or'),
		'Science or Technology'
	);
});

test('a name takes a or an', () => {
	assert.equal(article('Farm'), 'a');
	assert.equal(article('Armory'), 'an');
	assert.equal(article('outpost'), 'an');
});

test('a text starts with a capital, and the rest stays as it is', () => {
	assert.equal(capitalize('hex 2,−1'), 'Hex 2,−1');
	assert.equal(capitalize('TV Station'), 'TV Station');
	assert.equal(capitalize(''), '');
});

test('a negative number takes a true minus sign', () => {
	assert.equal(signed(-1), '−1');
	assert.equal(signed(0), '0');
	assert.equal(signed(3), '3');
});

test('an id reads as words, and as a title with its small words kept small', () => {
	assert.equal(wordsOf('the-chosen'), 'the chosen');
	assert.equal(wordsOf('theChosen'), 'the chosen');
	assert.equal(titleOf('age-of-sail'), 'Age of Sail');
	assert.equal(titleOf('the-chosen'), 'The Chosen');
	assert.equal(titleOf('market'), 'Market');
});

test('an amount takes its plural, and "any" reads as resources of your choice (#124)', () => {
	assert.equal(amountWords('coin', 1), '1 coin');
	assert.equal(amountWords('coin', 2), '2 coins');
	assert.equal(amountWords('worker', 3), '3 workers');
	assert.equal(amountWords('food', 2), '2 food');
	assert.equal(amountWords('culture', 2), '2 culture');
	assert.equal(amountWords('any', 1), '1 resource of your choice');
	assert.equal(amountWords('any', 2), '2 resources of your choice');
	assert.equal(amountWords('vp', 5), '5 VP');
	assert.equal(amountWords('territory', 2), '2 territory tiles');
	assert.equal(amountWords('tech', 1), '1 tech card');
});

test('a counted thing has a noun for one and for many', () => {
	assert.equal(nounOf('coin', 1), 'coin');
	assert.equal(nounOf('coin', 2), 'coins');
	assert.equal(nounOf('food', 2), 'food');
	assert.equal(nounOf('tapestry', 3), 'tapestry cards');
	assert.equal(nounOf('any', 1), 'resource of your choice');
});

test('amounts are listed resources first, then VP, then tiles and cards', () => {
	assert.deepEqual(AMOUNT_ORDER, [
		'coin',
		'food',
		'worker',
		'culture',
		'any',
		'vp',
		'territory',
		'space',
		'tapestry',
		'tech',
	]);
});

test('a count of any noun takes an s, or the plural given', () => {
	assert.equal(countWords(1, 'outpost'), '1 outpost');
	assert.equal(countWords(2, 'toppled outpost'), '2 toppled outposts');
	assert.equal(countWords(0, 'territory', 'territories'), '0 territories');
	assert.equal(countWords(1, 'territory', 'territories'), '1 territory');
});

test('ordinals read as places', () => {
	assert.deepEqual([1, 2, 3, 4, 5, 11, 12, 13, 21, 22, 23].map(ordinal), [
		'1st',
		'2nd',
		'3rd',
		'4th',
		'5th',
		'11th',
		'12th',
		'13th',
		'21st',
		'22nd',
		'23rd',
	]);
});
