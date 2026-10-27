// Tests for the income turn's steps by income turn number: abilities, upgrade, scoring, income and finishing (#15).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { buildingSpots } from '../src/lib/engine/city.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { INCOME_STEPS, INCOME_STEP_KINDS } from '../src/lib/engine/income.js';
import { startedGame, readyTurn, answer } from './helpers/engine.mjs';

/**
 * The current player of a 2-player game takes an income turn, after income turn `before`.
 * @param {number} before - Income turns already taken
 * @param {(seat: any, state: any) => void} [fill]
 */
function incomeAfter(before, fill = () => {}) {
	const ready = readyTurn(2, (seat, state) => {
		seat.incomeTurns = before;
		// The opponent has started this era already, so no first-of-neighbours bonus asks first.
		for (const other of state.seats) {
			if (other !== seat) {
				other.incomeTurns = Math.min(before + 1, 4);
			}
		}
		fill(seat, state);
	});
	const eventsBefore = ready.state.events.length;
	const state = answer(
		ready.state,
		ready.random,
		ready.player,
		'chooseTurn',
		{
			turn: 'income',
		}
	);
	return {
		state,
		player: ready.player,
		seat: state.seats[ready.player - 1],
		events: state.events.slice(eventsBefore),
	};
}

test('income turn 1 gains the income of every space 1: coin, worker, food and a territory tile, culture and a tapestry card', () => {
	const { state: started, random } = startedGame(2);
	const player = /** @type {number} */ (started.current);
	const state = answer(started, random, player, 'chooseTurn', {
		turn: 'income',
	});
	const seat = state.seats[player - 1];
	assert.equal(seat.incomeTurns, 1);
	assert.deepEqual(seat.resources, {
		coin: 1,
		worker: 1,
		food: 1,
		culture: 1,
	});
	assert.equal(seat.territoryTiles.length, 1);
	assert.equal(seat.hand.length, 1);
	assert.ok(
		state.events.some(
			(e) =>
				e.type === 'incomeTurnStarted' &&
				e.player === player &&
				e.turn === 1
		)
	);
	const other = player === 1 ? 2 : 1;
	assert.deepEqual(
		openDecisions(state).map((d) => [d.kind, d.player, d.options]),
		[['chooseTurn', other, ['income']]]
	);
});

test('on income turns 2–5 step 1 has nothing to run without a civilization, then an optional upgrade is offered', () => {
	const r = incomeAfter(1, (seat) => {
		seat.tech.bottom = ['calendar'];
	});
	// startedGame() cleared the civilizations, so step 1 has nothing to run.
	assert.ok(!r.events.some((e) => e.type === 'civAbilityUsed'));
	const [open] = openDecisions(r.state);
	assert.equal(open.kind, 'chooseUpgrade');
	assert.equal(open.player, r.player);
	assert.equal(open.optional, true);
	// Scoring waits for the upgrade; declining it carries on.
	assert.ok(!r.events.some((e) => e.type === 'capitalScored'));
	const next = answer(r.state, r.random, r.player, 'chooseUpgrade', {
		card: null,
	});
	assert.deepEqual(next.seats[r.player - 1].tech.bottom, ['calendar']);
	assert.ok(next.events.some((e) => e.type === 'capitalScored'));
});

test('income step 3 upgrades a bottom card for its circle when the player takes it', () => {
	const r = incomeAfter(1, (seat) => {
		seat.tech.bottom = ['irrigation'];
	});
	const food = r.seat.resources.food;
	const next = answer(r.state, r.random, r.player, 'chooseUpgrade', {
		card: 'irrigation',
	});
	const seat = next.seats[r.player - 1];
	assert.deepEqual(seat.tech.middle, ['irrigation']);
	assert.ok(next.events.some((e) => e.type === 'techUpgraded'));
	// Irrigation's circle gives 1 food (the income that follows adds more).
	assert.ok(seat.resources.food >= food + 1);
});

test('income turn 2 scores the exposed VP icons: Barter counts tech cards, Symbology scores the capital', () => {
	const r = incomeAfter(1, (seat) => {
		seat.tech.top = ['calendar', 'clocks', 'radio'];
		// Fill the whole first row, so Symbology has a line to score.
		for (const spot of buildingSpots(seat)) {
			if (spot.row === 0) {
				seat.capital.buildings.push({
					building: 'house',
					row: 0,
					col: spot.col,
				});
			}
		}
	});
	const scored = r.events.filter((e) => e.type === 'capitalScored');
	assert.equal(scored.length, 1);
	assert.equal(scored[0].player, r.player);
	assert.equal(scored[0].rows, 1);
	assert.equal(scored[0].columns, 0);
	// Barter's 3 VP, plus 1 VP for each complete row and column.
	assert.equal(r.seat.vp, 3 + scored[0].rows + scored[0].columns);
});

test("more buildings off a row show more spaces: two farms taken add Farming's food and Breeding's 4 VP", () => {
	const r = incomeAfter(1, (seat) => {
		seat.incomeMat.buildings.farm = 3;
	});
	assert.equal(r.seat.vp, 4);
	assert.equal(r.seat.resources.food, 2);
	assert.equal(r.seat.territoryTiles.length, 1);
});

test('income turn 5 scores but gains no income, then the player is finished', () => {
	const r = incomeAfter(4, (seat) => {
		seat.tech.top = ['calendar'];
	});
	assert.equal(r.seat.incomeTurns, 5);
	assert.equal(r.seat.vp, 1);
	assert.equal(r.seat.finished, true);
	assert.ok(!r.events.some((e) => e.type === 'resourcesGained'));
	assert.ok(
		r.events.some(
			(e) => e.type === 'playerFinished' && e.player === r.player
		)
	);
	assert.notEqual(r.state.current, r.player);
});

test('resources from income stop at 8', () => {
	const r = incomeAfter(1, (seat) => {
		seat.resources.coin = 8;
	});
	assert.equal(r.seat.resources.coin, 8);
	assert.ok(
		r.events.some((e) => e.type === 'resourcesGained' && e.lost.coin === 1)
	);
});

test("an income step added after 'finish' fails loudly instead of doing nothing", (t) => {
	INCOME_STEPS.push('late');
	INCOME_STEP_KINDS.late = { turns: [5], run: () => {} };
	t.onTestFinished(() => {
		INCOME_STEPS.pop();
		delete INCOME_STEP_KINDS.late;
	});
	assert.throws(
		() => incomeAfter(4),
		(e) => e.name !== 'PlayerError' && /'finish'/.test(e.message)
	);
});
