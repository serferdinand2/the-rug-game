<!-- CardSlot: a card's placement square; a button with a green outline when a decision offers its spot (#78), its border in the player's colour when filled (#106). -->
<script module>
	/**
	 * @typedef {Object} CardSlotOwnProps
	 * @property {39 | 62 | 75} [size] - Approved compact, six-across or five-across square
	 * @property {string} [label] - Placement meaning
	 * @property {boolean} [filled=false] - A piece or the player's mark fills it: a 2 px border in the player's colour
	 * @property {boolean} [pickable=false] - The viewer's open decision offers this spot: a button with the green available outline
	 * @property {boolean} [picked=false] - A pickable slot the viewer has picked: the gold selected outline
	 * @property {string} [value] - What a pick reports, such as the spot's id
	 * @property {Function} [onCardSlotPick] - Callback fired with `value` when a pickable slot is pressed
	 * @property {import('svelte').Snippet} [children] - Reward and placed piece
	 */
	/**
	 * @typedef {CardSlotOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardSlotProps
	 * @example
	 * <CardSlot />
	 * <CardSlot
	 *   size={62}
	 *   filled />
	 * <CardSlot
	 *   size={75}
	 *   pickable
	 *   picked
	 *   value="c2r1"
	 *   onCardSlotPick={(event) => pick(event.value)} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {CardSlotProps} */
	let {
		size = 62,
		label,
		filled = false,
		pickable = false,
		picked = false,
		value,
		onCardSlotPick,
		children,
		...attr
	} = $props();

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onCardSlotPick === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onCardSlotPick(new ComponentEvent(value, target, event));
		}
	};
</script>

{#if pickable}
	<button
		{...attr}
		type="button"
		class="rg-card-slot rg-card-slot--pickable {attr.class ?? ''}"
		class:rg-card-slot--filled={filled}
		class:rg-card-slot--picked={picked}
		aria-label={label}
		style:--card-slot-size={`${size}px`}
		onclick={clickHandler}>{@render children?.()}</button>
{:else}
	<span
		{...attr}
		class="rg-card-slot {attr.class ?? ''}"
		class:rg-card-slot--filled={filled}
		aria-label={label}
		style:--card-slot-size={`${size}px`}>{@render children?.()}</span>
{/if}

<style>
	/* The square's look is wrapped in :where(), so its specificity is nil and the patterns that draw a square on it
	   win, as they did over the shared stylesheet; the order below decides among these rules. */
	:where(.rg-card-slot) {
		display: inline-grid;
		position: relative;
		place-items: center;
		width: var(--card-slot-size);
		height: var(--card-slot-size);
		min-width: var(--card-slot-size);
		max-width: 75px;
		aspect-ratio: 1;
		border: 1px solid var(--card-slot-border);
		background: var(--card-slot);
	}
	:where(.rg-card-slot--filled) {
		border: 2px solid var(--player-1);
	}
	/* A spot the open decision offers is a button drawn as its square (#78). The reset only undoes the browser's
	   button look. */
	:where(.rg-card-slot--pickable) {
		appearance: none;
		margin: 0;
		padding: 0;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		word-spacing: inherit;
		text-align: inherit;
		text-indent: inherit;
		text-transform: inherit;
		text-shadow: inherit;
	}
	:where(.rg-card-slot--pickable:hover) {
		box-shadow: var(--glow-ok);
	}
	:where(.rg-card-slot--pickable.rg-card-slot--picked) {
		box-shadow: var(--glow-gold);
	}
	/* The outline is the track spaces' available green, and their gold once picked: inside a card --gold is the
	   paper's brown, so the picked outline takes the palette's gold, --card-title. It keeps its specificity, so the
	   page's own focus ring never replaces it. */
	.rg-card-slot--pickable {
		cursor: pointer;
		outline: var(--border-thick) solid var(--ok);
		outline-offset: 0;
	}
	.rg-card-slot--pickable:focus-visible {
		outline: var(--border-thick) dashed var(--ok);
		outline-offset: 0;
	}
	.rg-card-slot--pickable.rg-card-slot--picked {
		outline: var(--border-thick) solid var(--card-title);
		outline-offset: 0;
	}
	.rg-card-slot--pickable.rg-card-slot--picked:focus-visible {
		outline-style: dashed;
	}
</style>
