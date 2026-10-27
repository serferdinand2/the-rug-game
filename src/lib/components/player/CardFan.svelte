<!-- CardFan: cards laid side by side and overlapping; the hovered or focused one rises to the front without moving the others. -->
<script module>
	/**
	 * Properties of the CardFan component itself.
	 * @typedef {Object} CardFanOwnProps
	 * @property {any[]} items - One entry per card, passed to the `card` snippet
	 * @property {import('svelte').Snippet<[any, number]>} card - Draws one card from its item and index
	 * @property {number} [overlap=54] - How many pixels each card hides under the one before it
	 * @property {number | null} [selected=null] - The index of the chosen card, outlined in gold
	 * @property {string} [label='Cards'] - Names the list for assistive technology
	 * @property {Function} [onCardFanInspect] - Callback fired with { index } on hover or focus, and { index: null } on leave
	 * @property {Function} [onCardFanSelect] - Callback fired with { index } when a card is clicked or chosen with Enter
	 */

	/**
	 * Properties for the CardFan component, including any attributes for its root element.
	 * @typedef {CardFanOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} CardFanProps
	 *
	 * @example
	 * <CardFan items={hand} onCardFanInspect={(event) => (shown = event.value.index)}>
	 *   {#snippet card(item)}<TapestryCard id={item} />{/snippet}
	 * </CardFan>
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {CardFanProps} */
	let {
		items,
		card,
		overlap = 54,
		selected = null,
		label = 'Cards',
		onCardFanInspect,
		onCardFanSelect,
		...attr
	} = $props();

	/**
	 * @param {Event} event
	 * @param {number | null} index
	 */
	function inspect(event, index) {
		if (typeof onCardFanInspect === 'function') {
			const target = /** @type {HTMLElement} */ (
				/** @type {unknown} */ (event.currentTarget)
			);
			onCardFanInspect(new ComponentEvent({ index }, target, event));
		}
	}

	/**
	 * @param {Event} event
	 * @param {number} index
	 */
	const cardEnterHandler = (event, index) => {
		inspect(event, index);
	};

	/** @param {Event} event */
	const cardLeaveHandler = (event) => {
		inspect(event, null);
	};

	/**
	 * @param {MouseEvent} event
	 * @param {number} index
	 */
	const cardClickHandler = (event, index) => {
		if (typeof onCardFanSelect === 'function') {
			const target = /** @type {HTMLElement} */ (
				/** @type {unknown} */ (event.currentTarget)
			);
			onCardFanSelect(new ComponentEvent({ index }, target, event));
		}
	};
</script>

<div
	role="group"
	aria-label={label}
	{...attr}
	class="rg-card-fan {attr.class ?? ''}">
	{#each items as item, index (index)}
		<button
			type="button"
			class="rg-card-fan--card"
			class:rg-card-fan--selected={index === selected}
			style:margin-left={index === 0 ? '0' : `${-overlap}px`}
			aria-pressed={selected === null ? undefined : index === selected}
			onmouseenter={(event) => cardEnterHandler(event, index)}
			onmouseleave={cardLeaveHandler}
			onfocus={(event) => cardEnterHandler(event, index)}
			onblur={cardLeaveHandler}
			onclick={(event) => cardClickHandler(event, index)}>
			{@render card(item, index)}
		</button>
	{/each}
</div>

<style>
	.rg-card-fan {
		display: flex;
		align-items: flex-start;
		padding: var(--space-3) 0 var(--space-8);
	}

	.rg-card-fan--card {
		position: relative;
		flex: none;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		box-shadow: var(--shadow-card);
		transition: transform var(--duration-fast) var(--ease);
	}

	/* Raised cards sit on top without shifting their neighbours. */
	.rg-card-fan--card:hover,
	.rg-card-fan--card:focus-visible {
		z-index: var(--layer-bar);
		transform: translateY(calc(-1 * var(--space-4)));
	}

	.rg-card-fan--card:focus-visible {
		outline: var(--focus-outline);
		outline-offset: var(--focus-offset);
	}

	.rg-card-fan--selected {
		outline: var(--focus-outline);
		outline-offset: var(--focus-offset);
	}
</style>
