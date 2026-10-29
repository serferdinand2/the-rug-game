// Answering a decision from the browser (#26 design §6): one move with the table's version, an advance's two (#86), which seat a hot-seat table shows, and whose screen it is (#100).
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
 * Advances from the turn's footer (#86): from the turn choice it answers "advance" first, then the advance the newest
 * view opens, with the token and payment; from an open advance it answers only that.
 * @param {(action: { decision: number } & Record<string, unknown>) => Promise<boolean>} move - The store's move
 * @param {() => any} next - The viewer's open decision once the turn choice is answered, from the newest view
 * @param {{ id: number, kind: string }} turn - The turn's open decision: chooseTurn or chooseAdvance
 * @param {{ track: string, from: number }} option - The advance: its track and the token's space
 * @param {unknown} pay - The payment, one of the advance's payments
 * @returns {Promise<boolean>} False when the turn choice was refused, so nothing more was sent and the turn is as it was
 */
export async function sendAdvance(move, next, turn, option, pay) {
	if (
		turn.kind === 'chooseTurn' &&
		!(await move({ decision: turn.id, turn: 'advance' }))
	) {
		return false;
	}
	const advance = next();
	if (advance?.kind === 'chooseAdvance') {
		await move({
			decision: advance.id,
			track: option.track,
			from: option.from,
			pay,
		});
	}
	return true;
}

/**
 * The seat of the person at this screen: their own online, and nobody at a hot-seat table, where the whole table
 * shares the screen (#100). Sound cues, the dice tray's caption and the results speak to it as "you".
 * @param {{ mode: string, viewing: number | null } | null} room - A room view
 * @returns {number | null}
 */
export function viewerSeat(room) {
	if (!room || room.mode === 'hotseat') {
		return null;
	}
	return room.viewing;
}

/**
 * The seat a hot-seat table shows: the lowest one being asked. The pass screen (#30, `handOver` in pass.js) hands
 * the screen to it first.
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
