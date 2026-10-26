// Tests for the optional variants a table may switch on (#53).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { view } from '../src/lib/engine/view.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { run } from '../src/lib/engine/loop.js';
import { BASE_TECH, techDeck } from '../src/lib/engine/decks.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { answer, newGame, readyTurn, startedGame } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';
import { checkViews, setupFacts } from './helpers/views.mjs';
import { defaultAction } from '../src/lib/engine/game.js';
import { CAPITAL_MATS } from '../src/lib/engine/data/capitals.js';
import { ISLANDS } from '../src/lib/engine/setup.js';

/** @typedef {import('../src/lib/engine/state.js').State} State */
/** @typedef {import('../src/lib/engine/random.js').Random} Random */

/**
 * The current player takes an income turn, run until the next decision.
 * @param {State} state
 * @param {Random} random
 */
function takeIncome(state, random) {
	const player = /** @type {number} */ (state.current);
	return {
		state: answer(state, random, player, 'chooseTurn', { turn: 'income' }),
		player,
	};
}

/**
 * Answers a player's open decisions with their defaults until a decision of `kind` opens or the player has none left.
 * @param {State} state
 * @param {Random} random
 * @param {number} player
 * @param {string} kind
 * @returns {State}
 */
function answerUntil(state, random, player, kind) {
	for (;;) {
		const open = openDecisions(state).find((d) => d.player === player);
		if (!open || open.kind === kind) {
			return state;
		}
		const [first] = DECISIONS[open.kind].answers(state, open);
		state = play(state, player, { decision: open.id, ...first }, random);
	}
}

/**
 * The open decision of a kind, if any.
 * @param {State} state
 * @param {string} kind
 */
const openOf = (state, kind) =>
	openDecisions(state).find((d) => d.kind === kind);

/**
 * The operation with an id, looked for inside groups too.
 * @param {any[]} pending
 * @param {number} id
 * @returns {any}
 */
function opIn(pending, id) {
	for (const op of pending) {
		if (op.id === id) {
			return op;
		}
		for (const lane of op.lanes ?? []) {
			const found = opIn(lane.stack, id);
			if (found) {
				return found;
			}
		}
	}
	return undefined;
}

/**
 * Whether a view shows an id anywhere.
 * @param {unknown} seen
 * @param {string} id
 */
const shows = (seen, id) => JSON.stringify(seen).includes(`"${id}"`);

test('tapestry-draft: income turn 1 draws 2 tapestry cards and asks which to keep', () => {
	const { state: started, random } = startedGame(2, {
		variants: ['tapestry-draft'],
	});
	const top = started.supply.tapestry.deck.slice(0, 2);
	const { state, player } = takeIncome(started, random);
	const keep = openOf(state, 'chooseKeep');
	assert.ok(keep);
	assert.equal(keep.player, player);
	assert.deepEqual(keep.options, top);
	assert.equal(keep.keep, 1);
	assert.deepEqual(state.seats[player - 1].hand, top);
	assert.deepEqual(
		DECISIONS.chooseKeep.answers(state, keep),
		top.map((card) => ({ card }))
	);
	const other = player === 1 ? 2 : 1;
	for (const card of top) {
		assert.ok(!shows(view(state, other), card), card);
	}
	assert.throws(
		() => answer(state, random, player, 'chooseKeep', { card: 'nope' }),
		{ name: 'PlayerError' }
	);

	const after = answer(state, random, player, 'chooseKeep', {
		card: top[1],
	});
	assert.deepEqual(after.seats[player - 1].hand, [top[1]]);
	assert.deepEqual(after.supply.tapestry.discard, [top[0]]);
	const discarded = after.events.find((e) => e.type === 'cardsDiscarded');
	assert.equal(discarded?.player, player);
	assert.equal(discarded?.deck, 'tapestry');
	assert.deepEqual(discarded?.cards, [top[0]]);
	assert.equal(openOf(after, 'chooseKeep'), undefined);
});

test('tapestry-draft: without the variant, income turn 1 draws 1 card and asks nothing', () => {
	const { state: started, random } = startedGame(2);
	const [first] = started.supply.tapestry.deck;
	const { state, player } = takeIncome(started, random);
	assert.equal(openOf(state, 'chooseKeep'), undefined);
	assert.deepEqual(state.seats[player - 1].hand, [first]);
});

test('tapestry-draft: income turn 2 draws its 1 card as usual', () => {
	const { state: ready, random } = readyTurn(2, () => {}, {
		variants: ['tapestry-draft'],
	});
	const { state: taken, player } = takeIncome(ready, random);
	const state = answerUntil(taken, random, player, 'chooseKeep');
	assert.equal(openOf(state, 'chooseKeep'), undefined);
	assert.equal(state.seats[player - 1].incomeTurns, 2);
	assert.equal(state.seats[player - 1].hand.length, 1);
});

test('tapestry-draft: with 1 card left in the deck and none in the discards, it is gained without a question', () => {
	const { state: started, random } = startedGame(2, {
		variants: ['tapestry-draft'],
	});
	const [last] = started.supply.tapestry.deck;
	started.supply.tapestry.deck = [last];
	const { state, player } = takeIncome(started, random);
	assert.equal(openOf(state, 'chooseKeep'), undefined);
	assert.deepEqual(state.seats[player - 1].hand, [last]);
});

test('tapestry-draft: gaining a tapestry card triggers for the kept card only (Academia)', () => {
	const { state: started, random } = startedGame(2, {
		variants: ['tapestry-draft'],
	});
	const player = /** @type {number} */ (started.current);
	started.seats[player - 1].era = { card: null, ability: 'academia' };
	const { state } = takeIncome(started, random);
	assert.equal(state.seats[player - 1].vp, 0);
	const [card] = openOf(state, 'chooseKeep')?.options ?? [];
	const after = answer(state, random, player, 'chooseKeep', { card });
	assert.equal(after.seats[player - 1].vp, 3);
});

/**
 * A started 2-player game in which seat 1 gains a civilization, with the deck and discards given, run until the
 * next decision.
 * @param {string[]} variants
 * @param {string[]} deck - The civilization deck, top first
 * @param {string[]} [discard]
 */
function gainCivGame(variants, deck, discard = []) {
	const { state: started, random } = startedGame(2, { variants });
	const state = structuredClone(started);
	state.supply.civs = [...deck];
	state.supply.civDiscard = [...discard];
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ gainCiv: {} }] },
	]);
	run(state, random);
	return { state, random };
}

test('civ-draft: gaining a civilization draws 2 and asks which to keep; the other is discarded face up', () => {
	const { state, random } = gainCivGame(
		['civ-draft'],
		['historians', 'craftsmen', 'nomads']
	);
	const pick = openOf(state, 'chooseCiv');
	assert.ok(pick);
	assert.equal(pick.player, 1);
	assert.equal(pick.midGame, true);
	assert.deepEqual(pick.options, ['historians', 'craftsmen']);
	assert.deepEqual(state.supply.civs, ['nomads']);
	assert.deepEqual(DECISIONS.chooseCiv.answers(state, pick), [
		{ civ: 'historians' },
		{ civ: 'craftsmen' },
	]);
	// Neither was dealt at setup, so nothing public names them yet.
	for (const civ of pick.options) {
		assert.ok(!shows(view(state, null), civ), civ);
	}
	const seen = view(state, 2);
	assert.equal(opIn(seen.pending, pick.id)?.options, undefined);
	const drawn = seen.events.find((e) => e.type === 'civsDrawn');
	assert.equal(drawn?.count, 2);
	assert.ok(!('secret' in (drawn ?? {})));
	assert.throws(
		() => answer(state, random, 1, 'chooseCiv', { civ: 'nomads' }),
		{ name: 'PlayerError', message: /you drew/ }
	);

	const after = answer(state, random, 1, 'chooseCiv', { civ: 'craftsmen' });
	assert.deepEqual(after.seats[0].civs, ['craftsmen']);
	assert.deepEqual(after.supply.civDiscard, ['historians']);
	const since = state.seq;
	assert.deepEqual(
		after.events
			.filter((e) => e.seq > since)
			.filter((e) => ['civDiscarded', 'civGained'].includes(e.type))
			.map((e) => [e.type, e.player, e.civ]),
		[
			['civDiscarded', 1, 'historians'],
			['civGained', 1, 'craftsmen'],
		]
	);
	assert.equal(openOf(after, 'chooseCiv'), undefined);
});

test('civ-draft: with 1 civilization to draw it is gained without a question, with none nothing is', () => {
	// drawCiv never rebuilds the deck from a lone discard, the one discarded last.
	const { state: one } = gainCivGame(['civ-draft'], ['leaders'], ['nomads']);
	assert.equal(openOf(one, 'chooseCiv'), undefined);
	assert.deepEqual(one.seats[0].civs, ['leaders']);
	assert.deepEqual(one.supply.civDiscard, ['nomads']);

	const { state: none } = gainCivGame(['civ-draft'], []);
	assert.deepEqual(none.seats[0].civs, []);
	assert.ok(none.events.some((e) => e.type === 'noCivLeft'));
});

test('civ-draft: without the variant, the top civilization is gained at once', () => {
	const { state } = gainCivGame([], ['leaders', 'craftsmen']);
	assert.equal(openOf(state, 'chooseCiv'), undefined);
	assert.deepEqual(state.seats[0].civs, ['leaders']);
	assert.deepEqual(state.supply.civs, ['craftsmen']);
});

test('civ-draft: keeping the Mystics discards them for another civilization, drafted again', () => {
	const { state, random } = gainCivGame(
		['civ-draft'],
		['mystics', 'leaders', 'craftsmen', 'nomads']
	);
	const after = answer(state, random, 1, 'chooseCiv', { civ: 'mystics' });
	assert.deepEqual(after.seats[0].civs, []);
	assert.deepEqual(after.supply.civDiscard, ['leaders', 'mystics']);
	const again = openOf(after, 'chooseCiv');
	assert.equal(again?.midGame, true);
	assert.deepEqual(again?.options, ['craftsmen', 'nomads']);
});

test('neoprene-nanotechnology: the bonus of Nanotechnology costs 2 tech cards instead of 3, for 10 VP', () => {
	assert.equal(TRACKS.technology[11].id, 'nanotechnology');
	/** @param {string[]} variants */
	const offered = (variants) => {
		const { state: started, random } = startedGame(2, { variants });
		const state = structuredClone(started);
		state.seats[0].tech.bottom = state.supply.tech.deck.splice(0, 3);
		push(state, state.pending, [
			{ player: 1, kind: 'bonus', track: 'technology', space: 11 },
		]);
		run(state, random);
		return { state, random, offer: openOf(state, 'chooseBonus') };
	};
	assert.deepEqual(offered([]).offer?.cost, { tech: 3 });

	const { state, random, offer } = offered(['neoprene-nanotechnology']);
	assert.deepEqual(offer?.cost, { tech: 2 });
	assert.deepEqual(offer?.gain, [{ vp: 10 }]);
	const [, first] = DECISIONS.chooseBonus.answers(state, offer);
	const after = answer(state, random, 1, 'chooseBonus', first);
	assert.equal(after.seats[0].vp, 10);
	assert.equal(after.seats[0].tech.bottom.length, 1);
});

test('no-radio-battery: Radio and Lithium-Ion Battery are left out of the tech deck', () => {
	assert.deepEqual(techDeck([]), [...BASE_TECH]);
	assert.deepEqual(
		techDeck(['no-radio-battery']),
		BASE_TECH.filter(
			(card) => card !== 'radio' && card !== 'lithium-ion-battery'
		)
	);
	const { state } = newGame(2, { variants: ['no-radio-battery'] });
	const cards = [...state.supply.tech.deck, ...state.supply.tech.faceUp];
	assert.equal(cards.length, 31);
	assert.ok(!cards.includes('radio'));
	assert.ok(!cards.includes('lithium-ion-battery'));
	checkState(state);
});

/**
 * Where a seat's starting outposts stand.
 * @param {State} state
 * @param {number} seat
 * @returns {string | undefined}
 */
const startOf = (state, seat) =>
	Object.entries(state.hexes).find(([, hex]) =>
		hex.outposts.some((o) => o.seat === seat)
	)?.[0];

test('R110: the islands are the start regions round the map, in capital-number order', () => {
	assert.deepEqual(ISLANDS.large, [
		'-3_-3',
		'-3_0',
		'0_3',
		'3_3',
		'3_0',
		'0_-3',
	]);
	assert.deepEqual(ISLANDS.small, ['-2_-2', '0_2', '2_0']);
});

test('R110: with closest-island, players start round the map in seat order, spaced evenly', () => {
	for (const count of [2, 3, 4, 5]) {
		const turns = new Set();
		for (let seed = 1; seed <= 12; seed++) {
			const { state } = newGame(count, {
				seed,
				variants: ['closest-island'],
			});
			const islands = ISLANDS[state.map];
			const k = islands.length;
			const turn = islands.indexOf(
				/** @type {string} */ (startOf(state, 1))
			);
			assert.ok(turn >= 0, `${count} players, seed ${seed}`);
			turns.add(turn);
			for (let i = 0; i < count; i++) {
				assert.equal(
					startOf(state, i + 1),
					islands[(turn + Math.floor((i * k) / count)) % k],
					`${count} players, seed ${seed}, seat ${i + 1}`
				);
			}
		}
		assert.ok(turns.size > 1, `${count} players: the first island varies`);
	}
});

test('R110: four players on the large map leave gaps of 1, 2, 1 and 2 islands', () => {
	const { state } = newGame(4, { variants: ['closest-island'] });
	const islands = ISLANDS.large;
	const at = [1, 2, 3, 4].map((seat) =>
		islands.indexOf(/** @type {string} */ (startOf(state, seat)))
	);
	const gaps = at.map((island, i) => (at[(i + 1) % 4] - island + 6) % 6);
	assert.deepEqual(gaps, [1, 2, 1, 2]);
});

test('R110: the capital mats are dealt as without the variant', () => {
	for (const count of [2, 3, 4, 5]) {
		const { state: plain } = newGame(count, { seed: 3 });
		const { state: island } = newGame(count, {
			seed: 3,
			variants: ['closest-island'],
		});
		/** @param {State} state */
		const dealt = (state) =>
			state.events
				.filter((e) => e.type === 'capitalDealt')
				.map((e) => [e.player, e.capital ?? e.options]);
		assert.deepEqual(dealt(island), dealt(plain), `${count} players`);
	}
});

test('R110: a solo player still starts on 2/4 (R40)', () => {
	const { state } = newGame(1, { variants: ['closest-island'] });
	assert.equal(startOf(state, 1), '0_2');
});

test('a timeout answers the drafts with their first option', () => {
	const { state: started, random } = startedGame(2, {
		variants: ['tapestry-draft'],
	});
	const { state, player } = takeIncome(started, random);
	const keep = openOf(state, 'chooseKeep');
	assert.deepEqual(defaultAction(state, player), {
		decision: keep?.id,
		card: keep?.options[0],
	});

	const { state: drawing } = gainCivGame(
		['civ-draft'],
		['historians', 'craftsmen']
	);
	const pick = openOf(drawing, 'chooseCiv');
	assert.deepEqual(defaultAction(drawing, 1), {
		decision: pick?.id,
		civ: 'historians',
	});
});

test('tapestry-draft: a deck of 1 card is refilled from the discards for the second card', () => {
	const { state: started, random } = startedGame(2, {
		variants: ['tapestry-draft'],
	});
	const [top, ...rest] = started.supply.tapestry.deck;
	started.supply.tapestry.deck = [top];
	started.supply.tapestry.discard = rest;
	const { state, player } = takeIncome(started, random);
	const keep = openOf(state, 'chooseKeep');
	assert.equal(keep?.options[0], top);
	assert.ok(rest.includes(keep?.options[1]));
	const after = answer(state, random, player, 'chooseKeep', {
		card: keep?.options[1],
	});
	checkState(after);
});

test('civ-draft: a deck of 1 is rebuilt from the discards for the second, without the one discarded last', () => {
	const { state } = gainCivGame(
		['civ-draft'],
		['craftsmen'],
		['historians', 'alchemists', 'leaders']
	);
	const pick = openOf(state, 'chooseCiv');
	assert.equal(pick?.options[0], 'craftsmen');
	assert.ok(['historians', 'alchemists'].includes(pick?.options[1]));
	assert.ok(state.supply.civDiscard.includes('leaders'));
});

test('without closest-island, outposts start where the capital mats say', () => {
	for (const count of [2, 3, 4, 5]) {
		const { state } = newGame(count, { seed: 5 });
		for (const event of state.events.filter(
			(e) => e.type === 'capitalDealt'
		)) {
			const mat = CAPITAL_MATS[(event.capital ?? event.options[0]) - 1];
			assert.equal(
				startOf(state, event.player),
				mat.start[state.map],
				`${count} players, seat ${event.player}`
			);
		}
	}
});

test('the view checker reports a drawn civilization shown to another seat', () => {
	const { state } = gainCivGame(['civ-draft'], ['historians', 'craftsmen']);
	const facts = setupFacts(state);
	checkViews(state, facts);
	const leaky = structuredClone(state);
	leaky.events.push({ seq: leaky.seq + 1, type: 'leak', civ: 'historians' });
	assert.throws(
		() => checkViews(leaky, facts, { before: state }),
		/drawn civilization historians/
	);
});
