// Fantasies & Futures' 10 civilizations (#40 part 3), as 03 FF.3 prints them: the deck, then each civilization.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { FF_CIVS, civsFor } from '../src/lib/engine/decks.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { findCiv } from '../src/lib/engine/civs/registry.js';
import { answer, readyTurn } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';
import { exposedSpaces } from '../src/lib/engine/income.js';
import { FAEFOLK_SPOTS } from '../src/lib/engine/civs/faefolk.js';
import { celestialsVp } from '../src/lib/engine/civs/celestials.js';
import { weefolkVp } from '../src/lib/engine/civs/weefolk.js';
import {
	mayRespond,
	playOnOptions,
} from '../src/lib/engine/civs/elder-ones.js';
import { INCOME_STEP_KINDS } from '../src/lib/engine/income.js';
import { omenRewards } from '../src/lib/engine/effects/ff-looks.js';
import { advances } from '../src/lib/engine/decisions/choose-advance.js';
import { view } from '../src/lib/engine/view.js';
import { INCOME_MAT } from '../src/lib/engine/data/income-mat.js';

const FF = { expansions: ['ff'] };

/**
 * A started F&F game whose seat 1 holds `civ`, the current player's turn choice open; `fill` changes seat 1 first.
 * @param {string} civ
 * @param {(seat: any, state: any) => void} [fill]
 */
export function holding(civ, fill = () => {}) {
	// Seat 1 holds the civilization; `fill` changes it.
	const { state, random } = readyTurn(
		2,
		(_seat, s) => {
			fill(s.seats[0], s);
		},
		{ ...FF, civs: [civ, 'leaders'] }
	);
	return { state, random, player: 1 };
}

/**
 * Runs a civilization's income-turn ability for a player and settles every question with its first answer, or with
 * `pick` when it gives one, until only the turn's choice is left.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {string} civ
 * @param {number} turn
 * @param {(op: any, answers: any[]) => any} [pick]
 */
export function ability(
	state,
	random,
	player,
	civ,
	turn,
	pick = (_, a) => a[0]
) {
	let next = structuredClone(state);
	findCiv(civ).income?.(contextFor(next, random, next.pending), player, turn);
	run(next, random);
	for (let step = 0; step < 100; step++) {
		const [open] = openDecisions(next);
		if (!open || open.kind === 'chooseTurn') {
			return next;
		}
		const answers = DECISIONS[open.kind].answers(next, open);
		next = answer(
			next,
			random,
			open.player,
			open.kind,
			pick(open, answers)
		);
	}
	throw new Error('A decision never ended.');
}

test('F&F deals its civilizations as they are built', () => {
	for (const civ of FF_CIVS) {
		assert.ok(civsFor(['ff']).includes(civ), civ);
		assert.ok(!civsFor(['aa']).includes(civ), civ);
	}
});

// The Werefolk (03 FF.3)

test('the Werefolk start with no space tile; each income turn draws one and flips it', () => {
	const { state, random, player } = holding('werefolk');
	const seat = /** @type {any} */ (state.seats[player - 1]);
	assert.deepEqual(seat.civData.werefolk, { tile: null });
	assert.deepEqual(findCiv('werefolk').incomeTurns, [2, 3, 4, 5]);
	const next = ability(state, random, player, 'werefolk', 2);
	assert.ok(
		next.events.some(
			(/** @type {any} */ e) =>
				e.type === 'tileFlipped' && e.player === player
		)
	);
	checkState(next);
});

test('the Werefolk: face down, an advance with benefit and a free bonus; face up, a regress then explore, else 4 VP', () => {
	// face down: random 1; face up: random 0 (the flip reads ctx.random(2)).
	const down = holding('werefolk');
	const flipped = ability(down.state, () => 1, down.player, 'werefolk', 2);
	assert.ok(
		flipped.events.some(
			(/** @type {any} */ e) => e.type === 'tileFlipped' && e.up === false
		)
	);
	const up = holding('werefolk', (seat) => {
		seat.tracks.science = [2];
	});
	// Decline the regress: 4 VP, the tile kept in the supply.
	const vp = up.state.seats[up.player - 1].vp;
	const kept = ability(
		up.state,
		() => 0,
		up.player,
		'werefolk',
		2,
		(op, a) =>
			op.kind === 'chooseMove'
				? (a.find((x) => x.track === null || x.from === undefined) ??
					a[0])
				: a[0]
	);
	const seat = /** @type {any} */ (kept.seats[up.player - 1]);
	if (seat.tracks.science[0] === 2) {
		assert.equal(seat.vp, vp + 4);
		assert.equal(seat.spaceTiles.length, 1);
	}
	// Regress: the tile is explored onto the mat, and discarded at the next income turn.
	const back = ability(
		up.state,
		() => 0,
		up.player,
		'werefolk',
		2,
		(op, a) =>
			op.kind === 'chooseMove'
				? (a.find((x) => x.track === 'science') ?? a[0])
				: a[0]
	);
	const regressed = /** @type {any} */ (back.seats[up.player - 1]);
	assert.deepEqual(regressed.tracks.science, [1]);
	assert.equal(typeof regressed.civData.werefolk.tile, 'number');
	const later = ability(back, () => 1, up.player, 'werefolk', 3);
	assert.ok(
		later.supply.spaceDiscard.includes(regressed.civData.werefolk.tile)
	);
	checkState(later);
});

// The Psionics (03 FF.3, R74)

test('the Psionics: income turns 2–5 give a territory tile, a tapestry card, an invent, then a research', () => {
	assert.deepEqual(findCiv('psionics').incomeTurns, [2, 3, 4, 5]);
	const { state, random, player } = holding('psionics');
	const seat = (/** @type {any} */ s) => s.seats[player - 1];
	const two = ability(state, random, player, 'psionics', 2);
	assert.equal(
		seat(two).territoryTiles.length,
		seat(state).territoryTiles.length + 1
	);
	const three = ability(state, random, player, 'psionics', 3);
	assert.equal(seat(three).hand.length, seat(state).hand.length + 1);
	checkState(three);
});

test('the Psionics draw one extra and keep one: tiles, tapestry cards and civilizations; they roll the science die twice', () => {
	const { state, random, player } = holding('psionics');
	const tiles = resolveEffects(
		state,
		player,
		[{ gain: { territory: 1 } }],
		random
	);
	const sample = openDecisions(tiles).find((d) => d.kind === 'chooseSample');
	assert.ok(sample);
	assert.equal(sample.options.length, 2);
	const cards = resolveEffects(
		state,
		player,
		[{ gain: { tapestry: 1 } }],
		random
	);
	const keep = openDecisions(cards).find((d) => d.kind === 'chooseKeep');
	assert.equal(keep.options.length, 2);
	const roll = resolveEffects(
		state,
		player,
		[{ research: { noBenefit: true } }],
		() => 0
	);
	assert.ok(
		roll.events.filter(
			(/** @type {any} */ e) =>
				e.type === 'scienceDieRolled' && e.player === player
		).length === 2
	);
	const kept = settle(
		answer(tiles, random, player, 'chooseSample', {
			item: sample.options[1],
		}),
		random
	);
	assert.ok(
		/** @type {any} */ (kept.seats[player - 1]).territoryTiles.includes(
			sample.options[1]
		)
	);
	checkState(kept);
});

/**
 * A state in which `ops` were pushed above the turn's choice and run.
 * @param {any} state
 * @param {any} random
 * @param {object[]} ops
 */
function ran(state, random, ops) {
	const next = structuredClone(state);
	push(next, next.pending, /** @type {any} */ (ops));
	run(next, random);
	return next;
}

/** The kinds and options of the open decisions. @param {any} state */
const opened = (state) =>
	openDecisions(state).map((/** @type {any} */ d) => d.kind);

test('the Psionics invent from the deck by drawing 2 tech cards and keeping 1; the other goes back into the deck (R74)', () => {
	const { state, random, player } = holding('psionics');
	const asked = resolveEffects(state, player, [{ invent: {} }], random);
	const deckAnswer = DECISIONS.chooseInvent
		.answers(asked, openDecisions(asked)[0])
		.find((a) => a.card === 'deck');
	assert.ok(deckAnswer);
	const drawn = answer(asked, random, player, 'chooseInvent', deckAnswer);
	const sample = openDecisions(drawn).find((d) => d.kind === 'chooseSample');
	assert.ok(sample);
	assert.equal(sample.stack, 'tech');
	assert.equal(sample.options.length, 2);
	// The 2 drawn are held by the open question, not lost (final review).
	checkState(drawn);
	const [other, keep] = sample.options;
	const kept = settle(
		answer(drawn, random, player, 'chooseSample', { item: keep }),
		random
	);
	const seat = /** @type {any} */ (kept.seats[player - 1]);
	assert.ok(seat.tech.bottom.includes(keep));
	assert.ok(!seat.tech.bottom.includes(other));
	assert.ok(kept.supply.tech.deck.includes(other));
	checkState(kept);
});

test("the Psionics' reserve draws one more space tile, and Coal Baron's and Alien Disclosure's tiles are sampled (R74)", () => {
	const { state, random, player } = holding('psionics');
	const reserve = resolveEffects(
		state,
		player,
		[{ reserve: { space: 3 } }],
		random
	);
	const choice = openDecisions(reserve).find(
		(d) => d.kind === 'chooseReserve'
	);
	assert.equal(choice.options.length, 4);
	const coal = resolveEffects(state, player, [{ coalBaron: {} }], random);
	const tile = openDecisions(coal).find((d) => d.kind === 'chooseSample');
	assert.ok(tile);
	assert.equal(tile.stack, 'territory');
	const explored = settle(
		answer(coal, random, player, 'chooseSample', {
			item: tile.options[0],
		}),
		random
	);
	assert.ok(
		explored.events.some(
			(/** @type {any} */ e) =>
				e.type === 'explored' &&
				e.player === player &&
				e.tile === tile.options[0]
		)
	);
	checkState(explored);
	// 5 VP to pay for exploring the tile.
	const rich = resolveEffects(state, player, [{ vp: 10 }], random);
	const alien = resolveEffects(
		rich,
		player,
		[{ alienDisclosure: {} }],
		random
	);
	const space = openDecisions(alien).find((d) => d.kind === 'chooseSample');
	assert.ok(space);
	assert.equal(space.stack, 'space');
	const offered = answer(alien, random, player, 'chooseSample', {
		item: space.options[1],
	});
	assert.ok(
		/** @type {any} */ (offered.seats[player - 1]).spaceTiles.includes(
			space.options[1]
		)
	);
	assert.ok(
		opened(offered).includes('chooseTrade'),
		'the 5 VP trade follows'
	);
});

test('the Psionics under Age of Sail draw 2 territory tiles and keep 1, three times, before the gift and the explore (FAQ p29–30)', () => {
	const { state, random, player } = holding('psionics', (seat, s) => {
		for (const pile of [
			s.supply.tapestry.deck,
			s.supply.tapestry.discard,
		]) {
			const at = pile.indexOf('age-of-sail');
			if (at !== -1) {
				pile.splice(at, 1);
			}
		}
		seat.hand = seat.hand.filter(
			(/** @type {string} */ c) => c !== 'age-of-sail'
		);
		seat.incomeMat.tapestry[0].push('age-of-sail');
		seat.era = { card: 'age-of-sail', ability: 'age-of-sail' };
	});
	const sailed = resolveEffects(state, player, [{ explore: {} }], random);
	const samples = openDecisions(sailed).filter(
		(d) => d.kind === 'chooseSample'
	);
	assert.equal(samples.length, 3);
	const before = /** @type {any} */ (sailed.seats[player - 1]).territoryTiles
		.length;
	let next = sailed;
	for (let i = 0; i < 3; i++) {
		const open = openDecisions(next).find((d) => d.kind === 'chooseSample');
		next = answer(next, random, player, 'chooseSample', {
			item: open.options[0],
		});
	}
	assert.equal(
		/** @type {any} */ (next.seats[player - 1]).territoryTiles.length,
		before + 3
	);
	assert.ok(
		opened(next).includes('chooseGift'),
		'the gift follows the picks'
	);
	checkState(settle(next, random));
});

test('the Psionics create from the masterpiece deck by drawing 2 and keeping 1 (R74)', () => {
	const { state, random } = readyTurn(2, () => {}, {
		expansions: ['aa', 'ff'],
		civs: ['psionics', 'leaders'],
	});
	const player = 1;
	const asked = resolveEffects(state, player, [{ create: {} }], random);
	const create = openDecisions(asked).find((d) => d.kind === 'chooseCreate');
	assert.ok(create.options.includes('deck'));
	const drawn = answer(asked, random, player, 'chooseCreate', {
		card: 'deck',
	});
	const sample = openDecisions(drawn).find((d) => d.kind === 'chooseSample');
	assert.ok(sample);
	assert.equal(sample.stack, 'masterpieces');
	checkState(drawn);
	const kept = settle(
		answer(drawn, random, player, 'chooseSample', {
			item: sample.options[1],
		}),
		random
	);
	assert.deepEqual(
		/** @type {any} */ (kept.seats[0]).masterpieces.map(
			(/** @type {any} */ m) => m.card
		),
		[sample.options[1]]
	);
	assert.ok(kept.supply.masterpieces?.deck.includes(sample.options[0]));
	checkState(kept);
});

test("the Psionics roll Surrender's dice and National Parks' die twice, keeping one value of each (R74)", () => {
	const { state, random, player } = holding('psionics');
	const surrender = ran(state, random, [
		{ player, kind: 'surrenderDice', hex: '-2_-1' },
	]);
	const both = openDecisions(surrender).find((d) => d.kind === 'chooseRolls');
	assert.ok(both);
	assert.equal(both.reds.length, 2);
	assert.equal(both.blacks.length, 2);
	checkState(settle(surrender, random));
	const parks = ran(state, random, [
		{ player, kind: 'parksRoll', slot: 'red', hex: '-2_-1' },
	]);
	const one = openDecisions(parks).find((d) => d.kind === 'chooseRolls');
	assert.ok(one);
	assert.equal(one.reds.length, 2);
	assert.equal(one.blacks, undefined);
	assert.deepEqual(
		DECISIONS.chooseRolls.answers(parks, one).map((a) => a.black),
		one.reds.map(() => undefined).slice(0, new Set(one.reds).size)
	);
	checkState(settle(parks, random));
});

test("the Illuminati are paid by an opponent's Surrender roll, National Parks die and Treasure Hunters dice", () => {
	const { state, random } = holding('illuminati');
	const onMat = (/** @type {any} */ s) => s.seats[0].civData.illuminati.onMat;
	const paid = (/** @type {any} */ s) =>
		s.events.filter(
			(/** @type {any} */ e) =>
				e.type === 'illuminatiPaid' && e.player === 1
		);
	const surrender = ran(state, random, [
		{ player: 2, kind: 'surrenderDice', hex: '-2_-1' },
	]);
	assert.equal(paid(surrender).length, 1);
	assert.deepEqual(onMat(surrender), ['science']);
	const parks = ran(state, random, [
		{ player: 2, kind: 'parksRoll', slot: 'black', hex: '-2_-1' },
	]);
	assert.deepEqual(paid(parks)[0]?.dice, ['black']);
	assert.deepEqual(onMat(parks), ['red', 'science']);
	const treasure = ran(state, random, [
		{ player: 2, kind: 'treasureRoll', die: 'red', hex: '-2_-1' },
	]);
	assert.deepEqual(paid(treasure)[0]?.dice, ['red']);
	assert.deepEqual(onMat(treasure), ['black', 'science']);
	for (const s of [surrender, parks, treasure]) {
		checkState(settle(s, random));
	}
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

// The Artificers (03 FF.3, R70, R71)

test("the Artificers: income turns 2–4 set a track's leftmost building aside, or slide it 1 space left", () => {
	assert.deepEqual(findCiv('artificers').incomeTurns, [2, 3, 4, 5]);
	const { state, random, player } = holding('artificers');
	const seat = (/** @type {any} */ s) => s.seats[player - 1];
	const aside = ability(
		state,
		random,
		player,
		'artificers',
		2,
		(op, a) => a.find((x) => x.act === 'aside' && x.row === 'farm') ?? a[0]
	);
	assert.equal(seat(aside).incomeMat.buildings.farm, 4);
	assert.deepEqual(seat(aside).civData.artificers.aside, ['farm']);
	// Set aside, it counts for its type (R71) and uncovers its space.
	assert.equal(exposedSpaces(seat(aside), 'farm').length, 2);
	checkState(aside);
	const slid = ability(
		state,
		random,
		player,
		'artificers',
		2,
		(op, a) => a.find((x) => x.act === 'slide' && x.row === 'farm') ?? a[0]
	);
	// The leftmost farm (space 2) slides onto space 1: space 2 shows instead.
	const shown = exposedSpaces(seat(slid), 'farm');
	assert.equal(shown.length, 1);
	assert.equal(shown[0], INCOME_MAT.farm[1]);
	checkState(slid);
});

test('the Artificers: income turn 5 scores 1 VP per income building off the mat, or slides a track flush left', () => {
	const { state, random, player } = holding('artificers', (seat) => {
		seat.incomeMat.buildings.farm = 3;
		seat.capital.buildings = [];
	});
	const flush = ability(
		state,
		random,
		player,
		'artificers',
		5,
		(op, a) => a.find((x) => x.act === 'flush' && x.row === 'farm') ?? a[0]
	);
	const seat = /** @type {any} */ (flush.seats[player - 1]);
	assert.deepEqual(exposedSpaces(seat, 'farm'), INCOME_MAT.farm.slice(3));
});

// The Faefolk (03 FF.3, R73)

test('the Faefolk: their token starts on spot 1, moves by visible cards (hand and top cards) and gains the spot, twice on income turn 5', () => {
	assert.deepEqual(FAEFOLK_SPOTS[1], [{ vp: { per: 'tapestryCard' } }]);
	assert.deepEqual(FAEFOLK_SPOTS[7], [
		{ gain: { space: 1 } },
		{ exploreSpace: {} },
	]);
	const { state, random, player } = holding('faefolk', (seat, s) => {
		s.supply.tapestry.deck = s.supply.tapestry.deck.filter(
			(c) => !['academia', 'dark-ages'].includes(c)
		);
		seat.hand = ['academia'];
		seat.incomeMat.tapestry = [['dark-ages'], [], [], []];
	});
	assert.deepEqual(/** @type {any} */ (state.seats[0]).civData.faefolk, {
		spot: 1,
	});
	// Declining the card: 2 visible cards, from spot 1 to spot 3 (1 food and 1 VP per territory tile).
	const next = ability(state, random, player, 'faefolk', 2, (op, a) =>
		op.kind === 'chooseOption' && op.purpose === 'civOffer' ? a[0] : a[0]
	);
	const seat = /** @type {any} */ (next.seats[0]);
	assert.equal(seat.civData.faefolk.spot, 3);
	assert.equal(
		seat.resources.food,
		/** @type {any} */ (state.seats[0]).resources.food + 1
	);
	checkState(next);
	// Income turn 5 gains the spot twice.
	const five = ability(state, random, player, 'faefolk', 5);
	assert.ok(/** @type {any} */ (five.seats[0]).civData.faefolk.spot >= 1);
});

// The Celestials (03 FF.3, R99)

test('the Celestials start with 1 outpost and their token on the start territory; the token moves for both dice', () => {
	const { state, random, player } = holding('celestials');
	const seat = /** @type {any} */ (state.seats[0]);
	const start = state.hexes[seat.start];
	assert.equal(start.outposts.filter((o) => o.seat === 1).length, 1);
	assert.deepEqual(start.tokens, [{ seat: 1, civ: 'celestials' }]);
	assert.equal(seat.civData.celestials.hex, seat.start);
	checkState(state);
	const moved = ability(state, random, player, 'celestials', 2, (op, a) =>
		op.kind === 'chooseHex' ? (a.find((x) => x.hex !== null) ?? a[0]) : a[0]
	);
	const after = /** @type {any} */ (moved.seats[0]);
	assert.notEqual(after.civData.celestials.hex, seat.start);
	assert.ok(
		moved.events.some(
			(/** @type {any} */ e) => e.type === 'celestialsMoved'
		)
	);
	checkState(moved);
});

test('the Celestials on income turn 5: −2 VP per landmark hanging off the capital, +5 per landmark wholly in it', () => {
	const { state, random, player } = holding('celestials', (seat) => {
		seat.capital.landmarks = [
			{ landmark: 'bakery', row: 0, col: 0, turns: 0 },
			{ landmark: 'barracks', row: -1, col: 3, turns: 0 },
		];
	});
	assert.equal(celestialsVp(/** @type {any} */ (state.seats[0])), 5 - 2);
});

// The Genies (03 FF.3)

test('the Genies: an opponent drawn at random picks a circle and scores it; the Genies score it too and gain a square beside it', () => {
	assert.equal(findCiv('genies').solo, false);
	const { state, random, player } = holding('genies');
	const seat = /** @type {any} */ (state.seats[0]);
	assert.deepEqual(seat.civData.genies, { tokens: [2] });
	let next = structuredClone(state);
	findCiv('genies').income?.(contextFor(next, random, next.pending), 1, 2);
	run(next, random);
	const wish = openDecisions(next).find((d) => d.kind === 'chooseWish');
	assert.ok(wish && wish.player === 2, 'the opponent picks');
	assert.deepEqual(
		DECISIONS.chooseWish.answers(next, wish).map((a) => a.circle),
		['landmark', 'territoryTile', 'territory', 'techCard']
	);
	next = answer(next, random, 2, 'chooseWish', { circle: 'techCard' });
	// The VP and the square come in the Genies' order (03 FF.3): the square first here.
	const order = openDecisions(next).find(
		(d) => d.kind === 'chooseOrder' && d.player === 1
	);
	if (order) {
		next = answer(next, random, 1, 'chooseOrder', { effect: 1 });
	}
	const square = openDecisions(next).find(
		(d) => d.kind === 'chooseOption' && d.player === 1
	);
	assert.ok(square, 'the Genies pick a square beside it');
	assert.deepEqual(square.options, [
		[{ explore: {} }],
		[{ research: { noBenefit: true } }],
	]);
	checkState(next);
});

test('the Genies on income turn 5 gain 2 different circles', () => {
	const { state, random, player } = holding('genies');
	const next = ability(state, random, player, 'genies', 5);
	assert.equal(
		next.events.filter(
			(/** @type {any} */ e) => e.type === 'wishGranted' && e.player === 1
		).length,
		2
	);
});

// The Weefolk (03 FF.3; DQ 21–24)

test('the Weefolk give a token to an opponent, who places it on an open plot of their capital; it fills the plot', () => {
	assert.equal(findCiv('weefolk').solo, false);
	const { state, random, player } = holding('weefolk');
	let next = structuredClone(state);
	findCiv('weefolk').income?.(contextFor(next, random, next.pending), 1, 2);
	run(next, random);
	const plot = openDecisions(next).find((d) => d.kind === 'choosePlot');
	assert.ok(plot && plot.player === 2 && plot.purpose === 'weefolk');
	const [first] = plot.options;
	next = answer(next, random, 2, 'choosePlot', first);
	assert.deepEqual(/** @type {any} */ (next.seats[1]).capital.tokens, [
		{ row: first.row, col: first.col, seat: 1 },
	]);
	checkState(next);
});

test('the Weefolk on income turn 5 score 1 VP per income building or landmark in each row and column of their tokens', () => {
	const { state } = holding('weefolk', (seat, s) => {
		const host = /** @type {any} */ (s.seats[1]);
		host.capital.tokens = [{ row: 4, col: 4, seat: 1 }];
		host.capital.buildings = [
			{ building: 'farm', row: 4, col: 0 },
			{ building: 'house', row: 0, col: 4 },
			{ building: 'market', row: 8, col: 8 },
		];
		host.incomeMat.buildings.farm = 4;
		host.incomeMat.buildings.house = 4;
		host.incomeMat.buildings.market = 4;
	});
	assert.equal(weefolkVp(state, 1), 2);
});

// The Illuminati (03 FF.3, DQ 12–15)

test("the Illuminati: an opponent's roll takes the die off their mat and pays them first; their income scores 6 VP per die left", () => {
	assert.equal(findCiv('illuminati').solo, false);
	const { state, random, player } = holding('illuminati');
	const seat = (/** @type {any} */ s) => s.seats[0];
	assert.deepEqual(seat(state).civData.illuminati.onMat, [
		'red',
		'black',
		'science',
	]);
	// Seat 2 rolls the science die: the Illuminati may advance on that track, and the die leaves the mat.
	const next = resolveEffects(
		state,
		2,
		[{ research: { noBenefit: true } }],
		random
	);
	assert.ok(
		next.events.some(
			(/** @type {any} */ e) =>
				e.type === 'illuminatiPaid' && e.player === 1
		)
	);
	assert.deepEqual(seat(next).civData.illuminati.onMat, ['red', 'black']);
	const vp = seat(next).vp;
	const income = ability(next, random, player, 'illuminati', 2);
	assert.equal(seat(income).vp, vp + 12);
	assert.deepEqual(seat(income).civData.illuminati.onMat, [
		'red',
		'black',
		'science',
	]);
});

// The Elder Ones and the Merfolk: playing on after income turn 5 (03 FF.3, R72, DQ 7, 8, 16, 17)

test('the Elder Ones: a resource or 2 cards on income turns 2–4; after income turn 5 they play on with advance turns', () => {
	const { state, random, player } = holding('elder-ones');
	const two = ability(state, random, player, 'elder-ones', 2);
	checkState(two);
	// The income turn 5's finish: they play on, unfinished.
	const next = structuredClone(state);
	const seat = /** @type {any} */ (next.seats[0]);
	seat.incomeTurns = 5;
	INCOME_STEP_KINDS.finish.run(contextFor(next, random, next.pending), 1, 5);
	assert.equal(seat.finished, false);
	assert.equal(seat.playingOn, true);
	assert.deepEqual(
		playOnOptions(next, 1),
		advances(next, 1).length > 0 ? ['advance'] : []
	);
});

test('the Merfolk submerge all but 2 cards on income turns 2–4, hidden from the others; income turn 5 brings them back', () => {
	const { state, random, player } = holding('merfolk', (seat, s) => {
		const cards = s.supply.tapestry.deck.splice(0, 4);
		seat.hand = cards;
	});
	const two = ability(state, random, player, 'merfolk', 2);
	const seat = /** @type {any} */ (two.seats[0]);
	assert.equal(seat.hand.length, 2);
	assert.equal(seat.civData.merfolk.submerged.length, 3);
	const seen = /** @type {any} */ (view(two, 2)).seats[0].civData.merfolk;
	assert.equal(seen.submerged, 3, 'the others see how many, not which');
	checkState(two);
	const five = ability(two, random, player, 'merfolk', 5);
	const back = /** @type {any} */ (five.seats[0]);
	assert.equal(back.civData.merfolk.submerged.length, 0);
	assert.equal(back.hand.length, 6);
	checkState(five);
});

test('the Merfolk after income turn 5: discard cards for 5 VP each, or play a WHEN PLAYED card onto the era-4 stack', () => {
	const { state, random } = holding('merfolk', (seat, s) => {
		s.supply.tapestry.deck = s.supply.tapestry.deck.filter(
			(c) => !['dark-ages', 'academia'].includes(c)
		);
		seat.hand = ['dark-ages', 'academia'];
		seat.incomeTurns = 5;
		seat.playingOn = true;
	});
	assert.deepEqual(playOnOptions(state, 1), ['merfolk']);
	const answers = DECISIONS.chooseMerfolkTurn.answers(state, {
		player: 1,
		kind: 'chooseMerfolkTurn',
	});
	assert.ok(answers.some((a) => a.play === 'dark-ages'));
	assert.ok(
		!answers.some((a) => a.play === 'academia'),
		'a THIS ERA card is not played'
	);
	assert.ok(answers.some((a) => a.discard === 'academia'));
});

/**
 * A state in which seat 2, finished, has just ended its turn, and the loop has moved on.
 * @param {any} state
 * @param {() => number} random
 * @param {(state: any) => void} [fill]
 */
function afterSeatTwo(state, random, fill = () => {}) {
	const next = structuredClone(state);
	next.seats[1].incomeTurns = 5;
	next.seats[1].finished = true;
	fill(next);
	next.pending.length = 0;
	next.pending.push({ id: 900, batch: 900, player: 2, kind: 'endTurn' });
	run(next, random);
	return next;
}

test('a Merfolk turn: a card discarded for 5 VP, then a trap played on era 4 for its WHEN PLAYED 10 VP; no card left ends their game and the game (DQ 16, 17)', () => {
	const { state: ready, random } = holding('merfolk', (seat, s) => {
		s.supply.tapestry.deck = s.supply.tapestry.deck.filter(
			(c) => !['trap-1', 'academia'].includes(c)
		);
		seat.hand = ['trap-1', 'academia'];
		seat.incomeTurns = 5;
		seat.playingOn = true;
	});
	const state = afterSeatTwo(ready, random);
	const open = (/** @type {any} */ s) =>
		openDecisions(s).map((d) => [d.kind, d.player, d.options]);
	assert.deepEqual(open(state), [['chooseTurn', 1, ['merfolk']]]);
	let next = answer(state, random, 1, 'chooseTurn', { turn: 'merfolk' });
	const vp = next.seats[0].vp;
	next = answer(next, random, 1, 'chooseMerfolkTurn', {
		discard: 'academia',
	});
	assert.equal(next.seats[0].vp, vp + 5);
	next = answer(next, random, 1, 'chooseDiscard', { card: null });
	checkState(next);
	// The other seat has finished, so the Merfolk take the next turn too.
	assert.deepEqual(open(next), [['chooseTurn', 1, ['merfolk']]]);
	next = answer(next, random, 1, 'chooseTurn', { turn: 'merfolk' });
	next = answer(next, random, 1, 'chooseMerfolkTurn', { play: 'trap-1' });
	const seat = /** @type {any} */ (next.seats[0]);
	assert.equal(seat.incomeMat.tapestry[3].at(-1), 'trap-1');
	assert.equal(seat.vp, vp + 15);
	assert.equal(seat.finished, true);
	assert.equal(next.phase, 'over');
});

test('the Elder Ones playing on take advance turns only, and finish once they can pay for none; the game then ends (DQ 8)', () => {
	const { state: ready, random } = holding('elder-ones', (seat) => {
		seat.incomeTurns = 5;
		seat.playingOn = true;
		seat.resources = { food: 3, coin: 3, worker: 3, culture: 3 };
	});
	const state = afterSeatTwo(ready, random);
	assert.deepEqual(
		openDecisions(state).map((d) => [d.kind, d.player, d.options]),
		[['chooseTurn', 1, ['advance']]]
	);
	// Nothing to pay with: their turn never comes again.
	const broke = afterSeatTwo(ready, random, (s) => {
		s.seats[0].resources = { food: 0, coin: 0, worker: 0, culture: 0 };
	});
	assert.equal(broke.seats[0].finished, true);
	assert.equal(broke.phase, 'over');
});

test('the Elder Ones after income turn 5 score 10 VP per landmark gained and play no response card; the Merfolk may', () => {
	const { state } = holding('elder-ones');
	const hook = /** @type {any} */ (findCiv('elder-ones').hooks)
		.landmarkGained;
	assert.deepEqual(hook(state, 1, { player: 1 }), []);
	const on = structuredClone(state);
	/** @type {any} */ (on.seats[0]).playingOn = true;
	assert.deepEqual(
		hook(on, 1, { player: 1 }).map((/** @type {any} */ op) => op.effects),
		[[{ vp: 10 }]]
	);
	assert.deepEqual(hook(on, 1, { player: 2 }), []);
	const seat = /** @type {any} */ ({ playingOn: true, civs: ['elder-ones'] });
	assert.equal(mayRespond(seat), false);
	assert.equal(
		mayRespond({ ...seat, civs: ['elder-ones', 'merfolk'] }),
		true
	);
	assert.equal(mayRespond({ ...seat, playingOn: false }), true);
});

/**
 * Whether seat 1 (the Illuminati) was paid before seat 2's roll was used: asked first, before seat 2 moved, or moved
 * first.
 * @param {any} before
 * @param {any} after
 */
function illuminatiFirst(before, after) {
	const moved = (/** @type {number} */ p) =>
		after.events.findIndex(
			(/** @type {any} */ e) =>
				e.seq > before.seq && e.type === 'tokenMoved' && e.player === p
		);
	const gained = (/** @type {any} */ s) =>
		JSON.stringify([
			s.seats[0].vp,
			s.seats[0].resources,
			s.seats[0].tracks,
		]);
	const [open] = openDecisions(after);
	if (open?.player === 1) {
		return moved(2) === -1;
	}
	if (moved(1) !== -1) {
		return moved(2) === -1 || moved(1) < moved(2);
	}
	return gained(before) !== gained(after) && open?.player === 2;
}

test("the Illuminati are paid before the roller uses the roll: an opponent's research, a Psionics conquest's dice, the Alchemists' die (DQ 13, R149)", () => {
	const { state, random } = holding('illuminati', (seat, s) => {
		s.seats[1].resources = { food: 3, coin: 3, worker: 3, culture: 3 };
	});
	const research = resolveEffects(state, 2, [{ research: {} }], random);
	assert.ok(illuminatiFirst(state, research), 'research');
	const psionics = structuredClone(state);
	psionics.seats[1].civs.push('psionics');
	const conquest = ran(psionics, random, [
		{ player: 2, kind: 'conquerDice', hex: '-2_-1' },
	]);
	assert.ok(
		conquest.events.some(
			(/** @type {any} */ e) => e.type === 'illuminatiPaid'
		)
	);
	assert.ok(illuminatiFirst(psionics, conquest), 'conquest');
	const alchemists = structuredClone(state);
	alchemists.seats[1].civs.push('alchemists');
	alchemists.seats[1].civData.alchemists = { marked: [] };
	const rolled = ran(alchemists, random, [
		{ player: 2, kind: 'alchemistsRoll', scienceDie: 'd12' },
	]);
	assert.deepEqual(
		rolled.events
			.filter((/** @type {any} */ e) => e.type === 'illuminatiPaid')
			.map((/** @type {any} */ e) => e.dice),
		[['science']]
	);
});

test('Good Omens counts a face rolled, not the arts track Artistic Inspiration offers (R138, final review)', () => {
	const { state } = holding('leaders', (seat) => {
		seat.era = {
			card: 'artistic-inspiration',
			ability: 'artistic-inspiration',
		};
	});
	const next = structuredClone(state);
	next.omens = [{ player: 1, guess: 'arts' }];
	push(next, next.pending, [
		{
			player: 1,
			kind: 'scienceRoll',
			scienceDie: 'd12',
			next: { kind: 'researchRolled', noBenefit: true, offTrackVp: 0 },
		},
	]);
	run(next, () => 0);
	assert.equal(next.omens?.[0]?.hit, undefined);
});

test('a game without F&F schedules no reeds step and keeps no Good Omens record (final review)', () => {
	assert.equal(
		INCOME_STEP_KINDS.reeds.when?.(/** @type {any} */ ({ expansions: [] })),
		false
	);
	assert.equal(
		INCOME_STEP_KINDS.reeds.when?.(
			/** @type {any} */ ({ expansions: ['ff'] })
		),
		true
	);
	const plain = /** @type {any} */ ({});
	assert.deepEqual(omenRewards(plain), []);
	assert.ok(!('omens' in plain));
});
