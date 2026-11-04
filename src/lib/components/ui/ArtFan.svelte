<!-- ArtFan: three pictures laid as cards in a fan, as on a table (#174), beside the landing page's and the lobby's panels. -->
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
			<figcaption class="rg-art-fan--name">{card.name}</figcaption>
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
		position: relative;
		width: 300px;
		height: 300px;
		pointer-events: none;
	}

	.rg-art-fan--card {
		--rg-art-fan-turn: calc((var(--rg-art-fan-index) - 1) * 12deg);
		--rg-art-fan-shift: calc((var(--rg-art-fan-index) - 1) * 40px);
		position: absolute;
		top: 0;
		left: 62px;
		display: grid;
		gap: var(--space-3);
		width: 176px;
		margin: 0;
		padding: var(--space-4) var(--space-4) var(--space-5);
		border: var(--border) solid var(--card-line-strong);
		background: var(--card-paper);
		box-shadow: var(--shadow-float);
		transform: translateX(var(--rg-art-fan-shift))
			rotate(var(--rg-art-fan-turn));
		transform-origin: 50% 120%;
	}

	.rg-art-fan--middle {
		transform: translateY(-14px);
	}

	/* The name on a card band, as the game's cards carry theirs. */
	.rg-art-fan--name {
		overflow: hidden;
		padding: var(--space-2) var(--space-3);
		background: linear-gradient(
			90deg,
			var(--card-band-start),
			var(--card-band-middle),
			var(--card-band-end)
		);
		color: var(--card-title);
		font: var(--weight-title) var(--font-size-md) / var(--leading-tight)
			var(--font-title);
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.rg-art-fan--art {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		border: var(--border-thick) solid var(--card-art-frame);
		image-rendering: pixelated;
	}
</style>
