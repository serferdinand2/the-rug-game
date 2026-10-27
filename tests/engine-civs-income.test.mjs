// Tests for the civilizations that act in step 1 of income turns: Leaders, Merrymakers, Entertainers, The Chosen and Alchemists (#20, design §7).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { entertainersMoves } from '../src/lib/engine/civs/entertainers.js';
import { MERRYMAKERS_COLUMNS } from '../src/lib/engine/civs/merrymakers.js';
import {
	readyTurn,
	startedGame,
	answer,
	answerDefaults,
} from './helpers/engine.mjs';

const VERSIONS = /** @type {const} */ (['original', 'current']);

/** Indexes of the science die's faces: exploration, science, technology, military. */
const FACE = { exploration: 0, science: 1, technology: 2, military: 3 };

/**
 * A seeded random whose twelve-sided rolls (the science die) follow a script; every other call is the seeded one.
 * @param {(keyof typeof FACE)[]} rolls
 */
function scripted(rolls) {
	const base = seededRandom(7);
	const faces = rolls.map((track) => FACE[track]);
	return (/** @type {number} */ n) =>
		n === 12 && faces.length > 0
			? /** @type {number} */ (faces.shift())
			: base(n);
}

/**
 * The current player of a 2-player game, holding the named civilization, takes an income turn after `before` turns.
 * The opponent has started that era already, so no first-of-neighbours bonus asks.
 * @param {string} civ
 * @param {number} before - Income turns already taken
 * @param {(seat: any, state: any) => void} [fill]
 * @param {{ version?: 'original' | 'current', random?: import('../src/lib/engine/random.js').Random }} [options]
 */
function incomeTurn(civ, before, fill = () => {}, { version, random } = {}) {
	let vpBefore = 0;
	const ready = readyTurn(
		2,
		(seat, state) => {
			vpBefore = seat.vp;
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
	const rng = random ?? ready.random;
	const state = answer(ready.state, rng, ready.player, 'chooseTurn', {
		turn: 'income',
	});
	return { state, random: rng, player: ready.player, since, vpBefore };
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

/**
 * The type of the second event after each token move since a sequence number (the first is the space activated): a benefit shows there as its own event.
 * @param {any} state
 * @param {number} since
 */
const afterMoves = (state, since) => {
	const events = state.events.filter((/** @type {any} */ e) => e.seq > since);
	return events.flatMap((/** @type {any} */ e, /** @type {number} */ i) =>
		e.type === 'tokenMoved' ? [events[i + 2]?.type] : []
	);
};

/**
 * What a player gained of one resource since a sequence number.
 * @param {any} state
 * @param {number} player
 * @param {string} resource
 * @param {number} since
 */
const gainedOf = (state, player, resource, since) =>
	eventsOf(state, 'resourcesGained', since)
		.filter((e) => e.player === player)
		.reduce((sum, e) => sum + (e.gained[resource] ?? 0), 0);

/** The kinds of the decisions open for a player. */
const openKinds = (/** @type {any} */ state, /** @type {number} */ player) =>
	openDecisions(state)
		.filter((d) => d.player === player)
		.map((d) => d.kind);

/** The open decision of a kind. */
const decisionOf = (/** @type {any} */ state, /** @type {string} */ kind) =>
	openDecisions(state).find((d) => d.kind === kind);

/** The seat's token positions on a track, given a state. */
const track = (
	/** @type {any} */ state,
	/** @type {number} */ player,
	/** @type {string} */ id
) => state.seats[player - 1].tracks[id];

test('Leaders advance once per track with the benefit but no bonus, and may decline', () => {
	const r = incomeTurn('leaders', 1, (seat) => {
		// Space 1 to 2 on technology is Carpentry, which has a bonus.
		seat.tracks.technology = [1];
		seat.tracks.science = [3];
	});
	const pick = /** @type {any} */ (decisionOf(r.state, 'chooseSlot'));
	assert.equal(pick.purpose, 'leaders');
	assert.equal(pick.optional, true);
	assert.deepEqual(pick.options, [
		'exploration',
		'science',
		'technology',
		'military',
	]);
	const mark = r.state.seq;
	const state = answer(r.state, r.random, r.player, 'chooseSlot', {
		slot: 'technology',
	});
	assert.deepEqual(track(state, r.player, 'technology'), [2]);
	assert.deepEqual(
		afterMoves(state, mark),
		['cardsDrawn'],
		"Carpentry's tapestry card"
	);
	assert.ok(
		!openKinds(state, r.player).includes('chooseBonus'),
		'no bonus is offered'
	);
	assert.deepEqual(state.seats[r.player - 1].civData.leaders.used, [
		'technology',
	]);

	// The square is covered: it isn't offered on the next income turn.
	const next = incomeTurn('leaders', 2, (seat) => {
		seat.civData.leaders.used = ['technology'];
		seat.tracks.technology = [1];
	});
	assert.ok(
		!decisionOf(next.state, 'chooseSlot')./** @type {any} */
		options.includes('technology')
	);

	// Declining leaves the square free.
	const declined = answer(r.state, r.random, r.player, 'chooseSlot', {
		slot: null,
	});
	assert.deepEqual(declined.seats[r.player - 1].civData.leaders.used, []);
	assert.deepEqual(track(declined, r.player, 'technology'), [1]);
});

test('Leaders never offer a blocked or finished track', () => {
	const r = incomeTurn('leaders', 1, (seat, state) => {
		seat.tracks.science = [12];
		// The opponent's Dictatorship blocks exploration for everyone else.
		state.blocks.push({ player: 1, track: 'exploration' });
	});
	assert.deepEqual(
		/** @type {any} */ (decisionOf(r.state, 'chooseSlot')).options,
		['technology', 'military']
	);
	assert.deepEqual(
		eventsOf(r.state, 'civAbilityUsed', r.since).map((e) => e.civ),
		['leaders']
	);
});

test('Leaders offer nothing when no track can advance', () => {
	const r = incomeTurn('leaders', 1, (seat) => {
		for (const id of ['exploration', 'science', 'technology', 'military']) {
			seat.tracks[id] = [12];
		}
	});
	assert.equal(decisionOf(r.state, 'chooseSlot'), undefined);
});

test('Merrymakers move one token up and gain both icons', () => {
	const r = incomeTurn('merrymakers', 1, (seat) => {
		seat.civData.merrymakers.levels = [1, 0, 3];
	});
	const pick = /** @type {any} */ (decisionOf(r.state, 'chooseSlot'));
	assert.equal(pick.purpose, 'merrymakers');
	assert.deepEqual(pick.options, [0, 1], 'column 3 is full');
	const mark = r.state.seq;
	const state = answer(r.state, r.random, r.player, 'chooseSlot', {
		slot: 0,
	});
	const after = state.seats[r.player - 1];
	assert.deepEqual(after.civData.merrymakers.levels, [2, 0, 3]);
	assert.deepEqual(eventsOf(state, 'resourcesGained', mark)[0].gained, {
		worker: 1,
		food: 1,
	});
	assert.deepEqual(eventsOf(state, 'merrymakersMoved', r.since), [
		{
			type: 'merrymakersMoved',
			player: r.player,
			column: 0,
			level: 2,
		},
	]);
});

test("Merrymakers' top spaces: both icons of a space in any order, and 15 VP", () => {
	assert.equal(MERRYMAKERS_COLUMNS.length, 3);
	const r = incomeTurn('merrymakers', 1, (seat) => {
		seat.civData.merrymakers.levels = [3, 3, 2];
	});
	// Only column 3 can move: made without asking.
	assert.equal(decisionOf(r.state, 'chooseSlot'), undefined);
	assert.equal(r.state.seats[r.player - 1].vp, r.vpBefore + 15);
	assert.deepEqual(
		r.state.seats[r.player - 1].civData.merrymakers.levels,
		[3, 3, 3]
	);
});

test('Merrymakers gain 1 resource at setup only in the current version (R34)', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: ['merrymakers', 'nomads'],
			version,
		});
		const seat = state.seats[0];
		const held = Object.values(seat.resources).reduce(
			(sum, n) => sum + n,
			0
		);
		const base = startedGame(2, { civs: ['leaders', 'nomads'], version })
			.state.seats[0];
		const baseHeld = Object.values(base.resources).reduce(
			(sum, n) => sum + n,
			0
		);
		assert.equal(held - baseHeld, version === 'current' ? 1 : 0, version);
		assert.deepEqual(seat.civData.merrymakers.levels, [0, 0, 0]);
	}
});

test('Entertainers start on the start space and gain it with a required move', () => {
	assert.deepEqual(entertainersMoves('start'), [
		'c1r1',
		'c1r2',
		'c1r3',
		'c1r4',
	]);
	const r = incomeTurn('entertainers', 1);
	assert.equal(r.state.seats[r.player - 1].civData.entertainers.at, 'start');
	const pick = /** @type {any} */ (decisionOf(r.state, 'chooseSlot'));
	assert.equal(pick.purpose, 'entertainers');
	assert.equal(pick.optional, false);
	assert.deepEqual(pick.options, ['c1r1', 'c1r2', 'c1r3', 'c1r4']);
	const mark = r.state.seq;
	const state = answer(r.state, r.random, r.player, 'chooseSlot', {
		slot: 'c1r2',
	});
	assert.equal(state.seats[r.player - 1].civData.entertainers.at, 'c1r2');
	assert.deepEqual(eventsOf(state, 'resourcesGained', mark)[0].gained, {
		culture: 1,
	});
});

test("Entertainers move along R28's links and gain the space; column 4 advances may pay the bonus (R29)", () => {
	const links = {
		c1r1: ['c2r1', 'c2r2'],
		c1r2: ['c2r2', 'c2r3'],
		c1r3: ['c2r2', 'c2r3'],
		c1r4: ['c2r3', 'c2r4'],
		c2r1: ['c3r1', 'c3r2'],
		c2r2: ['c3r1', 'c3r2'],
		c2r3: ['c3r3', 'c3r4'],
		c2r4: ['c3r3', 'c3r4'],
		c3r1: ['c4r1', 'c4r2'],
		c3r2: ['c4r2', 'c4r3'],
		c3r3: ['c4r2', 'c4r3'],
		c3r4: ['c4r3', 'c4r4'],
		c4r1: [],
		c4r4: [],
	};
	for (const [from, to] of Object.entries(links)) {
		assert.deepEqual(entertainersMoves(from), to, from);
	}
	// A required move with one option is made at once: c3r2 -> choose, but c4 has no move.
	const r = incomeTurn('entertainers', 2, (seat) => {
		seat.civData.entertainers.at = 'c3r2';
		seat.tracks.technology = [1];
		seat.tracks.exploration = [1];
		seat.resources.coin = 3;
		seat.resources.worker = 3;
		seat.resources.food = 3;
		seat.resources.culture = 3;
	});
	const pick = /** @type {any} */ (decisionOf(r.state, 'chooseSlot'));
	assert.deepEqual(pick.options, ['c4r2', 'c4r3']);
	// c4r2 is the advance on exploration: the benefit of space 2 comes, and its bonus is offered.
	const state = answer(r.state, r.random, r.player, 'chooseSlot', {
		slot: 'c4r2',
	});
	assert.deepEqual(track(state, r.player, 'exploration'), [2]);
	assert.ok(openKinds(state, r.player).includes('chooseBonus'));

	// From column 4 the token stays.
	const done = incomeTurn('entertainers', 2, (seat) => {
		seat.civData.entertainers.at = 'c4r4';
	});
	assert.equal(decisionOf(done.state, 'chooseSlot'), undefined);
	assert.equal(
		done.state.seats[done.player - 1].civData.entertainers.at,
		'c4r4'
	);
});

test('Entertainers gained mid-game put the token on any space and gain it', () => {
	const { state: started, random } = startedGame(2, {
		civs: ['leaders', 'nomads'],
	});
	const state = structuredClone(started);
	state.supply.civs.unshift('entertainers');
	// gainCiv draws the top of the deck.
	const before = state.seats[0].resources.coin;
	const next = resolveEffects(state, 1, [{ gainCiv: {} }], random);
	const pick = /** @type {any} */ (decisionOf(next, 'chooseSlot'));
	assert.equal(pick.options.length, 16);
	assert.ok(!pick.options.includes('start'));
	const done = answer(next, random, 1, 'chooseSlot', { slot: 'c1r4' });
	assert.equal(done.seats[0].civData.entertainers.at, 'c1r4');
	assert.equal(done.seats[0].resources.coin, before + 1);
});

test('Entertainers gain 1 resource and 10 VP at setup only in the current version', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: ['entertainers', 'nomads'],
			version,
		});
		const base = startedGame(2, {
			civs: ['leaders', 'nomads'],
			version,
		}).state;
		assert.equal(
			state.seats[0].vp - base.seats[0].vp,
			version === 'current' ? 10 : 0,
			version
		);
		const sum = (/** @type {any} */ s) =>
			Object.values(s.resources).reduce(
				(a, n) => /** @type {number} */ (a) + /** @type {number} */ (n),
				0
			);
		assert.equal(
			/** @type {number} */ (sum(state.seats[0])) -
				/** @type {number} */ (sum(base.seats[0])),
			version === 'current' ? 1 : 0,
			version
		);
	}
});

test('The Chosen score 1 VP per opponent per track they lead, and resources per achievement, or 5 VP each on income turn 5', () => {
	// Two players: the opponent leads science and technology; the Chosen lead the other two (and ties).
	const setup = (/** @type {any} */ seat, /** @type {any} */ state) => {
		seat.tracks.exploration = [3];
		seat.tracks.military = [2];
		state.seats[0].tracks.science = [4];
		state.seats[0].tracks.technology = [1];
		state.achievements['topple-two'] = [2];
		state.achievements['middle-island'] = [1, 2];
	};
	// Turn 2: 2 tracks led x 1 opponent = 2 VP; 2 achievements = 2 resources of choice (default answers).
	const t2 = incomeTurn('the-chosen', 1, setup);
	const gained = eventsOf(t2.state, 'vpGained', t2.since).filter(
		(e) => e.player === t2.player
	);
	assert.equal(gained[0].vp, 2, 'tracks led');
	const choice = /** @type {any} */ (decisionOf(t2.state, 'chooseResource'));
	assert.equal(choice.count, 2, 'one resource of choice per achievement');

	// Turn 5: 5 VP each instead of resources.
	const t5 = incomeTurn('the-chosen', 4, setup);
	const vps = eventsOf(t5.state, 'vpGained', t5.since)
		.filter((e) => e.player === t5.player)
		.map((e) => e.vp);
	assert.deepEqual(
		vps.slice(0, 2),
		[2, 10],
		'tracks led, then 5 per achievement'
	);
});

test('The Chosen gain 15 VP per opponent at setup only in the current version', () => {
	for (const version of VERSIONS) {
		for (const count of [2, 3]) {
			const { state } = startedGame(count, {
				civs: ['the-chosen', 'nomads', 'leaders'],
				version,
			});
			const other = state.seats[1].vp;
			assert.equal(
				state.seats[0].vp - other,
				version === 'current' ? 15 * (count - 1) : 0,
				`${version} ${count}`
			);
		}
	}
});

test('Alchemists roll until they stop, then advance once on each marked track without benefit', () => {
	const random = scripted(['technology', 'science', 'military']);
	const r = incomeTurn(
		'alchemists',
		1,
		(seat) => {
			seat.tracks.technology = [1];
			seat.tracks.science = [1];
			seat.tracks.military = [1];
		},
		{ random }
	);
	// The first roll happens without asking.
	assert.deepEqual(
		eventsOf(r.state, 'alchemistsRolled', r.since).map((e) => e.track),
		['technology']
	);
	let state = r.state;
	let pick = /** @type {any} */ (decisionOf(state, 'chooseAlchemists'));
	assert.deepEqual(pick.marked, ['technology']);
	assert.deepEqual(DECISIONS.chooseAlchemists.answers(state, pick), [
		{ roll: true },
		{ roll: false },
	]);
	state = answer(state, r.random, r.player, 'chooseAlchemists', {
		roll: true,
	});
	state = answer(state, r.random, r.player, 'chooseAlchemists', {
		roll: true,
	});
	pick = /** @type {any} */ (decisionOf(state, 'chooseAlchemists'));
	assert.deepEqual(pick.marked, ['technology', 'science', 'military']);
	const mark = state.seq;
	state = answer(state, r.random, r.player, 'chooseAlchemists', {
		roll: false,
	});
	// One optional advance per marked track, in roll order, without benefit (no tapestry card from Carpentry).
	for (const id of ['technology', 'science', 'military']) {
		const move = /** @type {any} */ (decisionOf(state, 'chooseMove'));
		assert.equal(move.benefit, false, id);
		assert.deepEqual(move.options, [{ track: id, from: 1 }]);
		state = answer(state, r.random, r.player, 'chooseMove', {
			track: id,
			from: 1,
		});
		assert.deepEqual(track(state, r.player, id), [2]);
	}
	assert.deepEqual(
		afterMoves(state, mark).filter((type) => type === 'cardsDrawn'),
		[],
		'no benefit'
	);
	assert.deepEqual(state.seats[r.player - 1].civData.alchemists.marked, []);
	assert.equal(
		openKinds(state, r.player).includes('chooseBonus'),
		false,
		'no bonus'
	);
});

test('Alchemists bust on a repeated track and gain 1 resource', () => {
	const random = scripted(['technology', 'science', 'technology']);
	const r = incomeTurn(
		'alchemists',
		1,
		(seat) => {
			seat.tracks.technology = [1];
		},
		{ random }
	);
	let state = r.state;
	state = answer(state, r.random, r.player, 'chooseAlchemists', {
		roll: true,
	});
	assert.deepEqual(
		/** @type {any} */ (decisionOf(state, 'chooseAlchemists')).marked,
		['technology', 'science']
	);
	const kinds = [];
	state = answer(state, r.random, r.player, 'chooseAlchemists', {
		roll: true,
	});
	assert.equal(eventsOf(state, 'alchemistsBust', r.since).length, 1);
	kinds.push(...openKinds(state, r.player));
	assert.ok(kinds.includes('chooseResource'), 'gain 1 resource of choice');
	assert.deepEqual(state.seats[r.player - 1].civData.alchemists.marked, []);
	assert.deepEqual(
		track(state, r.player, 'technology'),
		[1],
		'no advance after a bust'
	);
});

test('Alchemists score 5 VP for a track whose tokens are all on 12', () => {
	const random = scripted(['technology']);
	const r = incomeTurn(
		'alchemists',
		1,
		(seat) => {
			seat.tracks.technology = [12];
		},
		{ random }
	);
	const mark = r.state.seq;
	const state = answer(r.state, r.random, r.player, 'chooseAlchemists', {
		roll: false,
	});
	assert.deepEqual(
		eventsOf(state, 'vpGained', mark)
			.filter((e) => e.player === r.player)
			.map((e) => e.vp)
			.slice(0, 1),
		[5]
	);

	// A blocked track gives nothing.
	const blocked = incomeTurn(
		'alchemists',
		1,
		(seat, s) => {
			seat.tracks.technology = [12];
			s.blocks.push({ player: 1, track: 'technology' });
		},
		{ random: scripted(['technology']) }
	);
	const mark2 = blocked.state.seq;
	const after = answer(
		blocked.state,
		blocked.random,
		blocked.player,
		'chooseAlchemists',
		{ roll: false }
	);
	assert.ok(
		!eventsOf(after, 'vpGained', mark2).some(
			(e) => e.player === blocked.player && e.vp === 5
		)
	);
});

test('Alchemists gain 1 resource and 10 VP at setup only in the current version', () => {
	for (const version of VERSIONS) {
		const { state } = startedGame(2, {
			civs: ['alchemists', 'nomads'],
			version,
		});
		const base = startedGame(2, {
			civs: ['leaders', 'nomads'],
			version,
		}).state;
		assert.equal(
			state.seats[0].vp - base.seats[0].vp,
			version === 'current' ? 10 : 0,
			version
		);
		const sum = (/** @type {any} */ s) =>
			Object.values(s.resources).reduce(
				(a, n) => /** @type {number} */ (a) + /** @type {number} */ (n),
				0
			);
		assert.equal(
			/** @type {number} */ (sum(state.seats[0])) -
				/** @type {number} */ (sum(base.seats[0])),
			version === 'current' ? 1 : 0,
			version
		);
	}
});

test('default answers to every Alchemists decision end the activation', () => {
	const r = incomeTurn('alchemists', 1, () => {}, {
		random: seededRandom(3),
	});
	const state = answerDefaults(r.state, r.random);
	assert.deepEqual(state.seats[r.player - 1].civData.alchemists.marked, []);
});
