// One random legal game from setup to the end, checked after every action: the simulation's game (#21 design §4).
import assert from 'node:assert/strict';
import { createGame, play, VARIANTS, view } from '../../src/lib/engine/game.js';
import { openDecisions } from '../../src/lib/engine/stack.js';
import { seededRandom } from '../../src/lib/engine/random.js';
import { checkState } from './invariants.mjs';
import {
	allOps,
	checkDecisionSources,
	checkViews,
	setupFacts,
} from './views.mjs';

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
 * @property {string[]} expansions - Plans & Ploys (#32), Arts & Architecture (#35, #36) and Fantasies & Futures
 *   (#39), in any mix
 */
/** @typedef {(state: State, before: State | null, facts: SetupFacts) => void} Check - `before` is null right after createGame() */

/** How many games the simulation plays (the issue's 200). */
export const GAMES = 200;

/** Most actions one game may take before it counts as stuck. */
const LIMIT = 5000;

/** How often, in percent, the busy policy takes an offered advance turn. */
const ADVANCE_PERCENT = 85;

const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

/** The expansions as a failing game's message names them. */
export const EXPANSION_NAMES = Object.freeze(
	/** @type {Record<string, string>} */ ({
		pp: 'Plans & Ploys',
		aa: 'Arts & Architecture',
		ff: 'Fantasies & Futures',
	})
);

/**
 * Game `index`'s seed, players, version, policy and variants: every 10 games in a row share a policy, every 5 a
 * version, so each of the 20 combinations gets 10 of the 200 games. Every other 20 games play with every variant on,
 * so each combination gets 5 games with them and 5 without (#53). Every other 40 games play with Plans & Ploys, so 2
 * of each combination's 5 do (#32). Games 80–159 play with Arts & Architecture, so each combination's 5 play: none,
 * Plans & Ploys, Arts & Architecture, both, none (#35, #36). A variant joins only with its expansion; with Arts &
 * Architecture, "Play without the arts track" goes with it alone and "Roll either science die" with both, since the two
 * can't go together. Alone, Arts & Architecture always plays without the arts track (R59), with its advanced mats (#36).
 * Every fourth game also plays with Fantasies & Futures (#39), so it meets every other mix and every player count.
 * Twin Impact is excluded: these simulations have human-only seats, while that variant requires Shadow.
 * @param {number} index - From 0
 * @returns {Game}
 */
export function gameOf(index) {
	const players = 1 + (index % 5);
	const pp = Math.floor(index / 40) % 2 === 1;
	const aa = Math.floor(index / 80) % 2 === 1;
	const ff = index % 4 === 3;
	const expansions = [
		...(pp ? ['pp'] : []),
		...(aa ? ['aa'] : []),
		...(ff ? ['ff'] : []),
	];
	// R59: no arts track alone, so a solo game with A&A plays without it, and so never with either science die.
	const solo = players === 1;
	const left = aa
		? pp && !solo
			? 'no-arts-track'
			: 'either-science-die'
		: null;
	const chosen =
		Math.floor(index / 20) % 2 === 1
			? VARIANTS.filter(
					(v) =>
						(!v.expansion || expansions.includes(v.expansion)) &&
						v.id !== left &&
						// These simulated seats are all human; Twin Impact requires Shadow.
						v.id !== 'twin-impact'
				).map((v) => v.id)
			: [];
	const variants =
		aa && solo && !chosen.includes('no-arts-track')
			? [...chosen, 'no-arts-track']
			: chosen;
	return {
		seed: index + 1,
		players,
		version: Math.floor(index / 5) % 2 === 0 ? 'original' : 'current',
		policy: Math.floor(index / 10) % 2 === 0 ? 'random' : 'busy',
		variants,
		expansions,
	};
}

/**
 * Every check of the design: the state invariants, then every view.
 * @type {Check}
 */
function checkAll(state, before, facts) {
	checkState(state, before?.seq ?? 0);
	checkViews(state, facts, { before });
	checkDecisionSources(state);
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
			expansions: game.expansions,
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
				game.expansions
					.map((code) => `${EXPANSION_NAMES[code]}, `)
					.join('') +
				`action ${actions} (${kind}): ${failure.message}\n` +
				`Replay: SIM_SEED=${game.seed} npx vitest run tests/simulation.test.mjs`,
			{ cause: failure }
		);
	}
	return { actions };
}
