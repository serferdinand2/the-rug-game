<!-- TileBenefit: a territory tile's benefit as a badge round the origin (#150, #170): its icon, an upgrade arrow, a ×count and a cross, from territoryBenefit(), drawn on a tile in hand and on a hex of the map. -->
<script module>
	/**
	 * Properties of the TileBenefit component itself.
	 * @typedef {Object} TileBenefitOwnProps
	 * @property {number} tile - The tile's number, 1-48
	 */

	/**
	 * Properties for the TileBenefit component, including any attributes for its root element.
	 * @typedef {TileBenefitOwnProps & import('svelte/elements').SVGAttributes<SVGGElement>} TileBenefitProps
	 *
	 * @example
	 * <svg viewBox="-36 -31 72 62"><TileBenefit tile={17} /></svg>
	 */
</script>

<script>
	import { artUrl } from '../../ui.js';
	import { territoryBenefit } from '../../area/terrain.js';

	/** @type {TileBenefitProps} */
	let { tile, ...attr } = $props();

	let reward = $derived(territoryBenefit(tile));
</script>

<g
	{...attr}
	class="rg-tile-benefit {attr.class ?? ''}">
	<circle
		class="rg-tile-benefit--reward"
		cx="0"
		cy="-1"
		r="9.5" />
	<image
		class="rg-tile-benefit--reward-icon"
		href={artUrl(reward.icon)}
		x="-6"
		y="-7"
		width="12"
		height="12"
		preserveAspectRatio="xMidYMid meet" />
	{#if reward.upgrade}
		<path
			class="rg-tile-benefit--upgrade"
			d="M 4 -8 L 8 -8 L 8 -4 M 8 -8 L 3 -3" />
	{/if}
	{#if reward.count > 1}
		<text
			class="rg-tile-benefit--reward-count"
			x="10"
			y="8"
			text-anchor="middle">×{reward.count}</text>
	{/if}
	{#if reward.crossed}
		<path
			class="rg-tile-benefit--reward-cross"
			d="M -5 -7 L 5 5 M 5 -7 L -5 5" />
	{/if}
</g>

<style>
	.rg-tile-benefit--reward {
		fill: var(--ink);
		fill-opacity: 0.88;
		stroke: var(--text);
		stroke-width: 1;
	}

	.rg-tile-benefit--reward-icon {
		image-rendering: pixelated;
	}

	.rg-tile-benefit--upgrade {
		fill: none;
		stroke: var(--gold);
		stroke-linecap: square;
		stroke-linejoin: miter;
		stroke-width: 1.5;
	}

	.rg-tile-benefit--reward-count {
		fill: var(--text);
		font: 700 var(--font-size-3xs) var(--font-body);
		paint-order: stroke;
		stroke: var(--ink);
		stroke-width: 2px;
		pointer-events: none;
	}

	.rg-tile-benefit--reward-cross {
		fill: none;
		stroke: var(--danger);
		stroke-linecap: square;
		stroke-width: 2;
		pointer-events: none;
	}
</style>
