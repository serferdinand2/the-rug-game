// Masterpieces (#35 part 2): the supply, create, refresh, firing, broadcast, Streaming Implants and the 20 cards.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	MASTERPIECES,
	masterpiece,
} from '../src/lib/engine/data/masterpieces.js';
import { EFFECT_KINDS } from '../src/lib/engine/data/effects.js';
import { ASSETS } from '../src/lib/art/catalog.js';
import { view } from '../src/lib/engine/view.js';
import { revealed } from '../src/lib/engine/table.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { answer, newGame, readyTurn, startedGame } from './helpers/engine.mjs';
import { allOps } from './helpers/views.mjs';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { spacesAdvanced } from '../src/lib/engine/movement.js';
import { neighbours } from '../src/lib/engine/state.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { upgradable } from '../src/lib/engine/tech.js';
import { inventors } from '../src/lib/engine/civs/inventors.js';
import { startTurn } from '../src/lib/engine/turn.js';
import { hexNeighbours } from '../src/lib/engine/data/maps.js';
import { conquerTargets } from '../src/lib/engine/map.js';
import { itemCount } from '../src/lib/engine/control.js';
import { countVp } from '../src/lib/engine/effects/vp.js';
import { capitalScore } from '../src/lib/engine/city.js';
import { checkState } from './helpers/invariants.mjs';
import { AA, ontoArts, place, reply } from './helpers/arts.mjs';

/** The masterpiece ids, as the art catalog lists them. */
const ART_IDS = ASSETS.filter((a) => a.group === 'masterpiece').map((a) =>
	a.id.replace('masterpiece/', '')
);

/**
 * Calls back for every effect in a list, inside choices and trades too.
 * @param {any[]} effects
 * @param {(effect: any) => void} visit
 */
function eachEffect(effects, visit) {
	for (const effect of effects) {
		visit(effect);
		if ('choice' in effect) {
			effect.choice.forEach((/** @type {any[]} */ option) =>
				eachEffect(option, visit)
			);
		}
		if ('trade' in effect) {
			effect.trade.offers.forEach((/** @type {any} */ offer) =>
				eachEffect(offer.gain, visit)
			);
		}
	}
}

test("the 20 masterpieces are the art's 20, two of them single-use", () => {
	assert.equal(MASTERPIECES.length, 20);
	assert.deepEqual(
		MASTERPIECES.map((m) => m.id),
		ART_IDS
	);
	assert.deepEqual(
		MASTERPIECES.filter((m) => m.singleUse).map((m) => m.id),
		['art-deco', 'mime']
	);
	for (const card of MASTERPIECES) {
		eachEffect(card.effects, (effect) => {
			const keys = Object.keys(effect);
			assert.equal(keys.length, 1, card.id);
			assert.ok(EFFECT_KINDS.includes(keys[0]), `${card.id}: ${keys[0]}`);
		});
	}
	assert.equal(masterpiece('painting').name, 'Painting');
	assert.throws(() => masterpiece('sculpture'), /no masterpiece/);
});

test('setup shuffles the masterpieces and turns 3 face up, with the arts track only', () => {
	const { state } = newGame(3, AA);
	const { deck, faceUp, discard } = state.supply.masterpieces;
	assert.equal(deck.length, 17);
	assert.equal(faceUp.length, 3);
	assert.deepEqual(discard, []);
	assert.deepEqual([...deck, ...faceUp].sort(), [...ART_IDS].sort());
	for (const seat of state.seats) {
		assert.deepEqual(seat.masterpieces, []);
		assert.deepEqual(seat.inspired, []);
	}
	checkState(state);
	for (const options of [
		{},
		{ expansions: ['pp'] },
		{ expansions: ['aa'], variants: ['no-arts-track'] },
	]) {
		const { state: off } = newGame(3, options);
		assert.ok(!('masterpieces' in off.supply), JSON.stringify(options));
		for (const seat of off.seats) {
			assert.ok(!('masterpieces' in seat));
			assert.ok(!('inspired' in seat));
		}
		checkState(off);
	}
});

test('a base game draws the same as before', () => {
	// Recorded before part 2 (seed 1, 3 players): the masterpieces' shuffle must not move a base game's draws.
	const { state } = newGame(3);
	assert.deepEqual(state.supply.tech.faceUp, [
		'the-nail',
		'eyeglasses',
		'com-tower',
	]);
	assert.deepEqual(state.supply.tapestry.deck.slice(0, 3), [
		'militarism',
		'age-of-wonders',
		'trap-5',
	]);
	assert.deepEqual(state.supply.territory.slice(0, 3), [26, 15, 24]);
	assert.equal(state.first, 3);
	assert.deepEqual(
		openDecisions(state)
			.filter((d) => d.kind === 'chooseCiv')
			.map((d) => d.options),
		[
			['merrymakers', 'historians'],
			['nomads', 'traders'],
			['the-chosen', 'inventors'],
		]
	);
});

test('view() shows the masterpiece deck as a count, and the face-up row as it is', () => {
	const { state } = newGame(3, AA);
	const shown = /** @type {any} */ (view(state, 1)).supply.masterpieces;
	assert.equal(shown.deck, 17);
	assert.deepEqual(shown.faceUp, state.supply.masterpieces.faceUp);
	assert.deepEqual(shown.discard, []);
	assert.ok(
		!(
			'masterpieces' in
			/** @type {any} */ (view(newGame(3).state, 1)).supply
		)
	);
});

test('revealed() sees a masterpiece drawn from the deck', () => {
	const { state: before } = newGame(3, AA);
	const after = structuredClone(before);
	const { masterpieces } = after.supply;
	masterpieces.faceUp.push(/** @type {string} */ (masterpieces.deck.shift()));
	assert.equal(revealed(before, after), true);
	const { state: base } = newGame(3);
	assert.equal(revealed(base, structuredClone(base)), false);
});

test("Ballet's and Modern Dance's counters count the capital's complete rows and columns", () => {
	const { state: started } = startedGame(2);
	const state = structuredClone(started);
	const seat = /** @type {any} */ (state.seats[0]);
	assert.equal(countVp(state, 1, 'capitalRow'), 0);
	// As in the capital-scoring test: row 0 and column 0 of mat 5 complete.
	seat.capital.mat = 5;
	for (let col = 0; col <= 6; col++) {
		seat.capital.buildings.push({ building: 'house', row: 0, col });
	}
	for (const row of [3, 4, 6, 7, 8]) {
		seat.capital.buildings.push({ building: 'house', row, col: 0 });
	}
	seat.capital.landmarks.push({
		landmark: 'lighthouse',
		row: -1,
		col: 7,
		rotation: 0,
	});
	const { rows, columns } = capitalScore(seat);
	assert.equal(rows, 1);
	assert.equal(columns, 1);
	assert.equal(countVp(state, 1, 'capitalRow'), rows);
	assert.equal(countVp(state, 1, 'capitalColumn'), columns);
});

/**
 * The open decision of a kind, which must be there.
 * @param {any} state
 * @param {string} kind
 * @returns {any}
 */
function openOf(state, kind) {
	const found = openDecisions(state).find((d) => d.kind === kind);
	assert.ok(
		found,
		`no open ${kind}: ${openDecisions(state).map((d) => d.kind)}`
	);
	return found;
}

test('Dance creates a face-up masterpiece and the row refills from the deck', () => {
	const r = ontoArts(3);
	const pile = r.state.supply.masterpieces;
	const [, second] = pile.faceUp;
	const top = pile.deck[0];
	const create = openOf(r.state, 'chooseCreate');
	assert.deepEqual(create.options, [...pile.faceUp, 'deck']);
	reply(r, 'chooseCreate', { card: second });
	assert.deepEqual(r.seat.masterpieces, [{ card: second, used: false }]);
	const after = r.state.supply.masterpieces;
	assert.equal(after.faceUp.length, 3);
	assert.ok(after.faceUp.includes(top), 'the deck’s old top card turned up');
	assert.ok(!after.faceUp.includes(second));
	assert.equal(after.deck.length, 16);
	checkState(r.state);
});

test("create may take the deck's top card, leaving the face-up row as it was", () => {
	const r = ontoArts(3);
	const { faceUp, deck } = r.state.supply.masterpieces;
	const row = [...faceUp];
	const top = deck[0];
	reply(r, 'chooseCreate', { card: 'deck' });
	assert.deepEqual(r.seat.masterpieces, [{ card: top, used: false }]);
	assert.deepEqual(r.state.supply.masterpieces.faceUp, row);
	assert.equal(r.state.supply.masterpieces.deck.length, 16);
});

test('a masterpiece that is not offered is refused', () => {
	const r = ontoArts(3);
	const create = openOf(r.state, 'chooseCreate');
	const absent = MASTERPIECES.map((m) => m.id).find(
		(id) => !create.options.includes(id)
	);
	assert.throws(
		() => reply(r, 'chooseCreate', { card: absent }),
		/Choose a face-up masterpiece or the deck/
	);
});

test('R119: an empty masterpiece deck reshuffles its discards', () => {
	const r = ontoArts(3, (seat, state) => {
		const pile = state.supply.masterpieces;
		pile.discard = pile.deck.splice(0);
	});
	const seq = r.state.seq;
	reply(r, 'chooseCreate', { card: 'deck' });
	const shuffled = r.state.events.filter(
		(/** @type {any} */ e) =>
			e.type === 'masterpieceDeckShuffled' && e.seq > seq
	);
	assert.deepEqual(
		shuffled.map((/** @type {any} */ e) => e.count),
		[17]
	);
	const pile = r.state.supply.masterpieces;
	assert.deepEqual(pile.discard, []);
	assert.equal(pile.deck.length, 16);
	assert.equal(r.seat.masterpieces.length, 1);
	checkState(r.state);
});

test('R119: with no deck and no discards, only the face-up cards can be created', () => {
	const r = ontoArts(3, (seat, state) => {
		const pile = state.supply.masterpieces;
		// The other 18 are held by the opponent, so all 20 are still in one place.
		const opponent = state.seats.find((/** @type {any} */ s) => s !== seat);
		opponent.masterpieces = [...pile.deck, pile.faceUp[2]].map((card) => ({
			card,
			used: false,
		}));
		pile.deck = [];
		pile.faceUp = pile.faceUp.slice(0, 2);
	});
	const two = [...r.state.supply.masterpieces.faceUp];
	assert.deepEqual(openOf(r.state, 'chooseCreate').options, two);
	reply(r, 'chooseCreate', { card: two[0] });
	assert.deepEqual(r.state.supply.masterpieces.faceUp, [two[1]]);
	checkState(r.state);
});

test("Infinite Spectrum Photography's bonus pays any 1 resource to create", () => {
	// Every board track complete, so its advance moves nothing and the bonus comes at once.
	const r = ontoArts(11, (seat) => {
		for (const track of [
			'exploration',
			'science',
			'technology',
			'military',
		]) {
			seat.tracks[track] = [12];
		}
	});
	// The tier's price took 2 of one resource; the bonus is paid with a food, of which 2 are left.
	assert.equal(r.seat.resources.food, 2);
	reply(r, 'chooseBonus', { pay: { food: 1 } });
	assert.equal(r.seat.resources.food, 1);
	const top = r.state.supply.masterpieces.deck[0];
	reply(r, 'chooseCreate', { card: 'deck' });
	assert.deepEqual(r.seat.masterpieces, [{ card: top, used: false }]);
});

/**
 * Lands on Rock Opera, places the Opera House and returns at the choice of the order of its two parts.
 * @returns {import('./helpers/arts.mjs').Run}
 */
function rockOpera() {
	const r = place(ontoArts(7));
	openOf(r.state, 'chooseOrder');
	return r;
}

test('Rock Opera may refresh the face-up masterpieces first, then create', () => {
	const r = rockOpera();
	const old = [...r.state.supply.masterpieces.faceUp];
	const next = r.state.supply.masterpieces.deck.slice(0, 3);
	reply(r, 'chooseOrder', { effect: 0 });
	reply(r, 'chooseRefresh', { refresh: true });
	const pile = r.state.supply.masterpieces;
	assert.deepEqual(pile.faceUp, next);
	assert.deepEqual(pile.discard, old);
	assert.deepEqual(openOf(r.state, 'chooseCreate').options, [
		...next,
		'deck',
	]);
	checkState(r.state);
});

test('Rock Opera may create first, then refresh or keep the row', () => {
	const r = rockOpera();
	const old = [...r.state.supply.masterpieces.faceUp];
	reply(r, 'chooseOrder', { effect: 1 });
	reply(r, 'chooseCreate', { card: old[0] });
	assert.deepEqual(r.seat.masterpieces, [{ card: old[0], used: false }]);
	const row = [...r.state.supply.masterpieces.faceUp];
	reply(r, 'chooseRefresh', { refresh: false });
	assert.deepEqual(r.state.supply.masterpieces.faceUp, row);
	assert.deepEqual(r.state.supply.masterpieces.discard, []);
	checkState(r.state);
});

test('undo is refused after a create, which turns up the deck’s top card', () => {
	const r = ontoArts(3);
	const before = r.state;
	reply(r, 'chooseCreate', { card: r.state.supply.masterpieces.faceUp[0] });
	assert.equal(revealed(before, r.state), true);
});

/**
 * Hands masterpieces to a seat from the supply's deck, so every card stays in one place.
 * @param {any} state
 * @param {any} seat
 * @param {string[]} cards
 * @param {string[]} [used] - Those of `cards` already turned face down
 */
function hold(state, seat, cards, used = []) {
	const pile = state.supply.masterpieces;
	for (const card of cards) {
		for (const list of [pile.deck, pile.faceUp, pile.discard]) {
			if (list.includes(card)) {
				list.splice(list.indexOf(card), 1);
			}
		}
		seat.masterpieces.push({ card, used: used.includes(card) });
	}
	// Keep 3 face up, as the supply always does.
	while (pile.faceUp.length < 3) {
		pile.faceUp.push(pile.deck.shift());
	}
}

/**
 * The current player of an A&A game starts an income turn (their second), after `fill` changes their seat.
 * @param {(seat: any, state: any) => void} fill
 * @param {number} [count]
 * @returns {import('./helpers/arts.mjs').Run}
 */
function incomeTurn(fill, count = 2) {
	const ready = readyTurn(count, fill, AA);
	const state = answer(
		ready.state,
		ready.random,
		ready.player,
		'chooseTurn',
		{
			turn: 'income',
		}
	);
	return {
		state,
		random: ready.random,
		player: ready.player,
		seat: state.seats[ready.player - 1],
	};
}

/**
 * The masterpieces that fired since a sequence number, as `owner:card`.
 * @param {any} state
 * @param {number} since
 * @returns {string[]}
 */
function fired(state, since) {
	return state.events
		.filter(
			(/** @type {any} */ e) =>
				e.type === 'masterpieceFired' && e.seq > since
		)
		.map((/** @type {any} */ e) => `${e.owner}:${e.card}`);
}

test("a base game's income turn has no masterpiece step", () => {
	const ready = readyTurn(2);
	const state = answer(
		ready.state,
		ready.random,
		ready.player,
		'chooseTurn',
		{
			turn: 'income',
		}
	);
	const started = state.events.findLast(
		(/** @type {any} */ e) => e.type === 'incomeTurnStarted'
	);
	assert.equal(started.turn, 2);
	assert.ok(
		!state.events.some(
			(/** @type {any} */ e) => e.type === 'masterpieceFired'
		)
	);
	// The steps after the first still wait, in the order they always had.
	const waiting = allOps(state).find(
		(/** @type {any} */ op) => op.kind === 'incomeSteps'
	);
	assert.ok(waiting);
	assert.ok(!waiting.steps.includes('masterpieces'));
});

test('at the start of an income turn every masterpiece fires, in the order the player chooses', () => {
	const r = incomeTurn((seat, state) => {
		hold(state, seat, ['fresco', 'krav-maga']);
		seat.tracks.military = [3];
	});
	const seq = r.state.seq;
	const ask = openOf(r.state, 'chooseMasterpiece');
	assert.equal(ask.purpose, 'income');
	assert.deepEqual(DECISIONS.chooseMasterpiece.answers(r.state, ask), [
		{ seat: r.player, card: 'fresco' },
		{ seat: r.player, card: 'krav-maga' },
	]);
	const vp = r.seat.vp;
	const territories = countVp(r.state, r.player, 'territory');
	reply(r, 'chooseMasterpiece', { seat: r.player, card: 'krav-maga' });
	// Krav Maga, then Fresco without asking: nothing else is left to order.
	assert.deepEqual(fired(r.state, seq), [
		`${r.player}:krav-maga`,
		`${r.player}:fresco`,
	]);
	assert.equal(r.seat.vp, vp + 3 + territories);
	assert.equal(r.seat.resources.culture, 1);
	assert.ok(
		!openDecisions(r.state).some((d) => d.kind === 'chooseMasterpiece')
	);
	checkState(r.state);
});

test('a masterpiece gained during the income step fires in the same step', () => {
	const r = incomeTurn((seat, state) => {
		hold(state, seat, ['costuming']);
		seat.tracks.arts = [2];
		seat.tracks.military = [3];
		seat.resources.coin = 1;
		// Krav Maga lies face up, for Dance to create.
		const pile = state.supply.masterpieces;
		pile.deck.push(pile.faceUp.shift());
		pile.deck.splice(pile.deck.indexOf('krav-maga'), 1);
		pile.faceUp.unshift('krav-maga');
	});
	const seq = r.state.seq;
	reply(r, 'chooseTrade', { offer: 0, pay: { coin: 1 } });
	assert.deepEqual(r.seat.tracks.arts, [3]);
	reply(r, 'chooseCreate', { card: 'krav-maga' });
	assert.deepEqual(fired(r.state, seq - 1).slice(-1), [
		`${r.player}:krav-maga`,
	]);
	assert.equal(r.seat.vp, 3);
	checkState(r.state);
});

test('a used masterpiece fires no more', () => {
	const r = incomeTurn((seat, state) => {
		hold(state, seat, ['art-deco', 'krav-maga'], ['art-deco']);
		seat.tracks.military = [2];
	});
	assert.equal(r.seat.vp, 2);
	assert.ok(
		!openDecisions(r.state).some((d) => d.kind === 'chooseMasterpiece')
	);
	assert.deepEqual(
		r.seat.masterpieces.map((/** @type {any} */ m) => m.used),
		[true, false]
	);
});

test('Carved Marble Sculpture broadcasts one of your masterpieces, or gains a building', () => {
	// One masterpiece: it fires at once.
	const one = ontoArts(6, (seat, state) => {
		hold(state, seat, ['krav-maga']);
		seat.tracks.military = [4];
	});
	reply(one, 'chooseOption', { option: 0 });
	assert.equal(one.seat.vp, 4);
	// Two: the player chooses, and only that one fires.
	const two = ontoArts(6, (seat, state) => {
		hold(state, seat, ['krav-maga', 'mapmaking']);
		seat.tracks.military = [4];
		seat.tracks.exploration = [2];
	});
	reply(two, 'chooseOption', { option: 0 });
	const ask = openOf(two.state, 'chooseMasterpiece');
	assert.equal(ask.purpose, 'broadcast');
	reply(two, 'chooseMasterpiece', { seat: two.player, card: 'mapmaking' });
	assert.equal(two.seat.vp, 2);
	assert.ok(
		!openDecisions(two.state).some((d) => d.kind === 'chooseMasterpiece')
	);
	// None: broadcasting does nothing.
	const none = ontoArts(6);
	const seq = none.state.seq;
	reply(none, 'chooseOption', { option: 0 });
	assert.ok(
		none.state.events.some(
			(/** @type {any} */ e) => e.type === 'noBroadcast' && e.seq > seq
		)
	);
	checkState(none.state);
});

test("Streaming Implants: up to 3 different masterpieces, yours and your neighbours'", () => {
	/** @type {number[]} */
	let others = [];
	const r = ontoArts(
		12,
		(seat, state) => {
			// The neighbours in the engine's order: the seat before, then the seat after.
			others = neighbours(state, seat.seat);
			const [a, b] = others.map((n) => state.seats[n - 1]);
			hold(state, seat, ['krav-maga']);
			hold(state, a, ['fresco', 'mime']);
			hold(state, b, ['art-deco', 'mapmaking'], ['art-deco']);
			seat.tracks.military = [3];
			seat.tracks.exploration = [2];
		},
		3
	);
	const [a, b] = others;
	const ask = openOf(r.state, 'chooseMasterpiece');
	assert.equal(ask.purpose, 'implants');
	// Never another player's single-use card, nor a used one.
	assert.deepEqual(DECISIONS.chooseMasterpiece.answers(r.state, ask), [
		{ card: null },
		{ seat: r.player, card: 'krav-maga' },
		{ seat: a, card: 'fresco' },
		{ seat: b, card: 'mapmaking' },
	]);
	const vp = r.seat.vp;
	const territories = countVp(r.state, r.player, 'territory');
	const theirs = [a, b].map((n) => r.state.seats[n - 1].vp);
	reply(r, 'chooseMasterpiece', { seat: a, card: 'fresco' });
	const next = openOf(r.state, 'chooseMasterpiece');
	assert.ok(
		!DECISIONS.chooseMasterpiece
			.answers(r.state, next)
			.some((answer) => answer.card === 'fresco'),
		'a masterpiece is chosen once'
	);
	reply(r, 'chooseMasterpiece', { seat: r.player, card: 'krav-maga' });
	reply(r, 'chooseMasterpiece', { seat: b, card: 'mapmaking' });
	assert.ok(
		!openDecisions(r.state).some((d) => d.kind === 'chooseMasterpiece'),
		'3 at most'
	);
	assert.equal(r.seat.vp, vp + territories + 3 + 2);
	assert.deepEqual(
		[a, b].map((n) => r.state.seats[n - 1].vp),
		theirs
	);
	checkState(r.state);
});

test('Streaming Implants may stop after one', () => {
	const r = ontoArts(12, (seat, state) => {
		hold(state, seat, ['krav-maga', 'mapmaking']);
		seat.tracks.military = [3];
	});
	// Space 12 already scored the complete-track achievement.
	const vp = r.seat.vp;
	reply(r, 'chooseMasterpiece', { seat: r.player, card: 'krav-maga' });
	reply(r, 'chooseMasterpiece', { card: null });
	assert.ok(
		!openDecisions(r.state).some((d) => d.kind === 'chooseMasterpiece')
	);
	assert.equal(r.seat.vp, vp + 3);
});

test("Streaming Implants with 2 players offers the opponent's cards once", () => {
	const r = ontoArts(12, (seat, state) => {
		const other = state.seats.find((/** @type {any} */ s) => s !== seat);
		hold(state, other, ['fresco', 'theater']);
	});
	const other = r.player === 1 ? 2 : 1;
	assert.deepEqual(
		DECISIONS.chooseMasterpiece.answers(
			r.state,
			openOf(r.state, 'chooseMasterpiece')
		),
		[
			{ card: null },
			{ seat: other, card: 'fresco' },
			{ seat: other, card: 'theater' },
		]
	);
});

test('Streaming Implants is the last arts space: it completes a track', () => {
	const r = ontoArts(12);
	assert.equal(spacesAdvanced(r.seat, 'arts'), 12);
	assert.ok(r.state.achievements['complete-track'].includes(r.player));
	assert.ok(
		!openDecisions(r.state).some((d) => d.kind === 'chooseMasterpiece'),
		'nothing to choose from'
	);
});

// The 20 masterpieces, each fired through Broadcast from a seat that holds only it.

/**
 * Fires one masterpiece for the current player of an A&A game, through Broadcast, after `fill` stages their seat.
 * @param {string} card
 * @param {(seat: any, state: any) => void} [fill]
 * @param {string[]} [also] - Other masterpieces the seat holds, after `card`
 * @returns {import('./helpers/arts.mjs').Run}
 */
function fireCard(card, fill = () => {}, also = []) {
	const ready = readyTurn(
		2,
		(seat, state) => {
			hold(state, seat, [card, ...also]);
			fill(seat, state);
		},
		AA
	);
	const state = resolveEffects(
		ready.state,
		ready.player,
		[{ broadcast: {} }],
		ready.random
	);
	return {
		state,
		random: ready.random,
		player: ready.player,
		seat: state.seats[ready.player - 1],
	};
}

/**
 * Answers the open chooseResource with that one resource.
 * @param {import('./helpers/arts.mjs').Run} r
 * @param {string} id
 */
function takeResource(r, id) {
	return reply(r, 'chooseResource', { resources: { [id]: 1 } });
}

/**
 * The open decision kinds, the turn choice underneath left out.
 * @param {import('./helpers/arts.mjs').Run} r
 * @returns {string[]}
 */
const asked = (r) =>
	openDecisions(r.state)
		.map((d) => d.kind)
		.filter((kind) => kind !== 'chooseTurn');

test('Animation: 1 VP per tech card, then any 1 resource', () => {
	const r = fireCard('animation', (seat, state) => {
		seat.tech.bottom = state.supply.tech.deck.splice(0, 2);
		seat.tech.top = state.supply.tech.deck.splice(0, 1);
	});
	assert.equal(r.seat.vp, 3);
	takeResource(r, 'food');
	assert.equal(r.seat.resources.food, 1);
	assert.deepEqual(asked(r), []);
	checkState(r.state);
});

test('Art Deco: turned face down, then an income building of your choice and any 1 resource', () => {
	const r = fireCard('art-deco');
	assert.deepEqual(r.seat.masterpieces, [{ card: 'art-deco', used: true }]);
	reply(r, 'chooseOption', { option: 1 });
	place(r);
	assert.equal(r.seat.incomeMat.buildings.house, 4);
	takeResource(r, 'coin');
	assert.equal(r.seat.resources.coin, 1);
	checkState(r.state);
});

/**
 * Stages row 0 and column 0 of capital mat 5 complete, as the capital-scoring test does.
 * @param {any} seat
 */
function oneRowOneColumn(seat) {
	seat.capital.mat = 5;
	for (let col = 0; col <= 6; col++) {
		seat.capital.buildings.push({ building: 'house', row: 0, col });
	}
	for (const row of [3, 4, 6, 7, 8]) {
		seat.capital.buildings.push({ building: 'house', row, col: 0 });
	}
	seat.capital.landmarks.push({
		landmark: 'lighthouse',
		row: -1,
		col: 7,
		rotation: 0,
	});
}

test('Ballet and Modern Dance: 1 VP per complete row or column, which is not scoring the capital', () => {
	for (const card of ['ballet', 'modern-dance']) {
		const r = fireCard(card, (seat) => oneRowOneColumn(seat));
		assert.equal(r.seat.vp, 1, card);
		assert.ok(
			!r.state.events.some(
				(/** @type {any} */ e) => e.type === 'capitalScored'
			),
			card
		);
		takeResource(r, 'worker');
		assert.equal(r.seat.resources.worker, 1);
	}
});

test('Baroque: 1 VP per armory and per farm, then food or culture', () => {
	const r = fireCard('baroque', (seat) => {
		seat.incomeMat.buildings.armory = 3;
		seat.incomeMat.buildings.farm = 4;
	});
	assert.equal(r.seat.vp, 3);
	reply(r, 'chooseOption', { option: 1 });
	assert.equal(r.seat.resources.culture, 1);
	assert.equal(r.seat.resources.food, 0);
});

test('Calligraphy: a territory tile and any 1 resource', () => {
	const r = fireCard('calligraphy');
	const tiles = r.seat.territoryTiles.length;
	takeResource(r, 'culture');
	assert.equal(r.seat.territoryTiles.length, tiles);
	assert.equal(tiles, 1);
	assert.equal(r.seat.resources.culture, 1);
	checkState(r.state);
});

test("Ceramics: upgrades a tech card, which can't be upgraded again this turn", () => {
	const r = fireCard('ceramics', (seat, state) => {
		seat.tech.bottom = state.supply.tech.deck.splice(0, 1);
		// Golden Age lets a middle-row card go up without its prerequisite, so only the lock can stop it.
		seat.era = { card: null, ability: 'golden-age' };
	});
	const [card] = r.seat.tech.middle;
	assert.ok(card, 'the only card moved up');
	assert.deepEqual(r.state.lockedTech, [{ player: r.player, card }]);
	assert.ok(!upgradable(r.state, r.player).includes(card));
	// Not by the income turn's upgrade either: with the only card locked, it asks nothing.
	const after = resolveEffects(
		r.state,
		r.player,
		[{ upgrade: { optional: true } }],
		r.random
	);
	assert.ok(
		!openDecisions(after).some((d) => d.kind === 'chooseUpgrade'),
		'the locked card is not offered'
	);
	// Nor by the Inventors.
	const inventing = structuredClone(r.state);
	const seat = /** @type {any} */ (inventing.seats[r.player - 1]);
	seat.civs = ['inventors'];
	seat.civData.inventors = { tokens: 4, cards: [] };
	inventing.supply.civs.splice(inventing.supply.civs.indexOf('inventors'), 1);
	inventors.income(
		contextFor(inventing, r.random, inventing.pending),
		r.player
	);
	run(inventing, r.random);
	const slot = openDecisions(inventing).find((d) => d.kind === 'chooseSlot');
	assert.ok(
		!(slot?.options ?? []).some(
			(/** @type {any} */ o) => o.player === r.player && o.card === card
		)
	);
	// The next turn lifts the lock.
	const next = structuredClone(r.state);
	startTurn(contextFor(next, r.random, next.pending), r.player);
	assert.deepEqual(next.lockedTech, []);
});

test('Costuming: pay any 1 resource to advance on the arts track with its benefit, or decline', () => {
	const r = fireCard('costuming', (seat) => {
		seat.resources.coin = 1;
	});
	const hand = r.seat.hand.length;
	reply(r, 'chooseTrade', { offer: 0, pay: { coin: 1 } });
	assert.deepEqual(r.seat.tracks.arts, [1]);
	assert.equal(
		r.seat.hand.length,
		hand + 1,
		'Cave Paintings: a tapestry card'
	);
	assert.equal(r.seat.resources.coin, 0);
	const no = fireCard('costuming', (seat) => {
		seat.resources.coin = 1;
	});
	reply(no, 'chooseTrade', { offer: null });
	assert.deepEqual(no.seat.tracks.arts, [0]);
	assert.equal(no.seat.resources.coin, 1);
});

test('Fresco: 1 VP per territory you control and a culture', () => {
	const r = fireCard('fresco');
	assert.equal(r.seat.vp, countVp(r.state, r.player, 'territory'));
	assert.ok(r.seat.vp > 0);
	assert.equal(r.seat.resources.culture, 1);
});

test('Graffiti: 1 VP per market and per house, then a worker or a coin', () => {
	const r = fireCard('graffiti', (seat) => {
		seat.incomeMat.buildings.market = 4;
		seat.incomeMat.buildings.house = 2;
	});
	assert.equal(r.seat.vp, 4);
	reply(r, 'chooseOption', { option: 0 });
	assert.equal(r.seat.resources.worker, 1);
});

test('Haute Cuisine: 1 VP per tapestry card in hand and on the mat, covered ones too, then any 1 resource', () => {
	const r = fireCard('haute-cuisine', (seat, state) => {
		seat.hand = state.supply.tapestry.deck.splice(0, 2);
		seat.incomeMat.tapestry[1] = state.supply.tapestry.deck.splice(0, 2);
	});
	assert.equal(r.seat.vp, 4);
	takeResource(r, 'coin');
});

test('Krav Maga, Mapmaking, Motion Picture, Stained Glass and Theater: 1 VP per space advanced on their track', () => {
	/** @type {[string, string][]} */
	const cards = [
		['krav-maga', 'military'],
		['mapmaking', 'exploration'],
		['motion-picture', 'science'],
		['stained-glass', 'technology'],
		['theater', 'arts'],
	];
	for (const [card, track] of cards) {
		const r = fireCard(card, (seat) => {
			seat.tracks[track] = [5];
		});
		assert.equal(r.seat.vp, 5, card);
	}
	// A completed track counts as 12 (BGG-2858761).
	const done = fireCard('stained-glass', (seat) => {
		seat.tracks.technology = [12];
	});
	assert.equal(done.seat.vp, 12);
});

test('Mime: pay any 1 resource to repeat a track space you are on, then it is used; declining keeps it', () => {
	const r = fireCard('mime', (seat) => {
		seat.tracks.arts = [2];
		seat.resources.food = 1;
	});
	reply(r, 'chooseTrade', { offer: 0, pay: { food: 1 } });
	assert.equal(r.seat.vp, 5, 'Flutes');
	assert.deepEqual(r.seat.masterpieces, [{ card: 'mime', used: true }]);
	const no = fireCard('mime', (seat) => {
		seat.tracks.arts = [2];
		seat.resources.food = 1;
	});
	reply(no, 'chooseTrade', { offer: null });
	assert.deepEqual(no.seat.masterpieces, [{ card: 'mime', used: false }]);
	assert.equal(no.seat.vp, 0);
});

test('Mime is turned face down before its benefit, so a broadcast inside it never offers it again', () => {
	const r = fireCard(
		'mime',
		(seat) => {
			// Carved Marble Sculpture: broadcast, or a building.
			seat.tracks.arts = [6];
			seat.tracks.military = [3];
			seat.resources.food = 1;
		},
		['krav-maga']
	);
	reply(r, 'chooseMasterpiece', { seat: r.player, card: 'mime' });
	reply(r, 'chooseTrade', { offer: 0, pay: { food: 1 } });
	// Tokens on two tracks: the repeat asks which space.
	reply(r, 'chooseRepeat', { track: 'arts', space: 6 });
	const seq = r.state.seq;
	reply(r, 'chooseOption', { option: 0 });
	// Only Krav Maga is left to broadcast, so it fires without asking.
	assert.deepEqual(fired(r.state, seq), [`${r.player}:krav-maga`]);
	assert.equal(r.seat.vp, 3);
	checkState(r.state);
});

test('Painting and Tapestry: 4 VP or a tapestry card, and any 1 resource', () => {
	const paint = fireCard('painting');
	assert.equal(paint.seat.vp, 4);
	takeResource(paint, 'food');
	const tapestry = fireCard('tapestry');
	const hand = tapestry.seat.hand.length;
	takeResource(tapestry, 'food');
	assert.equal(hand, 1);
	assert.equal(tapestry.seat.resources.food, 1);
});

test('R53 Topiary: conquer an adjacent territory with nothing on it, rolling both dice', () => {
	/** @type {string[]} */
	let empty = [];
	/** @type {string} */
	let guarded = '';
	const r = fireCard('topiary', (seat, state) => {
		const home = /** @type {string} */ (seat.start);
		const around = hexNeighbours(home).filter(
			(hex) =>
				hex in state.hexes && state.hexes[hex].outposts.length === 0
		);
		// Two unexplored neighbours become territories: one empty, one with the opponent's outpost.
		const [open, held] = around.filter(
			(hex) => state.hexes[hex].tile === null
		);
		for (const hex of [open, held]) {
			state.hexes[hex].tile = state.supply.territory.shift();
		}
		const opponent = state.seats.find((/** @type {any} */ s) => s !== seat);
		state.hexes[held].outposts.push({
			seat: opponent.seat,
			toppled: false,
		});
		opponent.outposts -= 1;
		guarded = held;
		empty = conquerTargets(state, seat.seat, false).filter(
			(hex) => itemCount(state, hex) === 0
		);
		assert.ok(empty.includes(open));
	});
	const seq = r.state.seq;
	const conquer = openDecisions(r.state).find(
		(d) => d.kind === 'chooseConquer'
	);
	const targets = conquer
		? DECISIONS.chooseConquer.answers(r.state, conquer).map((a) => a.hex)
		: [];
	if (conquer) {
		assert.deepEqual(targets, empty);
		reply(r, 'chooseConquer', { hex: empty[0] });
	} else {
		assert.equal(empty.length, 1);
	}
	assert.ok(!targets.includes(guarded));
	const rolled = r.state.events.filter(
		(/** @type {any} */ e) => e.type === 'conquerDiceRolled' && e.seq > seq
	);
	assert.equal(rolled.length, 1);
	assert.ok(rolled[0].red !== undefined && rolled[0].black !== undefined);
});
