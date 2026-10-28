// The viewer's part in the turn (#26): the client's preview of legal advances and payments, run by the engine on the
// viewer's own view, and which open decision is the viewer's.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	DECISIONS,
	createGame,
	openDecisions,
	play,
	view,
} from '../src/lib/engine/game.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import {
	advanceOptions,
	decisionTurnHeading,
	firstIncomeNotice,
	forcedIncome,
	incomeWords,
	myDecision,
	takingTurnWords,
} from '../src/lib/turn.js';
import {
	answer,
	conquestGame,
	newGame,
	startedGame,
} from './helpers/engine.mjs';

/**
 * The server's answers to chooseAdvance, grouped as advanceOptions groups them.
 * @param {any[]} answers
 */
function grouped(answers) {
	/** @type {Map<string, any>} */
	const byToken = new Map();
	for (const { track, from, pay } of answers) {
		const key = `${track}:${from}`;
		if (!byToken.has(key)) {
			byToken.set(key, { track, from, to: from + 1, payments: [] });
		}
		byToken.get(key).payments.push(pay);
	}
	return [...byToken.values()];
}

test("the preview of advances on the viewer's own view equals the server's answers, over random games", () => {
	let compared = 0;
	for (let seed = 1; seed <= 40; seed++) {
		const random = seededRandom(seed);
		const players = 2 + (seed % 4);
		let state = createGame({
			players: Array.from({ length: players }, (_, i) => ({
				name: `P${i}`,
			})),
			version: seed % 2 ? 'current' : 'original',
			random,
		});
		for (let step = 0; step < 3000 && state.phase !== 'over'; step++) {
			const open = openDecisions(state);
			const decision = open[random(open.length)];
			const seat = /** @type {number} */ (decision.player);
			if (decision.kind === 'chooseTurn') {
				const truth = DECISIONS.chooseAdvance.answers(state, {
					player: seat,
					kind: 'chooseAdvance',
				});
				const options = decision.options.includes('advance')
					? grouped(truth)
					: [];
				assert.deepEqual(
					advanceOptions(view(state, seat), seat),
					options,
					`seed ${seed}, step ${step}`
				);
				compared++;
			}
			if (decision.kind === 'chooseAdvance') {
				assert.deepEqual(
					advanceOptions(view(state, seat), seat),
					grouped(DECISIONS.chooseAdvance.answers(state, decision)),
					`seed ${seed}, step ${step}`
				);
				compared++;
			}
			const answers = DECISIONS[decision.kind].answers(state, decision);
			const pick =
				decision.kind === 'chooseTurn' &&
				answers.length > 1 &&
				random(10) < 8
					? answers[1]
					: answers[random(answers.length)];
			state = play(
				state,
				seat,
				{ decision: decision.id, ...pick },
				random
			);
		}
	}
	assert.ok(compared > 1000, `only ${compared} comparisons`);
});

test('no advance is offered when the viewer has no turn choice or advance open', () => {
	const { state } = newGame(3);
	assert.deepEqual(advanceOptions(view(state, 1), 1), []);
});

test("the viewer's decision is the defender's trap response on the attacker's turn", () => {
	const state = conquestGame(['trap-3']);
	// Seat 1 attacks on its own turn.
	state.current = 1;
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ conquer: {} }] },
	]);
	run(state, () => 0);
	assert.equal(state.current, 1);
	const mine = myDecision(view(state, 2), 2);
	assert.equal(mine?.kind, 'chooseResponse');
	assert.equal(myDecision(view(state, 1), 1), null);
});

test('in setup each seat finds its own pick in its lane', () => {
	const { state } = newGame(3);
	for (const seat of [1, 2, 3]) {
		const mine = myDecision(view(state, seat), seat);
		assert.equal(mine?.player, seat);
		assert.ok(Array.isArray(mine?.answers) && mine.answers.length > 0);
	}
	assert.equal(myDecision(view(state, null), 1), null);
});

test('the footer names the turn and latest advance without copying the prompt', () => {
	const game = {
		phase: 'playing',
		current: 1,
		seats: [
			{ seat: 1, name: 'Ana' },
			{ seat: 2, name: 'Bo' },
		],
		events: [
			{
				seq: 1,
				type: 'tokenMoved',
				player: 1,
				track: 'science',
				from: 1,
				to: 2,
			},
			{ seq: 2, type: 'turnStarted', player: 1 },
			{
				seq: 3,
				type: 'tokenMoved',
				player: 1,
				track: 'exploration',
				from: 3,
				to: 4,
			},
		],
	};
	assert.equal(
		decisionTurnHeading(game, 1),
		'Your turn · Advance to Navigation'
	);
	assert.equal(
		decisionTurnHeading(game, 2),
		'Ana’s turn · Advance to Navigation'
	);
	game.events.pop();
	assert.equal(decisionTurnHeading(game, 1), 'Your turn is in progress');
	game.phase = 'setup';
	assert.equal(decisionTurnHeading(game, 1), 'Your setup choice');
});

test('incomeWords names the eras an income turn ends and begins (#77)', () => {
	assert.equal(incomeWords(2), 'End era I, gain income and begin era II.');
	assert.equal(incomeWords(3), 'End era II, gain income and begin era III.');
	assert.equal(incomeWords(4), 'End era III, gain income and begin era IV.');
	assert.equal(incomeWords(5), 'End era IV, score it and finish playing.');
	assert.throws(() => incomeWords(1), RangeError);
	assert.throws(() => incomeWords(6), RangeError);
});

test("forcedIncome: the viewer's turn offers only income (#77)", () => {
	// startedGame() leaves every seat with nothing, so no advance can be paid for.
	const { state: empty } = startedGame(2);
	const first = /** @type {number} */ (empty.first);
	const other = first === 1 ? 2 : 1;
	assert.equal(forcedIncome(view(empty, first), first), true);
	assert.equal(forcedIncome(view(empty, other), other), false);
	assert.equal(forcedIncome(view(empty, null), null), false);
	const { state: paid } = startedGame(2, { keepIncome: true });
	assert.equal(forcedIncome(view(paid, first), first), false);
});

test('takingTurnWords names the income turn the seat is in (#77)', () => {
	const { state: drafting } = startedGame(2, {
		keepIncome: true,
		variants: ['tapestry-draft'],
	});
	const first = /** @type {number} */ (drafting.first);
	const other = first === 1 ? 2 : 1;
	assert.equal(
		takingTurnWords(view(drafting, other), first, 'Ana'),
		'Ana is taking their first income turn.'
	);
	const { state: started, random } = startedGame(2, { keepIncome: true });
	assert.equal(
		takingTurnWords(view(started, other), first, 'Ana'),
		'Ana is taking their turn.'
	);
	// Income turn 2 stops at the era's tapestry card.
	const income = answer(started, random, first, 'chooseTurn', {
		turn: 'income',
	});
	assert.equal(
		takingTurnWords(view(income, other), first, 'Ana'),
		'Ana is taking income turn 2.'
	);
});

test('firstIncomeNotice says what income turn 1 gave, once it is over (#77)', () => {
	const { state } = startedGame(2, { keepIncome: true });
	for (const seat of [1, 2]) {
		assert.deepEqual(firstIncomeNotice(view(state, seat), seat), {
			resources: { coin: 1, worker: 1, food: 1, culture: 1 },
			territoryTiles: 1,
			tapestryCards: 1,
			holdings:
				'1 coin, 1 food, 1 worker, 1 culture, 1 territory tile and 1 tapestry card',
		});
	}
	assert.equal(firstIncomeNotice(view(state, null), null), null);
	const { state: setup } = newGame(2);
	assert.equal(firstIncomeNotice(view(setup, 1), 1), null);
});

test('firstIncomeNotice never opens over a question, before income turn 1 or after era I (#77)', () => {
	const { state: drafting, random } = startedGame(2, {
		keepIncome: true,
		variants: ['tapestry-draft'],
	});
	const first = /** @type {number} */ (drafting.first);
	const second = first === 1 ? 2 : 1;
	assert.equal(
		firstIncomeNotice(view(drafting, first), first),
		null,
		'its keep is open'
	);
	assert.equal(
		firstIncomeNotice(view(drafting, second), second),
		null,
		'no income turn yet'
	);
	const keep = /** @type {any} */ (
		openDecisions(drafting).find((d) => d.kind === 'chooseKeep')
	);
	const kept = answer(drafting, random, first, 'chooseKeep', {
		card: keep.options[0],
	});
	assert.notEqual(
		firstIncomeNotice(view(kept, first), first),
		null,
		'while the second seat keeps'
	);
	assert.equal(firstIncomeNotice(view(kept, second), second), null);

	const { state: started, random: again } = startedGame(2, {
		keepIncome: true,
	});
	const later = answer(started, again, first, 'chooseTurn', {
		turn: 'income',
	});
	assert.equal(firstIncomeNotice(view(later, first), first), null, 'era II');
});

test('firstIncomeNotice words uneven holdings, leaving out what there is none of (#77)', () => {
	const { state } = startedGame(2, { keepIncome: true });
	const seat = /** @type {any} */ (state.seats[0]);
	seat.resources = { coin: 2, worker: 0, food: 1, culture: 0 };
	seat.territoryTiles = [];
	seat.hand = [...seat.hand, ...state.supply.tapestry.deck.splice(0, 2)];
	assert.equal(
		firstIncomeNotice(view(state, 1), 1)?.holdings,
		'2 coins, 1 food and 3 tapestry cards'
	);
	state.supply.tapestry.deck.unshift(...seat.hand);
	seat.resources = { coin: 0, worker: 0, food: 0, culture: 0 };
	seat.hand = [];
	assert.equal(firstIncomeNotice(view(state, 1), 1)?.holdings, 'nothing');
});
