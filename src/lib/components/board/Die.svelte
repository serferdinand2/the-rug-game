<!-- Die: one die as the dice tray rolls it (#61), its style C body with the rolled face drawn on top. -->
<script module>
	/**
	 * Properties of the Die component itself.
	 * @typedef {Object} DieOwnProps
	 * @property {import('../../dice.js').DieId} die - The science die (d12) or the red or black conquer die (d6)
	 * @property {number} face - The face it lands on: an index into the die's faces (engine/data/dice.js)
	 * @property {number} [size=72] - Its width and height, in pixels
	 * @property {boolean} [rolling=false] - It tumbles; with reduced motion it doesn't
	 */

	/**
	 * Properties for the Die component, including any attributes for its root element.
	 * @typedef {DieOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} DieProps
	 *
	 * @example
	 * <Die die="red" face={1} />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	import { faceOf } from '../../dice.js';
	import { artUrl } from '../../ui.js';

	/** @type {DieProps} */
	let { die, face, size = 72, rolling = false, ...attr } = $props();

	let shown = $derived(faceOf(die, face));
	let resource = $derived(
		/** @type {import('../../ui.js').CostSymbol} */ (
			shown.kind === 'resource' ? shown.id : 'coin'
		)
	);
</script>

<span
	aria-hidden="true"
	data-die={die}
	data-face={face}
	{...attr}
	class="rg-die rg-die--{die} {attr.class ? attr.class : ''}"
	class:rg-die--rolling={rolling}
	style:--rg-die-size="{size}px">
	<img
		class="rg-die--body"
		src={artUrl(`die/${die}-body`)}
		alt="" />
	<span class="rg-die--face">
		{#if shown.kind === 'track'}
			<img
				class="rg-die--track"
				src={artUrl(`track/${shown.id}`)}
				alt="" />
		{:else if shown.kind === 'vp'}
			<span class="rg-die--vp">{shown.words}</span>
		{:else if shown.kind === 'resource'}
			<ResourceIcon
				symbol={resource}
				size="medium"
				decorative />
		{:else}
			<span class="rg-die--tile">?</span>
		{/if}
	</span>
</span>

<style>
	.rg-die {
		position: relative;
		display: inline-grid;
		width: var(--rg-die-size);
		height: var(--rg-die-size);
		place-items: center;
	}

	.rg-die--body {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
	}

	.rg-die--face {
		position: relative;
		display: grid;
		width: 62%;
		height: 62%;
		place-items: center;
		text-align: center;
	}

	.rg-die--track {
		width: 70%;
		height: 70%;
		image-rendering: pixelated;
	}

	.rg-die--vp,
	.rg-die--tile {
		font-weight: var(--weight-bold);
		line-height: var(--leading-none);
	}

	.rg-die--vp {
		color: var(--text);
		font-size: var(--font-size-xs);
	}

	.rg-die--tile {
		color: var(--text);
		font-size: var(--font-size-xl);
	}

	.rg-die--rolling {
		animation: rg-die-tumble 1s cubic-bezier(0.2, 0.7, 0.3, 1) infinite;
	}

	@keyframes rg-die-tumble {
		0% {
			transform: translateY(-40%) rotate(-200deg) scale(0.8);
		}
		55% {
			transform: translateY(6%) rotate(20deg) scale(1.05);
		}
		75% {
			transform: translateY(-4%) rotate(-6deg);
		}
		100% {
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-die--rolling {
			animation: none;
		}
	}
</style>
