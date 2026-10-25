// Every base civilization plays its setup, its income turns and the game end, in both versions (#20, design §11).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { play } from '../src/lib/engine/play.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { CIVS } from '../src/lib/engine/civs/index.js';
import { BASE_CIVS } from '../src/lib/engine/decks.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { ASSETS } from '../src/lib/art/catalog.js';
import { startedGame } from './helpers/engine.mjs';

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

for (const version of VERSIONS) {
	for (const [i, id] of BASE_CIVS.entries()) {
		// The other seat plays the next civilization in the list, so each one is also played as an opponent.
		const civs = [id, BASE_CIVS[(i + 1) % BASE_CIVS.length]];
		test(`every civilization plays its setup and four income turns to the end in both versions: ${nameOf(id)} (${version})`, () => {
			const plays = /** @type {[string, Choose][]} */ ([
				['default answers', defaults],
				['a busy game', eager()],
			]);
			for (const [how, choose] of plays) {
				const { state: started, random } = startedGame(2, {
					civs,
					version,
				});
				assert.deepEqual(
					started.seats.map((s) => /** @type {any} */ (s).civs[0]),
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
