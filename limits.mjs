// Request limits and client addresses, kept out of server.mjs so they can be tested without a running server.

/**
 * Counts each address's requests in fixed windows; an address quiet for two windows is forgotten.
 * @param {number | (() => number)} limit - Requests allowed per address in one window, or a function read on every
 *   request, so a limit can change while the server runs
 * @param {number} windowMs - Window length in milliseconds
 * @returns {{ allow: (ip: string, now?: number) => boolean, sweep: (now?: number) => void, readonly size: number }}
 */
export function rateLimiter(limit, windowMs) {
	const counts = new Map();
	return {
		allow(ip, now = Date.now()) {
			let entry = counts.get(ip);
			if (!entry || now - entry.start >= windowMs) {
				entry = { start: now, n: 0 };
				counts.set(ip, entry);
			}
			entry.n++;
			return entry.n <= (typeof limit === 'function' ? limit() : limit);
		},
		sweep(now = Date.now()) {
			for (const [ip, entry] of counts) {
				if (now - entry.start >= 2 * windowMs) {
					counts.delete(ip);
				}
			}
		},
		get size() {
			return counts.size;
		},
	};
}

/**
 * The address a request counts against. Behind one trusted reverse proxy, every request comes from the proxy,
 * which appends the player's address to X-Forwarded-For. Without that trust the header is ignored, so clients
 * can't choose their own address.
 * @param {import('node:http').IncomingMessage} req - The incoming request
 * @param {boolean} trustProxy - Whether TRUST_PROXY is on
 * @returns {string | undefined} The client address.
 */
export function clientAddress(req, trustProxy) {
	const forwarded = req.headers['x-forwarded-for'];
	if (trustProxy && forwarded) {
		return forwarded.split(',').at(-1).trim();
	}
	return req.socket.remoteAddress;
}
