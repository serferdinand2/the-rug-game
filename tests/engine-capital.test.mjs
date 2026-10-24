// Tests for placing income buildings in the capital city and paying district rewards (#16).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { view } from '../src/lib/engine/view.js';
import { countVp } from '../src/lib/engine/effects/vp.js';
import {
	buildingSpots,
	cityPlots,
	completeDistricts,
	completeLines,
} from '../src/lib/engine/city.js';
import { plotIndex, groupsOf } from '../src/lib/capital.js';
import { startedGame, placeAll } from './helpers/engine.mjs';

/**
 * A started 2-player game with seat 1 on a capital mat, changed by `fill`.
 * @param {number} [mat]
 * @param {(seat: any, state: any) => void} [fill]
 */
function game(mat = 1, fill = () => {}) {
	const { state, random } = startedGame(2);
	const next = structuredClone(state);
	next.seats[0].capital.mat = mat;
	fill(next.seats[0], next);
	next.pending.length = 0;
	return { state: next, random };
}

/** Gives seat 1 a farm to place and runs to the decision. */
function gainFarm(/** @type {any} */ state, /** @type {any} */ random) {
	return resolveEffects(state, 1, [{ building: 'farm' }], random);
}

/** The event types since a sequence number. */
const typesSince = (/** @type {any} */ state, /** @type {number} */ seq) =>
	state.events.filter((e) => e.seq > seq);

test('a gained building waits for its player to choose a plot, and every open plot is offered', () => {
	const { state, random } = game();
	const next = gainFarm(state, random);
	const [decision] = openDecisions(next);
	assert.equal(decision.kind, 'choosePlacement');
	assert.equal(decision.player, 1);
	assert.equal(decision.building, 'farm');
	assert.deepEqual(
		DECISIONS.choosePlacement.answers(next, decision),
		buildingSpots(next.seats[0])
	);
	assert.equal(buildingSpots(next.seats[0]).length > 1, true);
});

test('every placement answer passes check, and impassable or taken plots are refused', () => {
	const { state, random } = game(3);
	const next = gainFarm(state, random);
	const [decision] = openDecisions(next);
	const kind = DECISIONS.choosePlacement;
	for (const answer of kind.answers(next, decision)) {
		assert.doesNotThrow(() => kind.check(next, decision, answer));
	}
	const blocked = cityPlots(next.seats[0]).indexOf('blocked');
	assert.ok(blocked >= 0, 'this mat has an impassable plot');
	const [row, col] = [Math.floor(blocked / 9), blocked % 9];
	assert.throws(() => kind.check(next, decision, { row, col }), {
		name: 'PlayerError',
		message: "That plot isn't open.",
	});
	assert.throws(() => kind.check(next, decision, { row: 9, col: 0 }), {
		name: 'PlayerError',
		message: 'A building must go on a plot of your city.',
	});
	assert.throws(() => kind.check(next, decision, { row: 0, col: -1 }), {
		name: 'PlayerError',
		message: 'A building must go on a plot of your city.',
	});
	// A taken plot, through play().
	const first = kind.answers(next, decision)[0];
	const placed = play(next, 1, { decision: decision.id, ...first }, random);
	const again = resolveEffects(placed, 1, [{ building: 'house' }], random);
	const [second] = openDecisions(again);
	assert.throws(
		() =>
			play(
				again,
				1,
				{ decision: second.id, row: first.row, col: first.col },
				random
			),
		{ name: 'PlayerError', message: "That plot isn't open." }
	);
});

test('a building answer must be two whole numbers on the grid, without a rotation', () => {
	const { state, random } = game();
	const next = gainFarm(state, random);
	const [decision] = openDecisions(next);
	const check = DECISIONS.choosePlacement.check;
	const shape = 'Choose a row and a column.';
	for (const answer of [
		{ row: '3', col: 0 },
		{ row: 0, col: '3' },
		{ row: 2.5, col: 0 },
		{ row: 0, col: 2.5 },
		{ row: NaN, col: 0 },
		{ row: 0, col: Infinity },
		{ row: null, col: 0 },
		{ row: 0, col: null },
		{ row: 1e9, col: 0 },
		{ row: 0 },
		{ col: 0 },
		{},
	]) {
		const expected =
			Number.isInteger(answer.row) && Number.isInteger(answer.col)
				? 'A building must go on a plot of your city.'
				: shape;
		assert.throws(
			() => check(next, decision, answer),
			{ name: 'PlayerError', message: expected },
			JSON.stringify(answer)
		);
	}
	assert.throws(
		() => check(next, decision, { row: 0, col: 0, rotation: 0 }),
		{ name: 'PlayerError', message: 'Only a landmark can be turned.' }
	);
	// Nothing was placed by a refused answer.
	assert.deepEqual(next.seats[0].capital.buildings, []);
});

test('the last open plot is filled automatically (owner)', () => {
	const { state, random } = game();
	const plots = cityPlots(state.seats[0]);
	const open = buildingSpots(state.seats[0]);
	for (const { row, col } of open.slice(0, -1)) {
		state.seats[0].capital.buildings.push({ building: 'house', row, col });
	}
	assert.equal(plots.filter((k) => k === 'empty').length, open.length);
	const next = gainFarm(state, random);
	// Only the last district's reward is left to answer; the placement itself asked nothing.
	assert.deepEqual(
		openDecisions(next).map((d) => d.kind),
		['chooseResource']
	);
	const placed = next.events.find((e) => e.type === 'buildingPlaced');
	const last = open.at(-1);
	assert.deepEqual(
		{ ...placed, seq: 0 },
		{
			type: 'buildingPlaced',
			seq: 0,
			player: 1,
			building: 'farm',
			row: last.row,
			col: last.col,
			automatic: true,
		}
	);
	// A chosen placement is not automatic.
	const { state: s2, random: r2 } = game();
	const n2 = gainFarm(s2, r2);
	const [d2] = openDecisions(n2);
	const done = play(n2, 1, { decision: d2.id, row: 4, col: 4 }, r2);
	assert.equal(
		done.events.find((e) => e.type === 'buildingPlaced').automatic,
		false
	);
});

test('a building on a full city goes beside the mat, and still counts for 1 VP per farm (FAQ #21, R71)', () => {
	const { state, random } = game(1, (seat) => {
		for (const { row, col } of buildingSpots(seat)) {
			seat.capital.buildings.push({ building: 'house', row, col });
		}
	});
	const next = gainFarm(state, random);
	assert.deepEqual(next.seats[0].besideMat, ['farm']);
	assert.ok(
		next.events.some(
			(e) =>
				e.type === 'placedBesideMat' &&
				e.player === 1 &&
				e.building === 'farm'
		)
	);
	assert.deepEqual(openDecisions(next), []);
	assert.equal(countVp(next, 1, 'farm'), 1);
});

test('on all 6 basic mats, each district pays 1 resource exactly when its last open plot fills', () => {
	const districts = groupsOf('districts');
	for (let mat = 1; mat <= 6; mat++) {
		const { state: first, random } = game(mat);
		let state = first;
		const seat = () => state.seats[0];
		state.pending.length = 0;
		const done = new Set();
		let guard = 0;
		while (buildingSpots(seat()).length > 0 && guard++ < 100) {
			const before = cityPlots(seat());
			const seq = state.seq;
			push(state, state.pending, [
				{ player: 1, kind: 'placeBuilding', building: 'farm' },
			]);
			run(state, random);
			// Answer the placement, then any district reward.
			for (
				let d = openDecisions(state)[0];
				d;
				d = openDecisions(state)[0]
			) {
				const answer = DECISIONS[d.kind].answers(state, d)[0];
				state = play(state, 1, { decision: d.id, ...answer }, random);
			}
			const after = cityPlots(seat());
			const expected = districts.flatMap((group, i) =>
				group.some((p) => before[p] === 'empty') &&
				group.every((p) => after[p] !== 'empty')
					? [i]
					: []
			);
			const events = typesSince(state, seq).filter(
				(e) => e.type === 'districtsCompleted'
			);
			assert.deepEqual(
				events.flatMap((e) => e.districts),
				expected,
				`mat ${mat}`
			);
			for (const i of expected) {
				assert.ok(!done.has(i), `district ${i} paid twice, mat ${mat}`);
				done.add(i);
			}
		}
		assert.equal(done.size, 9, `mat ${mat}`);
		assert.deepEqual(completeLines(cityPlots(seat())), {
			rows: 9,
			columns: 9,
		});
		assert.equal(completeDistricts(cityPlots(seat())).length, 9);
	}
});

test('a district reward at 8 of everything is still offered, and lost at the cap', () => {
	const { state, random } = game(1, (seat) => {
		seat.resources = { coin: 8, worker: 8, food: 8, culture: 8 };
		const group = groupsOf('districts')[0];
		const plots = cityPlots(seat);
		const open = group.filter((p) => plots[p] === 'empty');
		for (const p of open.slice(0, -1)) {
			seat.capital.buildings.push({
				building: 'house',
				row: Math.floor(p / 9),
				col: p % 9,
			});
		}
	});
	state.pending.length = 0;
	const last = groupsOf('districts')[0].filter(
		(p) => cityPlots(state.seats[0])[p] === 'empty'
	)[0];
	push(state, state.pending, [
		{ player: 1, kind: 'placeBuilding', building: 'farm' },
	]);
	run(state, random);
	const [place] = openDecisions(state);
	assert.equal(place.kind, 'choosePlacement');
	const placed = play(
		state,
		1,
		{ decision: place.id, row: Math.floor(last / 9), col: last % 9 },
		random
	);
	const [reward] = openDecisions(placed);
	assert.equal(reward.kind, 'chooseResource');
	assert.equal(reward.count, 1);
	const done = play(
		placed,
		1,
		{ decision: reward.id, resources: { coin: 1 } },
		random
	);
	const gained = done.events
		.filter((e) => e.type === 'resourcesGained')
		.at(-1);
	assert.deepEqual(gained.lost, { coin: 1 });
	assert.equal(done.seats[0].resources.coin, 8);
});

test('only the placing player sees the placement answers', () => {
	const { state, random } = game();
	const next = gainFarm(state, random);
	const seen = (/** @type {number} */ seat) =>
		view(next, seat).pending.find((op) => op.kind === 'choosePlacement');
	assert.ok(Array.isArray(seen(1).answers));
	assert.equal(seen(2).answers, undefined);
	assert.equal(seen(2).building, 'farm');
});

test('placeAll answers every open placement with its first answer', () => {
	const { state, random } = game();
	const next = gainFarm(state, random);
	const placed = placeAll(next, random);
	assert.equal(placed.seats[0].capital.buildings.length, 1);
	assert.deepEqual(openDecisions(placed), []);
});
