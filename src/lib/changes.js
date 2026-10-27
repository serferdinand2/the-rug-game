// A table change that survives someone else changing the table first (#25 design §7.2).
import { ApiError } from './api.js';

/**
 * Whether two room views seat the same people: the same names in the same order.
 * @param {{ seats: { name: string }[] }} a
 * @param {{ seats: { name: string }[] }} b
 * @returns {boolean}
 */
export function sameSeats(a, b) {
	return (
		a.seats.length === b.seats.length &&
		a.seats.every((seat, i) => seat.name === b.seats[i].name)
	);
}

/**
 * Sends a change with the table's version. When the version was stale (409) and the seats are still the same, it is
 * sent once more with the newer version: each change sets a value or names a seat that hasn't moved, so sending it
 * again means what the player meant. When the seats changed, the player decides again.
 * @param {(endpoint: string, body?: Record<string, unknown>) => Promise<any>} request - An Api's request
 * @param {string} endpoint
 * @param {Record<string, unknown>} body - Without the version
 * @param {{ version: number, seats: { name: string }[] }} room - The table as the player saw it
 * @returns {Promise<any>} The room view after the change
 * @throws {ApiError} A 409 carrying the newer table as `room` when the seats changed, or any other refusal
 */
export async function change(request, endpoint, body, room) {
	try {
		return await request(endpoint, { ...body, version: room.version });
	} catch (error) {
		if (!(error instanceof ApiError) || error.status !== 409) {
			throw error;
		}
		const fresh = await request('state');
		if (!sameSeats(room, fresh)) {
			const stale = new ApiError(409, 'The table changed. Try again.');
			stale.room = fresh;
			throw stale;
		}
		return await request(endpoint, { ...body, version: fresh.version });
	}
}
