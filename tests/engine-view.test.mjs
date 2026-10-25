// Tests for view(): what each seat may see, checked on random games for every player count.
import test from 'node:test';
import assert from 'node:assert/strict';
import { view } from '../src/lib/engine/game.js';
import { play } from '../src/lib/engine/play.js';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { playerSeat } from '../src/lib/engine/state.js';
import { newGame, startedGame, resolveTapestry } from './helpers/engine.mjs';
import { allOps, checkViews, setupFacts } from './helpers/views.mjs';

/** @typedef {import('../src/lib/engine/state.js').State} State */

/**
 * Plays setup with random legal answers, then deals every seat two tapestry cards, checking each step.
 * @param {number} seed
 * @param {number} count
 * @param {boolean} [check]
 * @returns {State}
 */
function playThrough(seed, count, check = true) {
	const { state: first, random } = newGame(count, { seed });
	const pick = seededRandom(seed + 1000);
	const facts = setupFacts(first);
	let state = first;
	if (check) {
		checkViews(state, facts);
	}
	while (state.phase === 'setup') {
		const open = openDecisions(state);
		const decision = open[pick(open.length)];
		const answers = DECISIONS[decision.kind].answers(state, decision);
		const before = state;
		state = play(
			state,
			/** @type {number} */ (decision.player),
			{ decision: decision.id, ...answers[pick(answers.length)] },
			random
		);
		if (check) {
			checkViews(state, facts, { before });
		}
	}
	for (let seat = 1; seat <= count; seat++) {
		const before = state;
		state = resolveEffects(
			state,
			seat,
			[{ gain: { tapestry: 2 } }],
			random
		);
		if (check) {
			checkViews(state, facts, { before });
		}
	}
	return state;
}

test("view never shows another player their opponents' hands, dealt civilizations or unrevealed picks", () => {
	for (let seed = 1; seed <= 40; seed++) {
		for (const count of [1, 2, 3, 4, 5]) {
			try {
				playThrough(seed, count);
			} catch (error) {
				const failure = /** @type {Error} */ (error);
				failure.message = `seed ${seed}, ${count} players: ${failure.message}`;
				throw failure;
			}
		}
	}
});

test('the view checker catches a hand shown to another player', () => {
	const { state, random } = startedGame(2);
	const dealt = resolveEffects(state, 2, [{ gain: { tapestry: 1 } }], random);
	const facts = setupFacts(newGame(2).state);
	checkViews(dealt, facts, { before: state });
	assert.throws(
		() =>
			checkViews(dealt, facts, {
				before: state,
				viewOf: (s, seat) => ({
					...view(s, seat),
					leak: playerSeat(s, 2).hand,
				}),
			}),
		/card .* shown to/
	);
});

test('the view checker catches a face-down card shown to its owner', () => {
	const { state } = startedGame(2);
	// As on an income turn with an empty hand: the deck's top card goes straight onto the mat (01 §4.2).
	const dealt = structuredClone(state);
	const seat = playerSeat(dealt, 1);
	const card = /** @type {string} */ (dealt.supply.tapestry.deck.shift());
	seat.incomeMat.tapestry[0].push(card);
	seat.incomeMat.faceDown.push(card);
	const facts = setupFacts(newGame(2).state);
	checkViews(dealt, facts, { before: state });
	assert.throws(
		() =>
			checkViews(dealt, facts, {
				before: state,
				viewOf: (s, viewer) => {
					const v = view(s, viewer);
					v.seats[0].incomeMat.tapestry = playerSeat(
						s,
						1
					).incomeMat.tapestry;
					return v;
				},
			}),
		/face-down card/
	);
});

test("a card the rules reveal is public, but the same card in another event is a leak (R35's draw)", () => {
	const { state } = startedGame(2);
	const facts = setupFacts(newGame(2).state);
	/** @param {string} type */
	const revealing = (type) => {
		const next = structuredClone(state);
		const card = /** @type {string} */ (next.supply.tapestry.deck.shift());
		playerSeat(next, 2).hand.push(card);
		next.seq += 1;
		next.events.push({
			seq: next.seq,
			type,
			player: 2,
			cards: [],
			found: card,
		});
		return next;
	};
	checkViews(revealing('cardsRevealed'), facts, { before: state });
	assert.throws(
		() => checkViews(revealing('cardDrawn'), facts, { before: state }),
		/seat 2's card .* shown to/
	);
});

test('the view checker catches an open decision without answers', () => {
	const { state } = startedGame(2);
	const facts = setupFacts(newGame(2).state);
	checkViews(state, facts, { before: state });
	assert.throws(
		() =>
			checkViews(state, facts, {
				before: state,
				viewOf: (s, viewer) => {
					const v = view(s, viewer);
					for (const op of allOps(v)) {
						delete op.answers;
					}
					return v;
				},
			}),
		/has no answers/
	);
});

test('the full state does hold the secrets the views must hide', () => {
	const { state } = newGame(2, { seed: 3 });
	const dealt = state.events.find(
		(e) => e.type === 'civsDealt' && e.player === 2
	);
	const civ = dealt?.secret?.civs[0];
	assert.ok(civ);
	assert.ok(JSON.stringify(state).includes(`"${civ}"`));
	assert.ok(!JSON.stringify(view(state, 1)).includes(`"${civ}"`));
	assert.ok(JSON.stringify(view(state, 2)).includes(`"${civ}"`));
});

test('a player sees their own hand, dealt civilizations and the answers to their open choices', () => {
	const { state } = newGame(2);
	const v = view(state, 1);
	const own = openDecisions(state).find(
		(d) => d.player === 1 && d.kind === 'chooseCiv'
	);
	assert.ok(own);
	const seen = allOps(v).find((d) => d.id === own.id);
	assert.deepEqual(seen?.options, own.options);
	assert.deepEqual(seen?.answers, DECISIONS[own.kind].answers(state, own));
	assert.ok(
		allOps(v)
			.filter((d) => d.player === 1)
			.every((d) => 'answers' in d)
	);
	assert.ok('picks' in v.seats[0]);

	const done = playThrough(5, 2, false);
	const mine = view(done, 2).seats;
	assert.deepEqual(
		mine[1].hand,
		/** @type {import('../src/lib/engine/state.js').PlayerSeat} */ (
			done.seats[1]
		).hand
	);
	assert.equal(mine[1].handCount, 2);
	assert.equal(mine[0].handCount, 2);
	assert.ok(!('hand' in mine[0]));
	assert.equal(view(done, 2).supply.tech.faceUp.length, 3);
});

test('other seats never see a hand in chooseTapestry, Tyranny or Democracy', () => {
	const { state: started, random } = startedGame(3);
	const state = /** @type {any} */ (structuredClone(started));
	const hand = ['capitalism', 'trap-1'];
	state.seats[0].incomeTurns = 2;
	state.seats[0].hand = [...hand];
	state.supply.tapestry.deck = state.supply.tapestry.deck.filter(
		(/** @type {string} */ c) => !hand.includes(c)
	);
	const cases = [
		// A card on top of the current era: the hand is the options.
		{
			kind: 'chooseTapestry',
			state: resolveEffects(state, 1, [{ tapestryOnTop: {} }], random),
		},
		// Tyranny: the options are the cards just gained.
		{
			kind: 'chooseTapestry',
			state: resolveEffects(
				resolveTapestry(state, random, 1, 'tyranny'),
				1,
				[{ gain: { tapestry: 2 } }],
				random
			),
		},
		// Democracy: the answers are the hand.
		{
			kind: 'chooseDiscard',
			state: resolveTapestry(state, random, 1, 'democracy'),
		},
	];
	for (const { kind, state: asking } of cases) {
		const decision = openDecisions(asking).find(
			(d) => d.player === 1 && d.kind === kind
		);
		assert.ok(decision, `seat 1 has an open ${kind}`);
		const own = allOps(view(asking, 1)).find((d) => d.id === decision.id);
		assert.ok(own.answers.length > 1, `seat 1 sees its ${kind} answers`);
		const seen = view(asking, 2);
		const other = allOps(seen).find((d) => d.id === decision.id);
		assert.ok(other, `seat 2 sees that seat 1 has a ${kind}`);
		assert.ok(!('options' in other), `${kind} options shown to seat 2`);
		assert.ok(!('answers' in other), `${kind} answers shown to seat 2`);
		const text = JSON.stringify(seen);
		for (const card of playerSeat(asking, 1).hand) {
			assert.ok(!text.includes(`"${card}"`), `${card} shown to seat 2`);
		}
	}
});

test('civilization data is public and chooseCiv stays hidden', () => {
	// Setup: the two civilizations a seat is dealt are its own to see.
	const { state: dealt } = newGame(3);
	const picks = openDecisions(dealt).filter((d) => d.kind === 'chooseCiv');
	assert.equal(picks.length, 3);
	for (const pick of picks) {
		for (const viewer of [null, 1, 2, 3]) {
			const seen = allOps(view(dealt, viewer)).find(
				(op) => op.id === pick.id
			);
			const own = viewer === pick.player;
			assert.equal(
				'options' in seen,
				own,
				`seat ${pick.player}'s civilization options shown to ${viewer}: ${!own}`
			);
			assert.equal('answers' in seen, own);
		}
	}
	// In play: everything on a civilization mat is public (#20 design §4), so every view shows every seat's.
	const { state } = startedGame(3, {
		civs: ['mystics', 'heralds', 'militants'],
	});
	const seats = /** @type {any[]} */ (state.seats);
	for (const seat of seats) {
		assert.notDeepEqual(seat.civData, {});
	}
	for (const viewer of [null, 1, 2, 3]) {
		const v = view(state, viewer);
		seats.forEach((seat, i) => {
			assert.deepEqual(v.seats[i].civs, seat.civs);
			assert.deepEqual(v.seats[i].civData, seat.civData);
		});
	}
	// So the civilizations' own decisions hide nothing (design §10).
	for (const kind of [
		'chooseCivAbility',
		'chooseAlchemists',
		'chooseSwap',
		'chooseSlot',
		'chooseProphecy',
	]) {
		assert.deepEqual(DECISIONS[kind].hidden, [], kind);
	}
});

test('a seat that is not in the game gets the public view', () => {
	const { state } = startedGame(3);
	for (const seat of [0, 9, '1', undefined, 1.5, -1]) {
		assert.deepEqual(view(state, seat), view(state, null));
	}
});

test('the state survives a JSON round trip unchanged', () => {
	const { state: fresh, random } = newGame(3);
	const decision = openDecisions(fresh)[0];
	const answer = DECISIONS[decision.kind].answers(fresh, decision)[0];
	const partway = play(
		fresh,
		/** @type {number} */ (decision.player),
		{ decision: decision.id, ...answer },
		random
	);
	const { state: started } = startedGame(3);
	const gained = resolveEffects(started, 1, [{ gain: { any: 1 } }], random);
	for (const state of [fresh, partway, started, gained]) {
		assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
		const v = view(state, 1);
		assert.deepEqual(JSON.parse(JSON.stringify(v)), v);
	}
});

test('the same seed and the same answers give the same game', () => {
	assert.deepEqual(playThrough(7, 4, false), playThrough(7, 4, false));
});

test('seq goes up by exactly 1 per event across a whole setup', () => {
	const { state } = startedGame(5);
	for (let i = 1; i < state.events.length; i++) {
		assert.equal(state.events[i].seq, state.events[i - 1].seq + 1);
	}
	assert.equal(state.events.at(-1)?.seq, state.seq);
});

test('view does not change the state', () => {
	const { state } = newGame(4);
	const { state: later } = startedGame(2);
	for (const s of [state, later]) {
		const before = structuredClone(s);
		for (const seat of [null, 1, 2]) {
			view(s, seat);
		}
		assert.deepEqual(s, before);
	}
});

test('the public view keeps nothing that belongs to no player', () => {
	const { state } = newGame(2);
	const bare = /** @type {any} */ (structuredClone(state));
	bare.pending[0].lanes[0].stack.unshift({
		id: 9001,
		batch: 9001,
		player: null,
		kind: 'chooseCiv',
		options: ['ownerless-civ'],
	});
	bare.events.push({
		seq: bare.seq + 1,
		type: 'orphan',
		player: null,
		secret: { card: 'ownerless-secret' },
	});
	bare.events.push({
		seq: bare.seq + 2,
		type: 'orphan',
		secret: { card: 'ownerless-secret' },
	});
	for (const viewer of [null, 0, 1, 2]) {
		const text = JSON.stringify(view(bare, viewer));
		assert.ok(
			!text.includes('ownerless-civ'),
			`options shown to ${viewer}`
		);
		assert.ok(
			!text.includes('ownerless-secret'),
			`secret shown to ${viewer}`
		);
	}
	const ownerless = allOps(view(bare, null)).find((op) => op.id === 9001);
	assert.ok(ownerless && !('answers' in ownerless));
});
