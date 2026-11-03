// Which player tab a decision opens (#27 design §5).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { TABS, tabFor, tabsWithCounts } from '../src/lib/area/tabs.js';

test("the tabs are the mockup's seven, in order", () => {
	assert.deepEqual(
		TABS.map((t) => t.id),
		['capital', 'hand', 'income', 'eras', 'civ', 'tech', 'terrain']
	);
});

test('each decision family opens the tab that shows its things', () => {
	/** @param {string} kind @param {any[]} [answers] */
	const tab = (kind, answers = [{}]) => tabFor({ kind, answers });
	assert.equal(tab('choosePlacement', [{ row: 1, col: 2 }]), 'capital');
	assert.equal(tab('chooseSwap'), 'capital');
	assert.equal(tab('chooseCube'), 'capital');
	assert.equal(tab('chooseTapestry'), 'hand');
	assert.equal(tab('chooseKeep'), 'hand');
	assert.equal(tab('chooseDiscard'), 'hand');
	assert.equal(tab('chooseCopy'), 'eras');
	assert.equal(tab('chooseInvent'), 'tech');
	assert.equal(tab('chooseUpgrade'), 'tech');
	assert.equal(tab('chooseTechBenefit'), 'tech');
	assert.equal(tab('chooseCivAbility'), 'civ');
	assert.equal(tab('chooseAlchemists'), 'civ');
	assert.equal(tab('chooseProphecy'), 'civ');
	assert.equal(tab('chooseSlot'), 'civ');
	assert.equal(tab('chooseSpaceTile'), 'terrain');
	assert.equal(tab('chooseGift'), 'terrain');
});

test('a placement on the map, a resource choice and no decision open no tab', () => {
	assert.equal(
		tabFor({ kind: 'choosePlacement', answers: [{ hex: '0_1' }] }),
		null
	);
	assert.equal(tabFor({ kind: 'chooseResource', answers: [{}] }), null);
	assert.equal(tabFor(null), null);
});

test('the Hand and Terrain tabs show their counts, and no other tab does (#169)', () => {
	const tabs = tabsWithCounts({ hand: 4, territories: 3 });
	assert.deepEqual(
		tabs.map((t) => [t.id, t.count]),
		[
			['capital', undefined],
			['hand', 4],
			['income', undefined],
			['eras', undefined],
			['civ', undefined],
			['tech', undefined],
			['terrain', 3],
		]
	);
	assert.equal(tabsWithCounts({ hand: 0, territories: 0 })[6].count, 0);
});
