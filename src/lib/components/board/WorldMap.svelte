<!-- The World Map: the real board's flat-topped hex grid, each territory drawn from its corner terrains and island, with the outposts and tokens on it and the hexes a decision can target. -->
<script module>
	/**
	 * Properties of the WorldMap component itself.
	 * @typedef {Object} WorldMapOwnProps
	 * @property {import('../../hexmap.js').MapHex[]} hexes - Every hex of the board, from mapHexes(view) at HEX_SIZE
	 * @property {string[]} [targets=[]] - Hex keys a decision can choose; each becomes a button and the other hexes dim
	 * @property {string | null} [selected=null] - The chosen hex, outlined in gold
	 * @property {{ hex: string, corners: import('../../ui.js').Terrain[], island: import('../../ui.js').Terrain[] } | null} [preview=null] - A tile to show on a hex before it is explored: drawn like an explored hex, at 85% opacity with a gold outline
	 * @property {string} [label='World map'] - Names the map for assistive technology
	 * @property {Function} [onWorldMapSelect] - Callback fired with { hex } when the player chooses a target hex
	 */

	/**
	 * Properties for the WorldMap component, including any attributes for its root svg.
	 * @typedef {WorldMapOwnProps & import('svelte/elements').SVGAttributes<SVGSVGElement>} WorldMapProps
	 *
	 * @example
	 * <WorldMap
	 *   hexes={mapHexes(room.game)}
	 *   targets={['1_2', '2_2']}
	 *   selected={hex}
	 *   onWorldMapSelect={(event) => (hex = event.value.hex)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import {
		HEX_SIZE,
		cornerWedge,
		fitBox,
		hexCorner,
		islandParts,
		pieceSpots,
		svgPoints,
	} from '../../hexmap.js';
	import { playerColor, terrainColor } from '../../ui.js';

	/** @type {WorldMapProps} */
	let {
		hexes,
		targets = [],
		selected = null,
		preview = null,
		label = 'World map',
		onWorldMapSelect,
		...attr
	} = $props();

	const CORNERS = [0, 1, 2, 3, 4, 5];
	// A Nomads piece's mark, for a piece of side 1: a house for a building, a narrow tower for a landmark.
	const MARKS = {
		building: '-0.26,0.26 -0.26,-0.04 0,-0.28 0.26,-0.04 0.26,0.26',
		landmark: '-0.12,0.3 -0.12,-0.1 0,-0.32 0.12,-0.1 0.12,0.3',
	};

	// The hex keyboard focus is on, outlined above its neighbours.
	/** @type {string | null} */
	let focused = $state(null);

	let box = $derived(fitBox(hexes, HEX_SIZE));
	let viewBox = $derived(
		box.width ? `${box.x} ${box.y} ${box.width} ${box.height}` : undefined
	);
	let targetSet = $derived(new Set(targets));
	let targeting = $derived(targetSet.size > 0);
	let drawn = $derived(
		hexes.map((raw) => {
			const previewed = preview !== null && preview.hex === raw.key;
			const hex = previewed
				? { ...raw, corners: preview.corners, island: preview.island }
				: raw;
			return {
				...hex,
				previewed,
				target: targetSet.has(hex.key),
				outline: svgPoints(
					CORNERS.map((k) => hexCorner(hex.center, k, HEX_SIZE))
				),
				wedges: hex.corners
					? hex.corners.map((terrain, k) => ({
							terrain,
							points: svgPoints(
								cornerWedge(hex.center, k, HEX_SIZE)
							),
						}))
					: [],
				islands: islandParts(hex.center, hex.island, HEX_SIZE).map(
					(part) => ({ ...part, points: svgPoints(part.points) })
				),
				pieces: pieces(hex),
			};
		})
	);
	let overlays = $derived(
		drawn.filter(
			(hex) =>
				hex.target ||
				hex.previewed ||
				hex.key === selected ||
				hex.key === focused
		)
	);

	/**
	 * @param {MouseEvent} event
	 * @param {string} hex
	 */
	const hexClickHandler = (event, hex) => {
		choose(event, hex);
	};

	/**
	 * Enter and Space choose a target hex, as they would press a button.
	 * @param {KeyboardEvent} event
	 * @param {string} hex
	 */
	const hexKeydownHandler = (event, hex) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			choose(event, hex);
		}
	};

	/**
	 * @param {FocusEvent} event
	 * @param {string} hex
	 */
	const hexFocusHandler = (event, hex) => {
		const target = /** @type {SVGGElement} */ (event.currentTarget);
		if (target.matches(':focus-visible')) {
			focused = hex;
		}
	};

	const hexBlurHandler = () => {
		focused = null;
	};

	/**
	 * @param {Event} event
	 * @param {string} hex
	 */
	function choose(event, hex) {
		if (!targetSet.has(hex) || typeof onWorldMapSelect !== 'function') {
			return;
		}
		const target = /** @type {HTMLElement} */ (
			/** @type {unknown} */ (event.currentTarget)
		);
		onWorldMapSelect(new ComponentEvent({ hex }, target, event));
	}

	/**
	 * The pieces on a hex, outposts first, each in its spot.
	 * @param {import('../../hexmap.js').MapHex} hex
	 */
	function pieces(hex) {
		const spots = pieceSpots(
			hex.center,
			hex.outposts.length + hex.tokens.length,
			hex.island.length > 0,
			HEX_SIZE
		);
		return [
			...hex.outposts.map((outpost, i) => ({
				kind: /** @type {'outpost' | 'token'} */ ('outpost'),
				seat: outpost.seat,
				toppled: outpost.toppled,
				mark: outpost.piece ? MARKS[outpost.piece.kind] : null,
				...spots[i],
			})),
			...hex.tokens.map((token, i) => ({
				kind: /** @type {'outpost' | 'token'} */ ('token'),
				seat: token.seat,
				toppled: false,
				mark: null,
				...spots[hex.outposts.length + i],
			})),
		];
	}
</script>

<svg
	role="group"
	aria-label={label}
	{viewBox}
	{...attr}
	class="rg-world-map {attr.class ? attr.class : ''}">
	{#snippet tile(/** @type {(typeof drawn)[number]} */ hex)}
		{#if hex.corners}
			{#each hex.wedges as wedge, k (k)}
				<polygon
					class="rg-world-map--wedge"
					points={wedge.points}
					style:fill={terrainColor(wedge.terrain)}
					style:stroke={terrainColor(wedge.terrain)} />
			{/each}
			{#each hex.islands as part, i (i)}
				<polygon
					class="rg-world-map--island"
					points={part.points}
					style:fill={terrainColor(part.terrain)} />
			{/each}
			<polygon
				class="rg-world-map--edge"
				points={hex.outline} />
		{:else}
			<polygon
				class="rg-world-map--edge rg-world-map--fog"
				points={hex.outline} />
		{/if}
		{#each hex.pieces as piece, i (i)}
			{#if piece.kind === 'token'}
				<circle
					class="rg-world-map--token"
					cx={piece.x}
					cy={piece.y}
					r={piece.size * 0.42}
					style:fill={playerColor(piece.seat)} />
			{:else if piece.toppled}
				<!-- Lying on its side: half as tall, outlined in the player's colour. -->
				<rect
					class="rg-world-map--toppled"
					x={piece.x - piece.size / 2}
					y={piece.y}
					width={piece.size}
					height={piece.size / 2}
					style:stroke={playerColor(piece.seat)} />
				{#if piece.mark}
					<polygon
						class="rg-world-map--mark"
						points={piece.mark}
						transform="translate({piece.x} {piece.y +
							piece.size / 4}) rotate(90) scale({piece.size *
							0.6})"
						style:fill={playerColor(piece.seat)} />
				{/if}
			{:else}
				<rect
					class="rg-world-map--outpost"
					x={piece.x - piece.size / 2}
					y={piece.y - piece.size / 2}
					width={piece.size}
					height={piece.size}
					style:fill={playerColor(piece.seat)} />
				{#if piece.mark}
					<polygon
						class="rg-world-map--mark"
						points={piece.mark}
						transform="translate({piece.x} {piece.y}) scale({piece.size})" />
				{/if}
			{/if}
		{/each}
	{/snippet}
	{#each drawn as hex (hex.key)}
		{#if hex.target}
			<g
				class="rg-world-map--hex rg-world-map--target"
				role="button"
				tabindex="0"
				class:rg-world-map--preview={hex.previewed}
				aria-label={hex.label}
				aria-pressed={selected === hex.key}
				onclick={(event) => hexClickHandler(event, hex.key)}
				onkeydown={(event) => hexKeydownHandler(event, hex.key)}
				onfocus={(event) => hexFocusHandler(event, hex.key)}
				onblur={hexBlurHandler}>
				{@render tile(hex)}
			</g>
		{:else}
			<g
				class="rg-world-map--hex"
				class:rg-world-map--dim={targeting}
				class:rg-world-map--preview={hex.previewed}
				role="img"
				aria-label={hex.label}>
				{@render tile(hex)}
			</g>
		{/if}
	{/each}
	<!-- Outlines above every hex, so a neighbour never covers them. -->
	{#each overlays as hex (hex.key)}
		<polygon
			class="rg-world-map--outline"
			class:rg-world-map--outline-target={hex.target}
			class:rg-world-map--outline-preview={hex.previewed}
			class:rg-world-map--outline-focus={hex.key === focused}
			class:rg-world-map--outline-selected={hex.key === selected}
			points={hex.outline} />
	{/each}
</svg>

<style>
	.rg-world-map {
		display: block;
		width: 100%;
		height: 100%;
	}

	.rg-world-map--hex {
		transition: opacity var(--duration-fast) var(--ease);
	}

	.rg-world-map--target {
		cursor: pointer;
	}

	/* The outline overlay shows focus, so the usual focus ring would only box the hex. */
	.rg-world-map--target:focus-visible {
		outline: none;
	}

	.rg-world-map--target:hover,
	.rg-world-map--target:focus-visible {
		filter: brightness(1.15);
	}

	.rg-world-map--dim {
		opacity: 0.35;
	}

	/* The same colour as the fill, so no seam shows between two wedges. */
	.rg-world-map--wedge {
		stroke-width: 0.6;
		stroke-linejoin: round;
	}

	.rg-world-map--island {
		stroke: var(--chrome);
		stroke-width: 0.8;
	}

	.rg-world-map--edge {
		fill: none;
		stroke: var(--chrome);
		stroke-width: 2;
	}

	/* Unexplored hexes are dashed, like fog over the map. */
	.rg-world-map--fog {
		fill: var(--unexplored);
		stroke: var(--line-strong);
		stroke-width: 1.5;
		stroke-dasharray: 5 4;
	}

	.rg-world-map--outpost,
	.rg-world-map--token {
		stroke: var(--ink);
		stroke-width: 1.2;
	}

	.rg-world-map--toppled {
		fill: var(--ink);
		stroke-width: 1.5;
	}

	.rg-world-map--mark {
		fill: var(--ink);
	}

	.rg-world-map--outline {
		fill: none;
		pointer-events: none;
		stroke-linejoin: round;
	}

	/* A target is green, the colour the design uses for valid choices. */
	.rg-world-map--outline-target {
		stroke: var(--ok);
		stroke-width: 2.5;
	}

	/* A previewed tile: gold like the chosen hex, solid, under the selection's own outline. */
	.rg-world-map--outline-preview {
		stroke: var(--gold);
		stroke-width: 3;
	}

	.rg-world-map--preview {
		opacity: 0.85;
	}

	.rg-world-map--outline-focus {
		stroke: var(--gold);
		stroke-width: 3;
		stroke-dasharray: 5 3;
	}

	.rg-world-map--outline-selected {
		stroke: var(--gold);
		stroke-width: 3.5;
		stroke-dasharray: none;
	}
</style>
