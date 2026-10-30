// The hot-seat hand-over (#30 design §2–§6): which view the client takes or asks for, and whom the pass screen names.
import { freshEvents, liveEvents } from './event-feed.js';
import { seatToShow } from './moves.js';
import { seatName } from './game-names.js';

/** @typedef {import('./event-feed.js').GameEvent} GameEvent */

/**
 * The parts of a room view the hand-over reads.
 * @typedef {{ code: string, version: number, deal?: number, mode: string, game: any, you: number[], viewing: number | null }} PassRoom
 */

/**
 * Where a hot-seat screen stands after a room view arrives.
 * @typedef {Object} HandOver
 * @property {number | null} shown - The seat whose view may be on show; null for the public view
 * @property {number | null} passing - The player the pass screen names, or null when there is no pass screen
 * @property {number | null | undefined} fetch - The view to ask for instead of taking the room: a seat, or null for
 *   the public view; undefined takes the room as it is
 */

/**
 * The hand-over for a room view that arrived. At a hot-seat table the screen passes whenever another player is to be
 * shown: the pass screen names them, and only the public view is held until they take the screen. It then holds that
 * player, even when the game moves on, so every asked defender gets the same pass screen and wait (#17). A player
 * takes the screen by making `shown` equal to `passing`; the pass screen goes once their view arrives. A finished game
 * shows the public view. Online, nothing is handed over.
 * @param {{ mode: string, game: any, you: number[], viewing: number | null }} room - The room view that arrived
 * @param {number | null} shown - The seat on show, or taken, now
 * @param {number | null} passing - The player the pass screen names now
 * @returns {HandOver}
 */
export function handOver(room, shown, passing) {
	if (room.mode !== 'hotseat' || !room.game) {
		return { shown: null, passing: null, fetch: undefined };
	}
	/** The public view while the pass screen names `player` (or, with null, at the game's end). */
	const publicView = (/** @type {number | null} */ player) => ({
		shown: null,
		passing: player,
		fetch: room.viewing === null ? undefined : null,
	});
	if (room.game.phase === 'over') {
		return publicView(null);
	}
	if (passing !== null && shown !== passing) {
		return publicView(passing);
	}
	if (passing !== null && room.viewing !== passing) {
		// Taken: the pass screen stays until the player's own view arrives.
		return { shown: passing, passing, fetch: passing };
	}
	const wanted = seatToShow(room);
	if (wanted !== null && wanted !== shown) {
		return publicView(wanted);
	}
	return {
		shown,
		passing: null,
		fetch: room.viewing === shown ? undefined : shown,
	};
}

/**
 * What the store does with a room view that arrived (#130).
 * @typedef {Object} AcceptStep
 * @property {boolean} take - Whether the room view is shown
 * @property {number | null | undefined} fetch - The view to ask for, as HandOver's
 * @property {number | null} shown - The seat whose view may be on show, as HandOver's
 * @property {number | null} passing - The player the pass screen names, as HandOver's
 * @property {GameEvent[]} fresh - The events to sound, animate and announce
 */

/**
 * What the store does with a room view that arrives: an older answer after a newer one is dropped; at a hot-seat
 * table only the view the hand-over allows is shown, and a room for another seat is swapped for the right one
 * (#26 review, #30). The view of the player holding the screen is theirs to see: the move that brings a pass screen,
 * or ends the game, shows at once (the pass screen or the results cover it) until the public view replaces it, and
 * still sounds. Events that arrive while a pass screen is up stay silent (#30 design §4).
 * @param {PassRoom | null} current - The room view on show, or null
 * @param {PassRoom} incoming - The room view that arrived
 * @param {number | null} shown - The seat on show, or taken, now
 * @param {number | null} passing - The player the pass screen names now
 * @returns {AcceptStep}
 */
export function acceptStep(current, incoming, shown, passing) {
	if (
		current &&
		incoming.code === current.code &&
		incoming.version < current.version
	) {
		return { take: false, fetch: undefined, shown, passing, fresh: [] };
	}
	const step = handOver(incoming, shown, passing);
	const wasPassing = passing !== null;
	const own =
		!wasPassing && incoming.viewing !== null && incoming.viewing === shown;
	const take = step.fetch === undefined || !current || own;
	return {
		take,
		fetch: step.fetch,
		shown: step.shown,
		passing: step.passing,
		fresh: take && !wasPassing ? freshEvents(current, incoming) : [],
	};
}

/**
 * The events a hot-seat player is handed when they take the screen (#153): those after the last one they saw, without
 * what an undo took back, oldest first.
 * @param {GameEvent[] | null | undefined} events - The game's events, oldest first
 * @param {number} since - The seq of the last event the player saw
 * @returns {GameEvent[]}
 */
export function handedEvents(events, since) {
	if (!Array.isArray(events)) {
		return [];
	}
	return liveEvents(events).filter((event) => event.seq > since);
}

/**
 * The pass screen's reason line, from the public view: the player's turn, their setup, or any other question. A
 * conquest's response question reads like any other, so it gives no trap away (#17).
 * @param {{ phase: string, current: number | null, seats: { name: string }[] }} game - A game view
 * @param {number} seat - The player the pass screen names
 * @returns {string}
 */
export function passReason(game, seat) {
	const name = seatName(game, seat);
	if (game.phase === 'setup') {
		return `${name}'s setup choices.`;
	}
	if (game.current === seat) {
		return `It's ${name}'s turn.`;
	}
	return `${name} has a choice to make.`;
}
