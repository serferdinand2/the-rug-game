// The decisions' titles and answers in words (#26, #126): what the decision panel asks and offers.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { decisionTitle, describeAnswer } from '../src/lib/decision-words.js';
import { describeEffects, describePayment } from '../src/lib/describe.js';
import { createGame, play, VARIANTS, view } from '../src/lib/engine/game.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { allOps } from './helpers/views.mjs';
import { assertReadable } from './helpers/readable.mjs';

test('payments read as what is paid and discarded', () => {
	assert.equal(
		describePayment({ food: 1, worker: 1 }),
		'Pay 1 food and 1 worker'
	);
	assert.equal(describePayment({}), 'Pay nothing');
	assert.equal(
		describePayment({ coin: 1, tapestry: ['democracy', 'trap-3'] }),
		'Pay 1 coin and discard Democracy and Trap'
	);
	assert.equal(
		describePayment({ territory: [17, 3] }),
		'Discard territory tiles 17 and 3'
	);
	assert.equal(
		describePayment({ tech: ['clocks', 'radio', 'paper'] }),
		'Discard Clocks, Radio and Paper'
	);
	const bonus = {
		id: 7,
		batch: 1,
		player: 1,
		kind: 'chooseBonus',
		track: 'exploration',
		space: 5,
		cost: { any: 1 },
		gain: [{ building: 'farm' }],
	};
	assert.equal(
		describeAnswer(bonus, { pay: { food: 1, worker: 1 } }),
		'Pay 1 food and 1 worker'
	);
	assert.equal(describeAnswer(bonus, { pay: null }), 'No bonus');
	assert.equal(decisionTitle(bonus), 'Take the bonus: gain a Farm?');
	const advance = { id: 8, batch: 1, player: 1, kind: 'chooseAdvance' };
	assert.equal(
		describeAnswer(advance, {
			track: 'exploration',
			from: 4,
			pay: { food: 1, culture: 1 },
		}),
		'Advance to Ships and pay 1 food and 1 culture'
	);
});

test('places in the capital and on the map read as rows, columns and hexes', () => {
	const landmark = {
		id: 1,
		batch: 1,
		player: 1,
		kind: 'choosePlacement',
		landmark: 'lighthouse',
	};
	assert.equal(
		describeAnswer(landmark, { row: 2, col: 4, rotation: 1 }),
		'Row 3, column 5, turned once'
	);
	assert.equal(
		describeAnswer(landmark, { row: 2, col: 4, rotation: 2 }),
		'Row 3, column 5, turned twice'
	);
	assert.equal(
		describeAnswer(landmark, { row: 0, col: 0, rotation: 0 }),
		'Row 1, column 1'
	);
	assert.equal(decisionTitle(landmark), 'Where does the Lighthouse go?');
	const farm = { ...landmark, landmark: undefined, building: 'farm' };
	delete farm.landmark;
	assert.equal(describeAnswer(farm, { row: 8, col: 8 }), 'Row 9, column 9');
	assert.equal(
		describeAnswer(farm, { besideMat: true }),
		'Beside your capital mat'
	);
	assert.equal(decisionTitle(farm), 'Where does the Farm go?');
	const explore = { id: 2, batch: 1, player: 1, kind: 'chooseExplore' };
	assert.equal(
		describeAnswer(explore, { tile: 17, hex: '2_-1', orient: 2 }),
		'Hex 2,−1 with tile 17, turned twice'
	);
	assert.equal(
		describeAnswer(explore, { tile: 17, hex: '0_3', orient: 0 }),
		'Hex 0,3 with tile 17'
	);
});

test('answers name seats, cards and resources', () => {
	const game = { seats: [{ name: 'Ana' }, { name: 'Bo' }] };
	const gift = { id: 1, batch: 1, player: 1, kind: 'chooseGift' };
	assert.equal(
		describeAnswer(
			gift,
			{ tile: 12, player: 2 },
			/** @type {any} */ (game)
		),
		'Give tile 12 to Bo'
	);
	assert.equal(
		describeAnswer(
			{ id: 2, batch: 1, player: 1, kind: 'chooseResource', count: 2 },
			{ resources: { coin: 1, food: 1 } }
		),
		'Gain 1 coin and 1 food'
	);
	assert.equal(
		describeAnswer(
			{ id: 3, batch: 1, player: 1, kind: 'chooseCiv', options: [] },
			{ civ: 'the-chosen' }
		),
		'The Chosen'
	);
	assert.equal(
		describeAnswer(
			{ id: 4, batch: 1, player: 1, kind: 'chooseTurn' },
			{ turn: 'income' }
		),
		'Take income'
	);
	assert.equal(
		describeAnswer(
			{ id: 5, batch: 1, player: 1, kind: 'chooseInvent' },
			{ card: 'deck' }
		),
		'The top card of the deck'
	);
	assert.equal(
		describeAnswer(
			{ id: 6, batch: 1, player: 1, kind: 'chooseTapestry' },
			{ card: 'age-of-sail' }
		),
		'Age of Sail'
	);
});

test('unknown decisions and answers fall back to a readable sentence', () => {
	const odd = { id: 1, batch: 1, player: 1, kind: 'chooseSomethingNew' };
	assertReadable(decisionTitle(odd), 'an unknown title');
	assert.equal(describeAnswer(odd, { x: { y: 1 } }), 'Choose this option');
	const slot = {
		id: 2,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose: 'somethingNew',
		options: [],
	};
	assertReadable(describeAnswer(slot, { slot: { z: [1] } }), 'an odd slot');
	assertReadable(
		describeAnswer(
			{ id: 3, batch: 1, player: 1, kind: 'chooseResource' },
			{ resources: 'lots' }
		),
		'an odd resource answer'
	);
});

test('every decision kind has a title of its own', () => {
	const fallback = decisionTitle({
		id: 1,
		batch: 1,
		player: 1,
		kind: 'chooseSomethingNew',
	});
	for (const kind of Object.keys(DECISIONS)) {
		const title = decisionTitle({ id: 1, batch: 1, player: 1, kind });
		assertReadable(title, `the ${kind} title`);
		assert.notEqual(title, fallback, `${kind} has no title`);
	}
});

const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

test('over 20 random games, every open decision and answer describes to a sentence', () => {
	const generic = {
		title: decisionTitle({ kind: 'chooseSomethingNew' }),
		answer: describeAnswer({ kind: 'chooseSomethingNew' }, {}),
		effect: describeEffects([{ notAnEffect: {} }]).toLowerCase(),
	};
	/**
	 * Checks words the games produce: readable, and never the fallback for a shape this module doesn't know.
	 * @param {string} words
	 * @param {string} what
	 */
	const known = (words, what) => {
		assertReadable(words, what);
		assert.ok(
			!words.toLowerCase().includes(generic.effect),
			`${what}: ${words}`
		);
		assert.notEqual(words, generic.title, what);
		assert.notEqual(words, generic.answer, what);
	};
	const kinds = new Set();
	for (let i = 0; i < 20; i++) {
		const seed = 101 + i;
		const random = seededRandom(seed);
		const pick = seededRandom(seed * 7919);
		let state = createGame({
			players: NAMES.slice(0, 1 + (i % 5)).map((name) => ({ name })),
			version: i % 2 === 0 ? 'original' : 'current',
			variants: i % 4 >= 2 ? VARIANTS.map((v) => v.id) : [],
			random,
		});
		for (let actions = 0; ; actions++) {
			const open = openDecisions(state);
			if (open.length === 0) {
				break;
			}
			assert.ok(actions < 5000, `game ${seed} never ended`);
			/** @type {Map<number, any>} */
			const seen = new Map();
			for (const decision of open) {
				const seat = /** @type {number} */ (decision.player);
				const mine = view(state, seat);
				const op = allOps(mine).find((o) => o.id === decision.id);
				assert.ok(op?.answers, `game ${seed}: ${decision.kind}`);
				seen.set(decision.id, op);
				kinds.add(op.kind);
				const what = `game ${seed}, action ${actions}, ${op.kind}`;
				known(decisionTitle(op, mine), `${what}: the title`);
				// What another player sees of it: no answers and no hidden fields.
				const stranger = { ...op };
				delete stranger.answers;
				for (const field of DECISIONS[op.kind].hidden) {
					delete stranger[field];
				}
				known(
					decisionTitle(stranger, mine),
					`${what}: a stranger's title`
				);
				for (const answer of op.answers) {
					known(
						describeAnswer(op, answer, mine),
						`${what}: the answer ${JSON.stringify(answer)}`
					);
				}
			}
			const decision = open[pick(open.length)];
			const seat = /** @type {number} */ (decision.player);
			const answers = seen.get(decision.id).answers;
			const advances = answers.filter((a) => a.turn === 'advance');
			const answer =
				advances.length > 0 && pick(100) < 85
					? advances[0]
					: answers[pick(answers.length)];
			state = play(
				state,
				seat,
				{ decision: decision.id, ...answer },
				random
			);
		}
		assert.equal(state.phase, 'over', `game ${seed} ended`);
	}
	assert.ok(kinds.size >= 15, `only ${kinds.size} decision kinds opened`);
});
