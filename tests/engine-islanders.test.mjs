// The Islanders (#165; 03 §1.3, R113, R115): their start, the mat's scoring, the income turns' explore, the final sea bonus and the mid-game gain.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { play } from '../src/lib/engine/play.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { matchingSides } from '../src/lib/engine/map.js';
import { TERRITORY_TILES } from '../src/lib/engine/data/territory-tiles.js';
import { ISLANDERS_CENTRE } from '../src/lib/engine/island.js';
import { startedGame, answer } from './helpers/engine.mjs';

const PP = { expansions: ['pp'] };

/** Tiles with sea at all 6 corners: the islands. */
const SEA = TERRITORY_TILES.filter((t) =>
	t.corners.every((c) => c === 'sea')
).map((t) => t.id);

/**
 * A tile turned so that its land lies only at these corners, as {tile, orient}, if the data has one.
 * @param {number[]} ks
 */
function landAt(ks) {
	for (const t of TERRITORY_TILES) {
		for (let orient = 0; orient < 6; orient++) {
			const turned = t.corners.map(
				(_, k) => t.corners[(((k - orient) % 6) + 6) % 6]
			);
			if (turned.every((c, k) => (c === 'sea') === !ks.includes(k))) {
				return { id: t.id, orient };
			}
		}
	}
	return undefined;
}

/**
 * A two-player game in which nothing is pending and seat 1 (`state.seats[0]`) holds the Islanders with an empty mat and
 * these territory tiles in their supply.
 * @param {number[]} tiles
 */
function game(tiles) {
	const { state: started, random } = startedGame(2, PP);
	const state = /** @type {any} */ (structuredClone(started));
	state.pending.length = 0;
	const seat = state.seats[0];
	seat.civs = ['islanders'];
	state.supply.civs = state.supply.civs.filter(
		(/** @type {string} */ civ) => civ !== 'islanders'
	);
	seat.civData.islanders = { hexes: Array(6).fill(null) };
	seat.territoryTiles = [...tiles];
	return { state, random };
}

/** @param {any} state @param {any} random @param {any[]} ops */
function pushed(state, random, ops) {
	const next = structuredClone(state);
	push(next, next.pending, ops);
	run(next, random);
	return next;
}

const decisionOf = (/** @type {any} */ state, /** @type {string} */ kind) =>
	openDecisions(state).find((d) => d.kind === kind);

/** The answers of the open decision of a kind. */
const answersOf = (/** @type {any} */ state, /** @type {string} */ kind) =>
	DECISIONS[kind].answers(state, decisionOf(state, kind));

const incomeOp = (/** @type {number} */ turn) => ({
	player: 1,
	kind: 'civIncome',
	civ: 'islanders',
	turn,
	origin: 'civ',
});

test('the Islanders start with an empty mat and 4 territory tiles, at setup (R113)', () => {
	for (const version of /** @type {const} */ (['original', 'current'])) {
		const { state } = startedGame(2, {
			civs: ['islanders', 'leaders'],
			version,
			...PP,
		});
		const seat = /** @type {any} */ (state.seats[0]);
		assert.equal(seat.territoryTiles.length, 4, version);
		assert.deepEqual(
			seat.civData.islanders,
			{ hexes: Array(6).fill(null) },
			version
		);
		assert.equal(state.seats[1].territoryTiles.length, 0, version);
	}
});

test('R115: a mat hex scores the sides that match the printed centre and the mat hexes beside it', () => {
	const { state } = game([]);
	// Hex 0 faces the centre across side 3, which runs over its corners 3 and 4: the centre's facing corners are 0 and 1.
	assert.deepEqual(ISLANDERS_CENTRE, [
		'mountain',
		'grassland',
		'grassland',
		'forest',
		'desert',
		'desert',
	]);
	for (const tile of TERRITORY_TILES) {
		for (let orient = 0; orient < 6; orient++) {
			const corner = (/** @type {number} */ k) =>
				tile.corners[(((k - orient) % 6) + 6) % 6];
			const expected =
				corner(3) === 'grassland' || corner(4) === 'mountain' ? 1 : 0;
			assert.equal(
				matchingSides(state, 'mat:1:0', tile.id, orient),
				expected,
				`tile ${tile.id} turned ${orient}`
			);
		}
	}
});

test('a mat hex also scores the mat tiles on either side of it, and none farther round', () => {
	const [a, b] = SEA;
	const { state } = game([]);
	state.seats[0].civData.islanders.hexes[0] = { tile: a, orient: 0 };
	// Hex 1 and hex 5 touch hex 0 through one side each, sea against sea; hexes 2 to 4 do not touch it.
	assert.equal(matchingSides(state, 'mat:1:1', b, 0), 1);
	assert.equal(matchingSides(state, 'mat:1:5', b, 0), 1);
	for (const far of [2, 3, 4]) {
		assert.equal(
			matchingSides(state, `mat:1:${far}`, b, 0),
			0,
			`hex ${far}`
		);
	}
});

test('on income turns 2-5 the Islanders may explore one tile onto the mat: its VP and its benefit, no outpost', () => {
	const [sea] = SEA;
	const { state, random } = game([sea]);
	const since = state.seq;
	const asked = pushed(state, random, [incomeOp(2)]);
	const offer = /** @type {any} */ (decisionOf(asked, 'chooseOption'));
	assert.equal(offer.purpose, 'islandersExplore');
	assert.deepEqual(offer.options[0], []);
	assert.deepEqual(offer.options[1], [{ explore: { mat: true } }]);

	const choosing = answer(asked, random, 1, 'chooseOption', { option: 1 });
	const decision = /** @type {any} */ (decisionOf(choosing, 'chooseExplore'));
	assert.equal(decision.mat, true);
	// Only the six mat hexes are offered, never a hex of the board.
	const answers = answersOf(choosing, 'chooseExplore');
	assert.ok(answers.length > 0);
	assert.ok(
		answers.every((/** @type {any} */ a) => a.hex.startsWith('mat:1:'))
	);

	const explored = answer(choosing, random, 1, 'chooseExplore', {
		tile: sea,
		hex: 'mat:1:2',
		orient: 0,
	});
	const seat = explored.seats[0];
	assert.deepEqual(seat.civData.islanders.hexes[2], { tile: sea, orient: 0 });
	assert.deepEqual(seat.territoryTiles, []);
	const events = explored.events.filter(
		(/** @type {any} */ e) => e.type === 'explored' && e.seq > since
	);
	assert.equal(events.length, 1);
	assert.equal(events[0].hex, 'mat:1:2');
	assert.equal(events[0].vp, 0);
});

test('with no tile in their supply, or a full mat, the Islanders are asked nothing', () => {
	const { state, random } = game([]);
	assert.deepEqual(openDecisions(pushed(state, random, [incomeOp(2)])), []);
	const [sea] = SEA;
	const full = game([sea]);
	full.state.seats[0].civData.islanders.hexes = Array(6).fill({
		tile: sea,
		orient: 0,
	});
	assert.deepEqual(
		openDecisions(pushed(full.state, full.random, [incomeOp(2)])),
		[]
	);
});

test('any explore may target a mat hex, along with the board (03 §1.3)', () => {
	const [sea] = SEA;
	const { state, random } = game([sea]);
	const next = resolveEffects(state, 1, [{ explore: {} }], random);
	const decision = /** @type {any} */ (decisionOf(next, 'chooseExplore'));
	void decision;
	const hexes = new Set(
		answersOf(next, 'chooseExplore').map((/** @type {any} */ a) => a.hex)
	);
	assert.ok([...hexes].some((hex) => String(hex).startsWith('mat:1:')));
	assert.ok([...hexes].some((hex) => !String(hex).startsWith('mat:')));
});

test('the final income turn: 4 VP for each mat tile with only sea on its three outward sides (03 §1.3)', () => {
	const [sea] = SEA;
	// Land at corners 3 and 4 only: inward for hex 0, whose outward sides run over the corners 5, 0, 1 and 2.
	const inward = /** @type {any} */ (
		landAt([3]) ?? landAt([4]) ?? landAt([3, 4])
	);
	assert.ok(inward, 'a tile with land only at corners 3 and 4');
	const outward = /** @type {any} */ (
		landAt([3]) ?? landAt([2]) ?? landAt([2, 3])
	);
	assert.ok(outward, 'a tile with land only at corners 2 and 3');
	const { state, random } = game([]);
	const hexes = state.seats[0].civData.islanders.hexes;
	hexes[0] = { tile: inward.id, orient: inward.orient };
	hexes[1] = { tile: sea, orient: 0 };
	hexes[2] = { tile: outward.id, orient: outward.orient };
	const before = state.seats[0].vp;
	// No tile left to explore, so only the score runs.
	const scored = pushed(state, random, [incomeOp(5)]);
	// Hex 0 and hex 1 count; hex 2 has land on its outward side (its outward corners are 1 to 4).
	assert.equal(scored.seats[0].vp, before + 4 * 2);
	// Not on turn 4.
	assert.equal(pushed(state, random, [incomeOp(4)]).seats[0].vp, before);
});

test('gained mid-game, the Islanders may be discarded, or kept to place up to 4 tiles on the mat for no VP and no benefit (R113)', () => {
	const [a, b] = SEA;
	const { state, random } = game([]);
	state.seats[0].civs = ['leaders'];
	delete state.seats[0].civData.islanders;
	state.supply.civs = [
		'islanders',
		...state.supply.civs.filter(
			(/** @type {string} */ c) => c !== 'islanders'
		),
	];
	const gained = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(gained.seats[0].civs, ['leaders', 'islanders']);
	// Discarded, they give nothing; only kept do they gain their tiles.
	assert.equal(gained.seats[0].territoryTiles.length, 0);
	const offered = /** @type {any} */ (decisionOf(gained, 'chooseOption'));
	assert.equal(offered.purpose, 'islandersDiscard');

	// Keep them: asked to place, each time with the choice to stop.
	const kept = answer(gained, random, 1, 'chooseOption', { option: 0 });
	assert.equal(kept.seats[0].territoryTiles.length, 4);
	const place = /** @type {any} */ (decisionOf(kept, 'chooseOption'));
	assert.equal(place.purpose, 'islandersPlace');
	const choosing = answer(kept, random, 1, 'chooseOption', { option: 1 });
	const decision = /** @type {any} */ (decisionOf(choosing, 'chooseExplore'));
	assert.equal(decision.free, true);
	const before = choosing.seats[0].vp;
	const first = choosing.seats[0].territoryTiles[0];
	const placed = answer(choosing, random, 1, 'chooseExplore', {
		tile: first,
		hex: 'mat:1:0',
		orient: 0,
	});
	assert.equal(placed.seats[0].vp, before);
	assert.equal(placed.seats[0].civData.islanders.hexes[0].tile, first);
	// Asked again, and declining stops it.
	const again = /** @type {any} */ (decisionOf(placed, 'chooseOption'));
	assert.equal(again.purpose, 'islandersPlace');
	const stopped = answer(placed, random, 1, 'chooseOption', { option: 0 });
	assert.deepEqual(openDecisions(stopped), []);
	assert.equal(stopped.seats[0].territoryTiles.length, 3);
	void a;
	void b;
	void play;
});
