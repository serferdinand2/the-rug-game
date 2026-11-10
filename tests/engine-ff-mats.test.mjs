// Fantasies & Futures' six advanced capital mats (#40 part 1): their data, as 03 FF.6 prints them, and the deal.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	ADVANCED_MATS,
	advancedMatsFor,
	capitalMat,
	impassablePlots,
	matShape,
} from '../src/lib/engine/data/capitals.js';
import { newGame, readyTurn, answer } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';
import {
	cityPlots,
	completeDistricts,
	landmarkSpots,
	seatShape,
} from '../src/lib/engine/city.js';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { INCOME_STEPS, INCOME_STEP_KINDS } from '../src/lib/engine/income.js';
import { reedsVp, savannaIncome } from '../src/lib/engine/ff-mats.js';

/** The F&F mats by number, as printed (03 FF.6 2.0). */
const FF_MATS = {
	13: 'quagmire',
	14: 'city-in-a-bottle',
	15: 'veil',
	16: 'savanna',
	17: 'polar',
	18: 'netherworld',
};

test('the six F&F mats are numbered 13 to 18, with 22 impassable plots each, or 17 of 36 in the bottle', () => {
	for (const [number, id] of Object.entries(FF_MATS)) {
		const mat = capitalMat(Number(number));
		assert.equal(mat.id, id);
		assert.equal(mat.expansion, 'ff');
		const { rows, cols } = matShape(mat);
		assert.equal(
			impassablePlots(mat).length,
			id === 'city-in-a-bottle' ? 17 : 22,
			id
		);
		assert.deepEqual(
			[rows, cols],
			id === 'city-in-a-bottle' ? [6, 6] : [9, 9]
		);
	}
	assert.ok(ADVANCED_MATS.some((m) => m.number === 18));
});

test("each F&F mat's impassable plots are those its approved art draws (#133)", async () => {
	for (const id of Object.values(FF_MATS)) {
		const { LAYOUT } = await import(
			`../tools/art/parts/capital-biomes/${id}.js`
		);
		const cols = LAYOUT[0].length;
		const drawn = LAYOUT.flatMap(
			(/** @type {string} */ line, /** @type {number} */ row) =>
				[...line].flatMap((ch, col) =>
					ch === 'X' ? [row * cols + col] : []
				)
		);
		const mat = /** @type {any} */ (
			Object.values(ADVANCED_MATS).find((m) => m.id === id)
		);
		assert.deepEqual(impassablePlots(mat), drawn, id);
	}
});

test("each F&F mat's districts, as 03 FF.6 maps them", () => {
	const sizes = (/** @type {string} */ id) =>
		matShape(
			/** @type {any} */ (ADVANCED_MATS.find((m) => m.id === id))
		).districts.map((d) => d.length);
	// City in a Bottle: six 3×2 districts.
	assert.deepEqual(sizes('city-in-a-bottle'), [6, 6, 6, 6, 6, 6]);
	// Polar: lines A–F, the impassable plots on a line included.
	assert.deepEqual(sizes('polar'), [8, 6, 3, 9, 6, 2]);
	// Quagmire: the nine 3×3 districts.
	assert.deepEqual(sizes('quagmire'), Array(9).fill(9));
	// Savanna: six unicorn districts, clipped at the edge.
	assert.deepEqual(sizes('savanna'), [9, 6, 6, 9, 9, 6]);
	// Veil: pockets B, R and T, then the worldly a–e.
	assert.deepEqual(sizes('veil'), [6, 10, 6, 9, 9, 9, 9, 9]);
	// Netherworld: no square districts; its four imps are paths (§4).
	assert.deepEqual(sizes('netherworld'), []);
});

test("F&F deals its six mats in the advanced draw, after A&A's; a game without it is unchanged", () => {
	assert.deepEqual(advancedMatsFor(['ff']), [13, 14, 15, 16, 17, 18]);
	assert.deepEqual(
		advancedMatsFor(['aa', 'ff']),
		[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
	);
	assert.deepEqual(advancedMatsFor(['aa']), [7, 8, 9, 10, 11, 12]);
	const base = newGame(3, { seed: 5, expansions: ['aa'] }).state;
	const again = newGame(3, { seed: 5, expansions: ['aa'] }).state;
	assert.deepEqual(base, again);
});

// Each mat's rules (03 FF.6, #40 design §4)

/**
 * A started F&F game whose current player holds mat `number`, its turn choice open; `fill` changes the seat first.
 * @param {number} number
 * @param {(seat: any, state: any) => void} [fill]
 */
function onMat(number, fill = () => {}) {
	return readyTurn(
		2,
		(seat, state) => {
			// Swap the mat in: the one it held goes back where this one was, so each mat stays in one place.
			const supply = state.supply.capitals;
			for (const other of state.seats) {
				if (other.capital?.mat === number) {
					other.capital.mat = seat.capital.mat;
				}
			}
			if (supply.includes(number)) {
				supply.splice(supply.indexOf(number), 1, seat.capital.mat);
			}
			seat.capital = {
				mat: number,
				buildings: [],
				landmarks: [],
				cubes: [],
			};
			fill(seat, state);
		},
		{ expansions: ['ff'] }
	);
}

/**
 * Fills plots of a seat's capital with income buildings, farms, houses and armories in turn, each taken off the
 * income mat as placed ones are.
 * @param {any} seat
 * @param {[number, number][]} cells
 */
function farms(seat, cells) {
	const kinds = ['farm', 'house', 'armory'];
	cells.forEach(([row, col], i) => {
		const building = kinds[i % kinds.length];
		seat.capital.buildings.push({ building, row, col });
		seat.incomeMat.buildings[building] -= 1;
	});
}

const seatOf = (/** @type {any} */ s, /** @type {number} */ p) =>
	/** @type {any} */ (s.seats[p - 1]);

test('Netherworld: an imp pays 2 resources once its imp and the centre are joined by buildings or landmarks, orthogonally (R87)', () => {
	// Imp (1,1) to the centre (4,4): (1,1) (2,1) (3,1) (3,2) (3,3) (3,4) (4,4).
	const path = [
		[1, 1],
		[2, 1],
		[3, 1],
		[3, 2],
		[3, 3],
		[3, 4],
	];
	const { state, player } = onMat(18, (seat) => {
		farms(seat, path.slice(0, 5));
	});
	const seat = seatOf(state, player);
	const shape = seatShape(seat);
	assert.deepEqual(completeDistricts(cityPlots(seat), shape), []);
	// The last link and the centre complete the first imp's district.
	seat.capital.buildings.push(
		{ building: 'market', row: 3, col: 4 },
		{ building: 'market', row: 4, col: 4 }
	);
	seat.incomeMat.buildings.market -= 2;
	assert.deepEqual(completeDistricts(cityPlots(seat), shape), [0]);
	// A diagonal step does not link.
	const diagonal = onMat(18, (s) => {
		farms(s, [
			[1, 1],
			[2, 2],
			[3, 3],
			[4, 4],
		]);
	});
	const d = seatOf(diagonal.state, diagonal.player);
	assert.deepEqual(completeDistricts(cityPlots(d), seatShape(d)), []);
});

test('Netherworld: completing an imp district pays 2 resources of your choice', () => {
	const { state, random, player } = onMat(18, (seat) => {
		farms(seat, [
			[1, 1],
			[2, 1],
			[3, 1],
			[3, 2],
			[3, 3],
			[3, 4],
		]);
	});
	const next = placeAt(state, random, player, 'market', 4, 4);
	assert.equal(resourceTotal(seatOf(next, player)), 2);
	checkState(next);
});

test('Polar: a line pays as printed, 2, 2, 1, 2, 1 and 1 (R91); its impassable plots count as filled', () => {
	// Line C: (0,6) impassable, (1,7) and (1,8).
	const { state, random, player } = onMat(17, (seat) => {
		farms(seat, [[1, 7]]);
	});
	const next = placeAt(state, random, player, 'market', 1, 8);
	assert.equal(resourceTotal(seatOf(next, player)), 1);
	// Line B pays 2: (0,4) (2,5) (3,6) (3,7), with (1,4) and (3,8) impassable.
	const b = onMat(17, (seat) => {
		farms(seat, [
			[0, 4],
			[2, 5],
			[3, 6],
		]);
	});
	const paid = placeAt(b.state, b.random, b.player, 'market', 3, 7);
	assert.equal(resourceTotal(seatOf(paid, b.player)), 2);
	checkState(paid);
});

test('Veil: the pockets give an invent, a research with benefit, and an income building (R90); a worldly district 1 resource', () => {
	const mat = capitalMat(15);
	assert.deepEqual(mat.districtRewards, {
		T: [{ invent: {} }],
		R: [{ research: {} }],
		B: [{ anyBuilding: {} }],
	});
	// Pocket T: (0,8) (1,6) (1,7) (1,8) (2,7) (2,8).
	const { state, random, player } = onMat(15, (seat) => {
		farms(seat, [
			[0, 8],
			[1, 6],
			[1, 7],
			[1, 8],
			[2, 7],
		]);
	});
	const next = placeAt(state, random, player, 'market', 2, 8);
	assert.ok(
		next.events.some(
			(/** @type {any} */ e) =>
				e.type === 'techInvented' && e.player === player
		) || openDecisions(next).some((d) => d.kind === 'chooseInvent')
	);
});

test('Savanna: no resource when a district fills; 1 per filled district in the income of turns 2–4', () => {
	// District 2: (0,6) (0,8) impassable, (0,7) a unicorn; open (1,6) (1,7) (1,8).
	const { state, random, player } = onMat(16, (seat) => {
		farms(seat, [
			[1, 6],
			[1, 7],
		]);
	});
	const next = placeAt(state, random, player, 'market', 1, 8);
	assert.equal(resourceTotal(seatOf(next, player)), 0);
	assert.equal(savannaIncome(seatOf(next, player)), 1);
	assert.equal(capitalMat(16).districtIncome, true);
});

test('City in a Bottle: no landmark goes in the city; one set aside gains 6 VP', () => {
	const { state, random, player } = onMat(14);
	const seat = seatOf(state, player);
	assert.deepEqual(landmarkSpots(seat, 'barracks'), []);
	const vp = seat.vp;
	const next = settle(
		resolveEffects(state, player, [{ landmark: 'barracks' }], random),
		random
	);
	const after = seatOf(next, player);
	assert.ok(after.besideMat.includes('barracks'));
	assert.equal(after.vp, vp + 6);
	checkState(next);
});

test('Quagmire: at the end of income turn 5, −5 VP per landmark on reeds and +3 per other landmark in the city (R88, R89)', () => {
	const { state, player } = onMat(13, (seat) => {
		// The Barracks (2×2) on (3,5) covers the reed (3,5); the Bakery off the reeds at (0,0).
		seat.capital.landmarks.push(
			{ landmark: 'barracks', row: 3, col: 5, turns: 0 },
			{ landmark: 'bakery', row: 0, col: 0, turns: 0 }
		);
	});
	assert.equal(reedsVp(seatOf(state, player)), -5 + 3);
	const at = INCOME_STEPS.indexOf('reeds');
	assert.ok(at > INCOME_STEPS.indexOf('score'));
	assert.ok(at < INCOME_STEPS.indexOf('finish'));
	assert.deepEqual(INCOME_STEP_KINDS.reeds.turns, [5]);
});

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

/** The resources a seat holds, summed. */
const resourceTotal = (/** @type {any} */ seat) =>
	Object.values(seat.resources).reduce(
		(/** @type {number} */ a, /** @type {any} */ b) => a + b,
		0
	);

/**
 * Gains a building and places it on a plot of the capital, as the player would, then settles.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {string} building
 * @param {number} row
 * @param {number} col
 */
function placeAt(state, random, player, building, row, col) {
	let next = resolveEffects(state, player, [{ building }], random);
	const ask = openDecisions(next).find((d) => d.kind === 'choosePlacement');
	if (ask) {
		next = answer(next, random, player, 'choosePlacement', { row, col });
	}
	return settle(next, random);
}
