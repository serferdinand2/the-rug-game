// Tests for conquering: the conquer effect, chooseConquer, the dice and the black die's "?" (#17; R8, R16, R17, R107).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { controlledTerritories } from '../src/lib/engine/control.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { view } from '../src/lib/engine/view.js';
import { play } from '../src/lib/engine/play.js';
import {
	startedGame,
	answer,
	readyTurn,
	conquestGame,
} from './helpers/engine.mjs';

/**
 * A small-map game with every outpost cleared, where seat 1 controls '-2_-2'. Only '-2_-2' and the listed hexes
 * stay explored (all printed territories), so the targets are known.
 * @param {string[]} [explored]
 * @returns {{ state: any }}
 */
function game(explored = ['-2_-1']) {
	const { state: started } = startedGame(2);
	const state = structuredClone(started);
	for (const [key, hex] of Object.entries(state.hexes)) {
		hex.outposts = [];
		if (key !== '-2_-2' && !explored.includes(key)) {
			/** @type {any} */ (hex).tile = null;
		}
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	return { state };
}

/** A random that gives every roll the same face. */
const face = (/** @type {number} */ n) => () => n;

/**
 * Runs a conquer effect for seat 1.
 * @param {any} state
 * @param {any} random
 * @param {object} [value]
 */
function conquer(state, random, value = {}) {
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ conquer: value }] },
	]);
	run(state, random);
}

/** The kinds of the open decisions, without the waiting turn choice. */
const open = (/** @type {any} */ state) =>
	openDecisions(state)
		.map((d) => d.kind)
		.filter((k) => k !== 'chooseTurn');

const types = (/** @type {any} */ state, /** @type {number} */ from = 0) =>
	state.events.slice(from).map((/** @type {any} */ e) => e.type);

test('conquering an empty territory places an outpost and gives control', () => {
	const { state } = game();
	conquer(state, face(0));
	// One target: conquered at once, then the player picks a die.
	assert.equal(state.seats[0].outposts, 7);
	assert.deepEqual(state.hexes['-2_-1'].outposts, [
		{ seat: 1, toppled: false },
	]);
	assert.ok(controlledTerritories(state, 1).includes('-2_-1'));
	assert.deepEqual(open(state), ['chooseDie']);
});

test("conquering an opponent's lone outpost topples it, recording who caused it", () => {
	const { state } = game();
	state.hexes['-2_-1'].outposts = [{ seat: 2, toppled: false }];
	conquer(state, face(0));
	assert.deepEqual(state.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	]);
	const toppled = state.events.find((e) => e.type === 'outpostToppled');
	assert.deepEqual(
		{ ...toppled, seq: undefined },
		{
			type: 'outpostToppled',
			player: 2,
			hex: '-2_-1',
			by: 1,
			seq: undefined,
		}
	);
	// The toppled outpost stays on the map, and the opponent's supply is unchanged.
	assert.equal(state.seats[1].outposts, 8);
	const conquered = state.events.find((e) => e.type === 'conquered');
	assert.equal(conquered.trapped, false);
});

test("a territory held by an upright and a toppled outpost can't be conquered, and still counts for its owner's adjacency", () => {
	const { state } = game(['-2_-1', '-1_-2']);
	state.hexes['-2_-1'].outposts = [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	];
	// Seat 1 already controls -2_-1 through its upright outpost; seat 2 holds it as toppled only.
	assert.deepEqual(controlledTerritories(state, 2), []);
	push(state, state.pending, [
		{ player: 2, kind: 'effects', effects: [{ conquer: {} }] },
	]);
	run(state, face(0));
	// Seat 2 controls nothing: no adjacent target, so nothing happens.
	assert.deepEqual(types(state).slice(-1), ['noConquer']);
	// Seat 1 can't conquer -2_-1 (it already controls it), nor is the pair a target for anyone else.
	state.hexes['-2_-1'].outposts = [
		{ seat: 2, toppled: false },
		{ seat: 1, toppled: true, toppledBy: 2 },
	];
	state.pending.length = 0;
	conquer(state, face(0), { anywhere: true });
	assert.ok(
		!state.events.some(
			(e) => e.type === 'outpostPlaced' && e.hex === '-2_-1'
		)
	);
	assert.equal(state.hexes['-2_-1'].outposts.length, 2);
	// Seat 1 conquers the other target instead, and the pair still counts as seat 2's.
	assert.deepEqual(controlledTerritories(state, 2), ['-2_-1']);
});

test('with no outpost in supply, or no target, nothing happens', () => {
	const { state } = game();
	state.seats[0].outposts = 0;
	const before = state.events.length;
	conquer(state, face(0));
	assert.deepEqual(types(state, before), ['noConquer']);
	assert.deepEqual(open(state), []);
	const none = game([]).state;
	const beforeNone = none.events.length;
	conquer(none, face(0));
	assert.deepEqual(types(none, beforeNone), ['noConquer']);
	assert.deepEqual(open(none), []);
	assert.equal(none.seats[0].outposts, 8);
});

test('a single target is conquered automatically', () => {
	const { state } = game();
	conquer(state, face(0));
	assert.ok(types(state).includes('outpostPlaced'));
	assert.ok(!openDecisions(state).some((d) => d.kind === 'chooseConquer'));
});

test('several targets ask which to conquer', () => {
	const { state } = game(['-2_-1', '-1_-2']);
	conquer(state, face(0));
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'chooseConquer');
	const done = answer(state, face(0), 1, 'chooseConquer', { hex: '-1_-2' });
	assert.equal(done.hexes['-1_-2'].outposts.length, 1);
	assert.equal(done.hexes['-2_-1'].outposts.length, 0);
});

test('one die is chosen, and the default is red', () => {
	const { state } = game();
	conquer(state, face(0));
	const [decision] = openDecisions(state);
	const rolled = state.events.find((e) => e.type === 'conquerDiceRolled');
	assert.deepEqual([rolled.red, rolled.black], [0, 0]);
	assert.deepEqual(DECISIONS.chooseDie.answers(state, decision), [
		{ die: 'red' },
		{ die: 'black' },
	]);
	const seat = state.seats[0];
	const black = answer(structuredClone(state), face(0), 1, 'chooseDie', {
		die: 'black',
	});
	assert.equal(black.seats[0].resources.coin, seat.resources.coin + 1);
	assert.equal(black.seats[0].vp, seat.vp);
	const red = answer(state, face(0), 1, 'chooseDie', { die: 'red' });
	assert.equal(red.seats[0].vp, seat.vp + 4);
	assert.equal(red.seats[0].resources.coin, seat.resources.coin);
});

test("the red die's per-territory face counts the new territory", () => {
	const { state } = game();
	conquer(state, face(4));
	const before = state.seats[0].vp;
	const done = answer(state, face(4), 1, 'chooseDie', { die: 'red' });
	// The start territory and the new one.
	assert.equal(done.seats[0].vp, before + 2);
});

test('the black die\'s "?" gives the tile\'s benefit, and nothing on a printed territory (R8)', () => {
	const { state } = game();
	state.hexes['-2_-1'].tile = 1;
	conquer(state, face(4));
	const coin = state.seats[0].resources.coin;
	const done = answer(state, face(4), 1, 'chooseDie', { die: 'black' });
	assert.equal(done.seats[0].resources.coin, coin + 1);
	const shown = done.events.find((e) => e.type === 'tileBenefit');
	assert.deepEqual(
		{ ...shown, seq: undefined },
		{
			type: 'tileBenefit',
			player: 1,
			hex: '-2_-1',
			tile: 1,
			seq: undefined,
		}
	);

	const printed = game().state;
	conquer(printed, face(4));
	const after = answer(printed, face(4), 1, 'chooseDie', { die: 'black' });
	const none = after.events.find((e) => e.type === 'tileBenefit');
	assert.equal(none.tile, null);
	assert.equal(
		after.seats[0].resources.coin,
		printed.seats[0].resources.coin
	);
});

test('R17: Tanks gives both dice against an opponent, and one die against an empty territory', () => {
	const { state } = game();
	state.hexes['-2_-1'].outposts = [{ seat: 2, toppled: false }];
	const coin = state.seats[0].resources.coin;
	conquer(state, face(0), { bothDice: 'ifOpponent' });
	// Red 4 VP and black 1 coin, with no die to choose.
	assert.deepEqual(open(state), []);
	assert.equal(state.seats[0].vp, 4);
	assert.equal(state.seats[0].resources.coin, coin + 1);
	const empty = game().state;
	conquer(empty, face(0), { bothDice: 'ifOpponent' });
	assert.deepEqual(open(empty), ['chooseDie']);
});

test('Mechs always gives both dice', () => {
	const { state } = game();
	const coin = state.seats[0].resources.coin;
	conquer(state, face(0), { bothDice: 'always' });
	assert.deepEqual(open(state), []);
	assert.equal(state.seats[0].vp, 4);
	assert.equal(state.seats[0].resources.coin, coin + 1);
});

test('both dice resolve black then red, so red counts a territory black conquered (#17)', () => {
	const { state } = game();
	conquer(state, face(0), { bothDice: 'always' });
	const rolled = state.events.findIndex(
		(e) => e.type === 'conquerDiceRolled'
	);
	const gained = state.events
		.slice(rolled)
		.filter((e) => e.type === 'vpGained' || e.type === 'resourcesGained')
		.map((e) => e.type);
	// Face 0 of black gives 1 coin; face 0 of red gives VP. Black comes first.
	assert.ok(gained.indexOf('resourcesGained') < gained.indexOf('vpGained'));
});

test('an answer not offered is refused', () => {
	const { state } = game(['-2_-1', '-1_-2']);
	conquer(state, face(0));
	for (const bad of [{ hex: '9_9' }, { hex: '-3_-3' }, {}]) {
		assert.throws(() => answer(state, face(0), 1, 'chooseConquer', bad), {
			name: 'PlayerError',
			message: "You can't conquer there.",
		});
	}
	const { state: one } = game();
	conquer(one, face(0));
	assert.throws(
		() => answer(one, face(0), 1, 'chooseDie', { die: 'green' }),
		{
			name: 'PlayerError',
			message: 'Choose one of the two dice.',
		}
	);
});

test('a defender with a trap may spring it: they keep the territory, topple the attacker and gain 1 resource (R21)', () => {
	const state = conquestGame(['trap-3']);
	conquer(state, face(0));
	const [question] = openDecisions(state).filter(
		(d) => d.kind === 'chooseResponse'
	);
	assert.equal(question.player, 2);
	assert.deepEqual(DECISIONS.chooseResponse.answers(state, question), [
		{ card: null },
		{ card: 'trap-3' },
	]);
	// The attacker's dice wait for the answer.
	assert.deepEqual(open(state), ['chooseResponse']);
	const trapped = answer(state, face(0), 2, 'chooseResponse', {
		card: 'trap-3',
	});
	assert.ok(trapped.supply.tapestry.discard.includes('trap-3'));
	assert.deepEqual(trapped.seats[1].hand, []);
	assert.deepEqual(trapped.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: false },
		{ seat: 1, toppled: true, toppledBy: 2 },
	]);
	assert.ok(controlledTerritories(trapped, 2).includes('-2_-1'));
	assert.ok(!controlledTerritories(trapped, 1).includes('-2_-1'));
	const raised = trapped.events.find((e) => e.type === 'outpostRaised');
	assert.deepEqual(
		{ ...raised, seq: undefined },
		{ type: 'outpostRaised', player: 2, hex: '-2_-1', seq: undefined }
	);
	const played = trapped.events.find((e) => e.type === 'responsePlayed');
	assert.deepEqual(
		{ ...played, seq: undefined },
		{
			type: 'responsePlayed',
			player: 2,
			hex: '-2_-1',
			card: 'trap-3',
			attacker: 1,
			seq: undefined,
		}
	);
	// Seat 2 chooses 1 resource, then seat 1's dice roll.
	assert.deepEqual(open(trapped), ['chooseResource']);
	assert.equal(
		openDecisions(trapped).find((d) => d.kind === 'chooseResource').player,
		2
	);
	const done = answer(trapped, face(0), 2, 'chooseResource', {
		resources: { coin: 1 },
	});
	assert.deepEqual(open(done), ['chooseDie']);
	const conquered = done.events.find((e) => e.type === 'conquered');
	assert.equal(conquered.trapped, true);
});

test('the attacker is trapped only when the outpost just placed is toppled, not an older one (#17)', () => {
	const state = conquestGame([]);
	// An earlier toppled outpost of seat 1 on the hex must not count as a trap.
	state.hexes['-2_-1'].outposts = [{ seat: 1, toppled: true, toppledBy: 2 }];
	conquer(state, face(0));
	const conquered = state.events.find((e) => e.type === 'conquered');
	assert.equal(conquered.trapped, false);
});

test('two traps in hand are offered in hand order', () => {
	const state = conquestGame(['trap-5', 'trap-2']);
	conquer(state, face(0));
	const question = openDecisions(state).find(
		(d) => d.kind === 'chooseResponse'
	);
	assert.deepEqual(DECISIONS.chooseResponse.answers(state, question), [
		{ card: null },
		{ card: 'trap-5' },
		{ card: 'trap-2' },
	]);
});

test('declining the response leaves the topple standing', () => {
	const state = conquestGame(['trap-3']);
	conquer(state, face(0));
	const done = answer(state, face(0), 2, 'chooseResponse', { card: null });
	assert.deepEqual(open(done), ['chooseDie']);
	assert.deepEqual(done.seats[1].hand, ['trap-3']);
	assert.deepEqual(done.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	]);
	const declined = done.events.find((e) => e.type === 'responseDeclined');
	assert.deepEqual(
		{ ...declined, seq: undefined },
		{ type: 'responseDeclined', player: 2, hex: '-2_-1', seq: undefined }
	);
});

test('the dice still roll after a trap, and "?" still gives the tile\'s benefit (R107)', () => {
	const state = conquestGame(['trap-1']);
	state.hexes['-2_-1'].tile = 1;
	conquer(state, face(4));
	let next = answer(state, face(4), 2, 'chooseResponse', { card: 'trap-1' });
	next = answer(next, face(4), 2, 'chooseResource', {
		resources: { coin: 1 },
	});
	assert.deepEqual(open(next), ['chooseDie']);
	const coin = next.seats[0].resources.coin;
	const done = answer(next, face(4), 1, 'chooseDie', { die: 'black' });
	assert.equal(done.seats[0].resources.coin, coin + 1);
	assert.equal(done.events.find((e) => e.type === 'tileBenefit').tile, 1);
});

test('R17: Tanks still gives both dice when trapped', () => {
	const state = conquestGame(['trap-1']);
	const coin = state.seats[0].resources.coin;
	conquer(state, face(0), { bothDice: 'ifOpponent' });
	let next = answer(state, face(0), 2, 'chooseResponse', { card: 'trap-1' });
	next = answer(next, face(0), 2, 'chooseResource', {
		resources: { coin: 1 },
	});
	assert.deepEqual(open(next), []);
	assert.equal(next.seats[0].vp, 4);
	assert.equal(next.seats[0].resources.coin, coin + 1);
});

test('a defender holding cards but no trap is still asked, and may only decline', () => {
	const state = conquestGame(['age-of-sail']);
	conquer(state, face(0));
	const question = openDecisions(state).find(
		(d) => d.kind === 'chooseResponse'
	);
	assert.deepEqual(DECISIONS.chooseResponse.answers(state, question), [
		{ card: null },
	]);
});

test('a defender with an empty hand is not asked', () => {
	const state = conquestGame([]);
	conquer(state, face(0));
	assert.deepEqual(open(state), ['chooseDie']);
});

test('R108: under the Current rules a finished defender is not asked', () => {
	const state = conquestGame(['trap-1'], { version: 'current' });
	state.seats[1].finished = true;
	conquer(state, face(0));
	assert.deepEqual(open(state), ['chooseDie']);
});

test('R108: under the Original rules a finished defender may spring a trap, but gains no resource', () => {
	const state = conquestGame(['trap-1'], { version: 'original' });
	state.seats[1].finished = true;
	conquer(state, face(0));
	assert.deepEqual(open(state), ['chooseResponse']);
	const resources = { ...state.seats[1].resources };
	const next = answer(state, face(0), 2, 'chooseResponse', {
		card: 'trap-1',
	});
	assert.deepEqual(open(next), ['chooseDie']);
	assert.deepEqual(next.seats[1].resources, resources);
	assert.deepEqual(next.hexes['-2_-1'].outposts[1], {
		seat: 1,
		toppled: true,
		toppledBy: 2,
	});
});

test("privacy: the attacker sees the same game whether the defender's card is a trap or not", () => {
	const a = conquestGame(['trap-1']);
	const b = conquestGame(['age-of-sail']);
	conquer(a, face(0));
	conquer(b, face(0));
	assert.equal(JSON.stringify(view(a, 1)), JSON.stringify(view(b, 1)));
	// Nor does the public view tell them apart.
	assert.equal(JSON.stringify(view(a, null)), JSON.stringify(view(b, null)));
});

test("the response is answered before the attacker's dice, during an advance turn", () => {
	const { state, random, player } = readyTurn(2, (seat, s) => {
		const other = seat.seat === 1 ? 2 : 1;
		seat.tracks.military = [0];
		seat.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
		for (const [key, hex] of Object.entries(s.hexes)) {
			hex.outposts = [];
			if (key !== '-2_-2' && key !== '-2_-1') {
				/** @type {any} */ (hex).tile = null;
			}
		}
		s.hexes['-2_-2'].outposts = [{ seat: seat.seat, toppled: false }];
		s.hexes['-2_-1'].outposts = [{ seat: other, toppled: false }];
		s.seats[other - 1].hand = ['trap-2'];
	});
	const defender = player === 1 ? 2 : 1;
	const chosen = answer(state, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	const [decision] = openDecisions(chosen);
	const move = DECISIONS.chooseAdvance
		.answers(chosen, decision)
		.find((a) => a.track === 'military' && a.from === 0);
	const next = play(
		chosen,
		player,
		{ decision: decision.id, ...move },
		random
	);
	const kinds = openDecisions(next).map((d) => `${d.player}:${d.kind}`);
	assert.deepEqual(kinds, [`${defender}:chooseResponse`]);
	// Nobody but the defender can answer, and the dice wait.
	const question = openDecisions(next)[0];
	assert.throws(
		() => play(next, player, { decision: question.id, card: null }, random),
		{
			name: 'PlayerError',
			message: 'That choice belongs to another player.',
		}
	);
	const done = answer(next, random, defender, 'chooseResponse', {
		card: null,
	});
	assert.deepEqual(
		openDecisions(done).map((d) => d.kind),
		['chooseDie']
	);
});

test("a card that isn't a response card is refused", () => {
	const state = conquestGame(['age-of-sail', 'trap-1']);
	conquer(state, face(0));
	for (const card of ['age-of-sail', 'trap-9', 'trap-2', undefined]) {
		assert.throws(
			() => answer(state, face(0), 2, 'chooseResponse', { card }),
			{
				name: 'PlayerError',
				message: "You can't play that card as a response.",
			}
		);
	}
});

test('a bot defender is skipped: the conquest goes straight to the dice', () => {
	const state = conquestGame(['trap-1']);
	state.seats[1].kind = 'automa';
	conquer(state, face(0));
	assert.deepEqual(open(state), ['chooseDie']);
});
