// Tests for createGame and the setup decisions (#13, task 3).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createGame } from '../src/lib/engine/setup.js';
import {
	checkOptions,
	EXPANSIONS_BUILT,
	VARIANTS,
	VERSIONS,
} from '../src/lib/engine/game.js';
import {
	AFTER_SETUP,
	AFTER_SETUP_STEPS,
} from '../src/lib/engine/after-setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import {
	BASE_CIVS,
	BASE_TAPESTRY,
	BASE_TECH,
	tapestryFor,
	civsFor,
	PP_CIVS,
} from '../src/lib/engine/decks.js';
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
				faceDown: [],
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

test('a Plans & Ploys deck holds 63 tapestry cards, its 13 with the base 50, and a base deck the same 50 (#33)', () => {
	assert.deepEqual(tapestryFor([]), [...BASE_TAPESTRY]);
	const pp = tapestryFor(['pp']);
	assert.equal(pp.length, 63);
	assert.deepEqual(pp.slice(0, 50), [...BASE_TAPESTRY]);
	assert.deepEqual(pp.slice(50), [
		'astronomy',
		'cartography',
		'double-cross',
		'engineering',
		'entertain-the-masses',
		'manifest-destiny',
		'public-works',
		'retreat',
		'status-quo',
		'stolen-plans',
		'surprise-party',
		'surrender',
		'worlds-fair',
	]);
	const { supply } = newGame(3, { expansions: ['pp'] }).state;
	assert.deepEqual([...supply.tapestry.deck].sort(), [...pp].sort());
});

test('a Plans & Ploys deck deals the base 16 and the built Plans & Ploys civilizations; a seeded base game deals as before (#33)', () => {
	assert.deepEqual(civsFor([]), [...BASE_CIVS]);
	assert.deepEqual(civsFor(['pp']), [...BASE_CIVS, ...PP_CIVS]);
	assert.ok(PP_CIVS.includes('islanders'), 'R115, #165');
	const { supply } = newGame(3, { expansions: ['pp'] }).state;
	assert.deepEqual(
		[
			...supply.civs,
			...openDecisions(newGame(3, { expansions: ['pp'] }).state).flatMap(
				(d) => (d.kind === 'chooseCiv' ? d.options : [])
			),
		].sort(),
		civsFor(['pp']).sort()
	);
	const base = newGame(3, { seed: 7 }).state.supply.civs;
	assert.deepEqual(base.slice(0, 4), [
		'merrymakers',
		'isolationists',
		'nomads',
		'inventors',
	]);
});

test('a seeded base game deals the same decks as before #33', () => {
	const { supply } = newGame(3, { seed: 7 }).state;
	assert.deepEqual(supply.tapestry.deck.slice(0, 10), [
		'broker-of-peace',
		'socialism',
		'guilds',
		'age-of-sail',
		'trade-economy',
		'oil-magnate',
		'olympic-host',
		'technocracy',
		'trap-7',
		'boast-of-superiority',
	]);
	assert.deepEqual(supply.civs.slice(0, 4), [
		'merrymakers',
		'isolationists',
		'nomads',
		'inventors',
	]);
	assert.deepEqual(supply.space.slice(0, 4), [10, 12, 14, 5]);
});

test('each seat records the territory its two outposts started on (#33)', () => {
	for (const options of [{}, { variants: ['closest-island'] }]) {
		const { state } = startedGame(3, options);
		for (const seat of state.seats) {
			const placed = state.events.find(
				(e) =>
					e.type === 'outpostsPlaced' &&
					e.player === seat.seat &&
					e.count === 2
			);
			assert.ok(placed, `seat ${seat.seat} placed two outposts`);
			assert.equal(/** @type {any} */ (seat).start, placed.hex);
		}
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
			'civSetup',
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

test('createGame refuses a bad player count, an unknown version and an expansion not built yet', () => {
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
	assert.throws(() => createGame({ ...base, expansions: ['xx'] }), {
		name: 'PlayerError',
		message: /Unknown expansion/,
	});
	assert.throws(() => createGame({ ...base, random: undefined }), TypeError);
});

test('checkOptions accepts both versions with no expansions or variants', () => {
	for (const version of ['original', 'current']) {
		checkOptions({ version });
		checkOptions({ version, expansions: [], variants: [] });
	}
	assert.ok(Object.isFrozen(VARIANTS));
});

test('the nine variants can be switched on, each with a name: the five the owner chose, civilizations from Plans & Ploys, Twin Impact, and the two of the arts track (#53, #33, #35, #186)', () => {
	assert.deepEqual(
		VARIANTS.map((v) => v.id),
		[
			'tapestry-draft',
			'civ-draft',
			'neoprene-nanotechnology',
			'no-radio-battery',
			'closest-island',
			'civs-from-pp',
			'no-arts-track',
			'twin-impact',
			'either-science-die',
		]
	);
	for (const variant of VARIANTS) {
		assert.ok(Object.isFrozen(variant));
		assert.equal(typeof variant.name, 'string');
		assert.ok(variant.name.length > 0);
	}
	// Either science die needs the arts track, so it can't join "Play without the arts track" (#35).
	for (const version of ['original', 'current']) {
		for (const left of ['no-arts-track', 'either-science-die']) {
			checkOptions({
				version,
				expansions: ['pp', 'aa'],
				variants: VARIANTS.map((v) => v.id).filter(
					(id) => id !== left && id !== 'twin-impact'
				),
			});
		}
	}
});

test('checkOptions refuses what createGame refuses, variants included (#22, #53)', () => {
	const refusals = /** @type {[Record<string, unknown>, RegExp][]} */ ([
		[{ version: '2024' }, /Unknown rules version: 2024/],
		[{ version: 'current', expansions: 'pp' }, /expansions must be a list/],
		[{ version: 'current', expansions: ['xx'] }, /Unknown expansion: xx/],
		[{ version: 'current', variants: 'draft' }, /variants must be a list/],
		[{ version: 'current', variants: ['draft'] }, /Unknown variant: draft/],
		[
			{ version: 'current', variants: ['civ-draft', 'civ-draft'] },
			/only once/,
		],
	]);
	for (const [options, message] of refusals) {
		assert.throws(
			() => checkOptions(/** @type {any} */ (options)),
			{ name: 'PlayerError', message },
			JSON.stringify(options)
		);
	}
});

test('a game keeps its variants, and says so when it is created (#53)', () => {
	const state = createGame({
		players: [{ name: 'Ana' }, { name: 'Bo' }],
		version: 'current',
		random: seededRandom(1),
	});
	assert.deepEqual(state.variants, []);
	assert.deepEqual(state.events[0].variants, []);
});

test('an expansion is refused until its setup is built: Plans & Ploys (owner, #32), Arts & Architecture (owner, #35, #36) and Fantasies & Futures (#39) are, and the versions are public', () => {
	assert.deepEqual(EXPANSIONS_BUILT, ['pp', 'aa', 'ff']);
	assert.ok(Object.isFrozen(EXPANSIONS_BUILT));
	assert.deepEqual(
		VERSIONS.map((v) => v.id),
		['original', 'current']
	);
});

test('createGame refuses an unknown variant', () => {
	assert.throws(
		() =>
			createGame({
				players: [{ name: 'Ana' }, { name: 'Bo' }],
				version: 'current',
				variants: ['draft'],
				random: seededRandom(1),
			}),
		{ name: 'PlayerError', message: /Unknown variant: draft/ }
	);
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
	t.onTestFinished(() => {
		AFTER_SETUP.pop();
		delete AFTER_SETUP_STEPS.late;
	});
	assert.throws(
		() => startedGame(2),
		(e) => e.name !== 'PlayerError' && /'start'/.test(e.message)
	);
});

test('R116: the variant "All civilizations from Plans & Ploys" deals and draws from the Plans & Ploys civilizations only, needs the expansion and seats all 5 players (#33, #53, #165)', () => {
	assert.deepEqual(civsFor(['pp'], ['civs-from-pp']), [...PP_CIVS]);
	assert.deepEqual(civsFor([], ['civs-from-pp']), [...BASE_CIVS]);
	assert.deepEqual(civsFor(['pp'], ['civ-draft']), civsFor(['pp']));
	assert.throws(
		() => checkOptions({ version: 'current', variants: ['civs-from-pp'] }),
		/needs Plans & Ploys/
	);
	assert.throws(
		() => newGame(2, { variants: ['civs-from-pp'] }),
		/needs Plans & Ploys/
	);
	const options = { expansions: ['pp'], variants: ['civs-from-pp'] };
	for (const count of [1, 2, 3, 4, 5]) {
		const { state } = newGame(count, options);
		const dealt = openDecisions(state).flatMap((d) =>
			d.kind === 'chooseCiv' ? d.options : []
		);
		assert.equal(dealt.length, 2 * count);
		assert.deepEqual(
			[...dealt, ...state.supply.civs].sort(),
			[...PP_CIVS].sort()
		);
	}
});
