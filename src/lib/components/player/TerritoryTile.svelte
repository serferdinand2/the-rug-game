<!-- TerritoryTile: one small flat-topped territory hex painted as the World Map paints it (#134), with its reward icon and number. -->
<script module>
	/**
	 * Properties of the TerritoryTile component itself.
	 * @typedef {Object} TerritoryTileOwnProps
	 * @property {number} id - The tile's number, 1-48
	 * @property {import('../../ui.js').Terrain[]} corners - Six corner terrains, clockwise from the top-left
	 * @property {import('../../ui.js').Terrain[]} [island=[]] - The terrains of the island in the middle
	 * @property {boolean} [clouds=false] - The tile's picture shows clouds (R77)
	 * @property {boolean} [volcano=false] - The tile's picture shows a volcano (R77)
	 * @property {number} [size=36] - The hex radius in pixels, from its centre to a corner
	 */

	/**
	 * Properties for the TerritoryTile component, including any attributes for its root svg.
	 * @typedef {TerritoryTileOwnProps & Omit<import('svelte/elements').SVGAttributes<SVGSVGElement>, 'id'>} TerritoryTileProps
	 *
	 * @example
	 * <TerritoryTile id={17} corners={turned(tile.corners, orient)} island={tile.island} clouds={tile.clouds} />
	 */
</script>

<script>
	import {
		hexCorner,
		hexPicture,
		svgPoints,
		territoryWords,
	} from '../../hexmap.js';
	import { volcanoCorner } from '../../art/hex-overlays.js';
	import { paintTerritory } from '../../art/paint/map.js';
	import { pictureUrl } from '../../painted-map.js';
	import { territoryBenefit } from '../../area/terrain.js';
	import { artUrl } from '../../ui.js';

	/** @type {TerritoryTileProps} */
	let {
		id,
		corners,
		island = [],
		clouds = false,
		volcano = false,
		size = 36,
		...attr
	} = $props();

	const CORNERS = [0, 1, 2, 3, 4, 5];
	const CENTER = /** @type {[number, number]} */ ([0, 0]);

	// The blob URL of the painted tile, made and revoked by the effect below.
	/** @type {string | undefined} */
	let href = $state();

	let height = $derived(Math.sqrt(3) * size);
	let picture = $derived(hexPicture(CENTER, size));
	// The terrain as text, so the tile is repainted only when its terrain or its turn changes.
	let terrain = $derived(
		JSON.stringify({ corners, island, clouds, volcano })
	);
	let canvas = $derived(paintTerritory(JSON.parse(terrain)));
	let outline = $derived(
		svgPoints(CORNERS.map((k) => hexCorner(CENTER, k, size)))
	);
	let reward = $derived(territoryBenefit(id));
	let name = $derived(
		`Territory tile ${id}: ${territoryWords({ corners, island, clouds, volcano })}. Benefit: ${reward.words}.`
	);
	// The number sits at the foot of the hex, or at its top when the volcano stands at the foot (#6 review).
	let numberY = $derived(
		volcano && [3, 4].includes(volcanoCorner(corners))
			? -height / 2 + 11
			: height / 2 - 4
	);

	$effect(() => {
		const url = pictureUrl(canvas);
		href = url;
		return () => URL.revokeObjectURL(url);
	});
</script>

<svg
	role="img"
	aria-label={name}
	viewBox="{-size} {-height / 2} {size * 2} {height}"
	width={size * 2}
	height={Math.round(height)}
	{...attr}
	class="rg-territory-tile {attr.class ?? ''}">
	<title>{name}</title>
	{#if href}
		<image
			class="rg-territory-tile--art"
			{href}
			{...picture}
			preserveAspectRatio="none" />
	{/if}
	<g transform="scale({size / 36})">
		<circle
			class="rg-territory-tile--reward"
			cx="0"
			cy="-1"
			r="9.5" />
		<image
			class="rg-territory-tile--reward-icon"
			href={artUrl(reward.icon)}
			x="-6"
			y="-7"
			width="12"
			height="12"
			preserveAspectRatio="xMidYMid meet" />
		{#if reward.upgrade}
			<path
				class="rg-territory-tile--upgrade"
				d="M 4 -8 L 8 -8 L 8 -4 M 8 -8 L 3 -3" />
		{/if}
		{#if reward.count > 1}
			<text
				class="rg-territory-tile--reward-count"
				x="10"
				y="8"
				text-anchor="middle">×{reward.count}</text>
		{/if}
		{#if reward.crossed}
			<path
				class="rg-territory-tile--reward-cross"
				d="M -5 -7 L 5 5 M 5 -7 L -5 5" />
		{/if}
	</g>
	<polygon
		class="rg-territory-tile--edge"
		points={outline} />
	<text
		class="rg-territory-tile--number"
		x="0"
		y={numberY}
		text-anchor="middle">{id}</text>
</svg>

<style>
	.rg-territory-tile {
		display: block;
		overflow: visible;
	}

	/* The painted tile is pixel art: keep its edges hard when it is scaled. */
	.rg-territory-tile--art {
		image-rendering: pixelated;
	}

	.rg-territory-tile--edge {
		fill: none;
		stroke: var(--chrome);
		stroke-width: 2;
	}

	.rg-territory-tile--reward {
		fill: var(--ink);
		fill-opacity: 0.88;
		stroke: var(--text);
		stroke-width: 1;
	}

	.rg-territory-tile--reward-icon {
		image-rendering: pixelated;
	}

	.rg-territory-tile--upgrade {
		fill: none;
		stroke: var(--gold);
		stroke-linecap: square;
		stroke-linejoin: miter;
		stroke-width: 1.5;
	}

	.rg-territory-tile--reward-count {
		fill: var(--text);
		font: 700 var(--font-size-3xs) var(--font-body);
		paint-order: stroke;
		stroke: var(--ink);
		stroke-width: 2px;
		pointer-events: none;
	}

	.rg-territory-tile--reward-cross {
		fill: none;
		stroke: var(--danger);
		stroke-linecap: square;
		stroke-width: 2;
		pointer-events: none;
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
