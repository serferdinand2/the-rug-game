// Tests for placing income buildings in the capital city and paying district rewards (#16).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, resolveEffects, contextFor } from '../src/lib/engine/loop.js';
import { moveToken } from '../src/lib/engine/movement.js';
import { rankPlayers, landmarksInCity } from '../src/lib/engine/ranking.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { view } from '../src/lib/engine/view.js';
import { countVp } from '../src/lib/engine/effects/vp.js';
import {
	buildingSpots,
	cityPlots,
	completeDistricts,
	completeLines,
	landmarkCells,
	landmarkSpots,
} from '../src/lib/engine/city.js';
import { plotIndex, groupsOf } from '../src/lib/capital.js';
import { CAPITAL_MATS } from '../src/lib/engine/data/capitals.js';
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
	const open = buildingSpots(state.seats[0]);
	// The mat's printed grid has 59 open plots ('0'); the city offers exactly those.
	assert.equal(
		open.length,
		CAPITAL_MATS[0].grid.join('').split('0').length - 1
	);
	for (const { row, col } of open.slice(0, -1)) {
		state.seats[0].capital.buildings.push({ building: 'house', row, col });
	}
	assert.equal(
		cityPlots(state.seats[0]).filter((k) => k === 'empty').length,
		1
	);
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

// Landmarks (R13-R15, FAQ #1, FAQ #2)

/** Fills every open plot of a seat with a house, except the plots listed as [row, col]. */
function fillExcept(
	/** @type {any} */ seat,
	/** @type {[number, number][]} */ keep
) {
	for (const { row, col } of buildingSpots(seat)) {
		if (!keep.some(([r, c]) => r === row && c === col)) {
			seat.capital.buildings.push({ building: 'house', row, col });
		}
	}
}

/** Gives a player a landmark to place and runs to the decision. */
function gainLandmark(
	/** @type {any} */ state,
	/** @type {any} */ random,
	/** @type {string} */ landmark,
	player = 1
) {
	push(state, state.pending, [{ player, kind: 'placeLandmark', landmark }]);
	run(state, random);
	return state;
}

/** The Mountain city with only the four plots at rows 6-7, columns 4-5 open, plus any extras. */
const roomForOne = (/** @type {[number, number][]} */ extra = []) =>
	game(1, (seat) =>
		fillExcept(seat, [[6, 4], [6, 5], [7, 4], [7, 5], ...extra])
	);

const moved = (/** @type {any} */ state, /** @type {any} */ random, move) => {
	moveToken(contextFor(state, random, state.pending), move.player ?? 1, {
		track: move.track,
		from: move.from,
		to: move.to,
		benefit: move.benefit ?? false,
	});
	run(state, random);
	return state;
};

test('a gained landmark waits for a spot, offered in all four rotations (R15)', () => {
	const { state, random } = game(1, (seat) => {
		seat.tracks.exploration = [3];
	});
	moved(state, random, { track: 'exploration', from: 3, to: 4 });
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'choosePlacement');
	assert.equal(decision.player, 1);
	assert.equal(decision.landmark, 'lighthouse');
	const answers = DECISIONS.choosePlacement.answers(state, decision);
	assert.deepEqual(answers, landmarkSpots(state.seats[0], 'lighthouse'));
	for (const rotation of [0, 1, 2, 3]) {
		assert.ok(
			answers.some((a) => a.rotation === rotation),
			`${rotation}`
		);
	}
	for (const answer of answers) {
		assert.doesNotThrow(() =>
			DECISIONS.choosePlacement.check(state, decision, answer)
		);
	}
});

test("a landmark answer is refused off the city, on a taken plot, or over another landmark's overhang", () => {
	const { state, random } = game(1, (seat) => {
		// A Lighthouse hanging over the top edge at columns 3-4.
		seat.capital.landmarks.push({
			landmark: 'lighthouse',
			row: -1,
			col: 3,
			rotation: 0,
		});
	});
	const check = DECISIONS.choosePlacement.check;
	gainLandmark(state, random, 'bridge');
	const [decision] = openDecisions(state);
	const refused = (/** @type {any} */ answer, message) =>
		assert.throws(
			() => check(state, decision, answer),
			{ name: 'PlayerError', message },
			JSON.stringify(answer)
		);
	refused(
		{ row: -5, col: -5, rotation: 0 },
		'A landmark must cover at least one plot of your city.'
	);
	// (1, 0) is impassable.
	refused({ row: 0, col: 0, rotation: 0 }, "That plot isn't open.");
	// The Bridge shares only the overhang cell (-1, 3) with the Lighthouse.
	refused(
		{ row: -2, col: 0, rotation: 0 },
		'Another landmark is already there.'
	);
	assert.ok(
		!DECISIONS.choosePlacement
			.answers(state, decision)
			.some((a) => a.row === -2 && a.col === 0 && a.rotation === 0)
	);
	const shape = 'Choose a row and a column.';
	const turn = 'Choose a rotation from 0 to 3.';
	refused({ row: 0, col: 4, rotation: 4 }, turn);
	refused({ row: 0, col: 4, rotation: -1 }, turn);
	refused({ row: 0, col: 4, rotation: '1' }, turn);
	refused({ row: 0, col: 4, rotation: 1.5 }, turn);
	refused({ row: 0, col: 4 }, turn);
	refused({ row: 1.5, col: 4, rotation: 0 }, shape);
	refused({ row: '1', col: 4, rotation: 0 }, shape);
	refused({ row: 0, col: NaN, rotation: 0 }, shape);
	refused(
		{ row: 1e9, col: 0, rotation: 0 },
		'A landmark must cover at least one plot of your city.'
	);
	assert.deepEqual(state.seats[0].capital.landmarks.length, 1);
});

test('a landmark with one place goes there unturned, without a question (owner)', () => {
	const { state, random } = roomForOne();
	gainLandmark(state, random, 'lighthouse');
	const placed = state.events.find((e) => e.type === 'landmarkPlaced');
	assert.deepEqual(
		{ ...placed, seq: 0 },
		{
			type: 'landmarkPlaced',
			seq: 0,
			player: 1,
			landmark: 'lighthouse',
			row: 6,
			col: 4,
			rotation: 0,
			automatic: true,
		}
	);
	assert.equal(state.seats[0].capital.landmarks.length, 1);
	assert.deepEqual(
		openDecisions(state).map((d) => d.kind),
		['chooseResource']
	);
});

test('a landmark with two places is asked about', () => {
	const { state, random } = roomForOne([[0, 0]]);
	gainLandmark(state, random, 'lighthouse');
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'choosePlacement');
	const answers = DECISIONS.choosePlacement.answers(state, decision);
	assert.ok(answers.some((a) => a.row === -1 && a.col === -1));
	assert.ok(answers.some((a) => a.row === 6 && a.col === 4));
	assert.deepEqual(state.seats[0].capital.landmarks, []);
});

test('a landmark with no place goes beside the mat and does not count for the tiebreak (R13, R14)', () => {
	const { state, random } = game(1, (seat) => fillExcept(seat, []));
	gainLandmark(state, random, 'lighthouse');
	const seat = state.seats[0];
	assert.deepEqual(seat.besideMat, ['lighthouse']);
	assert.deepEqual(seat.capital.landmarks, []);
	assert.deepEqual(landmarksInCity(seat), []);
	assert.deepEqual(openDecisions(state), []);
	assert.ok(
		state.events.some(
			(e) =>
				e.type === 'placedBesideMat' &&
				e.player === 1 &&
				e.landmark === 'lighthouse'
		)
	);
});

test('a landmark completing two districts gives one choice of 2 resources', () => {
	const { state, random } = game(1, (seat) => {
		for (const [row, col] of [
			[0, 0],
			[0, 1],
			[2, 0],
			[2, 1],
			[2, 2],
			[0, 4],
			[0, 5],
			[1, 4],
		]) {
			seat.capital.buildings.push({ building: 'house', row, col });
		}
	});
	gainLandmark(state, random, 'lighthouse');
	const [decision] = openDecisions(state);
	const next = play(
		state,
		1,
		{ decision: decision.id, row: 0, col: 2, rotation: 0 },
		random
	);
	const done = next.events.find((e) => e.type === 'districtsCompleted');
	assert.deepEqual(done.districts, [0, 1]);
	const [reward] = openDecisions(next);
	assert.equal(reward.kind, 'chooseResource');
	assert.equal(reward.count, 2);
});

test("FAQ #1: the landmark and its district resource come before the space's benefit", () => {
	const { state, random } = game(1, (seat) => {
		seat.tracks.exploration = [3];
		for (const [row, col] of [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 2],
			[2, 0],
		]) {
			seat.capital.buildings.push({ building: 'house', row, col });
		}
	});
	moved(state, random, {
		track: 'exploration',
		from: 3,
		to: 4,
		benefit: true,
	});
	const [place] = openDecisions(state);
	assert.equal(place.kind, 'choosePlacement');
	const placed = play(
		state,
		1,
		{ decision: place.id, row: 2, col: 1, rotation: 0 },
		random
	);
	const [reward] = openDecisions(placed);
	assert.equal(reward.kind, 'chooseResource');
	assert.equal(placed.seats[0].territoryTiles.length, 0);
	const done = play(
		placed,
		1,
		{ decision: reward.id, resources: { coin: 1 } },
		random
	);
	assert.equal(done.seats[0].territoryTiles.length, 1);
	// The explore that follows has the new tile to place, so its player is asked where (#17).
	assert.deepEqual(
		openDecisions(done).map((d) => [d.kind, d.player, d.anywhere]),
		[['chooseExplore', 1, false]]
	);
});

test('two landmarks gained in one move are placed in turn, and the second is offered only what the first left', () => {
	const { state, random } = game(1, (seat) => {
		seat.tracks.exploration = [3];
	});
	moved(state, random, { track: 'exploration', from: 3, to: 7 });
	const first = openDecisions(state);
	assert.deepEqual(
		first.map((d) => [d.kind, d.landmark]),
		[['choosePlacement', 'lighthouse']]
	);
	// The Lighthouse hangs over the top edge, taking plots off the grid too.
	const next = play(
		state,
		1,
		{ decision: first[0].id, row: -1, col: 0, rotation: 0 },
		random
	);
	const [second] = openDecisions(next);
	assert.equal(second.landmark, 'train-station');
	const taken = new Set(
		next.seats[0].capital.landmarks.flatMap((p) =>
			landmarkCells(p).map((c) => `${c.row},${c.col}`)
		)
	);
	const answers = DECISIONS.choosePlacement.answers(next, second);
	assert.ok(answers.length > 0);
	for (const answer of answers) {
		const cells = landmarkCells({ landmark: 'train-station', ...answer });
		assert.ok(cells.every((c) => !taken.has(`${c.row},${c.col}`)));
	}
	assert.equal(next.seats[0].capital.landmarks.length, 1);
});

test("a landmark gained on another player's turn is placed by that player (FAQ #2)", () => {
	const { state, random } = game(1, (seat, s) => {
		s.seats[1].capital.mat = 2;
		s.seats[1].tracks.exploration = [3];
		s.current = 1;
	});
	moved(state, random, { player: 2, track: 'exploration', from: 3, to: 4 });
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'choosePlacement');
	assert.equal(decision.player, 2);
	const answer = DECISIONS.choosePlacement.answers(state, decision)[0];
	assert.throws(
		() => play(state, 1, { decision: decision.id, ...answer }, random),
		{ name: 'PlayerError' }
	);
	const next = play(state, 2, { decision: decision.id, ...answer }, random);
	assert.equal(next.seats[1].capital.landmarks.length, 1);
	assert.equal(next.seats[0].capital.landmarks.length, 0);
});

test('every landmark answer passes check on a started game, for a chiral landmark too', () => {
	for (const landmark of [
		'lighthouse',
		'birdwatching-perch',
		'rubber-works',
	]) {
		const { state, random } = game(1);
		gainLandmark(state, random, landmark);
		const [decision] = openDecisions(state);
		const answers = DECISIONS.choosePlacement.answers(state, decision);
		assert.ok(answers.length > 0, landmark);
		for (const answer of answers) {
			assert.doesNotThrow(
				() => DECISIONS.choosePlacement.check(state, decision, answer),
				`${landmark} ${JSON.stringify(answer)}`
			);
		}
	}
});

test('an overhanging landmark completes a district through its plots on the grid only (design section 12)', () => {
	// District 1 of the Mountain has 5 open plots: (0, 3), (0, 4), (0, 5), (1, 3), (1, 4).
	const { state, random } = game(1, (seat) => {
		for (const [row, col] of [
			[0, 5],
			[1, 3],
			[1, 4],
		]) {
			seat.capital.buildings.push({ building: 'house', row, col });
		}
		seat.resources = { coin: 0, worker: 0, food: 0, culture: 0 };
	});
	gainLandmark(state, random, 'lighthouse');
	const [decision] = openDecisions(state);
	// Rows -1 and 0: two plots off the grid, and (0, 3) and (0, 4) on it.
	const next = play(
		state,
		1,
		{ decision: decision.id, row: -1, col: 3, rotation: 0 },
		random
	);
	assert.deepEqual(completeDistricts(cityPlots(next.seats[0])), [1]);
	const [reward] = openDecisions(next);
	assert.equal(reward.kind, 'chooseResource');
	const done = play(
		next,
		1,
		{ decision: reward.id, resources: { coin: 1 } },
		random
	);
	assert.equal(done.seats[0].resources.coin, 1);
	assert.deepEqual(openDecisions(done), []);
	assert.equal(
		next.events.filter((e) => e.type === 'landmarkPlaced').length,
		1
	);
});

test("FAQ #1: a district the landmark completes can pay the space's bonus", () => {
	const { state, random } = game(1, (seat) => {
		seat.tracks.exploration = [3];
		seat.resources = { coin: 0, worker: 0, food: 0, culture: 0 };
		for (const [row, col] of [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 2],
			[2, 0],
		]) {
			seat.capital.buildings.push({ building: 'house', row, col });
		}
	});
	// Exploration 5 (Ships) comes with the Lighthouse at space 4; its bonus pays 1 coin for a farm.
	moved(state, random, {
		track: 'exploration',
		from: 3,
		to: 5,
		benefit: true,
	});
	const [placing] = openDecisions(state);
	assert.equal(placing.landmark, 'lighthouse');
	// The Lighthouse fills (2, 1) and (2, 2), completing district 0.
	const afterPlace = play(
		state,
		1,
		{ decision: placing.id, row: 2, col: 1, rotation: 0 },
		random
	);
	const [reward] = openDecisions(afterPlace);
	assert.equal(reward.kind, 'chooseResource');
	const afterReward = play(
		afterPlace,
		1,
		{ decision: reward.id, resources: { coin: 1 } },
		random
	);
	const [bonus] = openDecisions(afterReward);
	assert.equal(bonus.kind, 'chooseBonus');
	const answers = DECISIONS.chooseBonus.answers(afterReward, bonus);
	assert.ok(answers.some((a) => a.pay && a.pay.coin === 1));
	const paid = play(
		afterReward,
		1,
		{ decision: bonus.id, pay: { coin: 1 } },
		random
	);
	assert.deepEqual(
		openDecisions(paid).map((d) => [d.kind, d.building]),
		[['choosePlacement', 'farm']]
	);
});

test('R13: a landmark placed through the engine breaks a VP tie', () => {
	const { state, random } = game(1, (seat, s) => {
		s.seats[1].capital.mat = 2;
		seat.vp = 5;
		s.seats[1].vp = 5;
	});
	gainLandmark(state, random, 'lighthouse');
	const [decision] = openDecisions(state);
	const answer = DECISIONS.choosePlacement.answers(state, decision)[0];
	const next = play(state, 1, { decision: decision.id, ...answer }, random);
	assert.equal(next.version, 'current');
	assert.deepEqual(
		rankPlayers(next).ranking.map((p) => [p.seat, p.place]),
		[
			[1, 1],
			[2, 2],
		]
	);
});

// Scoring the capital (FAQ #21, R71)

test('scoreCapital scores 1 VP per complete row and column; impassable plots count as filled, plots off the grid do not', () => {
	const { state, random } = game(5, (seat) => {
		for (let col = 0; col <= 6; col++) {
			seat.capital.buildings.push({ building: 'house', row: 0, col });
		}
		for (const row of [3, 4, 6, 7, 8]) {
			seat.capital.buildings.push({
				building: 'house',
				row: row,
				col: 0,
			});
		}
		// Covers (0, 7) and (0, 8); the plot at row -1 is off the grid.
		seat.capital.landmarks.push({
			landmark: 'lighthouse',
			row: -1,
			col: 7,
			rotation: 0,
		});
	});
	const seq = state.seq;
	const next = resolveEffects(state, 1, [{ scoreCapital: {} }], random);
	const scored = typesSince(next, seq).filter(
		(e) => e.type === 'capitalScored'
	);
	assert.equal(scored.length, 1);
	assert.equal(scored[0].player, 1);
	assert.equal(scored[0].rows, 1);
	assert.equal(scored[0].columns, 1);
	assert.equal(next.seats[0].vp, state.seats[0].vp + 2);
});

test('scoreCapital with nothing complete scores 0 VP and still says so', () => {
	const { state, random } = game();
	const seq = state.seq;
	const next = resolveEffects(state, 1, [{ scoreCapital: {} }], random);
	const scored = typesSince(next, seq).filter(
		(e) => e.type === 'capitalScored'
	);
	assert.equal(scored.length, 1);
	assert.equal(scored[0].rows, 0);
	assert.equal(scored[0].columns, 0);
	assert.equal(next.seats[0].vp, state.seats[0].vp);
});

test('a full city scores 9 rows and 9 columns, 18 VP, on every basic mat', () => {
	for (let mat = 1; mat <= 6; mat++) {
		const { state, random } = game(mat, (seat) => fillExcept(seat, []));
		const next = resolveEffects(state, 1, [{ scoreCapital: {} }], random);
		assert.equal(next.seats[0].vp - state.seats[0].vp, 18, `mat ${mat}`);
	}
});
