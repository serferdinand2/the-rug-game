<!-- CardFan: cards laid side by side and overlapping; the hovered or focused one rises to the front without moving the others. A shelf's cards are dealt in one after another, a card gained later rises in, and the others close up when one goes (#175). -->
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
	 * @property {boolean} [interactive=true] - Whether cards are buttons that can be hovered, focused or selected; false draws a presentation-only fan
	 * @property {boolean} [wrap=false] - Lay the cards in rows across the fan's width, as many to a row as leave each covered card enough to show its name, instead of one row overlapping by `overlap` (#158)
	 * @property {number} [cardWidth=0] - With `wrap`: one card's drawn width, such as its ScaledCard's
	 * @property {string} [label='Cards'] - Names the list for assistive technology
	 * @property {Function} [onCardFanInspect] - Callback fired with { index, item } on hover or focus, and { index: null, item: null } on leave
	 * @property {Function} [onCardFanSelect] - Callback fired with { index } when a card is clicked or chosen with Enter
	 */

	/**
	 * Properties for the CardFan component, including any attributes for its root element.
	 * @typedef {CardFanOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} CardFanProps
	 *
	 * @example
	 * <CardFan items={hand} onCardFanInspect={(event) => (shown = event.value.item)}>
	 *   {#snippet card(item)}<TapestryCard id={item} />{/snippet}
	 * </CardFan>
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { FAN_ROWS, fanRows } from '../../cards/card-sizes.js';
	import { glide, rise } from '../../transitions.js';

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
		interactive = true,
		wrap = false,
		cardWidth = 0,
		label = 'Cards',
		onCardFanInspect,
		onCardFanSelect,
		...attr
	} = $props();

	/** The fan's width, which a wrapped fan fills with rows. */
	let width = $state(0);
	let rows = $derived(
		wrap ? fanRows(width, cardWidth, items.length, FAN_ROWS) : null
	);

	/**
	 * @param {Event} event
	 * @param {number | null} index
	 */
	function inspect(event, index) {
		if (typeof onCardFanInspect === 'function') {
			const target = /** @type {HTMLElement} */ (
				/** @type {unknown} */ (event.currentTarget)
			);
			onCardFanInspect(
				new ComponentEvent(
					{ index, item: index === null ? null : items[index] },
					target,
					event
				)
			);
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

	/**
	 * A card's pull under the one before it: none for the first, nor in rows, which space their cards by grid.
	 * @param {number} index
	 * @returns {string | undefined}
	 */
	function margin(index) {
		if (rows) {
			return undefined;
		}
		return index === 0 ? '0' : `${-overlap}px`;
	}
</script>

<div
	role="group"
	aria-label={label}
	{...attr}
	class="rg-card-fan rg-card-fan--{look} {attr.class ?? ''}"
	class:rg-card-fan--static={!interactive}
	class:rg-card-fan--flat={!lift}
	class:rg-card-fan--wrap={wrap}
	style:--rg-card-fan-per-row={rows?.perRow}
	style:--rg-card-fan-step={rows ? `${rows.step}px` : undefined}
	bind:clientWidth={width}>
	<!-- Two lists rather than one with an if inside, so each card is the list's own item, which a glide needs (#175). -->
	{#if interactive}
		{#each items as item, index (key ? key(item, index) : index)}
			<button
				type="button"
				class="rg-card-fan--card"
				class:rg-card-fan--selected={chosen(index)}
				style:margin-left={margin(index)}
				style:--rg-card-fan-index={index}
				aria-pressed={selected === null ? undefined : chosen(index)}
				aria-label={labels?.[index]}
				disabled={disabled.includes(index)}
				onmouseenter={(event) => cardEnterHandler(event, index)}
				onmouseleave={cardLeaveHandler}
				onfocus={(event) => cardEnterHandler(event, index)}
				onblur={cardLeaveHandler}
				onclick={(event) => cardClickHandler(event, index)}
				in:rise={{ y: 18 }}
				animate:glide>
				{@render card(item, index)}
			</button>
		{/each}
	{:else}
		{#each items as item, index (key ? key(item, index) : index)}
			<div
				role="img"
				class="rg-card-fan--card"
				style:margin-left={margin(index)}
				style:--rg-card-fan-index={index}
				aria-label={labels?.[index]}
				in:rise={{ y: 18 }}
				animate:glide>
				{@render card(item, index)}
			</div>
		{/each}
	{/if}
</div>

<style>
	.rg-card-fan {
		display: flex;
		align-items: flex-start;
		padding: var(--space-3) 0 var(--space-8);
	}

	/* Rows across the fan's width (issue 158): each column is a step wide and a card overhangs the next one's start, so it
	   covers the card before it; the last card of a row fits, as fanRows() keeps it inside the width. */
	.rg-card-fan--wrap {
		display: grid;
		grid-template-columns: repeat(
			var(--rg-card-fan-per-row),
			var(--rg-card-fan-step)
		);
		row-gap: var(--space-6);
	}

	.rg-card-fan--wrap .rg-card-fan--card {
		width: max-content;
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
	.rg-card-fan--hand:not(.rg-card-fan--static) .rg-card-fan--card:hover,
	.rg-card-fan--hand:not(.rg-card-fan--static)
		.rg-card-fan--card:focus-visible {
		z-index: var(--layer-bar);
		transform: translateY(calc(-1 * var(--space-4)));
	}

	.rg-card-fan--static .rg-card-fan--card {
		cursor: default;
		box-shadow: var(--shadow-card);
	}

	.rg-card-fan--hand .rg-card-fan--card:focus-visible {
		outline: var(--focus-outline);
		outline-offset: var(--focus-offset);
	}

	.rg-card-fan--hand .rg-card-fan--selected {
		outline: var(--focus-outline);
		outline-offset: var(--focus-offset);
	}

	/* A shelf's buttons keep the browser's button text, which whole cards such as civilizations inherit. As the shelf
	   opens its cards are dealt in, 40 ms apart and all within 240 ms (issue 175). */
	.rg-card-fan--shelf .rg-card-fan--card {
		box-shadow: var(--shadow-float);
		animation: rg-card-fan-deal var(--duration-medium) var(--ease-out)
			backwards;
		animation-delay: min(calc(var(--rg-card-fan-index, 0) * 40ms), 240ms);
	}

	@keyframes rg-card-fan-deal {
		from {
			opacity: 0;
			transform: translateY(24px) rotate(-2deg);
		}
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

	@media (prefers-reduced-motion: reduce) {
		.rg-card-fan--shelf .rg-card-fan--card {
			animation: none;
		}
	}
</style>
