// Answering a decision from the browser (#26 design §6): one move with the table's version, and which seat a hot-seat table shows.
import { ApiError } from './api.js';
import { askedSeats } from './engine/game.js';

/**
 * Sends one move: an answer to an open decision. A stale version (409) is not sent again, because a move that was
 * legal may not be any more; the error carries the newer table as `room` instead.
 * @param {(endpoint: string, body?: Record<string, unknown>) => Promise<any>} request - An Api's request
 * @param {{ version: number }} room - The table as the player saw it
 * @param {number | null} seat - The seat answering at a hot-seat table, where it is required; null online
 * @param {{ decision: number } & Record<string, unknown>} action
 * @returns {Promise<any>} The room view after the move
 * @throws {ApiError}
 */
export async function sendMove(request, room, seat, action) {
	try {
		return await request('move', {
			version: room.version,
			...(seat === null ? {} : { seat }),
			action,
		});
	} catch (error) {
		if (!(error instanceof ApiError) || error.status !== 409) {
			throw error;
		}
		const stale = new ApiError(409, 'The table changed. Try again.');
		stale.room = await request(
			seat === null ? 'state' : `state?seat=${seat}`
		);
		throw stale;
	}
}

/**
 * The seat a hot-seat table shows: the lowest one being asked, until the pass screen (#30) asks before showing it.
 * Online, the server shows the person's own seat, so there is nothing to choose.
 * @param {{ mode: string, game: any, you: number[] }} room - A room view
 * @returns {number | null}
 */
export function seatToShow(room) {
	if (room.mode !== 'hotseat' || !room.game) {
		return null;
	}
	return (
		askedSeats(room.game).find((seat) => room.you.includes(seat)) ?? null
	);
}
