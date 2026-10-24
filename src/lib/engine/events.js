// The event log: numbered events kept in the state, trimmed to the newest few.

/** How many of the newest events the state keeps. */
export const EVENT_WINDOW = 500;

/**
 * Numbers an event, appends it to the state's log and drops the oldest events beyond EVENT_WINDOW.
 * @param {{ seq: number, events: import('./state.js').GameEvent[] }} state
 * @param {{ type: string } & Record<string, any>} event
 * @returns {import('./state.js').GameEvent}
 */
export function emit(state, event) {
	state.seq += 1;
	// A copy, so an event never shares an array with the state or a decision.
	const numbered = { ...structuredClone(event), seq: state.seq };
	state.events.push(numbered);
	if (state.events.length > EVENT_WINDOW) {
		state.events.splice(0, state.events.length - EVENT_WINDOW);
	}
	return numbered;
}
