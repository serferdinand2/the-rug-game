// Tests for the simpler WHEN PLAYED tapestry cards (#19, design §8).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { play } from '../src/lib/engine/play.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
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
 * Shows these cards face up, taking them out of the deck.
 * @param {any} state
 * @param {string[]} cards
 */
function showing(state, cards) {
	const { tech } = state.supply;
	tech.deck = tech.deck.filter(
		(/** @type {string} */ c) => !cards.includes(c)
	);
	tech.faceUp = [...cards];
}

/** @param {any} state @param {number} seat */
const piece = (state, seat, landmark = 'lighthouse') =>
	state.seats[seat - 1].capital.landmarks.push({
		landmark,
		row: 0,
		col: 0,
		rotation: 0,
	});

/** @param {any} state @param {string} type @param {number} [from] */
const eventsOf = (state, type, from = 0) =>
	state.events.slice(from).filter((/** @type {any} */ e) => e.type === type);

/**
 * The decisions open besides the turn choice every started game has.
 * @param {any} state
 */
const questions = (state) =>
	openDecisions(state).filter((d) => d.kind !== 'chooseTurn');

/**
 * Answers every open question with its first answer until only the turn choice is left.
 * @param {any} state
 * @param {any} random
 */
function settle(state, random) {
	for (let step = 0; step < 100; step++) {
		const [next] = questions(state);
		if (!next) {
			return state;
		}
		const [first] = DECISIONS[next.kind].answers(state, next);
		state = play(
			state,
			next.player,
			{ decision: next.id, ...first },
			random
		);
	}
	throw new Error('A decision never ended.');
}

/** @param {any} state @param {string} kind */
const open = (state, kind) => openDecisions(state).find((d) => d.kind === kind);

test('Meritocracy invents a card, then scores 2 VP per tech card', () => {
	const { state, random } = game();
	state.seats[0].tech.bottom = ['ammonia', 'anesthesia'];
	showing(state, ['the-nail', 'eyeglasses', 'com-tower']);
	let next = resolveTapestry(state, random, 1, 'meritocracy');
	next = answer(next, random, 1, 'chooseInvent', { card: 'the-nail' });
	assert.equal(next.seats[0].tech.bottom.length, 3);
	assert.equal(next.seats[0].vp, 6);
});

test('Boast of Superiority scores 4 VP per track where nobody is ahead', () => {
	const { state, random } = game();
	state.seats[0].tracks.science = [3];
	state.seats[1].tracks.science = [5];
	state.seats[1].tracks.military = [2];
	const next = resolveTapestry(state, random, 1, 'boast-of-superiority');
	// Exploration and technology are tied; science and military are behind.
	assert.equal(next.seats[0].vp, 8);
});

test('Feudalism offers 1 resource or 3 VP per landmark', () => {
	const { state, random } = game();
	piece(state, 1);
	piece(state, 1, 'forge');
	const next = resolveTapestry(state, random, 1, 'feudalism');
	const choice = /** @type {any} */ (open(next, 'chooseOption'));
	assert.equal(choice.options.length, 2);
	const vp = answer(next, random, 1, 'chooseOption', { option: 1 });
	assert.equal(vp.seats[0].vp, 6);
	const resource = answer(next, random, 1, 'chooseOption', { option: 0 });
	assert.equal(
		/** @type {any} */ (open(resource, 'chooseResource')).count,
		1
	);
});

test('Technocracy invents and upgrades for the first player into the era', () => {
	const { state, random } = game();
	state.seats[0].incomeTurns = 2;
	state.seats[1].incomeTurns = 1;
	showing(state, ['air-conditioning', 'eyeglasses', 'com-tower']);
	let next = resolveTapestry(state, random, 1, 'technocracy');
	next = answer(next, random, 1, 'chooseInvent', {
		card: 'air-conditioning',
	});
	assert.deepEqual(next.seats[0].tech.middle, ['air-conditioning']);
	assert.deepEqual(next.seats[0].tech.bottom, []);
	// Its circle ran: 1 worker.
	assert.equal(next.seats[0].resources.worker, 1);
});

test('Technocracy gives 3 VP per opponent when someone else is already in the era', () => {
	const { state, random } = game(3);
	state.seats[0].incomeTurns = 2;
	state.seats[1].incomeTurns = 2;
	const next = resolveTapestry(state, random, 1, 'technocracy');
	assert.equal(next.seats[0].vp, 6);
	assert.equal(questions(next).length, 0);
});

test('Steam Tycoon invents a face-up card and upgrades it, then the neighbours draw from the deck, right then left', () => {
	const { state, random } = game(3);
	showing(state, ['air-conditioning', 'eyeglasses', 'com-tower']);
	let next = resolveTapestry(state, random, 1, 'steam-tycoon');
	// Only the face-up cards are offered: no deck, no refresh.
	const decision = /** @type {any} */ (open(next, 'chooseInvent'));
	assert.deepEqual(DECISIONS.chooseInvent.answers(next, decision), [
		{ card: 'air-conditioning' },
		{ card: 'eyeglasses' },
		{ card: 'com-tower' },
	]);
	next = answer(next, random, 1, 'chooseInvent', {
		card: 'air-conditioning',
	});
	assert.deepEqual(next.seats[0].tech.middle, ['air-conditioning']);
	assert.equal(questions(next).length, 0);
	const invented = eventsOf(next, 'techInvented');
	assert.deepEqual(
		invented.map((e) => [e.player, e.from]),
		[
			[1, 'display'],
			[3, 'deck'],
			[2, 'deck'],
		]
	);
	assert.equal(next.seats[2].tech.bottom.length, 1);
	assert.equal(next.seats[1].tech.bottom.length, 1);
});

test('Steam Tycoon with an empty display invents nothing for its player', () => {
	const { state, random } = game(3);
	state.supply.tech.faceUp = [];
	const next = resolveTapestry(state, random, 1, 'steam-tycoon');
	assert.equal(eventsOf(next, 'noInvent')[0].player, 1);
	assert.deepEqual(
		eventsOf(next, 'techInvented').map((e) => e.player),
		[3, 2]
	);
	assert.equal(next.seats[0].tech.bottom.length, 0);
});

test('Plea for Aid pays 2 VP and 1 resource per track where everyone is ahead', () => {
	const { state, random } = game();
	state.seats[0].tracks.exploration = [1];
	state.seats[1].tracks.exploration = [3];
	state.seats[0].tracks.science = [0];
	state.seats[1].tracks.science = [2];
	// Technology ties and military is ahead of the other seat, so neither counts.
	state.seats[0].tracks.military = [4];
	const next = resolveTapestry(state, random, 1, 'plea-for-aid');
	assert.equal(next.seats[0].vp, 4);
	assert.equal(/** @type {any} */ (open(next, 'chooseResource')).count, 2);
});

test('Plea for Aid counts a restarted track as 12', () => {
	const { state, random } = game();
	state.seats[0].tracks.exploration = [5];
	state.seats[1].tracks.exploration = [];
	state.seats[1].restartedTracks = ['exploration'];
	const next = resolveTapestry(state, random, 1, 'plea-for-aid');
	assert.equal(next.seats[0].vp, 2);
});

test('Age of Wonders: fewest landmarks gain 2 resources, most gain 12 VP, ties gain 1 resource and 6 VP', () => {
	const fewest = game();
	piece(fewest.state, 2);
	const a = resolveTapestry(fewest.state, fewest.random, 1, 'age-of-wonders');
	assert.equal(/** @type {any} */ (open(a, 'chooseResource')).count, 2);
	assert.equal(a.seats[0].vp, 0);

	const most = game();
	piece(most.state, 1);
	const b = resolveTapestry(most.state, most.random, 1, 'age-of-wonders');
	assert.equal(b.seats[0].vp, 12);
	assert.equal(questions(b).length, 0);

	const tie = game();
	let c = resolveTapestry(tie.state, tie.random, 1, 'age-of-wonders');
	assert.equal(/** @type {any} */ (open(c, 'chooseResource')).count, 1);
	c = settle(c, tie.random);
	assert.equal(c.seats[0].vp, 6);
});

test('Diplomacy gives its player a building of their choice and every player a resource, skipping finished players', () => {
	const { state, random } = game(3);
	state.seats[2].finished = true;
	let next = resolveTapestry(state, random, 1, 'diplomacy');
	const choice = /** @type {any} */ (open(next, 'chooseOption'));
	assert.deepEqual(
		choice.options,
		['market', 'house', 'farm', 'armory'].map((b) => [{ building: b }])
	);
	next = answer(next, random, 1, 'chooseOption', { option: 2 });
	next = settle(next, random);
	assert.equal(eventsOf(next, 'buildingGained')[0].building, 'farm');
	assert.deepEqual(
		eventsOf(next, 'resourcesGained').map((e) => e.player),
		[1, 2]
	);
});

test('Diplomacy takes the only building left without asking, and says when none is left', () => {
	const one = game();
	one.state.seats[0].incomeMat.buildings = {
		market: 0,
		house: 0,
		farm: 1,
		armory: 0,
	};
	const a = resolveTapestry(one.state, one.random, 1, 'diplomacy');
	assert.equal(eventsOf(a, 'buildingGained')[0].building, 'farm');
	const none = game();
	none.state.seats[0].incomeMat.buildings = {
		market: 0,
		house: 0,
		farm: 0,
		armory: 0,
	};
	const b = resolveTapestry(none.state, none.random, 1, 'diplomacy');
	assert.equal(eventsOf(b, 'noBuildingLeft')[0].building, null);
});

test('Dystopia gains and places a track landmark nobody owns, and does nothing when none is left', () => {
	const { state, random } = game();
	let next = resolveTapestry(state, random, 1, 'dystopia');
	const choice = /** @type {any} */ (open(next, 'chooseLandmark'));
	assert.equal(choice.options.length, 12);
	assert.equal(choice.options[0], 'lighthouse');
	next = answer(next, random, 1, 'chooseLandmark', { landmark: 'forge' });
	next = settle(next, random);
	assert.ok(!next.landmarks.includes('forge'));
	assert.deepEqual(
		next.seats[0].capital.landmarks.map(
			(/** @type {any} */ p) => p.landmark
		),
		['forge']
	);

	const lone = game();
	lone.state.landmarks = ['lighthouse', 'bakery'];
	const one = resolveTapestry(lone.state, lone.random, 1, 'dystopia');
	assert.ok(!one.landmarks.includes('lighthouse'));
	assert.equal(eventsOf(one, 'landmarkGained')[0].landmark, 'lighthouse');

	const empty = game();
	empty.state.landmarks = ['bakery'];
	const none = resolveTapestry(empty.state, empty.random, 1, 'dystopia');
	assert.equal(eventsOf(none, 'noLandmarkLeft')[0].landmark, null);
	assert.deepEqual(none.landmarks, ['bakery']);
});

test('Democracy draws 3, then discards cards one at a time for 2 VP each', () => {
	const { state, random } = game();
	state.supply.tapestry.deck = ['a1', 'a2', 'a3', 'a4'];
	state.seats[0].hand = [];
	let next = resolveTapestry(state, random, 1, 'democracy');
	assert.equal(next.seats[0].hand.length, 3);
	next = answer(next, random, 1, 'chooseDiscard', { card: 'a1' });
	assert.equal(next.seats[0].vp, 2);
	assert.equal(/** @type {any} */ (open(next, 'chooseDiscard')).vpEach, 2);
	next = answer(next, random, 1, 'chooseDiscard', { card: 'a2' });
	next = answer(next, random, 1, 'chooseDiscard', { card: null });
	assert.equal(next.seats[0].vp, 4);
	assert.deepEqual(next.seats[0].hand, ['a3']);
	assert.deepEqual(next.supply.tapestry.discard.slice(-2), ['a1', 'a2']);
	assert.equal(questions(next).length, 0);
});

test('Democracy with no cards to draw still lets the player discard', () => {
	const { state, random } = game();
	state.supply.tapestry.deck = [];
	state.supply.tapestry.discard = [];
	state.seats[0].hand = ['trap-1'];
	let next = resolveTapestry(state, random, 1, 'democracy');
	assert.ok(open(next, 'chooseDiscard'));
	next = answer(next, random, 1, 'chooseDiscard', { card: 'trap-1' });
	assert.equal(next.seats[0].vp, 2);
	assert.equal(questions(next).length, 0);
});

test('chooseLandmark and chooseDiscard refuse an answer that was not offered', () => {
	const { state, random } = game();
	state.seats[0].hand = ['trap-1'];
	const landmark = resolveTapestry(state, random, 1, 'dystopia');
	assert.throws(
		() => answer(landmark, random, 1, 'chooseLandmark', { landmark: 'x' }),
		/Choose one of the landmarks offered\./
	);
	const discard = resolveTapestry(state, random, 1, 'democracy');
	assert.throws(
		() => answer(discard, random, 1, 'chooseDiscard', { card: 'x' }),
		/Discard a tapestry card from your hand, or stop\./
	);
});

test('Guilds makes its only affordable trade without asking', () => {
	const { state, random } = game();
	const seat = state.seats[0];
	seat.vp = 7;
	seat.resources = { coin: 0, worker: 0, food: 0, culture: 0 };
	let next = resolveTapestry(state, random, 1, 'guilds');
	assert.equal(open(next, 'chooseTrade'), undefined);
	assert.equal(eventsOf(next, 'tradeMade')[0].offer, 0);
	assert.equal(next.seats[0].vp, 2);
	next = answer(next, random, 1, 'chooseResource', {
		resources: { food: 1 },
	});
	assert.equal(next.seats[0].resources.food, 1);
});

test('Guilds offers only the trades the player can pay, when there is a choice', () => {
	const { state, random } = game();
	state.seats[0].vp = 0;
	state.seats[0].resources = { coin: 2, worker: 0, food: 0, culture: 0 };
	let next = resolveTapestry(state, random, 1, 'guilds');
	const trade = /** @type {any} */ (open(next, 'chooseTrade'));
	assert.equal(trade.offers.length, 6);
	assert.equal(trade.optional, false);
	assert.deepEqual(DECISIONS.chooseTrade.answers(next, trade), [
		{ offer: 3, pay: { coin: 1 } },
		{ offer: 4, pay: { coin: 2 } },
	]);
	assert.throws(
		() =>
			answer(next, random, 1, 'chooseTrade', {
				offer: 1,
				pay: { vp: 10 },
			}),
		/Choose one of the trades offered\./
	);
	assert.throws(
		() => answer(next, random, 1, 'chooseTrade', { offer: null }),
		/Choose one of the trades offered\./
	);
	assert.throws(
		() =>
			answer(next, random, 1, 'chooseTrade', {
				offer: 3,
				pay: { coin: 2 },
			}),
		/Pay exactly the cost\./
	);
	next = answer(next, random, 1, 'chooseTrade', {
		offer: 4,
		pay: { coin: 2 },
	});
	assert.equal(next.seats[0].vp, 10);
	assert.equal(next.seats[0].resources.coin, 0);
});

test('Guilds with nothing affordable does nothing', () => {
	const { state, random } = game();
	state.seats[0].vp = 0;
	state.seats[0].resources = { coin: 0, worker: 0, food: 0, culture: 0 };
	const next = resolveTapestry(state, random, 1, 'guilds');
	assert.equal(questions(next).length, 0);
	assert.equal(eventsOf(next, 'noTrade')[0].player, 1);
	assert.equal(eventsOf(next, 'tradeMade').length, 0);
});

/** @param {any} state @param {number[]} workers - Workers each seat holds */
function withWorkers(state, workers) {
	workers.forEach((n, i) => {
		state.seats[i].resources = { coin: 0, worker: n, food: 0, culture: 0 };
	});
}

test('Olympic Host asks each player with a worker in turn, the host first', () => {
	const { state, random } = game(3);
	withWorkers(state, [1, 0, 1]);
	let next = resolveTapestry(state, random, 1, 'olympic-host');
	let trade = /** @type {any} */ (open(next, 'chooseTrade'));
	assert.equal(trade.player, 1);
	assert.equal(trade.host, 1);
	assert.equal(trade.optional, true);
	assert.deepEqual(trade.offers, [
		{ pay: { worker: 1 }, gain: [{ vp: 10 }] },
	]);
	next = answer(next, random, 1, 'chooseTrade', {
		offer: 0,
		pay: { worker: 1 },
	});
	assert.equal(next.seats[0].vp, 10);
	// Seat 2 has no worker, so only seat 3 is asked.
	trade = /** @type {any} */ (open(next, 'chooseTrade'));
	assert.equal(trade.player, 3);
	assert.equal(eventsOf(next, 'noTrade')[0].player, 2);
});

test('Olympic Host gives a building when an opponent paid, and a coin when none did', () => {
	const paid = game();
	withWorkers(paid.state, [0, 1]);
	paid.state.seats[0].incomeMat.buildings = {
		market: 0,
		house: 0,
		farm: 1,
		armory: 0,
	};
	let next = resolveTapestry(paid.state, paid.random, 1, 'olympic-host');
	next = answer(next, paid.random, 2, 'chooseTrade', {
		offer: 0,
		pay: { worker: 1 },
	});
	assert.equal(next.seats[1].vp, 10);
	assert.equal(next.seats[0].vp, 0);
	assert.equal(eventsOf(next, 'buildingGained')[0].building, 'farm');
	assert.equal(next.seats[0].resources.coin, 0);

	const declined = game();
	withWorkers(declined.state, [1, 1]);
	next = resolveTapestry(declined.state, declined.random, 1, 'olympic-host');
	next = answer(next, declined.random, 1, 'chooseTrade', { offer: null });
	next = answer(next, declined.random, 2, 'chooseTrade', { offer: null });
	assert.equal(eventsOf(next, 'buildingGained').length, 0);
	assert.equal(next.seats[0].resources.coin, 1);

	// Only the host paying does not count as an opponent paying.
	const hostOnly = game();
	withWorkers(hostOnly.state, [1, 0]);
	next = resolveTapestry(hostOnly.state, hostOnly.random, 1, 'olympic-host');
	next = answer(next, hostOnly.random, 1, 'chooseTrade', {
		offer: 0,
		pay: { worker: 1 },
	});
	assert.equal(next.seats[0].resources.coin, 1);
	assert.equal(eventsOf(next, 'buildingGained').length, 0);
});

test('Olympic Host gives a coin when an opponent paid but no building is left', () => {
	const { state, random } = game();
	withWorkers(state, [0, 1]);
	state.seats[0].incomeMat.buildings = {
		market: 0,
		house: 0,
		farm: 0,
		armory: 0,
	};
	let next = resolveTapestry(state, random, 1, 'olympic-host');
	next = answer(next, random, 2, 'chooseTrade', {
		offer: 0,
		pay: { worker: 1 },
	});
	assert.equal(next.seats[0].resources.coin, 1);
	assert.equal(eventsOf(next, 'noBuildingLeft').length, 0);
});

test('Olympic Host skips finished players', () => {
	const { state, random } = game(3);
	withWorkers(state, [1, 1, 1]);
	state.seats[1].finished = true;
	let next = resolveTapestry(state, random, 1, 'olympic-host');
	next = answer(next, random, 1, 'chooseTrade', { offer: null });
	const trade = /** @type {any} */ (open(next, 'chooseTrade'));
	assert.equal(trade.player, 3);
	next = answer(next, random, 3, 'chooseTrade', { offer: null });
	assert.equal(questions(next).length, 0);
	assert.equal(next.seats[1].resources.worker, 1);
});
