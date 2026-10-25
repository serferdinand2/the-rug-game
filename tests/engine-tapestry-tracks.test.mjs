// Tests for the tapestry cards that move tokens, and the science roll Empiricism doubles (#19, design §8, §10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { play } from '../src/lib/engine/play.js';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run, resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { advanceBlocked } from '../src/lib/engine/abilities.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { startedGame, answer, resolveTapestry } from './helpers/engine.mjs';

/**
 * A started game for `count` players, copied so a test may change it.
 * @param {number} [count]
 */
function game(count = 2) {
	const { state, random } = startedGame(count);
	return { state: structuredClone(state), random };
}

/**
 * A random that returns the given numbers in turn: science die faces 0 to 3 are exploration, science, technology and military.
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

/**
 * The events of one type, without their numbers.
 * @param {any} state
 * @param {string} type
 */
const eventsOf = (state, type) =>
	state.events
		.filter((/** @type {any} */ e) => e.type === type)
		.map(({ seq: _seq, ...e }) => e);

/**
 * Each token move as [player, track, from, to].
 * @param {any} state
 */
const moves = (state) =>
	eventsOf(state, 'tokenMoved').map((e) => [e.player, e.track, e.from, e.to]);

/**
 * The decisions open besides the turn choice every started game has.
 * @param {any} state
 */
const questions = (state) =>
	openDecisions(state).filter((d) => d.kind !== 'chooseTurn');

/** @param {any} state @param {string} kind */
const open = (state, kind) =>
	/** @type {any} */ (openDecisions(state).find((d) => d.kind === kind));

/**
 * Answers every open question until only the turn choice is left: with `pick` when it returns an answer, otherwise the first answer.
 * @param {any} state
 * @param {any} random
 * @param {(decision: any) => Record<string, any> | undefined} [pick]
 */
function settle(state, random, pick = () => undefined) {
	for (let step = 0; step < 100; step++) {
		const [next] = questions(state);
		if (!next) {
			return state;
		}
		const chosen =
			pick(next) ?? DECISIONS[next.kind].answers(state, next)[0];
		state = play(
			state,
			next.player,
			{ decision: next.id, ...chosen },
			random
		);
	}
	throw new Error('A decision never ended.');
}

/**
 * Ends a seat's turn on a copy of the state, and runs until the next seat's turn choice.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 */
function endTurnOf(state, random, player) {
	const next = structuredClone(state);
	next.pending.length = 0;
	push(next, next.pending, [{ player, kind: 'endTurn' }]);
	run(next, random);
	return next;
}

const PLENTY = { coin: 3, worker: 3, food: 3, culture: 3 };

test('Age of Discovery: the player advances with the benefit, then every opponent clockwise advances without it', () => {
	const { state } = game(3);
	// Face 0 is exploration; Scouting gives 2 territory tiles.
	const next = resolveTapestry(state, rolls(0), 2, 'age-of-discovery');
	assert.deepEqual(eventsOf(next, 'scienceDieRolled'), [
		{ type: 'scienceDieRolled', player: 2, track: 'exploration' },
	]);
	assert.deepEqual(moves(next), [
		[2, 'exploration', 0, 1],
		[3, 'exploration', 0, 1],
		[1, 'exploration', 0, 1],
	]);
	assert.deepEqual(
		next.seats.map((/** @type {any} */ s) => s.territoryTiles.length),
		[0, 2, 0]
	);
	assert.deepEqual(
		eventsOf(next, 'spaceActivated').map((e) => e.player),
		[2]
	);
	assert.deepEqual(questions(next), []);
});

test('Age of Discovery: opponents gain landmarks in turn order', () => {
	const { state } = game(3);
	state.seats[1].tracks.exploration = [4];
	state.seats[2].tracks.exploration = [3];
	state.seats[0].tracks.exploration = [3];
	const random = rolls(0);
	let next = resolveTapestry(state, random, 2, 'age-of-discovery');
	// Seat 3 is next clockwise from seat 2, so it reaches the lighthouse first.
	assert.deepEqual(
		questions(next).map((d) => [d.kind, d.player, d.landmark]),
		[['choosePlacement', 3, 'lighthouse']]
	);
	next = settle(next, random);
	assert.deepEqual(moves(next), [
		[2, 'exploration', 4, 5],
		[3, 'exploration', 3, 4],
		[1, 'exploration', 3, 4],
	]);
	assert.deepEqual(eventsOf(next, 'landmarkGained'), [
		{
			type: 'landmarkGained',
			player: 3,
			landmark: 'lighthouse',
			track: 'exploration',
		},
	]);
});

test('Age of Discovery skips finished and blocked players', () => {
	const { state } = game(3);
	state.seats[0].tracks.science = [1];
	state.seats[1].finished = true;
	state.seats[2].era = { card: 'theocracy', ability: 'theocracy' };
	// Face 1 is science; Mathematics gives a tapestry card.
	const next = resolveTapestry(state, rolls(1), 1, 'age-of-discovery');
	assert.deepEqual(moves(next), [[1, 'science', 1, 2]]);
	assert.equal(next.seats[0].hand.length, 1);
	assert.deepEqual(questions(next), []);
});

test('Oil Magnate lets the player and each neighbour decline', () => {
	const { state, random } = game(3);
	let next = resolveTapestry(state, random, 1, 'oil-magnate');
	const track = open(next, 'chooseTrack');
	assert.deepEqual(
		[track.player, track.purpose, track.options],
		[1, 'sharedAdvance', [...TRACK_IDS]]
	);
	assert.throws(
		() => answer(next, random, 1, 'chooseTrack', { track: 'arts' }),
		{
			name: 'PlayerError',
			message: 'Choose one of the tracks offered.',
		}
	);
	next = answer(next, random, 1, 'chooseTrack', { track: 'technology' });
	/** @type {[number, boolean, boolean][]} */
	const asked = [];
	for (let step = 0; step < 3; step++) {
		const move = open(next, 'chooseMove');
		asked.push([move.player, move.benefit, move.optional]);
		next = answer(next, random, move.player, 'chooseMove', { track: null });
	}
	// The player, then the right neighbour, then the left one.
	assert.deepEqual(asked, [
		[1, true, true],
		[3, false, true],
		[2, false, true],
	]);
	assert.deepEqual(moves(next), []);
	assert.deepEqual(questions(next), []);
});

test('Oil Magnate gives only its player the benefit and bonus', () => {
	const { state, random } = game(2);
	for (const seat of state.seats) {
		seat.tracks.technology = [1];
		seat.resources = { ...PLENTY };
	}
	let next = resolveTapestry(state, random, 1, 'oil-magnate');
	next = answer(next, random, 1, 'chooseTrack', { track: 'technology' });
	next = answer(next, random, 1, 'chooseMove', {
		track: 'technology',
		from: 1,
	});
	// Carpentry: a tapestry card, then the market bonus.
	assert.equal(next.seats[0].hand.length, 1);
	assert.deepEqual(
		questions(next).map((d) => [d.kind, d.player]),
		[['chooseBonus', 1]]
	);
	next = answer(next, random, 1, 'chooseBonus', { pay: null });
	const move = open(next, 'chooseMove');
	assert.deepEqual([move.player, move.benefit], [2, false]);
	next = answer(next, random, 2, 'chooseMove', {
		track: 'technology',
		from: 1,
	});
	assert.deepEqual(next.seats[1].tracks.technology, [2]);
	assert.equal(next.seats[1].hand.length, 0);
	assert.deepEqual(questions(next), []);
	assert.deepEqual(
		eventsOf(next, 'spaceActivated').map((e) => e.player),
		[1]
	);
});

test('Dark Ages regresses the other three tracks without benefit, then advances 3 on the chosen track, gaining landmarks', () => {
	const { state, random } = game(2);
	Object.assign(state.seats[0].tracks, {
		exploration: [2],
		science: [3],
		technology: [2],
	});
	let next = resolveTapestry(state, random, 1, 'dark-ages');
	const track = open(next, 'chooseTrack');
	assert.deepEqual(
		[track.purpose, track.options],
		['darkAges', [...TRACK_IDS]]
	);
	next = answer(next, random, 1, 'chooseTrack', { track: 'technology' });
	assert.deepEqual(
		questions(next).map((d) => [d.kind, d.landmark]),
		[['choosePlacement', 'forge']]
	);
	next = settle(next, random);
	assert.deepEqual(moves(next), [
		[1, 'exploration', 2, 1],
		[1, 'science', 3, 2],
		[1, 'technology', 2, 3],
		[1, 'technology', 3, 4],
		[1, 'technology', 4, 5],
	]);
	assert.deepEqual(next.seats[0].tracks.military, [0]);
	assert.deepEqual(
		eventsOf(next, 'landmarkGained').map((e) => e.landmark),
		['forge']
	);
	assert.deepEqual(eventsOf(next, 'spaceActivated'), []);
});

test('Dark Ages offers no blocked track while another can advance', () => {
	const { state, random } = game(2);
	state.blocks = [{ player: 2, track: 'military' }];
	const next = resolveTapestry(state, random, 1, 'dark-ages');
	assert.deepEqual(open(next, 'chooseTrack').options, [
		'exploration',
		'science',
		'technology',
	]);
	// With one track left to advance on, it is taken without asking.
	Object.assign(state.seats[0].tracks, {
		exploration: [12],
		science: [12],
		technology: [4],
		military: [3],
	});
	const lone = resolveTapestry(state, random, 1, 'dark-ages');
	assert.equal(open(lone, 'chooseTrack'), undefined);
	assert.deepEqual(moves(lone), [
		[1, 'exploration', 12, 11],
		[1, 'science', 12, 11],
		[1, 'military', 3, 2],
		[1, 'technology', 4, 5],
		[1, 'technology', 5, 6],
		[1, 'technology', 6, 7],
	]);
	// With nowhere to advance, every track holding a token is offered, the blocked one too.
	Object.assign(state.seats[0].tracks, {
		exploration: [12],
		science: [12],
		technology: [12],
		military: [3],
	});
	let stuck = resolveTapestry(state, random, 1, 'dark-ages');
	assert.deepEqual(open(stuck, 'chooseTrack').options, [...TRACK_IDS]);
	stuck = answer(stuck, random, 1, 'chooseTrack', { track: 'military' });
	assert.deepEqual(moves(stuck), [
		[1, 'exploration', 12, 11],
		[1, 'science', 12, 11],
		[1, 'technology', 12, 11],
	]);
	assert.deepEqual(stuck.seats[0].tracks.military, [3]);
	assert.deepEqual(questions(stuck), []);
});

/**
 * A 3-player game where seat 1 can jump forward on exploration (to seat 3's 7) and back on technology (to seat 3's 3).
 */
function socialismGame() {
	const { state, random } = game(3);
	Object.assign(state.seats[0].tracks, { exploration: [2], technology: [5] });
	Object.assign(state.seats[1].tracks, { exploration: [8], technology: [1] });
	Object.assign(state.seats[2].tracks, { exploration: [7], technology: [3] });
	return { state, random };
}

test('Socialism jumps to the nearest opponent ahead or behind, gaining every landmark passed (R9)', () => {
	const { state, random } = socialismGame();
	const next = resolveTapestry(state, random, 1, 'socialism');
	const move = open(next, 'chooseMove');
	assert.deepEqual(
		[move.direction, move.benefit, move.optional],
		['jump', false, false]
	);
	assert.deepEqual(DECISIONS.chooseMove.answers(next, move), [
		{ track: 'exploration', from: 2, to: 7 },
		{ track: 'technology', from: 5, to: 3 },
	]);
	for (const wrong of [
		{ track: 'exploration', from: 2, to: 8 },
		{ track: 'exploration', from: 2 },
	]) {
		assert.throws(
			() => answer(next, random, 1, 'chooseMove', wrong),
			{ name: 'PlayerError' },
			JSON.stringify(wrong)
		);
	}
	const ahead = settle(
		answer(next, random, 1, 'chooseMove', {
			track: 'exploration',
			from: 2,
			to: 7,
		}),
		random
	);
	assert.deepEqual(ahead.seats[0].tracks.exploration, [7]);
	assert.deepEqual(
		eventsOf(ahead, 'landmarkGained').map((e) => e.landmark),
		['lighthouse', 'train-station']
	);
	assert.deepEqual(eventsOf(ahead, 'spaceActivated'), []);
	const behind = answer(next, random, 1, 'chooseMove', {
		track: 'technology',
		from: 5,
		to: 3,
	});
	assert.deepEqual(behind.seats[0].tracks.technology, [3]);
	assert.deepEqual(eventsOf(behind, 'landmarkGained'), []);
	assert.deepEqual(eventsOf(behind, 'spaceActivated'), []);
	assert.deepEqual(questions(behind), []);
});

test('Socialism offers no forward jump on a blocked track', () => {
	const { state, random } = socialismGame();
	state.blocks = [{ player: 2, track: 'exploration' }];
	// Only the jump back is left, so it is made without asking.
	const next = resolveTapestry(state, random, 1, 'socialism');
	assert.deepEqual(questions(next), []);
	assert.deepEqual(moves(next), [[1, 'technology', 5, 3]]);
	assert.deepEqual(next.seats[0].tracks.exploration, [2]);
	// With no opponent token ahead or behind, nothing moves.
	const { state: level } = game(3);
	const none = resolveTapestry(level, random, 1, 'socialism');
	assert.deepEqual(moves(none), []);
	assert.deepEqual(eventsOf(none, 'noMove'), [{ type: 'noMove', player: 1 }]);
});

test('Dictatorship advances with the benefit and blocks opponents on that track until turn order returns (R26)', () => {
	const { state, random } = game(2);
	let next = resolveTapestry(state, random, 1, 'dictatorship');
	const track = open(next, 'chooseTrack');
	assert.deepEqual(
		[track.purpose, track.options],
		['dictatorship', [...TRACK_IDS]]
	);
	next = answer(next, random, 1, 'chooseTrack', { track: 'exploration' });
	assert.deepEqual(next.blocks, [{ player: 1, track: 'exploration' }]);
	assert.deepEqual(eventsOf(next, 'trackBlocked'), [
		{ type: 'trackBlocked', player: 1, track: 'exploration' },
	]);
	// Scouting's benefit: 2 territory tiles.
	assert.deepEqual(next.seats[0].tracks.exploration, [1]);
	assert.equal(next.seats[0].territoryTiles.length, 2);
	assert.equal(advanceBlocked(next, 2, 'exploration'), true);
	assert.equal(advanceBlocked(next, 1, 'exploration'), false);
	const second = endTurnOf(next, random, 1);
	assert.equal(second.current, 2);
	assert.equal(advanceBlocked(second, 2, 'exploration'), true);
	const first = endTurnOf(second, random, 2);
	assert.equal(first.current, 1);
	assert.deepEqual(first.blocks, []);
	assert.equal(advanceBlocked(first, 2, 'exploration'), false);
	// With no track to advance on, nothing is blocked.
	for (const id of TRACK_IDS) {
		state.seats[0].tracks[id] = [12];
	}
	const none = resolveTapestry(state, random, 1, 'dictatorship');
	assert.deepEqual(none.blocks, []);
	assert.deepEqual(eventsOf(none, 'noMove'), [{ type: 'noMove', player: 1 }]);
});

test('Renaissance lets the player order the four advances, gains landmarks and offers each bonus for free', () => {
	const { state, random } = game(2);
	// Rafts, Carpentry and Bladed Weapons have bonuses; Medicine has the apothecary. Seat 1 holds no resources.
	Object.assign(state.seats[0].tracks, {
		exploration: [1],
		science: [3],
		technology: [1],
		military: [1],
	});
	let next = resolveTapestry(state, random, 1, 'renaissance');
	assert.equal(open(next, 'chooseOrder').effects.length, 4);
	// Military first, then the rest in order.
	next = answer(next, random, 1, 'chooseOrder', { effect: 3 });
	/** @type {any[]} */
	const offered = [];
	next = settle(next, random, (decision) => {
		if (decision.kind === 'chooseBonus') {
			offered.push([decision.track, decision.space, decision.cost]);
			return { pay: {} };
		}
		return undefined;
	});
	assert.deepEqual(offered, [
		['military', 2, {}],
		['exploration', 2, {}],
		['technology', 2, {}],
	]);
	assert.deepEqual(
		TRACK_IDS.map((id) => next.seats[0].tracks[id]),
		[[2], [4], [2], [2]]
	);
	assert.deepEqual(
		eventsOf(next, 'landmarkGained').map((e) => e.landmark),
		['apothecary']
	);
	// No benefit: nothing is activated with an event, but the spaces whose bonus was offered count as activated (R19).
	assert.deepEqual(eventsOf(next, 'spaceActivated'), []);
	assert.deepEqual(next.activated, [
		{ player: 1, track: 'military', space: 2 },
		{ player: 1, track: 'exploration', space: 2 },
		{ player: 1, track: 'technology', space: 2 },
	]);
	// The bonuses: a tapestry card, a market and an armory.
	assert.equal(next.seats[0].hand.length, 1);
	assert.deepEqual(
		next.seats[0].capital.buildings.map(
			(/** @type {any} */ b) => b.building
		),
		['armory', 'market']
	);
});

test('Renaissance offers no free bonus on a space activated this turn (R19)', () => {
	const { state, random } = game(2);
	Object.assign(state.seats[0].tracks, {
		exploration: [1],
		science: [12],
		technology: [12],
		military: [12],
	});
	state.activated = [{ player: 1, track: 'exploration', space: 2 }];
	/** @type {any[]} */
	const offered = [];
	const next = settle(
		resolveTapestry(state, random, 1, 'renaissance'),
		random,
		(decision) => {
			if (decision.kind === 'chooseBonus') {
				offered.push(decision);
			}
			return undefined;
		}
	);
	assert.deepEqual(next.seats[0].tracks.exploration, [2]);
	assert.deepEqual(offered, []);
});

/**
 * A 3-player game where seat 2 is on Carpentry and seat 3 on Bladed Weapons, both spaces with a tapestry card and a bonus.
 */
function tradeGame() {
	const { state, random } = game(3);
	state.seats[1].tracks.technology = [2];
	state.seats[2].tracks.military = [2];
	return { state, random };
}

test("Trade Economy gains an opponent's space benefit and offers the owner its bonus for free", () => {
	const { state, random } = tradeGame();
	const next = resolveTapestry(state, random, 1, 'trade-economy');
	const space = open(next, 'chooseSpace');
	assert.deepEqual(space.options, [
		{ player: 2, track: 'technology', space: 2 },
		{ player: 3, track: 'military', space: 2 },
	]);
	assert.throws(
		() =>
			answer(next, random, 1, 'chooseSpace', {
				player: 2,
				track: 'military',
				space: 2,
			}),
		{ name: 'PlayerError', message: 'Choose one of the spaces offered.' }
	);
	const traded = answer(next, random, 1, 'chooseSpace', {
		player: 2,
		track: 'technology',
		space: 2,
	});
	assert.equal(traded.seats[0].hand.length, 1);
	assert.equal(traded.seats[1].hand.length, 0);
	assert.deepEqual(eventsOf(traded, 'spaceActivated'), [
		{ type: 'spaceActivated', player: 1, track: 'technology', space: 2 },
	]);
	assert.deepEqual(traded.activated, [
		{ player: 1, track: 'technology', space: 2 },
	]);
	// The owner may take the market bonus without paying; the player is offered nothing.
	const bonus = open(traded, 'chooseBonus');
	assert.deepEqual(
		[bonus.player, bonus.track, bonus.space, bonus.cost],
		[2, 'technology', 2, {}]
	);
	assert.deepEqual(
		questions(traded).map((d) => [d.kind, d.player]),
		[['chooseBonus', 2]]
	);
	const taken = settle(
		answer(traded, random, 2, 'chooseBonus', { pay: {} }),
		random
	);
	assert.deepEqual(
		taken.seats[1].capital.buildings.map(
			(/** @type {any} */ b) => b.building
		),
		['market']
	);
	// An owner who has finished gains nothing (01 §4.3).
	state.seats[1].finished = true;
	const finished = answer(
		resolveTapestry(state, random, 1, 'trade-economy'),
		random,
		1,
		'chooseSpace',
		{ player: 2, track: 'technology', space: 2 }
	);
	assert.equal(finished.seats[0].hand.length, 1);
	assert.deepEqual(questions(finished), []);
});

test('Trade Economy leaves out spaces the player activated this turn (R19)', () => {
	const { state, random } = tradeGame();
	state.activated = [{ player: 1, track: 'technology', space: 2 }];
	// Only seat 3's Bladed Weapons is left, so it is taken without asking.
	const next = resolveTapestry(state, random, 1, 'trade-economy');
	assert.equal(open(next, 'chooseSpace'), undefined);
	assert.equal(next.seats[0].hand.length, 1);
	assert.deepEqual(
		questions(next).map((d) => [d.kind, d.player, d.track, d.cost]),
		[['chooseBonus', 3, 'military', {}]]
	);
});

test('Empiricism rolls the science die twice and the player chooses one result', () => {
	const { state } = game(2);
	state.seats[0].era = { card: 'empiricism', ability: 'empiricism' };
	const random = rolls(0, 2);
	const choosing = resolveEffects(state, 1, [{ research: {} }], random);
	assert.deepEqual(
		eventsOf(choosing, 'scienceDieRolled').map((e) => e.track),
		['exploration', 'technology']
	);
	const roll = open(choosing, 'chooseRoll');
	assert.deepEqual(roll.options, ['exploration', 'technology']);
	assert.deepEqual(DECISIONS.chooseRoll.answers(choosing, roll), [
		{ track: 'exploration' },
		{ track: 'technology' },
	]);
	assert.throws(
		() => answer(choosing, random, 1, 'chooseRoll', { track: 'science' }),
		{ name: 'PlayerError', message: 'Choose one of the two results.' }
	);
	const chosen = answer(choosing, random, 1, 'chooseRoll', {
		track: 'technology',
	});
	assert.deepEqual(open(chosen, 'chooseMove').options, [
		{ track: 'technology', from: 0 },
	]);
	// The same face twice needs no choice.
	const same = resolveEffects(state, 1, [{ research: {} }], rolls(1, 1));
	assert.equal(open(same, 'chooseRoll'), undefined);
	assert.deepEqual(open(same, 'chooseMove').options, [
		{ track: 'science', from: 0 },
	]);
});

test('Trade Economy with no space to take does nothing and says so', () => {
	const { state, random } = game(3);
	const next = resolveTapestry(state, random, 1, 'trade-economy');
	assert.equal(open(next, 'chooseSpace'), undefined);
	assert.deepEqual(eventsOf(next, 'noMove'), [{ type: 'noMove', player: 1 }]);
});
