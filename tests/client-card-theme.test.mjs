// The card theme (owner, 2026-11-02): light paper or dark cards, switched in the header menu and remembered in this browser.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	CARD_THEME,
	darkCardsSaved,
	saveDarkCards,
} from '../src/lib/card-theme.js';
import { forgetfulStorage } from '../src/lib/storage.js';

test('cards are light paper until the player chooses dark cards', () => {
	assert.equal(darkCardsSaved(forgetfulStorage()), false);
});

test('the choice is remembered as dark or light under rg-cards', () => {
	const prefs = forgetfulStorage();
	assert.equal(CARD_THEME, 'rg-cards');
	saveDarkCards(prefs, true);
	assert.equal(prefs.getItem('rg-cards'), 'dark');
	assert.equal(darkCardsSaved(prefs), true);
	saveDarkCards(prefs, false);
	assert.equal(prefs.getItem('rg-cards'), 'light');
	assert.equal(darkCardsSaved(prefs), false);
});

test('a browser that refuses to keep the choice still switches for this visit', () => {
	const prefs = {
		getItem: () => null,
		setItem: () => {
			throw new Error('QuotaExceededError');
		},
		removeItem: () => {},
	};
	assert.doesNotThrow(() => saveDarkCards(prefs, true));
});
