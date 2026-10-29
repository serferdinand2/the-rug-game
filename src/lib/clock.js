// The time left on a player's turn clock, corrected to the server's time, and which clock a screen shows (#89).

/**
 * @typedef {Object} Clock
 * @property {import('./ui.js').Seat} seat - The seat the clock belongs to
 * @property {number} [ends] - Server time in ms when a running clock runs out
 * @property {number} [left] - Milliseconds a paused clock has left
 * @property {boolean} expired - Whether the clock has run out
 */

/**
 * The clock a screen shows (#26 spec §4): the running one, the seat's own first; a paused one only when none runs,
 * again the seat's own first.
 * @param {{ clocks?: Clock[] }} room - A room view
 * @param {number | null} seat - The seat on show, or the player a pass screen names
 * @returns {Clock | null}
 */
export function shownClock(room, seat) {
	const clocks = room.clocks ?? [];
	return (
		clocks.find((c) => c.seat === seat && c.ends !== undefined) ??
		clocks.find((c) => c.ends !== undefined) ??
		clocks.find((c) => c.seat === seat) ??
		clocks[0] ??
		null
	);
}

/**
 * Whether a clock is counting down: it has an end and has not run out.
 * @param {Clock} clock
 * @returns {boolean}
 */
export function isRunning(clock) {
	return clock.ends !== undefined && !clock.expired;
}

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
