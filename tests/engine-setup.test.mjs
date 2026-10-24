// Tests for createGame and the setup decisions (#13, task 3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/lib/engine/setup.js';
import {
	AFTER_SETUP,
	AFTER_SETUP_STEPS,
} from '../src/lib/engine/after-setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { BASE_CIVS, BASE_TECH } from '../src/lib/engine/decks.js';
import { MAPS } from '../src/lib/engine/data/maps.js';
import {
	CAPITAL_MATS,
	SMALL_MAP_PAIRS,
} from '../src/lib/engine/data/capitals.js';
import { newGame, startedGame } from './helpers/engine.mjs';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

test('the base lists have the right sizes', () => {
	assert.equal(BASE_CIVS.length, 16);
	assert.equal(BASE_TECH.length, 33);
});

test('4–5 players use the large map and 1–3 the small map (01 §2.1)', () => {
	for (const count of [1, 2, 3, 4, 5]) {
		const { state } = newGame(count);
		assert.equal(state.map, count >= 4 ? 'large' : 'small');
		assert.equal(Object.keys(state.hexes).length, count >= 4 ? 61 : 34);
		assert.equal(
			state.hexes['0_0'].tile,
			MAPS[state.map].printed['0_0'].tile
		);
	}
});

test('the decks start full and shuffled (01 §2.1)', () => {
	const { supply } = newGame(3).state;
	assert.equal(supply.tech.deck.length, 30);
	assert.equal(supply.tech.faceUp.length, 3);
	assert.deepEqual(
		new Set([...supply.tech.deck, ...supply.tech.faceUp]),
		new Set(BASE_TECH)
	);
	assert.equal(supply.tapestry.deck.length, 50);
	assert.equal(
		supply.tapestry.deck.filter((card) => card.startsWith('trap-')).length,
		7
	);
	assert.deepEqual(
		[...supply.territory].sort((a, b) => a - b),
		range(1, 48)
	);
	assert.deepEqual(
		[...supply.space].sort((a, b) => a - b),
		range(1, 15)
	);
	assert.equal(newGame(3).state.landmarks.length, 18);
	assert.deepEqual(newGame(3).state.achievements, {
		'complete-track': [],
		'topple-two': [],
		'middle-island': [],
	});
});

test('every player starts empty, with tokens on every track start (01 §2.2)', () => {
	for (const count of [1, 3, 5]) {
		const { state } = newGame(count);
		assert.equal(state.seats.length, count);
		state.seats.forEach((seat, i) => {
			assert.equal(seat.kind, 'player');
			assert.equal(seat.seat, i + 1);
			assert.equal(seat.name, ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'][i]);
			assert.equal(seat.vp, 0);
			assert.deepEqual(seat.resources, {
				coin: 0,
				worker: 0,
				food: 0,
				culture: 0,
			});
			assert.deepEqual(seat.tracks, {
				exploration: [0],
				science: [0],
				technology: [0],
				military: [0],
			});
			assert.equal(seat.outposts, 8);
			assert.deepEqual(seat.incomeMat, {
				buildings: { market: 5, house: 5, farm: 5, armory: 5 },
				tapestry: [[], [], [], []],
			});
			assert.deepEqual(seat.hand, []);
			assert.deepEqual(seat.tech, { bottom: [], middle: [], top: [] });
			assert.deepEqual(seat.territoryTiles, []);
			assert.deepEqual(seat.spaceTiles, []);
			assert.deepEqual(seat.exploredSpace, []);
			assert.deepEqual(seat.civs, []);
			assert.deepEqual(seat.picks, {});
			assert.deepEqual(seat.besideMat, []);
			assert.equal(seat.incomeTurns, 0);
			assert.equal(seat.finished, false);
		});
	}
});

test('on the large map each player is dealt a different mat and starts on its territory (01 §2.2–2.3)', () => {
	for (const count of [4, 5]) {
		for (let seed = 1; seed <= 10; seed++) {
			const { state } = newGame(count, { seed });
			const mats = state.seats.map((s) => s.capital.mat);
			assert.equal(new Set(mats).size, count, `seed ${seed}`);
			assert.ok(mats.every((m) => m >= 1 && m <= 6));
			assert.deepEqual(
				[...mats, ...state.supply.capitals].sort(),
				[1, 2, 3, 4, 5, 6]
			);
			state.seats.forEach((s) => {
				assert.deepEqual(
					state.hexes[CAPITAL_MATS[s.capital.mat - 1].start.large]
						.outposts,
					[
						{ seat: s.seat, toppled: false },
						{ seat: s.seat, toppled: false },
					]
				);
			});
		}
	}
});

test('on the small map each player is dealt a different pair and starts on its territory', () => {
	for (const count of [2, 3]) {
		for (let seed = 1; seed <= 10; seed++) {
			const { state } = newGame(count, { seed });
			const decisions = openDecisions(state).filter(
				(d) => d.kind === 'chooseCapital'
			);
			assert.equal(decisions.length, count);
			const keys = decisions.map((d) => [...d.options].sort().join());
			assert.equal(new Set(keys).size, count, `seed ${seed}`);
			for (const d of decisions) {
				assert.ok(
					SMALL_MAP_PAIRS.some(
						(p) => p.join() === [...d.options].sort().join()
					)
				);
				const hex = CAPITAL_MATS[d.options[0] - 1].start.small;
				assert.equal(state.hexes[hex].outposts.length, 2);
				assert.ok(
					state.hexes[hex].outposts.every((o) => o.seat === d.player)
				);
			}
			const dealt = decisions.flatMap((d) => d.options);
			assert.deepEqual(
				[...dealt, ...state.supply.capitals].sort(),
				[1, 2, 3, 4, 5, 6]
			);
		}
	}
});

test('R40: a solo player starts on 2/4 whichever pair they are dealt', () => {
	for (let seed = 1; seed <= 20; seed++) {
		const { state } = newGame(1, { seed });
		assert.equal(state.hexes['0_2'].outposts.length, 2);
	}
});

test('each player is dealt 2 different civilizations (01 §2.2 step 3)', () => {
	for (const count of [1, 2, 3, 4, 5]) {
		const { state } = newGame(count);
		const options = openDecisions(state)
			.filter((d) => d.kind === 'chooseCiv')
			.flatMap((d) => {
				assert.equal(d.options.length, 2);
				return d.options;
			});
		assert.equal(options.length, 2 * count);
		assert.equal(new Set(options).size, 2 * count);
		assert.ok(options.every((c) => BASE_CIVS.includes(c)));
		assert.equal(state.supply.civs.length, 16 - 2 * count);
	}
});

test('the setup picks are one group with a lane per player, above the after-setup steps', () => {
	for (const count of [1, 2, 3, 4, 5]) {
		const { state } = newGame(count);
		assert.equal(state.pending[0].kind, 'group');
		assert.deepEqual(
			state.pending[0].lanes.map((lane) =>
				lane.stack.map((op) => op.kind)
			),
			Array(count).fill(
				count >= 4 ? ['chooseCiv'] : ['chooseCapital', 'chooseCiv']
			)
		);
		assert.equal(
			openDecisions(state).length,
			count >= 4 ? count : 2 * count
		);
		assert.deepEqual(state.pending[1].steps, [
			'reveal',
			'civDeck',
			'start',
		]);
		assert.equal(state.phase, 'setup');
		assert.equal(state.current, null);
		assert.ok(state.first >= 1 && state.first <= count);
	}
});

test('both versions set up the same way from the same seed', () => {
	for (const count of [1, 3, 5]) {
		const a = structuredClone(
			newGame(count, { version: 'original' }).state
		);
		const b = structuredClone(newGame(count, { version: 'current' }).state);
		a.version = b.version = 'current';
		a.events[0].version = b.events[0].version = 'current';
		assert.deepEqual(a, b);
	}
});

test('the setup events come in order and number from 1', () => {
	for (const count of [2, 4]) {
		const { state } = newGame(count);
		const types = state.events.map((e) => e.type);
		assert.deepEqual(types, [
			'gameCreated',
			...Array(count).fill('capitalDealt'),
			...Array(count).fill('outpostsPlaced'),
			...Array(count).fill('civsDealt'),
			'firstPlayerChosen',
		]);
		assert.deepEqual(
			state.events.map((e) => e.seq),
			range(1, types.length)
		);
		const civs = openDecisions(state).filter((d) => d.kind === 'chooseCiv');
		state.events
			.filter((e) => e.type === 'civsDealt')
			.forEach((e, i) => {
				assert.deepEqual(e.secret.civs, civs[i].options);
			});
		// JSON drops undefined values, so a round trip that changes nothing proves there are none.
		assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
	}
});

test('createGame refuses a bad player count, an unknown version and any expansion', () => {
	const base = {
		players: [{ name: 'Ana' }],
		version: 'current',
		random: seededRandom(1),
	};
	for (const players of [
		undefined,
		'Ana',
		[],
		Array(6).fill({ name: 'X' }),
	]) {
		assert.throws(() => createGame({ ...base, players }), {
			name: 'PlayerError',
			message: /1 to 5 players/,
		});
	}
	assert.throws(() => createGame({ ...base, version: '2024' }), {
		name: 'PlayerError',
	});
	assert.throws(() => createGame({ ...base, expansions: ['pp'] }), {
		name: 'PlayerError',
		message: /Plans & Ploys isn't available yet/,
	});
	assert.throws(() => createGame({ ...base, expansions: ['xx'] }), {
		name: 'PlayerError',
		message: /Unknown expansion/,
	});
	assert.throws(() => createGame({ ...base, random: undefined }), TypeError);
});

test('the setup decisions list answers that pass their own check', () => {
	for (const count of [2, 4]) {
		const { state } = newGame(count);
		const open = openDecisions(state);
		assert.ok(open.length);
		for (const d of open) {
			const answers = DECISIONS[d.kind].answers(state, d);
			assert.equal(answers.length, 2);
			for (const answer of answers) {
				DECISIONS[d.kind].check(state, d, answer);
			}
		}
		const civ = open.find((d) => d.kind === 'chooseCiv');
		assert.throws(
			() => DECISIONS.chooseCiv.check(state, civ, { civ: 'nope' }),
			{ name: 'PlayerError', message: /two civilizations you were dealt/ }
		);
	}
	const { state } = newGame(2);
	const cap = openDecisions(state).find((d) => d.kind === 'chooseCapital');
	const outside = [1, 2, 3, 4, 5, 6].find((m) => !cap.options.includes(m));
	assert.throws(
		() => DECISIONS.chooseCapital.check(state, cap, { capital: outside }),
		{ name: 'PlayerError', message: /two capital city mats/ }
	);
});

test("an after-setup step added after 'start' fails loudly instead of never running", (t) => {
	AFTER_SETUP.push('late');
	AFTER_SETUP_STEPS.late = () => {};
	t.after(() => {
		AFTER_SETUP.pop();
		delete AFTER_SETUP_STEPS.late;
	});
	assert.throws(
		() => startedGame(2),
		(e) => e.name !== 'PlayerError' && /'start'/.test(e.message)
	);
});
