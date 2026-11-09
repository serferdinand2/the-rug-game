// Arts & Architecture's 5 civilizations (#37 part 3), numbers as 03 §2.4: the deck, then each civilization.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	AA_CIVS,
	BASE_CIVS,
	PP_CIVS,
	civsFor,
} from '../src/lib/engine/decks.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { endTurn, startTurn } from '../src/lib/engine/turn.js';
import { landmarksOwned } from '../src/lib/engine/effects/vp.js';
import { plannersGroup } from '../src/lib/engine/civs/urban-planners.js';
import { checkState } from './helpers/invariants.mjs';
import { emit } from '../src/lib/engine/events.js';
import { gamblers } from '../src/lib/engine/civs/gamblers.js';
import { heralds } from '../src/lib/engine/civs/heralds.js';
import { answer, answerDefaults, startedGame } from './helpers/engine.mjs';
import { AA } from './helpers/arts.mjs';

/**
 * A started A&A game for 3 players, seat 1 holding `civ`, its pending stack cleared, after `fill` changes it.
 * @param {string} civ
 * @param {(state: any) => void} [fill]
 * @param {Record<string, any>} [options]
 */
function holding(civ, fill = () => {}, options = {}) {
	const { state, random } = startedGame(3, {
		...AA,
		...options,
		civs: [civ, 'leaders', 'nomads'],
	});
	state.pending.length = 0;
	fill(state);
	return { state, random };
}

/**
 * Ends seat 1's turn of a kind, as the engine does once the turn's work is done, and runs what follows until a
 * question.
 * @param {any} state
 * @param {any} random
 * @param {'advance' | 'income'} kind
 * @param {string[]} [gained] - Event types emitted during the turn first, such as 'buildingGained'
 */
function endOf(state, random, kind, gained = []) {
	state.current = 1;
	state.turnKind = kind;
	emit(state, { type: 'turnStarted', player: 1 });
	for (const type of gained) {
		emit(state, { type, player: 1, building: 'farm', landmark: 'forge' });
	}
	endTurn(contextFor(state, random, state.pending), {
		id: 0,
		batch: 0,
		player: 1,
		kind: 'endTurn',
	});
	run(state, random);
	return state;
}

// The deck

test("A&A's civilizations join its deck after the base and P&P ones, as they are built", () => {
	assert.deepEqual(civsFor([]), [...BASE_CIVS]);
	assert.deepEqual(civsFor(['pp']), [...BASE_CIVS, ...PP_CIVS]);
	assert.deepEqual(civsFor(['aa']), [...BASE_CIVS, ...AA_CIVS]);
	assert.deepEqual(civsFor(['pp', 'aa']), [
		...BASE_CIVS,
		...PP_CIVS,
		...AA_CIVS,
	]);
	assert.ok(AA_CIVS.includes('relentless'));
	// The one-expansion variant stays Plans & Ploys' (#37 design §4).
	assert.deepEqual(civsFor(['pp', 'aa'], ['civs-from-pp']), [...PP_CIVS]);
});

// The Relentless

test('the Relentless: a token at the end of an income or advance turn on which a building or landmark was gained', () => {
	const { state, random } = holding('relentless');
	const tokens = () => state.seats[0].civData.relentless.tokens;
	assert.equal(tokens(), 0);
	endOf(state, random, 'income', ['buildingGained']);
	assert.equal(tokens(), 1);
	state.pending.length = 0;
	endOf(state, random, 'advance', ['landmarkGained']);
	assert.equal(tokens(), 2);
	// An income turn without a building keeps them.
	state.pending.length = 0;
	endOf(state, random, 'income');
	assert.equal(tokens(), 2);
});

test('the Relentless: an advance turn without one cashes them in: 2 tokens are 3 VP and a tapestry card', () => {
	const { state, random } = holding('relentless', (s) => {
		s.seats[0].civData.relentless.tokens = 2;
	});
	const vp = state.seats[0].vp;
	const hand = state.seats[0].hand.length;
	endOf(state, random, 'advance');
	assert.equal(state.seats[0].civData.relentless.tokens, 0);
	assert.equal(state.seats[0].vp, vp + 3);
	assert.equal(state.seats[0].hand.length, hand + 1);
});

test("the Relentless' chart: 1, 3, 6, 10 and 15 VP, with a choice of extras from 3 tokens (R62: the teal icon is explore)", () => {
	/** @type {[number, number, number][]} */
	const chart = [
		[1, 1, 0],
		[3, 6, 2],
		[4, 10, 3],
		[5, 15, 4],
		[7, 15, 4],
	];
	for (const [count, vp, extras] of chart) {
		const { state, random } = holding('relentless', (s) => {
			s.seats[0].civData.relentless.tokens = count;
		});
		const before = state.seats[0].vp;
		endOf(state, random, 'advance');
		assert.equal(state.seats[0].vp, before + vp, `${count} tokens`);
		const [choice] = openDecisions(state);
		if (extras === 0) {
			assert.notEqual(choice?.kind, 'chooseOption', `${count} tokens`);
			continue;
		}
		assert.equal(choice.kind, 'chooseOption', `${count} tokens`);
		assert.deepEqual(
			choice.options,
			[
				[{ gain: { tapestry: 1 } }],
				[{ gain: { any: 1 } }],
				[{ explore: {} }],
				[{ invent: {} }],
			].slice(0, extras),
			`${count} tokens`
		);
		const next = answer(state, random, 1, 'chooseOption', { option: 0 });
		assert.equal(next.seats[0].civData.relentless.tokens, 0);
	}
});

// The Renegades

test('the Renegades: an advance into a tier that matches their next space may take it instead of the benefit and bonus (03 §2.4)', () => {
	const { state, random } = holding('renegades', (s) => {
		s.seats[0].territoryTiles = [];
	});
	assert.deepEqual(state.seats[0].civData.renegades, { at: 0 });
	const moved = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['exploration'] } }],
		random
	);
	const [decision] = openDecisions(moved);
	assert.equal(decision.kind, 'chooseRenegades');
	assert.deepEqual(DECISIONS.chooseRenegades.answers(moved, decision), [
		{ renegades: false },
		{ renegades: true },
	]);
	// Space I: a tapestry card and an income building of your choice, instead of Scouting's 2 territory tiles.
	const hand = moved.seats[0].hand.length;
	const taken = answerDefaults(
		answer(moved, random, 1, 'chooseRenegades', { renegades: true }),
		random
	);
	assert.deepEqual(taken.seats[0].civData.renegades, { at: 1 });
	assert.equal(taken.seats[0].hand.length, hand + 1);
	assert.deepEqual(taken.seats[0].territoryTiles, []);
	assert.ok(
		!taken.events.some(
			(/** @type {any} */ e) =>
				e.type === 'spaceActivated' && e.track === 'exploration'
		)
	);
	const kept = answer(moved, random, 1, 'chooseRenegades', {
		renegades: false,
	});
	assert.equal(kept.seats[0].territoryTiles.length, 2);
	assert.deepEqual(kept.seats[0].civData.renegades, { at: 0 });
});

test("the Renegades: no offer when the tiers don't match, without a benefit, or going back", () => {
	const offered = (
		/** @type {Record<string, any>} */ effect,
		/** @type {(s: any) => void} */ fill
	) => {
		const { state, random } = holding('renegades', fill);
		const moved = resolveEffects(state, 1, [effect], random);
		return openDecisions(moved).some((d) => d.kind === 'chooseRenegades');
	};
	const at =
		(/** @type {number} */ space, /** @type {number} */ renegades) =>
		(/** @type {any} */ s) => {
			s.seats[0].tracks.technology = [space];
			s.seats[0].civData.renegades.at = renegades;
			// Taken already, so no placement asks first.
			s.landmarks = [];
		};
	// Into tier II (space 4) while the next Renegades space is I.
	assert.equal(
		offered({ advance: { tracks: ['technology'] } }, at(3, 0)),
		false
	);
	assert.equal(
		offered({ advance: { tracks: ['technology'] } }, at(3, 1)),
		true
	);
	// Within tier II.
	assert.equal(
		offered({ advance: { tracks: ['technology'] } }, at(4, 1)),
		true
	);
	assert.equal(
		offered(
			{ advance: { tracks: ['technology'], noBenefit: true } },
			at(3, 1)
		),
		false
	);
	assert.equal(
		offered({ regress: { tracks: ['technology'] } }, at(5, 1)),
		false
	);
});

test("the Renegades' last space: 20 VP, and their track's end counts for completing a track", () => {
	const { state, random } = holding('renegades', (s) => {
		s.seats[0].tracks.military = [9];
		s.seats[0].civData.renegades.at = 3;
		s.landmarks = [];
	});
	const vp = state.seats[0].vp;
	const moved = resolveEffects(
		state,
		1,
		[{ advance: { tracks: ['military'] } }],
		random
	);
	const done = answer(moved, random, 1, 'chooseRenegades', {
		renegades: true,
	});
	assert.deepEqual(done.seats[0].civData.renegades, { at: 4 });
	assert.deepEqual(done.achievements['complete-track'], [1]);
	// 20 VP and the achievement's first box (10 VP on the small map).
	assert.equal(done.seats[0].vp, vp + 20 + 10);
});

// The Gamblers

/**
 * Seat 1 holds the Gamblers from the start, and the tapestry deck's top 3 cards are `top`.
 * @param {string[]} top
 */
function gambling(top) {
	return holding('gamblers', (s) => {
		s.supply.tapestry.deck = [
			...top,
			...s.supply.tapestry.deck.filter(
				(/** @type {string} */ id) => !top.includes(id)
			),
		];
		for (const seat of s.seats) {
			seat.hand = seat.hand.filter(
				(/** @type {string} */ id) => !top.includes(id)
			);
		}
	});
}

/**
 * Runs a Gamblers ability for seat 1.
 * @param {any} state
 * @param {any} random
 * @param {(ctx: any) => void} ability
 */
function runAbility(state, random, ability) {
	ability(contextFor(state, random, state.pending));
	run(state, random);
	return state;
}

test('the Gamblers: at the end of income turn 1, 3 cards revealed and the WHEN PLAYED one played on Maker of Fire (03 §2.4)', () => {
	const { state, random } = gambling(['dark-ages', 'academia', 'militarism']);
	assert.deepEqual(state.seats[0].civData.gamblers, { started: true });
	runAbility(state, random, (ctx) => gamblers.firstTurnEnd?.(ctx, 1));
	assert.deepEqual(state.seats[0].incomeMat.tapestry[0], ['dark-ages']);
	assert.ok(state.supply.tapestry.discard.includes('academia'));
	assert.ok(state.supply.tapestry.discard.includes('militarism'));
	assert.deepEqual(
		state.events
			.filter((e) => e.type === 'gamblersRevealed')
			.map((e) => e.cards),
		[['dark-ages', 'academia', 'militarism']]
	);
});

test("the Gamblers: with 2 WHEN PLAYED cards they choose; at income turn 2's start, on the era's slot", () => {
	const { state, random } = gambling(['feudalism', 'guilds', 'academia']);
	runAbility(state, random, (ctx) => gamblers.income?.(ctx, 1, 2));
	const [decision] = openDecisions(state);
	assert.equal(decision.kind, 'chooseSlot');
	assert.equal(decision.purpose, 'gamblers');
	assert.deepEqual(decision.options, ['feudalism', 'guilds']);
	const played = answer(state, random, 1, 'chooseSlot', { slot: 'guilds' });
	assert.deepEqual(played.seats[0].incomeMat.tapestry[1], ['guilds']);
	assert.ok(played.supply.tapestry.discard.includes('feudalism'));
});

test('the Gamblers: with no WHEN PLAYED card they keep 1 in hand; gained later, they do nothing', () => {
	const { state, random } = gambling(['academia', 'militarism', 'monarchy']);
	const hand = state.seats[0].hand.length;
	runAbility(state, random, (ctx) => gamblers.firstTurnEnd?.(ctx, 1));
	const [decision] = openDecisions(state);
	assert.equal(decision.purpose, 'gamblersKeep');
	const kept = answer(state, random, 1, 'chooseSlot', { slot: 'monarchy' });
	assert.equal(kept.seats[0].hand.length, hand + 1);
	assert.ok(kept.seats[0].hand.includes('monarchy'));
	assert.deepEqual(kept.seats[0].incomeMat.tapestry[0], []);
	const late = gambling(['dark-ages', 'academia', 'militarism']);
	late.state.seats[0].civData.gamblers.started = false;
	runAbility(late.state, late.random, (ctx) => gamblers.income?.(ctx, 1, 3));
	assert.deepEqual(late.state.seats[0].incomeMat.tapestry[2], []);
});

test("R35: the Heralds' current-rules draw also stops at a CONTINUOUS card, which may go on Maker of Fire (#37)", () => {
	const { state, random } = holding('heralds', (s) => {
		const top = ['academia', 'commercial-center', 'dark-ages'];
		s.supply.tapestry.deck = [
			...top,
			...s.supply.tapestry.deck.filter(
				(/** @type {string} */ id) => !top.includes(id)
			),
		];
	});
	runAbility(state, random, (ctx) =>
		heralds.adjustment?.firstTurnEnd?.(ctx, 1)
	);
	assert.ok(state.seats[0].hand.includes('commercial-center'));
	assert.ok(state.supply.tapestry.discard.includes('academia'));
	const [offer] = openDecisions(state);
	assert.equal(offer.kind, 'chooseTapestry');
	assert.deepEqual(offer.options, ['commercial-center']);
});

// The Urban Planners

test('the Urban Planners: after the landmark draft, one more card from the landmark deck (03 §2.4)', () => {
	const { state } = startedGame(3, {
		...AA,
		civs: ['urban-planners', 'leaders', 'nomads'],
	});
	const seat = state.seats[0];
	assert.equal(seat.extraLandmarkCards.length, 1);
	assert.notEqual(seat.landmarkCard, null);
	assert.ok(
		!state.supply.landmarkCards.includes(seat.extraLandmarkCards[0].card)
	);
	checkState(state);
});

test('the Urban Planners: a gained landmark may wait on their mat, and is placed later at the start of a turn (R130)', () => {
	let { state, random } = holding('urban-planners');
	const gained = resolveEffects(state, 1, [{ landmark: 'forge' }], random);
	const [decision] = openDecisions(gained);
	assert.equal(decision.kind, 'choosePlacement');
	assert.ok(
		DECISIONS.choosePlacement
			.answers(gained, decision)
			.some((a) => a.planners === true)
	);
	state = answer(gained, random, 1, 'choosePlacement', { planners: true });
	assert.deepEqual(state.seats[0].civData['urban-planners'].stored, [
		'forge',
	]);
	assert.ok(landmarksOwned(state, 1).includes('forge'));
	// The next turn of theirs starts with the offer to place it.
	state.pending.length = 0;
	startTurn(contextFor(state, random, state.pending), 1);
	run(state, random);
	const [offer] = openDecisions(state);
	assert.equal(offer.kind, 'chooseSlot');
	assert.equal(offer.purpose, 'plannersPlace');
	assert.deepEqual(offer.options, ['forge']);
	state = answer(state, random, 1, 'chooseSlot', { slot: 'forge' });
	const [place] = openDecisions(state);
	assert.equal(place.kind, 'choosePlacement');
	assert.ok(
		DECISIONS.choosePlacement
			.answers(state, place)
			.every((a) => Number.isInteger(a.row)),
		'only the capital'
	);
	state = answer(
		state,
		random,
		1,
		'choosePlacement',
		DECISIONS.choosePlacement.answers(state, place)[0]
	);
	assert.deepEqual(state.seats[0].civData['urban-planners'].stored, []);
	assert.ok(
		state.seats[0].capital.landmarks.some(
			(/** @type {any} */ l) => l.landmark === 'forge'
		)
	);
});

test("the Urban Planners' VP at the end of the final income turn: the largest group of connected landmarks, squared", () => {
	const { state, random } = holding('urban-planners', (s) => {
		const seat = s.seats[0];
		// Three 2-by-2 landmarks: two side by side, one apart.
		seat.capital.landmarks = [
			{ landmark: 'forge', row: 0, col: 0, rotation: 0 },
			{ landmark: 'barracks', row: 0, col: 2, rotation: 0 },
			{ landmark: 'lighthouse', row: 5, col: 5, rotation: 0 },
		];
		s.landmarks = s.landmarks.filter(
			(/** @type {string} */ id) =>
				!['forge', 'barracks', 'lighthouse'].includes(id)
		);
		seat.incomeTurns = 5;
		seat.finished = true;
	});
	assert.equal(plannersGroup(state.seats[0]), 2);
	const vp = state.seats[0].vp;
	endOf(state, random, 'income');
	assert.equal(state.seats[0].vp, vp + 4);
});

test("the Urban Planners' setup in the current version: 1 resource of your choice with 1-3 players, 2 with 4-5", () => {
	const total = (/** @type {any} */ seat) =>
		Object.values(seat.resources).reduce(
			(/** @type {number} */ a, /** @type {number} */ b) => a + b,
			0
		);
	const gained = (
		/** @type {number} */ count,
		/** @type {any} */ version
	) => {
		const civs = [
			'urban-planners',
			'leaders',
			'nomads',
			'historians',
			'craftsmen',
		].slice(0, count);
		const plain = startedGame(count, {
			...AA,
			version: 'original',
			civs,
		}).state;
		const game = startedGame(count, { ...AA, version, civs }).state;
		return total(game.seats[0]) - total(plain.seats[0]);
	};
	assert.equal(gained(3, 'current'), 1);
	assert.equal(gained(4, 'current'), 2);
});
