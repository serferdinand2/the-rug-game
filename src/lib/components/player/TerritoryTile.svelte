<!-- TerritoryTile: one small flat-topped hex drawn like a territory on the World Map, with its number. -->
<script module>
	/**
	 * Properties of the TerritoryTile component itself.
	 * @typedef {Object} TerritoryTileOwnProps
	 * @property {number} id - The tile's number, 1-48
	 * @property {import('../../ui.js').Terrain[]} corners - Six corner terrains, clockwise from the top-left
	 * @property {import('../../ui.js').Terrain[]} [island=[]] - The terrains of the island in the middle
	 * @property {number} [size=36] - The hex radius in pixels, from its centre to a corner
	 */

	/**
	 * Properties for the TerritoryTile component, including any attributes for its root svg.
	 * @typedef {TerritoryTileOwnProps & Omit<import('svelte/elements').SVGAttributes<SVGSVGElement>, 'id'>} TerritoryTileProps
	 *
	 * @example
	 * <TerritoryTile id={17} corners={tile.corners} island={tile.island} />
	 */
</script>

<script>
	import {
		cornerWedge,
		hexCorner,
		islandParts,
		svgPoints,
	} from '../../hexmap.js';
	import { terrainColor } from '../../ui.js';

	/** @type {TerritoryTileProps} */
	let { id, corners, island = [], size = 36, ...attr } = $props();

	const CORNERS = [0, 1, 2, 3, 4, 5];
	const CENTER = /** @type {[number, number]} */ ([0, 0]);

	let height = $derived(Math.sqrt(3) * size);
	let outline = $derived(
		svgPoints(CORNERS.map((k) => hexCorner(CENTER, k, size)))
	);
	let wedges = $derived(
		corners.map((terrain, k) => ({
			terrain,
			points: svgPoints(cornerWedge(CENTER, k, size)),
		}))
	);
	let parts = $derived(
		islandParts(CENTER, island, size).map((part) => ({
			...part,
			points: svgPoints(part.points),
		}))
	);
	let name = $derived(
		`Territory tile ${id}: ${[...new Set(corners)].join(', ')}${island.length ? `, island of ${island.join(' and ')}` : ''}`
	);
</script>

<svg
	role="img"
	aria-label={name}
	viewBox="{-size} {-height / 2} {size * 2} {height}"
	width={size * 2}
	height={Math.round(height)}
	{...attr}
	class="rg-territory-tile {attr.class ?? ''}">
	{#each wedges as wedge, k (k)}
		<polygon
			class="rg-territory-tile--wedge"
			points={wedge.points}
			style:fill={terrainColor(wedge.terrain)}
			style:stroke={terrainColor(wedge.terrain)} />
	{/each}
	{#each parts as part, i (i)}
		<polygon
			class="rg-territory-tile--island"
			points={part.points}
			style:fill={terrainColor(part.terrain)} />
	{/each}
	<polygon
		class="rg-territory-tile--edge"
		points={outline} />
	<text
		class="rg-territory-tile--number"
		x="0"
		y={height / 2 - 4}
		text-anchor="middle">{id}</text>
</svg>

<style>
	.rg-territory-tile {
		display: block;
		overflow: visible;
	}

	/* The same colour as the fill, so no seam shows between two wedges. */
	.rg-territory-tile--wedge {
		stroke-width: 0.6;
		stroke-linejoin: round;
	}

	.rg-territory-tile--island {
		stroke: var(--chrome);
		stroke-width: 0.8;
	}

	.rg-territory-tile--edge {
		fill: none;
		stroke: var(--chrome);
		stroke-width: 2;
	}

	.rg-territory-tile--number {
		fill: var(--text);
		font: 700 var(--font-size-3xs) var(--font-body);
		paint-order: stroke;
		stroke: var(--chrome);
		stroke-width: 3px;
		pointer-events: none;
	}
</style>
