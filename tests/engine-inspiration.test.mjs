// Inspiration tiles (#35 part 2): placing them, and the improved spaces 2, 4 and 6 of an inspired income row (03 §2.8).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { INCOME_MAT, INSPIRED_MAT } from '../src/lib/engine/data/income-mat.js';
import { BUILDING_IDS } from '../src/lib/engine/data/ids.js';
import { INCOME_STEP_KINDS } from '../src/lib/engine/income.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { meetsRequirement } from '../src/lib/engine/tech.js';
import { techCard } from '../src/lib/engine/data/tech-cards.js';
import { countVp } from '../src/lib/engine/effects/vp.js';
import { readyTurn, startedGame } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';
import { AA, kinds, ontoArts, place, reply } from './helpers/arts.mjs';

/** The improved spaces of each inspired row, as 03 §2.8 lists them: space 2, 4 and 6. */
const IMPROVED = {
	market: [
		[[{ gain: { coin: 1 } }], [{ vp: 2 }]],
		[[{ gain: { coin: 1 } }], [{ vp: { per: 'territory' } }]],
		[[], [{ vp: 15 }]],
	],
	house: [
		[[{ gain: { worker: 1 } }], [{ vp: 2 }]],
		[[{ gain: { worker: 1 } }], [{ vp: { per: 'territoryTile' } }]],
		[[], [{ vp: 15 }]],
	],
	farm: [
		[[{ gain: { food: 1 } }], [{ vp: 2 }]],
		[[{ gain: { food: 1 } }], [{ vp: { per: 'techCard' } }]],
		[[], [{ vp: 15 }]],
	],
	armory: [
		[[{ gain: { culture: 1 } }], [{ vp: 2 }]],
		[[{ gain: { culture: 1 } }], [{ vp: { per: 'house' } }]],
		[[], [{ vp: 15 }]],
	],
};

test('an inspiration tile improves spaces 2, 4 and 6 of its row, and keeps every name and prerequisite', () => {
	for (const row of BUILDING_IDS) {
		INSPIRED_MAT[row].forEach((space, index) => {
			const base = INCOME_MAT[row][index];
			assert.equal(space.id, base.id);
			assert.equal(space.name, base.name);
			assert.equal(space.prerequisite, base.prerequisite);
			const improved = [1, 3, 5].indexOf(index);
			if (improved < 0) {
				assert.deepEqual(space, base, `${row} ${index + 1}`);
				return;
			}
			const [income, score] = IMPROVED[row][improved];
			assert.deepEqual(space.income, income, `${row} ${index + 1}`);
			assert.deepEqual(space.score, score, `${row} ${index + 1}`);
			assert.equal(space.inspired, true);
		});
	}
});

test('R54: inspired Telephone gives a worker and scores 1 VP per territory tile in your supply', () => {
	const telephone = INSPIRED_MAT.house[3];
	assert.equal(telephone.name, 'Telephone');
	assert.deepEqual(telephone.income, [{ gain: { worker: 1 } }]);
	assert.deepEqual(telephone.score, [{ vp: { per: 'territoryTile' } }]);
});

test("Symphony inspires a row of the player's choice, and its bonus pays any 1 resource to create", () => {
	const r = ontoArts(5);
	const ask = openDecisions(r.state).find((d) => d.kind === 'chooseInspire');
	assert.ok(ask);
	assert.deepEqual(ask.options, BUILDING_IDS);
	reply(r, 'chooseInspire', { row: 'market' });
	assert.deepEqual(r.seat.inspired, ['market']);
	assert.deepEqual(kinds(r), ['chooseBonus']);
	reply(r, 'chooseBonus', { pay: { food: 1 } });
	reply(r, 'chooseCreate', { card: 'deck' });
	assert.equal(r.seat.masterpieces.length, 1);
	checkState(r.state);
});

test('CGI Animation inspires, and its bonus gains an income building', () => {
	const r = ontoArts(8, (seat) => {
		seat.inspired = ['market', 'house'];
	});
	reply(r, 'chooseInspire', { row: 'armory' });
	assert.deepEqual(r.seat.inspired, ['market', 'house', 'armory']);
	reply(r, 'chooseBonus', { pay: { food: 1 } });
	reply(r, 'chooseOption', { option: 2 });
	place(r);
	assert.equal(r.seat.incomeMat.buildings.farm, 4);
});

test('the last tile is placed without asking, and with none left Inspire does nothing', () => {
	const ready = readyTurn(
		2,
		(seat) => {
			seat.inspired = ['market', 'house', 'armory'];
		},
		AA
	);
	const last = resolveEffects(
		ready.state,
		ready.player,
		[{ inspire: {} }],
		ready.random
	);
	assert.deepEqual(last.seats[ready.player - 1].inspired, [
		'market',
		'house',
		'armory',
		'farm',
	]);
	const seq = last.seq;
	const none = resolveEffects(
		last,
		ready.player,
		[{ inspire: {} }],
		ready.random
	);
	assert.ok(
		none.events.some(
			(/** @type {any} */ e) => e.type === 'noInspire' && e.seq > seq
		)
	);
	assert.ok(!openDecisions(none).some((d) => d.kind === 'chooseInspire'));
});

/**
 * Runs one income step of income turn 3 for seat 1 of an A&A game, after `fill` stages the seat.
 * @param {'score' | 'income'} step
 * @param {(seat: any, state: any) => void} fill
 * @returns {{ state: any, seat: any }} The state and seat 1 afterwards
 */
function afterStep(step, fill) {
	const { state: started, random } = startedGame(2, AA);
	const state = structuredClone(started);
	state.pending.length = 0;
	const seat = /** @type {any} */ (state.seats[0]);
	seat.resources = { coin: 0, worker: 0, food: 0, culture: 0 };
	seat.vp = 0;
	seat.vpSources = {};
	fill(seat, state);
	INCOME_STEP_KINDS[step].run(contextFor(state, random, state.pending), 1, 3);
	run(state, random);
	return { state, seat: state.seats[0] };
}

/** What each row's space 4 counts when inspired. */
const COUNTED = /** @type {const} */ ({
	market: 'territory',
	house: 'territoryTile',
	farm: 'techCard',
	armory: 'house',
});

/**
 * Stages seat 1: 2 territory tiles, 1 tech card, 2 houses taken, and `left` buildings in `row`.
 * @param {import('../src/lib/engine/data/ids.js').BuildingId} row
 * @param {number} left
 * @param {boolean} inspired
 * @returns {(seat: any, state: any) => void}
 */
function staged(row, left, inspired) {
	return (seat, state) => {
		seat.territoryTiles = state.supply.territory.splice(0, 2);
		seat.tech.bottom = state.supply.tech.deck.splice(0, 1);
		seat.incomeMat.buildings.house = 3;
		seat.incomeMat.buildings[row] = left;
		if (inspired) {
			seat.inspired = [row];
		}
	};
}

for (const row of BUILDING_IDS) {
	test(`an inspired ${row} row scores its improved spaces in the score step, and pays the same income`, () => {
		// Spaces 2 and 4 uncovered: 2 VP, and 1 VP per thing its space 4 counts.
		const plain = afterStep('score', staged(row, 2, false));
		const lifted = afterStep('score', staged(row, 2, true));
		const counted = countVp(lifted.state, 1, COUNTED[row]);
		assert.ok(counted > 0, `${row}: something to count`);
		assert.equal(lifted.seat.vp - plain.seat.vp, 2 + counted, row);
		// Space 6 uncovered too: 15 VP instead of 10.
		const plainAll = afterStep('score', staged(row, 0, false));
		const liftedAll = afterStep('score', staged(row, 0, true));
		assert.equal(
			liftedAll.seat.vp - plainAll.seat.vp,
			2 + countVp(liftedAll.state, 1, COUNTED[row]) + 5,
			row
		);
		// The income step pays exactly what the plain row pays, and no VP.
		const paid = afterStep('income', staged(row, 2, true));
		assert.deepEqual(
			paid.seat.resources,
			afterStep('income', staged(row, 2, false)).seat.resources
		);
		assert.equal(paid.seat.vp, 0);
	});
}

test('R18: an inspired row keeps its prerequisites', () => {
	const { state: started } = startedGame(2, AA);
	const state = structuredClone(started);
	const seat = /** @type {any} */ (state.seats[0]);
	const treasury = techCard('treasury');
	seat.incomeMat.buildings.market = 4;
	const plain = meetsRequirement(state, 1, treasury);
	seat.inspired = ['market'];
	assert.equal(meetsRequirement(state, 1, treasury), plain);
	assert.equal(plain, true, 'Currency is uncovered');
});
