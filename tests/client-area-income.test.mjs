// The player area's income mat and era slots (#27): rows and slots from a seat in the game view.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { exposedSpaces, view } from '../src/lib/engine/game.js';
import { eraSlots, incomeRows } from '../src/lib/area/income.js';
import { startedGame } from './helpers/engine.mjs';

/** @param {any} state @returns {any} */
function mine(state) {
	return view(state, 1).seats[0];
}

test('a dealt seat has every space covered but the first of each row', () => {
	const { state } = startedGame(2);
	const rows = incomeRows(mine(state));
	assert.deepEqual(
		rows.map((r) => r.building),
		['market', 'house', 'farm', 'armory']
	);
	for (const row of rows) {
		assert.equal(row.spaces.length, 6);
		assert.deepEqual(
			row.spaces.map((s) => s.covered),
			[false, true, true, true, true, true]
		);
	}
	assert.equal(rows[0].spaces[0].name, 'Barter');
	assert.match(rows[0].spaces[0].reward, /Income: Gain 1 coin/);
	assert.match(rows[0].spaces[0].reward, /Score: .*tech card/);
});

test('each row is named by its buildings, and each space has its label (#125)', () => {
	const { state } = startedGame(2);
	/** @type {any} */ (state.seats[0]).incomeMat.buildings.armory = 4;
	const rows = incomeRows(mine(state));
	assert.deepEqual(
		rows.map((r) => r.name),
		['Markets', 'Houses', 'Farms', 'Armories']
	);
	const [barter, second] = rows[0].spaces;
	assert.equal(barter.label, `Barter. ${barter.reward}`);
	assert.equal(second.label, `${second.name}, covered by a market`);
	assert.equal(
		rows[3].spaces[2].label,
		`${rows[3].spaces[2].name}, covered by an armory`
	);
});

test('removing two markets exposes three spaces, and the others stay', () => {
	const { state } = startedGame(2);
	/** @type {any} */ (state.seats[0]).incomeMat.buildings.market = 3;
	const rows = incomeRows(mine(state));
	assert.deepEqual(
		rows[0].spaces.map((s) => s.covered),
		[false, false, false, true, true, true]
	);
	assert.equal(rows[0].left, 3);
	assert.equal(rows[1].spaces.filter((s) => !s.covered).length, 1);
});

test("the uncovered spaces are the engine's exposed spaces, for every count left (#128)", () => {
	const { state } = startedGame(2);
	for (let left = 0; left <= 5; left++) {
		const seat = /** @type {any} */ (state.seats[0]);
		seat.incomeMat.buildings = {
			market: left,
			house: left,
			farm: left,
			armory: left,
		};
		const shown = mine(state);
		for (const row of incomeRows(shown)) {
			assert.deepEqual(
				row.spaces.filter((s) => !s.covered).map((s) => s.name),
				exposedSpaces(shown, row.building).map((s) => s.name),
				`${row.building} with ${left} left`
			);
		}
	}
});

test('a space with no income or score has an empty reward part, not "Nothing"', () => {
	const { state } = startedGame(2);
	const rows = incomeRows(mine(state));
	assert.equal(rows[0].spaces[1].reward, 'Income: Gain 1 coin');
	assert.equal(rows[0].spaces[5].reward, 'Score: Gain 10 VP');
});

test('era 1 is Maker of Fire and empty slots have no card', () => {
	const { state } = startedGame(2);
	const slots = eraSlots(mine(state));
	assert.equal(slots.length, 4);
	assert.equal(slots[0].card, 'Maker of Fire');
	assert.equal(slots[0].active, false);
	for (const slot of slots.slice(1)) {
		assert.equal(slot.card, null);
		assert.equal(slot.faceDown, false);
		assert.equal(slot.active, false);
	}
});

test('each era slot has its heading and text (#125)', () => {
	const { state } = startedGame(2);
	const seat = /** @type {any} */ (state.seats[0]);
	seat.incomeMat.tapestry[1] = ['capitalism'];
	seat.incomeMat.tapestry[2] = ['trap-1'];
	seat.incomeMat.faceDown = ['trap-1'];
	seat.era = { card: 'capitalism', ability: {} };
	const slots = eraSlots(mine(state));
	assert.deepEqual(
		slots.map((s) => s.heading),
		['Era I', 'Era II · Active', 'Era III', 'Era IV']
	);
	assert.deepEqual(
		slots.map((s) => s.text),
		['Maker of Fire', 'Capitalism', 'Face-down card', 'Not yet chosen']
	);
});

test('a face-down card reads face down, and the active era is marked', () => {
	const { state } = startedGame(2);
	const seat = /** @type {any} */ (state.seats[0]);
	seat.incomeMat.tapestry[1] = ['age-of-discovery'];
	seat.incomeMat.tapestry[2] = ['capitalism'];
	seat.incomeMat.tapestry[3] = ['trap-1'];
	seat.incomeMat.faceDown = ['trap-1'];
	seat.era = { card: 'capitalism', ability: {} };
	const slots = eraSlots(mine(state));
	assert.equal(slots[1].card, 'Age of Discovery');
	assert.equal(slots[1].active, false);
	assert.equal(slots[2].card, 'Capitalism');
	assert.equal(slots[2].active, true);
	assert.equal(slots[3].card, null);
	assert.equal(slots[3].faceDown, true);
});

test('a card the Heralds play on Maker of Fire shows on era 1, and may be the active one (R35)', () => {
	const { state } = startedGame(2);
	const seat = /** @type {any} */ (state.seats[0]);
	seat.incomeMat.tapestry[0] = ['capitalism'];
	seat.era = { card: 'capitalism', ability: {} };
	const slots = eraSlots(mine(state));
	assert.equal(slots[0].card, 'Capitalism');
	assert.equal(slots[0].id, 'capitalism');
	assert.equal(slots[0].active, true);
});
