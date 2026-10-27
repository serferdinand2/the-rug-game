<!-- The World Map: the real board's flat-topped hex grid, each territory drawn from its corner terrains and island, with the outposts and tokens on it and the hexes a decision can target. -->
<script module>
	/**
	 * Properties of the WorldMap component itself.
	 * @typedef {Object} WorldMapOwnProps
	 * @property {import('../../hexmap.js').MapHex[]} hexes - Every hex of the board, from mapHexes(view) at HEX_SIZE
	 * @property {string[]} [targets=[]] - Hex keys a decision can choose; each becomes a button and the other hexes dim
	 * @property {Record<string, number>} [scores={}] - The best VP a picked tile scores on each target hex (hex key to VP): a "+N VP" tag sits near the top of that hex, and its label ends "Up to N VP."
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
		coastLines,
		cornerWedge,
		fitBox,
		hexCorner,
		hexPicture,
		islandParts,
		overlayBox,
		pieceSpots,
		svgPoints,
	} from '../../hexmap.js';
	import {
		CLOUD_SIZE,
		CLOUD_SPOT,
		VOLCANO_SIZE,
		VOLCANO_SPOTS,
		volcanoCorner,
	} from '../../art/hex-overlays.js';
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

	// Clip ids must differ between the maps on one page.
	const uid = $props.id();

	const CORNERS = [0, 1, 2, 3, 4, 5];
	const ORIGIN = /** @type {[number, number]} */ ([0, 0]);
	// The clips are drawn once round the origin; each hex's art is moved there with a translate.
	const WEDGE_CLIPS = CORNERS.map((k) =>
		svgPoints(cornerWedge(ORIGIN, k, HEX_SIZE))
	);
	// Island clips by the number of parts (an island has at most 6), then the part.
	const ISLAND_CLIPS = [1, 2, 3, 4, 5, 6].map((n) =>
		islandParts(ORIGIN, Array(n).fill('sea'), HEX_SIZE).map((part) =>
			svgPoints(part.points)
		)
	);
	const PICTURE = hexPicture(ORIGIN, HEX_SIZE);
	// The cloud sits at one spot in every hex; the volcano on its mountains' corner (#6).
	const CLOUD = overlayBox(CLOUD_SPOT, CLOUD_SIZE, HEX_SIZE);
	const VOLCANOES = VOLCANO_SPOTS.map((spot) =>
		overlayBox(spot, [VOLCANO_SIZE, VOLCANO_SIZE], HEX_SIZE)
	);
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
					targetSet.has(hex.key) && hex.key in scores
						? scores[hex.key]
						: null,
				outline: svgPoints(
					CORNERS.map((k) => hexCorner(hex.center, k, HEX_SIZE))
				),
				wedges: hex.corners
					? hex.corners.map((terrain, k) => ({ terrain, k }))
					: [],
				islands: islandParts(ORIGIN, hex.island, HEX_SIZE).map(
					(part, i) => ({
						terrain: part.terrain,
						i,
						n: hex.island.length,
						points: svgPoints(part.points),
					})
				),
				coasts: hex.corners
					? coastLines(ORIGIN, hex.corners, HEX_SIZE).map((line) => ({
							x: line.to[0],
							y: line.to[1],
						}))
					: [],
				unexploredPicture: hexPicture(hex.center, HEX_SIZE),
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
			<g transform="translate({hex.center[0]} {hex.center[1]})">
				{#each hex.wedges as wedge (wedge.k)}
					<image
						class="rg-world-map--art"
						href={artUrl(`hex/${wedge.terrain}`)}
						{...PICTURE}
						preserveAspectRatio="none"
						clip-path="url(#{uid}-w{wedge.k})" />
				{/each}
				{#each hex.coasts as coast, i (i)}
					<line
						class="rg-world-map--coast"
						x1="0"
						y1="0"
						x2={coast.x}
						y2={coast.y} />
				{/each}
				{#each hex.islands as part (part.i)}
					<image
						class="rg-world-map--art"
						href={artUrl(`hex/${part.terrain}`)}
						{...PICTURE}
						preserveAspectRatio="none"
						clip-path="url(#{uid}-i{part.n}-{part.i})" />
					<polygon
						class="rg-world-map--island"
						points={part.points} />
				{/each}
				{#if hex.clouds}
					<image
						class="rg-world-map--art"
						href={artUrl('hex/cloud')}
						{...CLOUD}
						preserveAspectRatio="none" />
				{/if}
				{#if hex.volcano}
					<image
						class="rg-world-map--art"
						href={artUrl('hex/volcano')}
						{...VOLCANOES[volcanoCorner(hex.corners ?? [])]}
						preserveAspectRatio="none" />
				{/if}
			</g>
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
				{...hex.unexploredPicture}
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
	<defs>
		{#each WEDGE_CLIPS as points, k (k)}
			<clipPath id="{uid}-w{k}"><polygon {points} /></clipPath>
		{/each}
		{#each ISLAND_CLIPS as parts, n (n)}
			{#each parts as points, i (i)}
				<clipPath id="{uid}-i{n + 1}-{i}"
					><polygon {points} /></clipPath>
			{/each}
		{/each}
	</defs>
	{#each drawn as hex (hex.key)}
		{#if hex.target}
			<g
				class="rg-world-map--hex rg-world-map--target"
				role="button"
				tabindex="0"
				class:rg-world-map--preview={hex.previewed}
				aria-label={hex.score === null
					? hex.label
					: addWords(hex.label, `up to ${hex.score} VP`)}
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
	<!-- The VP the picked tile scores on a lit hex, above the outlines. -->
	{#each drawn as hex (hex.key)}
		{#if hex.score !== null}
			<g
				class="rg-world-map--score"
				aria-hidden="true">
				<rect
					class="rg-world-map--score-box"
					x={hex.center[0] - 14}
					y={hex.center[1] - 30}
					width="28"
					height="12"
					rx="2" />
				<text
					class="rg-world-map--score-text"
					x={hex.center[0]}
					y={hex.center[1] - 24}
					text-anchor="middle"
					dominant-baseline="central"
					font-size="8">+{hex.score} VP</text>
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

	.rg-world-map--dim {
		opacity: 0.35;
	}

	/* The terrain pictures are pixel art: keep their edges hard when they are scaled. */
	.rg-world-map--art {
		image-rendering: pixelated;
	}

	/* The shore, where land meets sea inside a territory. */
	.rg-world-map--coast {
		stroke: var(--coast);
		stroke-width: 1.2;
		stroke-linecap: round;
	}

	.rg-world-map--island {
		fill: none;
		stroke: var(--chrome);
		stroke-width: 0.8;
	}

	.rg-world-map--edge {
		fill: none;
		stroke: var(--chrome);
		stroke-width: 2;
	}

	/* Unexplored hexes are dashed, like fog over the map. */
	.rg-world-map--fog-fill {
		fill: var(--unexplored);
	}

	.rg-world-map--fog {
		fill: none;
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

	/* A score tag: a gold box with bold ink text, 15px at the reference size. */
	.rg-world-map--score {
		pointer-events: none;
	}

	.rg-world-map--score-box {
		fill: var(--gold);
		stroke: var(--ink);
		stroke-width: 0.6;
	}

	.rg-world-map--score-text {
		fill: var(--ink);
		font-weight: 700;
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
