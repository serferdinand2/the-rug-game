// Tests for the civilizations that act on the map and on outposts: Traders, Isolationists and Militants (#20, design §7, §8).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { conquerTargets } from '../src/lib/engine/map.js';
import { controlledTerritories } from '../src/lib/engine/control.js';
import { MAPS } from '../src/lib/engine/data/maps.js';
import { readyTurn, startedGame, answer } from './helpers/engine.mjs';

const VERSIONS = /** @type {const} */ (['original', 'current']);

/** Every space of a Militants row covered, or every space open. */
const COVERED = [true, true, true, true];
const OPEN = [false, false, false, false];

/**
 * Pushes operations for a copy of the state and runs them to the next decision.
 * @param {any} state
 * @param {any} random
 * @param {any[]} ops
 */
function pushed(state, random, ops) {
	const next = structuredClone(state);
	push(next, next.pending, ops);
	run(next, random);
	return next;
}

/**
 * A copy of a started game with nothing pending, every outpost cleared and every hand empty (so a conquest asks no
 * response), in which seat 1 holds the named civilizations, set up as at the start, and controls '-2_-2'. Only
 * '-2_-2' and the listed hexes stay explored (all printed territories on the small map).
 * @param {string[]} civs
 * @param {{ count?: number, explored?: string[], version?: 'original' | 'current' }} [options]
 * @returns {{ state: any, random: any }}
 */
function game(civs, { count = 2, explored = ['-2_-1'], version } = {}) {
	const { state: started, random } = startedGame(count, { version });
	const state = structuredClone(started);
	state.pending.length = 0;
	for (const [key, hex] of Object.entries(state.hexes)) {
		hex.outposts = [];
		if (key !== '-2_-2' && !explored.includes(key)) {
			/** @type {any} */ (hex).tile = null;
		}
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	for (const seat of state.seats) {
		seat.hand = [];
	}
	state.seats[0].civs = [...civs];
	return {
		state: pushed(
			state,
			random,
			civs.map((civ) => ({
				player: 1,
				kind: 'civSetup',
				civ,
				midGame: false,
			}))
		),
		random,
	};
}

/**
 * Explores hexes with territory tiles, unturned.
 * @param {any} state
 * @param {Record<string, number>} tiles - Hex to tile number
 */
function explore(state, tiles) {
	for (const [hex, tile] of Object.entries(tiles)) {
		state.hexes[hex].tile = tile;
		state.hexes[hex].orient = 0;
	}
}

/**
 * Explores hexes with territory tiles, each turned, and gives a seat an upright outpost on each.
 * @param {any} state
 * @param {number} seat
 * @param {[hex: string, tile: number, orient: number][]} layout
 */
function control(state, seat, layout) {
	for (const [hex, tile, orient] of layout) {
		state.hexes[hex].tile = tile;
		state.hexes[hex].orient = orient;
		state.hexes[hex].outposts = [{ seat, toppled: false }];
	}
}

/** One civilization's step-1 ability for seat 1, run on a copy of the state to the next decision. */
const ability = (
	/** @type {any} */ state,
	/** @type {any} */ random,
	/** @type {string} */ civ,
	turn = 2
) => pushed(state, random, [{ player: 1, kind: 'civIncome', civ, turn }]);

/**
 * The current player of a 2-player game, holding the named civilization from setup, takes an income turn after
 * `before` turns. The opponent has started that era already, so no first-of-neighbours bonus asks.
 * @param {string} civ
 * @param {number} before - Income turns already taken
 * @param {(seat: any, state: any) => void} [fill]
 */
function incomeTurn(civ, before, fill = () => {}) {
	const ready = readyTurn(
		2,
		(seat, state) => {
			seat.incomeTurns = before;
			for (const other of state.seats) {
				if (other !== seat) {
					other.incomeTurns = Math.min(before + 1, 4);
				}
			}
			fill(seat, state);
		},
		{ civs: ['nomads', civ] }
	);
	assert.equal(ready.player, 2, 'the second seat takes the turn');
	const since = ready.state.seq;
	const state = answer(ready.state, ready.random, 2, 'chooseTurn', {
		turn: 'income',
	});
	return { state, random: ready.random, since };
}

/**
 * The events of one type after a sequence number, without their numbers.
 * @param {any} state
 * @param {string} type
 * @param {number} [since]
 */
const eventsOf = (state, type, since = 0) =>
	state.events
		.filter((/** @type {any} */ e) => e.type === type && e.seq > since)
		.map(({ seq: _seq, ...e }) => e);

/**
 * The events after the first of a type since a sequence number, without their numbers: what that event led to.
 * @param {any} state
 * @param {string} type
 * @param {number} since
 */
const eventsAfter = (state, type, since) => {
	const events = state.events
		.filter((/** @type {any} */ e) => e.seq > since)
		.map(({ seq: _seq, ...e }) => e);
	return events.slice(events.findIndex((e) => e.type === type));
};

/** The open decision of a kind. */
const decisionOf = (/** @type {any} */ state, /** @type {string} */ kind) =>
	/** @type {any} */ (openDecisions(state).find((d) => d.kind === kind));

/** The resources a seat holds, all kinds together. */
const held = (/** @type {any} */ seat) =>
	Object.values(seat.resources).reduce(
		(sum, n) => /** @type {number} */ (sum) + /** @type {number} */ (n),
		0
	);

/** The listed hexes in map order. */
const inMapOrder = (/** @type {any} */ state, /** @type {string[]} */ hexes) =>
	MAPS[state.map].hexes.filter((hex) => hexes.includes(hex));

/** A random that gives every roll the same face. */
const face = (/** @type {number} */ n) => () => n;

test('Traders on an empty territory score 1 VP per neighbouring opponent territory', () => {
	const { state, random } = game(['traders'], {
		explored: ['-2_-1', '-1_-2', '2_0'],
	});
	explore(state, {
		'-3_-1': 13,
		'-1_-1': 1,
		'-1_0': 27,
		'-2_0': 15,
		'0_-1': 6,
	});
	// Around '-2_-1': seat 1's own '-2_-2'; seat 2 controls '-3_-1', '-1_-1' and '-1_0', whose Isolationists token
	// changes nothing; seat 2's toppled outpost on '-2_0' controls nothing.
	state.hexes['-3_-1'].outposts = [{ seat: 2, toppled: false }];
	state.hexes['-1_-1'].outposts = [{ seat: 2, toppled: false }];
	state.hexes['-1_0'].outposts = [{ seat: 2, toppled: false }];
	state.hexes['-1_0'].tokens = [{ seat: 2, civ: 'isolationists' }];
	state.hexes['-2_0'].outposts = [{ seat: 2, toppled: true, toppledBy: 1 }];
	// A lone token, and a lone Nomads piece, are no outpost.
	state.hexes['-1_-2'].tokens = [{ seat: 2, civ: 'traders' }];
	state.hexes['0_-1'].outposts = [
		{ seat: 2, toppled: false, piece: { building: 'farm' } },
	];
	assert.deepEqual(state.seats[0].civData.traders, { tokens: 4 });

	const asked = ability(state, random, 'traders');
	const pick = decisionOf(asked, 'chooseSlot');
	assert.equal(pick.purpose, 'traders');
	assert.equal(pick.optional, true);
	// Empty territories anywhere, and those holding only an opponent's upright outpost.
	assert.deepEqual(
		pick.options,
		inMapOrder(state, ['-2_-1', '-3_-1', '-1_-1', '2_0'])
	);

	const mark = asked.seq;
	const placed = answer(asked, random, 1, 'chooseSlot', { slot: '-2_-1' });
	assert.deepEqual(placed.hexes['-2_-1'].tokens, [
		{ seat: 1, civ: 'traders' },
	]);
	assert.deepEqual(placed.seats[0].civData.traders, { tokens: 3 });
	assert.deepEqual(eventsOf(placed, 'tokenPlaced', mark), [
		{ type: 'tokenPlaced', player: 1, civ: 'traders', hex: '-2_-1' },
	]);
	assert.equal(placed.seats[0].vp, state.seats[0].vp + 3);
	assert.deepEqual(eventsOf(placed, 'tileBenefit', mark), []);
	assert.deepEqual(openDecisions(placed), []);
	// R33: the token gives no control, so the territory stays seat 2's to conquer.
	assert.deepEqual(controlledTerritories(placed, 1), ['-2_-2']);
	assert.ok(conquerTargets(placed, 2, false).includes('-2_-1'));

	// With no opponent next to it, the token scores nothing.
	const alone = answer(asked, random, 1, 'chooseSlot', { slot: '2_0' });
	assert.equal(alone.seats[0].vp, state.seats[0].vp);
	assert.deepEqual(eventsOf(alone, 'vpGained', mark), []);

	// Declining places nothing.
	const declined = answer(asked, random, 1, 'chooseSlot', { slot: null });
	assert.deepEqual(declined.hexes['-2_-1'].tokens, []);
	assert.deepEqual(declined.seats[0].civData.traders, { tokens: 4 });
	assert.equal(declined.seats[0].vp, state.seats[0].vp);

	// With no token left, nothing is asked.
	const spent = structuredClone(state);
	spent.seats[0].civData.traders.tokens = 0;
	assert.deepEqual(openDecisions(ability(spent, random, 'traders')), []);

	// Step 1 of income turns 2 and 5 asks.
	for (const before of [1, 4]) {
		const r = incomeTurn('traders', before);
		const offered = decisionOf(r.state, 'chooseSlot');
		assert.deepEqual(
			[offered.player, offered.purpose, offered.optional],
			[2, 'traders', true]
		);
	}
});

test('Traders gain the unkept die when an opponent conquers their territory, VP only once finished', () => {
	const { state: base } = game(['traders']);
	// Seat 1's token alone on '-2_-1', which seat 2 reaches only from '-2_0'.
	base.hexes['-2_-1'].tokens = [{ seat: 1, civ: 'traders' }];
	base.seats[0].civData.traders.tokens = 3;
	explore(base, { '-2_0': 15 });
	base.hexes['-2_0'].outposts = [{ seat: 2, toppled: false }];
	/** Seat 2 conquers '-2_-1' with every die showing face n. */
	const conquered = (/** @type {any} */ state, /** @type {number} */ n) =>
		resolveEffects(state, 2, [{ conquer: {} }], face(n));
	const coin = base.seats[0].resources.coin;

	// Face 0: 4 VP on the red die, 1 coin on the black one.
	const rolled = conquered(base, 0);
	const red = answer(rolled, face(0), 2, 'chooseDie', { die: 'red' });
	const offer = decisionOf(red, 'chooseOption');
	assert.deepEqual(
		[offer.player, offer.purpose, offer.options],
		[1, 'civOffer', [[], [{ gain: { coin: 1 } }]]]
	);
	const taken = answer(red, face(0), 1, 'chooseOption', { option: 1 });
	assert.equal(taken.seats[0].resources.coin, coin + 1);
	assert.deepEqual(openDecisions(taken), []);
	const declined = answer(red, face(0), 1, 'chooseOption', { option: 0 });
	assert.equal(declined.seats[0].resources.coin, coin);

	// Keeping the black die leaves the red one's 4 VP.
	const black = answer(rolled, face(0), 2, 'chooseDie', { die: 'black' });
	assert.deepEqual(decisionOf(black, 'chooseOption').options, [
		[],
		[{ vp: 4 }],
	]);
	const vp = answer(black, face(0), 1, 'chooseOption', { option: 1 });
	assert.equal(vp.seats[0].vp, base.seats[0].vp + 4);

	// The black die's "?" left over gives the territory tile's benefit, as if seat 1 had rolled it.
	const tiled = structuredClone(base);
	explore(tiled, { '-2_-1': 1 });
	const unkept = answer(conquered(tiled, 4), face(4), 2, 'chooseDie', {
		die: 'red',
	});
	assert.deepEqual(decisionOf(unkept, 'chooseOption').options, [
		[],
		[{ tileBenefit: {} }],
	]);
	const benefit = answer(unkept, face(4), 1, 'chooseOption', { option: 1 });
	assert.equal(benefit.seats[0].resources.coin, coin + 1);

	// A finished owner is asked nothing and gains only the VP (01 §4.3).
	const finished = structuredClone(base);
	finished.seats[0].finished = true;
	const redLeft = answer(conquered(finished, 0), face(0), 2, 'chooseDie', {
		die: 'black',
	});
	assert.equal(decisionOf(redLeft, 'chooseOption'), undefined);
	assert.equal(redLeft.seats[0].vp, base.seats[0].vp + 4);
	const blackLeft = answer(conquered(finished, 0), face(0), 2, 'chooseDie', {
		die: 'red',
	});
	assert.equal(decisionOf(blackLeft, 'chooseOption'), undefined);
	assert.deepEqual(blackLeft.seats[0].resources, base.seats[0].resources);
	assert.equal(blackLeft.seats[0].vp, base.seats[0].vp);

	// Seat 1 conquering its own token's territory gains no die more.
	const own = resolveEffects(base, 1, [{ conquer: {} }], face(0));
	const mine = answer(own, face(0), 1, 'chooseDie', { die: 'red' });
	assert.deepEqual(openDecisions(mine), []);

	// Without seat 1's token there, nothing is offered.
	const theirs = structuredClone(base);
	theirs.hexes['-2_-1'].tokens = [{ seat: 2, civ: 'traders' }];
	const other = answer(conquered(theirs, 0), face(0), 2, 'chooseDie', {
		die: 'red',
	});
	assert.deepEqual(openDecisions(other), []);
});

test("Traders beside an opponent's lone outpost gain the tile's benefit and block conquest", () => {
	const { state, random } = game(['traders'], {
		explored: ['-2_-1', '-1_-2'],
	});
	// Tile 13 gives 1 coin; '-1_-2' is a printed territory, which gives nothing (R8).
	explore(state, { '-3_-1': 13 });
	state.hexes['-3_-1'].outposts = [{ seat: 2, toppled: false }];
	state.hexes['-1_-2'].outposts = [{ seat: 2, toppled: false }];
	assert.ok(conquerTargets(state, 1, true).includes('-3_-1'));

	const asked = ability(state, random, 'traders');
	const mark = asked.seq;
	const placed = answer(asked, random, 1, 'chooseSlot', { slot: '-3_-1' });
	assert.deepEqual(placed.hexes['-3_-1'].tokens, [
		{ seat: 1, civ: 'traders' },
	]);
	assert.deepEqual(eventsOf(placed, 'tileBenefit', mark), [
		{ type: 'tileBenefit', player: 1, hex: '-3_-1', tile: 13 },
	]);
	assert.equal(
		placed.seats[0].resources.coin,
		state.seats[0].resources.coin + 1
	);
	// No VP for neighbours: the territory held an item.
	assert.equal(placed.seats[0].vp, state.seats[0].vp);
	assert.deepEqual(openDecisions(placed), []);
	// Two items: nobody can conquer it, even from anywhere. Seat 2 still controls it (R33).
	assert.ok(!conquerTargets(placed, 1, true).includes('-3_-1'));
	assert.ok(controlledTerritories(placed, 2).includes('-3_-1'));

	const printed = answer(asked, random, 1, 'chooseSlot', { slot: '-1_-2' });
	assert.deepEqual(eventsOf(printed, 'tileBenefit', mark), [
		{ type: 'tileBenefit', player: 1, hex: '-1_-2', tile: null },
	]);
	assert.deepEqual(printed.seats[0].resources, state.seats[0].resources);
});

test('Traders gain 2 resources and 10 VP at setup only in the current version', () => {
	for (const version of VERSIONS) {
		const { state, random } = startedGame(2, {
			civs: ['traders', 'nomads'],
			version,
		});
		const base = startedGame(2, { civs: ['leaders', 'nomads'], version })
			.state.seats[0];
		const seat = state.seats[0];
		const current = version === 'current';
		assert.deepEqual(seat.civData.traders, { tokens: 4 });
		assert.equal(held(seat) - held(base), current ? 2 : 0, version);
		assert.equal(seat.vp - base.vp, current ? 10 : 0, version);

		// Gained mid-game: the 4 tokens, never the adjustment (R34).
		const later = structuredClone(state);
		later.pending.length = 0;
		later.seats[1].civs = ['nomads'];
		later.supply.civs = [
			'traders',
			...later.supply.civs.filter((c) => c !== 'traders'),
		];
		const next = resolveEffects(later, 2, [{ gainCiv: {} }], random);
		assert.deepEqual(next.seats[1].civs, ['nomads', 'traders']);
		assert.deepEqual(next.seats[1].civData.traders, { tokens: 4 });
		assert.equal(held(next.seats[1]), held(later.seats[1]), version);
		assert.equal(next.seats[1].vp, later.seats[1].vp, version);
	}
});

test('Isolationists may place a token on an empty territory they conquer for 1 resource', () => {
	const { state } = game(['isolationists']);
	assert.deepEqual(state.seats[0].civData.isolationists, { tokens: 4 });
	const rolled = resolveEffects(state, 1, [{ conquer: {} }], face(0));
	const offer = decisionOf(rolled, 'chooseOption');
	assert.deepEqual(
		[offer.player, offer.purpose, offer.options],
		[
			1,
			'civOffer',
			[
				[],
				[
					{ placeToken: { hex: '-2_-1', civ: 'isolationists' } },
					{ gain: { any: 1 } },
				],
			],
		]
	);
	// The offer comes with the conquest, before its dice.
	assert.equal(decisionOf(rolled, 'chooseDie'), undefined);

	const mark = rolled.seq;
	let next = answer(rolled, face(0), 1, 'chooseOption', { option: 1 });
	assert.deepEqual(next.hexes['-2_-1'].tokens, [
		{ seat: 1, civ: 'isolationists' },
	]);
	assert.deepEqual(next.seats[0].civData.isolationists, { tokens: 3 });
	assert.deepEqual(eventsOf(next, 'tokenPlaced', mark), [
		{ type: 'tokenPlaced', player: 1, civ: 'isolationists', hex: '-2_-1' },
	]);
	next = answer(next, face(0), 1, 'chooseResource', {
		resources: { food: 1 },
	});
	assert.equal(
		next.seats[0].resources.food,
		state.seats[0].resources.food + 1
	);
	assert.ok(decisionOf(next, 'chooseDie'));
	// An outpost and a token: nobody can conquer it now.
	assert.ok(!conquerTargets(next, 2, true).includes('-2_-1'));

	// Declining keeps the token.
	const declined = answer(rolled, face(0), 1, 'chooseOption', { option: 0 });
	assert.deepEqual(declined.hexes['-2_-1'].tokens, []);
	assert.deepEqual(declined.seats[0].civData.isolationists, { tokens: 4 });
	assert.ok(decisionOf(declined, 'chooseDie'));

	/** Whether seat 1 is offered a token when it conquers '-2_-1' in a copy changed by `change`; without, the dice come. */
	const offered = (/** @type {(state: any) => void} */ change) => {
		const copy = structuredClone(state);
		change(copy);
		const conquered = resolveEffects(copy, 1, [{ conquer: {} }], face(0));
		if (decisionOf(conquered, 'chooseOption')) {
			return true;
		}
		assert.ok(decisionOf(conquered, 'chooseDie'));
		return false;
	};
	// Not for a territory that held an item: an opponent's outpost, or a token.
	assert.equal(
		offered((s) => {
			s.hexes['-2_-1'].outposts = [{ seat: 2, toppled: false }];
		}),
		false
	);
	assert.equal(
		offered((s) => {
			s.hexes['-2_-1'].tokens = [{ seat: 2, civ: 'traders' }];
		}),
		false
	);
	// Nor with no token left, nor without the Isolationists.
	assert.equal(
		offered((s) => {
			s.seats[0].civData.isolationists.tokens = 0;
		}),
		false
	);
	assert.equal(
		offered((s) => {
			s.seats[0].civs = [];
		}),
		false
	);
});

test('Isolationists score their largest single-terrain land mass on income turn 5 (R31, R32)', () => {
	// Step 1 of income turn 5 only. Seat 2 controls its start territory alone: a group of 1.
	for (const before of [1, 2, 3]) {
		const r = incomeTurn('isolationists', before);
		assert.deepEqual(eventsOf(r.state, 'civAbilityUsed', r.since), []);
	}
	const r = incomeTurn('isolationists', 4);
	assert.deepEqual(eventsAfter(r.state, 'civAbilityUsed', r.since)[0], {
		type: 'civAbilityUsed',
		player: 2,
		civ: 'isolationists',
	});
	const scoredEvent = eventsAfter(r.state, 'civAbilityUsed', r.since)[1];
	assert.deepEqual(
		[scoredEvent.type, scoredEvent.player, scoredEvent.vp],
		['vpGained', 2, 5]
	);

	// The large map, where seat 1 controls only the territories laid out.
	const { state: big, random } = game(['isolationists'], {
		count: 4,
		explored: [],
	});
	/**
	 * The VP seat 1's Isolationists score with a layout of controlled territories.
	 * @param {[hex: string, tile: number, orient: number][]} layout
	 */
	const scored = (layout) => {
		const state = structuredClone(big);
		for (const hex of Object.values(state.hexes)) {
			hex.outposts = [];
		}
		control(state, 1, layout);
		return (
			ability(state, random, 'isolationists', 5).seats[0].vp -
			state.seats[0].vp
		);
	};

	// R31: a line of tile 25 turned twice links each neighbour at one desert corner. 6 or more score 40.
	const line = ['1_-2', '1_-1', '1_0', '1_1', '1_2', '1_3', '1_4'].map(
		(hex) => /** @type {[string, number, number]} */ ([hex, 25, 2])
	);
	assert.deepEqual(
		[0, 1, 2, 3, 4, 5, 6, 7].map((n) => scored(line.slice(0, n))),
		[0, 5, 10, 16, 23, 31, 40, 40]
	);

	// R32. A (mountain and desert) and B (mountain and desert) share two corners: desert is on both sides of one, so
	// they link for desert; the other has mountain only on A's side, so they don't link for mountain.
	/** @type {[string, number, number]} */
	const a = ['1_1', 2, 0];
	/** @type {[string, number, number]} */
	const b = ['1_2', 8, 0];
	assert.equal(scored([a]), 5);
	assert.equal(scored([a, b]), 10);
	// C links A for mountain, but neither A nor C links B for it: no terrain reaches 3.
	/** @type {[string, number, number]} */
	const c = ['0_1', 37, 3];
	assert.equal(scored([a, b, c]), 10);
	// E links B for desert at their one desert corner: A, B and E.
	/** @type {[string, number, number]} */
	const e = ['2_3', 1, 5];
	assert.equal(scored([a, b, c, e]), 16);
	// The middle island next to A and C shows every land terrain, but sea is on every corner: a group of 1.
	assert.equal(scored([a, b, c, e, ['0_0', 49, 0]]), 16);
	// Island tiles side by side never link, not even through the sea between them.
	assert.equal(
		scored([
			['1_-2', 5, 0],
			['1_-1', 7, 0],
			['1_0', 26, 0],
		]),
		5
	);
});

test('Isolationists gain 2 territory tiles at setup only in the current version', () => {
	for (const version of VERSIONS) {
		const { state, random } = startedGame(2, {
			civs: ['isolationists', 'nomads'],
			version,
		});
		const base = startedGame(2, { civs: ['leaders', 'nomads'], version })
			.state.seats[0];
		const seat = state.seats[0];
		assert.deepEqual(seat.civData.isolationists, { tokens: 4 });
		assert.equal(
			seat.territoryTiles.length - base.territoryTiles.length,
			version === 'current' ? 2 : 0,
			version
		);
		assert.equal(held(seat), held(base), version);

		// Gained mid-game: the 4 tokens, never the adjustment (R34).
		const later = structuredClone(state);
		later.pending.length = 0;
		later.seats[1].civs = ['nomads'];
		later.supply.civs = [
			'isolationists',
			...later.supply.civs.filter((c) => c !== 'isolationists'),
		];
		const next = resolveEffects(later, 2, [{ gainCiv: {} }], random);
		assert.deepEqual(next.seats[1].civData.isolationists, { tokens: 4 });
		assert.deepEqual(
			next.seats[1].territoryTiles,
			later.seats[1].territoryTiles
		);
	}
});

test('Militants take each outpost from the far left of a chosen row and gain every uncovered space each income turn', () => {
	const { state, random } = game(['militants']);
	assert.deepEqual(state.seats[0].civData.militants, {
		top: COVERED,
		bottom: COVERED,
	});

	// A conquest: the row is asked once the conquest is over.
	const rolled = resolveEffects(state, 1, [{ conquer: {} }], face(0));
	assert.equal(decisionOf(rolled, 'chooseSlot'), undefined);
	const conquered = answer(rolled, face(0), 1, 'chooseDie', { die: 'red' });
	const pick = decisionOf(conquered, 'chooseSlot');
	assert.deepEqual(
		[pick.player, pick.purpose, pick.optional, pick.options],
		[1, 'militantsRow', false, ['top', 'bottom']]
	);
	const mark = conquered.seq;
	let next = answer(conquered, random, 1, 'chooseSlot', { slot: 'top' });
	assert.deepEqual(next.seats[0].civData.militants, {
		top: [false, true, true, true],
		bottom: COVERED,
	});
	assert.deepEqual(eventsOf(next, 'militantsUncovered', mark), [
		{ type: 'militantsUncovered', player: 1, row: 'top', space: 0 },
	]);
	assert.equal(next.seats[0].outposts, state.seats[0].outposts - 1);

	// Militarism's outpost leaves the supply too.
	next = resolveEffects(next, 1, [{ placeOutpost: { hex: '0_0' } }], random);
	next = answer(next, random, 1, 'chooseSlot', { slot: 'bottom' });
	assert.deepEqual(next.seats[0].civData.militants, {
		top: [false, true, true, true],
		bottom: [false, true, true, true],
	});

	// An opponent's outpost leaving their supply changes nothing.
	const theirs = resolveEffects(
		next,
		2,
		[{ placeOutpost: { hex: '0_0' } }],
		random
	);
	assert.deepEqual(openDecisions(theirs), []);
	assert.deepEqual(
		theirs.seats[0].civData.militants,
		next.seats[0].civData.militants
	);

	// The ability gains the uncovered spaces: 1 coin and 1 VP.
	const paid = ability(next, random, 'militants');
	assert.equal(
		paid.seats[0].resources.coin,
		next.seats[0].resources.coin + 1
	);
	assert.equal(paid.seats[0].vp, next.seats[0].vp + 1);
	assert.deepEqual(openDecisions(paid), []);

	// With one row left to take from, the outpost comes from it without asking.
	const topOpen = structuredClone(next);
	topOpen.seats[0].civData.militants.top = [...OPEN];
	const auto = resolveEffects(
		topOpen,
		1,
		[{ placeOutpost: { hex: '0_0' } }],
		random
	);
	assert.deepEqual(openDecisions(auto), []);
	assert.deepEqual(auto.seats[0].civData.militants.bottom, [
		false,
		false,
		true,
		true,
	]);

	// Every space uncovered: all 8.
	const bare = structuredClone(next);
	bare.seats[0].civData.militants = { top: [...OPEN], bottom: [...OPEN] };
	const all = ability(bare, random, 'militants');
	for (const resource of ['coin', 'worker', 'food', 'culture']) {
		assert.equal(
			all.seats[0].resources[resource],
			bare.seats[0].resources[resource] + 1,
			resource
		);
	}
	assert.equal(all.seats[0].vp, bare.seats[0].vp + 2 + 4 + 1 + 3);

	// Step 1 of a real income turn 2: the uncovered spaces, at once.
	const r = incomeTurn('militants', 1, (seat) => {
		seat.civData.militants = {
			top: [false, true, true, true],
			bottom: [false, false, true, true],
		};
	});
	assert.deepEqual(
		eventsAfter(r.state, 'civAbilityUsed', r.since)
			.slice(0, 4)
			.map((e) => [e.type, e.player, e.gained ?? e.vp]),
		[
			['civAbilityUsed', 2, undefined],
			['resourcesGained', 2, { coin: 1 }],
			['vpGained', 2, 1],
			['resourcesGained', 2, { worker: 1 }],
		]
	);
});

test('Militants gained mid-game place their outposts right to left', () => {
	const { state, random } = game([]);
	state.supply.civs = [
		'militants',
		...state.supply.civs.filter((c) => c !== 'militants'),
	];
	state.seats[0].outposts = 6;
	let next = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(next.seats[0].civs, ['militants']);
	assert.deepEqual(next.seats[0].civData.militants, {
		top: OPEN,
		bottom: OPEN,
	});
	const pick = decisionOf(next, 'chooseSlot');
	assert.deepEqual(
		[pick.player, pick.purpose, pick.optional, pick.options],
		[1, 'militantsPlace', false, ['top', 'bottom']]
	);
	for (const row of ['top', 'bottom', 'top', 'top', 'top']) {
		next = answer(next, random, 1, 'chooseSlot', { slot: row });
	}
	// The top row is full, so the sixth goes on the bottom row without asking.
	assert.deepEqual(openDecisions(next), []);
	assert.deepEqual(next.seats[0].civData.militants, {
		top: COVERED,
		bottom: [false, false, true, true],
	});
	assert.deepEqual(
		eventsOf(next, 'militantsCovered').map((e) => [
			e.player,
			e.row,
			e.space,
		]),
		[
			[1, 'top', 3],
			[1, 'bottom', 3],
			[1, 'top', 2],
			[1, 'top', 1],
			[1, 'top', 0],
			[1, 'bottom', 2],
		]
	);
	assert.equal(next.seats[0].outposts, 6);

	// Taking one later uncovers the far left of the row chosen.
	const taken = resolveEffects(
		next,
		1,
		[{ placeOutpost: { hex: '0_0' } }],
		random
	);
	const after = answer(taken, random, 1, 'chooseSlot', { slot: 'bottom' });
	assert.deepEqual(after.seats[0].civData.militants.bottom, [
		false,
		false,
		false,
		true,
	]);

	// With no outpost left in the supply, nothing is covered or asked.
	const empty = structuredClone(state);
	empty.seats[0].outposts = 0;
	const none = resolveEffects(empty, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(openDecisions(none), []);
	assert.deepEqual(none.seats[0].civData.militants, {
		top: OPEN,
		bottom: OPEN,
	});
});

test('Militants behave the same in both versions', () => {
	const results = VERSIONS.map((version) => {
		const { state: started, random } = startedGame(2, {
			civs: ['militants', 'nomads'],
			version,
		});
		const base = startedGame(2, { civs: ['leaders', 'nomads'], version })
			.state.seats[0];
		const state = structuredClone(started);
		state.pending.length = 0;
		const seat = state.seats[0];
		let next = resolveEffects(
			state,
			1,
			[{ placeOutpost: { hex: '0_0' } }],
			random
		);
		next = answer(next, random, 1, 'chooseSlot', { slot: 'top' });
		next = ability(next, random, 'militants');
		return {
			civData: seat.civData,
			resources: held(seat) - held(base),
			vp: seat.vp - base.vp,
			militants: next.seats[0].civData.militants,
			coin: next.seats[0].resources.coin - seat.resources.coin,
		};
	});
	assert.deepEqual(results[0], {
		civData: { militants: { top: COVERED, bottom: COVERED } },
		resources: 0,
		vp: 0,
		militants: { top: [false, true, true, true], bottom: COVERED },
		coin: 1,
	});
	assert.deepEqual(results[1], results[0]);
});
