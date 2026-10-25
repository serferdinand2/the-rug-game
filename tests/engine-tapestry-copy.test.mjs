// Tests for Espionage, which copies the ability of a visible tapestry card (#19, design §7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { startedGame, answer, resolveTapestry } from './helpers/engine.mjs';

/**
 * A started game for `count` players, copied so a test may change it.
 * @param {number} [count]
 */
function game(count = 2) {
	const { state, random } = startedGame(count);
	return { state: structuredClone(state), random };
}

/**
 * Puts a face-up card on top of a seat's era slot.
 * @param {any} state
 * @param {number} player
 * @param {string} card
 * @param {number} [era]
 */
function put(state, player, card, era = 2) {
	state.seats[player - 1].incomeMat.tapestry[era - 1].push(card);
}

/**
 * The open decision of a kind.
 * @param {any} state
 * @param {string} kind
 */
function open(state, kind) {
	const decision = openDecisions(state).find((d) => d.kind === kind);
	assert.ok(decision, `no open ${kind}`);
	return decision;
}

/**
 * The events of one type, without their numbers.
 * @param {any} state
 * @param {string} type
 */
function eventsOf(state, type) {
	return state.events
		.filter((/** @type {any} */ e) => e.type === type)
		.map(({ seq: _seq, ...e }) => e);
}

/**
 * Plays Espionage for seat 1 as a copy of the state, in era 2.
 * @param {any} state
 * @param {any} random
 */
function espionage(state, random) {
	return resolveTapestry(state, random, 1, 'espionage');
}

test('Espionage copies a WHEN PLAYED card on any income mat', () => {
	const { state, random } = game(3);
	put(state, 2, 'age-of-wonders', 3);
	put(state, 3, 'democracy', 2);
	let next = espionage(state, random);
	const copy = open(next, 'chooseCopy');
	assert.deepEqual(DECISIONS.chooseCopy.answers(next, copy), [
		{ player: 2, card: 'age-of-wonders' },
		{ player: 3, card: 'democracy' },
	]);
	assert.throws(
		() =>
			answer(next, random, 1, 'chooseCopy', {
				player: 2,
				card: 'democracy',
			}),
		/Choose one of the tapestry cards offered\./
	);
	const before = next.seats[0].hand.length;
	next = answer(next, random, 1, 'chooseCopy', {
		player: 3,
		card: 'democracy',
	});
	// Democracy: gain 3 tapestry cards, then the player is asked what to discard.
	assert.equal(next.seats[0].hand.length, before + 3);
	assert.ok(openDecisions(next).some((d) => d.kind === 'chooseDiscard'));
	assert.equal(next.seats[0].era, null);
	assert.deepEqual(eventsOf(next, 'noCopy'), []);
});

test('Espionage copying a THIS ERA card makes it active until Espionage is covered', () => {
	const { state, random } = game(2);
	put(state, 2, 'golden-age', 2);
	let next = espionage(state, random);
	// Only one card can be copied, so it is taken without asking.
	assert.equal(
		openDecisions(next).some((d) => d.kind === 'chooseCopy'),
		false
	);
	assert.deepEqual(next.seats[0].era, {
		card: 'espionage',
		ability: 'golden-age',
	});
	assert.deepEqual(eventsOf(next, 'eraStarted'), [
		{
			type: 'eraStarted',
			player: 1,
			card: 'espionage',
			ability: 'golden-age',
		},
	]);
	// Covering Espionage ends it.
	const covered = resolveTapestry(next, random, 1, 'democracy', 2);
	assert.equal(covered.seats[0].era, null);
	assert.deepEqual(eventsOf(covered, 'eraEnded'), [
		{
			type: 'eraEnded',
			player: 1,
			card: 'espionage',
			ability: 'golden-age',
		},
	]);
});

test('Espionage copying Alliance or Marriage of State asks for the partner', () => {
	const { state, random } = game(3);
	put(state, 2, 'alliance', 2);
	let next = espionage(state, random);
	const partner = open(next, 'choosePartner');
	assert.deepEqual(DECISIONS.choosePartner.answers(next, partner), [
		{ player: 2 },
		{ player: 3 },
	]);
	next = answer(next, random, 1, 'choosePartner', { player: 3 });
	assert.deepEqual(next.seats[0].era, {
		card: 'espionage',
		ability: 'alliance',
		opponent: 3,
	});

	const marriage = game(3);
	put(marriage.state, 3, 'marriage-of-state', 2);
	let wed = espionage(marriage.state, marriage.random);
	const options = DECISIONS.choosePartner.answers(
		wed,
		open(wed, 'choosePartner')
	);
	assert.ok(options.every((o) => typeof o.track === 'string'));
	wed = answer(wed, marriage.random, 1, 'choosePartner', options[0]);
	assert.equal(wed.seats[0].era?.ability, 'marriage-of-state');
	assert.equal(wed.seats[0].era?.card, 'espionage');
});

test('Espionage can copy a trap played as a tapestry card (R22)', () => {
	const { state, random } = game(2);
	put(state, 2, 'trap-3', 2);
	const vp = state.seats[0].vp;
	const next = espionage(state, random);
	assert.deepEqual(
		openDecisions(next).map((d) => d.kind),
		['chooseTurn']
	);
	assert.equal(next.seats[0].vp, vp + 10);
});

test('Espionage cannot copy covered cards, face-down cards or itself, and does nothing without a target', () => {
	const { state, random } = game(3);
	// Seat 2: Democracy covered by Alliance's slot sibling; seat 3: a face-down card and another Espionage.
	put(state, 2, 'democracy', 2);
	put(state, 2, 'age-of-wonders', 2);
	put(state, 3, 'alliance', 2);
	state.seats[2].incomeMat.faceDown.push('alliance');
	put(state, 3, 'espionage', 3);
	const next = espionage(state, random);
	// Only Age of Wonders is left: democracy is covered, alliance is face down, espionage is excluded.
	assert.equal(
		openDecisions(next).some((d) => d.kind === 'chooseCopy'),
		false
	);
	assert.equal(eventsOf(next, 'noCopy').length, 0);

	const alone = game(2);
	const none = espionage(alone.state, alone.random);
	assert.deepEqual(eventsOf(none, 'noCopy'), [{ type: 'noCopy', player: 1 }]);
	assert.deepEqual(
		openDecisions(none).map((d) => d.kind),
		['chooseTurn']
	);
	assert.equal(none.seats[0].era, null);
});
