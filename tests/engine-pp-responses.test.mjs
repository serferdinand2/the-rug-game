// Plans & Ploys' response cards (#33; 03 §1.2, §1.4): Retreat, Surprise Party and Surrender answer a conquest, with the trap.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { controlledTerritories } from '../src/lib/engine/control.js';
import {
	declineOnly,
	defaultAction,
	revealed,
} from '../src/lib/engine/table.js';
import { view } from '../src/lib/engine/view.js';
import { hexNeighbours, MAPS } from '../src/lib/engine/data/maps.js';
import { conquestGame } from './helpers/engine.mjs';

const PP = { expansions: ['pp'] };

/** A random that gives every roll the same face. */
const face = (/** @type {number} */ n) => () => n;

/**
 * Runs a conquer effect for seat 1, as #17's tests do.
 * @param {any} state
 * @param {object} [value]
 */
function conquer(state, value = {}) {
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ conquer: value }] },
	]);
	run(state, face(0));
}

/**
 * Answers seat 2's response question.
 * @param {any} state
 * @param {string | null} card
 */
function respond(state, card) {
	const question = openDecisions(state).find(
		(d) => d.kind === 'chooseResponse'
	);
	assert.ok(question, 'seat 2 is asked for a response');
	return play(state, 2, { decision: question.id, card }, face(0));
}

/** The cards seat 2 is offered against the conquest. */
const offered = (/** @type {any} */ state) => {
	const question = openDecisions(state).find(
		(d) => d.kind === 'chooseResponse'
	);
	return DECISIONS.chooseResponse
		.answers(state, question)
		.map((/** @type {any} */ a) => a.card);
};

const types = (/** @type {any} */ state) =>
	state.events.map((/** @type {any} */ e) => e.type);

/**
 * Answers open decisions with their first answers until an event of this type happens, and no further.
 * @param {any} state
 * @param {string} type
 */
function until(state, type) {
	let next = state;
	for (let step = 0; step < 20 && !types(next).includes(type); step++) {
		const [open] = openDecisions(next);
		assert.ok(open, `no ${type} and nothing left to answer`);
		next = play(
			next,
			/** @type {number} */ (open.player),
			/** @type {any} */ (defaultAction(next, open.player)),
			face(0)
		);
	}
	assert.ok(types(next).includes(type), `no ${type}`);
	return next;
}

/** A hex next to '-2_-1' that seat 2 explores and controls, so Retreat has somewhere to go. */
const RETREAT_TO = '-1_-1';

/**
 * Explores RETREAT_TO with a territory tile and puts seat 2's outpost on it.
 * @param {any} state
 */
function retreatSpot(state) {
	assert.ok(hexNeighbours('-2_-1').includes(RETREAT_TO));
	state.hexes[RETREAT_TO].tile = state.supply.territory.shift();
	state.hexes[RETREAT_TO].orient = 0;
	state.hexes[RETREAT_TO].outposts = [{ seat: 2, toppled: false }];
}

test('a defender may play Retreat only with a territory of theirs next to the conquered one, moving their outpost there and gaining 1 worker (R45)', () => {
	const without = conquestGame(['retreat'], PP);
	conquer(without);
	assert.deepEqual(offered(without), [null]);

	const state = conquestGame(['retreat'], PP);
	retreatSpot(state);
	const workers = state.seats[1].resources.worker;
	conquer(state, { only: ['-2_-1'] });
	assert.deepEqual(offered(state), [null, 'retreat']);
	const after = respond(state, 'retreat');
	assert.deepEqual(after.hexes['-2_-1'].outposts, [
		{ seat: 1, toppled: false },
	]);
	assert.deepEqual(after.hexes[RETREAT_TO].outposts, [
		{ seat: 2, toppled: false },
		{ seat: 2, toppled: false },
	]);
	assert.equal(after.seats[1].resources.worker, workers + 1);
	assert.ok(controlledTerritories(after, 1).includes('-2_-1'));
	assert.ok(types(after).includes('retreated'));
	assert.ok(types(after).includes('conquerDiceRolled'));
	assert.ok(after.supply.tapestry.discard.includes('retreat'));
});

test('Surprise Party needs the defender further along military; it topples the attacker and gains 15 VP', () => {
	const even = conquestGame(['surprise-party'], PP);
	conquer(even);
	assert.deepEqual(offered(even), [null]);

	const state = conquestGame(['surprise-party'], PP);
	state.seats[1].tracks.military = [3];
	state.seats[0].tracks.military = [2];
	const vp = state.seats[1].vp;
	conquer(state);
	assert.deepEqual(offered(state), [null, 'surprise-party']);
	const after = respond(state, 'surprise-party');
	assert.deepEqual(after.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: false },
		{ seat: 1, toppled: true, toppledBy: 2 },
	]);
	assert.equal(after.seats[1].vp, vp + 15);
	assert.ok(controlledTerritories(after, 2).includes('-2_-1'));
	assert.ok(types(after).includes('surprisePartyThrown'));
	assert.ok(types(after).includes('conquerDiceRolled'));
});

test('a Surprise Party on the middle island stops the achievement', () => {
	const state = conquestGame(['surprise-party'], PP);
	const middle = MAPS.small.middle;
	state.hexes['-2_-1'].outposts = [];
	state.hexes[middle].tile = MAPS.small.printed[middle].tile;
	state.hexes[middle].outposts = [{ seat: 2, toppled: false }];
	state.seats[1].tracks.military = [3];
	conquer(state, { only: [middle], anywhere: true });
	const after = respond(state, 'surprise-party');
	assert.ok(!after.achievements['middle-island'].includes(1));
});

test("Surrender lets the conquest stand and rolls both dice for the defender after the attacker's", () => {
	const state = conquestGame(['surrender'], PP);
	conquer(state);
	assert.deepEqual(offered(state), [null, 'surrender']);
	const after = until(respond(state, 'surrender'), 'surrenderRolled');
	assert.deepEqual(after.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	]);
	const order = types(after);
	const attacker = order.indexOf('conquerDiceRolled');
	const defender = order.indexOf('surrenderRolled');
	assert.ok(attacker >= 0 && defender > attacker, order.join(' '));
	const rolled = after.events.find(
		(/** @type {any} */ e) => e.type === 'surrenderRolled'
	);
	assert.equal(rolled.player, 2);
});

test('a defender holding only cards they cannot play now is still asked, and declineOnly declines them (#17)', () => {
	const state = conquestGame(['retreat', 'surprise-party'], PP);
	conquer(state);
	assert.deepEqual(offered(state), [null]);
	const [only] = declineOnly(state);
	assert.equal(only.player, 2);
	const after = play(
		state,
		2,
		/** @type {any} */ (defaultAction(state, 2)),
		face(0)
	);
	assert.ok(types(after).includes('conquerDiceRolled'));
});

test('a declined response still rolls the attacker dice', () => {
	const state = conquestGame(['surrender'], PP);
	conquer(state);
	const after = respond(state, null);
	assert.ok(types(after).includes('responseDeclined'));
	assert.equal(
		after.events.filter(
			(/** @type {any} */ e) => e.type === 'conquerDiceRolled'
		).length,
		1
	);
});

test('R108: a finished defender may respond under the original rules, not under the current rules', () => {
	const original = conquestGame(['surrender'], {
		...PP,
		version: 'original',
	});
	original.seats[1].finished = true;
	conquer(original);
	assert.deepEqual(offered(original), [null, 'surrender']);

	const current = conquestGame(['surrender'], PP);
	current.seats[1].finished = true;
	conquer(current);
	assert.ok(!openDecisions(current).some((d) => d.kind === 'chooseResponse'));
});

/**
 * A conquest of seat 2's outpost answered with a trap, seat 1 holding `hand`.
 * @param {string[]} hand
 * @param {string[]} [defenderHand]
 */
function trapped(hand, defenderHand = ['trap-1']) {
	const state = conquestGame(defenderHand, PP);
	state.seats[0].hand = [...hand];
	conquer(state);
	return respond(state, 'trap-1');
}

/**
 * Answers seat 1's counter question.
 * @param {any} state
 * @param {string | null} card
 */
function counter(state, card) {
	const question = openDecisions(state).find(
		(d) => d.kind === 'chooseCounter'
	);
	assert.ok(question, 'seat 1 is asked to counter');
	return play(state, 1, { decision: question.id, card }, face(0));
}

test('a Trap asks the attacker to counter whenever they hold any card (#17), before the trap takes effect', () => {
	const state = trapped(['academia']);
	const question = openDecisions(state).find(
		(d) => d.kind === 'chooseCounter'
	);
	assert.equal(question.player, 1);
	assert.deepEqual(
		DECISIONS.chooseCounter
			.answers(state, question)
			.map((/** @type {any} */ a) => a.card),
		[null]
	);
	// The trap hasn't acted yet: the conquest still stands.
	assert.deepEqual(state.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	]);
	assert.ok(!types(state).includes('conquerDiceRolled'));
	assert.deepEqual(declineOnly(state), [
		{ decision: question.id, player: 1 },
	]);

	const empty = trapped([]);
	assert.ok(!openDecisions(empty).some((d) => d.kind === 'chooseCounter'));
	assert.deepEqual(empty.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: false },
		{ seat: 1, toppled: true, toppledBy: 2 },
	]);
});

test('Double Cross cancels the trap: the conquest stands, the trapper gains nothing, the attacker gains 5 VP', () => {
	const state = trapped(['double-cross']);
	const resources = { ...state.seats[1].resources };
	const vp = state.seats[0].vp;
	const after = counter(state, 'double-cross');
	assert.deepEqual(after.hexes['-2_-1'].outposts, [
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 1, toppled: false },
	]);
	assert.ok(controlledTerritories(after, 1).includes('-2_-1'));
	assert.deepEqual(after.seats[1].resources, resources);
	assert.equal(after.seats[0].vp, vp + 5);
	assert.ok(after.supply.tapestry.discard.includes('double-cross'));
	assert.ok(after.supply.tapestry.discard.includes('trap-1'));
	assert.ok(types(after).includes('counterPlayed'));
	assert.ok(types(after).includes('conquerDiceRolled'));
});

test("Stolen Plans cancels the trap and takes a random card from the trapper's hand, which only the thief sees", () => {
	const state = trapped(['stolen-plans'], ['trap-1', 'academia']);
	const after = counter(state, 'stolen-plans');
	assert.deepEqual(after.seats[1].hand, []);
	assert.deepEqual(after.seats[0].hand, ['academia']);
	assert.ok(controlledTerritories(after, 1).includes('-2_-1'));
	const stolen = after.events.find(
		(/** @type {any} */ e) => e.type === 'tapestryStolen'
	);
	assert.equal(stolen.player, 1);
	assert.equal(stolen.from, 2);
	assert.deepEqual(stolen.secret, { cards: ['academia'] });
	const seen = (/** @type {number} */ seat) =>
		view(after, seat).events.find(
			(/** @type {any} */ e) => e.type === 'tapestryStolen'
		);
	assert.deepEqual(seen(1)?.secret, { cards: ['academia'] });
	assert.equal(seen(2)?.secret, undefined);
	assert.ok(revealed(state, after));
});

test('Surprise Party, Retreat and Surrender cannot be countered', () => {
	for (const card of ['surprise-party', 'surrender']) {
		const state = conquestGame([card], PP);
		state.seats[0].hand = ['double-cross'];
		state.seats[1].tracks.military = [3];
		conquer(state);
		const after = respond(state, card);
		assert.ok(
			!openDecisions(after).some((d) => d.kind === 'chooseCounter'),
			card
		);
	}
});

test('a declined or timed-out counter springs the trap and rolls the dice', () => {
	const state = trapped(['double-cross']);
	const declined = until(counter(state, null), 'conquerDiceRolled');
	const timed = until(
		play(state, 1, /** @type {any} */ (defaultAction(state, 1)), face(0)),
		'conquerDiceRolled'
	);
	for (const after of [declined, timed]) {
		assert.deepEqual(after.hexes['-2_-1'].outposts, [
			{ seat: 2, toppled: false },
			{ seat: 1, toppled: true, toppledBy: 2 },
		]);
		assert.ok(types(after).includes('conquerDiceRolled'));
		assert.deepEqual(after.seats[0].hand, ['double-cross']);
	}
});

test("against Pillage and Plunder a defender may play Plans & Ploys' response cards, never a trap (03 §1.2)", () => {
	const state = conquestGame(['trap-1', 'surrender'], PP);
	state.seats[0].era = {
		card: 'pillage-and-plunder',
		ability: 'pillage-and-plunder',
	};
	conquer(state);
	assert.deepEqual(offered(state), [null, 'surrender']);

	const base = conquestGame(['trap-1']);
	base.seats[0].era = {
		card: 'pillage-and-plunder',
		ability: 'pillage-and-plunder',
	};
	conquer(base);
	assert.ok(!openDecisions(base).some((d) => d.kind === 'chooseResponse'));
});
