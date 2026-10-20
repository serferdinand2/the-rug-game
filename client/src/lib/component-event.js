// The value every Svelte callback prop receives: what happened, on which element, from which DOM event.

/**
 * Wraps the data a component reports to its parent.
 * @example
 * onTrackSpaceClick(new ComponentEvent({ track, space }, button, event));
 */
export class ComponentEvent {
	/**
	 * @param {any} value - The data being reported (may be undefined)
	 * @param {HTMLElement} target - The element that triggered the event
	 * @param {Event} [originalEvent] - The original DOM event
	 */
	constructor(value, target, originalEvent) {
		this.value = value;
		this.target = target;
		this.originalEvent = originalEvent;
	}
}
