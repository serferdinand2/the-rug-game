// Test helpers for the arts track (#35): an A&A game, an advance onto an arts space, and answering what it asks.
import assert from 'node:assert/strict';
import { openDecisions } from '../../src/lib/engine/stack.js';
import { DECISIONS } from '../../src/lib/engine/kinds.js';
import { play } from '../../src/lib/engine/play.js';
import { answer, placeAll, readyTurn } from './engine.mjs';

/** The options of a game with Arts & Architecture, and so the arts track. */
export const AA = Object.freeze({ expansions: ['aa'] });

/**
 * A test's running game: its state, random, the player who advanced and that player's seat in the state.
 * @typedef {{ state: any, random: any, player: number, seat: any }} Run
 */

/**
 * Advances the current player of an A&A game onto an arts space from the space before it, holding 2 of each resource,
 * paying the first way the engine offers; `fill` changes their seat (and the state) first.
 * @param {number} space
 * @param {(seat: any, state: any) => void} [fill]
 * @param {number} [count] - Players, 2 by default
 * @returns {Run}
 */
export function ontoArts(space, fill = () => {}, count = 2) {
	const ready = readyTurn(
		count,
		(seat, state) => {
			seat.tracks.arts = [space - 1];
			seat.resources = { coin: 2, worker: 2, food: 2, culture: 2 };
			fill(seat, state);
		},
		AA
	);
	const { random, player } = ready;
	const chosen = answer(ready.state, random, player, 'chooseTurn', {
		turn: 'advance',
	});
	const [decision] = openDecisions(chosen);
	const move = DECISIONS.chooseAdvance
		.answers(chosen, decision)
		.find((a) => a.track === 'arts' && a.from === space - 1);
	assert.ok(move, `an advance onto arts ${space}`);
	const state = play(
		chosen,
		player,
		{ decision: decision.id, ...move },
		random
	);
	return { state, random, player, seat: state.seats[player - 1] };
}

/**
 * The kinds of the open decisions.
 * @param {{ state: any }} result
 * @returns {string[]}
 */
export const kinds = ({ state }) => openDecisions(state).map((d) => d.kind);

/**
 * Answers the open decision of a kind for the player who advanced.
 * @param {Run} r - Changed: its state becomes the new one
 * @param {string} kind
 * @param {Record<string, any>} reply
 * @returns {Run}
 */
export function reply(r, kind, reply) {
	r.state = answer(r.state, r.random, r.player, kind, reply);
	r.seat = r.state.seats[r.player - 1];
	return r;
}

/**
 * Answers every open capital placement with its first answer.
 * @param {Run} r - Changed: every open placement is answered
 * @returns {Run}
 */
export function place(r) {
	r.state = placeAll(r.state, r.random);
	r.seat = r.state.seats[r.player - 1];
	return r;
}
