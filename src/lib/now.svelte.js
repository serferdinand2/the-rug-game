// The browser's time for the turn clocks (#89): one timer ticks four times a second while any screen reads it.
import { createSubscriber } from 'svelte/reactivity';

/** How often the clocks tick, in milliseconds. */
const TICK_MS = 250;

const subscribe = createSubscriber((update) => {
	const timer = setInterval(update, TICK_MS);
	return () => clearInterval(timer);
});

/**
 * The browser's time, for counting a clock down. Read in an effect or the markup, `now` changes four times a
 * second; the timer stops once nothing reads it.
 */
export const clockTime = {
	get now() {
		subscribe();
		return Date.now();
	},
};
