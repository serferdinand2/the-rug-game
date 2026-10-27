<!-- Library section: CapitalGrid with the mockups' capitals, lit target plots with a previewed farm, completed groups, placed, locked and overhanging landmarks with room kept for them, and the interactive Lighthouse placement. -->
<script>
	import CapitalGrid from '../../../lib/components/player/CapitalGrid.svelte';
	import CompletionCounters from '../../../lib/components/player/CompletionCounters.svelte';
	import PlacementTray from '../../../lib/components/player/PlacementTray.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { FOOTPRINTS } from '../../../lib/art/footprints.js';
	import { completionCounts, snapPiece } from '../../../lib/placement.js';

	/** @typedef {import('../../../lib/capital.js').PlotKind} PlotKind */
	/** @typedef {import('../../../lib/capital.js').GroupKind} GroupKind */
	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/**
	 * A capital from impassable plots and buildings.
	 * @param {number[]} blocked
	 * @param {Record<number, PlotKind>} buildings
	 * @returns {PlotKind[]}
	 */
	const capital = (blocked, buildings) =>
		Array.from({ length: 81 }, (_, index) =>
			blocked.includes(index) ? 'blocked' : (buildings[index] ?? 'empty')
		);

	/** Your capital in the main-screen mockup (a review fixture, not the researched Mountain mat). */
	const BLOCKED = [
		0, 1, 2, 8, 9, 17, 27, 35, 36, 44, 45, 53, 71, 72, 73, 79, 80,
	];
	/** @type {Record<number, PlotKind>} */
	const BUILDINGS = {
		12: 'market',
		18: 'house',
		29: 'armory',
		32: 'landmark',
		33: 'landmark',
		38: 'farm',
		48: 'market',
		58: 'house',
		67: 'farm',
	};
	const YOURS = capital(BLOCKED, BUILDINGS);
	/** Every open plot of your capital, as a gained building's targets. */
	const OPEN = YOURS.flatMap((kind, index) =>
		kind === 'empty' ? [{ row: Math.floor(index / 9), col: index % 9 }] : []
	);
	/** Your capital with rows 0 and 1 and the top middle district built up, so locking the Lighthouse at row 0, column 4 completes them. */
	const NEARLY = capital(BLOCKED, {
		...BUILDINGS,
		3: 'house',
		6: 'farm',
		7: 'market',
		10: 'farm',
		11: 'house',
		15: 'armory',
		16: 'market',
		21: 'farm',
		22: 'house',
		23: 'market',
	});

	/** Ana's capital in the players overview mockup. */
	const ANA_FILLED = [
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 18, 19, 20, 27, 28, 29, 36, 45,
		54, 63, 72, 14, 23, 32, 41, 50, 59, 68, 77, 16, 25, 34, 43, 52, 61, 70,
		79, 5, 22, 39, 56, 73,
	];
	/** @type {PlotKind[]} */
	const KINDS = ['house', 'farm', 'market', 'landmark'];
	const ANA = capital(
		[4, 22, 40, 58, 76],
		Object.fromEntries(
			ANA_FILLED.map((index) => [index, KINDS[(index * 7 + 3) % 4]])
		)
	);

	const LIGHTHOUSE = {
		id: 'lighthouse',
		name: 'Lighthouse',
		footprint: FOOTPRINTS.lighthouse,
		color: 'var(--exploration)',
	};
	const RUBBER_WORKS = {
		id: 'rubber-works',
		name: 'Rubber Works',
		footprint: FOOTPRINTS['rubber-works'],
	};

	/** @type {GroupKind[]} */
	const GROUPS = ['rows', 'columns', 'districts'];

	/* The interactive example's state, as the play screen would keep it. */
	let position = $state(
		/** @type {{ row: number, col: number } | null} */ (null)
	);
	let rotation = $state(0);
	let locked = $state(false);
	let fresh = $state(false);
	let selected = $state(true);
	let dragging = $state(false);
	let hovered = $state(/** @type {GroupKind | null} */ (null));
	/* The targets example: where the farm is previewed. */
	let farm = $state({ row: 4, col: 5 });
	let toggled = $state(/** @type {GroupKind | null} */ (null));

	let pieces = $derived(
		position
			? [{ ...LIGHTHOUSE, ...position, rotation, locked, fresh }]
			: []
	);
	let items = $derived(position ? [] : [{ ...LIGHTHOUSE, rotation }]);
	let counts = $derived(completionCounts(NEARLY, pieces));

	/**
	 * Puts the Lighthouse on the nearest plots where it fits.
	 * @param {number} row
	 * @param {number} col
	 */
	const place = (row, col) => {
		const spot = snapPiece(
			NEARLY,
			[],
			{ ...LIGHTHOUSE, rotation },
			row,
			col
		);
		if (spot) {
			position = spot;
		}
	};

	const putBack = () => {
		position = null;
		dragging = false;
		selected = true;
	};

	const startAgain = () => {
		putBack();
		rotation = 0;
		locked = false;
		fresh = false;
		toggled = null;
	};
</script>

<Section
	name="CapitalGrid"
	area="player"
	description="A 9×9 capital assembled from the approved terrain tiles, with the four income-building SVGs, small red Xs on impassable plots and district lines. The supplied visual seed chooses repeatable variants for this game; the plot mask stays unchanged. The six full mat images in Art are reference examples only. Landmarks and placement controls work over the composed tiles. A locked landmark may hang over the edge (R106): it is drawn past the grid, and only its plots on the grid count.">
	<Example
		label={'biome="wetland" terrainSeed={42} · same plot layout, composed from tile SVGs'}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			biome="wetland"
			terrainSeed={42} />
	</Example>
	<Example
		label={`Interactive: PlacementTray + CapitalGrid + CompletionCounters
pieces=${position ? `[Lighthouse at row ${position.row}, col ${position.col}, rotation ${rotation}${locked ? ', locked' : ''}]` : '[]'} awaitingPlacement={${!locked}} highlight=${(hovered ?? toggled) ? `"${hovered ?? toggled}"` : '{null}'}
Click the Lighthouse, then a plot, or drag it in; drag it again to move it or back to the tray.
Keyboard: an arrow key on the Lighthouse puts it on the grid and moves it, R rotates, Enter confirms, Delete returns it.`}
		width={468}>
		<div
			style:display="grid"
			style:gap="var(--space-3)">
			<CapitalGrid
				plots={NEARLY}
				{pieces}
				highlight={hovered ?? toggled}
				awaitingPlacement={!locked}
				label="Your capital city, 9 by 9 plots"
				onCapitalGridPlotClick={(
					/** @type {ComponentEvent} */ event
				) => {
					if (!position && selected) {
						place(event.value.row, event.value.col);
					}
				}}
				onCapitalGridDrop={(/** @type {ComponentEvent} */ event) => {
					if (!position) {
						place(event.value.row, event.value.col);
					}
				}}
				onCapitalGridMove={(/** @type {ComponentEvent} */ event) =>
					(position = { row: event.value.row, col: event.value.col })}
				onCapitalGridRotate={(/** @type {ComponentEvent} */ event) => {
					rotation = event.value.rotation;
					position = { row: event.value.row, col: event.value.col };
				}}
				onCapitalGridConfirm={() => {
					locked = true;
					fresh = true;
				}}
				onCapitalGridReturn={putBack}
				onCapitalGridDragStart={() => (dragging = true)}
				onCapitalGridDragEnd={() => (dragging = false)} />
			<CompletionCounters
				{counts}
				active={toggled}
				onCompletionCountersHover={(
					/** @type {ComponentEvent} */ event
				) => {
					hovered = event.value;
					if (event.value) {
						fresh = false;
					}
				}}
				onCompletionCountersToggle={(
					/** @type {ComponentEvent} */ event
				) =>
					(toggled = toggled === event.value ? null : event.value)} />
			<PlacementTray
				style="margin-top: var(--space-3)"
				{items}
				selectedId={selected ? 'lighthouse' : null}
				returnTarget={dragging}
				onPlacementTraySelect={() => (selected = !selected)}
				onPlacementTrayPlace={() => place(4, 4)}
				onPlacementTrayReturn={putBack} />
			{#if locked}
				<Button
					size="small"
					onButtonClick={startAgain}>Start again</Button>
			{/if}
		</div>
	</Example>
	<Example
		label={`targets={openPlots} preview={{ row: ${farm.row}, col: ${farm.col}, building: 'farm' }} awaitingPlacement
Click a lit plot, or press Enter or Space on it, to preview the farm there.`}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			targets={OPEN}
			preview={{ ...farm, building: 'farm' }}
			awaitingPlacement
			label="Your capital city, 9 by 9 plots"
			onCapitalGridPlotClick={(/** @type {ComponentEvent} */ event) => {
				if (
					OPEN.some(
						(plot) =>
							plot.row === event.value.row &&
							plot.col === event.value.col
					)
				) {
					farm = { row: event.value.row, col: event.value.col };
				}
			}} />
	</Example>
	<Example
		label={'plots={yourCapital} awaitingPlacement'}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			awaitingPlacement />
	</Example>
	<Example
		label={'plots={yourCapital}'}
		width={468}>
		<CapitalGrid plots={YOURS} />
	</Example>
	{#each GROUPS as group (group)}
		<Example
			label={`plots={anasCapital} highlight="${group}"`}
			width={468}>
			<CapitalGrid
				plots={ANA}
				highlight={group}
				label="Ana’s capital city, 9 by 9 plots" />
		</Example>
	{/each}
	<Example
		label={'pieces={[Lighthouse, placed]} awaitingPlacement  (controls: rotate, confirm, return)'}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			pieces={[{ ...LIGHTHOUSE, row: 4, col: 4 }]}
			awaitingPlacement />
	</Example>
	<Example
		label={'pieces={[Lighthouse, locked, fresh]}'}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			pieces={[
				{ ...LIGHTHOUSE, row: 6, col: 1, locked: true, fresh: true },
			]} />
	</Example>
	<Example
		label={'pieces={[Lighthouse, locked, row 6, col -1]}  (over the left edge, R106: drawn past the grid, not clipped or moved)'}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			pieces={[{ ...LIGHTHOUSE, row: 6, col: -1, locked: true }]} />
	</Example>
	<Example
		label={'pieces={[Lighthouse, locked, row 8, col 4]} highlight="rows"  (only its plots on the grid count: it completes row 8)'}
		width={468}>
		<!-- room keeps space below the grid for the plot that hangs over its edge. -->
		<CapitalGrid
			plots={capital(BLOCKED, {
				...BUILDINGS,
				74: 'farm',
				75: 'house',
				78: 'market',
			})}
			pieces={[{ ...LIGHTHOUSE, row: 8, col: 4, locked: true }]}
			highlight="rows"
			room />
	</Example>
	<Example
		label={'pieces={[Lighthouse, locked, row 6, col -1]} room  (space kept on the left, so nothing beside it is covered)'}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			pieces={[{ ...LIGHTHOUSE, row: 6, col: -1, locked: true }]}
			room />
	</Example>
	<Example
		label={'pieces={[Rubber Works, rotation 3, placed]} awaitingPlacement'}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			pieces={[{ ...RUBBER_WORKS, row: 4, col: 4, rotation: 3 }]}
			awaitingPlacement />
	</Example>
	<Example
		label={'pieces={[Rubber Works, locked]} highlight="rows"  (locked pieces count towards completed groups)'}
		width={468}>
		<CapitalGrid
			plots={capital(BLOCKED, {
				28: 'house',
				29: 'armory',
				34: 'farm',
				37: 'farm',
				38: 'market',
				43: 'house',
			})}
			pieces={[{ ...RUBBER_WORKS, row: 1, col: 3, locked: true }]}
			highlight="rows" />
	</Example>
</Section>
