<!-- MasterpieceChip: one masterpiece as a small chip, its picture and name, or face down with "used" (#35 part 4); pointing at it shows the card. -->
<script module>
	/**
	 * Properties of the MasterpieceChip component itself.
	 * @typedef {Object} MasterpieceChipOwnProps
	 * @property {string} id - The masterpiece, such as 'painting'
	 * @property {boolean} [used=false] - A used single-use card, face down: the arts symbol and "used", and no card to show
	 * @property {'tiny' | 'small'} [size='small'] - Tiny on the arts track's line, small in the player area
	 * @property {Function} [onMasterpieceChipInspect] - Callback fired with the id when the chip is hovered or focused, and with null on leave; never for a used card
	 */
	/**
	 * Properties for the MasterpieceChip component, including any attributes for its root element.
	 * @typedef {MasterpieceChipOwnProps & import('svelte/elements').HTMLButtonAttributes} MasterpieceChipProps
	 *
	 * @example
	 * <MasterpieceChip id="painting" onMasterpieceChipInspect={(event) => (shown = event.value)} />
	 * <MasterpieceChip id="mime" used size="small" />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { masterpieceName } from '../../game-names.js';
	import { artUrl } from '../../ui.js';

	/** @type {MasterpieceChipProps} */
	let {
		id,
		used = false,
		size = 'small',
		onMasterpieceChipInspect,
		...attr
	} = $props();

	let name = $derived(masterpieceName(id));

	/**
	 * Reports the card to show, or null to hide it.
	 * @param {Event} event
	 * @param {string | null} value
	 */
	const inspect = (event, value) => {
		if (typeof onMasterpieceChipInspect === 'function') {
			onMasterpieceChipInspect(
				new ComponentEvent(
					value,
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
		}
	};

	/** @param {Event} event */
	const enterHandler = (event) => inspect(event, used ? null : id);

	/** @param {Event} event */
	const leaveHandler = (event) => inspect(event, null);
</script>

<button
	type="button"
	{...attr}
	class="rg-masterpiece-chip rg-masterpiece-chip--{size} {attr.class ?? ''}"
	class:rg-masterpiece-chip--used={used}
	onmouseenter={enterHandler}
	onmouseleave={leaveHandler}
	onfocus={enterHandler}
	onblur={leaveHandler}>
	{#if used}
		<span class="rg-masterpiece-chip--down"
			><img
				src={artUrl('track/arts')}
				alt="" /></span>
		<span class="rg-masterpiece-chip--name"
			>{name} <em class="rg-masterpiece-chip--note">used</em></span>
	{:else}
		<img
			class="rg-masterpiece-chip--art"
			src={artUrl(`masterpiece/${id}`)}
			alt="" />
		<span class="rg-masterpiece-chip--name">{name}</span>
	{/if}
</button>

<style>
	/* The card's paper and line, as a chip: the picture, then the name (approved mockup, #35 part 4). */
	.rg-masterpiece-chip {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-1) var(--space-4) var(--space-1) var(--space-1);
		border: var(--border) solid var(--card-line);
		background: var(--card-paper);
		color: var(--card-text);
		font: var(--weight-bold) var(--font-size-xs) / var(--leading-none)
			var(--font-body);
		white-space: nowrap;
		cursor: default;
	}

	.rg-masterpiece-chip:hover,
	.rg-masterpiece-chip:focus-visible {
		outline: var(--focus-outline);
		outline-offset: 0;
	}

	.rg-masterpiece-chip img {
		display: block;
		image-rendering: pixelated;
	}

	.rg-masterpiece-chip--tiny img {
		width: 16px;
		height: 16px;
	}

	.rg-masterpiece-chip--small img {
		width: 32px;
		height: 32px;
	}

	/* A used single-use card lies face down: the arts symbol on the masterpieces' back. */
	.rg-masterpiece-chip--used {
		border-color: var(--line-strong);
		background: var(--masterpiece-used);
		color: var(--masterpiece-used-text);
	}

	.rg-masterpiece-chip--down {
		display: grid;
		place-items: center;
		background: var(--masterpiece-back);
	}

	.rg-masterpiece-chip--tiny .rg-masterpiece-chip--down {
		width: 16px;
		height: 16px;
	}

	.rg-masterpiece-chip--small .rg-masterpiece-chip--down {
		width: 32px;
		height: 32px;
	}

	.rg-masterpiece-chip--tiny .rg-masterpiece-chip--down img {
		width: 12px;
		height: 12px;
	}

	.rg-masterpiece-chip--small .rg-masterpiece-chip--down img {
		width: 22px;
		height: 22px;
	}

	.rg-masterpiece-chip--note {
		color: var(--masterpiece-used-note);
		font-style: normal;
		font-weight: var(--weight-regular);
	}
</style>
