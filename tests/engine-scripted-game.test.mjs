// A scripted 2-player game from setup to the end, with income and advance turns (#15) and real tapestry cards (#19).
// Every expected value was worked out by hand first.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { startedGame, answer } from './helpers/engine.mjs';

/** Plays the first card the tapestry choice offers. */
const firstCard = (/** @type {any} */ d) => ({ card: d.options[0] });
const INCOME = { turn: 'income' };
const ADVANCE = { turn: 'advance' };

test('a scripted 2-player game reaches the end with the expected scores', () => {
	let { state, random } = startedGame(2);
	const F = /** @type {number} */ (state.first);
	const O = F === 1 ? 2 : 1;

	/** The first plot the placement offers. */
	const firstPlot = (/** @type {any} */ d) =>
		DECISIONS.choosePlacement.answers(state, d)[0];

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
		// 4. O advances to Archery for 1 coin: conquer. O = (0, 1, 1, 1).
		//    O's start territory (0_2) has six neighbours: three printed (the only conquer targets) and three unexplored. The default
		//    answer takes the first target in map order: -1_1, empty, so O places an outpost (7 left) and no one is toppled. The dice roll 5 (red) and 3 (black)
		//    with this seed. Red face 5 is "1 VP per territory you control" and black face 3 is 1 culture; O takes the red
		//    die. O controls two territories now (0_2 and -1_1), so that is 2 VP: O = (0, 1, 1, 1), 2 VP.
		[O, 'chooseTurn', ADVANCE],
		[O, 'chooseAdvance', { track: 'military', from: 0, pay: { coin: 1 } }],
		[
			O,
			'chooseConquer',
			(d) => DECISIONS.chooseConquer.answers(state, d)[0],
		],
		[O, 'chooseDie', { die: 'red' }],
		// 5. F advances to Rafts for 1 worker: explore, then declines the bonus. F holds tiles 26, 24 and 31 (this seed).
		//    The default answer scores the most: tile 24 on hex 1_0 turned 3 (its corners read F S S S G G) matches 4 sides,
		//    against the printed all-sea territory (0_0), the one with forests and mountains (2_1), the grassland
		//    territory (2_0) and the mountain one (1_-1); the other two neighbours are unexplored. That is 4 VP.
		//    Tile 24's benefit is 1 food. F = (0, 0, 2, 1), 2 tiles, 4 VP.
		[F, 'chooseTurn', ADVANCE],
		[
			F,
			'chooseAdvance',
			{ track: 'exploration', from: 1, pay: { worker: 1 } },
		],
		[
			F,
			'chooseExplore',
			(d) => DECISIONS.chooseExplore.answers(state, d)[0],
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
		[O, 'choosePlacement', firstPlot],
		// 7. F advances to Wagons for 1 food and takes a farm. F = (0, 0, 1, 1), 4 farms left.
		[F, 'chooseTurn', ADVANCE],
		[
			F,
			'chooseAdvance',
			{ track: 'exploration', from: 2, pay: { food: 1 } },
		],
		[F, 'chooseOption', { option: 1 }],
		[F, 'choosePlacement', firstPlot],
		// 8. O advances to Walls for 1 culture and takes an armory. O = (0, 0, 0, 0), 3 armories left.
		[O, 'chooseTurn', ADVANCE],
		[
			O,
			'chooseAdvance',
			{ track: 'military', from: 2, pay: { culture: 1 } },
		],
		[O, 'chooseOption', { option: 1 }],
		[O, 'choosePlacement', firstPlot],
		// 9. F, income turn 2: first into era 2 (O is on 1), so 1 coin; F plays Militarism, a THIS ERA card; no VP.
		//    Income: Barter, Symbology, Hunting and Farming, Ceremony. F = (2, 1, 3, 2), 3 tiles, 1 card.
		[F, 'chooseTurn', INCOME],
		[F, 'chooseResource', { resources: { coin: 1 } }],
		[F, 'chooseTapestry', firstCard],
		// 10. O, income turn 2: F started era 2 first, so no bonus; O plays Age of Wonders: nobody has a landmark, so it is a tie, 1 culture and 6 VP.
		//     Team Sports scores 2 VP (the start territory and the one step 4 conquered). Income: Barter, Symbology, Hunting,
		//     Ceremony and Racing. O = (1, 1, 1, 3), 2 tiles, 2 cards, 10 VP.
		[O, 'chooseTurn', INCOME],
		[O, 'chooseTapestry', firstCard],
		[O, 'chooseResource', { resources: { culture: 1 } }],
		// 11. F, income turn 3: Militarism ends first; first into era 3 (O is on 2), so 2 coins; F plays Theocracy,
		//     a THIS ERA card. F = (5, 2, 5, 3), 4 tiles, 1 card.
		[F, 'chooseTurn', INCOME],
		[F, 'chooseResource', { resources: { coin: 2 } }],
		[F, 'chooseTapestry', firstCard],
		// 12. O advances to Standing Army for 1 culture and 1 coin: the Barracks, placed first (FAQ #1), then 1 worker, 1 VP per tile (2).
		//     O = (0, 2, 1, 2), 12 VP.
		[O, 'chooseTurn', ADVANCE],
		[
			O,
			'chooseAdvance',
			{ track: 'military', from: 3, pay: { coin: 1, culture: 1 } },
		],
		[O, 'choosePlacement', firstPlot],
		// 13. F, income turn 4: Theocracy ends first; first into era 4 (O is on 2), so 3 coins to 8; F plays Guilds and buys 5 VP for 1 coin
		//     (7 coin left); the income's coin refills it to the cap. F = (8, 3, 7, 4), 5 tiles, 1 card, 9 VP.
		[F, 'chooseTurn', INCOME],
		[F, 'chooseResource', { resources: { coin: 3 } }],
		[F, 'chooseTapestry', firstCard],
		[F, 'chooseTrade', { offer: 3, pay: { coin: 1 } }],
		// 14. O, income turn 3: no bonus; O plays a trap, 10 VP (R22); Team Sports 2 VP.
		//     O = (1, 3, 2, 4), 3 tiles, 2 cards, 24 VP.
		[O, 'chooseTurn', INCOME],
		[O, 'chooseTapestry', firstCard],
		// 15. F, income turn 5: scores nothing, gains no income, and finishes.
		[F, 'chooseTurn', INCOME],
		// 16. O, income turn 4: no bonus; O plays another trap, 10 VP (R22); Team Sports 2 VP.
		//     O = (2, 4, 3, 6), 4 tiles, 2 cards, 36 VP.
		[O, 'chooseTurn', INCOME],
		[O, 'chooseTapestry', firstCard],
		// 17. F is skipped. O, income turn 5: Team Sports 2 VP, and the game ends. O has 38 VP.
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

	// Step 4's conquest, as worked out above.
	assert.deepEqual(
		state.events
			.filter((e) => e.type === 'conquerDiceRolled')
			.map(({ seq: _seq, ...e }) => e),
		[{ type: 'conquerDiceRolled', player: O, red: 5, black: 3 }]
	);
	assert.deepEqual(state.hexes['-1_1'].outposts, [
		{ seat: O, toppled: false },
	]);
	assert.equal(state.seats[O - 1].outposts, 7);
	// Step 5's explore, as worked out above.
	assert.deepEqual(state.hexes['1_0'].tile, 24);
	assert.equal(state.hexes['1_0'].orient, 3);
	assert.deepEqual(
		state.events
			.filter((e) => e.type === 'explored')
			.map(({ seq: _seq, ...e }) => e),
		[
			{
				type: 'explored',
				player: F,
				hex: '1_0',
				tile: 24,
				orient: 3,
				vp: 4,
			},
		]
	);
	const f = state.seats[F - 1];
	const o = state.seats[O - 1];
	assert.equal(state.phase, 'over');
	assert.deepEqual(openDecisions(state), []);
	assert.deepEqual(
		[f.vp, f.resources, f.territoryTiles.length, f.hand.length],
		[9, { coin: 8, worker: 3, food: 7, culture: 4 }, 5, 1]
	);
	assert.deepEqual(
		[o.vp, o.resources, o.territoryTiles.length, o.hand.length],
		[38, { coin: 2, worker: 4, food: 3, culture: 6 }, 4, 2]
	);
	assert.deepEqual(
		o.capital.landmarks.map((p) => p.landmark),
		['barracks']
	);
	assert.deepEqual(
		[f.incomeMat.buildings.farm, o.incomeMat.buildings.armory],
		[4, 3]
	);
	// Every placement takes the first legal place, reading each mat from its top left, row by row (#16).
	// F's mat 3: the farm (step 7) goes to the first open plot, row 0 column 0.
	assert.deepEqual(f.capital.buildings, [
		{ building: 'farm', row: 0, col: 0 },
	]);
	assert.deepEqual(f.capital.landmarks, []);
	// O's mat 2: the armories (steps 6 and 8) take (0, 0) and (0, 1). The Barracks (step 12, 2x2, not turned)
	// first fits with its top left at (0, 2), beside them, so its plots are rows 0-1 and columns 2-3.
	assert.deepEqual(o.capital.buildings, [
		{ building: 'armory', row: 0, col: 0 },
		{ building: 'armory', row: 0, col: 1 },
	]);
	assert.deepEqual(o.capital.landmarks, [
		{ landmark: 'barracks', row: 0, col: 2, rotation: 0 },
	]);
	// Nothing was left beside the mat.
	assert.deepEqual([f.besideMat, o.besideMat], [[], []]);
	// No row or column was ever complete (one building each, and the Barracks only part of a row), so no capital VP:
	// each of the 8 scorings (Symbology, income turns 2-5, both players) found 0 rows and 0 columns.
	const scorings = state.events.filter((e) => e.type === 'capitalScored');
	assert.equal(scorings.length, 8);
	assert.ok(scorings.every((e) => e.rows === 0 && e.columns === 0));
	assert.deepEqual(state.result, {
		ranking: [
			{ seat: O, place: 1, vp: 38 },
			{ seat: F, place: 2, vp: 9 },
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
	// Three cards each, face up, on income turns 2–4.
	const played = (/** @type {number} */ seat) =>
		state.events
			.filter(
				(e) =>
					e.type === 'tapestryPlayed' &&
					e.player === seat &&
					!e.faceDown
			)
			.map((e) => e.card);
	assert.deepEqual(played(F), ['militarism', 'theocracy', 'guilds']);
	assert.deepEqual(played(O), ['age-of-wonders', 'trap-5', 'trap-6']);
	// F's two THIS ERA cards each lasted until F's next income turn.
	assert.deepEqual(
		state.events
			.filter((e) => e.type === 'eraEnded')
			.map((e) => [e.player, e.card]),
		[
			[F, 'militarism'],
			[F, 'theocracy'],
		]
	);
	// startedGame() cleared the civilizations, so no civilization ability ran.
	assert.ok(!state.events.some((e) => e.type === 'civAbilityUsed'));
});
