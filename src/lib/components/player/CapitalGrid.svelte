<!-- A 9×9 capital: ground tiles under the mat's relief, building and cube SVGs, placement controls, lit target plots and completed-group overlays. -->
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
	 * A building shown faintly on a plot before it is placed there.
	 * @typedef {Object} CapitalGridPreview
	 * @property {number} row - 0–8
	 * @property {number} col - 0–8
	 * @property {string} building - The income building's id: 'market', 'house', 'farm' or 'armory'
	 */

	/**
	 * Properties of the CapitalGrid component itself.
	 * @typedef {Object} CapitalGridOwnProps
	 * @property {PlotKind[]} plots - All 81 plots, row by row
	 * @property {import('../../ui.js').CapitalBiome} [biome='mountain'] - The mat's terrain: its ground tiles, and its relief over the printed impassable plots where the biome has one (#82)
	 * @property {number} [terrainSeed=0] - Visual seed supplied by the game's setup; 0 is the library fixture
	 * @property {CapitalGridPiece[]} [pieces=[]] - Landmarks on the grid, drawn over the plots they cover; a locked one may hang over the edge, and only its plots on the grid count
	 * @property {GroupKind | null} [highlight=null] - Cover each completed row, column or district with one flat green rectangle
	 * @property {boolean} [awaitingPlacement=false] - Something is waiting to be placed: a green outline around the grid
	 * @property {boolean} [room=false] - Keep room around the grid for the pieces that hang over its edges (R106), so nothing next to it is covered
	 * @property {CapitalGridTarget[]} [targets=[]] - Plots a decision can choose: each gets a green outline and becomes a button that fires onCapitalGridPlotClick
	 * @property {CapitalGridPreview | null} [preview=null] - The chosen building, drawn faintly on its plot until it is placed
	 * @property {CapitalGridTarget[]} [fresh=[]] - Plots just built on (#29): each glows green once, unless the system asks for reduced motion
	 * @property {string} [label='Capital city, 9 by 9 plots'] - Names the grid for assistive technology
	 * @property {Function} [onCapitalGridPlotClick] - Callback fired with { row, col } when a plot is clicked, for click-to-place from the tray
	 * @property {Function} [onCapitalGridDrop] - Callback fired with { id, row, col } when a piece from the tray is dropped; row and col are where its top-left corner landed, not yet snapped
	 * @property {Function} [onCapitalGridMove] - Callback fired with { id, row, col } when a placed piece is dragged or moved with the arrow keys, already snapped to where it fits
	 * @property {Function} [onCapitalGridRotate] - Callback fired with { id, rotation, row, col }: the next rotation, and where the turned piece fits
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
	 *   highlight={hovered}
	 *   awaitingPlacement
	 *   onCapitalGridMove={(event) => move(event.value)}
	 *   onCapitalGridConfirm={(event) => lock(event.value.id)}
	 * />
	 */
</script>

<script>
	import LandmarkPiece from './LandmarkPiece.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { artUrl } from '../../ui.js';
	import { plotTerrain, reliefUrl } from '../../capital-terrain.js';
	import {
		GRID_SIZE,
		completedGroups,
		fits,
		groupBounds,
		plotIndex,
	} from '../../capital.js';
	import {
		GRAB_TYPE,
		pieceArea,
		pieceShape,
		rotatePiece,
		snapPiece,
		stepPiece,
		withPieces,
	} from '../../placement.js';

	/** @type {CapitalGridProps} */
	let {
		plots,
		biome = 'mountain',
		terrainSeed = 0,
		pieces = [],
		highlight = null,
		awaitingPlacement = false,
		room = false,
		targets = [],
		preview = null,
		fresh = [],
		label = 'Capital city, 9 by 9 plots',
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

	/** Where the dragged piece was grabbed, in plots from its top-left corner. */
	let grab = { x: 0.5, y: 0.5 };
	/** The pieces seen so far, so a newly placed one can take the focus; null before the first render. @type {Set<string> | null} */
	let seen = null;

	/** @type {HTMLDivElement | undefined} */
	let element = $state();
	/** The placed piece being dragged. @type {string | null} */
	let draggingId = $state(null);
	let dragTarget = $state(false);
	let legalDrop = $state(false);

	let locked = $derived(
		withPieces(
			plots,
			pieces.filter((piece) => piece.locked)
		)
	);
	/** How many plots the pieces hang over each edge, at most, when room is kept for them. */
	let reach = $derived(
		pieces.reduce(
			(most, piece) => {
				const area = pieceArea(pieceShape(piece), piece.row, piece.col);
				return {
					top: Math.max(most.top, area.top),
					right: Math.max(most.right, area.right),
					bottom: Math.max(most.bottom, area.bottom),
					left: Math.max(most.left, area.left),
				};
			},
			{ top: 0, right: 0, bottom: 0, left: 0 }
		)
	);
	/** A ninth of the space the grid sits in for each plot of overhang. */
	let margin = $derived(
		room
			? [reach.top, reach.right, reach.bottom, reach.left]
					.map((plots) => `calc(${plots} * 100% / 9)`)
					.join(' ')
			: undefined
	);
	let width = $derived(
		room ? `calc(100% - ${reach.left + reach.right} * 100% / 9)` : undefined
	);
	let overlays = $derived(
		highlight ? completedGroups(locked, highlight).map(groupBounds) : []
	);
	let targeted = $derived(
		new Set(targets.map((target) => plotIndex(target.row, target.col)))
	);
	let previewed = $derived(
		preview ? plotIndex(preview.row, preview.col) : null
	);
	let freshPlots = $derived(
		new Set(fresh.map((plot) => plotIndex(plot.row, plot.col)))
	);
	let terrain = $derived(plotTerrain(plots, biome, terrainSeed));
	let relief = $derived(reliefUrl(biome));

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
		const focused = document.activeElement;
		if (
			!firstRender &&
			added &&
			element &&
			(!focused || focused === document.body)
		) {
			/** @type {HTMLElement | null} */ (
				element.querySelector(
					`[data-piece="${CSS.escape(added.id)}"] [tabindex="0"]`
				)
			)?.focus();
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
		const index = Number(plot.dataset.plot);
		onCapitalGridPlotClick(
			new ComponentEvent(
				{
					row: Math.floor(index / GRID_SIZE),
					col: index % GRID_SIZE,
				},
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
			legalDrop = fits(
				withPieces(
					plots,
					pieces.filter((other) => other.id !== piece.id)
				),
				pieceShape(piece),
				row,
				col
			);
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
		const [x, y] = event.dataTransfer
			.getData(GRAB_TYPE)
			.split(' ')
			.map(Number);
		const { row, col } = topLeft(
			event,
			Number.isFinite(x) && Number.isFinite(y) ? { x, y } : grab
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
			: snapPiece(plots, pieces, piece, row, col);
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
	 * @param {DragEvent} event
	 * @param {CapitalGridPiece} piece
	 */
	const pieceDragstartHandler = (event, piece) => {
		if (piece.locked || !event.dataTransfer) {
			event.preventDefault();
			return;
		}
		const root = /** @type {HTMLElement} */ (event.currentTarget);
		const rect = root.getBoundingClientRect();
		const shape = pieceShape(piece);
		grab = {
			x: ((event.clientX - rect.left) / rect.width) * shape[0].length,
			y: ((event.clientY - rect.top) / rect.height) * shape.length,
		};
		event.dataTransfer.setData('text/plain', piece.id);
		event.dataTransfer.setData(GRAB_TYPE, `${grab.x} ${grab.y}`);
		event.dataTransfer.effectAllowed = 'move';
		const picture = root.querySelector('svg');
		if (picture) {
			event.dataTransfer.setDragImage(
				picture,
				event.clientX - rect.left,
				event.clientY - rect.top
			);
		}
		draggingId = piece.id;
		if (typeof onCapitalGridDragStart === 'function') {
			onCapitalGridDragStart(
				new ComponentEvent({ id: piece.id }, root, event)
			);
		}
	};

	/**
	 * @param {DragEvent} event
	 * @param {CapitalGridPiece} piece
	 */
	const pieceDragendHandler = (event, piece) => {
		dragTarget = false;
		legalDrop = false;
		if (draggingId !== piece.id) {
			return;
		}
		draggingId = null;
		if (typeof onCapitalGridDragEnd === 'function') {
			const target = /** @type {HTMLElement} */ (event.currentTarget);
			onCapitalGridDragEnd(
				new ComponentEvent({ id: piece.id }, target, event)
			);
		}
	};

	/**
	 * @param {ComponentEvent} event - From LandmarkPiece: { id, row, col } with steps of -1, 0 or 1
	 * @param {CapitalGridPiece} piece
	 */
	const pieceMoveHandler = (event, piece) => {
		const position = stepPiece(
			plots,
			pieces,
			piece,
			event.value.row,
			event.value.col
		);
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
		const turned = rotatePiece(plots, pieces, piece);
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
	 * How far a piece reaches past its area on the grid on one side, as a CSS length. As in the relief, a plot is 32
	 * units and a gap 1, so one plot and its gap are a pitch of 33 units, and an area `span` plots long is
	 * 33 × span − 1 units: one pitch is 3300 / (33 × span − 1) percent of it.
	 * @param {number} plots - Plots over the edge on that side
	 * @param {number} span - Plots the area covers along that side's axis
	 * @returns {string | undefined} Undefined when the piece doesn't hang over that edge.
	 */
	function overhang(plots, span) {
		return plots
			? `calc(-${plots} * ${3300 / (33 * span - 1)}%)`
			: undefined;
	}

	/**
	 * A target plot's name, counted from 1 as players read it.
	 * @param {number} index - The plot, row by row
	 * @returns {string}
	 */
	function targetLabel(index) {
		return `Place at row ${Math.floor(index / GRID_SIZE) + 1}, column ${(index % GRID_SIZE) + 1}`;
	}

	/**
	 * The plot under the pointer, in fractions of a plot.
	 * @param {MouseEvent} event
	 * @returns {{ row: number, col: number }}
	 */
	function pointerPlot(event) {
		const first = element?.querySelector('[data-plot="0"]');
		const next = element?.querySelector(`[data-plot="${GRID_SIZE + 1}"]`);
		if (!first || !next) {
			return { row: 0, col: 0 };
		}
		const origin = first.getBoundingClientRect();
		const step = next.getBoundingClientRect();
		return {
			row: (event.clientY - origin.top) / (step.top - origin.top),
			col: (event.clientX - origin.left) / (step.left - origin.left),
		};
	}

	/**
	 * The plot a dragged piece's top-left corner is over.
	 * @param {MouseEvent} event
	 * @param {{ x: number, y: number }} from - Where the piece was grabbed, in plots
	 * @returns {{ row: number, col: number }}
	 */
	function topLeft(event, from) {
		const point = pointerPlot(event);
		/** @param {number} value */
		const clamp = (value) =>
			Math.min(GRID_SIZE - 1, Math.max(0, Math.round(value)));
		return {
			row: clamp(point.row - from.y),
			col: clamp(point.col - from.x),
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
		{#if kind === 'market' || kind === 'house' || kind === 'farm' || kind === 'armory'}
			<img
				class="rg-capital-grid--building"
				src={artUrl(`building/${kind}`)}
				alt=""
				draggable="false" />
		{/if}
		{#if terrain[index].cube}
			<img
				class="rg-capital-grid--building"
				src={artUrl('piece/architects-cube')}
				alt=""
				draggable="false" />
		{/if}
		{#if preview && index === previewed}
			<img
				class="rg-capital-grid--building rg-capital-grid--preview"
				src={artUrl(`building/${preview.building}`)}
				alt=""
				draggable="false" />
		{/if}
	{/snippet}
	<!-- The mat's impassable plots as one picture over the ground; the plots after it draw their buildings above it. -->
	{#if relief}
		<img
			class="rg-capital-grid--relief"
			src={relief}
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
	{#each pieces as piece (piece.id)}
		{@const area = pieceArea(pieceShape(piece), piece.row, piece.col)}
		<!-- A piece over the edge (R106) sits on its plots on the grid and reaches past them. -->
		<div
			class="rg-capital-grid--piece"
			data-piece={piece.id}
			style:grid-row="{area.row + 1} / span {area.rows}"
			style:grid-column="{area.col + 1} / span {area.cols}"
			style:top={overhang(area.top, area.rows)}
			style:right={overhang(area.right, area.cols)}
			style:bottom={overhang(area.bottom, area.rows)}
			style:left={overhang(area.left, area.cols)}>
			<LandmarkPiece
				id={piece.id}
				name={piece.name}
				footprint={piece.footprint}
				rotation={piece.rotation ?? 0}
				state={piece.locked ? 'locked' : 'placed'}
				fresh={piece.fresh}
				dragging={draggingId === piece.id}
				color={piece.color}
				draggable={!piece.locked}
				ondragstart={(/** @type {DragEvent} */ event) =>
					pieceDragstartHandler(event, piece)}
				ondragend={(/** @type {DragEvent} */ event) =>
					pieceDragendHandler(event, piece)}
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
	{#each overlays as bounds (`${bounds.row}-${bounds.col}`)}
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
		grid-template-columns: repeat(9, minmax(0, 1fr));
		grid-template-rows: repeat(9, minmax(0, 1fr));
		/* The relief is 296 pixels across: nine plots of 32 and eight gaps of 1. A gap of 1/296 lines the plots up with it (#82). */
		gap: calc(100% / 296);
		width: 100%;
		min-width: 0;
		aspect-ratio: 1;
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

	@media (prefers-reduced-motion: reduce) {
		.rg-capital-grid--fresh {
			animation: none;
		}
	}

	.rg-capital-grid--market {
		background: var(--surface);
	}

	.rg-capital-grid--house {
		background: var(--surface);
	}

	.rg-capital-grid--farm {
		background: var(--surface);
	}

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

	/* The chosen building, faint until it is placed. */
	.rg-capital-grid--preview {
		position: absolute;
		z-index: 1;
		inset: 0;
		opacity: 0.6;
	}

	.rg-capital-grid--terrain {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
	}

	/* A building on a printed impassable plot cleared it: its ground draws over the relief. */
	.rg-capital-grid--cleared {
		z-index: 1;
	}

	/* Exactly the content box, which the plots span, so its 296 pixels meet theirs. */
	.rg-capital-grid--relief {
		position: absolute;
		z-index: 1;
		top: var(--space-3);
		left: var(--space-3);
		width: calc(100% - 2 * var(--space-3));
		height: calc(100% - 2 * var(--space-3));
		pointer-events: none;
		image-rendering: pixelated;
	}

	.rg-capital-grid--landmark {
		background: var(--exploration);
	}

	.rg-capital-grid--piece {
		position: absolute;
		z-index: 3;
		inset: 0;
	}

	.rg-capital-grid--overlay {
		position: absolute;
		z-index: 4;
		inset: 0;
		background: var(--overlay-ok);
		pointer-events: none;
	}
</style>
