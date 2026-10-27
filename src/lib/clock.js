// The time left on a player's turn clock, corrected to the server's time.

/**
 * @typedef {Object} Clock
 * @property {number} seat - The seat the clock belongs to
 * @property {number} [ends] - Server time in ms when a running clock runs out
 * @property {number} [left] - Milliseconds a paused clock has left
 * @property {boolean} expired - Whether the clock has run out
 */

/**
 * Milliseconds left on a clock, never below 0.
 * @param {Clock} clock - A clock from the room view
 * @param {number} serverNow - The view's `now`, the server's time when it answered
 * @param {number} receivedAt - The browser's time when the answer arrived
 * @param {number} now - The browser's time now
 * @returns {number}
 * @example
 * timeLeft({ seat: 1, ends: 100_000, expired: false }, 90_000, 5_000, 7_500); // 7500
 */
export function timeLeft(clock, serverNow, receivedAt, now) {
	if (clock.expired) {
		return 0;
	}
	if (typeof clock.ends === 'number') {
		return Math.max(0, clock.ends - serverNow - (now - receivedAt));
	}
	return Math.max(0, clock.left ?? 0);
}

/**
 * Minutes and seconds, rounded up to the next whole second.
 * @param {number} ms
 * @returns {string} Such as '1:42'.
 * @example
 * formatClock(4_200); // '0:05'
 */
export function formatClock(ms) {
	const total = Math.ceil(Math.max(0, ms) / 1000);
	const seconds = String(total % 60).padStart(2, '0');
	return `${Math.floor(total / 60)}:${seconds}`;
}
