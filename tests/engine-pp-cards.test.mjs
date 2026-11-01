// Plans & Ploys' tapestry cards (#33; 03 §1.4): what each does played as a tapestry card, the Stadium, and the deck.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { tapestryCard } from '../src/lib/engine/data/tapestry-cards.js';
import { landmarksFor } from '../src/lib/engine/data/landmarks.js';
import { hexNeighbours } from '../src/lib/engine/data/maps.js';
import { conquerTargets, matchingSides } from '../src/lib/engine/map.js';
import { cityPlots, completeDistricts } from '../src/lib/engine/city.js';
import { groupsOf } from '../src/lib/capital.js';
import {
	startedGame,
	resolveTapestry,
	answerDefaults,
} from './helpers/engine.mjs';

const PP = { expansions: ['pp'] };

/**
 * A started two-player Plans & Ploys game in era 2 where nothing is pending, seat 1 holding 2 of each resource.
 * @returns {{ state: any, random: any }}
 */
function ppGame() {
	const { state: started, random } = startedGame(2, PP);
	const state = /** @type {any} */ (structuredClone(started));
	state.pending.length = 0;
	state.seats[0].resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	state.seats[0].incomeTurns = 2;
	return { state, random };
}

/**
 * Plays a card for seat 1, answering its own questions with `pick` or their first answer.
 * @param {string} card
 * @param {(decision: any) => Record<string, any> | undefined} [pick]
 */
function played(card, pick = () => undefined) {
	const { state, random } = ppGame();
	let next = resolveTapestry(state, random, 1, card);
	for (let step = 0; step < 50; step++) {
		const [open] = openDecisions(next);
		if (!open) {
			break;
		}
		const answer =
			pick(open) ?? DECISIONS[open.kind].answers(next, open)[0];
		next = play(
			next,
			/** @type {number} */ (open.player),
			{ decision: open.id, ...answer },
			random
		);
	}
	return { before: state, after: next };
}

test('the five response cards are Plans & Ploys cards that answer a conquest or a trap', () => {
	for (const id of ['retreat', 'surprise-party', 'surrender']) {
		assert.equal(tapestryCard(id).response, 'conquest', id);
		assert.equal(tapestryCard(id).expansion, 'pp', id);
	}
	for (const id of ['double-cross', 'stolen-plans']) {
		assert.equal(tapestryCard(id).response, 'trap', id);
	}
	assert.equal(tapestryCard('trap-4').response, 'conquest');
	assert.equal(tapestryCard('trap').expansion, 'base');
	assert.equal(tapestryCard('academia').response, undefined);
});

test('the five response cards played as tapestry cards gain their printed reward (R45)', () => {
	const vp = (/** @type {any} */ s) => s.seats[0].vp;
	{
		const { before, after } = played('double-cross');
		assert.equal(vp(after) - vp(before), 9);
		assert.equal(
			after.seats[0].territoryTiles.length -
				before.seats[0].territoryTiles.length,
			1
		);
	}
	{
		const { before, after } = played('retreat');
		assert.equal(vp(after) - vp(before), 9);
		assert.equal(
			after.seats[0].hand.length - before.seats[0].hand.length,
			1
		);
	}
	{
		const { before, after } = played('stolen-plans');
		const techs = (/** @type {any} */ s) =>
			Object.values(s.seats[0].tech).flat().length;
		assert.equal(vp(after) - vp(before), 8);
		assert.equal(techs(after) - techs(before), 1);
	}
	{
		const { before, after } = played('surrender');
		const held = (/** @type {any} */ s) =>
			Object.values(s.seats[0].resources).reduce(
				(/** @type {number} */ a, /** @type {number} */ b) => a + b,
				0
			);
		assert.equal(vp(after) - vp(before), 7);
		assert.equal(held(after) - held(before), 1);
	}
	{
		const { before, after } = played('surprise-party');
		assert.equal(vp(after) - vp(before), 10);
	}
	{
		const { before, after } = played('surprise-party', (d) =>
			d.kind === 'chooseOption' ? { option: 1 } : undefined
		);
		assert.equal(vp(after) - vp(before), 0);
		assert.equal(
			before.seats[0].incomeMat.buildings.armory -
				after.seats[0].incomeMat.buildings.armory,
			1
		);
	}
});

test('Entertain the Masses gains the Stadium and places it; a copy finds none left', () => {
	const { after } = played('entertain-the-masses');
	assert.ok(!after.landmarks.includes('stadium'));
	const seat = after.seats[0];
	assert.ok(
		seat.capital.landmarks.some(
			(/** @type {any} */ l) => l.landmark === 'stadium'
		) || seat.besideMat.includes('stadium')
	);
	assert.ok(
		after.events.some(
			(/** @type {any} */ e) =>
				e.type === 'landmarkGained' &&
				e.landmark === 'stadium' &&
				e.tapestry === 'entertain-the-masses'
		)
	);
	const { random } = ppGame();
	const again = answerDefaults(
		resolveTapestry(after, random, 1, 'entertain-the-masses', 3),
		random
	);
	assert.ok(
		again.events.some(
			(/** @type {any} */ e) =>
				e.type === 'noLandmarkLeft' && e.landmark === 'stadium'
		)
	);
});

/**
 * Steps through seat 1's open decisions, answering each with `pick` or its first answer, and records every decision met.
 * @param {any} state
 * @param {any} random
 * @param {(decision: any, state: any) => Record<string, any> | undefined} [pick]
 */
function answerAll(state, random, pick = () => undefined) {
	/** @type {any[]} */
	const met = [];
	let next = state;
	for (let step = 0; step < 50; step++) {
		const [open] = openDecisions(next);
		if (!open) {
			break;
		}
		met.push(open);
		const answer =
			pick(open, next) ?? DECISIONS[open.kind].answers(next, open)[0];
		next = play(
			next,
			/** @type {number} */ (open.player),
			{ decision: open.id, ...answer },
			random
		);
	}
	return { state: next, met };
}

/**
 * An unexplored hex next to seat 1's starting territory, with at least 3 of its other neighbours explored, and the
 * territory tile on top of the supply, which scores at least 3 matching sides there.
 * @param {any} state
 * @returns {string} The hex
 */
function crowdedHex(state) {
	const start = state.seats[0].start;
	const onMap = (/** @type {string} */ hex) => hex in state.hexes;
	const hex = hexNeighbours(start).find(
		(h) => onMap(h) && state.hexes[h].tile === null
	);
	assert.ok(hex, 'an unexplored hex beside the start');
	const spare = [...state.supply.territory];
	for (const near of hexNeighbours(/** @type {string} */ (hex))) {
		if (onMap(near) && state.hexes[near].tile === null) {
			state.hexes[near].tile = spare.pop();
			state.hexes[near].orient = 0;
		}
	}
	const best = spare.find((tile) =>
		[0, 1, 2, 3, 4, 5].some(
			(orient) =>
				matchingSides(
					state,
					/** @type {string} */ (hex),
					tile,
					orient
				) >= 3
		)
	);
	assert.ok(best !== undefined, 'a tile that matches 3 sides');
	state.supply.territory = [best, ...spare.filter((t) => t !== best)];
	state.seats[0].territoryTiles = [];
	return /** @type {string} */ (hex);
}

test('Astronomy explores the territory tile it gains and keeps 2 space tiles unexplored', () => {
	const { state, random } = ppGame();
	state.seats[0].territoryTiles = [];
	const gained = state.supply.territory[0];
	const { state: after } = answerAll(
		resolveTapestry(state, random, 1, 'astronomy'),
		random
	);
	const seat = after.seats[0];
	assert.equal(seat.spaceTiles.length, state.seats[0].spaceTiles.length + 2);
	assert.deepEqual(seat.exploredSpace, state.seats[0].exploredSpace);
	assert.deepEqual(seat.territoryTiles, []);
	assert.ok(
		after.events.some(
			(/** @type {any} */ e) =>
				e.type === 'explored' && e.player === 1 && e.tile === gained
		)
	);
});

test('Cartography offers the conquest of the explored hex only when it scored at least 3 VP', () => {
	const { state, random } = ppGame();
	const hex = crowdedHex(state);
	const best = answerAll(
		resolveTapestry(state, random, 1, 'cartography'),
		random,
		(d, s) =>
			d.kind === 'chooseExplore'
				? DECISIONS.chooseExplore
						.answers(s, d)
						.find(
							(/** @type {any} */ a) =>
								a.hex === hex &&
								matchingSides(s, a.hex, a.tile, a.orient) >= 3
						)
				: d.kind === 'chooseOption'
					? { option: 1 }
					: undefined
	);
	const offer = best.met.find((d) => d.kind === 'chooseOption');
	assert.equal(offer?.purpose, 'cartography');
	assert.ok(
		best.state.hexes[hex].outposts.some(
			(/** @type {any} */ o) => o.seat === 1 && !o.toppled
		)
	);
	assert.ok(
		best.state.events.some(
			(/** @type {any} */ e) =>
				e.type === 'conquerDiceRolled' && e.player === 1
		)
	);

	const { state: fresh, random: again } = ppGame();
	const other = crowdedHex(fresh);
	const low = answerAll(
		resolveTapestry(fresh, again, 1, 'cartography'),
		again,
		(d, s) =>
			d.kind === 'chooseExplore'
				? DECISIONS.chooseExplore
						.answers(s, d)
						.find(
							(/** @type {any} */ a) =>
								matchingSides(s, a.hex, a.tile, a.orient) <= 2
						)
				: undefined
	);
	assert.ok(!low.met.some((d) => d.kind === 'chooseOption'));
	assert.ok(
		!low.state.hexes[other].outposts.some(
			(/** @type {any} */ o) => o.seat === 1
		)
	);
});

test('Manifest Destiny conquers only next to the starting territory, then may gain a controlled tile benefit', () => {
	const { state, random } = ppGame();
	const start = state.seats[0].start;
	// A tile territory seat 1 controls, and an explored territory far from the start that is not offered.
	const mine = hexNeighbours(start).find(
		(h) => h in state.hexes && state.hexes[h].tile === null
	);
	state.hexes[mine] = {
		tile: state.supply.territory.shift(),
		orient: 0,
		outposts: [{ seat: 1, toppled: false }],
		tokens: [],
	};
	state.seats[0].outposts -= 1;
	const near = new Set(hexNeighbours(start));
	const offered = conquerTargets(state, 1, true).filter((h) => near.has(h));
	const { state: after, met } = answerAll(
		resolveTapestry(state, random, 1, 'manifest-destiny'),
		random
	);
	const conquest = met.find((d) => d.kind === 'chooseConquer');
	if (offered.length > 1) {
		assert.deepEqual(
			DECISIONS.chooseConquer
				.answers(state, conquest)
				.map((/** @type {any} */ a) => a.hex)
				.sort(),
			[...offered].sort()
		);
	}
	assert.ok(
		after.events.some(
			(/** @type {any} */ e) =>
				(e.type === 'outpostPlaced' && offered.includes(e.hex)) ||
				e.type === 'noConquer'
		)
	);
	assert.ok(
		met.some(
			(d) => d.kind === 'chooseHex' && d.purpose === 'manifestDestiny'
		)
	);

	// With nothing to conquer next to the start, the tile question still comes.
	const { state: bare, random: again } = ppGame();
	for (const h of hexNeighbours(bare.seats[0].start)) {
		if (h in bare.hexes && bare.hexes[h].outposts.length === 0) {
			bare.hexes[h].tile = null;
		}
	}
	const cleared = hexNeighbours(bare.seats[0].start).find(
		(h) => h in bare.hexes && bare.hexes[h].tile === null
	);
	bare.hexes[cleared] = {
		tile: bare.supply.territory.shift(),
		orient: 0,
		outposts: [{ seat: 1, toppled: false }],
		tokens: [],
	};
	const none = answerAll(
		resolveTapestry(bare, again, 1, 'manifest-destiny'),
		again
	);
	assert.ok(
		none.state.events.some((/** @type {any} */ e) => e.type === 'noConquer')
	);
	assert.ok(
		none.met.some(
			(d) => d.kind === 'chooseHex' && d.purpose === 'manifestDestiny'
		)
	);
});

test('Status Quo takes one free bonus per tier, asking only between tracks in the same tier', () => {
	const { state, random } = ppGame();
	const seat = state.seats[0];
	// Tier II: exploration 5 (a farm) and technology 6 (invent); tier III: military 8 (a tapestry card).
	seat.tracks = {
		exploration: [5],
		science: [1],
		technology: [6],
		military: [8],
	};
	const { state: after, met } = answerAll(
		resolveTapestry(state, random, 1, 'status-quo'),
		random
	);
	const questions = met.filter((d) => d.purpose === 'statusQuo');
	assert.equal(questions.length, 1);
	assert.deepEqual([...questions[0].options].sort(), [
		'exploration',
		'technology',
	]);
	const me = after.seats[0];
	assert.deepEqual(me.resources, seat.resources);
	assert.equal(
		seat.incomeMat.buildings.farm - me.incomeMat.buildings.farm,
		1
	);
	assert.equal(me.hand.length - seat.hand.length, 1);

	const { state: plain, random: again } = ppGame();
	plain.seats[0].tracks = {
		exploration: [3],
		science: [1],
		technology: [4],
		military: [7],
	};
	const nothing = answerAll(
		resolveTapestry(plain, again, 1, 'status-quo'),
		again
	);
	assert.deepEqual(nothing.met, []);
	assert.deepEqual(nothing.state.seats[0].hand, plain.seats[0].hand);
	assert.deepEqual(
		nothing.state.seats[0].resources,
		plain.seats[0].resources
	);
});

test("World's Fair gains 1 culture, any 1 resource with a complete row or column, and 1 VP per complete district", () => {
	/**
	 * Builds a house on every empty plot of a seat's group.
	 * @param {any} seat
	 * @param {'rows' | 'columns' | 'districts'} kind
	 * @param {number} index
	 */
	const fill = (seat, kind, index) => {
		const plots = cityPlots(seat);
		for (const plot of groupsOf(kind)[index]) {
			if (plots[plot] === 'empty') {
				seat.capital.buildings.push({
					building: 'house',
					row: Math.floor(plot / 9),
					col: plot % 9,
				});
			}
		}
	};
	const held = (/** @type {any} */ seat) =>
		Object.values(seat.resources).reduce(
			(/** @type {number} */ a, /** @type {number} */ b) => a + b,
			0
		);

	const { state, random } = ppGame();
	const seat = state.seats[0];
	fill(seat, 'districts', 0);
	fill(seat, 'districts', 4);
	fill(seat, 'rows', 8);
	const districts = completeDistricts(cityPlots(seat)).length;
	assert.ok(districts >= 2);
	const { state: after } = answerAll(
		resolveTapestry(state, random, 1, 'worlds-fair'),
		random
	);
	const me = after.seats[0];
	assert.equal(me.resources.culture - seat.resources.culture >= 1, true);
	assert.equal(held(me) - held(seat), 2);
	assert.equal(me.vp - seat.vp, districts);

	const { state: empty, random: again } = ppGame();
	const bare = answerAll(
		resolveTapestry(empty, again, 1, 'worlds-fair'),
		again
	).state;
	assert.equal(held(bare.seats[0]) - held(empty.seats[0]), 1);
	assert.equal(
		bare.seats[0].resources.culture - empty.seats[0].resources.culture,
		1
	);
	assert.equal(bare.seats[0].vp, empty.seats[0].vp);
});

/**
 * Runs effects for seat 1 with a THIS ERA ability active or not, answering everything with first answers.
 * @param {any} state
 * @param {string | null} ability
 * @param {any[]} effects
 * @param {number} seed
 */
function withEra(state, ability, effects, seed) {
	const next = structuredClone(state);
	next.seats[0].era = ability === null ? null : { card: ability, ability };
	const random = seededRandom(seed);
	push(next, next.pending, [{ player: 1, kind: 'effects', effects }]);
	run(next, random);
	return answerDefaults(next, random);
}

test('Engineering upgrades each invented card to the middle row at once, gaining its circle benefit once', () => {
	const { state } = ppGame();
	const invented = (/** @type {any} */ s) =>
		s.events.find(
			(/** @type {any} */ e) =>
				e.type === 'techInvented' && e.player === 1
		)?.card;
	const on = withEra(state, 'engineering', [{ invent: {} }], 3);
	const card = invented(on);
	assert.ok(card, 'a card was invented');
	assert.ok(on.seats[0].tech.middle.includes(card));
	assert.equal(
		on.events.filter(
			(/** @type {any} */ e) =>
				e.type === 'techUpgraded' && e.card === card
		).length,
		1
	);
	const off = withEra(state, null, [{ invent: {} }], 3);
	assert.ok(off.seats[0].tech.bottom.includes(invented(off)));
});

test('Public Works gains 3 VP after an advance that leaves that track the least advanced, ties included', () => {
	/**
	 * The VP Public Works adds to one advance from these spaces.
	 * @param {[number, number, number, number]} spaces - Exploration, science, technology, military
	 * @param {string} track
	 */
	const extra = (spaces, track) => {
		const { state } = ppGame();
		const [exploration, science, technology, military] = spaces;
		state.seats[0].tracks = {
			exploration: [exploration],
			science: [science],
			technology: [technology],
			military: [military],
		};
		const effects = [{ advance: { tracks: [track] } }];
		return (
			withEra(state, 'public-works', effects, 5).seats[0].vp -
			withEra(state, null, effects, 5).seats[0].vp
		);
	};
	assert.equal(extra([3, 5, 5, 5], 'exploration'), 3);
	assert.equal(extra([4, 5, 5, 5], 'exploration'), 3);
	assert.equal(extra([4, 4, 6, 6], 'exploration'), 0);
	assert.equal(extra([4, 5, 5, 5], 'technology'), 0);
});

test('a Plans & Ploys game has 25 landmarks with the Stadium, a base game 18', () => {
	assert.equal(landmarksFor([]).length, 18);
	assert.equal(landmarksFor(['pp']).length, 25);
	assert.ok(landmarksFor(['pp']).some((l) => l.id === 'stadium'));
	const { state } = ppGame();
	assert.ok(state.landmarks.includes('stadium'));
});
