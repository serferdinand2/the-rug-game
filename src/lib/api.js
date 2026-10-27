// The browser's way to the table API (#25): requests carrying the guest's token, and errors a player can read.

/**
 * Where the tab keeps its session: sessionStorage in the browser, a Map-backed object in tests.
 * @typedef {Object} SessionStore
 * @property {(key: string) => string | null} getItem
 * @property {(key: string, value: string) => void} setItem
 * @property {(key: string) => void} removeItem
 */

/**
 * An answer outside 200, or no answer at all (status 0), with a message for the player.
 */
export class ApiError extends Error {
	/**
	 * @param {number} status - The HTTP status, or 0 when the server couldn't be reached
	 * @param {string} message
	 */
	constructor(status, message) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		/** @type {any} The newer table, when a change met a stale version (changes.js) */
		this.room = null;
	}
}

const TOKEN = 'rg-token';
const NAME = 'rg-name';

/**
 * The client for one browser tab. The token lives in the tab's storage, so a refresh keeps the session and each tab
 * is its own guest (#25 design §7.1).
 * @param {{ base: string, fetch: typeof globalThis.fetch, storage: SessionStore }} options - `base` ends with a slash,
 *   such as '/api/'
 */
export function createApi({ base, fetch, storage }) {
	/**
	 * Sends one request: GET without a body, POST with one.
	 * @param {string} endpoint - After the base, with any query, such as 'state?since=4'
	 * @param {Record<string, unknown>} [body]
	 * @returns {Promise<any>} The answer's JSON
	 * @throws {ApiError}
	 */
	async function request(endpoint, body) {
		const token = storage.getItem(TOKEN);
		/** @type {Response} */
		let res;
		try {
			res = await fetch(base + endpoint, {
				method: body === undefined ? 'GET' : 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				...(body === undefined ? {} : { body: JSON.stringify(body) }),
			});
		} catch {
			throw new ApiError(0, "Can't reach the server.");
		}
		const text = await res.text();
		/** @type {any} */
		let data = null;
		try {
			data = text ? JSON.parse(text) : null;
		} catch {
			data = null;
		}
		if (!res.ok) {
			if (res.status === 401) {
				storage.removeItem(TOKEN);
			}
			throw new ApiError(
				res.status,
				typeof data?.error === 'string'
					? data.error
					: 'Something went wrong. Try again.'
			);
		}
		return data;
	}

	/**
	 * Signs in as a new guest and keeps the token and the name the server settled on.
	 * @param {string} name
	 * @returns {Promise<string>} The cleaned name
	 */
	async function signIn(name) {
		const answer = await request('login', { name });
		storage.setItem(TOKEN, answer.token);
		storage.setItem(NAME, answer.name);
		return answer.name;
	}

	/** Forgets the session and the name. */
	function signOut() {
		storage.removeItem(TOKEN);
		storage.removeItem(NAME);
	}

	return {
		request,
		signIn,
		signOut,
		/** @returns {string | null} */
		token: () => storage.getItem(TOKEN),
		/** @returns {string | null} The name last signed in with, kept to fill the name field */
		name: () => storage.getItem(NAME),
	};
}

/** @typedef {ReturnType<typeof createApi>} Api */
