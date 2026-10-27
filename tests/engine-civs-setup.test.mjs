// Tests for the civilizations that act when they come into play: Futurists, Mystics and Architects (#20, design §5, §7).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { cityPlots } from '../src/lib/engine/city.js';
import { groupsOf, plotIndex } from '../src/lib/capital.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import {
	readyTurn,
	startedGame,
	answer,
	answerDefaults,
	placeAll,
} from './helpers/engine.mjs';

const VERSIONS = /** @type {const} */ (['original', 'current']);

/**
 * A copy of a started game in which no civilization is held and nothing is pending, so each test gives seat 1 the one it needs.
 * @param {number} [count]
 */
function game(count = 2) {
	const { state: started, random } = startedGame(count);
	const state = structuredClone(started);
	state.pending.length = 0;
	return { state, random };
}

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
	const state = answer(
		ready.state,
		ready.random,
		ready.player,
		'chooseTurn',
		{
			turn: 'income',
		}
	);
	return { state, random: ready.random, player: ready.player, since };
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

/** The resources a seat holds, all kinds together. */
const held = (/** @type {any} */ seat) =>
	Object.values(seat.resources).reduce(
		(sum, n) => /** @type {number} */ (sum) + /** @type {number} */ (n),
		0
	);

/** The open decision of a kind. */
const decisionOf = (/** @type {any} */ state, /** @type {string} */ kind) =>
	openDecisions(state).find((d) => d.kind === kind);

/**
 * Answers a player's open decision of a kind with its first answer.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {string} kind
 */
function answerFirst(state, random, player, kind) {
	const decision = openDecisions(state).find(
		(d) => d.kind === kind && d.player === player
	);
	if (!decision) {
		throw new Error(`Seat ${player} has no open ${kind}.`);
	}
	const [first] = DECISIONS[kind].answers(state, decision);
	return play(state, player, { decision: decision.id, ...first }, random);
}

/** The row and column of a plot index. */
const cell = (/** @type {number} */ p) => ({
	row: Math.floor(p / 9),
	col: p % 9,
});

/**
 * Puts income buildings on plots of a seat's capital.
 * @param {any} seat
 * @param {string} building
 * @param {number[]} plots
 */
function build(seat, building, plots) {
	for (const p of plots) {
		seat.capital.buildings.push({ building, ...cell(p) });
	}
}

test('Futurists jump 4 on every track without landmarks and gain 1 of each resource (R9)', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: ['futurists', 'nomads'],
			version,
		});
		const base = startedGame(2, {
			civs: ['leaders', 'nomads'],
			version,
		}).state;
		const seat = state.seats[0];
		for (const id of TRACK_IDS) {
			assert.deepEqual(seat.tracks[id], [4], `${version} ${id}`);
		}
		assert.deepEqual(
			eventsOf(state, 'tokenMoved').map((e) => [e.player, e.from, e.to]),
			TRACK_IDS.map(() => [1, 0, 4])
		);
		// Space 4 starts tier II, but a jump gains no landmark, benefit or bonus.
		assert.deepEqual(state.landmarks, base.landmarks);
		assert.deepEqual(seat.capital.landmarks, []);
		assert.deepEqual(eventsOf(state, 'spaceActivated'), []);
		assert.deepEqual(eventsOf(state, 'landmarkGained'), []);
		for (const id of Object.keys(seat.resources)) {
			assert.equal(
				seat.resources[id],
				base.seats[0].resources[id] + 1,
				`${version} ${id}`
			);
		}
	}
});

test('Futurists gained mid-game jump too', () => {
	const { state, random } = game();
	state.supply.civs = [
		'futurists',
		...state.supply.civs.filter((c) => c !== 'futurists'),
	];
	const seat = state.seats[0];
	seat.civs = ['leaders'];
	seat.tracks.technology = [10];
	// Several tokens on a track: the most advanced one jumps (my call).
	seat.tracks.science = [2, 5];
	seat.tracks.exploration = [12];
	// AI Singularity took this token off: no token, no jump.
	seat.tracks.military = [];
	seat.restartedTracks = ['military'];
	const before = { ...seat.resources };
	const next = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	const after = next.seats[0];
	assert.deepEqual(after.civs, ['leaders', 'futurists']);
	assert.deepEqual(after.tracks, {
		exploration: [12],
		science: [2, 9],
		technology: [12],
		military: [],
	});
	// Stopping at 12; a token already there doesn't move.
	assert.deepEqual(
		eventsOf(next, 'tokenMoved').map((e) => [e.track, e.from, e.to]),
		[
			['science', 5, 9],
			['technology', 10, 12],
		]
	);
	// Reaching 12 by a jump still claims "complete any track".
	assert.deepEqual(
		eventsOf(next, 'achievementClaimed').map((e) => [
			e.player,
			e.achievement,
		]),
		[[1, 'complete-track']]
	);
	for (const id of Object.keys(before)) {
		assert.equal(after.resources[id], before[id] + 1, id);
	}
	assert.deepEqual(openDecisions(next), []);
});

test('Futurists lose 1 culture and 1 resource at the end of income turn 1 only in the current version (R34)', () => {
	for (const version of VERSIONS) {
		const r = incomeTurn(
			'futurists',
			0,
			(seat) => {
				seat.resources = { coin: 2, worker: 0, food: 1, culture: 2 };
			},
			{ version }
		);
		const lost = eventsOf(r.state, 'resourcesLost', r.since);
		if (version === 'original') {
			assert.deepEqual(lost, []);
			assert.equal(decisionOf(r.state, 'chooseSlot'), undefined);
			// Only income turn 1's income: 1 of each.
			assert.deepEqual(r.state.seats[1].resources, {
				coin: 3,
				worker: 1,
				food: 2,
				culture: 3,
			});
			continue;
		}
		// After the income: culture first, then a resource of the player's choice.
		assert.deepEqual(lost, [
			{ type: 'resourcesLost', player: 2, lost: { culture: 1 } },
		]);
		const pick = /** @type {any} */ (decisionOf(r.state, 'chooseSlot'));
		assert.equal(pick.purpose, 'loseResource');
		assert.deepEqual(pick.options, ['coin', 'worker', 'food', 'culture']);
		const paid = answer(r.state, r.random, r.player, 'chooseSlot', {
			slot: 'worker',
		});
		assert.deepEqual(paid.seats[1].resources, {
			coin: 3,
			worker: 0,
			food: 2,
			culture: 2,
		});
	}
	// Futurists gained mid-game lose nothing (R34).
	const gained = incomeTurn(
		'futurists',
		0,
		(seat) => {
			seat.civs = ['leaders', 'futurists'];
		},
		{ version: 'current' }
	);
	assert.deepEqual(eventsOf(gained.state, 'resourcesLost', gained.since), []);
});

test('Mystics predict 4 numbers at setup, gain 1 resource when a count first reaches a prediction, and score 10 VP per exact prediction on income turn 5', () => {
	const { state: fresh, random } = game();
	fresh.seats[0].civs = ['mystics'];
	push(fresh, fresh.pending, [
		{ player: 1, kind: 'civSetup', civ: 'mystics', midGame: false },
	]);
	run(fresh, random);
	let state = fresh;

	// One category at a time, in the order printed.
	/** @type {[string, number[], number][]} */
	const asked = [
		['techCards', [1, 2, 3, 4, 5, 6, 7, 8, 9], 2],
		['districts', [1, 2, 3, 4, 5, 6, 7, 8, 9], 9],
		['territories', [1, 2, 3, 4, 5, 6, 7, 8, 9], 1],
		['tracks', [1, 2, 3, 4], 1],
	];
	for (const [category, options, value] of asked) {
		const decision = /** @type {any} */ (
			decisionOf(state, 'chooseProphecy')
		);
		assert.deepEqual(
			[decision.player, decision.category, decision.options],
			[1, category, options]
		);
		assert.throws(
			() =>
				answer(state, random, 1, 'chooseProphecy', {
					value: options.length + 1,
				}),
			{
				name: 'PlayerError',
				message: 'Choose one of the numbers offered.',
			}
		);
		state = answer(state, random, 1, 'chooseProphecy', { value });
	}
	assert.deepEqual(
		eventsOf(state, 'prophecyMade').map((e) => [
			e.player,
			e.category,
			e.value,
		]),
		asked.map(([category, , value]) => [1, category, value])
	);
	assert.deepEqual(state.seats[0].civData.mystics.predictions, {
		techCards: 2,
		districts: 9,
		territories: 1,
		tracks: 1,
	});
	// Checked right after the predictions: the start territory is 1 territory (BGA).
	assert.deepEqual(eventsOf(state, 'prophecyReached'), [
		{ type: 'prophecyReached', player: 1, category: 'territories' },
	]);
	assert.equal(decisionOf(state, 'chooseResource')?.player, 1);
	state = answerFirst(state, random, 1, 'chooseResource');
	assert.equal(held(state.seats[0]), 1);
	assert.deepEqual(state.seats[0].civData.mystics.reached, ['territories']);

	// A second tech card reaches the prediction once.
	state.seats[0].tech.bottom = ['irrigation'];
	let since = state.seq;
	state = resolveEffects(state, 1, [{ invent: {} }], random);
	state = answerFirst(state, random, 1, 'chooseInvent');
	assert.deepEqual(eventsOf(state, 'prophecyReached', since), [
		{ type: 'prophecyReached', player: 1, category: 'techCards' },
	]);
	state = answerFirst(state, random, 1, 'chooseResource');
	assert.equal(held(state.seats[0]), 2);
	// An upgrade checks again with the count still 2: nothing more.
	since = state.seq;
	state = answerDefaults(
		resolveEffects(state, 1, [{ upgrade: {} }], random),
		random
	);
	assert.ok(eventsOf(state, 'techUpgraded', since).length > 0);
	assert.deepEqual(eventsOf(state, 'prophecyReached', since), []);
	assert.deepEqual(state.seats[0].civData.mystics.reached, [
		'territories',
		'techCards',
	]);

	// Income turn 5, and no other: 10 VP for each prediction its count equals.
	const r = incomeTurn('mystics', 4, (seat) => {
		// One tech card and the start territory match; no track is complete and no district.
		seat.tech.bottom = ['irrigation'];
		seat.civData.mystics.predictions = {
			techCards: 1,
			districts: 9,
			territories: 1,
			tracks: 2,
		};
	});
	const events = r.state.events.filter((e) => e.seq > r.since);
	const used = events.findIndex(
		(e) => e.type === 'civAbilityUsed' && e.civ === 'mystics'
	);
	assert.ok(used !== -1);
	const scored = events.slice(used).find((e) => e.type === 'vpGained');
	assert.equal(scored?.player, 2);
	assert.equal(scored?.vp, 20);

	for (const before of [1, 2, 3]) {
		const early = incomeTurn('mystics', before);
		assert.deepEqual(
			eventsOf(early.state, 'civAbilityUsed', early.since),
			[],
			`income turn ${before + 1}`
		);
	}
});

test("Mystics check their own counts whenever any player's change can move them: an opponent's conquest", () => {
	const { state, random } = game();
	for (const [key, hex] of Object.entries(state.hexes)) {
		hex.outposts = [];
		if (!['-2_-2', '-2_-1', '0_2'].includes(key)) {
			/** @type {any} */ (hex).tile = null;
		}
	}
	// The Mystics hold two territories and predicted 1; the opponent can conquer one of them.
	state.hexes['-2_-2'].outposts = [{ seat: 2, toppled: false }];
	state.hexes['-2_-1'].outposts = [{ seat: 1, toppled: false }];
	state.hexes['0_2'].outposts = [{ seat: 1, toppled: false }];
	const seat = state.seats[0];
	seat.civs = ['mystics'];
	seat.civData.mystics = {
		predictions: { techCards: 9, districts: 9, territories: 1, tracks: 4 },
		reached: [],
	};
	const face = () => 0;
	const conquered = (/** @type {any} */ s) =>
		answerDefaults(resolveEffects(s, 2, [{ conquer: {} }], face), face);
	const next = conquered(state);
	assert.ok(next.hexes['-2_-1'].outposts[0].toppled);
	assert.deepEqual(eventsOf(next, 'prophecyReached'), [
		{ type: 'prophecyReached', player: 1, category: 'territories' },
	]);
	assert.equal(held(next.seats[0]), 1);

	// A finished owner gains nothing, so nothing is checked (01 §4.3).
	seat.finished = true;
	const done = conquered(state);
	assert.ok(done.hexes['-2_-1'].outposts[0].toppled);
	assert.deepEqual(eventsOf(done, 'prophecyReached'), []);
	assert.deepEqual(done.seats[0].civData.mystics.reached, []);
});

test('Mystics check nothing and score nothing before their predictions are set up', () => {
	// The setup lanes run side by side, so an opponent's lane can change a count before the Mystics' lane sets them up.
	const { state, random } = game();
	state.seats[0].civs = ['mystics'];
	assert.equal(state.seats[0].civData.mystics, undefined);
	const placed = placeAll(
		resolveEffects(state, 2, [{ building: 'farm' }], random),
		random
	);
	assert.equal(placed.seats[1].capital.buildings.length, 1);
	assert.deepEqual(eventsOf(placed, 'prophecyReached'), []);
	const scored = structuredClone(state);
	push(scored, scored.pending, [
		{ player: 1, kind: 'civAbilities', turn: 5 },
	]);
	run(scored, random);
	assert.deepEqual(eventsOf(scored, 'vpGained', state.seq), []);
});

test('Mystics gained mid-game are discarded and another civilization is gained', () => {
	const { state, random } = game();
	state.seats[0].civs = ['leaders'];
	state.supply.civs = [
		'mystics',
		'merrymakers',
		...state.supply.civs.filter(
			(c) => c !== 'mystics' && c !== 'merrymakers'
		),
	];
	const next = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(next.seats[0].civs, ['leaders', 'merrymakers']);
	assert.deepEqual(next.supply.civDiscard, ['mystics']);
	assert.deepEqual(
		next.events
			.filter((e) => e.seq > state.seq && e.type.startsWith('civ'))
			.map((e) => [e.type, e.player, e.civ]),
		[
			['civGained', 1, 'mystics'],
			['civDiscarded', 1, 'mystics'],
			['civGained', 1, 'merrymakers'],
		]
	);
	assert.equal(next.seats[0].civData.mystics, undefined);
	assert.equal(decisionOf(next, 'chooseProphecy'), undefined);
});

test('Mystics gain 1 resource at setup only in the current version (R34)', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: ['mystics', 'nomads'],
			version,
		});
		const base = startedGame(2, {
			civs: ['leaders', 'nomads'],
			version,
		}).state;
		// The default predictions are all 1: only the start territory reaches its one at once.
		const seat = state.seats[0];
		assert.deepEqual(seat.civData.mystics, {
			predictions: {
				techCards: 1,
				districts: 1,
				territories: 1,
				tracks: 1,
			},
			reached: ['territories'],
		});
		assert.equal(
			held(seat) - held(base.seats[0]),
			1 + (version === 'current' ? 1 : 0),
			version
		);
	}
});

test('Architects pay 1 more resource for a uniform district', () => {
	/**
	 * Completes district 0 of seat 1 with a building, the rest of its open plots holding `others` (and one cube).
	 * @param {string} others
	 * @param {string} last
	 * @param {string[]} civs
	 */
	const complete = (others, last, civs = ['architects']) => {
		const { state, random } = game();
		const seat = state.seats[0];
		seat.civs = civs;
		const plots = cityPlots(seat);
		const open = groupsOf('districts')[0].filter(
			(p) => plots[p] === 'empty'
		);
		const [cube, ...rest] = open.slice(0, -1);
		seat.capital.cubes = [cube];
		build(seat, others, rest);
		const placing = resolveEffects(state, 1, [{ building: last }], random);
		const since = placing.seq;
		const placed = answer(
			placing,
			random,
			1,
			'choosePlacement',
			cell(open[open.length - 1])
		);
		const done = answerDefaults(placed, random);
		assert.deepEqual(
			eventsOf(done, 'districtsCompleted', since).map((e) => e.districts),
			[[0]]
		);
		return held(done.seats[0]);
	};
	// All houses (the cube doesn't count): the district's 1 resource and 1 more.
	assert.equal(complete('house', 'house'), 2);
	// A farm among houses: only the district's.
	assert.equal(complete('house', 'farm'), 1);
	// Without the Architects: only the district's.
	assert.equal(complete('house', 'house', []), 1);
});

test('Architects score 2 VP per uniform complete line', () => {
	/** @param {string[]} civs */
	const scored = (civs) => {
		const { state, random } = game();
		const seat = state.seats[0];
		seat.civs = civs;
		const plots = cityPlots(seat);
		const open = (/** @type {number[]} */ group) =>
			group.filter((p) => plots[p] === 'empty');
		const [row0] = groupsOf('rows');
		const columns = groupsOf('columns');
		// Row 0: farms and a cube, complete and uniform.
		const farms = open(row0);
		seat.capital.cubes = [/** @type {number} */ (farms.pop())];
		build(seat, 'farm', farms);
		// Column 0: its row-0 farm and houses, complete but mixed.
		assert.ok(farms.includes(columns[0][0]));
		build(
			seat,
			'house',
			open(columns[0]).filter((p) => p !== columns[0][0])
		);
		// Column 8: only houses besides impassable plots, complete and uniform.
		assert.equal(plots[columns[8][0]], 'blocked');
		build(seat, 'house', open(columns[8]));
		const vp = seat.vp;
		const next = resolveEffects(state, 1, [{ scoreCapital: {} }], random);
		const [event] = eventsOf(next, 'capitalScored', state.seq);
		return { event, vp: next.seats[0].vp - vp };
	};
	const architects = scored(['architects']);
	assert.deepEqual(architects.event, {
		type: 'capitalScored',
		player: 1,
		rows: 1,
		columns: 2,
		uniform: 2,
	});
	assert.equal(architects.vp, 5);
	const plain = scored([]);
	assert.equal(plain.event.uniform, 0);
	assert.equal(plain.vp, 3);
});

test('Architects gained mid-game may swap up to 3 pairs of buildings', () => {
	const { state, random } = game();
	const seat = state.seats[0];
	seat.civs = ['leaders'];
	state.supply.civs = [
		'architects',
		...state.supply.civs.filter((c) => c !== 'architects'),
	];
	// Plots 0 and 2 hold farms, plot 1 a house.
	build(seat, 'farm', [0]);
	build(seat, 'house', [1]);
	build(seat, 'farm', [2]);
	const at = (/** @type {any} */ s) =>
		Object.fromEntries(
			s.seats[0].capital.buildings.map((/** @type {any} */ b) => [
				plotIndex(b.row, b.col),
				b.building,
			])
		);
	let next = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(next.seats[0].civs, ['leaders', 'architects']);
	const decision = /** @type {any} */ (decisionOf(next, 'chooseSwap'));
	assert.equal(decision.left, 3);
	const answers = DECISIONS.chooseSwap.answers(next, decision);
	assert.deepEqual(answers, [{ a: null }, { a: 0, b: 1 }, { a: 1, b: 2 }]);
	for (const reply of answers) {
		assert.doesNotThrow(() =>
			DECISIONS.chooseSwap.check(next, decision, reply)
		);
	}
	// Two farms, an empty plot, or the same plot twice: refused.
	for (const reply of [
		{ a: 0, b: 2 },
		{ a: 0, b: 40 },
		{ a: 1, b: 1 },
		{ a: 1 },
	]) {
		assert.throws(() => answer(next, random, 1, 'chooseSwap', reply), {
			name: 'PlayerError',
			message:
				'Swap two different income buildings in your capital, or stop.',
		});
	}
	const since = next.seq;
	next = answer(next, random, 1, 'chooseSwap', { a: 1, b: 0 });
	assert.deepEqual(at(next), { 0: 'house', 1: 'farm', 2: 'farm' });
	assert.equal(/** @type {any} */ (decisionOf(next, 'chooseSwap')).left, 2);
	next = answer(next, random, 1, 'chooseSwap', { a: 0, b: 2 });
	assert.deepEqual(at(next), { 0: 'farm', 1: 'farm', 2: 'house' });
	next = answer(next, random, 1, 'chooseSwap', { a: 1, b: 2 });
	assert.deepEqual(at(next), { 0: 'farm', 1: 'house', 2: 'farm' });
	// Three swaps at most, and a swap pays nothing.
	assert.deepEqual(openDecisions(next), []);
	assert.deepEqual(
		eventsOf(next, 'buildingsSwapped', since).map((e) => [e.a, e.b]),
		[
			[1, 0],
			[0, 2],
			[1, 2],
		]
	);
	assert.deepEqual(eventsOf(next, 'resourcesGained', since), []);
	assert.deepEqual(eventsOf(next, 'vpGained', since), []);

	// Stopping ends the swaps.
	const stopped = answer(
		resolveEffects(state, 1, [{ gainCiv: {} }], random),
		random,
		1,
		'chooseSwap',
		{ a: null }
	);
	assert.deepEqual(openDecisions(stopped), []);
	assert.deepEqual(at(stopped), { 0: 'farm', 1: 'house', 2: 'farm' });

	// With one type of building there is nothing to swap, so nothing is asked.
	seat.capital.buildings = [];
	build(seat, 'farm', [0, 2]);
	const none = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	assert.deepEqual(none.seats[0].civs, ['leaders', 'architects']);
	assert.deepEqual(openDecisions(none), []);
});

test('Architects place 1 impassable cube per opponent in different districts only in the current version (R34)', () => {
	for (const version of VERSIONS) {
		for (const count of [2, 3]) {
			const civs = ['architects', 'nomads', 'leaders'].slice(0, count);
			const { state } = startedGame(count, { civs, version });
			const seat = state.seats[0];
			const cubes = seat.capital.cubes;
			if (version === 'original') {
				assert.deepEqual(cubes, [], `${version} ${count}`);
				continue;
			}
			// The default answers: the first open plot, then the first open plot of another district.
			assert.deepEqual(cubes, [0, 3, 6].slice(0, count - 1));
			const plots = cityPlots(seat);
			for (const p of cubes) {
				assert.equal(plots[p], 'blocked');
			}
			assert.deepEqual(
				eventsOf(state, 'cubePlaced').map((e) => [e.player, e.plot]),
				cubes.map((p) => [1, p])
			);
		}
	}

	// What is offered: every open plot, then only those of districts without a cube.
	const { state, random } = game(3);
	const seat = state.seats[0];
	seat.civs = ['architects'];
	const empty = cityPlots(seat).flatMap((kind, p) =>
		kind === 'empty' ? [p] : []
	);
	push(state, state.pending, [
		{ player: 1, kind: 'civAdjust', phase: 'setup' },
	]);
	run(state, random);
	const first = /** @type {any} */ (decisionOf(state, 'chooseSlot'));
	assert.deepEqual(
		[first.purpose, first.optional, first.options],
		['architectsCube', false, empty]
	);
	// Plot 40 is in the middle district, 4.
	let next = answer(state, random, 1, 'chooseSlot', { slot: 40 });
	const second = /** @type {any} */ (decisionOf(next, 'chooseSlot'));
	assert.deepEqual(
		second.options,
		empty.filter((p) => !groupsOf('districts')[4].includes(p))
	);
	assert.throws(() => answer(next, random, 1, 'chooseSlot', { slot: 41 }), {
		name: 'PlayerError',
		message: 'Choose one of the options offered.',
	});
	next = answer(next, random, 1, 'chooseSlot', { slot: 0 });
	assert.deepEqual(next.seats[0].capital.cubes, [40, 0]);
	assert.deepEqual(openDecisions(next), []);
});

test('Terraforming may build over an Architects cube like any impassable plot, for 5 VP', () => {
	const { state, random } = game();
	const seat = state.seats[0];
	seat.capital.cubes = [0];
	const blocked = resolveEffects(state, 1, [{ building: 'farm' }], random);
	assert.throws(
		() => answer(blocked, random, 1, 'choosePlacement', cell(0)),
		{ name: 'PlayerError', message: "That plot isn't open." }
	);
	seat.era = { card: 'terraforming', ability: 'terraforming' };
	const vp = seat.vp;
	const placing = resolveEffects(state, 1, [{ building: 'farm' }], random);
	const placed = answer(placing, random, 1, 'choosePlacement', cell(0));
	assert.equal(cityPlots(placed.seats[0])[0], 'farm');
	assert.equal(placed.seats[0].vp, vp + 5);
});
