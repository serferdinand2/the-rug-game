// Tests for all 48 track spaces, each reached by an advance turn, and for the landmark race (#14).
// Effects that later issues build are stood in for by stubHandoffs(), which records what each one is given.
import { buildingSpots } from '../src/lib/engine/city.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDecisions } from '../src/lib/engine/stack.js';
import { resolveEffects } from '../src/lib/engine/loop.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { view } from '../src/lib/engine/view.js';
import {
	readyTurn,
	answer,
	placeAll,
	stubHandoffs,
} from './helpers/engine.mjs';

/**
 * Advances the current player of a 2-player game onto a track space, from the space before it,
 * holding 2 of each resource; `fill` changes their seat (and the state) first.
 * @param {import('node:test').TestContext} t
 * @param {'exploration' | 'science' | 'technology' | 'military'} track
 * @param {number} space
 * @param {(seat: any, state: any) => void} [fill]
 */
function onto(t, track, space, fill = () => {}) {
	const handoffs = stubHandoffs();
	t.after(handoffs.restore);
	const ready = readyTurn(2, (seat, state) => {
		seat.tracks[track] = [space - 1];
		seat.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
		fill(seat, state);
	});
	const { random, player } = ready;
	const chosen = answer(ready.state, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	const [decision] = openDecisions(chosen);
	const move = DECISIONS.chooseAdvance
		.answers(chosen, decision)
		.find((a) => a.track === track && a.from === space - 1);
	const state = play(
		chosen,
		player,
		{ decision: decision.id, ...move },
		random
	);
	return {
		state,
		random,
		player,
		other: player === 1 ? 2 : 1,
		calls: handoffs.calls,
		seat: state.seats[player - 1],
	};
}

/**
 * The kinds of the open decisions.
 * @param {{ state: any }} result
 */
const open = ({ state }) => openDecisions(state).map((d) => d.kind);

/**
 * The stub calls as [kind, value] pairs.
 * @param {{ calls: any[] }} result
 */
const handed = ({ calls }) => calls.map((c) => [c.kind, c.value]);

/**
 * The buildings the player is being asked to place (#16).
 * @param {{ state: any }} result
 */
const placing = ({ state }) =>
	openDecisions(state)
		.filter((d) => d.kind === 'choosePlacement')
		.map((d) => d.building);

/**
 * The landmarks the player is being asked to place (#16).
 * @param {{ state: any }} result
 */
const landing = ({ state }) =>
	openDecisions(state)
		.filter((d) => d.kind === 'choosePlacement' && d.landmark)
		.map((d) => d.landmark);

/**
 * Places every open building or landmark on its first spot, so the rest of the benefit can run.
 * @param {any} result - Changed: its state becomes the new one
 */
function place(result) {
	result.state = placeAll(result.state, result.random);
	result.seat = result.state.seats[result.player - 1];
	return result;
}

/**
 * Answers the open decision of a kind for the player who advanced.
 * @param {any} result - Changed: its state becomes the new one
 * @param {string} kind
 * @param {Record<string, any>} reply
 */
function reply(result, kind, reply) {
	result.state = answer(
		result.state,
		result.random,
		result.player,
		kind,
		reply
	);
	result.seat = result.state.seats[result.player - 1];
	return result;
}

/**
 * Whether the turn has passed to the other player.
 * @param {any} result
 */
function passed(result) {
	return (
		result.state.current === result.other &&
		open(result).join() === 'chooseTurn'
	);
}

// Exploration (01 §3.2)

test('exploration 1 Scouting: 2 territory tiles', (t) => {
	const r = onto(t, 'exploration', 1);
	assert.equal(r.seat.territoryTiles.length, 2);
	assert.ok(passed(r));
});

test('exploration 2 Rafts: explore, then the bonus pays 1 any for a tapestry card', (t) => {
	const r = onto(t, 'exploration', 2);
	assert.deepEqual(handed(r), [['explore', {}]]);
	reply(r, 'chooseBonus', { pay: { worker: 1 } });
	assert.equal(r.seat.hand.length, 1);
	assert.ok(passed(r));
});

test('exploration 3 Wagons: explore or a farm', (t) => {
	const r = onto(t, 'exploration', 3);
	assert.deepEqual(open(r), ['chooseOption']);
	reply(r, 'chooseOption', { option: 1 });
	assert.deepEqual(placing(r), ['farm']);
	assert.equal(r.seat.incomeMat.buildings.farm, 4);
	place(r);
	assert.equal(r.seat.capital.buildings.length, 1);
});

test('exploration 4 Navigation: the Lighthouse first, then 1 territory tile, then explore', (t) => {
	const r = onto(t, 'exploration', 4);
	assert.deepEqual(landing(r), ['lighthouse']);
	place(r);
	assert.deepEqual(handed(r), [['explore', {}]]);
	assert.equal(r.seat.territoryTiles.length, 1);
	assert.ok(passed(r));
});

test('exploration 5 Ships: 1 VP per territory controlled; the bonus pays for a farm', (t) => {
	const r = onto(t, 'exploration', 5);
	assert.equal(r.seat.vp, 1, 'the start territory');
	reply(r, 'chooseBonus', { pay: { coin: 1 } });
	assert.deepEqual(placing(r), ['farm']);
});

test('exploration 6 Tunnels: 1 territory tile and a farm; the bonus pays to explore', (t) => {
	const r = onto(t, 'exploration', 6);
	assert.equal(r.seat.territoryTiles.length, 1);
	assert.deepEqual(placing(r), ['farm']);
	assert.deepEqual(handed(r), []);
	place(r);
	reply(r, 'chooseBonus', { pay: { coin: 1 } });
	assert.deepEqual(handed(r), [['explore', {}]]);
});

test('exploration 7 Trains: the Train Station, then 2 territory tiles, then explore', (t) => {
	const r = onto(t, 'exploration', 7);
	assert.deepEqual(landing(r), ['train-station']);
	place(r);
	assert.deepEqual(handed(r), [['explore', {}]]);
	assert.equal(r.seat.territoryTiles.length, 2);
});

test('exploration 8 Cars: a farm, then 1 VP per farm; the bonus discards 2 territory tiles for 5 VP', (t) => {
	const r = onto(t, 'exploration', 8, (seat) => {
		seat.territoryTiles = [1, 2];
	});
	assert.deepEqual(placing(r), ['farm']);
	place(r);
	assert.equal(r.seat.vp, 1);
	reply(r, 'chooseBonus', { pay: { territory: [1, 2] } });
	assert.equal(r.seat.vp, 6);
	assert.deepEqual(r.seat.territoryTiles, []);
});

test('exploration 9 Airplanes: 2 territory tiles, then explore anywhere; the bonus pays for a tapestry card', (t) => {
	const r = onto(t, 'exploration', 9);
	assert.equal(r.seat.territoryTiles.length, 2);
	assert.deepEqual(handed(r), [['explore', { anywhere: true }]]);
	assert.deepEqual(open(r), ['chooseBonus']);
});

test('exploration 10 Space Shuttle: the Launch Pad, 1 VP per technology space; the bonus discards 3 territory tiles for 10 VP', (t) => {
	const r = onto(t, 'exploration', 10, (seat) => {
		seat.tracks.technology = [5];
		seat.territoryTiles = [1, 2, 3];
	});
	assert.deepEqual(landing(r), ['launch-pad']);
	place(r);
	assert.equal(r.seat.vp, 5);
	reply(r, 'chooseBonus', { pay: { territory: [1, 2, 3] } });
	assert.equal(r.seat.vp, 15);
});

test('exploration 11 Interstellar Travel: 3 space tiles, then explore one of them (R105)', (t) => {
	const r = onto(t, 'exploration', 11);
	assert.equal(r.seat.spaceTiles.length, 3);
	assert.deepEqual(handed(r), [['exploreSpace', { fromGained: true }]]);
	assert.ok(passed(r));
});

test('exploration 12 Warpgates: explore a space tile; the bonus pays to explore another', (t) => {
	const r = onto(t, 'exploration', 12);
	reply(r, 'chooseBonus', { pay: { coin: 1 } });
	assert.deepEqual(handed(r), [
		['exploreSpace', {}],
		['exploreSpace', {}],
	]);
});

// Science (01 §3.3)

test('science 1 Astronomy: research with the X', (t) => {
	const r = onto(t, 'science', 1);
	const [move] = openDecisions(r.state);
	assert.deepEqual(
		[move.kind, move.benefit, move.optional],
		['chooseMove', false, true]
	);
	assert.ok(r.state.events.some((e) => e.type === 'scienceDieRolled'));
});

test('science 2 Mathematics: a tapestry card; the bonus pays for a house', (t) => {
	const r = onto(t, 'science', 2);
	assert.equal(r.seat.hand.length, 1);
	reply(r, 'chooseBonus', { pay: { coin: 1 } });
	assert.deepEqual(placing(r), ['house']);
});

test('science 3 Herbalism: research with the X, or a house', (t) => {
	const r = onto(t, 'science', 3);
	const [choice] = openDecisions(r.state);
	assert.deepEqual(choice.options, [
		[{ research: { noBenefit: true } }],
		[{ building: 'house' }],
	]);
});

test('science 4 Medicine: the Apothecary, 1 VP per tech card and a tapestry card', (t) => {
	const r = onto(t, 'science', 4, (seat) => {
		seat.tech.bottom = ['pottery', 'clocks'];
	});
	assert.deepEqual(landing(r), ['apothecary']);
	place(r);
	assert.equal(r.seat.vp, 2);
	assert.equal(r.seat.hand.length, 1);
	assert.ok(passed(r));
});

test('science 5 Chemistry: research with benefit; the bonus discards 2 tapestry cards for 5 VP', (t) => {
	const r = onto(t, 'science', 5, (seat) => {
		seat.hand = ['trap-1', 'trap-2'];
	});
	const [move] = openDecisions(r.state);
	assert.equal(move.benefit, true);
	reply(r, 'chooseMove', { track: null });
	reply(r, 'chooseBonus', { pay: { tapestry: ['trap-1', 'trap-2'] } });
	assert.equal(r.seat.vp, 5);
	assert.deepEqual(r.seat.hand, []);
});

test('science 6 Biology: research with benefit, or a house', (t) => {
	const r = onto(t, 'science', 6);
	const [choice] = openDecisions(r.state);
	assert.deepEqual(choice.options, [
		[{ research: {} }],
		[{ building: 'house' }],
	]);
});

test('science 7 Academic Research: the Academy, then repeat another current space', (t) => {
	const r = onto(t, 'science', 7, (seat) => {
		seat.tracks.exploration = [1];
	});
	assert.deepEqual(landing(r), ['academy']);
	place(r);
	// Scouting is the only other space to repeat, so it runs without asking.
	assert.equal(r.seat.territoryTiles.length, 2);
	assert.ok(passed(r));
});

test('science 8 Nutrition: a house, then 1 VP per house', (t) => {
	const r = onto(t, 'science', 8);
	assert.deepEqual(placing(r), ['house']);
	place(r);
	assert.equal(r.seat.vp, 1);
});

test('science 9 Physics: advance on exploration, technology or military', (t) => {
	const r = onto(t, 'science', 9);
	const [move] = openDecisions(r.state);
	assert.deepEqual(
		move.options.map((o) => o.track),
		['exploration', 'technology', 'military']
	);
	reply(r, 'chooseMove', { track: 'exploration', from: 0 });
	assert.equal(r.seat.territoryTiles.length, 2);
});

test('science 10 Neuroscience: the Laboratory, then regress on technology or military and gain that space', (t) => {
	const r = onto(t, 'science', 10, (seat) => {
		seat.tracks.technology = [3];
	});
	assert.deepEqual(landing(r), ['laboratory']);
	place(r);
	// The only token that can go back lands on Carpentry: a tapestry card.
	assert.deepEqual(r.seat.tracks.technology, [2]);
	assert.equal(r.seat.hand.length, 1);
	assert.deepEqual(open(r), ['chooseBonus']);
});

test('science 11 Quantum Physics: advance twice', (t) => {
	const r = onto(t, 'science', 11);
	reply(r, 'chooseMove', { track: 'exploration', from: 0 });
	reply(r, 'chooseMove', { track: 'military', from: 0 });
	assert.deepEqual(r.seat.tracks.exploration, [1]);
	assert.deepEqual(handed(r), [['conquer', {}]]);
});

test('science 12 Alien Biology: 4 rolls with the X, 5 VP for each that would push past space 12', (t) => {
	const r = onto(t, 'science', 12, (seat) => {
		Object.assign(seat.tracks, {
			exploration: [12],
			technology: [12],
			military: [12],
		});
	});
	assert.equal(r.seat.vp, 20);
	assert.ok(passed(r));
});

// Technology (01 §3.4)

test('technology 1 Pottery: invent', (t) => {
	const r = onto(t, 'technology', 1);
	assert.deepEqual(handed(r), [['invent', {}]]);
});

test('technology 2 Carpentry: a tapestry card; the bonus pays for a market', (t) => {
	const r = onto(t, 'technology', 2);
	assert.equal(r.seat.hand.length, 1);
	reply(r, 'chooseBonus', { pay: { food: 1 } });
	assert.deepEqual(placing(r), ['market']);
});

test('technology 3 Stone Tools: invent, or a market', (t) => {
	const r = onto(t, 'technology', 3);
	reply(r, 'chooseOption', { option: 0 });
	assert.deepEqual(handed(r), [['invent', {}]]);
});

test('technology 4 Metallurgy: the Forge, then invent, refreshing first if you like', (t) => {
	const r = onto(t, 'technology', 4);
	assert.deepEqual(landing(r), ['forge']);
	place(r);
	assert.deepEqual(handed(r), [['invent', { refresh: true }]]);
});

test('technology 5 Glass: a farm, house or armory; the bonus pays to upgrade', (t) => {
	const r = onto(t, 'technology', 5);
	reply(r, 'chooseOption', { option: 1 });
	assert.deepEqual(placing(r), ['house']);
	place(r);
	reply(r, 'chooseBonus', { pay: { food: 1 } });
	assert.deepEqual(handed(r), [['upgrade', {}]]);
});

test('technology 6 Steel: 1 VP per armory and a market; the bonus pays to invent', (t) => {
	const r = onto(t, 'technology', 6, (seat) => {
		seat.incomeMat.buildings.armory = 3;
	});
	assert.deepEqual(placing(r), ['market']);
	place(r);
	assert.equal(r.seat.vp, 2);
	reply(r, 'chooseBonus', { pay: { food: 1 } });
	assert.deepEqual(handed(r), [['invent', {}]]);
});

test('technology 7 Rubber: Rubber Works, then invent 2, refreshing first if you like', (t) => {
	const r = onto(t, 'technology', 7);
	assert.deepEqual(landing(r), ['rubber-works']);
	place(r);
	assert.deepEqual(handed(r), [['invent', { refresh: true, count: 2 }]]);
});

test('technology 8 Plastic: a market, then 1 VP per market; the bonus pays to upgrade', (t) => {
	const r = onto(t, 'technology', 8);
	assert.deepEqual(placing(r), ['market']);
	place(r);
	assert.equal(r.seat.vp, 1);
	assert.deepEqual(open(r), ['chooseBonus']);
});

test('technology 9 Electronics: upgrade and a middle-row circle, in the order you choose', (t) => {
	const r = onto(t, 'technology', 9);
	reply(r, 'chooseOrder', { effect: 1 });
	assert.deepEqual(handed(r), [
		['techBenefit', { icon: 'circle' }],
		['upgrade', {}],
	]);
});

test('technology 10 Computers: the Tech Hub, 1 VP per military and per science space', (t) => {
	const r = onto(t, 'technology', 10, (seat) => {
		seat.tracks.military = [4];
		seat.tracks.science = [3];
	});
	assert.deepEqual(landing(r), ['tech-hub']);
	place(r);
	assert.equal(r.seat.vp, 7);
});

test('technology 11 Nanotechnology: upgrade and a top-row square in either order; the bonus discards 3 tech cards for 10 VP', (t) => {
	const r = onto(t, 'technology', 11, (seat) => {
		seat.tech.bottom = ['pottery', 'clocks', 'radio'];
	});
	reply(r, 'chooseOrder', { effect: 0 });
	assert.deepEqual(handed(r), [
		['upgrade', {}],
		['techBenefit', { icon: 'square' }],
	]);
	reply(r, 'chooseBonus', { pay: { tech: ['pottery', 'clocks', 'radio'] } });
	assert.equal(r.seat.vp, 10);
});

test('technology 12 AI Singularity: 1 of each resource, and the token starts again on any track', (t) => {
	const r = onto(t, 'technology', 12);
	assert.deepEqual(r.seat.resources, {
		coin: 1,
		worker: 3,
		food: 3,
		culture: 3,
	});
	reply(r, 'chooseRestart', { track: 'science' });
	assert.deepEqual(r.seat.tracks.technology, []);
	assert.deepEqual(r.seat.tracks.science, [0, 0]);
	assert.ok(passed(r));
});

// Military (01 §3.5)

test('military 1 Archery: conquer', (t) => {
	const r = onto(t, 'military', 1);
	assert.deepEqual(handed(r), [['conquer', {}]]);
});

test('military 2 Bladed Weapons: a tapestry card; the bonus pays for an armory', (t) => {
	const r = onto(t, 'military', 2);
	assert.equal(r.seat.hand.length, 1);
	reply(r, 'chooseBonus', { pay: { coin: 1 } });
	assert.deepEqual(placing(r), ['armory']);
});

test('military 3 Walls: conquer, or an armory', (t) => {
	const r = onto(t, 'military', 3);
	reply(r, 'chooseOption', { option: 1 });
	assert.deepEqual(placing(r), ['armory']);
});

test('military 4 Standing Army: the Barracks, 1 worker and 1 VP per territory tile', (t) => {
	const r = onto(t, 'military', 4, (seat) => {
		seat.territoryTiles = [1, 2];
	});
	assert.deepEqual(landing(r), ['barracks']);
	place(r);
	assert.equal(r.seat.resources.worker, 3);
	assert.equal(r.seat.vp, 2);
});

test('military 5 Cavalry: conquer and an armory, in the order you choose', (t) => {
	const r = onto(t, 'military', 5);
	reply(r, 'chooseOrder', { effect: 1 });
	assert.deepEqual(placing(r), ['armory']);
	place(r);
	assert.deepEqual(handed(r), [['conquer', {}]]);
});

test('military 6 Gunpowder: a tapestry card and conquer; the bonus pays for an armory', (t) => {
	const r = onto(t, 'military', 6);
	assert.equal(r.seat.hand.length, 1);
	assert.deepEqual(handed(r), [['conquer', {}]]);
	assert.deepEqual(open(r), ['chooseBonus']);
});

test('military 7 Tanks: the Tank Factory, then conquer with both dice against an opponent (R17)', (t) => {
	const r = onto(t, 'military', 7);
	assert.deepEqual(landing(r), ['tank-factory']);
	place(r);
	assert.deepEqual(handed(r), [['conquer', { bothDice: 'ifOpponent' }]]);
});

test('military 8 Warplanes: conquer anywhere; the bonus pays for a tapestry card', (t) => {
	const r = onto(t, 'military', 8);
	assert.deepEqual(handed(r), [['conquer', { anywhere: true }]]);
	assert.deepEqual(open(r), ['chooseBonus']);
});

test('military 9 Anti-Aircraft Defense: an armory and 1 VP per tapestry card in hand and on the income mat', (t) => {
	const r = onto(t, 'military', 9, (seat) => {
		seat.hand = ['trap-1'];
		seat.incomeMat.tapestry = [['trap-2'], [], [], []];
	});
	assert.deepEqual(placing(r), ['armory']);
	place(r);
	assert.equal(r.seat.vp, 2);
});

test('military 10 Nuclear Bomb: the Fusion Reactor, then 1 VP per exploration space and a tapestry card on top, in the order you choose', (t) => {
	const r = onto(t, 'military', 10, (seat) => {
		seat.tracks.exploration = [6];
	});
	assert.deepEqual(landing(r), ['fusion-reactor']);
	place(r);
	// The card played on top may move the exploration token, so the order matters.
	assert.deepEqual(open(r), ['chooseOrder']);
	assert.equal(r.seat.vp, 0);
	reply(r, 'chooseOrder', { effect: 1 });
	assert.equal(r.seat.vp, 6);
	assert.deepEqual(handed(r), [['tapestryOnTop', {}]]);
});

test('military 11 Drone Assassins: score the capital city; the bonus discards 3 tapestry cards for 10 VP', (t) => {
	const r = onto(t, 'military', 11, (seat) => {
		seat.hand = ['trap-1', 'trap-2', 'trap-3'];
		for (const spot of buildingSpots(seat)) {
			if (spot.row === 0) {
				seat.capital.buildings.push({
					building: 'house',
					row: 0,
					col: spot.col,
				});
			}
		}
	});
	const scored = r.state.events.filter((e) => e.type === 'capitalScored');
	assert.equal(scored.length, 1);
	assert.equal(scored[0].player, r.player);
	assert.ok(scored[0].rows >= 1);
	const lines = scored[0].rows + scored[0].columns;
	assert.equal(r.seat.vp, lines);
	reply(r, 'chooseBonus', {
		pay: { tapestry: ['trap-1', 'trap-2', 'trap-3'] },
	});
	assert.equal(r.seat.vp, lines + 10);
});

test('military 12 Mechs: conquer with both dice and a random civilization, in the order you choose', (t) => {
	const r = onto(t, 'military', 12);
	reply(r, 'chooseOrder', { effect: 0 });
	assert.deepEqual(handed(r), [
		['conquer', { bothDice: 'always' }],
		['gainCiv', {}],
	]);
	assert.ok(passed(r));
});

// The landmark race (01 §3.1, FAQ #2)

test('the landmark race: the first player into a tier takes it, the second gets nothing', (t) => {
	const r = onto(t, 'exploration', 4, (seat, state) => {
		const other = state.seats.find((s) => s.seat !== seat.seat);
		other.incomeTurns = 1;
		other.tracks.exploration = [3];
		other.resources.food = 2;
	});
	assert.deepEqual(landing(r), ['lighthouse']);
	place(r);
	assert.ok(passed(r));
	const chosen = answer(r.state, r.random, r.other, 'chooseTurn', {
		turn: 'advance',
	});
	const after = answer(chosen, r.random, r.other, 'chooseAdvance', {
		track: 'exploration',
		from: 3,
		pay: { food: 2 },
	});
	assert.deepEqual(
		after.events
			.filter((e) => e.type === 'landmarkGained')
			.map((e) => [e.player, e.landmark]),
		[[r.player, 'lighthouse']]
	);
	assert.deepEqual(
		openDecisions(after).filter((d) => d.kind === 'choosePlacement'),
		[]
	);
	assert.deepEqual(after.seats[r.other - 1].capital.landmarks, []);
});

test("an advance on another player's turn wins the landmark race (FAQ #2)", () => {
	const { state, random, player } = readyTurn(2, (seat, s) => {
		seat.tracks.military = [3];
		seat.resources.culture = 2;
		s.seats.find((x) => x.seat !== seat.seat).tracks.military = [3];
	});
	const other = player === 1 ? 2 : 1;
	const raced = resolveEffects(
		state,
		other,
		[{ advance: { tracks: ['military'] } }],
		random
	);
	assert.equal(raced.current, player);
	// The player who won the race places the landmark, though it is not their turn (FAQ #2).
	assert.deepEqual(
		openDecisions(raced)
			.filter((d) => d.kind === 'choosePlacement')
			.map((d) => [d.player, d.landmark]),
		[[other, 'barracks']]
	);
	const placed = placeAll(raced, random);
	assert.equal(placed.seats[other - 1].capital.landmarks.length, 1);
	const chosen = answer(placed, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	const after = answer(chosen, random, player, 'chooseAdvance', {
		track: 'military',
		from: 3,
		pay: { culture: 2 },
	});
	assert.deepEqual(
		after.events
			.filter((e) => e.type === 'landmarkGained')
			.map((e) => [e.player, e.landmark]),
		[[other, 'barracks']]
	);
	assert.deepEqual(
		openDecisions(after).filter((d) => d.kind === 'choosePlacement'),
		[]
	);
});

test("a bonus that discards tapestry cards lists them only in its own player's view", (t) => {
	const r = onto(t, 'science', 5, (seat) => {
		seat.hand = ['trap-6', 'trap-7'];
	});
	reply(r, 'chooseMove', { track: null });
	const own = view(r.state, r.player);
	const bonus = own.pending.find((op) => op.kind === 'chooseBonus');
	assert.deepEqual(bonus?.answers, [
		{ pay: null },
		{ pay: { tapestry: ['trap-6', 'trap-7'] } },
	]);
	for (const seat of [r.other, null]) {
		const text = JSON.stringify(view(r.state, seat));
		assert.ok(!text.includes('trap-6'), String(seat));
	}
});
