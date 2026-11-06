<!-- CapitalMatFace: a capital mat on offer, its name on a card band over its grid of plots (#56, #118), 9×9 or an advanced mat's own shape (#36). -->
<script module>
	/**
	 * Properties of the CapitalMatFace component itself.
	 * @typedef {Object} CapitalMatFaceOwnProps
	 * @property {string} name - The mat's name, such as 'Mountain'
	 * @property {import('../../capital.js').PlotKind[]} plots - Its plots before anything is built, from matPlots()
	 * @property {import('../../ui.js').CapitalBiome} biome - Its terrain, which is its id
	 * @property {import('../../capital.js').Shape} [shape] - Its rows, columns and districts; the basic 9 × 9 by default (#36)
	 * @property {number} [terrainSeed=0] - The table's terrain seed, so the mat looks as it will in the Capital tab
	 */

	/**
	 * Properties for the CapitalMatFace component, including any attributes for its root element.
	 * @typedef {CapitalMatFaceOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} CapitalMatFaceProps
	 *
	 * @example
	 * <CapitalMatFace name="Mountain" plots={matPlots(1)} biome="mountain" terrainSeed={seed} />
	 */
</script>

<script>
	import CapitalGrid from './CapitalGrid.svelte';
	import { BASIC_SHAPE } from '../../capital.js';

	/** @type {CapitalMatFaceProps} */
	let {
		name,
		plots,
		biome,
		shape = BASIC_SHAPE,
		terrainSeed = 0,
		...attr
	} = $props();
</script>

<!-- A span, so the face can sit in a button. -->
<span
	{...attr}
	class="rg-capital-mat-face {attr.class ? attr.class : ''}">
	<b class="rg-capital-mat-face--name">{name}</b>
	<CapitalGrid
		{plots}
		{shape}
		{biome}
		{terrainSeed}
		label="{name} capital, {shape.rows} by {shape.cols} plots" />
</span>

<style>
	/* Large enough to read the districts and the impassable plots (#56). */
	.rg-capital-mat-face {
		display: block;
		width: 392px;
		box-sizing: border-box;
		padding: 0 var(--space-3) var(--space-3);
		border: var(--border-thick) solid var(--card-line);
		background: var(--ink);
		text-align: left;
	}

	.rg-capital-mat-face--name {
		display: block;
		margin: 0 calc(-1 * var(--space-3)) var(--space-3);
		padding: var(--space-4) var(--space-6);
		background: linear-gradient(
			90deg,
			var(--card-band-start),
			var(--card-band-middle) 65%,
			var(--card-band-end)
		);
		color: var(--card-title);
		font: var(--weight-title) var(--font-size-xl) / var(--leading-tight)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
	}
</style>
