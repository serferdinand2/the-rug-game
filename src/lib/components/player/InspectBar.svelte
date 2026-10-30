<!-- The line over another player's tabs (#145): "Viewing Vera's area" with their colour square, and Back to your area. -->
<script module>
	/**
	 * Properties of the InspectBar component itself.
	 * @typedef {Object} InspectBarOwnProps
	 * @property {string} text - What is on show, such as "Viewing Vera's area"
	 * @property {import('../../ui.js').Seat} seat - The player on show, whose colour the square takes
	 * @property {boolean} [back=true] - Offer Back to your area; the public view has no own area to go back to
	 * @property {Function} [onInspectBarBack] - Callback fired with the seat on show when Back to your area is pressed
	 */

	/**
	 * Properties for the InspectBar component, including any attributes for its root element.
	 * @typedef {InspectBarOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} InspectBarProps
	 *
	 * @example
	 * <InspectBar
	 *   text="Viewing Vera's area"
	 *   seat={2}
	 *   onInspectBarBack={() => (inspected = null)}
	 * />
	 */
</script>

<script>
	import Button from '../ui/Button.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { playerColor } from '../../ui.js';

	/** @type {InspectBarProps} */
	let { text, seat, back = true, onInspectBarBack, ...attr } = $props();

	/**
	 * @param {ComponentEvent} event - From Button
	 */
	const backClickHandler = (event) => {
		if (typeof onInspectBarBack === 'function') {
			onInspectBarBack(
				new ComponentEvent(seat, event.target, event.originalEvent)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-inspect-bar {attr.class ? attr.class : ''}"
	style:--rg-inspect-bar-color={playerColor(seat)}>
	<i
		class="rg-inspect-bar--color"
		aria-hidden="true"></i>
	<p class="rg-inspect-bar--text">{text}</p>
	{#if back}
		<Button
			size="small"
			onButtonClick={backClickHandler}>Back to your area</Button>
	{/if}
</div>

<style>
	.rg-inspect-bar {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4) 22px;
		border-bottom: var(--border) solid var(--line);
		background: var(--chrome);
	}

	.rg-inspect-bar--color {
		flex: none;
		width: 14px;
		height: 14px;
		background: var(--rg-inspect-bar-color);
	}

	.rg-inspect-bar--text {
		flex: 1;
		min-width: 0;
		margin: 0;
		overflow: hidden;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-tight)
			var(--font-body);
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
