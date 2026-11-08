// The arts track (#35 part 1): the switch, the fifth track, its prices, landmarks and spaces, the d20 and R118.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	checkOptions,
	createGame,
	EXPANSIONS_BUILT,
} from '../src/lib/engine/setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { artsInPlay, tracksOf } from '../src/lib/engine/tracks-in-play.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { TRACKS, advanceCost } from '../src/lib/engine/data/tracks.js';
import { countVp } from '../src/lib/engine/effects/vp.js';
import {
	EXPANSION_LANDMARKS,
	LANDMARKS,
	landmarksFor,
} from '../src/lib/engine/data/landmarks.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';
import { contextFor, resolveEffects, run } from '../src/lib/engine/loop.js';
import { repeatable } from '../src/lib/engine/effects/repeat.js';
import { predict } from '../src/lib/engine/civs/mystics.js';
import { leaders } from '../src/lib/engine/civs/leaders.js';
import { futurists } from '../src/lib/engine/civs/futurists.js';
import {
	SCIENCE_D20,
	SCIENCE_DIE,
	scienceFaces,
} from '../src/lib/engine/data/dice.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { advances } from '../src/lib/engine/decisions/choose-advance.js';
import {
	answer,
	newGame,
	placeAll,
	readyTurn,
	resolveTapestry,
} from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';
import { AA, kinds, ontoArts, place, reply } from './helpers/arts.mjs';

const ARTS_LANDMARKS = ['clock-tower', 'opera-house', 'holocenter'];

test('Arts & Architecture is built, and its two variants need it', () => {
	assert.deepEqual(EXPANSIONS_BUILT, ['pp', 'aa']);
	assert.doesNotThrow(() =>
		checkOptions({
			version: 'current',
			expansions: ['aa'],
			variants: ['no-arts-track'],
		})
	);
	assert.throws(
		() =>
			checkOptions({
				version: 'current',
				variants: ['either-science-die'],
			}),
		{ name: 'PlayerError', message: /needs Arts & Architecture/ }
	);
});

test('either science die is refused without the arts track', () => {
	assert.throws(
		() =>
			checkOptions({
				version: 'current',
				expansions: ['aa'],
				variants: ['no-arts-track', 'either-science-die'],
			}),
		{ name: 'PlayerError', message: /arts track/ }
	);
});

test('a game with the arts track puts every token on its start, and tracksOf lists five', () => {
	const { state } = newGame(3, AA);
	for (const seat of state.seats) {
		assert.deepEqual(seat.tracks.arts, [0]);
	}
	assert.deepEqual(tracksOf(state), [...TRACK_IDS, 'arts']);
	assert.equal(artsInPlay(state), true);
	checkState(state);
});

test('without the arts track no seat has an arts token', () => {
	for (const options of [
		{},
		{ expansions: ['pp'] },
		{ expansions: ['aa'], variants: ['no-arts-track'] },
	]) {
		const { state } = newGame(3, options);
		for (const seat of state.seats) {
			assert.ok(!('arts' in seat.tracks));
		}
		assert.deepEqual(tracksOf(state), [...TRACK_IDS]);
		assert.equal(artsInPlay(state), false);
	}
});

test('R59: a one-player game with the arts track is refused', () => {
	assert.throws(
		() =>
			createGame({
				players: [{ name: 'Ana' }],
				version: 'current',
				expansions: ['aa'],
				random: seededRandom(1),
			}),
		{ name: 'PlayerError', message: /2 or more players/ }
	);
	assert.doesNotThrow(() =>
		createGame({
			players: [{ name: 'Ana' }],
			version: 'current',
			expansions: ['aa'],
			variants: ['no-arts-track'],
			random: seededRandom(1),
		})
	);
});

const BOARD = ['exploration', 'science', 'technology', 'military'];
const payAny = (/** @type {object[]} */ gain) => ({ pay: { any: 1 }, gain });

test('the arts track has 12 spaces in four tiers, named as printed (03 §2.3)', () => {
	assert.deepEqual(
		TRACKS.arts.slice(1).map((s) => s.name),
		[
			'Cave Paintings',
			'Flutes',
			'Dance',
			'Epic Poetry',
			'Symphony',
			'Carved Marble Sculpture',
			'Rock Opera',
			'CGI Animation',
			'Flash Mob',
			'Virtual Reality Holocenter',
			'Infinite Spectrum Photography',
			'Streaming Implants',
		]
	);
	assert.deepEqual(
		TRACKS.arts.map((s) => s.tier),
		[0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]
	);
	assert.deepEqual(
		TRACKS.arts.map((s) => s.landmark),
		[
			null,
			null,
			null,
			null,
			'clock-tower',
			null,
			null,
			'opera-house',
			null,
			null,
			'holocenter',
			null,
			null,
		]
	);
});

test('each arts space has the benefit and bonus of 03 §2.3', () => {
	const flashMob = [{ advance: { tracks: BOARD } }];
	const expected = [
		[[{ gain: { tapestry: 1 } }], null, false],
		[[{ vp: 5 }], payAny([{ anyBuilding: {} }]), false],
		[[{ create: {} }], null, false],
		[
			[{ vp: { per: 'territoryTile' } }, { vp: { per: 'techCard' } }],
			null,
			false,
		],
		[[{ inspire: {} }], payAny([{ create: {} }]), false],
		[
			[{ choice: [[{ broadcast: {} }], [{ anyBuilding: {} }]] }],
			null,
			false,
		],
		[
			[{ refreshMasterpieces: { optional: true } }, { create: {} }],
			null,
			false,
		],
		[[{ inspire: {} }], payAny([{ anyBuilding: {} }]), false],
		[flashMob, null, false],
		[[{ anyBuilding: {} }, { vp: { per: 'incomeBuilding' } }], null, true],
		[flashMob, payAny([{ create: {} }]), false],
		[[{ streamingImplants: {} }], null, false],
	];
	expected.forEach(([benefit, bonus, ordered], index) => {
		const space = TRACKS.arts[index + 1];
		assert.deepEqual(space.benefit, benefit, space.name);
		assert.deepEqual(space.bonus, bonus, space.name);
		assert.equal(space.ordered, ordered, space.name);
	});
});

test('the arts tiers cost any 1, 2 different, any 3, then 2 of one type (03 §2.2)', () => {
	const tiers = [{ any: 1 }, { different: 2 }, { any: 3 }, { same: 2 }];
	for (let space = 1; space <= 12; space++) {
		assert.deepEqual(
			advanceCost('arts', space),
			tiers[Math.ceil(space / 3) - 1],
			`arts ${space}`
		);
	}
	assert.deepEqual(advanceCost('science', 4), { worker: 1, any: 1 });
});

test('Holocenter counts every income building off the mat (R71)', () => {
	const { state } = newGame(2, AA);
	state.seats[0].incomeMat.buildings = {
		market: 3,
		house: 5,
		farm: 4,
		armory: 5,
	};
	assert.equal(countVp(state, 1, 'incomeBuilding'), 3);
});

test('the arts track adds its 3 landmarks, with the shared footprints, only when it is in play (03 §2.10)', () => {
	assert.deepEqual(
		EXPANSION_LANDMARKS.filter((l) => l.arts).map((l) => [
			l.id,
			l.source,
			l.arts,
		]),
		[
			['clock-tower', { track: 'arts', tier: 2, space: 4 }, true],
			['opera-house', { track: 'arts', tier: 3, space: 7 }, true],
			['holocenter', { track: 'arts', tier: 4, space: 10 }, true],
		]
	);
	for (const id of ARTS_LANDMARKS) {
		const landmark = EXPANSION_LANDMARKS.find((l) => l.id === id);
		assert.equal(landmark?.footprint, FOOTPRINTS[id], id);
	}
	// With A&A's 5 landmark cards' landmarks too (#35 part 3), which stay without the arts track.
	assert.equal(landmarksFor(['aa']).length, 26);
	assert.equal(landmarksFor(['aa'], ['no-arts-track']).length, 23);
	assert.equal(landmarksFor(['pp', 'aa']).length, 33);
});

test('the arts landmarks are in the supply only with the arts track', () => {
	const on = newGame(2, AA).state;
	for (const id of ARTS_LANDMARKS) {
		assert.ok(on.landmarks.includes(id), id);
	}
	checkState(on);
	for (const options of [
		{},
		{ expansions: ['aa'], variants: ['no-arts-track'] },
	]) {
		const off = newGame(2, options).state;
		for (const id of ARTS_LANDMARKS) {
			assert.ok(!off.landmarks.includes(id), id);
		}
		checkState(off);
	}
});

test('Dystopia may take an arts-track landmark (03 §2.2)', () => {
	const boardTrack = LANDMARKS.filter((l) => 'track' in l.source).map(
		(l) => l.id
	);
	const { state, random, player } = readyTurn(
		2,
		(_seat, state) => {
			state.landmarks = state.landmarks.filter(
				(id) => !boardTrack.includes(id)
			);
		},
		AA
	);
	const next = resolveTapestry(state, random, player, 'dystopia');
	const [decision] = openDecisions(next);
	assert.equal(decision.kind, 'chooseLandmark');
	assert.deepEqual([...decision.options].sort(), [...ARTS_LANDMARKS].sort());
});

test('the advance turn offers the arts track at its tier price', () => {
	const { state, player } = readyTurn(
		2,
		(seat) => {
			seat.tracks.arts = [3];
			seat.resources = { coin: 1, worker: 1, food: 0, culture: 0 };
		},
		AA
	);
	assert.deepEqual(
		advances(state, player).filter((a) => a.track === 'arts'),
		[{ track: 'arts', from: 3, cost: { different: 2 } }]
	);
	const poor = readyTurn(
		2,
		(seat) => {
			seat.tracks.arts = [3];
			seat.resources = { coin: 2, worker: 0, food: 0, culture: 0 };
		},
		AA
	);
	assert.ok(
		!advances(poor.state, poor.player).some((a) => a.track === 'arts')
	);
});

test('a game without the arts track never offers it', () => {
	const { state, player } = readyTurn(2, (seat) => {
		seat.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
	});
	assert.ok(advances(state, player).length > 0);
	assert.ok(!advances(state, player).some((a) => a.track === 'arts'));
});

test('arts 1 Cave Paintings: a tapestry card', () => {
	const r = ontoArts(1);
	assert.deepEqual(r.seat.tracks.arts, [1]);
	assert.equal(r.seat.hand.length, 1);
	checkState(r.state);
});

test('arts 2 Flutes: 5 VP; the bonus pays 1 any for an income building of your choice', () => {
	const r = ontoArts(2);
	assert.equal(r.seat.vp, 5);
	reply(r, 'chooseBonus', { pay: { coin: 1 } });
	assert.deepEqual(kinds(r), ['chooseOption']);
	reply(r, 'chooseOption', { option: 0 });
	assert.equal(r.seat.incomeMat.buildings.market, 4);
});

test('the first player into arts tier II takes the Clock Tower before the benefit, then Epic Poetry scores', () => {
	const r = ontoArts(4, (seat, state) => {
		seat.territoryTiles = state.supply.territory.splice(0, 2);
		seat.tech.bottom = state.supply.tech.deck.splice(0, 1);
	});
	const landmarks = openDecisions(r.state)
		.filter((d) => d.kind === 'choosePlacement' && d.landmark)
		.map((d) => d.landmark);
	assert.deepEqual(landmarks, ['clock-tower']);
	assert.ok(!r.state.landmarks.includes('clock-tower'));
	assert.equal(r.seat.vp, 0, 'the benefit waits for the landmark');
	place(r);
	assert.equal(r.seat.vp, 3, '2 territory tiles and 1 tech card');
	checkState(r.state);
});

test('arts 9 Flash Mob: advance on one of the four board tracks, never the arts track (R118)', () => {
	const r = ontoArts(9);
	const [move] = openDecisions(r.state).filter(
		(d) => d.kind === 'chooseMove'
	);
	assert.deepEqual(
		[...new Set(move.options.map((/** @type {any} */ o) => o.track))],
		BOARD
	);
});

test('arts 10 Holocenter: the Holocenter, an income building, then 1 VP per income building (R71)', () => {
	const r = ontoArts(10, (seat) => {
		seat.incomeMat.buildings.house = 3;
	});
	const landmarks = openDecisions(r.state)
		.filter((d) => d.kind === 'choosePlacement' && d.landmark)
		.map((d) => d.landmark);
	assert.deepEqual(landmarks, ['holocenter']);
	place(r);
	// The Holocenter's first plot depends on the seeded capital; a district it completes asks for its resource first.
	const district = openDecisions(r.state).find(
		(d) => d.kind === 'chooseResource'
	);
	if (district) {
		reply(
			r,
			'chooseResource',
			DECISIONS.chooseResource.answers(r.state, district)[0]
		);
	}
	reply(r, 'chooseOption', { option: 0 });
	place(r);
	assert.equal(r.seat.vp, 3, '2 houses and the market just gained');
});

test('arts 11 Infinite Spectrum Photography: as Flash Mob', () => {
	const r = ontoArts(11);
	const [move] = openDecisions(r.state).filter(
		(d) => d.kind === 'chooseMove'
	);
	assert.deepEqual(
		[...new Set(move.options.map((/** @type {any} */ o) => o.track))],
		BOARD
	);
});

/**
 * The events of one type since a sequence number, without their numbers.
 * @param {any} state
 * @param {string} type
 * @param {number} [since]
 */
function eventsOf(state, type, since = 0) {
	return state.events
		.filter((/** @type {any} */ e) => e.type === type && e.seq > since)
		.map(({ seq: _seq, ...event }) => event);
}

/**
 * A random that returns the given numbers in turn, and throws when they run out.
 * @param {...number} values
 */
function rolls(...values) {
	return (/** @type {number} */ n) => {
		const value = values.shift();
		if (value === undefined || value >= n) {
			throw new Error(`No roll left for random(${n}).`);
		}
		return value;
	};
}

test('the d20 has 4 faces for each of the five tracks', () => {
	assert.equal(SCIENCE_D20.length, 20);
	for (const track of [...TRACK_IDS, 'arts']) {
		assert.equal(
			SCIENCE_D20.filter((face) => face === track).length,
			4,
			track
		);
	}
	assert.equal(scienceFaces('d12'), SCIENCE_DIE);
	assert.equal(scienceFaces('d20'), SCIENCE_D20);
});

test('with the arts track every research roll uses the d20', () => {
	const ready = readyTurn(2, () => {}, AA);
	const since = ready.state.seq;
	const next = resolveEffects(
		ready.state,
		ready.player,
		[{ research: {} }],
		rolls(4)
	);
	assert.deepEqual(eventsOf(next, 'scienceDieRolled', since), [
		{
			type: 'scienceDieRolled',
			player: ready.player,
			track: 'arts',
			scienceDie: 'd20',
		},
	]);
	const move = openDecisions(next).find((d) => d.kind === 'chooseMove');
	assert.deepEqual(move?.options, [{ track: 'arts', from: 0 }]);

	const base = readyTurn(2);
	const rolled = resolveEffects(
		base.state,
		base.player,
		[{ research: {} }],
		rolls(4)
	);
	assert.deepEqual(eventsOf(rolled, 'scienceDieRolled', base.state.seq), [
		{ type: 'scienceDieRolled', player: base.player, track: 'exploration' },
	]);
});

test('a d20 roll on the arts track with the token on 12 gives nothing, as on any finished track', () => {
	const ready = readyTurn(
		2,
		(seat) => {
			seat.tracks.arts = [12];
		},
		AA
	);
	const next = resolveEffects(
		ready.state,
		ready.player,
		[{ research: {} }],
		rolls(4)
	);
	assert.deepEqual(
		openDecisions(next).map((d) => d.kind),
		['chooseTurn']
	);
});

test('with either science die, the roller chooses the die before each roll', () => {
	const options = { expansions: ['aa'], variants: ['either-science-die'] };
	const ready = readyTurn(2, () => {}, options);
	const asked = resolveEffects(
		ready.state,
		ready.player,
		[{ research: {} }],
		rolls()
	);
	const [decision] = openDecisions(asked);
	assert.equal(decision.kind, 'chooseScienceDie');
	assert.deepEqual(decision.options, ['d20', 'd12']);
	assert.deepEqual(DECISIONS.chooseScienceDie.answers(asked, decision), [
		{ die: 'd20' },
		{ die: 'd12' },
	]);
	assert.throws(
		() =>
			answer(asked, rolls(), ready.player, 'chooseScienceDie', {
				die: 'd6',
			}),
		{ name: 'PlayerError', message: 'Choose the d12 or the d20.' }
	);
	const d12 = answer(asked, rolls(4), ready.player, 'chooseScienceDie', {
		die: 'd12',
	});
	assert.deepEqual(eventsOf(d12, 'scienceDieRolled', asked.seq), [
		{
			type: 'scienceDieRolled',
			player: ready.player,
			track: 'exploration',
		},
	]);
});

test('Empiricism rolls the chosen die twice', () => {
	const options = { expansions: ['aa'], variants: ['either-science-die'] };
	const ready = readyTurn(
		2,
		(seat) => {
			seat.era = { card: 'empiricism', ability: 'empiricism' };
		},
		options
	);
	const asked = resolveEffects(
		ready.state,
		ready.player,
		[{ research: {} }],
		rolls()
	);
	const rolled = answer(
		asked,
		rolls(4, 0),
		ready.player,
		'chooseScienceDie',
		{
			die: 'd20',
		}
	);
	assert.deepEqual(
		eventsOf(rolled, 'scienceDieRolled', asked.seq).map((e) => [
			e.track,
			e.scienceDie,
		]),
		[
			['arts', 'd20'],
			['exploration', 'd20'],
		]
	);
	const choice = openDecisions(rolled).find((d) => d.kind === 'chooseRoll');
	assert.deepEqual(choice?.options, ['arts', 'exploration']);
});

test("Alchemists: an arts roll marks nothing and doesn't bust (03 §2.2)", () => {
	const { state, player } = readyTurn(
		2,
		(seat) => {
			seat.civData.alchemists = { marked: ['science'] };
		},
		AA
	);
	const next = structuredClone(state);
	const since = next.seq;
	push(next, next.pending, [{ player, kind: 'alchemistsRoll' }]);
	run(next, rolls(4));
	assert.deepEqual(next.seats[player - 1].civData.alchemists.marked, [
		'science',
	]);
	// The event names the d20, so the dice tray rolls it (#35 part 4).
	assert.deepEqual(eventsOf(next, 'alchemistsRolled', since), [
		{
			type: 'alchemistsRolled',
			player,
			track: 'arts',
			marked: ['science'],
			scienceDie: 'd20',
		},
	]);
	assert.deepEqual(eventsOf(next, 'alchemistsBust', since), []);
	const [decision] = openDecisions(next);
	assert.equal(decision.kind, 'chooseAlchemists');
	assert.deepEqual(decision.marked, ['science']);
});

test('Treasure Hunters roll the d20 for a science treasure with the arts track', () => {
	const { state, player } = readyTurn(2, () => {}, AA);
	const next = structuredClone(state);
	const since = next.seq;
	push(next, next.pending, [
		{ player, kind: 'treasureRoll', hex: '0_0', die: 'science' },
	]);
	run(next, rolls(4, 0));
	assert.deepEqual(eventsOf(next, 'treasureRolled', since), [
		{
			type: 'treasureRolled',
			player,
			die: 'science',
			faces: [4, 0],
			scienceDie: 'd20',
		},
	]);
	const choice = openDecisions(next).find((d) => d.kind === 'chooseRoll');
	assert.deepEqual(choice?.options, ['arts', 'exploration']);
});

/**
 * A 2-player A&A game whose current player starts a turn, every token of both seats on 0 unless `fill` moves it.
 * @param {(seat: any, state: any, other: any) => void} [fill] - Gets the current seat, the state and the other seat
 */
function artsTurn(fill = () => {}) {
	return readyTurn(
		2,
		(seat, state) => {
			const other = state.seats.find(
				(/** @type {any} */ s) => s !== seat
			);
			for (const s of [seat, other]) {
				s.tracks = {
					...Object.fromEntries(tracksOf(state).map((t) => [t, [0]])),
				};
			}
			fill(seat, state, other);
		},
		AA
	);
}

/**
 * Runs one operation on a copy of the state.
 * @param {any} state
 * @param {Record<string, any>} op
 * @param {import('../src/lib/engine/random.js').Random} random
 */
function runOp(state, op, random) {
	const next = structuredClone(state);
	push(next, next.pending, [op]);
	run(next, random);
	return next;
}

/** @param {any} state @param {string} kind */
const decisionOf = (state, kind) =>
	openDecisions(state).find((d) => d.kind === kind);

test('R118: Renaissance advances once on each of the five tracks', () => {
	const { state, random, player } = artsTurn();
	const next = resolveTapestry(state, random, player, 'renaissance');
	const order = decisionOf(next, 'chooseOrder');
	assert.equal(order.effects.length, 5);
	assert.deepEqual(order.effects.at(-1), {
		advance: { tracks: ['arts'], noBenefit: true, freeBonus: true },
	});
	const base = readyTurn(2);
	const four = resolveTapestry(
		base.state,
		base.random,
		base.player,
		'renaissance'
	);
	assert.equal(decisionOf(four, 'chooseOrder').effects.length, 4);
});

test('R118: Plea for Aid counts the arts track', () => {
	const { state, random, player } = artsTurn((_seat, _state, other) => {
		other.tracks.arts = [1];
	});
	const vp = state.seats[player - 1].vp;
	const next = resolveTapestry(state, random, player, 'plea-for-aid');
	assert.equal(next.seats[player - 1].vp - vp, 2);
});

test('R118: Boast of Superiority counts the arts track', () => {
	const { state, random, player } = artsTurn((seat, _state, other) => {
		for (const track of BOARD) {
			other.tracks[track] = [1];
		}
		seat.tracks.arts = [1];
	});
	const vp = state.seats[player - 1].vp;
	const next = resolveTapestry(state, random, player, 'boast-of-superiority');
	assert.equal(next.seats[player - 1].vp - vp, 4);
});

test('R118: Dictatorship, Socialism and Trade Economy reach the arts track', () => {
	const { state, random, player } = artsTurn((seat, _state, other) => {
		seat.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
		other.tracks.arts = [2];
	});
	const dictated = resolveTapestry(state, random, player, 'dictatorship');
	assert.ok(decisionOf(dictated, 'chooseTrack').options.includes('arts'));
	// The arts track is the only one with an opponent token elsewhere, so the jump is made without asking.
	const social = resolveTapestry(state, random, player, 'socialism');
	assert.deepEqual(social.seats[player - 1].tracks.arts, [2]);
	const traded = resolveTapestry(state, random, player, 'trade-economy');
	assert.deepEqual(
		traded.events
			.filter(
				(/** @type {any} */ e) =>
					e.type === 'spaceActivated' && e.seq > state.seq
			)
			.map((/** @type {any} */ e) => [e.track, e.space]),
		[['arts', 2]]
	);
});

test('R118: Marriage of State may name the arts track', () => {
	const { state, random, player } = artsTurn();
	const next = resolveTapestry(state, random, player, 'marriage-of-state');
	assert.ok(
		decisionOf(next, 'choosePartner').options.some(
			(/** @type {any} */ o) => o.track === 'arts'
		)
	);
});

test('R118: Oil Magnate may share an advance on the arts track', () => {
	const { state, random, player } = artsTurn();
	const next = resolveTapestry(state, random, player, 'oil-magnate');
	assert.deepEqual(decisionOf(next, 'chooseTrack').options, [
		...BOARD,
		'arts',
	]);
});

test('R118: AI Singularity may start its new token on the arts track', () => {
	const { state, random, player } = artsTurn((seat) => {
		seat.tracks.technology = [12];
	});
	const next = runOp(
		state,
		{
			player,
			kind: 'effects',
			effects: [{ restartToken: {} }],
			source: { track: 'technology', space: 12 },
		},
		random
	);
	assert.deepEqual(decisionOf(next, 'chooseRestart').options, [
		...BOARD,
		'arts',
	]);
});

test('R118: Academic Research may repeat the arts space', () => {
	const { state, player } = artsTurn((seat) => {
		seat.tracks.arts = [2];
	});
	assert.deepEqual(repeatable(state, player), [{ track: 'arts', space: 2 }]);
});

test('R118: Status Quo takes an arts bonus', () => {
	const { state, random, player } = artsTurn((seat) => {
		seat.tracks.arts = [2];
	});
	const next = resolveTapestry(state, random, player, 'status-quo');
	assert.deepEqual(eventsOf(next, 'freeBonus', state.seq), [
		{ type: 'freeBonus', player, track: 'arts', space: 2 },
	]);
});

test("R118: Spies' option 3 takes a neighbour's arts space", () => {
	const { state, random, player } = artsTurn((seat, _state, other) => {
		seat.civData.spies = { used: [], watching: [] };
		other.tracks.arts = [1];
	});
	const next = runOp(state, { player, kind: 'spiesOption', slot: 3 }, random);
	assert.ok(
		next.activated.some(
			(/** @type {any} */ a) =>
				a.player === player && a.track === 'arts' && a.space === 1
		)
	);
});

test('R118: the Tinkerers reach the arts track, and option 1 pays back its price as printed', () => {
	const different = artsTurn((seat) => {
		seat.civData.tinkerers = { used: [] };
		seat.tracks.arts = [5];
	});
	const paid = runOp(
		different.state,
		{ player: different.player, kind: 'tinkerersOption', slot: 1 },
		different.random
	);
	assert.deepEqual(decisionOf(paid, 'chooseOption').options, [
		[{ gain: { coin: 1, worker: 1 } }],
		[{ gain: { coin: 1, food: 1 } }],
		[{ gain: { coin: 1, culture: 1 } }],
		[{ gain: { worker: 1, food: 1 } }],
		[{ gain: { worker: 1, culture: 1 } }],
		[{ gain: { food: 1, culture: 1 } }],
	]);
	const same = artsTurn((seat) => {
		seat.civData.tinkerers = { used: [] };
		seat.tracks.arts = [10];
	});
	const paidSame = runOp(
		same.state,
		{ player: same.player, kind: 'tinkerersOption', slot: 1 },
		same.random
	);
	assert.deepEqual(decisionOf(paidSame, 'chooseOption').options, [
		[{ gain: { coin: 2 } }],
		[{ gain: { worker: 2 } }],
		[{ gain: { food: 2 } }],
		[{ gain: { culture: 2 } }],
	]);
	const ahead = artsTurn((seat, _state, other) => {
		seat.civData.tinkerers = { used: [] };
		other.tracks.arts = [2];
	});
	const matched = runOp(
		ahead.state,
		{ player: ahead.player, kind: 'tinkerersOption', slot: 2 },
		ahead.random
	);
	assert.deepEqual(matched.seats[ahead.player - 1].tracks.arts, [2]);
});

test('R118: the Mystics count a completed arts track', () => {
	const { state, random, player } = artsTurn((seat) => {
		seat.tracks.arts = [12];
		seat.civData.mystics = {
			predictions: { techCards: 9, districts: 9, territories: 9 },
			reached: [],
		};
	});
	const next = structuredClone(state);
	const since = next.seq;
	predict(contextFor(next, random, next.pending), player, 'tracks', 1);
	run(next, random);
	assert.deepEqual(
		eventsOf(next, 'prophecyReached', since).map((e) => e.category),
		['tracks']
	);
});

test('R118: Dark Ages with five tracks: the player chooses the track to advance and the one left alone', () => {
	const { state, random, player } = artsTurn((seat) => {
		seat.tracks.exploration = [2];
		seat.tracks.science = [2];
		seat.tracks.technology = [2];
		seat.tracks.arts = [2];
	});
	let next = resolveTapestry(state, random, player, 'dark-ages');
	next = answer(next, random, player, 'chooseTrack', { track: 'military' });
	const keep = decisionOf(next, 'chooseTrack');
	assert.equal(keep.purpose, 'darkAgesKeep');
	assert.deepEqual(keep.options, [
		'exploration',
		'science',
		'technology',
		'arts',
	]);
	next = answer(next, random, player, 'chooseTrack', { track: 'arts' });
	next = placeAll(next, random);
	const tracks = next.seats[player - 1].tracks;
	assert.deepEqual(
		[
			tracks.exploration,
			tracks.science,
			tracks.technology,
			tracks.military,
			tracks.arts,
		],
		[[1], [1], [1], [3], [2]]
	);
});

test('R118: Dark Ages lets a player choose the kept track even when only one track can regress', () => {
	const { state, random, player } = artsTurn((seat) => {
		seat.tracks.science = [3];
	});
	let next = resolveTapestry(state, random, player, 'dark-ages');
	next = answer(next, random, player, 'chooseTrack', {
		track: 'exploration',
	});
	const keep = decisionOf(next, 'chooseTrack');
	assert.equal(keep.purpose, 'darkAgesKeep');
	assert.deepEqual(keep.options, [
		'science',
		'technology',
		'military',
		'arts',
	]);
});

test('R118: Leaders and Futurists keep the four board tracks', () => {
	const { state, random, player } = artsTurn((seat) => {
		seat.civData.leaders = { used: [] };
	});
	const led = structuredClone(state);
	leaders.income?.(contextFor(led, random, led.pending), player);
	run(led, random);
	assert.deepEqual(decisionOf(led, 'chooseSlot').options, BOARD);
	const ahead = structuredClone(state);
	futurists.setup?.(contextFor(ahead, random, ahead.pending), player, true);
	run(ahead, random);
	const tracks = ahead.seats[player - 1].tracks;
	assert.deepEqual(
		BOARD.map((t) => tracks[t]),
		[[4], [4], [4], [4]]
	);
	assert.deepEqual(tracks.arts, [0]);
});
