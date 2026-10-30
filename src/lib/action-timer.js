// The 4-second timer of what another player just did (#153, owner 2026-10-30): it runs down, stops while hovered, and goes on, with the time passed in.

/** How long one display stays, in milliseconds, unless hovered (owner, 2026-10-30). */
export const ACTION_MS = 4000;

/**
 * A timer: how long it runs, the time it has already spent, and since when it has been running (null while paused).
 * @typedef {Object} ActionTimer
 * @property {number} duration - Milliseconds in all
 * @property {number} spent - Milliseconds spent before the current run
 * @property {number | null} since - When the current run began, or null while paused
 */

/**
 * A timer that starts running now.
 * @param {number} now - The time, in milliseconds
 * @param {number} [duration=ACTION_MS]
 * @returns {ActionTimer}
 */
export function startTimer(now, duration = ACTION_MS) {
	return { duration, spent: 0, since: now };
}

/**
 * The timer stopped, keeping the time it has left; a paused timer stays as it is.
 * @param {ActionTimer} timer
 * @param {number} now
 * @returns {ActionTimer}
 */
export function pauseTimer(timer, now) {
	if (timer.since === null) {
		return timer;
	}
	return {
		...timer,
		spent: Math.min(timer.duration, timer.spent + (now - timer.since)),
		since: null,
	};
}

/**
 * The timer running again from where it stopped; a running timer stays as it is.
 * @param {ActionTimer} timer
 * @param {number} now
 * @returns {ActionTimer}
 */
export function resumeTimer(timer, now) {
	return timer.since === null ? { ...timer, since: now } : timer;
}

/**
 * The milliseconds the timer has left, never below 0.
 * @param {ActionTimer} timer
 * @param {number} now
 * @returns {number}
 */
export function timeLeft(timer, now) {
	const running = timer.since === null ? 0 : now - timer.since;
	return Math.max(0, timer.duration - timer.spent - running);
}

/**
 * Whether the timer has run out.
 * @param {ActionTimer} timer
 * @param {number} now
 * @returns {boolean}
 */
export function timerOver(timer, now) {
	return timeLeft(timer, now) === 0;
}
