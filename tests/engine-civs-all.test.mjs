// Every base civilization plays its setup, its income turns and the game end, in both versions (#20, design §11).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { play, view } from '../src/lib/engine/game.js';
import { contextFor, run } from '../src/lib/engine/loop.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { CIVS } from '../src/lib/engine/civs/index.js';
import { BASE_CIVS, PP_CIVS } from '../src/lib/engine/decks.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { ASSETS } from '../src/lib/art/catalog.js';
import { startedGame } from './helpers/engine.mjs';
import { checkState } from './helpers/invariants.mjs';
import { allOps, checkViews, setupFacts } from './helpers/views.mjs';

/** @typedef {import('../src/lib/engine/state.js').State} State */
/** @typedef {import('../src/lib/engine/state.js').Operation} Decision */
/** @typedef {import('../src/lib/engine/state.js').Answer} Answer */
/** @typedef {import('../src/lib/engine/state.js').GameEvent} GameEvent */
/** @typedef {(state: State, decision: Decision, answers: Answer[]) => Answer} Choose */

const VERSIONS = /** @type {const} */ (['original', 'current']);

/** Most decisions one game may take before the test gives up. */
const LIMIT = 3000;

/** Most advance turns a player takes between two income turns, when they can pay for one. */
const ADVANCES = 2;

/**
 * Whether an answer declines: a `null` field (a slot, a bonus, a swap, a card) or an empty option.
 * @param {Decision} decision
 * @param {Answer} answer
 */
const declines = (decision, answer) =>
	Object.values(answer).includes(null) ||
	(decision.kind === 'chooseOption' &&
		decision.options[answer.option].length === 0);

/**
 * Every decision's default answer, as answerDefaults() gives: only income turns, and every optional choice declined.
 * @type {Choose}
 */
const defaults = (_state, _decision, answers) => answers[0];

/**
 * A busier game: up to ADVANCES advance turns between income turns, each on the next track in turn (so the players
 * explore, research, invent and conquer), every optional choice taken, and a building or landmark placed on the
 * Craftsmen's columns or the Nomads' map when offered, so each civilization uses its ability.
 * @returns {Choose}
 */
function eager() {
	/** @type {Record<number, number>} */
	const since = {};
	/** @type {Record<number, number>} */
	const advanced = {};
	return (state, decision, answers) => {
		const player = /** @type {number} */ (decision.player);
		if (decision.kind === 'chooseTurn') {
			const advance = answers.find((a) => a.turn === 'advance');
			if (advance && (since[player] ?? 0) < ADVANCES) {
				since[player] = (since[player] ?? 0) + 1;
				return advance;
			}
			since[player] = 0;
			return answers[0];
		}
		if (decision.kind === 'chooseAdvance') {
			const count = advanced[player] ?? 0;
			advanced[player] = count + 1;
			const track = TRACK_IDS[count % TRACK_IDS.length];
			return answers.find((a) => a.track === track) ?? answers[0];
		}
		if (decision.kind === 'choosePlacement') {
			return (
				answers.find((a) => 'craftsmen' in a || 'hex' in a) ??
				answers[0]
			);
		}
		return answers.find((a) => !declines(decision, a)) ?? answers[0];
	};
}

/**
 * Answers every open decision with `choose` until none is open, keeping every event (the state keeps only the newest).
 * @param {State} state
 * @param {import('../src/lib/engine/random.js').Random} random
 * @param {Choose} choose
 * @returns {{ state: State, log: GameEvent[] }}
 */
function playToEnd(state, random, choose) {
	const log = [...state.events];
	for (let step = 0; step < LIMIT; step++) {
		const [open] = openDecisions(state);
		if (!open) {
			return { state, log };
		}
		const seen = state.seq;
		const answer = choose(
			state,
			open,
			DECISIONS[open.kind].answers(state, open)
		);
		state = play(
			state,
			/** @type {number} */ (open.player),
			{ decision: open.id, ...answer },
			random
		);
		log.push(...state.events.filter((e) => e.seq > seen));
	}
	throw new Error('The game never ended.');
}

/**
 * The income turns on which a player's civilization used its step-1 ability.
 * @param {GameEvent[]} log
 * @param {number} player
 * @param {string} civ
 * @returns {number[]}
 */
function abilityTurns(log, player, civ) {
	let turn = 0;
	/** @type {number[]} */
	const turns = [];
	for (const event of log) {
		if (event.player !== player) {
			continue;
		}
		if (event.type === 'incomeTurnStarted') {
			turn = event.turn;
		} else if (event.type === 'civAbilityUsed' && event.civ === civ) {
			turns.push(turn);
		}
	}
	return turns;
}

/**
 * A civilization's name, from the asset catalog.
 * @param {string} id
 */
const nameOf = (id) => ASSETS.find((a) => a.id === `civ/${id}`)?.name;

/** The base civilizations, then Plans & Ploys' built ones (#33), each group with the expansions it needs. */
const GROUPS = [
	{ ids: BASE_CIVS, expansions: /** @type {string[]} */ ([]) },
	{ ids: PP_CIVS, expansions: ['pp'] },
];

for (const version of VERSIONS) {
	for (const { ids, expansions } of GROUPS) {
		for (const [i, id] of ids.entries()) {
			// The other seat plays the next civilization in the list, so each one is also played as an opponent.
			// A lone expansion civilization is paired with a base one instead.
			const civs = [
				id,
				ids.length > 1 ? ids[(i + 1) % ids.length] : BASE_CIVS[0],
			];
			test(`every civilization plays its setup and every income turn to the end in both versions: ${nameOf(id)} (${version})`, () => {
				const plays = /** @type {[string, Choose][]} */ ([
					['default answers', defaults],
					['a busy game', eager()],
				]);
				for (const [how, choose] of plays) {
					const { state: started, random } = startedGame(2, {
						civs,
						version,
						expansions,
					});
					assert.deepEqual(
						started.seats.map(
							(s) => /** @type {any} */ (s).civs[0]
						),
						civs
					);
					let played;
					try {
						played = playToEnd(started, random, choose);
					} catch (error) {
						const failure = /** @type {Error} */ (error);
						failure.message = `${how}: ${failure.message}`;
						throw failure;
					}
					const { state, log } = played;
					assert.equal(state.phase, 'over', how);
					assert.deepEqual(openDecisions(state), [], how);
					assert.ok(state.result, how);
					for (const [seat, civ] of civs.entries()) {
						const player = seat + 1;
						assert.equal(
							/** @type {any} */ (state.seats[seat]).incomeTurns,
							5,
							how
						);
						// Step 1 of each income turn the ability fires on, and of no other.
						assert.deepEqual(
							abilityTurns(log, player, civ),
							CIVS[civ].incomeTurns ?? [],
							`${how}: ${civ}'s ability turns (seat ${player})`
						);
					}
				}
			});
		}
	}
}

// R113: a gained civilization's printed start applies, so one seat may hold two Plans & Ploys civilizations. Every
// ordered pair is played from the first seat's start (A) with B gained mid-game, to the end, answered at random from
// each seat's own view, with the invariants and the views checked after every action. One version per pair, alternating.
test('one seat holding two Plans & Ploys civilizations, the second gained mid-game, plays to the end for every pair (R113)', () => {
	let pairs = 0;
	for (const a of PP_CIVS) {
		for (const b of PP_CIVS) {
			if (a === b) {
				continue;
			}
			const version = VERSIONS[pairs % VERSIONS.length];
			pairs += 1;
			const name = `${a} + ${b} (${version})`;
			const { state: started, random } = startedGame(2, {
				civs: [a, 'leaders'],
				expansions: ['pp'],
				version,
				keepIncome: true,
			});
			let state = structuredClone(started);
			// B on top of the civilization deck, whichever pile it was in, gained by seat 1 on top of what is open.
			for (const list of [state.supply.civs, state.supply.civDiscard]) {
				const at = list.indexOf(b);
				if (at !== -1) {
					list.splice(at, 1);
				}
			}
			state.supply.civs.unshift(b);
			const ctx = contextFor(state, random, state.pending);
			ctx.push([
				{ player: 1, kind: 'effects', effects: [{ gainCiv: {} }] },
			]);
			run(state, random);
			const pick = seededRandom(pairs * 7919);
			const facts = setupFacts(state);
			let actions = 0;
			for (;;) {
				const open = openDecisions(state);
				if (open.length === 0) {
					break;
				}
				assert.ok(++actions < 4000, `${name}: the game never ended`);
				const decision = open[pick(open.length)];
				const seat = /** @type {number} */ (decision.player);
				const seen = allOps(view(state, seat)).find(
					(op) => op.id === decision.id
				);
				const answers = seen?.answers ?? [];
				let answer;
				if (decision.kind === 'chooseTurn') {
					const advances = answers.filter(
						(x) => x.turn === 'advance'
					);
					answer =
						advances.length > 0 && pick(100) < 80
							? advances[pick(advances.length)]
							: answers[pick(answers.length)];
				} else {
					answer = answers[pick(answers.length)];
				}
				const before = state;
				try {
					state = play(
						state,
						seat,
						{ decision: decision.id, ...answer },
						random
					);
					checkState(state, before.seq);
					checkViews(state, facts, { before });
				} catch (error) {
					const failure = /** @type {Error} */ (error);
					failure.message = `${name}, action ${actions} (${decision.kind}): ${failure.message}`;
					throw failure;
				}
			}
			assert.equal(state.phase, 'over', name);
		}
	}
});
