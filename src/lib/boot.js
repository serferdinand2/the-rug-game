// Where a person lands when the page opens (#25 design §7.2): their table, or the landing page.
import { ApiError } from './api.js';

/**
 * Reads the table choices, then, for a tab with a session, who it is and the table it sits at.
 * @param {import('./api.js').Api} api
 * @returns {Promise<{ config: any, me: { name: string, code: string | null, saved: string | null } | null, room: any }>}
 *   `me` is null for a guest with no session, and `room` null when they sit at no table
 * @throws {ApiError} When the server can't be reached or fails
 */
export async function boot(api) {
	const config = await api.request('config');
	if (!api.token()) {
		return { config, me: null, room: null };
	}
	/** @type {{ name: string, code: string | null, saved: string | null }} */
	let me;
	try {
		me = await api.request('me');
	} catch (error) {
		// request() has already forgotten the token.
		if (error instanceof ApiError && error.status === 401) {
			return { config, me: null, room: null };
		}
		throw error;
	}
	if (!me.code) {
		return { config, me, room: null };
	}
	try {
		return { config, me, room: await api.request('state') };
	} catch (error) {
		// The table closed between the two requests.
		if (error instanceof ApiError && error.status === 400) {
			return { config, me: { ...me, code: null }, room: null };
		}
		throw error;
	}
}
