<!-- The schematic world map: rows of point-up hexagons coloured by terrain, with unexplored ones dashed. -->
<script module>
	/**
	 * Properties of the WorldMap component itself.
	 * @typedef {Object} WorldMapOwnProps
	 * @property {import('../../ui.js').Terrain[][]} rows - The hexes row by row, top first; odd rows sit half a hex to the right
	 * @property {string} [label='World map'] - Names the map for assistive technology
	 */

	/**
	 * Properties for the WorldMap component, including any attributes for its root svg.
	 * @typedef {WorldMapOwnProps & import('svelte/elements').SVGAttributes<SVGSVGElement>} WorldMapProps
	 *
	 * @example
	 * <WorldMap
	 *   label="World map"
	 *   rows={[
	 *     ['sea', 'sea', 'sea'],
	 *     ['forest', 'unexplored', 'desert'],
	 *     ['sea', 'grassland', 'mountain'],
	 *   ]}
	 * />
	 */
</script>

<script>
	import { terrainColor } from '../../ui.js';

	/** @type {WorldMapProps} */
	let { rows, label = 'World map', ...attr } = $props();

	// A point-up hexagon 72 wide and 84 tall, centred on the origin.
	const HEX = '0,-42 36,-21 36,21 0,42 -36,21 -36,-21';
	const HALF_WIDTH = 36;
	const HALF_HEIGHT = 42;
	const COLUMN_PITCH = 72;
	const ROW_PITCH = 63;
	// Room for the 2px stroke around the outer hexes.
	const MARGIN = 2;

	let hexes = $derived(
		rows.flatMap((row, rowIndex) =>
			row.map((terrain, column) => ({
				key: `${rowIndex}-${column}`,
				terrain,
				x: column * COLUMN_PITCH + (rowIndex % 2) * HALF_WIDTH,
				y: rowIndex * ROW_PITCH,
			}))
		)
	);
	let width = $derived(
		Math.max(
			0,
			...rows.map(
				(row, rowIndex) =>
					row.length * COLUMN_PITCH + (rowIndex % 2) * HALF_WIDTH
			)
		)
	);
	let height = $derived(
		rows.length ? (rows.length - 1) * ROW_PITCH + 2 * HALF_HEIGHT : 0
	);
	let viewBox = $derived(
		`${-HALF_WIDTH - MARGIN} ${-HALF_HEIGHT - MARGIN} ${width + 2 * MARGIN} ${height + 2 * MARGIN}`
	);
</script>

<svg
	role="img"
	aria-label={label}
	{viewBox}
	{...attr}
	class="rg-world-map {attr.class ? attr.class : ''}">
	{#each hexes as hex (hex.key)}
		<polygon
			class="rg-world-map--hex"
			class:rg-world-map--fog={hex.terrain === 'unexplored'}
			points={HEX}
			transform="translate({hex.x} {hex.y})"
			style:fill={terrainColor(hex.terrain)} />
	{/each}
</svg>

<style>
	.rg-world-map {
		display: block;
		width: 100%;
		height: 100%;
	}

	.rg-world-map--hex {
		stroke: var(--chrome);
		stroke-width: 2;
	}

	/* Unexplored hexes are dashed, like fog over the map. */
	.rg-world-map--fog {
		stroke-dasharray: 5 4;
	}
</style>
