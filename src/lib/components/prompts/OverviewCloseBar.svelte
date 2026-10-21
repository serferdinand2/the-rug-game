<!-- The footer while the players overview is open: one full-width button that closes it, between two upward chevrons. -->
<script module>
	/**
	 * Properties of the OverviewCloseBar component itself.
	 * @typedef {Object} OverviewCloseBarOwnProps
	 * @property {string} [label='Close the players overview'] - The button's text, shown in capitals
	 * @property {Function} [onOverviewCloseBarClick] - Callback fired when the bar is pressed
	 */

	/**
	 * Properties for the OverviewCloseBar component, including any attributes for its root button.
	 * @typedef {OverviewCloseBarOwnProps & import('svelte/elements').HTMLButtonAttributes} OverviewCloseBarProps
	 *
	 * @example
	 * <OverviewCloseBar onOverviewCloseBarClick={() => (overviewOpen = false)} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {OverviewCloseBarProps} */
	let {
		label = 'Close the players overview',
		onOverviewCloseBarClick,
		...attr
	} = $props();

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onOverviewCloseBarClick === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onOverviewCloseBarClick(
				new ComponentEvent(undefined, target, event)
			);
		}
	};
</script>

{#snippet chevron()}
	<svg
		class="rg-overview-close-bar--chevron"
		viewBox="0 0 40 22"
		aria-hidden="true">
		<path d="M3 20V9L20 2l17 7v11l-17-7z" />
	</svg>
{/snippet}

<button
	type="button"
	{...attr}
	class="rg-overview-close-bar {attr.class ? attr.class : ''}"
	onclick={clickHandler}>
	{@render chevron()}
	<span class="rg-overview-close-bar--label">{label}</span>
	{@render chevron()}
</button>

<style>
	.rg-overview-close-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-8);
		width: 100%;
		height: var(--bar-height);
		padding: 0;
		border: 0;
		border-top: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--chrome);
		color: var(--text);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-none)
			var(--font-body);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
		transition:
			color var(--duration-fast) var(--ease),
			text-shadow var(--duration-fast) var(--ease);
	}

	.rg-overview-close-bar:hover,
	.rg-overview-close-bar:focus-visible {
		color: var(--gold);
		text-shadow: var(--text-glow-gold);
	}

	/* Keep the focus outline inside the bar, which sits on the page's bottom edge. */
	.rg-overview-close-bar:focus-visible {
		outline-offset: calc(-1 * (var(--focus-offset) + var(--border-thick)));
	}

	.rg-overview-close-bar--chevron {
		flex: none;
		width: 40px;
		height: 22px;
		fill: var(--faint);
		opacity: 0.48;
		transition:
			fill var(--duration-fast) var(--ease),
			opacity var(--duration-fast) var(--ease),
			filter var(--duration-fast) var(--ease);
	}

	.rg-overview-close-bar:hover .rg-overview-close-bar--chevron,
	.rg-overview-close-bar:focus-visible .rg-overview-close-bar--chevron {
		fill: var(--gold);
		opacity: 0.9;
		filter: drop-shadow(
			0 0 5px color-mix(in srgb, var(--gold) 67%, transparent)
		);
	}
</style>
