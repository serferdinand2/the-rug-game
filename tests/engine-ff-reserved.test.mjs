// Fantasies & Futures' income-mat overlay (#39 part 2): items reserved, what they count for, and their use on income turn 5 (03 FF.2.2).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { resolveEffects, run } from '../src/lib/engine/loop.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { countVp } from '../src/lib/engine/effects/vp.js';
import { INCOME_STEPS } from '../src/lib/engine/income.js';
import { view } from '../src/lib/engine/game.js';
import { answer, readyTurn } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';

/** The source a reserving card's effects run with: Microbial Magic on the mat. */
const SOURCE = { tapestry: 'microbial-magic', card: 'microbial-magic' };

/**
 * An F&F game whose current player's turn choice is open, after `fill`.
 * @param {(seat: any, state: any) => void} [fill]
 * @param {string[]} [expansions]
 */
function game(fill = () => {}, expansions = ['ff']) {
	return readyTurn(3, fill, { expansions });
}

/**
 * Runs effects for a player with a source, as a card's ability would.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {object[]} effects
 */
function runAs(state, random, player, effects) {
	const next = structuredClone(state);
	push(next, next.pending, [
		{ player, kind: 'effects', effects, source: SOURCE },
	]);
	run(next, random);
	return next;
}

/**
 * Answers open decisions with their first answer until only the turn's choice is left.
 * @param {any} state
 * @param {any} random
 */
function settle(state, random) {
	for (let step = 0; step < 100; step++) {
		const [open] = openDecisions(state);
		if (!open || open.kind === 'chooseTurn') {
			return state;
		}
		const first = DECISIONS[open.kind].answers(state, open)[0];
		state = answer(state, random, open.player, open.kind, first);
	}
	throw new Error('A decision never ended.');
}

const seatOf = (/** @type {any} */ state, /** @type {number} */ p) =>
	/** @type {any} */ (state.seats[p - 1]);

test('an F&F seat starts with an empty overlay; another game has none', () => {
	const { state, player } = game();
	assert.deepEqual(seatOf(state, player).reserved, []);
	const base = readyTurn(2);
	assert.ok(!('reserved' in seatOf(base.state, base.player)));
});

test('R71: a reserved farm uncovers its income space at once and counts for "per farm", never as in the capital', () => {
	const { state, random, player } = game();
	const next = runAs(state, random, player, [
		{ reserve: { building: 'farm' } },
	]);
	const seat = seatOf(next, player);
	assert.equal(seat.incomeMat.buildings.farm, 4);
	assert.equal(seat.reserved.length, 1);
	assert.equal(seat.reserved[0].building, 'farm');
	assert.equal(seat.reserved[0].ability, 'microbial-magic');
	assert.equal(countVp(next, player, 'farm'), 1);
	assert.equal(seat.capital.buildings.length, 0);
	assert.ok(next.events.some((e) => e.type === 'itemReserved'));
	checkState(next);
	// With none left, nothing is reserved.
	const none = game((s) => {
		s.incomeMat.buildings.farm = 0;
	});
	const after = runAs(none.state, none.random, none.player, [
		{ reserve: { building: 'farm' } },
	]);
	assert.deepEqual(seatOf(after, none.player).reserved, []);
});

test("reserved territory tiles count for 'per territory tile'; a reserved tech card for nothing until invented", () => {
	const { state, random, player } = game();
	const next = settle(
		runAs(state, random, player, [
			{ reserve: { territory: 3 } },
			{ reserve: { tech: true } },
		]),
		random
	);
	const seat = seatOf(next, player);
	const tiles = seat.reserved.find((/** @type {any} */ i) => i.territory);
	assert.equal(tiles.territory.length, 3);
	assert.equal(countVp(next, player, 'territoryTile'), 3);
	assert.ok(seat.reserved.some((/** @type {any} */ i) => i.tech));
	assert.equal(countVp(next, player, 'techCard'), 0);
	checkState(next);
});

test('drawing 3 to keep 1: the options are hidden from the others, the rest go back; fewer drawn when fewer are left', () => {
	const { state, random, player } = game();
	const next = runAs(state, random, player, [{ reserve: { space: 3 } }]);
	const asked = openDecisions(next).find((d) => d.kind === 'chooseReserve');
	assert.ok(asked);
	assert.equal(asked.options.length, 3);
	const other = next.seats.find((s) => s.seat !== player)?.seat;
	const seen = /** @type {any} */ (view(next, /** @type {number} */ (other)));
	const theirs = seen.pending
		.flatMap((/** @type {any} */ op) =>
			op.lanes ? op.lanes.flatMap((l) => l.stack) : [op]
		)
		.find((/** @type {any} */ op) => op.kind === 'chooseReserve');
	assert.ok(theirs && theirs.options === undefined, 'the options are hidden');
	checkState(next);
	const stack = next.supply.space.length;
	const kept = answer(next, random, player, 'chooseReserve', {
		item: asked.options[1],
	});
	assert.equal(kept.supply.space.length, stack + 2);
	assert.deepEqual(
		seatOf(kept, player).reserved.map((/** @type {any} */ i) => i.space),
		[asked.options[1]]
	);
	checkState(kept);
	// One left: kept without asking; none: nothing.
	const one = game((_, s) => {
		s.supply.spaceDiscard.push(...s.supply.space.splice(1));
	});
	const solo = runAs(one.state, one.random, one.player, [
		{ reserve: { space: 3 } },
	]);
	assert.equal(seatOf(solo, one.player).reserved.length, 1);
	const empty = game((_, s) => {
		s.supply.spaceDiscard.push(...s.supply.space.splice(0));
	});
	const nothing = runAs(empty.state, empty.random, empty.player, [
		{ reserve: { space: 3 } },
	]);
	assert.deepEqual(seatOf(nothing, empty.player).reserved, []);
});

test('Zombie Army takes only a lone upright outpost from a territory holding nothing else, and vacates it', () => {
	const { state, random, player } = game((seat, s) => {
		const keys = Object.keys(s.hexes).filter((k) => !k.startsWith('mat:'));
		for (const key of keys) {
			s.hexes[key].outposts = [];
			s.hexes[key].tokens = [];
		}
		const [a, b, c, d, e] = keys.filter((k) => s.hexes[k].tile !== null);
		s.hexes[a].outposts = [{ seat: seat.seat, toppled: false }];
		s.hexes[b].outposts = [{ seat: seat.seat, toppled: false }];
		s.hexes[b].tokens = [{ seat: 9, civ: 'traders' }];
		s.hexes[c].outposts = [
			{ seat: seat.seat, toppled: false },
			{ seat: seat.seat, toppled: false },
		];
		s.hexes[d].outposts = [
			{ seat: seat.seat, toppled: false, piece: { building: 'farm' } },
		];
		s.hexes[e].outposts = [{ seat: seat.seat, toppled: false }];
		seat.incomeMat.buildings.farm = 4;
		// Every seat's supply holds the outposts no longer on the map.
		for (const other of s.seats) {
			const placed = Object.values(s.hexes)
				.flatMap((/** @type {any} */ hex) => hex.outposts)
				.filter(
					(/** @type {any} */ o) => o.seat === other.seat && !o.piece
				);
			other.outposts = 10 - placed.length;
		}
		s.zombie = { a, e };
	});
	const { a, e } = /** @type {any} */ (state).zombie;
	delete (/** @type {any} */ (state).zombie);
	const next = runAs(state, random, player, [{ reserve: { outposts: 3 } }]);
	const asked = openDecisions(next).find((d) => d.kind === 'chooseHex');
	assert.ok(asked);
	assert.deepEqual([...asked.options].sort(), [a, e].sort());
	assert.equal(asked.purpose, 'zombieArmy');
	const one = answer(next, random, player, 'chooseHex', { hex: a });
	assert.deepEqual(one.hexes[a].outposts, []);
	const two = answer(one, random, player, 'chooseHex', { hex: e });
	const seat = seatOf(two, player);
	assert.equal(
		seat.reserved.filter((/** @type {any} */ i) => i.outpost).length,
		2
	);
	checkState(two);
});

test('the reserved step runs on income turn 5 only, with F&F only, after the tapestry step and before the upgrade', () => {
	const at = INCOME_STEPS.indexOf('reserved');
	assert.equal(INCOME_STEPS[at - 1], 'tapestry');
	assert.equal(INCOME_STEPS[at + 1], 'upgrade');
});

test('on income turn 5 each item is used, in the order the player chooses (R132)', () => {
	const { state, random, player } = game();
	let next = runAs(state, random, player, [
		{ reserve: { building: 'farm' } },
		{ reserve: { token: true } },
	]);
	next = settle(next, random);
	const used = resolveEffects(next, player, [{ useAllReserved: {} }], random);
	const order = openDecisions(used).find((d) => d.kind === 'chooseOrder');
	assert.ok(order, 'two items ask for an order');
	const done = settle(used, random);
	assert.deepEqual(seatOf(done, player).reserved, []);
	assert.equal(
		seatOf(done, player).capital.buildings.filter(
			(/** @type {any} */ b) => b.building === 'farm'
		).length,
		1
	);
	assert.ok(
		done.events.filter((e) => e.type === 'reservedUsed').length === 2
	);
	checkState(done);
});

test('an item reserved on or after income turn 5 is used at once', () => {
	const { state, random, player } = game((seat) => {
		seat.incomeTurns = 5;
	});
	const next = settle(
		runAs(state, random, player, [{ reserve: { building: 'farm' } }]),
		random
	);
	const seat = seatOf(next, player);
	assert.deepEqual(seat.reserved, []);
	assert.equal(
		seat.capital.buildings.filter(
			(/** @type {any} */ b) => b.building === 'farm'
		).length,
		1
	);
	checkState(next);
});

test('each item kind is used on income turn 5: tech invented and upgraded twice, tiles explored, outposts conquer, a token runs its card', () => {
	const { state, random, player } = game((seat) => {
		seat.incomeTurns = 5;
	});
	for (const reserve of [
		{ tech: true },
		{ space: 3 },
		{ territory: 3 },
		{ token: true },
	]) {
		const next = settle(
			runAs(state, random, player, [{ reserve }]),
			random
		);
		assert.deepEqual(
			seatOf(next, player).reserved,
			[],
			JSON.stringify(reserve)
		);
		checkState(next);
	}
	const tech = settle(
		runAs(state, random, player, [{ reserve: { tech: true } }]),
		random
	);
	const rows = seatOf(tech, player).tech;
	assert.equal(rows.top.length, 1, 'the reserved card went up twice');
});
