// One random legal game from setup to the end, checked after every action: the simulation's game (#21 design §4).
import assert from 'node:assert/strict';
import { createGame, play, VARIANTS, view } from '../../src/lib/engine/game.js';
import { openDecisions } from '../../src/lib/engine/stack.js';
import { seededRandom } from '../../src/lib/engine/random.js';
import { checkState } from './invariants.mjs';
import { allOps, checkViews, setupFacts } from './views.mjs';

/** @typedef {import('../../src/lib/engine/state.js').State} State */
/** @typedef {import('../../src/lib/engine/state.js').Answer} Answer */
/** @typedef {import('./views.mjs').SetupFacts} SetupFacts */
/**
 * How one game is played.
 * @typedef {Object} Game
 * @property {number} seed
 * @property {number} players - 1 to 5
 * @property {'original' | 'current'} version
 * @property {'random' | 'busy'} policy - `busy` takes an offered advance turn 85% of the time
 * @property {string[]} variants - Every variant, or none (#53)
 */
/** @typedef {(state: State, before: State | null, facts: SetupFacts) => void} Check - `before` is null right after createGame() */

/** How many games the simulation plays (the issue's 200). */
export const GAMES = 200;

/** Most actions one game may take before it counts as stuck. */
const LIMIT = 5000;

/** How often, in percent, the busy policy takes an offered advance turn. */
const ADVANCE_PERCENT = 85;

const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

/**
 * Game `index`'s seed, players, version, policy and variants: every 10 games in a row share a policy, every 5 a
 * version, so each of the 20 combinations gets 10 of the 200 games. Every other 20 games play with every variant on,
 * so each combination gets 5 games with them and 5 without (#53).
 * @param {number} index - From 0
 * @returns {Game}
 */
export function gameOf(index) {
	return {
		seed: index + 1,
		players: 1 + (index % 5),
		version: Math.floor(index / 5) % 2 === 0 ? 'original' : 'current',
		policy: Math.floor(index / 10) % 2 === 0 ? 'random' : 'busy',
		variants:
			Math.floor(index / 20) % 2 === 1 ? VARIANTS.map((v) => v.id) : [],
	};
}

/**
 * Every check of the design: the state invariants, then every view.
 * @type {Check}
 */
function checkAll(state, before, facts) {
	checkState(state, before?.seq ?? 0);
	checkViews(state, facts, { before });
}

/**
 * Picks an answer the way the game's policy plays.
 * @param {Game} game
 * @param {import('../../src/lib/engine/random.js').Random} pick
 * @param {string} kind
 * @param {Answer[]} answers - Never empty
 * @returns {Answer}
 */
function choose(game, pick, kind, answers) {
	if (game.policy === 'busy' && kind === 'chooseTurn') {
		const advances = answers.filter((a) => a.turn === 'advance');
		if (advances.length > 0 && pick(100) < ADVANCE_PERCENT) {
			return advances[pick(advances.length)];
		}
	}
	return answers[pick(answers.length)];
}

/**
 * Plays game `index` from createGame() to the final ranking with random legal answers, checking after every action.
 * Answers come from the acting player's own view, as a client gets them.
 * @param {number} index - From 0; game `index` uses seed `index + 1`
 * @param {{ check?: Check }} [options] - `check` replaces the design's checks (for testing the reports)
 * @returns {{ actions: number }}
 * @throws {Error} Naming the seed, the game, the action and how to replay it
 */
export function simulate(index, { check = checkAll } = {}) {
	const game = gameOf(index);
	const random = seededRandom(game.seed);
	const pick = seededRandom(game.seed * 7919);
	let actions = 0;
	let kind = 'createGame';
	try {
		let state = createGame({
			players: NAMES.slice(0, game.players).map((name) => ({ name })),
			version: game.version,
			variants: game.variants,
			random,
		});
		const facts = setupFacts(state);
		check(state, null, facts);
		for (;;) {
			const open = openDecisions(state);
			if (open.length === 0) {
				break;
			}
			assert.ok(actions < LIMIT, `the game never ended`);
			actions += 1;
			const decision = open[pick(open.length)];
			kind = decision.kind;
			const seat = /** @type {number} */ (decision.player);
			const seen = allOps(view(state, seat)).find(
				(op) => op.id === decision.id
			);
			const answer = choose(game, pick, kind, seen?.answers ?? []);
			const before = state;
			state = play(
				state,
				seat,
				{ decision: decision.id, ...answer },
				random
			);
			check(state, before, facts);
		}
		kind = 'the end';
		assert.equal(state.phase, 'over');
		for (const seat of state.seats) {
			assert.ok(seat.finished, `seat ${seat.seat} hasn't finished`);
			assert.equal(
				seat.incomeTurns,
				5,
				`seat ${seat.seat}'s income turns`
			);
		}
		assert.deepEqual(
			state.result?.ranking.map((p) => p.seat).sort(),
			state.seats.map((s) => s.seat),
			'the ranking'
		);
	} catch (error) {
		const failure = /** @type {Error} */ (error);
		throw new Error(
			`seed ${game.seed}, ${game.players} players, ${game.version}, ${game.policy} play, ` +
				`${game.variants.length > 0 ? 'all' : 'no'} variants, ` +
				`action ${actions} (${kind}): ${failure.message}\n` +
				`Replay: SIM_SEED=${game.seed} npx vitest run tests/simulation.test.mjs`,
			{ cause: failure }
		);
	}
	return { actions };
}
