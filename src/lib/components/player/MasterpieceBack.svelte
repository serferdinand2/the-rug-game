<!-- MasterpieceBack: the masterpiece deck's back, a masterpiece card's size, with the cards left (#35 part 4). -->
<script module>
	/**
	 * Properties of the MasterpieceBack component itself.
	 * @typedef {Object} MasterpieceBackOwnProps
	 * @property {number} count - The cards left in the deck
	 */
	/**
	 * Properties for the MasterpieceBack component, including any attributes for its root element.
	 * @typedef {MasterpieceBackOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} MasterpieceBackProps
	 *
	 * @example
	 * <MasterpieceBack count={14} />
	 */
</script>

<script>
	import { artUrl } from '../../ui.js';

	/** @type {MasterpieceBackProps} */
	let { count, ...attr } = $props();
</script>

<span
	{...attr}
	class="rg-masterpiece-back {attr.class ?? ''}">
	<img
		class="rg-masterpiece-back--art"
		src={artUrl('card-back/masterpiece')}
		alt="" />
	<b class="rg-masterpiece-back--count">Deck · {count}</b>
</span>

<style>
	/* A masterpiece card's size (masterpiece-card.css): the drawn back fills it, the count over its foot. */
	.rg-masterpiece-back {
		position: relative;
		display: block;
		box-sizing: border-box;
		width: 319px;
		height: 259px;
		border: 2px solid var(--card-line-strong);
		background: var(--masterpiece-back);
		box-shadow: 0 10px 26px var(--card-shadow-strong);
	}

	.rg-masterpiece-back--art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: fill;
		image-rendering: pixelated;
	}

	.rg-masterpiece-back--count {
		position: absolute;
		bottom: var(--space-6);
		left: 50%;
		padding: var(--space-2) var(--space-5);
		background: color-mix(in srgb, var(--chrome) 80%, transparent);
		color: var(--card-title);
		font: var(--weight-title) var(--font-size-lg) / var(--leading-tight)
			var(--font-title);
		white-space: nowrap;
		transform: translateX(-50%);
	}
</style>
