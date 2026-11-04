<!-- ArtFan: three pictures laid as cards in a fan, as on a table (#174), beside the landing page's and the lobby's panels; the cards are dealt into the fan one after another as the page opens (#175). -->
<script module>
	/**
	 * Properties of the ArtFan component itself.
	 * @typedef {Object} ArtFanOwnProps
	 * @property {readonly import('../../art-fans.js').FanCard[]} cards - Up to three pictures, left to right
	 */

	/**
	 * Properties for the ArtFan component, including any attributes for its root element.
	 * @typedef {ArtFanOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} ArtFanProps
	 *
	 * @example
	 * <ArtFan cards={store.fans.left} />
	 */
</script>

<script>
	import CardBand from '../player/CardBand.svelte';
	import { artUrl } from '../../ui.js';

	/** @type {ArtFanProps} */
	let { cards, ...attr } = $props();
</script>

<div
	aria-hidden="true"
	{...attr}
	class="rg-art-fan {attr.class ? attr.class : ''}">
	{#each cards.slice(0, 3) as card, index (card.art)}
		<figure
			class="rg-art-fan--card"
			class:rg-art-fan--middle={index === 1}
			style:--rg-art-fan-index={index}>
			<CardBand
				class="rg-art-fan--band"
				title={card.name}
				size={card.titleSize} />
			<img
				class="rg-art-fan--art"
				src={artUrl(card.art)}
				alt=""
				draggable="false" />
		</figure>
	{/each}
</div>

<style>
	/* Three cards from one point below them, tilted −12°, 0° and 12°, the middle one a little higher. */
	.rg-art-fan {
		--rg-art-fan-card-width: 255px;
		--rg-art-fan-picture-side: 237px;
		position: relative;
		width: 350px;
		height: 320px;
		pointer-events: none;
	}

	.rg-art-fan--card {
		--rg-art-fan-turn: calc((var(--rg-art-fan-index) - 1) * 12deg);
		--rg-art-fan-shift: calc((var(--rg-art-fan-index) - 1) * 40px);
		position: absolute;
		top: 0;
		left: calc((350px - var(--rg-art-fan-card-width)) / 2);
		display: grid;
		gap: var(--space-3);
		width: var(--rg-art-fan-card-width);
		max-width: var(--rg-art-fan-card-width);
		margin: 0;
		padding: 0 var(--space-4) var(--space-5);
		border: var(--border) solid var(--card-line-strong);
		background: var(--card-paper)
			url('../../../styles/card-paper-noise.svg') repeat;
		background-size: 256px 256px;
		box-shadow: var(--shadow-float);
		transform: translateX(var(--rg-art-fan-shift))
			rotate(var(--rg-art-fan-turn));
		transform-origin: 50% 120%;
	}

	.rg-art-fan--middle {
		transform: translateY(-14px);
	}

	/* The full-height top band uses the shared card title and texture; the image stays inset. */
	:global(.rg-art-fan--band) {
		min-height: 49px;
		margin-inline: calc(-1 * var(--space-4));
		padding-inline: var(--space-6);
	}

	:global(.rg-art-fan--band.rg-card-band--large) {
		padding-block: var(--space-4);
	}

	:global(.rg-art-fan--band.rg-card-band--large .rg-card-band--title) {
		font-size: calc(var(--font-size-5xl) * var(--font-scale-art-fan-title));
	}

	:global(.rg-art-fan--band.rg-card-band--small .rg-card-band--title) {
		font-size: calc(var(--font-size-card-title-sm) * var(--font-scale-art-fan-title));
	}

	:global(.rg-art-fan--band .rg-card-band--title) {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.rg-art-fan--art {
		display: block;
		width: 100%;
		max-width: var(--rg-art-fan-picture-side);
		aspect-ratio: 1;
		border: var(--border-thick) solid var(--card-art-frame);
		image-rendering: pixelated;
	}

	/* As the page opens the cards are dealt into the fan from below, one after another (issue 175); each ends on its own
	   turn in the fan. */
	.rg-art-fan--card {
		animation: rg-art-fan-deal var(--duration-focal) var(--ease-out)
			backwards;
		animation-delay: calc(120ms + var(--rg-art-fan-index) * 90ms);
	}

	@keyframes rg-art-fan-deal {
		from {
			opacity: 0;
			transform: translateY(40px) rotate(0deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-art-fan--card {
			animation: none;
		}
	}
</style>
