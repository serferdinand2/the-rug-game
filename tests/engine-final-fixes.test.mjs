// Tests for the final-review fixes of #13: setup steps, event copies, input checks and registries.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createGame, SETUP_STEPS } from '../src/lib/engine/setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { emit } from '../src/lib/engine/events.js';
import { play } from '../src/lib/engine/play.js';
import { view } from '../src/lib/engine/game.js';
import { push, openDecisions } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { DECISIONS, AUTOMATIC } from '../src/lib/engine/kinds.js';
import { runEffects } from '../src/lib/engine/effects/index.js';
import { newGame, startedGame } from './helpers/engine.mjs';

test('the same seed gives the same game as before the setup steps became a list', () => {
	const pinned = [
		[
			3,
			7,
			3,
			['sewage-plumbing', 'canned-food', 'transistors'],
			[
				['mystics', 'architects'],
				['alchemists', 'heralds'],
				['traders', 'militants'],
			],
			[32, 5, 40],
		],
		[
			2,
			7,
			2,
			['sewage-plumbing', 'canned-food', 'transistors'],
			[
				['mystics', 'architects'],
				['alchemists', 'heralds'],
			],
			[32, 5, 40],
		],
		[
			4,
			9,
			2,
			['treasury', 'irrigation', 'vaccines'],
			[
				['mystics', 'isolationists'],
				['futurists', 'militants'],
				['nomads', 'entertainers'],
				['traders', 'leaders'],
			],
			[17, 9, 7],
		],
	];
	for (const [count, seed, first, faceUp, civs, territory] of pinned) {
		const { state } = newGame(count, { seed });
		assert.equal(state.first, first);
		assert.deepEqual(state.supply.tech.faceUp, faceUp);
		assert.deepEqual(
			state.events
				.filter((e) => e.type === 'civsDealt')
				.map((e) => e.secret.civs),
			civs
		);
		assert.deepEqual(state.supply.territory.slice(0, 3), territory);
	}
	assert.deepEqual(
		newGame(4, { seed: 9 }).state.seats.map((s) => s.capital.mat),
		[1, 3, 4, 2]
	);
	assert.deepEqual(newGame(2, { seed: 7 }).state.supply.capitals, [3, 5]);
});

test('SETUP_STEPS is an ordered list of functions', () => {
	assert.ok(Array.isArray(SETUP_STEPS));
	assert.ok(SETUP_STEPS.length >= 4);
	for (const step of SETUP_STEPS) {
		assert.equal(typeof step, 'function');
	}
});

test('events hold copies, not the arrays of the state or its decisions', () => {
	const { state } = newGame(2);
	const civs = openDecisions(state).find((d) => d.kind === 'chooseCiv');
	const dealt = state.events.find(
		(e) => e.type === 'civsDealt' && e.player === civs.player
	);
	assert.notEqual(dealt.secret.civs, civs.options);
	const before = [...dealt.secret.civs];
	civs.options.push('x');
	assert.deepEqual(dealt.secret.civs, before);
	const created = state.events.find((e) => e.type === 'gameCreated');
	assert.notEqual(created.expansions, state.expansions);
	const cap = newGame(2).state;
	const choose = openDecisions(cap).find((d) => d.kind === 'chooseCapital');
	const capDealt = cap.events.find(
		(e) => e.type === 'capitalDealt' && e.player === choose.player
	);
	assert.notEqual(capDealt.options, choose.options);
});

test('emit stores a copy of the event', () => {
	const state = { seq: 0, events: [] };
	const list = [1, 2];
	emit(state, { type: 'x', list });
	list.push(3);
	assert.deepEqual(state.events[0].list, [1, 2]);
});

test('seededRandom throws unless n is a positive whole number', () => {
	const random = seededRandom(1);
	for (const n of [0, -1, 1.5, NaN, Infinity, '3', undefined]) {
		assert.throws(() => random(n), RangeError, String(n));
	}
	assert.equal(random(1), 0);
});

test('createGame refuses a player without a name and expansions that are not a list', () => {
	const base = { version: 'current', random: seededRandom(1) };
	for (const players of [[{}], ['Ana'], [null], [{ name: 5 }]]) {
		assert.throws(() => createGame({ ...base, players }), {
			name: 'PlayerError',
			message: 'Every player needs a name.',
		});
	}
	for (const expansions of [null, 'pp', {}]) {
		assert.throws(
			() =>
				createGame({
					...base,
					players: [{ name: 'Ana' }],
					expansions,
				}),
			{ name: 'PlayerError' }
		);
	}
});

test('the new state survives a JSON round trip unchanged', () => {
	for (const count of [1, 2, 4]) {
		const { state } = newGame(count);
		assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
	}
});

test('effects keep the extra fields of their operation when they continue', () => {
	const { state, random } = startedGame(2);
	const next = structuredClone(state);
	push(next, next.pending, [
		{
			player: 1,
			kind: 'effects',
			ordered: true,
			source: 'x',
			effects: [{ gain: { any: 1 } }, { vp: 1 }],
		},
	]);
	run(next, random);
	const rest = next.pending.find((op) => op.kind === 'effects');
	assert.ok(rest, 'the continuation waits under the choice');
	assert.equal(rest.ordered, true);
	assert.equal(rest.source, 'x');
	assert.deepEqual(rest.effects, [{ vp: 1 }]);
});

test('a decision with no owner cannot be answered by seat null or any non-seat', () => {
	const { state, random } = startedGame(2);
	const next = structuredClone(state);
	const [made] = push(next, next.pending, [
		{ player: null, kind: 'chooseTurn', options: ['income'] },
	]);
	for (const seat of [null, undefined, 0, 3, '1']) {
		assert.throws(
			() =>
				play(next, seat, { decision: made.id, turn: 'income' }, random),
			{ name: 'PlayerError' },
			String(seat)
		);
	}
});

test('kinds are looked up as own keys, never through the prototype', () => {
	const { state, random } = startedGame(2);
	const next = structuredClone(state);
	push(next, next.pending, [{ player: 1, kind: 'toString' }]);
	assert.throws(() => run(next, random), /no operation kind toString/);
	assert.doesNotThrow(() => view(next, 1));
});

test('every decision kind has the full shape, and its answers pass its own check', () => {
	const { state: started } = startedGame(2);
	// Enough to pay for something, so every kind has answers to check.
	const state = structuredClone(started);
	state.seats[0].resources.coin = 1;
	// Food to convert, so chooseConversion offers more than converting none.
	state.seats[0].resources.food = 2;
	// Seat 1 holds a territory tile (and controls its start territory), so it has somewhere to explore.
	state.seats[0].territoryTiles = [2];
	state.seats[1].hand = ['trap-1'];
	// chooseTapestry offers only cards still in the hand.
	state.seats[0].hand = ['trap-1', 'age-of-sail'];
	// A card in the bottom row, so chooseUpgrade has something to offer.
	state.seats[0].tech.bottom = ['irrigation'];
	const fixtures = {
		chooseTurn: {
			player: 1,
			kind: 'chooseTurn',
			options: ['income', 'advance'],
		},
		chooseCapital: { player: 1, kind: 'chooseCapital', options: [1, 2] },
		chooseCiv: {
			player: 1,
			kind: 'chooseCiv',
			options: ['mystics', 'architects'],
		},
		chooseResource: {
			player: 1,
			kind: 'chooseResource',
			count: 2,
			from: 'any',
		},
		chooseAdvance: { player: 1, kind: 'chooseAdvance' },
		chooseUpgrade: { player: 1, kind: 'chooseUpgrade', optional: true },
		chooseTechBenefit: {
			player: 1,
			kind: 'chooseTechBenefit',
			icon: 'circle',
			options: ['irrigation', 'calendar'],
		},
		chooseOrder: {
			player: 1,
			kind: 'chooseOrder',
			effects: [{ upgrade: {} }, { techBenefit: { icon: 'circle' } }],
			source: { track: 'technology', space: 9 },
		},
		chooseMove: {
			player: 1,
			kind: 'chooseMove',
			direction: 'advance',
			options: [{ track: 'exploration', from: 0 }],
			benefit: true,
			optional: true,
		},
		chooseRepeat: {
			player: 1,
			kind: 'chooseRepeat',
			options: [{ track: 'exploration', space: 1 }],
		},
		chooseRestart: {
			player: 1,
			kind: 'chooseRestart',
			options: ['exploration', 'science', 'technology', 'military'],
			source: { track: 'technology', space: 12 },
		},
		chooseTapestry: {
			player: 1,
			kind: 'chooseTapestry',
			options: ['trap-1', 'age-of-sail'],
			era: 2,
		},
		chooseOption: {
			player: 1,
			kind: 'chooseOption',
			options: [[{ explore: {} }], [{ building: 'farm' }]],
			source: { track: 'exploration', space: 3 },
		},
		choosePlacement: {
			player: 1,
			kind: 'choosePlacement',
			building: 'farm',
		},
		chooseBonus: {
			player: 1,
			kind: 'chooseBonus',
			track: 'exploration',
			space: 2,
			cost: { any: 1 },
			gain: [{ gain: { tapestry: 1 } }],
		},
		chooseExplore: { player: 1, kind: 'chooseExplore', anywhere: false },
		chooseInvent: {
			player: 1,
			kind: 'chooseInvent',
			left: 1,
			refresh: true,
			invent: {},
		},
		chooseConquer: { player: 1, kind: 'chooseConquer', anywhere: true },
		chooseDie: {
			player: 1,
			kind: 'chooseDie',
			hex: '-2_-1',
			red: 0,
			black: 0,
		},
		chooseResponse: {
			player: 2,
			kind: 'chooseResponse',
			attacker: 1,
			hex: '-2_-1',
		},
		chooseSpaceTile: {
			player: 1,
			kind: 'chooseSpaceTile',
			options: [5, 13],
		},
		chooseLandmark: {
			player: 1,
			kind: 'chooseLandmark',
			options: ['lighthouse', 'academy'],
		},
		chooseDiscard: { player: 1, kind: 'chooseDiscard', vpEach: 2 },
		chooseKeep: {
			player: 1,
			kind: 'chooseKeep',
			options: ['trap-1', 'age-of-sail'],
			keep: 1,
		},
		chooseTrade: {
			player: 1,
			kind: 'chooseTrade',
			offers: [{ pay: {}, gain: [{ vp: 1 }] }],
			optional: true,
		},
		chooseTrack: {
			player: 1,
			kind: 'chooseTrack',
			options: ['exploration', 'technology'],
			purpose: 'dictatorship',
			then: { kind: 'dictate' },
		},
		chooseRoll: {
			player: 1,
			kind: 'chooseRoll',
			options: ['science', 'military'],
			then: { kind: 'researchRolled', noBenefit: false, offTrackVp: 0 },
		},
		chooseSpace: {
			player: 1,
			kind: 'chooseSpace',
			options: [
				{ player: 2, track: 'technology', space: 2 },
				{ player: 2, track: 'military', space: 2 },
			],
		},
		chooseHex: {
			player: 1,
			kind: 'chooseHex',
			options: ['-2_-2', '-2_-1'],
			optional: true,
			purpose: 'revolution',
			then: { kind: 'revolt', left: 1 },
		},
		chooseGift: { player: 1, kind: 'chooseGift' },
		choosePartner: {
			player: 1,
			kind: 'choosePartner',
			options: [
				{ player: 2, track: 'exploration' },
				{ player: 2, track: 'military' },
			],
		},
		chooseConversion: { player: 1, kind: 'chooseConversion', max: 2 },
		chooseCopy: {
			player: 1,
			kind: 'chooseCopy',
			options: [
				{ player: 2, card: 'democracy' },
				{ player: 2, card: 'alliance' },
			],
			espionage: 'espionage',
		},
		chooseCivAbility: {
			player: 1,
			kind: 'chooseCivAbility',
			options: ['alchemists', 'leaders'],
			turn: 2,
			done: [],
		},
		chooseSlot: {
			player: 1,
			kind: 'chooseSlot',
			options: ['coin', 'food'],
			optional: true,
			purpose: 'loseResource',
			then: { kind: 'loseResource', left: 0 },
		},
		chooseAlchemists: {
			player: 1,
			kind: 'chooseAlchemists',
			marked: ['science'],
		},
		chooseProphecy: {
			player: 1,
			kind: 'chooseProphecy',
			category: 'tracks',
			options: [1, 2, 3, 4],
		},
		chooseSwap: { player: 1, kind: 'chooseSwap', left: 3 },
	};
	assert.deepEqual(
		Object.keys(fixtures).sort(),
		Object.keys(DECISIONS).sort()
	);
	for (const [name, kind] of Object.entries(DECISIONS)) {
		assert.ok(Array.isArray(kind.hidden), name);
		for (const fn of ['answers', 'check', 'resolve']) {
			assert.equal(typeof kind[fn], 'function', `${name}.${fn}`);
		}
		const decision = { id: 99, batch: 99, ...fixtures[name] };
		const answers = kind.answers(state, decision);
		assert.ok(answers.length, name);
		for (const answer of answers) {
			assert.doesNotThrow(
				() => kind.check(state, decision, answer),
				`${name} ${JSON.stringify(answer)}`
			);
		}
	}
	assert.equal(AUTOMATIC.effects, runEffects);
});
