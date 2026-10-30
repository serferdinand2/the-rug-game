<!-- The World Map: the real board's flat-topped hex grid, its explored territories painted as one 2.5D picture (#134), with the outposts and tokens on it and the hexes a decision can target. -->
<script module>
	/**
	 * Properties of the WorldMap component itself.
	 * @typedef {Object} WorldMapOwnProps
	 * @property {import('../../hexmap.js').MapHex[]} hexes - Every hex of the board, from mapHexes(view) at HEX_SIZE
	 * @property {string[]} [targets=[]] - Hex keys a decision can choose; each becomes a button and the other hexes dim
	 * @property {Record<string, number>} [scores={}] - The VP a picked tile scores on each target hex (hex key to VP): a "+N VP" tag sits near the top of that hex, and its label ends "Up to N VP.", the best of its turns there, or "N VP." on the selected hex, where the tile lies in the turn chosen
	 * @property {string | null} [selected=null] - The chosen hex, outlined in gold
	 * @property {{ hex: string, corners: import('../../ui.js').Terrain[], island: import('../../ui.js').Terrain[], clouds?: boolean, volcano?: boolean } | null} [preview=null] - A tile to show on a hex before it is explored: drawn like an explored hex, with its clouds or volcano, at 85% opacity with a gold outline
	 * @property {string[]} [fresh=[]] - Hexes that just changed (#29): a gold outline pulses on each twice, unless the system asks for reduced motion
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
		fitBox,
		hexCorner,
		hexPicture,
		pieceSpots,
		svgPoints,
	} from '../../hexmap.js';
	import {
		mapArt,
		mapPictureBox,
		paintedMap,
		pictureUrl,
	} from '../../painted-map.js';
	import { paintTerritory } from '../../art/paint/map.js';
	import { artUrl, playerColor } from '../../ui.js';

	/** @type {WorldMapProps} */
	let {
		hexes,
		targets = [],
		scores = {},
		selected = null,
		preview = null,
		fresh = [],
		label = 'World map',
		onWorldMapSelect,
		...attr
	} = $props();

	const CORNERS = [0, 1, 2, 3, 4, 5];
	// A VP tag near a hex's top, in map units: the text is 11, so it stays 10px or more down to 1366×768 on the
	// 61-hex map, and the box keeps clear of the outline along the top edge (y = -34.6 for HEX_SIZE 40).
	const TAG = { width: 36, height: 14, top: -32, font: 11 };
	// A Nomads piece's mark, for a piece of side 1: a house for a building, a narrow tower for a landmark.
	const MARKS = {
		building: '-0.26,0.26 -0.26,-0.04 0,-0.28 0.26,-0.04 0.26,0.26',
		landmark: '-0.12,0.3 -0.12,-0.1 0,-0.32 0.12,-0.1 0.12,0.3',
	};

	// The hex keyboard focus is on, outlined above its neighbours.
	/** @type {string | null} */
	let focused = $state(null);
	// The blob URLs of the painted map and of the previewed tile, made and revoked by the effects below.
	/** @type {string | undefined} */
	let mapHref = $state();
	/** @type {string | undefined} */
	let previewHref = $state();

	let box = $derived(fitBox(hexes, HEX_SIZE));
	let viewBox = $derived(
		box.width ? `${box.x} ${box.y} ${box.width} ${box.height}` : undefined
	);
	// The terrain alone, as text: a new view with the same territories gives the same text, so the map is repainted
	// only when a territory is explored, never for a piece, a hover or a choice (#134).
	let terrain = $derived(JSON.stringify(mapArt(hexes)));
	let painted = $derived(paintedMap(JSON.parse(terrain)));
	let pictureBox = $derived(
		painted ? mapPictureBox(painted, HEX_SIZE) : null
	);
	// A tile shown before it is explored is painted on its own, at its turn, so the map is not repainted for it.
	let previewTerrain = $derived(
		preview
			? JSON.stringify({
					corners: preview.corners,
					island: preview.island,
					clouds: preview.clouds ?? false,
					volcano: preview.volcano ?? false,
				})
			: null
	);
	let previewCanvas = $derived(
		previewTerrain ? paintTerritory(JSON.parse(previewTerrain)) : null
	);
	let targetSet = $derived(new Set(targets));
	let targeting = $derived(targetSet.size > 0);
	let drawn = $derived(
		hexes.map((raw) => {
			const previewed = preview !== null && preview.hex === raw.key;
			const hex = previewed
				? {
						...raw,
						corners: preview.corners,
						island: preview.island,
						clouds: preview.clouds ?? false,
						volcano: preview.volcano ?? false,
						label: addWords(raw.label, 'showing the chosen tile'),
					}
				: raw;
			return {
				...hex,
				previewed,
				target: targetSet.has(hex.key),
				score:
					targetSet.has(hex.key) &&
					typeof scores[hex.key] === 'number'
						? scores[hex.key]
						: null,
				// The painted map shows its terrain: a veil dims it when a decision lights other hexes.
				veiled:
					targeting &&
					raw.corners !== null &&
					!targetSet.has(hex.key),
				outline: svgPoints(
					CORNERS.map((k) => hexCorner(hex.center, k, HEX_SIZE))
				),
				picture: hexPicture(hex.center, HEX_SIZE),
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
				hex.key === focused ||
				fresh.includes(hex.key)
		)
	);

	$effect(() => {
		if (!painted) {
			mapHref = undefined;
			return;
		}
		const url = pictureUrl(painted.canvas);
		mapHref = url;
		return () => URL.revokeObjectURL(url);
	});

	$effect(() => {
		if (!previewCanvas) {
			previewHref = undefined;
			return;
		}
		const url = pictureUrl(previewCanvas);
		previewHref = url;
		return () => URL.revokeObjectURL(url);
	});

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
	 * Words added to a hex's label: a sentence of their own after a full stop, otherwise after a comma.
	 * @param {string} text - The label, such as 'Hex −1,−1: unexplored.'
	 * @param {string} words - In lower case, such as 'up to 3 VP'
	 * @returns {string} Such as 'Hex −1,−1: unexplored. Up to 3 VP.'
	 */
	function addWords(text, words) {
		return text.endsWith('.')
			? `${text} ${words[0].toUpperCase()}${words.slice(1)}.`
			: `${text}, ${words}`;
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
			{#if hex.previewed && previewHref}
				<image
					class="rg-world-map--art"
					href={previewHref}
					{...hex.picture}
					preserveAspectRatio="none" />
			{/if}
			<!-- The terrain is in the painted map below; the face takes the pointer and the hover. -->
			<polygon
				class="rg-world-map--face"
				points={hex.outline} />
			<polygon
				class="rg-world-map--edge"
				points={hex.outline} />
		{:else}
			<polygon
				class="rg-world-map--fog-fill"
				points={hex.outline} />
			<image
				class="rg-world-map--art"
				href={artUrl('hex/unexplored')}
				{...hex.picture}
				preserveAspectRatio="none" />
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
	<!-- Every explored territory in one painted picture, under the hexes' faces, edges and pieces (#134). -->
	{#if pictureBox && mapHref}
		<image
			class="rg-world-map--art rg-world-map--terrain"
			href={mapHref}
			{...pictureBox}
			preserveAspectRatio="none"
			aria-hidden="true" />
	{/if}
	{#each drawn as hex (hex.key)}
		{#if hex.veiled}
			<polygon
				class="rg-world-map--veil"
				points={hex.outline} />
		{/if}
	{/each}
	{#each drawn as hex (hex.key)}
		{#if hex.target}
			<g
				class="rg-world-map--hex rg-world-map--target"
				role="button"
				tabindex="0"
				class:rg-world-map--preview={hex.previewed}
				aria-label={hex.score === null
					? hex.label
					: addWords(
							hex.label,
							hex.key === selected
								? `${hex.score} VP`
								: `up to ${hex.score} VP`
						)}
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
			class:rg-world-map--outline-fresh={fresh.includes(hex.key) &&
				!hex.target &&
				hex.key !== selected}
			points={hex.outline} />
	{/each}
	<!-- The VP the picked tile scores on a lit hex, above the outlines, inside the hex's top edge (y = -34.6). -->
	{#each drawn as hex (hex.key)}
		{#if hex.score !== null}
			<g
				class="rg-world-map--score"
				aria-hidden="true">
				<rect
					class="rg-world-map--score-box"
					x={hex.center[0] - TAG.width / 2}
					y={hex.center[1] + TAG.top}
					width={TAG.width}
					height={TAG.height}
					rx="2" />
				<text
					class="rg-world-map--score-text"
					x={hex.center[0]}
					y={hex.center[1] + TAG.top + TAG.height / 2}
					text-anchor="middle"
					dominant-baseline="central"
					font-size={TAG.font}>+{hex.score} VP</text>
			</g>
		{/if}
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

	/* An explored target's terrain is in the painted map, under the filter's reach: its face lightens it instead. */
	.rg-world-map--target:hover .rg-world-map--face,
	.rg-world-map--target:focus-visible .rg-world-map--face {
		fill: color-mix(in srgb, var(--text) 15%, transparent);
	}

	.rg-world-map--dim {
		opacity: 0.35;
	}

	/* The terrain pictures are pixel art: keep their edges hard when they are scaled. */
	.rg-world-map--art {
		image-rendering: pixelated;
	}

	/* Transparent, but painted, so the whole hex takes the pointer. */
	.rg-world-map--face {
		fill: transparent;
	}

	/* Faint: the painted map draws its own faint rim between territories (issue 134). */
	.rg-world-map--edge {
		fill: none;
		stroke: var(--chrome);
		stroke-width: 1;
		stroke-opacity: 0.35;
	}

	/* Over a dimmed explored hex's terrain, the play area's colour, as the dimmed hexes' 35% opacity shows it. */
	.rg-world-map--veil {
		fill: var(--surface);
		fill-opacity: 0.65;
		pointer-events: none;
	}

	/* Unexplored hexes are dashed, like fog over the map. */
	.rg-world-map--fog-fill {
		fill: var(--unexplored);
	}

	.rg-world-map--fog {
		fill: none;
		stroke: var(--line-strong);
		stroke-width: 1.5;
		stroke-opacity: 1;
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

	/* A score tag: a gold box with bold ink text, about 15px at 1920×1080. */
	.rg-world-map--score {
		pointer-events: none;
	}

	.rg-world-map--score-box {
		fill: var(--vp-tag);
		stroke: var(--vp-tag-text);
		stroke-width: 0.6;
	}

	.rg-world-map--score-text {
		fill: var(--vp-tag-text);
		font-weight: var(--weight-bold);
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

	/* A hex that just changed pulses gold twice, then fades (#29). */
	.rg-world-map--outline-fresh {
		stroke: var(--gold);
		stroke-width: 3.5;
		stroke-opacity: 0;
		animation: rg-world-map-fresh 0.9s var(--ease-out) 2;
	}

	@keyframes rg-world-map-fresh {
		30% {
			stroke-opacity: 1;
		}

		100% {
			stroke-opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-world-map--outline-fresh {
			animation: none;
		}
	}
</style>
