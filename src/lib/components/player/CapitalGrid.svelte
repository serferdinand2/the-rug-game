<!-- A 9×9 capital: ground tiles under the mat's relief, building, cube and player-token SVGs, placement controls, lit target plots and completed-group overlays. -->
<script module>
	/** @typedef {import('../../capital.js').PlotKind} PlotKind */
	/** @typedef {import('../../capital.js').GroupKind} GroupKind */

	/**
	 * A landmark on the capital, placed or locked.
	 * @typedef {Object} CapitalGridPiece
	 * @property {string} id - The landmark's slug, such as 'lighthouse'
	 * @property {string} name - Its name, such as 'Lighthouse'
	 * @property {readonly string[]} footprint - Its footprint as printed
	 * @property {number} row - The top row of its turned shape, 0–8; negative, or running past row 8, when it hangs over the edge (R106)
	 * @property {number} col - The left column of its turned shape, 0–8; negative, or running past column 8, when it hangs over the edge (R106)
	 * @property {number} [rotation=0] - Quarter turns clockwise, 0–3
	 * @property {boolean} [locked=false] - Confirmed: no controls, cannot move, and counts towards completed groups
	 * @property {boolean} [fresh=false] - Just locked: a green glow
	 * @property {string} [color] - Its outline colour, as a token reference
	 */

	/**
	 * A plot a decision can choose, such as an open plot for a gained building.
	 * @typedef {Object} CapitalGridTarget
	 * @property {number} row - 0–8
	 * @property {number} col - 0–8
	 */

	/**
	 * A building, an Architects cube or a player's token, shown faintly on a plot before it is placed there.
	 * @typedef {Object} CapitalGridPreview
	 * @property {number} row - 0–8
	 * @property {number} col - 0–8
	 * @property {string} [building] - The income building's id: 'market', 'house', 'farm' or 'armory'
	 * @property {boolean} [cube=false] - An Architects cube instead of a building (#168)
	 * @property {import('../../ui.js').Seat} [token] - A player's token instead, in that seat's colour (F&F, #40)
	 */

	/**
	 * A player's token filling a plot: Dream Monitors' own, or a Weefolk token an opponent gave (F&F, #40).
	 * @typedef {Object} CapitalGridToken
	 * @property {number} row - 0–8
	 * @property {number} col - 0–8
	 * @property {import('../../ui.js').Seat} seat - Whose token, for its colour
	 */

	/**
	 * A legal place for an unlocked landmark, as the engine offers it (#112).
	 * @typedef {import('../../placement.js').PiecePosition} CapitalGridPosition
	 */

	/**
	 * Properties of the CapitalGrid component itself.
	 * @typedef {Object} CapitalGridOwnProps
	 * @property {PlotKind[]} plots - Every plot, row by row: 81 on a basic mat
	 * @property {import('../../capital.js').Shape} [shape] - The mat's rows, columns and districts, the basic 9 × 9 by default: the Archipelago is 11 rows, and its islands and Cloud City's clouds are districts of their own shape (#36)
	 * @property {import('../../ui.js').CapitalBiome} [biome='mountain'] - The mat's terrain: its ground tiles, its features picture where it prints one (#132), and its relief over the printed impassable plots where the biome has one (#82)
	 * @property {number} [terrainSeed=0] - Visual seed supplied by the game's setup; 0 is the library fixture
	 * @property {CapitalGridPiece[]} [pieces=[]] - Landmarks on the grid, drawn over the plots they cover; a locked one may hang over the edge, and only its plots on the grid count
	 * @property {CapitalGridPosition[] | null} [positions=null] - The engine's legal top-left corners and turns for the unlocked pieces: they move, turn, snap and light the drop outline only among these, over the edge included (R14). Null keeps the grid's own in-grid fit check, for the library
	 * @property {GroupKind | null} [highlight=null] - Cover each completed row, column or district with one flat green rectangle
	 * @property {boolean} [awaitingPlacement=false] - Something is waiting to be placed: a green outline around the grid
	 * @property {boolean} [room=false] - Keep room around the grid for the pieces that hang over its edges (R106), so nothing next to it is covered
	 * @property {CapitalGridTarget[]} [targets=[]] - Plots a decision can choose: each gets a green outline and becomes a button that fires onCapitalGridPlotClick
	 * @property {CapitalGridPreview | null} [preview=null] - The chosen building, drawn faintly on its plot until it is placed
	 * @property {CapitalGridToken[]} [tokens=[]] - Players' tokens on plots, each in its seat's colour (F&F, #40)
	 * @property {CapitalGridTarget[]} [fresh=[]] - Plots just built on (#29): each glows green once, unless the system asks for reduced motion
	 * @property {string} [label] - Names the grid for assistive technology; 'Capital city, 9 by 9 plots' by default
	 * @property {Function} [onCapitalGridPlotClick] - Callback fired with { row, col } when a plot is clicked, for click-to-place from the tray
	 * @property {Function} [onCapitalGridDrop] - Callback fired with { id, row, col } when a piece from the tray is dropped; row and col are where its top-left corner landed, not yet snapped, and may be off the grid
	 * @property {Function} [onCapitalGridMove] - Callback fired with { id, row, col } when a placed piece is dragged or moved with the arrow keys, already snapped to one of the positions (or where it fits, without them)
	 * @property {Function} [onCapitalGridRotate] - Callback fired with { id, rotation, row, col }: the next legal turn, and where the turned piece goes
	 * @property {Function} [onCapitalGridConfirm] - Callback fired with { id } to lock a placed piece
	 * @property {Function} [onCapitalGridReturn] - Callback fired with { id } to send a placed piece back to the tray
	 * @property {Function} [onCapitalGridDragStart] - Callback fired with { id } when a placed piece starts being dragged, so the tray can offer itself as a return target
	 * @property {Function} [onCapitalGridDragEnd] - Callback fired with { id } when that drag ends, wherever it ends
	 */

	/**
	 * Properties for the CapitalGrid component, including any attributes for its root element.
	 * @typedef {CapitalGridOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} CapitalGridProps
	 *
	 * @example
	 * <CapitalGrid
	 *   {plots}
	 *   targets={[{ row: 0, col: 3 }, { row: 4, col: 5 }]}
	 *   preview={{ row: 4, col: 5, building: 'farm' }}
	 *   onCapitalGridPlotClick={(event) => pick(event.value)}
	 * />
	 *
	 * @example
	 * <CapitalGrid
	 *   {plots}
	 *   pieces={[{ id: 'lighthouse', name: 'Lighthouse', footprint: FOOTPRINTS.lighthouse, row: 3, col: 4, color: 'var(--exploration)' }]}
	 *   positions={prompt.positions}
	 *   highlight={hovered}
	 *   awaitingPlacement
	 *   onCapitalGridMove={(event) => move(event.value)}
	 *   onCapitalGridConfirm={(event) => lock(event.value.id)}
	 * />
	 */
</script>

<script>
	import { tick } from 'svelte';
	import LandmarkPiece from './LandmarkPiece.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { artUrl } from '../../ui.js';
	import PlayerToken from './PlayerToken.svelte';
	import {
		featureUrl,
		overlayUrl,
		plotTerrain,
		reliefUrl,
	} from '../../capital-terrain.js';
	import { BUILDING_IDS } from '../../engine/data/ids.js';
	import { PITCH, reliefSize } from '../../art/relief.js';
	import {
		BASIC_SHAPE,
		completedGroups,
		districtEdges,
		groupBounds,
		plotIndex,
		plotPosition,
	} from '../../capital.js';
	import {
		fitsAt,
		overhangOffset,
		overhangReach,
		pieceArea,
		pieceShape,
		plotFromPointer,
		readGrab,
		rotatePiece,
		snapAmong,
		snapPiece,
		stepAmong,
		stepPiece,
		turnAmong,
		withPieces,
	} from '../../placement.js';

	/** @type {CapitalGridProps} */
	let {
		plots,
		shape = BASIC_SHAPE,
		biome = 'mountain',
		terrainSeed = 0,
		pieces = [],
		positions = null,
		highlight = null,
		awaitingPlacement = false,
		room = false,
		targets = [],
		preview = null,
		tokens = [],
		fresh = [],
		label = `Capital city, ${shape.rows} by ${shape.cols} plots`,
		onCapitalGridPlotClick,
		onCapitalGridDrop,
		onCapitalGridMove,
		onCapitalGridRotate,
		onCapitalGridConfirm,
		onCapitalGridReturn,
		onCapitalGridDragStart,
		onCapitalGridDragEnd,
		...attr
	} = $props();

	/** The income buildings, which draw their pictures on their plots. @type {ReadonlySet<string>} */
	const BUILDINGS = new Set(BUILDING_IDS);

	/** Where the dragged piece was grabbed, in plots from its top-left corner. */
	let grab = { x: 0.5, y: 0.5 };
	/** The pieces seen so far, so a newly placed one can take the focus; null before the first render. @type {Set<string> | null} */
	let seen = null;
	/** Each piece on the grid by its id, to focus a newly placed one. @type {Record<string, { focus: () => void } | null>} */
	const drawn = {};

	/** @type {HTMLDivElement | undefined} */
	let element = $state();
	/** The placed piece being dragged. @type {string | null} */
	let draggingId = $state(null);
	let dragTarget = $state(false);
	let legalDrop = $state(false);

	let locked = $derived(
		withPieces(
			plots,
			pieces.filter((piece) => piece.locked),
			shape
		)
	);
	/** How many plots the pieces hang over each edge, at most, when room is kept for them. */
	let reach = $derived(overhangReach(pieces));
	/** A column's share of the space the grid sits in for each plot of overhang: plots are square, and margins follow the width. */
	let margin = $derived(
		room
			? [reach.top, reach.right, reach.bottom, reach.left]
					.map((plots) => `calc(${plots} * 100% / ${shape.cols})`)
					.join(' ')
			: undefined
	);
	let width = $derived(
		room
			? `calc(100% - ${reach.left + reach.right} * 100% / ${shape.cols})`
			: undefined
	);
	/** The relief's size in pixels, which the plots and gaps line up with (#82, #36). */
	let pixels = $derived(reliefSize(shape.rows, shape.cols));
	/** The nine 3×3 districts keep their CSS lines; a mat of another shape draws its district sides (#36). */
	let squared = $derived(
		shape.rows === BASIC_SHAPE.rows &&
			shape.cols === BASIC_SHAPE.cols &&
			JSON.stringify(shape.districts) ===
				JSON.stringify(BASIC_SHAPE.districts)
	);
	let edges = $derived(squared ? [] : districtEdges(shape));
	/** A completed group as one rectangle, or plot by plot when it isn't one, as an island or a cloud may not be. */
	let overlays = $derived(
		highlight
			? completedGroups(locked, highlight, shape).flatMap((group) => {
					const bounds = groupBounds(group, shape);
					return bounds.rows * bounds.cols === group.length
						? [bounds]
						: group.map((index) => ({
								...plotPosition(index, shape),
								rows: 1,
								cols: 1,
							}));
				})
			: []
	);
	let targeted = $derived(
		new Set(
			targets.map((target) => plotIndex(target.row, target.col, shape))
		)
	);
	let previewed = $derived(
		preview ? plotIndex(preview.row, preview.col, shape) : null
	);
	/** Each token's seat by its plot. */
	let tokenSeats = $derived(
		new Map(
			tokens.map((token) => [
				plotIndex(token.row, token.col, shape),
				token.seat,
			])
		)
	);
	let freshPlots = $derived(
		new Set(fresh.map((plot) => plotIndex(plot.row, plot.col, shape)))
	);
	let terrain = $derived(plotTerrain(plots, biome, terrainSeed));
	let feature = $derived(featureUrl(biome));
	let relief = $derived(reliefUrl(biome));
	// What F&F's mats print over their relief: the bottle's glass, the veil, the herds, the rings and the imps (#133, #40).
	let overlay = $derived(overlayUrl(biome));

	$effect(() => {
		const ids = pieces.map((piece) => piece.id);
		const added = pieces.find(
			(piece) => !piece.locked && !seen?.has(piece.id)
		);
		const firstRender = seen === null;
		seen = new Set(ids);
		if (draggingId && !ids.includes(draggingId) && element) {
			// A piece dropped on the tray can leave the grid before its dragend arrives.
			const id = draggingId;
			draggingId = null;
			if (typeof onCapitalGridDragEnd === 'function') {
				onCapitalGridDragEnd(new ComponentEvent({ id }, element));
			}
		}
		if (!firstRender && added) {
			// After tick, so the new piece's binding is set.
			tick().then(() => {
				const focused = document.activeElement;
				if (!focused || focused === document.body) {
					drawn[added.id]?.focus();
				}
			});
		}
	});

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		const plot = /** @type {HTMLElement | null} */ (
			/** @type {Element} */ (event.target).closest('[data-plot]')
		);
		if (!plot || typeof onCapitalGridPlotClick !== 'function') {
			return;
		}
		onCapitalGridPlotClick(
			new ComponentEvent(
				plotPosition(Number(plot.dataset.plot), shape),
				plot,
				event
			)
		);
	};

	/**
	 * @param {DragEvent} event
	 */
	const dragoverHandler = (event) => {
		if (!event.dataTransfer?.types.includes('text/plain')) {
			return;
		}
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		dragTarget = true;
		const piece = pieces.find((candidate) => candidate.id === draggingId);
		if (piece) {
			const { row, col } = topLeft(event, grab);
			legalDrop = positions
				? positions.some(
						(position) =>
							position.rotation === (piece.rotation ?? 0) &&
							position.row === row &&
							position.col === col
					)
				: fitsAt(plots, pieces, piece, row, col, shape);
		}
	};

	/**
	 * @param {DragEvent} event
	 */
	const dragleaveHandler = (event) => {
		const next = /** @type {Node | null} */ (event.relatedTarget);
		if (!next || !element?.contains(next)) {
			dragTarget = false;
			legalDrop = false;
		}
	};

	/**
	 * @param {DragEvent} event
	 */
	const dropHandler = (event) => {
		const id = event.dataTransfer?.getData('text/plain');
		dragTarget = false;
		legalDrop = false;
		if (!id || !event.dataTransfer) {
			return;
		}
		event.preventDefault();
		const { row, col } = topLeft(
			event,
			readGrab(event.dataTransfer) ?? grab
		);
		const target = /** @type {HTMLElement} */ (event.currentTarget);
		const piece = pieces.find((candidate) => candidate.id === id);
		if (!piece) {
			if (typeof onCapitalGridDrop === 'function') {
				onCapitalGridDrop(
					new ComponentEvent({ id, row, col }, target, event)
				);
			}
			return;
		}
		const position = piece.locked
			? null
			: positions
				? snapAmong(positions, piece.rotation ?? 0, row, col)
				: snapPiece(plots, pieces, piece, row, col, shape);
		if (
			position &&
			(position.row !== piece.row || position.col !== piece.col) &&
			typeof onCapitalGridMove === 'function'
		) {
			onCapitalGridMove(
				new ComponentEvent({ id, ...position }, target, event)
			);
		}
	};

	/**
	 * @param {ComponentEvent} event - From LandmarkPiece: { id, grab }
	 * @param {CapitalGridPiece} piece
	 */
	const pieceDragStartHandler = (event, piece) => {
		grab = event.value.grab;
		draggingId = piece.id;
		if (typeof onCapitalGridDragStart === 'function') {
			onCapitalGridDragStart(
				new ComponentEvent(
					{ id: piece.id },
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * @param {ComponentEvent} event - From LandmarkPiece: { id, grab }
	 * @param {CapitalGridPiece} piece
	 */
	const pieceDragEndHandler = (event, piece) => {
		dragTarget = false;
		legalDrop = false;
		if (draggingId !== piece.id) {
			return;
		}
		draggingId = null;
		if (typeof onCapitalGridDragEnd === 'function') {
			onCapitalGridDragEnd(
				new ComponentEvent(
					{ id: piece.id },
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * @param {ComponentEvent} event - From LandmarkPiece: { id, row, col } with steps of -1, 0 or 1
	 * @param {CapitalGridPiece} piece
	 */
	const pieceMoveHandler = (event, piece) => {
		const { row, col } = event.value;
		const position = positions
			? stepAmong(positions, piece, row, col)
			: stepPiece(plots, pieces, piece, row, col, shape);
		if (position && typeof onCapitalGridMove === 'function') {
			onCapitalGridMove(
				new ComponentEvent(
					{ id: piece.id, ...position },
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * @param {ComponentEvent} event
	 * @param {CapitalGridPiece} piece
	 */
	const pieceRotateHandler = (event, piece) => {
		const turned = positions
			? turnAmong(positions, piece)
			: rotatePiece(plots, pieces, piece, shape);
		if (turned && typeof onCapitalGridRotate === 'function') {
			onCapitalGridRotate(
				new ComponentEvent(
					{ id: piece.id, ...turned },
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * @param {ComponentEvent} event
	 * @param {CapitalGridPiece} piece
	 */
	const pieceConfirmHandler = (event, piece) => {
		if (typeof onCapitalGridConfirm === 'function') {
			onCapitalGridConfirm(
				new ComponentEvent(
					{ id: piece.id },
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * @param {ComponentEvent} event
	 * @param {CapitalGridPiece} piece
	 */
	const pieceReturnHandler = (event, piece) => {
		if (typeof onCapitalGridReturn === 'function') {
			onCapitalGridReturn(
				new ComponentEvent(
					{ id: piece.id },
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * A target plot's name, counted from 1 as players read it.
	 * @param {number} index - The plot, row by row
	 * @returns {string}
	 */
	function targetLabel(index) {
		const { row, col } = plotPosition(index, shape);
		return `Place at row ${row + 1}, column ${col + 1}`;
	}

	/**
	 * The plot a dragged piece's top-left corner is over; off the grid when it hangs over the edge (R14).
	 * @param {MouseEvent} event
	 * @param {{ x: number, y: number }} from - Where the piece was grabbed, in plots
	 * @returns {{ row: number, col: number }}
	 */
	function topLeft(event, from) {
		const first = element?.querySelector('[data-plot="0"]');
		const next = element?.querySelector(`[data-plot="${shape.cols + 1}"]`);
		if (!first || !next) {
			return { row: 0, col: 0 };
		}
		const point = plotFromPointer(
			{ x: event.clientX, y: event.clientY },
			first.getBoundingClientRect(),
			next.getBoundingClientRect()
		);
		return {
			row: Math.round(point.row - from.y),
			col: Math.round(point.col - from.x),
		};
	}
</script>

<!-- Pointer users click a plot or drop on the grid; keyboard users place from the tray and move pieces with the arrow keys. -->
<div
	bind:this={element}
	role="group"
	aria-label={label}
	{...attr}
	class="rg-capital-grid {attr.class ? attr.class : ''}"
	class:rg-capital-grid--awaiting={awaitingPlacement}
	class:rg-capital-grid--drag-target={dragTarget}
	class:rg-capital-grid--legal-drop={legalDrop}
	class:rg-capital-grid--shaped={!squared}
	style:--rg-capital-grid-rows={shape.rows}
	style:--rg-capital-grid-cols={shape.cols}
	style:--rg-capital-grid-w={pixels.w}
	style:--rg-capital-grid-h={pixels.h}
	style:margin
	style:width
	onclick={clickHandler}
	ondragover={dragoverHandler}
	ondragleave={dragleaveHandler}
	ondrop={dropHandler}>
	{#snippet plot(/** @type {PlotKind} */ kind, /** @type {number} */ index)}
		{#if kind !== 'landmark'}
			<img
				class="rg-capital-grid--terrain"
				class:rg-capital-grid--cleared={terrain[index].cleared}
				src={terrain[index].ground}
				alt=""
				draggable="false" />
		{/if}
		{#if BUILDINGS.has(kind)}
			<img
				class="rg-capital-grid--building"
				src={artUrl(`building/${kind}`)}
				alt=""
				draggable="false" />
		{/if}
		{#if kind === 'token' && tokenSeats.has(index)}
			<span class="rg-capital-grid--building rg-capital-grid--token"
				><PlayerToken
					seat={tokenSeats.get(index)}
					decorative /></span>
		{/if}
		{#if terrain[index].cube}
			<img
				class="rg-capital-grid--building"
				src={artUrl('piece/architects-cube')}
				alt=""
				draggable="false" />
		{/if}
		{#if preview && index === previewed && preview.token}
			<span
				class="rg-capital-grid--building rg-capital-grid--preview rg-capital-grid--token"
				><PlayerToken
					seat={preview.token}
					decorative /></span>
		{:else if preview && index === previewed}
			<img
				class="rg-capital-grid--building rg-capital-grid--preview"
				src={preview.cube
					? artUrl('piece/architects-cube')
					: artUrl(`building/${preview.building}`)}
				alt=""
				draggable="false" />
		{/if}
	{/snippet}
	<!-- What the mat prints on its buildable plots (cacti, lily pads, beaches, cloud rims), between the ground and the relief (#132, #36). -->
	{#if feature}
		<img
			class="rg-capital-grid--feature"
			src={feature}
			alt=""
			aria-hidden="true"
			draggable="false" />
	{/if}
	<!-- The mat's impassable plots as one picture over the ground; the plots after it draw their buildings above it. -->
	{#if relief}
		<img
			class="rg-capital-grid--relief"
			src={relief}
			alt=""
			aria-hidden="true"
			draggable="false" />
	{/if}
	{#if overlay}
		<img
			class="rg-capital-grid--relief rg-capital-grid--overlay"
			src={overlay}
			alt=""
			aria-hidden="true"
			draggable="false" />
	{/if}
	{#each plots as kind, index (index)}
		{#if targeted.has(index)}
			<!-- The root's click handler reports the plot, so a target needs no handler of its own. -->
			<button
				type="button"
				class="rg-capital-grid--plot rg-capital-grid--{kind} rg-capital-grid--target"
				class:rg-capital-grid--fresh={freshPlots.has(index)}
				data-plot={index}
				aria-label={targetLabel(index)}
				aria-pressed={index === previewed}>
				{@render plot(kind, index)}
			</button>
		{:else}
			<i
				class="rg-capital-grid--plot rg-capital-grid--{kind}"
				class:rg-capital-grid--fresh={freshPlots.has(index)}
				data-plot={index}>
				{@render plot(kind, index)}
			</i>
		{/if}
	{/each}
	<!-- The sides between districts of a mat whose districts aren't the nine squares: Cloud City's clouds (#36). -->
	{#if edges.length > 0}
		<svg
			class="rg-capital-grid--districts"
			viewBox="0 0 {pixels.w} {pixels.h}"
			preserveAspectRatio="none"
			aria-hidden="true">
			{#each edges as edge (`${edge.row}-${edge.col}-${edge.side}`)}
				{#if edge.side === 'right'}
					<line
						x1={edge.col * PITCH + PITCH - 0.5}
						x2={edge.col * PITCH + PITCH - 0.5}
						y1={edge.row * PITCH}
						y2={edge.row * PITCH + PITCH} />
				{:else}
					<line
						x1={edge.col * PITCH}
						x2={edge.col * PITCH + PITCH}
						y1={edge.row * PITCH + PITCH - 0.5}
						y2={edge.row * PITCH + PITCH - 0.5} />
				{/if}
			{/each}
		</svg>
	{/if}
	{#each pieces as piece (piece.id)}
		{@const area = pieceArea(
			pieceShape(piece),
			piece.row,
			piece.col,
			shape
		)}
		<!-- A piece over the edge (R106) sits on its plots on the grid and reaches past them. -->
		<div
			class="rg-capital-grid--piece"
			data-piece={piece.id}
			style:grid-row="{area.row + 1} / span {area.rows}"
			style:grid-column="{area.col + 1} / span {area.cols}"
			style:top={overhangOffset(area.top, area.rows)}
			style:right={overhangOffset(area.right, area.cols)}
			style:bottom={overhangOffset(area.bottom, area.rows)}
			style:left={overhangOffset(area.left, area.cols)}>
			<LandmarkPiece
				bind:this={drawn[piece.id]}
				id={piece.id}
				name={piece.name}
				footprint={piece.footprint}
				rotation={piece.rotation ?? 0}
				state={piece.locked ? 'locked' : 'placed'}
				fresh={piece.fresh}
				dragging={draggingId === piece.id}
				color={piece.color}
				onLandmarkPieceDragStart={(
					/** @type {ComponentEvent} */ event
				) => pieceDragStartHandler(event, piece)}
				onLandmarkPieceDragEnd={(/** @type {ComponentEvent} */ event) =>
					pieceDragEndHandler(event, piece)}
				onLandmarkPieceMove={(/** @type {ComponentEvent} */ event) =>
					pieceMoveHandler(event, piece)}
				onLandmarkPieceRotate={(/** @type {ComponentEvent} */ event) =>
					pieceRotateHandler(event, piece)}
				onLandmarkPieceConfirm={(/** @type {ComponentEvent} */ event) =>
					pieceConfirmHandler(event, piece)}
				onLandmarkPieceReturn={(/** @type {ComponentEvent} */ event) =>
					pieceReturnHandler(event, piece)} />
		</div>
	{/each}
	{#each overlays as bounds (`${bounds.row}-${bounds.col}-${bounds.rows}-${bounds.cols}`)}
		<i
			class="rg-capital-grid--overlay"
			aria-hidden="true"
			style:grid-row="{bounds.row + 1} / span {bounds.rows}"
			style:grid-column="{bounds.col + 1} / span {bounds.cols}"></i>
	{/each}
</div>

<style>
	.rg-capital-grid {
		position: relative;
		isolation: isolate;
		display: grid;
		grid-template-columns: repeat(
			var(--rg-capital-grid-cols),
			minmax(0, 1fr)
		);
		grid-template-rows: repeat(var(--rg-capital-grid-rows), minmax(0, 1fr));
		/* The relief is 296 pixels across a basic mat: nine plots of 32 and eight gaps of 1. A gap of one relief pixel lines
		   the plots up with it (#82), across and down, on a mat of any shape (#36). */
		column-gap: calc(100% / var(--rg-capital-grid-w));
		row-gap: calc(100% / var(--rg-capital-grid-h));
		width: 100%;
		min-width: 0;
		aspect-ratio: var(--rg-capital-grid-w) / var(--rg-capital-grid-h);
		padding: var(--space-3);
		/* Nothing is clipped: a landmark may hang over the edge (R106). */
		overflow: visible;
		border-radius: var(--radius);
		background: var(--ink);
		transition:
			outline-color var(--duration-fast) var(--ease),
			box-shadow var(--duration-fast) var(--ease);
	}

	/* The dashed boundaries between the 3×3 districts, over the relief and the buildings. */
	.rg-capital-grid::before {
		content: '';
		position: absolute;
		z-index: 2;
		inset: var(--space-3);
		background:
			repeating-linear-gradient(
					to bottom,
					var(--bronze) 0 5px,
					transparent 5px 9px
				)
				33.333% 0 / 1px 100% no-repeat,
			repeating-linear-gradient(
					to bottom,
					var(--bronze) 0 5px,
					transparent 5px 9px
				)
				66.666% 0 / 1px 100% no-repeat,
			repeating-linear-gradient(
					to right,
					var(--bronze) 0 5px,
					transparent 5px 9px
				)
				0 33.333% / 100% 1px no-repeat,
			repeating-linear-gradient(
					to right,
					var(--bronze) 0 5px,
					transparent 5px 9px
				)
				0 66.666% / 100% 1px no-repeat;
		pointer-events: none;
	}

	/* A mat whose districts aren't the nine squares draws its own district sides instead (#36). */
	.rg-capital-grid--shaped::before {
		content: none;
	}

	.rg-capital-grid--districts {
		position: absolute;
		z-index: 2;
		top: var(--space-3);
		left: var(--space-3);
		width: calc(100% - 2 * var(--space-3));
		height: calc(100% - 2 * var(--space-3));
		overflow: visible;
		pointer-events: none;
		stroke: var(--bronze);
		stroke-width: 1px;
		stroke-dasharray: 5 4;
		vector-effect: non-scaling-stroke;
	}

	.rg-capital-grid--districts line {
		vector-effect: non-scaling-stroke;
	}

	.rg-capital-grid--awaiting,
	.rg-capital-grid--drag-target,
	.rg-capital-grid--legal-drop {
		outline: var(--border-thick) solid var(--ok);
		outline-offset: var(--focus-offset);
		box-shadow: var(--glow-ok);
	}

	.rg-capital-grid--plot {
		position: relative;
		display: block;
		min-width: 0;
		min-height: 0;
		border-radius: var(--radius);
		background: var(--line);
	}

	/* A plot just built on glows green once (#29). */
	.rg-capital-grid--fresh {
		z-index: 3;
		animation: rg-capital-grid-fresh 1.4s var(--ease-out);
	}

	@keyframes rg-capital-grid-fresh {
		25% {
			box-shadow:
				0 0 0 var(--border-thick) var(--ok),
				var(--glow-ok);
		}
	}

	/* Its building drops onto the plot and settles, squashing a little as it lands (issue 175). */
	.rg-capital-grid--fresh .rg-capital-grid--building {
		animation: rg-capital-grid-drop var(--duration-slow) var(--ease-in)
			backwards;
		transform-origin: 50% 100%;
	}

	@keyframes rg-capital-grid-drop {
		from {
			opacity: 0;
			transform: translateY(-70%);
		}
		70% {
			opacity: 1;
			transform: translateY(0) scale(1.08, 0.9);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-capital-grid--fresh,
		.rg-capital-grid--fresh .rg-capital-grid--building {
			animation: none;
		}
	}

	.rg-capital-grid--market,
	.rg-capital-grid--house,
	.rg-capital-grid--farm,
	.rg-capital-grid--armory {
		background: var(--surface);
	}

	/* A plot a decision can choose: a green outline drawn over its tiles. */
	.rg-capital-grid--target {
		padding: 0;
		border: 0;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.rg-capital-grid--target::before {
		content: '';
		position: absolute;
		z-index: 1;
		inset: 0;
		border: var(--border-thick) solid var(--ok);
		border-radius: var(--radius);
		pointer-events: none;
	}

	/* The pictures brighten, not the button: a filtered button would draw as a layer of its own, under the relief. */
	.rg-capital-grid--target:hover > img,
	.rg-capital-grid--target:focus-visible > img {
		filter: brightness(1.15);
	}

	.rg-capital-grid--target:hover::before,
	.rg-capital-grid--target[aria-pressed='true']::before {
		box-shadow: var(--glow-ok);
	}

	.rg-capital-grid--building {
		position: relative;
		z-index: 1;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		image-rendering: pixelated;
	}

	/* A player's token fills its plot as a building does (F&F, #40). */
	.rg-capital-grid--token :global(.rg-player-token) {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* The chosen building, faint until it is placed. */
	.rg-capital-grid--preview {
		position: absolute;
		z-index: 1;
		inset: 0;
		opacity: 0.6;
	}

	/* The ground recedes, so buildings, landmarks and cubes stand out. */
	.rg-capital-grid--terrain {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
		filter: var(--capital-ground);
	}

	/* A building on a printed impassable plot cleared it: its ground draws over the relief. */
	.rg-capital-grid--cleared {
		z-index: 1;
	}

	/* Exactly the content box, which the plots span, so its pixels meet theirs. The features lie under the relief, over
	   the ground, and a building on a feature's plot clears it as it clears an impassable one (#36). */
	.rg-capital-grid--feature,
	.rg-capital-grid--relief {
		position: absolute;
		z-index: 1;
		top: var(--space-3);
		left: var(--space-3);
		width: calc(100% - 2 * var(--space-3));
		height: calc(100% - 2 * var(--space-3));
		pointer-events: none;
		image-rendering: pixelated;
		filter: var(--capital-relief);
	}

	.rg-capital-grid--landmark {
		background: var(--exploration);
	}

	/* The wrapper spans the landmark's whole box, so it lets the pointer through to the plots under its empty cells; the shape's fill and the controls take it back (issue 171). */
	.rg-capital-grid--piece {
		position: absolute;
		z-index: 3;
		inset: 0;
		pointer-events: none;
	}

	.rg-capital-grid--overlay {
		position: absolute;
		z-index: 4;
		inset: 0;
		background: var(--overlay-ok);
		pointer-events: none;
	}
</style>
