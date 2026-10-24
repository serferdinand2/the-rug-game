// A scripted 2-player game from setup to the end, with income and advance turns (#15).
// The steps later issues build are stood in for by stubHandoffs(). Every expected value was worked out by hand first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { startedGame, answer, stubHandoffs } from './helpers/engine.mjs';

/** Plays the first card the tapestry choice offers. */
const firstCard = (/** @type {any} */ d) => ({ card: d.options[0] });
const INCOME = { turn: 'income' };
const ADVANCE = { turn: 'advance' };

test('a scripted 2-player game reaches the end with the expected scores', (t) => {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	let { state, random } = startedGame(2);
	const F = /** @type {number} */ (state.first);
	const O = F === 1 ? 2 : 1;

	/** @type {[number, string, Record<string, any> | ((d: any) => Record<string, any>)][]} */
	const script = [
		// 1. F, income turn 1: every space 1 pays. F (coin, worker, food, culture) = (1, 1, 1, 1), 1 tile, 1 card.
		[F, 'chooseTurn', INCOME],
		// 2. O, income turn 1: the same. O = (1, 1, 1, 1), 1 tile, 1 card.
		[O, 'chooseTurn', INCOME],
		// 3. F advances to Scouting for 1 coin: 2 territory tiles. F = (0, 1, 1, 1), 3 tiles.
		[F, 'chooseTurn', ADVANCE],
		[
			F,
			'chooseAdvance',
			{ track: 'exploration', from: 0, pay: { coin: 1 } },
		],
		// 4. O advances to Archery for 1 coin: conquer (#17). O = (0, 1, 1, 1).
		[O, 'chooseTurn', ADVANCE],
		[O, 'chooseAdvance', { track: 'military', from: 0, pay: { coin: 1 } }],
		// 5. F advances to Rafts for 1 worker: explore (#17), and declines the bonus. F = (0, 0, 1, 1).
		[F, 'chooseTurn', ADVANCE],
		[
			F,
			'chooseAdvance',
			{ track: 'exploration', from: 1, pay: { worker: 1 } },
		],
		[F, 'chooseBonus', { pay: null }],
		// 6. O advances to Bladed Weapons for 1 worker: 1 card; the bonus pays 1 food for an armory.
		//    O = (0, 0, 0, 1), 2 cards, 4 armories left.
		[O, 'chooseTurn', ADVANCE],
		[
			O,
			'chooseAdvance',
			{ track: 'military', from: 1, pay: { worker: 1 } },
		],
		[O, 'chooseBonus', { pay: { food: 1 } }],
		// 7. F advances to Wagons for 1 food and takes a farm. F = (0, 0, 0, 1), 4 farms left.
		[F, 'chooseTurn', ADVANCE],
		[
			F,
			'chooseAdvance',
			{ track: 'exploration', from: 2, pay: { food: 1 } },
		],
		[F, 'chooseOption', { option: 1 }],
		// 8. O advances to Walls for 1 culture and takes an armory. O = (0, 0, 0, 0), 3 armories left.
		[O, 'chooseTurn', ADVANCE],
		[
			O,
			'chooseAdvance',
			{ track: 'military', from: 2, pay: { culture: 1 } },
		],
		[O, 'chooseOption', { option: 1 }],
		// 9. F, income turn 2: first into era 2 (O is on 1), so 1 coin; a card; no VP.
		//    Income: Barter, Symbology, Hunting and Farming, Ceremony. F = (2, 1, 2, 2), 4 tiles, 1 card.
		[F, 'chooseTurn', INCOME],
		[F, 'chooseResource', { resources: { coin: 1 } }],
		[F, 'chooseTapestry', firstCard],
		// 10. O, income turn 2: F started era 2 first, so no bonus; a card. Team Sports scores 1 VP (the start territory).
		//     Income: Barter, Symbology, Hunting, Ceremony and Racing. O = (1, 1, 1, 2), 2 tiles, 2 cards, 1 VP.
		[O, 'chooseTurn', INCOME],
		[O, 'chooseTapestry', firstCard],
		// 11. F, income turn 3: first into era 3 (O is on 2), so 2 coins; a card. F = (5, 2, 4, 3), 5 tiles, 1 card.
		[F, 'chooseTurn', INCOME],
		[F, 'chooseResource', { resources: { coin: 2 } }],
		[F, 'chooseTapestry', firstCard],
		// 12. O advances to Standing Army for 1 culture and 1 coin: the Barracks (#16), 1 worker, 1 VP per tile (2).
		//     O = (0, 2, 1, 1), 3 VP.
		[O, 'chooseTurn', ADVANCE],
		[
			O,
			'chooseAdvance',
			{ track: 'military', from: 3, pay: { coin: 1, culture: 1 } },
		],
		// 13. F, income turn 4: first into era 4 (O is on 2), so 3 coins to 8; a card; income coin is lost at the cap.
		//     F = (8, 3, 6, 4), 6 tiles, 1 card.
		[F, 'chooseTurn', INCOME],
		[F, 'chooseResource', { resources: { coin: 3 } }],
		[F, 'chooseTapestry', firstCard],
		// 14. O, income turn 3: no bonus; a card; Team Sports 1 VP. O = (1, 3, 2, 3), 3 tiles, 2 cards, 4 VP.
		[O, 'chooseTurn', INCOME],
		[O, 'chooseTapestry', firstCard],
		// 15. F, income turn 5: scores nothing, gains no income, and finishes.
		[F, 'chooseTurn', INCOME],
		// 16. O, income turn 4: no bonus; a card; Team Sports 1 VP. O = (2, 4, 3, 5), 4 tiles, 2 cards, 5 VP.
		[O, 'chooseTurn', INCOME],
		[O, 'chooseTapestry', firstCard],
		// 17. F is skipped. O, income turn 5: Team Sports 1 VP, and the game ends. O has 6 VP.
		[O, 'chooseTurn', INCOME],
	];

	for (const [player, kind, reply] of script) {
		const decision = openDecisions(state).find(
			(d) => d.kind === kind && d.player === player
		);
		assert.ok(decision, `seat ${player} should face ${kind}`);
		const fields = typeof reply === 'function' ? reply(decision) : reply;
		state = answer(state, random, player, kind, fields);
	}

	const f = state.seats[F - 1];
	const o = state.seats[O - 1];
	assert.equal(state.phase, 'over');
	assert.deepEqual(openDecisions(state), []);
	assert.deepEqual(
		[f.vp, f.resources, f.territoryTiles.length, f.hand.length],
		[0, { coin: 8, worker: 3, food: 6, culture: 4 }, 6, 1]
	);
	assert.deepEqual(
		[o.vp, o.resources, o.territoryTiles.length, o.hand.length],
		[6, { coin: 2, worker: 4, food: 3, culture: 5 }, 4, 2]
	);
	assert.deepEqual(
		[f.incomeMat.buildings.farm, o.incomeMat.buildings.armory],
		[4, 3]
	);
	assert.deepEqual(state.result, {
		ranking: [
			{ seat: O, place: 1, vp: 6 },
			{ seat: F, place: 2, vp: 0 },
		],
		ties: [],
	});
	assert.deepEqual(
		state.events.slice(-2).map((e) => [e.type, e.player]),
		[
			['playerFinished', O],
			['gameEnded', undefined],
		]
	);
	// Three cards each, on income turns 2–4; civilization abilities on income turns 2–5.
	const count = (/** @type {string} */ kind, /** @type {number} */ seat) =>
		handoffs.calls.filter((c) => c.kind === kind && c.player === seat)
			.length;
	assert.deepEqual(
		[count('tapestryAbility', F), count('tapestryAbility', O)],
		[3, 3]
	);
	assert.deepEqual(
		[count('civAbilities', F), count('civAbilities', O)],
		[4, 4]
	);
});
