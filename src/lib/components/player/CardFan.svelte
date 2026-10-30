<!-- CardFan: cards laid side by side and overlapping; the hovered or focused one rises to the front without moving the others. -->
<script module>
	/**
	 * Properties of the CardFan component itself.
	 * @typedef {Object} CardFanOwnProps
	 * @property {any[]} items - One entry per card, passed to the `card` snippet
	 * @property {import('svelte').Snippet<[any, number]>} card - Draws one card from its item and index
	 * @property {(item: any, index: number) => any} [key] - Each card's identity, so a card keeps its button when the items change; left out, its index
	 * @property {number} [overlap=54] - How many pixels each card hides under the one before it
	 * @property {number | number[] | null} [selected=null] - The index of the chosen card, or the indexes of several chosen at once (#92); an array, even an empty one, means a choice is open, so every card says whether it is pressed
	 * @property {number[]} [disabled=[]] - Indexes of cards that can't be pressed now, as when enough are chosen (#92)
	 * @property {string[]} [labels] - Each card's name for assistive technology, by index
	 * @property {'hand' | 'shelf'} [look='hand'] - 'hand': the hovered card rises and the chosen one has the focus outline; 'shelf': as a decision's card shelf, the hovered and chosen cards are outlined in gold, the chosen one glows and lifts, and a disabled one is faded
	 * @property {boolean} [lift=true] - In the shelf look, whether the chosen card lifts; whole cards such as civilizations stay where they stand, so the outline fits them
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
		key,
		overlap = 54,
		selected = null,
		disabled = [],
		labels,
		look = 'hand',
		lift = true,
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

	/**
	 * Whether a card is among the chosen.
	 * @param {number} index
	 */
	function chosen(index) {
		return Array.isArray(selected)
			? selected.includes(index)
			: index === selected;
	}
</script>

<div
	role="group"
	aria-label={label}
	{...attr}
	class="rg-card-fan rg-card-fan--{look} {attr.class ?? ''}"
	class:rg-card-fan--flat={!lift}>
	{#each items as item, index (key ? key(item, index) : index)}
		<button
			type="button"
			class="rg-card-fan--card"
			class:rg-card-fan--selected={chosen(index)}
			style:margin-left={index === 0 ? '0' : `${-overlap}px`}
			aria-pressed={selected === null ? undefined : chosen(index)}
			aria-label={labels?.[index]}
			disabled={disabled.includes(index)}
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

	/* On a shelf the cards stand on one line; the shelf around the fan gives the room. */
	.rg-card-fan--shelf {
		align-items: flex-end;
		padding: 0;
	}

	.rg-card-fan--card {
		position: relative;
		flex: none;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
		transition: transform var(--duration-fast) var(--ease);
	}

	.rg-card-fan--card:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.rg-card-fan--hand .rg-card-fan--card {
		color: inherit;
		font: inherit;
		text-align: left;
		box-shadow: var(--shadow-card);
	}

	/* Raised cards sit on top without shifting their neighbours. */
	.rg-card-fan--hand .rg-card-fan--card:hover,
	.rg-card-fan--hand .rg-card-fan--card:focus-visible {
		z-index: var(--layer-bar);
		transform: translateY(calc(-1 * var(--space-4)));
	}

	.rg-card-fan--hand .rg-card-fan--card:focus-visible {
		outline: var(--focus-outline);
		outline-offset: var(--focus-offset);
	}

	.rg-card-fan--hand .rg-card-fan--selected {
		outline: var(--focus-outline);
		outline-offset: var(--focus-offset);
	}

	/* A shelf's buttons keep the browser's button text, which whole cards such as civilizations inherit. */
	.rg-card-fan--shelf .rg-card-fan--card {
		box-shadow: var(--shadow-float);
	}

	.rg-card-fan--shelf .rg-card-fan--card:hover,
	.rg-card-fan--shelf .rg-card-fan--card:focus-visible {
		z-index: 1;
		outline: var(--border-thick) solid var(--gold);
		outline-offset: 2px;
	}

	/* As specific as the hover and after it, so a chosen card keeps its own outline under the pointer. */
	.rg-card-fan--shelf .rg-card-fan--card.rg-card-fan--selected {
		z-index: 2;
		outline: var(--border-thick) solid var(--gold);
		outline-offset: 3px;
		box-shadow: var(--shadow-float), var(--glow-gold);
		transform: translateY(-14px);
	}

	.rg-card-fan--flat .rg-card-fan--card.rg-card-fan--selected {
		transform: none;
	}
</style>
