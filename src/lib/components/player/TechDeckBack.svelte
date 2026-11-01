<!-- TechDeckBack: the tech deck's back, "Deck · N" in gold on the card band's colour, as a whole card or as a small chip (#118). -->
<script module>
	/**
	 * Properties of the TechDeckBack component itself.
	 * @typedef {Object} TechDeckBackOwnProps
	 * @property {number} count - The cards left in the deck
	 * @property {'card' | 'chip'} [size='card'] - card: fills a tech card's frame (put it in a ScaledCard with CARD_SIZES.tech); chip: an inline badge beside an option's words
	 */

	/**
	 * Properties for the TechDeckBack component, including any attributes for its root element.
	 * @typedef {TechDeckBackOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} TechDeckBackProps
	 *
	 * @example
	 * <ScaledCard scale={0.65} {...CARD_SIZES.tech}><TechDeckBack count={21} /></ScaledCard>
	 * <TechDeckBack count={21} size="chip" />
	 */
</script>

<script>
	import { artUrl } from '../../ui.js';

	/** @type {TechDeckBackProps} */
	let { count, size = 'card', ...attr } = $props();
</script>

{#if size === 'chip'}
	<b
		{...attr}
		class="rg-tech-deck-back rg-tech-deck-back--chip {attr.class
			? attr.class
			: ''}">Deck · {count}</b>
{:else}
	<span
		{...attr}
		class="rg-tech-deck-back rg-tech-deck-back--card {attr.class
			? attr.class
			: ''}">
		<img
			src={artUrl('card-back/tech')}
			alt=""
			aria-hidden="true" />
		<b>Deck · {count}</b>
	</span>
{/if}

<style>
	.rg-tech-deck-back {
		background: var(--card-band-start);
		color: var(--card-title);
	}

	/* The whole card: the frame's size, which the ScaledCard around it gives. */
	.rg-tech-deck-back--card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		border: var(--border-thick) solid var(--card-line);
		font: var(--weight-title) var(--font-size-3xl) / var(--leading-tight)
			var(--font-title);
	}

	.rg-tech-deck-back--card img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: fill;
	}

	.rg-tech-deck-back--card b {
		z-index: 1;
		padding: var(--space-3) var(--space-5);
		border: 2px solid var(--gold);
		background: var(--scrim-strong);
		color: var(--gold);
		text-shadow: 0 2px var(--ink);
	}

	/* The chip beside an option's words. */
	.rg-tech-deck-back--chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1) var(--space-3);
		border: var(--border) solid var(--card-line);
		border-radius: var(--radius);
		font: var(--weight-title) var(--font-size-sm) / var(--leading-tight)
			var(--font-title);
		white-space: nowrap;
	}
</style>
