// Tests for the civilizations that work with cards and landmarks: Heralds, Historians and Inventors (#20, design §7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { view } from '../src/lib/engine/game.js';
import { upgradable } from '../src/lib/engine/tech.js';
import { CIVS } from '../src/lib/engine/civs/index.js';
import { readyTurn, startedGame, answer, placeAll } from './helpers/engine.mjs';

const VERSIONS = /** @type {const} */ (['original', 'current']);

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
 * A copy of a started game with nothing pending, in which seat 1 holds the named civilizations, set up as at the start.
 * @param {string[]} civs
 * @param {{ count?: number, version?: 'original' | 'current' }} [options]
 * @returns {{ state: any, random: any }}
 */
function game(civs, { count = 2, version } = {}) {
	const { state: started, random } = startedGame(count, { version });
	const state = structuredClone(started);
	state.pending.length = 0;
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
 * @param {{ version?: 'original' | 'current' }} [options]
 */
function incomeTurn(civ, before, fill = () => {}, { version } = {}) {
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
		{ civs: ['nomads', civ], version }
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

/** The open decision of a kind. */
const decisionOf = (/** @type {any} */ state, /** @type {string} */ kind) =>
	/** @type {any} */ (openDecisions(state).find((d) => d.kind === kind));

/**
 * Takes tapestry cards out of the deck, so a test can put them in a hand or on top without copies.
 * @param {any} state
 * @param {string[]} cards
 */
function takeFromDeck(state, cards) {
	const deck = state.supply.tapestry;
	deck.deck = deck.deck.filter(
		(/** @type {string} */ c) => !cards.includes(c)
	);
}

/** The tapestry card income turn 1 draws (the Ceremony space's), put on top of the deck by firstIncomeTurn(). */
const INCOME_CARD = 'trap-7';

/**
 * Seat 2 of a 2-player game, holding the Heralds from setup unless `civs` says otherwise, takes income turn 1. Its
 * income draws INCOME_CARD, and `deck` lies under it.
 * @param {string[]} deck
 * @param {{ hand?: string[], civs?: string[], version?: 'original' | 'current' }} [options]
 */
function firstIncomeTurn(
	deck,
	{ hand = [], civs = ['heralds'], version = 'current' } = {}
) {
	return incomeTurn(
		'heralds',
		0,
		(seat, state) => {
			takeFromDeck(state, [INCOME_CARD, ...deck, ...hand]);
			state.supply.tapestry.deck.unshift(INCOME_CARD, ...deck);
			seat.hand = [...hand];
			seat.civs = civs;
		},
		{ version }
	);
}

/**
 * A seat gains a landmark card's landmark, places it, and runs on to the next decision.
 * @param {any} state
 * @param {any} random
 * @param {number} seat
 * @param {string} landmark
 */
const gainLandmark = (state, random, seat, landmark) =>
	placeAll(resolveEffects(state, seat, [{ landmark }], random), random);

test('Heralds copy a visible WHEN PLAYED card, one token per card', () => {
	const { state, random } = game(['heralds']);
	assert.deepEqual(state.seats[0].civData.heralds, { tokens: 4, cards: [] });
	// A trap played as a tapestry card on each mat: seat 1's era-2 slot and seat 2's Maker of Fire (R22).
	state.seats[0].incomeMat.tapestry[1] = ['trap-1'];
	state.seats[1].incomeMat.tapestry[0] = ['trap-2'];

	const asked = ability(state, random, 'heralds');
	const pick = decisionOf(asked, 'chooseSlot');
	assert.deepEqual(
		[pick.player, pick.purpose, pick.optional],
		[1, 'heralds', true]
	);
	// Any income mat, the player's own included.
	assert.deepEqual(pick.options, [
		{ player: 1, card: 'trap-1' },
		{ player: 2, card: 'trap-2' },
	]);

	const mark = asked.seq;
	const copied = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, card: 'trap-2' },
	});
	// The card's ability, as the player's own: the trap's 10 VP. The card stays where it is.
	assert.equal(copied.seats[0].vp, state.seats[0].vp + 10);
	assert.equal(copied.seats[1].vp, state.seats[1].vp);
	assert.deepEqual(copied.seats[1].incomeMat.tapestry[0], ['trap-2']);
	assert.deepEqual(copied.seats[0].civData.heralds, {
		tokens: 3,
		cards: ['trap-2'],
	});
	assert.deepEqual(eventsOf(copied, 'heraldsCopied', mark), [
		{ type: 'heraldsCopied', player: 1, owner: 2, card: 'trap-2' },
	]);
	assert.equal(copied.seats[0].era, null);
	assert.deepEqual(openDecisions(copied), []);

	// A card holds one Herald token, so the next income turn offers only the other.
	const again = ability(copied, random, 'heralds', 3);
	assert.deepEqual(decisionOf(again, 'chooseSlot').options, [
		{ player: 1, card: 'trap-1' },
	]);
	const own = answer(again, random, 1, 'chooseSlot', {
		slot: { player: 1, card: 'trap-1' },
	});
	assert.equal(own.seats[0].vp, state.seats[0].vp + 20);
	assert.deepEqual(own.seats[0].civData.heralds, {
		tokens: 2,
		cards: ['trap-2', 'trap-1'],
	});
	assert.deepEqual(openDecisions(ability(own, random, 'heralds', 4)), []);

	// Declining keeps the token.
	const declined = answer(asked, random, 1, 'chooseSlot', { slot: null });
	assert.deepEqual(declined.seats[0].civData.heralds, {
		tokens: 4,
		cards: [],
	});
	assert.equal(declined.seats[0].vp, state.seats[0].vp);

	// With no token left, nothing is asked.
	const spent = structuredClone(state);
	spent.seats[0].civData.heralds.tokens = 0;
	assert.deepEqual(openDecisions(ability(spent, random, 'heralds')), []);

	// Step 1 of income turns 2 to 5 asks.
	for (const before of [1, 2, 3, 4]) {
		const r = incomeTurn('heralds', before, (_seat, s) => {
			s.seats[0].incomeMat.tapestry[0] = ['trap-1'];
		});
		const offered = decisionOf(r.state, 'chooseSlot');
		assert.deepEqual(
			[offered.player, offered.purpose, offered.options],
			[2, 'heralds', [{ player: 1, card: 'trap-1' }]]
		);
	}
});

test('Heralds cannot copy a THIS ERA or covered card', () => {
	const { state, random } = game(['heralds']);
	// A THIS ERA card on top, a WHEN PLAYED card under a THIS ERA one, and a WHEN PLAYED card face down.
	state.seats[0].incomeMat.tapestry[1] = ['academia'];
	state.seats[1].incomeMat.tapestry[1] = ['trap-1', 'golden-age'];
	state.seats[1].incomeMat.tapestry[2] = ['trap-2'];
	state.seats[1].incomeMat.faceDown = ['trap-2'];
	const none = ability(state, random, 'heralds');
	assert.deepEqual(openDecisions(none), []);
	assert.deepEqual(eventsOf(none, 'heraldsCopied'), []);
	assert.deepEqual(none.seats[0].civData.heralds, { tokens: 4, cards: [] });

	// A WHEN PLAYED card on top of a slot is offered, whatever lies under it.
	state.seats[1].incomeMat.tapestry[1].push('trap-3');
	assert.deepEqual(
		decisionOf(ability(state, random, 'heralds'), 'chooseSlot').options,
		[{ player: 2, card: 'trap-3' }]
	);
});

test('original Heralds may play any card on Maker of Fire at the end of income turn 1', () => {
	const r = firstIncomeTurn([], {
		hand: ['academia', 'trap-1'],
		version: 'original',
	});
	const pick = decisionOf(r.state, 'chooseTapestry');
	assert.deepEqual(
		[pick.player, pick.options, pick.era, pick.optional],
		[2, ['academia', 'trap-1', INCOME_CARD], 1, true]
	);
	assert.deepEqual(DECISIONS.chooseTapestry.answers(r.state, pick), [
		{ card: null },
		{ card: 'academia' },
		{ card: 'trap-1' },
		{ card: INCOME_CARD },
	]);
	// Nothing is drawn: R35's draw is the current version's.
	assert.deepEqual(eventsOf(r.state, 'cardsRevealed', r.since), []);

	// A THIS ERA card becomes the active ability, which outlasts the turn (until income turn 2's era end).
	const era = answer(r.state, r.random, 2, 'chooseTapestry', {
		card: 'academia',
	});
	assert.deepEqual(era.seats[1].incomeMat.tapestry[0], ['academia']);
	assert.deepEqual(era.seats[1].hand, ['trap-1', INCOME_CARD]);
	assert.deepEqual(era.seats[1].era, {
		card: 'academia',
		ability: 'academia',
	});
	assert.deepEqual(
		openDecisions(era).map((d) => [d.player, d.kind]),
		[[1, 'chooseTurn']]
	);

	// A WHEN PLAYED card's ability resolves: the trap's 10 VP (R22).
	const trap = answer(r.state, r.random, 2, 'chooseTapestry', {
		card: 'trap-1',
	});
	assert.deepEqual(trap.seats[1].incomeMat.tapestry[0], ['trap-1']);
	assert.equal(trap.seats[1].vp, r.state.seats[1].vp + 10);

	// Declining keeps the hand.
	const kept = answer(r.state, r.random, 2, 'chooseTapestry', { card: null });
	assert.deepEqual(kept.seats[1].incomeMat.tapestry[0], []);
	assert.deepEqual(kept.seats[1].hand, ['academia', 'trap-1', INCOME_CARD]);

	// With an empty hand, nothing is asked: here no card is left for the income to draw.
	const empty = incomeTurn(
		'heralds',
		0,
		(seat, state) => {
			state.supply.tapestry.deck = [];
			state.supply.tapestry.discard = [];
			seat.hand = [];
		},
		{ version: 'original' }
	);
	assert.deepEqual(empty.state.seats[1].hand, []);
	assert.equal(decisionOf(empty.state, 'chooseTapestry'), undefined);
	// Only the player who started with the Heralds plays on Maker of Fire.
	const gained = firstIncomeTurn([], {
		hand: ['academia'],
		civs: ['leaders', 'heralds'],
		version: 'original',
	});
	assert.equal(decisionOf(gained.state, 'chooseTapestry'), undefined);
});

test('current Heralds draw until a WHEN PLAYED card and may play one but not Renaissance on Maker of Fire (R35)', () => {
	const r = firstIncomeTurn(['academia', 'golden-age', 'trap-1', 'trap-3'], {
		hand: ['trap-2'],
	});
	// After the income's card, the THIS ERA cards drawn are revealed and discarded; the trap counts as WHEN PLAYED
	// and goes to the hand.
	assert.deepEqual(eventsOf(r.state, 'cardsRevealed', r.since), [
		{ type: 'cardsRevealed', player: 2, cards: ['academia', 'golden-age'] },
	]);
	assert.deepEqual(r.state.supply.tapestry.discard.slice(-2), [
		'academia',
		'golden-age',
	]);
	assert.equal(r.state.supply.tapestry.deck[0], 'trap-3');
	assert.deepEqual(r.state.seats[1].hand, ['trap-2', INCOME_CARD, 'trap-1']);
	// Only the card found may go on Maker of Fire.
	const pick = decisionOf(r.state, 'chooseTapestry');
	assert.deepEqual(
		[pick.player, pick.options, pick.era, pick.optional],
		[2, ['trap-1'], 1, true]
	);
	assert.deepEqual(DECISIONS.chooseTapestry.answers(r.state, pick), [
		{ card: null },
		{ card: 'trap-1' },
	]);
	assert.throws(
		() =>
			answer(r.state, r.random, 2, 'chooseTapestry', { card: 'trap-2' }),
		{
			name: 'PlayerError',
			message: 'Play one of the tapestry cards in your hand.',
		}
	);

	// Everyone sees the discards; the card kept is hidden like any card in hand until it is played.
	const theirs = view(r.state, 1);
	assert.deepEqual(eventsOf(theirs, 'cardsRevealed', r.since), [
		{ type: 'cardsRevealed', player: 2, cards: ['academia', 'golden-age'] },
	]);
	assert.deepEqual(eventsOf(theirs, 'cardsDrawn', r.since), [
		{ type: 'cardsDrawn', player: 2, count: 1 },
		{ type: 'cardsDrawn', player: 2, count: 1 },
	]);
	assert.equal(decisionOf(theirs, 'chooseTapestry').options, undefined);
	assert.equal(theirs.seats[1].hand, undefined);
	assert.deepEqual(
		eventsOf(view(r.state, 2), 'cardsDrawn', r.since).map((e) => e.secret),
		[{ cards: [INCOME_CARD] }, { cards: ['trap-1'] }]
	);

	// Played: its ability resolves, the trap's 10 VP (R22).
	const played = answer(r.state, r.random, 2, 'chooseTapestry', {
		card: 'trap-1',
	});
	assert.deepEqual(played.seats[1].incomeMat.tapestry[0], ['trap-1']);
	assert.deepEqual(played.seats[1].hand, ['trap-2', INCOME_CARD]);
	assert.equal(played.seats[1].vp, r.state.seats[1].vp + 10);
	// Declined: it stays in the hand.
	const kept = answer(r.state, r.random, 2, 'chooseTapestry', { card: null });
	assert.deepEqual(kept.seats[1].incomeMat.tapestry[0], []);
	assert.deepEqual(kept.seats[1].hand, ['trap-2', INCOME_CARD, 'trap-1']);

	// Renaissance goes to the hand but can't be played on Maker of Fire.
	const renaissance = firstIncomeTurn(['academia', 'renaissance']);
	assert.deepEqual(
		eventsOf(renaissance.state, 'cardsRevealed', renaissance.since),
		[{ type: 'cardsRevealed', player: 2, cards: ['academia'] }]
	);
	assert.deepEqual(renaissance.state.seats[1].hand, [
		INCOME_CARD,
		'renaissance',
	]);
	assert.equal(decisionOf(renaissance.state, 'chooseTapestry'), undefined);

	// A WHEN PLAYED card on top reveals nothing more.
	const first = firstIncomeTurn(['trap-1']);
	assert.deepEqual(eventsOf(first.state, 'cardsRevealed', first.since), []);
	assert.deepEqual(decisionOf(first.state, 'chooseTapestry').options, [
		'trap-1',
	]);

	// The original version draws nothing and offers the hand instead.
	const original = firstIncomeTurn(['academia', 'trap-1'], {
		hand: ['trap-2'],
		version: 'original',
	});
	assert.deepEqual(
		eventsOf(original.state, 'cardsRevealed', original.since),
		[]
	);
	assert.deepEqual(original.state.seats[1].hand, ['trap-2', INCOME_CARD]);
	assert.deepEqual(decisionOf(original.state, 'chooseTapestry').options, [
		'trap-2',
		INCOME_CARD,
	]);

	// Heralds gained mid-game draw nothing (R34).
	const gained = firstIncomeTurn(['academia', 'trap-1'], {
		civs: ['leaders', 'heralds'],
	});
	assert.deepEqual(eventsOf(gained.state, 'cardsRevealed', gained.since), []);
	assert.deepEqual(gained.state.seats[1].hand, [INCOME_CARD]);
	assert.equal(decisionOf(gained.state, 'chooseTapestry'), undefined);
});

test('Historians give a token for a territory tile and gain every uncovered square when that opponent gains a landmark (R30)', () => {
	const { state, random } = game(['historians'], { count: 3 });
	assert.deepEqual(state.seats[0].civData.historians, {
		squares: [true, true, true, true],
		given: {},
	});
	// Without a territory tile, nothing is asked.
	state.seats[0].territoryTiles = [];
	assert.deepEqual(openDecisions(ability(state, random, 'historians')), []);

	state.seats[0].territoryTiles = [5, 9];
	const asked = ability(state, random, 'historians');
	const pick = decisionOf(asked, 'chooseSlot');
	assert.deepEqual(
		[pick.player, pick.purpose, pick.optional],
		[1, 'historians', true]
	);
	// R30: any opponent, and any square still covered, chosen by the Historians player.
	assert.deepEqual(
		pick.options,
		[2, 3].flatMap((to) => [0, 1, 2, 3].map((square) => ({ to, square })))
	);

	const mark = asked.seq;
	const given = answer(asked, random, 1, 'chooseSlot', {
		slot: { to: 2, square: 1 },
	});
	assert.deepEqual(given.seats[0].civData.historians, {
		squares: [true, false, true, true],
		given: { 2: 1 },
	});
	assert.deepEqual(eventsOf(given, 'historiansGave', mark), [
		{ type: 'historiansGave', player: 1, to: 2, square: 1 },
	]);
	// Then the tile: the player chooses which one to discard.
	const tile = decisionOf(given, 'chooseSlot');
	assert.deepEqual(
		[tile.purpose, tile.optional, tile.options],
		['historiansTile', false, [5, 9]]
	);
	const paid = answer(given, random, 1, 'chooseSlot', { slot: 9 });
	assert.deepEqual(paid.seats[0].territoryTiles, [5]);
	assert.deepEqual(paid.supply.territoryDiscard, [9]);
	assert.deepEqual(eventsOf(paid, 'tilesDiscarded', mark), [
		{ type: 'tilesDiscarded', player: 1, stack: 'territory', tiles: [9] },
	]);
	assert.deepEqual(openDecisions(paid), []);

	// With one tile, it is discarded without asking.
	const one = structuredClone(state);
	one.seats[0].territoryTiles = [5];
	const single = answer(
		ability(one, random, 'historians'),
		random,
		1,
		'chooseSlot',
		{
			slot: { to: 3, square: 0 },
		}
	);
	assert.deepEqual(single.seats[0].territoryTiles, []);
	assert.deepEqual(single.supply.territoryDiscard, [5]);
	assert.deepEqual(openDecisions(single), []);

	// Declining keeps the tile and the token.
	const declined = answer(asked, random, 1, 'chooseSlot', { slot: null });
	assert.deepEqual(declined.seats[0].territoryTiles, [5, 9]);
	assert.deepEqual(
		declined.seats[0].civData.historians,
		state.seats[0].civData.historians
	);

	// Seat 2 holds a token: each landmark it gains pays seat 1 every uncovered square, here 1 food.
	const fed = gainLandmark(paid, random, 2, 'barn');
	assert.equal(fed.seats[1].capital.landmarks.length, 1);
	assert.equal(fed.seats[0].resources.food, paid.seats[0].resources.food + 1);
	assert.equal(fed.seats[0].vp, paid.seats[0].vp);
	// Seat 3 holds none: nothing.
	const other = gainLandmark(paid, random, 3, 'barn');
	assert.deepEqual(other.seats[0].resources, paid.seats[0].resources);
	assert.equal(other.seats[0].vp, paid.seats[0].vp);
	// Nor for seat 1's own landmark.
	const mine = gainLandmark(paid, random, 1, 'barn');
	assert.deepEqual(mine.seats[0].resources, paid.seats[0].resources);

	// A second token to seat 2 uncovers the 3 VP square: one landmark pays both squares, once.
	const second = structuredClone(paid);
	second.seats[0].territoryTiles = [5];
	const twice = answer(
		ability(second, random, 'historians', 3),
		random,
		1,
		'chooseSlot',
		{ slot: { to: 2, square: 0 } }
	);
	assert.deepEqual(twice.seats[0].civData.historians, {
		squares: [false, false, true, true],
		given: { 2: 2 },
	});
	const both = gainLandmark(twice, random, 2, 'barn');
	assert.equal(both.seats[0].vp, twice.seats[0].vp + 3);
	assert.equal(
		both.seats[0].resources.food,
		twice.seats[0].resources.food + 1
	);

	// With every square uncovered, no token is left to give.
	const empty = structuredClone(state);
	empty.seats[0].civData.historians.squares = [false, false, false, false];
	assert.deepEqual(openDecisions(ability(empty, random, 'historians')), []);

	// Step 1 of income turns 2 to 5 asks.
	for (const before of [1, 2, 3, 4]) {
		const r = incomeTurn('historians', before, (seat) => {
			seat.territoryTiles = [5];
		});
		const offered = decisionOf(r.state, 'chooseSlot');
		assert.deepEqual([offered.player, offered.purpose], [2, 'historians']);
	}
});

test('a finished Historians player gains only the VP squares', () => {
	const { state, random } = game(['historians']);
	state.seats[0].civData.historians = {
		squares: [false, false, false, false],
		given: { 2: 4 },
	};
	const playing = gainLandmark(state, random, 2, 'barn');
	assert.equal(playing.seats[0].vp, state.seats[0].vp + 6);
	assert.equal(
		playing.seats[0].resources.food,
		state.seats[0].resources.food + 1
	);
	assert.equal(
		playing.seats[0].resources.worker,
		state.seats[0].resources.worker + 1
	);

	state.seats[0].finished = true;
	const finished = gainLandmark(state, random, 2, 'barn');
	assert.equal(finished.seats[0].vp, state.seats[0].vp + 6);
	assert.deepEqual(finished.seats[0].resources, state.seats[0].resources);
});

test('Historians gained mid-game give all 4 tokens', () => {
	const { state, random } = game([], { count: 3 });
	state.supply.civs = [
		'historians',
		...state.supply.civs.filter(
			(/** @type {string} */ c) => c !== 'historians'
		),
	];
	state.seats[0].territoryTiles = [5];
	let next = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(next.seats[0].civs, ['historians']);
	// One opponent for each token, in square order; nothing to decline, and no tile to discard.
	for (const [square, to] of [
		[0, 2],
		[1, 3],
		[2, 2],
		[3, 2],
	]) {
		const pick = decisionOf(next, 'chooseSlot');
		assert.deepEqual(
			[pick.purpose, pick.optional, pick.options],
			[
				'historians',
				false,
				[
					{ to: 2, square },
					{ to: 3, square },
				],
			]
		);
		next = answer(next, random, 1, 'chooseSlot', { slot: { to, square } });
	}
	assert.deepEqual(next.seats[0].civData.historians, {
		squares: [false, false, false, false],
		given: { 2: 3, 3: 1 },
	});
	assert.deepEqual(next.seats[0].territoryTiles, [5]);
	assert.deepEqual(openDecisions(next), []);

	// With one opponent, all 4 go to it without asking.
	const { state: pair, random: r2 } = game([]);
	pair.supply.civs = [
		'historians',
		...pair.supply.civs.filter(
			(/** @type {string} */ c) => c !== 'historians'
		),
	];
	const all = resolveEffects(pair, 1, [{ gainCiv: {} }], r2);
	assert.deepEqual(all.seats[0].civData.historians, {
		squares: [false, false, false, false],
		given: { 2: 4 },
	});
	assert.deepEqual(openDecisions(all), []);
});

test('Inventors upgrade any card instantly, ignoring its prerequisite for good', () => {
	const { state, random } = game(['inventors']);
	assert.deepEqual(state.seats[0].civData.inventors, {
		tokens: 4,
		cards: [],
	});
	state.seats[0].tech = {
		bottom: ['transistors'],
		middle: ['penicillin'],
		top: [],
	};
	state.seats[1].tech = {
		bottom: ['calendar'],
		middle: ['canned-food'],
		top: [],
	};
	// Nobody has advanced, so no middle-row prerequisite is met (R18).
	assert.deepEqual(upgradable(state, 1), ['transistors']);
	assert.deepEqual(upgradable(state, 2), ['calendar']);

	const asked = ability(state, random, 'inventors');
	const pick = decisionOf(asked, 'chooseSlot');
	assert.deepEqual(
		[pick.player, pick.purpose, pick.optional],
		[1, 'inventors', true]
	);
	// Every card in any player's bottom or middle row.
	assert.deepEqual(pick.options, [
		{ player: 1, card: 'transistors' },
		{ player: 1, card: 'penicillin' },
		{ player: 2, card: 'calendar' },
		{ player: 2, card: 'canned-food' },
	]);

	// A middle-row card goes to the top row at once, prerequisite or not: Penicillin's square, 5 VP.
	const mark = asked.seq;
	const top = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 1, card: 'penicillin' },
	});
	assert.deepEqual(top.seats[0].tech, {
		bottom: ['transistors'],
		middle: [],
		top: ['penicillin'],
	});
	assert.equal(top.seats[0].vp, state.seats[0].vp + 5);
	assert.deepEqual(top.seats[0].civData.inventors, {
		tokens: 3,
		cards: ['penicillin'],
	});
	assert.deepEqual(eventsOf(top, 'inventorsMarked', mark), [
		{ type: 'inventorsMarked', player: 1, owner: 1, card: 'penicillin' },
	]);
	assert.deepEqual(openDecisions(top), []);

	// A bottom-row card goes to the middle row (Transistors' circle, 1 coin), and its prerequisite (military tier 4)
	// never applies to it again.
	const middle = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 1, card: 'transistors' },
	});
	assert.deepEqual(middle.seats[0].tech.middle, [
		'penicillin',
		'transistors',
	]);
	assert.equal(
		middle.seats[0].resources.coin,
		state.seats[0].resources.coin + 1
	);
	assert.deepEqual(upgradable(middle, 1), ['transistors']);
	const later = resolveEffects(middle, 1, [{ upgrade: {} }], random);
	assert.deepEqual(later.seats[0].tech.top, ['transistors']);

	// On an opponent's card the waiver holds for its owner too.
	const theirs = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, card: 'calendar' },
	});
	assert.deepEqual(theirs.seats[1].tech.middle, ['canned-food', 'calendar']);
	assert.equal(
		theirs.seats[1].resources.culture,
		state.seats[1].resources.culture + 1
	);
	assert.deepEqual(upgradable(theirs, 2), ['calendar']);

	// Declining keeps the token; with none left, nothing is asked.
	const declined = answer(asked, random, 1, 'chooseSlot', { slot: null });
	assert.deepEqual(declined.seats[0].civData.inventors, {
		tokens: 4,
		cards: [],
	});
	assert.deepEqual(declined.seats[0].tech, state.seats[0].tech);
	const spent = structuredClone(state);
	spent.seats[0].civData.inventors.tokens = 0;
	assert.deepEqual(openDecisions(ability(spent, random, 'inventors')), []);

	// Step 1 of income turns 2 to 5 asks.
	for (const before of [1, 2, 3, 4]) {
		const r = incomeTurn('inventors', before, (seat) => {
			seat.tech.bottom = ['calendar'];
		});
		const offered = decisionOf(r.state, 'chooseSlot');
		assert.deepEqual(
			[offered.player, offered.purpose, offered.options],
			[2, 'inventors', [{ player: 2, card: 'calendar' }]]
		);
	}
});

test("Inventors may copy an opponent's upgrade and take the card when it reaches the top row", (t) => {
	const { state, random } = game(['inventors']);
	state.seats[0].tech = { bottom: [], middle: [], top: [] };
	state.seats[1].tech = {
		bottom: ['calendar'],
		middle: ['canned-food'],
		top: [],
	};
	const asked = ability(state, random, 'inventors');

	// Their bottom-row card: they gain its circle (1 culture), then seat 1 may too.
	const circle = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, card: 'calendar' },
	});
	assert.equal(
		circle.seats[1].resources.culture,
		state.seats[1].resources.culture + 1
	);
	const offer = decisionOf(circle, 'chooseOption');
	assert.deepEqual(
		[offer.player, offer.purpose, offer.options],
		[1, 'civOffer', [[], [{ gain: { culture: 1 } }]]]
	);
	const copied = answer(circle, random, 1, 'chooseOption', { option: 1 });
	assert.equal(
		copied.seats[0].resources.culture,
		state.seats[0].resources.culture + 1
	);
	assert.deepEqual(copied.seats[1].tech.middle, ['canned-food', 'calendar']);
	assert.deepEqual(openDecisions(copied), []);

	// They upgrade it to the top row: their square (7 VP), then seat 1 may gain it, then takes the card.
	const mark = copied.seq;
	const squared = resolveEffects(copied, 2, [{ upgrade: {} }], random);
	assert.equal(squared.seats[1].vp, copied.seats[1].vp + 7);
	assert.deepEqual(decisionOf(squared, 'chooseOption').options, [
		[],
		[{ vp: 7 }],
	]);
	const taken = answer(squared, random, 1, 'chooseOption', { option: 1 });
	assert.equal(taken.seats[0].vp, copied.seats[0].vp + 7);
	assert.deepEqual(taken.seats[1].tech, {
		bottom: [],
		middle: ['canned-food'],
		top: [],
	});
	assert.deepEqual(taken.seats[0].tech.bottom, ['calendar']);
	assert.deepEqual(eventsOf(taken, 'inventorsTook', mark), [
		{ type: 'inventorsTook', player: 1, from: 2, card: 'calendar' },
	]);
	// The token stays on it, so its prerequisite stays waived.
	assert.deepEqual(taken.seats[0].civData.inventors.cards, ['calendar']);
	assert.deepEqual(openDecisions(taken), []);
	// Declining the square still takes the card.
	const declined = answer(squared, random, 1, 'chooseOption', { option: 0 });
	assert.equal(declined.seats[0].vp, copied.seats[0].vp);
	assert.deepEqual(declined.seats[0].tech.bottom, ['calendar']);

	// Taking the card changes counts (Mystics), after the upgrade's own check.
	/** @type {number[]} */
	const counted = [];
	CIVS.watcher = {
		id: 'watcher',
		hooks: {
			countsChanged(_state, _owner, { player }) {
				counted.push(player);
				return [];
			},
		},
	};
	t.after(() => {
		delete CIVS.watcher;
	});
	const watched = structuredClone(copied);
	watched.seats[0].civs = ['inventors', 'watcher'];
	answer(
		resolveEffects(watched, 2, [{ upgrade: {} }], random),
		random,
		1,
		'chooseOption',
		{ option: 0 }
	);
	assert.deepEqual(counted, [2, 1]);

	// A token sending their middle-row card straight to the top row: the square is offered once, then the card taken.
	const straight = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, card: 'canned-food' },
	});
	assert.equal(straight.seats[1].vp, state.seats[1].vp + 7);
	assert.deepEqual(decisionOf(straight, 'chooseOption').options, [
		[],
		[{ vp: 7 }],
	]);
	const once = answer(straight, random, 1, 'chooseOption', { option: 1 });
	assert.deepEqual(openDecisions(once), []);
	assert.equal(once.seats[0].vp, state.seats[0].vp + 7);
	assert.deepEqual(once.seats[0].tech.bottom, ['canned-food']);
	assert.deepEqual(once.seats[1].tech.top, []);

	// A finished Inventors player gains only the square's VP and takes no card.
	const finished = structuredClone(copied);
	finished.seats[0].finished = true;
	const done = resolveEffects(finished, 2, [{ upgrade: {} }], random);
	assert.equal(decisionOf(done, 'chooseOption'), undefined);
	assert.equal(done.seats[0].vp, copied.seats[0].vp + 7);
	assert.deepEqual(done.seats[1].tech.top, ['calendar']);
	assert.deepEqual(done.seats[0].tech.bottom, []);

	// Their upgrade of a card without the token offers nothing.
	const plain = resolveEffects(state, 2, [{ upgrade: {} }], random);
	assert.deepEqual(plain.seats[1].tech.middle, ['canned-food', 'calendar']);
	assert.deepEqual(openDecisions(plain), []);
});

test('Golden Age gives no VP for an Inventors upgrade', () => {
	const { state, random } = game(['inventors']);
	state.seats[0].tech = { bottom: ['calendar'], middle: [], top: [] };
	state.seats[1].tech = { bottom: ['canned-food'], middle: [], top: [] };
	for (const seat of state.seats) {
		seat.era = { card: 'golden-age', ability: 'golden-age' };
	}
	const asked = ability(state, random, 'inventors');
	// Seat 1's own card: its circle (1 culture), and no Golden Age VP.
	const own = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 1, card: 'calendar' },
	});
	assert.equal(
		own.seats[0].resources.culture,
		state.seats[0].resources.culture + 1
	);
	assert.equal(own.seats[0].vp, state.seats[0].vp);
	// An opponent's card: none for its owner either.
	const theirs = answer(asked, random, 1, 'chooseSlot', {
		slot: { player: 2, card: 'canned-food' },
	});
	assert.equal(
		theirs.seats[1].resources.food,
		state.seats[1].resources.food + 1
	);
	assert.equal(theirs.seats[1].vp, state.seats[1].vp);
	// The holder's own upgrade still scores 3 VP.
	const plain = resolveEffects(state, 1, [{ upgrade: {} }], random);
	assert.equal(plain.seats[0].vp, state.seats[0].vp + 3);
});

test('Heralds, Historians and Inventors behave the same in both versions apart from R35', () => {
	/** @type {Record<string, any>} */
	const seen = {};
	for (const version of VERSIONS) {
		// Setup: only their tokens, and no adjustment (R34, R35).
		const base = startedGame(2, { civs: ['leaders', 'nomads'], version })
			.state.seats;
		const { state: dealt } = startedGame(2, {
			civs: ['heralds', 'historians'],
			version,
		});
		const { state: dealt2 } = startedGame(2, {
			civs: ['inventors', 'nomads'],
			version,
		});
		assert.deepEqual(dealt.seats[0].civData.heralds, {
			tokens: 4,
			cards: [],
		});
		assert.deepEqual(dealt.seats[1].civData.historians, {
			squares: [true, true, true, true],
			given: {},
		});
		assert.deepEqual(dealt2.seats[0].civData.inventors, {
			tokens: 4,
			cards: [],
		});
		for (const seat of [...dealt.seats, ...dealt2.seats]) {
			const before = base[seat.seat - 1];
			assert.equal(seat.vp, before.vp, version);
			assert.deepEqual(seat.resources, before.resources, version);
			assert.equal(seat.hand.length, before.hand.length, version);
		}

		// The end of income turn 1: Historians and Inventors do nothing in either version.
		for (const civ of ['historians', 'inventors']) {
			const r = incomeTurn(civ, 0, () => {}, { version });
			assert.deepEqual(
				openDecisions(r.state).map((d) => [d.player, d.kind]),
				[[1, 'chooseTurn']],
				`${civ} ${version}`
			);
		}

		// Each ability on the same table, with its first offer taken.
		const { state, random } = game(['heralds', 'historians', 'inventors'], {
			version,
		});
		state.seats[1].incomeMat.tapestry[0] = ['trap-2'];
		state.seats[0].territoryTiles = [5];
		state.seats[1].tech.bottom = ['calendar'];
		let next = state;
		for (const civ of ['heralds', 'historians', 'inventors']) {
			const asked = ability(next, random, civ);
			const pick = decisionOf(asked, 'chooseSlot');
			next = answer(asked, random, 1, 'chooseSlot', {
				slot: pick.options[0],
			});
		}
		next = answer(next, random, 1, 'chooseOption', { option: 1 });
		next = gainLandmark(next, random, 2, 'barn');
		seen[version] = {
			seats: next.seats.map((/** @type {any} */ s) => ({
				vp: s.vp,
				resources: s.resources,
				tech: s.tech,
				civData: s.civData,
				territoryTiles: s.territoryTiles,
			})),
			open: openDecisions(next),
		};
	}
	assert.deepEqual(seen.original, seen.current);
	// The table ends with every effect taken: the trap's 10 VP, a token for seat 2, Calendar's circle for both.
	assert.deepEqual(seen.current.open, []);
	assert.equal(seen.current.seats[0].civData.historians.given[2], 1);
});
