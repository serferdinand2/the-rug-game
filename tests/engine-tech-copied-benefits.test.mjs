// Tests for the tech effects that use another tech card's benefit (#144): Assembly Line, Electronics and Nanotechnology.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { DECISIONS, openDecisions, play } from '../src/lib/engine/game.js';
import { push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { techCard } from '../src/lib/engine/data/tech-cards.js';
import { startedGame, answer } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

/** @typedef {'bottom' | 'middle' | 'top'} Row */

/**
 * A track space's benefit, by the space's name.
 * @param {string} name
 * @returns {any[]}
 */
function spaceBenefit(name) {
	for (const spaces of Object.values(TRACKS)) {
		const space = spaces.find((s) => s.name === name);
		if (space) {
			return space.benefit;
		}
	}
	throw new Error(`No track space is named ${name}.`);
}

/**
 * The one `techBenefit` effect in a list of effects.
 * @param {any[]} effects
 */
function techBenefitOf(effects) {
	const found = effects.filter((e) => Object.hasOwn(e, 'techBenefit'));
	assert.equal(found.length, 1);
	return found[0];
}

/**
 * Every effect that uses another tech card's benefit in the base game, as printed (02 §4, 01 §3.4), with the row and
 * the icon it takes: the circle of a middle-row card or the square of a top-row card.
 */
const SOURCES = [
	{
		name: "Assembly Line's circle",
		effect: techBenefitOf(techCard('assembly-line').circle),
		row: 'top',
		other: 'middle',
		icon: 'square',
	},
	{
		name: "Assembly Line's square",
		effect: techBenefitOf(techCard('assembly-line').square),
		row: 'middle',
		other: 'top',
		icon: 'circle',
	},
	{
		name: 'Electronics',
		effect: techBenefitOf(spaceBenefit('Electronics')),
		row: 'middle',
		other: 'top',
		icon: 'circle',
	},
	{
		name: 'Nanotechnology',
		effect: techBenefitOf(spaceBenefit('Nanotechnology')),
		row: 'top',
		other: 'middle',
		icon: 'square',
	},
];

/**
 * A card in each row whose benefit opens a decision of its own: Ammonia's circle gains a farm to place, and The
 * Nail's square chooses a market, a house or a farm. Irrigation's circle gains 1 food and its square a farm.
 * @type {Record<'middle' | 'top', { nested: string, nestedKind: string, plain: string }>}
 */
const CARDS = {
	middle: {
		nested: 'ammonia',
		nestedKind: 'choosePlacement',
		plain: 'irrigation',
	},
	top: {
		nested: 'the-nail',
		nestedKind: 'chooseOption',
		plain: 'irrigation',
	},
};

/**
 * A started 2-player game where seat 1 holds the given tech cards and runs a list of effects. The cards leave the
 * deck and the display, so every card is still in one place.
 * @param {object[]} effects
 * @param {Partial<Record<Row, string[]>>} rows
 * @param {(state: any) => void} [fill] - Changes the state first
 */
function techGame(effects, rows, fill = () => {}, ordered = true) {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	const { tech } = state.supply;
	for (const [row, cards] of Object.entries(rows)) {
		for (const card of cards) {
			for (const list of [tech.deck, tech.faceUp, tech.discard]) {
				const at = list.indexOf(card);
				if (at !== -1) {
					list.splice(at, 1);
				}
			}
		}
		state.seats[0].tech[/** @type {Row} */ (row)] = [...cards];
	}
	fill(state);
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects, ordered },
	]);
	run(state, random);
	checkState(state);
	return { state, random };
}

/**
 * @param {any} state
 * @param {string} type
 */
const events = (state, type) => state.events.filter((e) => e.type === type);

/**
 * @param {any} state
 * @param {string} kind
 */
const opened = (state, kind) =>
	openDecisions(state).filter((d) => d.player === 1 && d.kind === kind);

/**
 * Resolves only building placement questions and leaves the test independent of the unrelated turn prompt underneath.
 * @param {any} state
 * @param {any} random
 */
function placeBuildings(state, random) {
	while (opened(state, 'choosePlacement').length > 0) {
		const [decision] = opened(state, 'choosePlacement');
		const [first] = DECISIONS.choosePlacement.answers(state, decision);
		state = play(state, 1, { decision: decision.id, ...first }, random);
	}
	return state;
}

for (const source of SOURCES) {
	const { row, other, icon, effect } = source;
	const cards = CARDS[/** @type {'middle' | 'top'} */ (row)];

	test(`${source.name} takes the ${icon} of a card in the ${row} row`, () => {
		assert.deepEqual(effect, { techBenefit: { icon } });
	});

	test(`${source.name} with no card in the ${row} row says so and asks nothing`, () => {
		// A card in the other row is never eligible.
		const { state } = techGame([effect], { [other]: [cards.plain] });
		assert.equal(events(state, 'noTechBenefit').length, 1);
		assert.equal(events(state, 'techBenefitUsed').length, 0);
		assert.equal(opened(state, 'chooseTechBenefit').length, 0);
	});

	test(`${source.name} with one card in the ${row} row takes it at once, says so and leaves it there`, () => {
		const { state } = techGame([effect], {
			[row]: [cards.nested],
			[other]: [cards.plain],
		});
		assert.equal(opened(state, 'chooseTechBenefit').length, 0);
		const used = events(state, 'techBenefitUsed');
		assert.equal(used.length, 1);
		assert.equal(used[0].player, 1);
		assert.equal(used[0].card, cards.nested);
		assert.equal(used[0].icon, icon);
		// Its benefit opened a decision of its own, and the card didn't move.
		assert.equal(opened(state, cards.nestedKind).length, 1);
		assert.deepEqual(state.seats[0].tech[row], [cards.nested]);
		assert.deepEqual(state.seats[0].tech[other], [cards.plain]);
		assert.equal(events(state, 'techUpgraded').length, 0);
	});

	test(`${source.name} with several cards in the ${row} row offers exactly them and resolves the chosen one in full`, () => {
		const { state, random } = techGame([effect], {
			[row]: [cards.plain, cards.nested],
			[other]: ['calendar'],
		});
		const [open] = opened(state, 'chooseTechBenefit');
		assert.equal(open.icon, icon);
		assert.deepEqual(DECISIONS.chooseTechBenefit.answers(state, open), [
			{ card: cards.plain },
			{ card: cards.nested },
		]);
		assert.throws(
			() =>
				play(state, 1, { decision: open.id, card: 'calendar' }, random),
			/Choose one of the cards offered\./
		);
		const next = play(
			state,
			1,
			{ decision: open.id, card: cards.nested },
			random
		);
		checkState(next);
		const used = events(next, 'techBenefitUsed');
		assert.equal(used.length, 1);
		assert.equal(used[0].card, cards.nested);
		assert.equal(used[0].icon, icon);
		// The chosen card's own decision follows, and no card moved.
		assert.equal(opened(next, cards.nestedKind).length, 1);
		assert.deepEqual(next.seats[0].tech[row], [cards.plain, cards.nested]);
		assert.deepEqual(next.seats[0].tech[other], ['calendar']);
		assert.equal(events(next, 'techUpgraded').length, 0);
	});
}

test("Assembly Line's own upgrade to the middle row takes the square of a top-row card (#144)", () => {
	const { state, random } = techGame([{ upgrade: {} }], {
		bottom: ['assembly-line'],
		middle: ['irrigation'],
		top: ['the-nail', 'calendar'],
	});
	// Irrigation can't be upgraded without science tier II, so Assembly Line is the only card to upgrade.
	assert.deepEqual(state.seats[0].tech.middle, [
		'irrigation',
		'assembly-line',
	]);
	const [open] = opened(state, 'chooseTechBenefit');
	assert.equal(open.icon, 'square');
	assert.deepEqual(open.options, ['the-nail', 'calendar']);
	let next = answer(state, random, 1, 'chooseTechBenefit', {
		card: 'the-nail',
	});
	// The Nail's square: a market, a house or a farm, then its placement.
	const [choice] = opened(next, 'chooseOption');
	assert.ok(choice);
	next = play(next, 1, { decision: choice.id, option: 2 }, random);
	assert.equal(events(next, 'buildingGained').length, 1);
	assert.equal(next.seats[0].incomeMat.buildings.farm, 4);
	assert.deepEqual(
		opened(next, 'choosePlacement').map((d) => d.building),
		['farm']
	);
	assert.deepEqual(next.seats[0].tech, {
		bottom: [],
		middle: ['irrigation', 'assembly-line'],
		top: ['the-nail', 'calendar'],
	});
	checkState(next);
});

for (const source of [
	{
		name: 'Electronics',
		row: 'middle',
		card: 'ammonia',
		icon: 'circle',
	},
	{
		name: 'Nanotechnology',
		row: 'top',
		card: 'irrigation',
		icon: 'square',
	},
]) {
	test(`${source.name} resolves a copied building benefit through its any-order effect`, () => {
		const { state, random } = techGame(
			spaceBenefit(source.name),
			{ [source.row]: [source.card] },
			undefined,
			false
		);
		const [order] = opened(state, 'chooseOrder');
		assert.ok(order);
		const next = play(state, 1, { decision: order.id, effect: 1 }, random);
		assert.equal(events(next, 'techBenefitUsed')[0].card, source.card);
		assert.equal(events(next, 'techBenefitUsed')[0].icon, source.icon);
		assert.equal(events(next, 'buildingGained').length, 1);
		assert.equal(next.seats[0].incomeMat.buildings.farm, 4);
		assert.deepEqual(
			opened(next, 'choosePlacement').map((d) => d.building),
			['farm']
		);

		const placed = placeBuildings(next, random);
		assert.equal(events(placed, 'buildingPlaced').length, 1);
		assert.deepEqual(placed.seats[0].tech[source.row], [source.card]);
		assert.equal(events(placed, 'techUpgraded').length, 0);
		checkState(placed);
	});
}

test("Assembly Line's own upgrade to the top row takes the circle of a middle-row card, never its own (R19, #144)", () => {
	const { state, random } = techGame(
		[{ upgrade: {} }],
		{ middle: ['assembly-line', 'ammonia', 'irrigation'] },
		(s) => {
			// Exploration tier III lets Assembly Line reach the top row; Ammonia and Irrigation stay put.
			s.seats[0].tracks.exploration = [7];
		}
	);
	assert.deepEqual(state.seats[0].tech.top, ['assembly-line']);
	const [open] = opened(state, 'chooseTechBenefit');
	assert.equal(open.icon, 'circle');
	assert.deepEqual(open.options, ['ammonia', 'irrigation']);
	let next = answer(state, random, 1, 'chooseTechBenefit', {
		card: 'ammonia',
	});
	assert.equal(events(next, 'buildingGained').length, 1);
	assert.equal(next.seats[0].incomeMat.buildings.farm, 4);
	assert.deepEqual(
		opened(next, 'choosePlacement').map((d) => d.building),
		['farm']
	);
	next = placeBuildings(next, random);
	assert.equal(events(next, 'buildingPlaced').length, 1);
	assert.deepEqual(next.seats[0].tech, {
		bottom: [],
		middle: ['ammonia', 'irrigation'],
		top: ['assembly-line'],
	});
	checkState(next);
});

test("Assembly Line's circle can repeat the square building benefit of a top-row card", () => {
	const { state, random } = techGame([{ upgrade: {} }], {
		bottom: ['assembly-line'],
		top: ['irrigation'],
	});
	assert.deepEqual(state.seats[0].tech, {
		bottom: [],
		middle: ['assembly-line'],
		top: ['irrigation'],
	});
	assert.deepEqual(
		events(state, 'techBenefitUsed').map((e) => [e.card, e.icon]),
		[['irrigation', 'square']]
	);
	assert.equal(events(state, 'buildingGained').length, 1);
	assert.equal(state.seats[0].incomeMat.buildings.farm, 4);
	assert.deepEqual(
		opened(state, 'choosePlacement').map((d) => d.building),
		['farm']
	);
	const placed = placeBuildings(state, random);
	assert.equal(events(placed, 'buildingPlaced').length, 1);
	assert.deepEqual(placed.seats[0].tech.top, ['irrigation']);
	checkState(placed);
});

test("copying a card's building benefit again works while that building remains on its income mat", () => {
	// Ammonia already gained its first Farm when it entered the middle row. Its copied circle is a second activation.
	let { state, random } = techGame([{ upgrade: {} }], {
		bottom: ['ammonia'],
	});
	state = placeBuildings(state, random);
	assert.equal(state.seats[0].incomeMat.buildings.farm, 4);
	assert.equal(events(state, 'buildingGained').length, 1);
	assert.deepEqual(state.seats[0].tech.middle, ['ammonia']);
	checkState(state);

	push(state, state.pending, [
		{
			player: 1,
			kind: 'effects',
			effects: [{ techBenefit: { icon: 'circle' } }],
		},
	]);
	run(state, random);
	assert.equal(state.seats[0].incomeMat.buildings.farm, 3);
	assert.equal(events(state, 'buildingGained').length, 2);
	assert.equal(events(state, 'noBuildingLeft').length, 0);
	assert.deepEqual(
		opened(state, 'choosePlacement').map((d) => d.building),
		['farm']
	);

	state = placeBuildings(state, random);
	assert.equal(events(state, 'buildingPlaced').length, 2);
	assert.deepEqual(state.seats[0].tech.middle, ['ammonia']);
	assert.equal(events(state, 'techUpgraded').length, 1);
	checkState(state);
});

test('copying a building benefit with no matching building left reports exhausted supply', () => {
	const { state: pending, random } = techGame(
		Array.from({ length: 5 }, () => ({ building: 'farm' })),
		{ middle: ['ammonia'] }
	);
	let state = placeBuildings(pending, random);
	assert.equal(state.seats[0].incomeMat.buildings.farm, 0);
	assert.equal(events(state, 'buildingGained').length, 5);
	checkState(state);

	push(state, state.pending, [
		{
			player: 1,
			kind: 'effects',
			effects: [{ techBenefit: { icon: 'circle' } }],
		},
	]);
	run(state, random);
	assert.equal(events(state, 'techBenefitUsed').length, 1);
	assert.equal(events(state, 'noBuildingLeft').length, 1);
	assert.equal(events(state, 'noBuildingLeft')[0].building, 'farm');
	assert.equal(events(state, 'buildingGained').length, 5);
	assert.equal(opened(state, 'choosePlacement').length, 0);
	assert.deepEqual(state.seats[0].tech.middle, ['ammonia']);
	checkState(state);
});

test('copied non-building circle and square benefits still resolve their effects', () => {
	const { state: middle } = techGame([{ techBenefit: { icon: 'circle' } }], {
		middle: ['irrigation'],
	});
	assert.equal(middle.seats[0].resources.food, 1);
	assert.deepEqual(middle.seats[0].tech.middle, ['irrigation']);
	assert.equal(events(middle, 'techUpgraded').length, 0);
	checkState(middle);

	const { state: top } = techGame([{ techBenefit: { icon: 'square' } }], {
		top: ['calendar'],
	});
	assert.equal(top.seats[0].vp, 7);
	assert.deepEqual(top.seats[0].tech.top, ['calendar']);
	assert.equal(events(top, 'techUpgraded').length, 0);
	checkState(top);
});
