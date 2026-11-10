<!-- Library section: CapitalGrid on the real Mountain and Forest mats, with their reliefs, lit target plots with a previewed farm, an Architects' cube and a terraformed plot, completed groups, placed, locked and overhanging landmarks with room kept for them, and the interactive Lighthouse placement, houses built one after another (#175), and four Arts & Architecture mats: the Archipelago's 11 rows, Cloud City's clouds, the Swamp's lily pads and the Canyon's cacti (#36), and Fantasies & Futures' six (#40). -->
<script>
	import CapitalGrid from '../../../lib/components/player/CapitalGrid.svelte';
	import CompletionCounters from '../../../lib/components/player/CompletionCounters.svelte';
	import PlacementTray from '../../../lib/components/player/PlacementTray.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { FOOTPRINTS } from '../../../lib/art/footprints.js';
	import { matPlots } from '../../../lib/area/capital.js';
	import { completionCounts, snapPiece } from '../../../lib/placement.js';
	import { capitalMat, matShape } from '../../../lib/engine/data/capitals.js';

	/** @typedef {import('../../../lib/capital.js').PlotKind} PlotKind */
	/** @typedef {import('../../../lib/capital.js').GroupKind} GroupKind */
	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/**
	 * A capital mat with buildings on it.
	 * @param {number} mat - The mat's number: 1 is Mountain, 6 is Forest
	 * @param {Record<number, PlotKind>} buildings
	 * @returns {PlotKind[]}
	 */
	const capital = (mat, buildings) =>
		matPlots(mat).map((kind, index) => buildings[index] ?? kind);

	/** The Archipelago with island A (its top-left six plots) built up, so its district lights (#36). */
	const ARCHIPELAGO = capital(7, {
		0: 'farm',
		1: 'house',
		9: 'market',
		10: 'farm',
		18: 'armory',
		19: 'house',
	});
	/** Cloud City with cloud 3 (top right) built up, so its district lights, and two houses elsewhere (#36). */
	const CLOUD_CITY = capital(10, {
		7: 'farm',
		8: 'market',
		15: 'house',
		16: 'house',
		24: 'armory',
		25: 'farm',
		40: 'house',
		57: 'house',
	});
	/** The Swamp with a market on the lily pad at row 2, column 5 (#36). */
	const SWAMP = capital(12, { 13: 'market' });
	/** The Canyon with the cactus at (1, 1) surrounded, so it shows as impassable (#36). */
	const CANYON = capital(8, {
		0: 'farm',
		1: 'house',
		9: 'market',
		10: 'blocked',
		18: 'farm',
		19: 'armory',
		20: 'house',
	});

	/**
	 * Every open plot of a capital, as a gained building's targets.
	 * @param {PlotKind[]} plots
	 */
	const openPlots = (plots) =>
		plots.flatMap((kind, index) =>
			kind === 'empty'
				? [{ row: Math.floor(index / 9), col: index % 9 }]
				: []
		);

	/**
	 * Your capital's buildings, on the Mountain mat's open plots.
	 * @type {Record<number, PlotKind>}
	 */
	const BUILDINGS = {
		11: 'market',
		18: 'house',
		24: 'landmark',
		25: 'landmark',
		29: 'armory',
		38: 'farm',
		45: 'market',
		57: 'house',
		64: 'farm',
	};
	const YOURS = capital(1, BUILDINGS);
	const OPEN = openPlots(YOURS);
	/** Your capital with rows 0 and 1 and the top middle district built up, so locking the Lighthouse at row 0, column 3 completes them. */
	const NEARLY = capital(1, {
		...BUILDINGS,
		0: 'farm',
		1: 'house',
		2: 'armory',
		5: 'market',
		6: 'farm',
		7: 'house',
		8: 'market',
		17: 'armory',
	});

	/** Ana's capital on the Mountain mat: row 0, columns 0, 5 and 7, and the top left and centre districts are complete. */
	const ANA_FILLED = [
		0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 18, 19, 20, 27, 36, 45, 54, 63, 72, 50,
		59, 68, 77, 25, 43, 52, 61, 79, 39, 40, 49, 73,
	];
	/** @type {PlotKind[]} */
	const KINDS = ['house', 'farm', 'market', 'landmark'];
	const ANA = capital(
		1,
		Object.fromEntries(
			ANA_FILLED.map((index) => [index, KINDS[(index * 7 + 3) % 4]])
		)
	);

	/** The Forest mat with a farm on plot 26 (row 2, column 8), beside the corner join at row 2, column 7. */
	const FOREST = capital(6, { 26: 'farm' });
	const FOREST_MAT = matPlots(6);
	/** F&F's mats by number and biome (#40). @type {[number, import('../../../lib/ui.js').CapitalBiome][]} */
	const FF_MATS = [
		[13, 'quagmire'],
		[14, 'city-in-a-bottle'],
		[15, 'veil'],
		[16, 'savanna'],
		[17, 'polar'],
		[18, 'netherworld'],
	];
	const FOREST_OPEN = openPlots(FOREST_MAT);

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
	/** The Rubber Works locked at row 5, column 3 (#171): its box is four plots wide, and its top-left 2×2 is open ground. */
	const CORNER = capital(1, {
		[5 * 9 + 5]: 'landmark',
		[5 * 9 + 6]: 'landmark',
		[6 * 9 + 5]: 'landmark',
		[6 * 9 + 6]: 'landmark',
		[7 * 9 + 3]: 'landmark',
		[7 * 9 + 4]: 'landmark',
		[7 * 9 + 5]: 'landmark',
		[7 * 9 + 6]: 'landmark',
		[8 * 9 + 3]: 'landmark',
		[8 * 9 + 4]: 'landmark',
		[8 * 9 + 5]: 'landmark',
		[8 * 9 + 6]: 'landmark',
	});
	const CORNER_OPEN = [
		{ row: 5, col: 3 },
		{ row: 5, col: 4 },
		{ row: 6, col: 3 },
		{ row: 6, col: 4 },
	].filter(({ row, col }) => CORNER[row * 9 + col] === 'empty');

	/** @type {GroupKind[]} */
	const GROUPS = ['rows', 'columns', 'districts'];

	/**
	 * Three of the engine's places for the Lighthouse on your capital, each in every turn (#112): row 6, column 5;
	 * row 6, column 8, over the right edge, since columns 6 and 7 would cover the impassable plot at row 7, column 7;
	 * and row 8, column 5, over the bottom edge (R14).
	 */
	const EDGE_POSITIONS = [
		[6, 5],
		[6, 8],
		[8, 5],
	].flatMap(([row, col]) =>
		[0, 1, 2, 3].map((rotation) => ({ row, col, rotation }))
	);

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
	/* The targets examples: where each farm is previewed. */
	let farm = $state({ row: 4, col: 4 });
	let forestFarm = $state({ row: 4, col: 4 });
	/* The corner example: where its farm is previewed, in the Rubber Works' empty corner (#171). */
	let corner = $state({ row: 5, col: 3 });
	let toggled = $state(/** @type {GroupKind | null} */ (null));
	/* The positions example: where its Lighthouse stands. */
	let edge = $state({ row: 6, col: 5, rotation: 0 });

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

	/** The building example's houses, in the order built (#175): the last one just built drops onto its plot. */
	let houses = $state(/** @type {number[]} */ ([]));
	const BUILDABLE = openPlots(capital(1, {}));
	let built = $derived(
		capital(1, Object.fromEntries(houses.map((plot) => [plot, 'house'])))
	);
	let justBuilt = $derived(
		houses.length
			? [
					{
						row: Math.floor(
							/** @type {number} */ (houses.at(-1)) / 9
						),
						col: /** @type {number} */ (houses.at(-1)) % 9,
					},
				]
			: []
	);
</script>

<Section
	name="CapitalGrid"
	area="player"
	description="A 9×9 capital: each plot's ground tile from the supplied biome and visual seed, the mat's relief drawn over its impassable plots (every base mat has one; the expansion mats' come with #132 and #133), the four income-building SVGs, the Architects' cubes and the district lines. A building on a printed impassable plot clears the relief there. The six full mat images in Art are reference examples only. Landmarks and placement controls work over the relief. A locked landmark may hang over the edge (R106): it is drawn past the grid, and only its plots on the grid count.">
	<Example
		label={"plots={mountainMat + cube on plot 0, farm on plot 9}  (an Architects' cube on an open plot; the farm on printed impassable plot 9 clears the relief there)"}
		width={468}>
		<CapitalGrid plots={capital(1, { 0: 'blocked', 9: 'farm' })} />
	</Example>
	<Example
		label={'biome="forest" plots={forestMat + farm on plot 26}  (beside the corner join at row 2, column 7: the farm draws over the relief)'}
		width={468}>
		<CapitalGrid
			plots={FOREST}
			biome="forest" />
	</Example>
	<Example
		label={`biome="forest" targets={forestOpen} preview={{ row: ${forestFarm.row}, col: ${forestFarm.col}, building: 'farm' }}
Plot 26, beside the corner join at row 2, column 7, still takes the click.`}
		width={468}>
		<CapitalGrid
			plots={FOREST_MAT}
			biome="forest"
			targets={FOREST_OPEN}
			preview={{ ...forestFarm, building: 'farm' }}
			label="Your capital city, 9 by 9 plots"
			onCapitalGridPlotClick={(/** @type {ComponentEvent} */ event) => {
				if (
					FOREST_OPEN.some(
						(plot) =>
							plot.row === event.value.row &&
							plot.col === event.value.col
					)
				) {
					forestFarm = { row: event.value.row, col: event.value.col };
				}
			}} />
	</Example>
	<Example
		label={`Interactive: PlacementTray + CapitalGrid + CompletionCounters
pieces=${position ? `[Lighthouse at row ${position.row}, col ${position.col}, rotation ${rotation}${locked ? ', locked' : ''}]` : '[]'} awaitingPlacement={${!locked}} highlight=${(hovered ?? toggled) ? `"${hovered ?? toggled}"` : '{null}'}
Click the Lighthouse, then a plot, or drag it in; drag it again to move it or back to the tray.
Keyboard: an arrow key on the Lighthouse puts it on the grid and moves it, full stop or comma rotates it, Enter confirms, Delete returns it.`}
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
			pieces={[{ ...LIGHTHOUSE, row: 6, col: 5 }]}
			awaitingPlacement />
	</Example>
	<Example
		label={`pieces={[Lighthouse, placed, row ${edge.row}, col ${edge.col}, rotation ${edge.rotation}]} positions={[row 6 col 5, row 6 col 8, row 8 col 5] in every turn} awaitingPlacement
The engine's places decide where it goes (#112): the right arrow from row 6, column 5 hangs it over the edge (R14).`}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			pieces={[{ ...LIGHTHOUSE, ...edge }]}
			positions={EDGE_POSITIONS}
			awaitingPlacement
			room
			onCapitalGridMove={(/** @type {ComponentEvent} */ event) =>
				(edge = {
					...edge,
					row: event.value.row,
					col: event.value.col,
				})}
			onCapitalGridRotate={(/** @type {ComponentEvent} */ event) =>
				(edge = {
					row: event.value.row,
					col: event.value.col,
					rotation: event.value.rotation,
				})} />
	</Example>
	<Example
		label={'pieces={[Lighthouse, locked, fresh]}'}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			pieces={[
				{ ...LIGHTHOUSE, row: 3, col: 0, locked: true, fresh: true },
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
			plots={capital(1, {
				...BUILDINGS,
				72: 'farm',
				73: 'house',
				75: 'market',
				78: 'armory',
				79: 'house',
				80: 'farm',
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
		label={'pieces={[Rubber Works, rotation 2, placed]} awaitingPlacement'}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			pieces={[{ ...RUBBER_WORKS, row: 5, col: 4, rotation: 2 }]}
			awaitingPlacement />
	</Example>
	<Example
		label={'pieces={[Rubber Works, locked]} highlight="rows"  (locked pieces count towards completed groups)'}
		width={468}>
		<CapitalGrid
			plots={capital(1, {
				63: 'house',
				64: 'armory',
				65: 'farm',
				71: 'farm',
				72: 'market',
				73: 'house',
				79: 'house',
				80: 'armory',
			})}
			pieces={[{ ...RUBBER_WORKS, row: 5, col: 3, locked: true }]}
			highlight="rows" />
	</Example>
	<Example
		label={'targets={OPEN} preview={{ row: 4, col: 4, cube: true }}  (an Architects cube chosen on a lit plot, #168)'}
		width={468}>
		<CapitalGrid
			plots={YOURS}
			targets={OPEN}
			preview={{ row: 4, col: 4, cube: true }} />
	</Example>
	<Example
		label={`pieces={[Rubber Works, locked]} targets={its empty corner} preview={{ row: ${corner.row}, col: ${corner.col}, building: 'farm' }}  (#171: the plots in the landmark's box but outside its footprint take the click)`}
		width={468}>
		<CapitalGrid
			plots={CORNER}
			pieces={[{ ...RUBBER_WORKS, row: 5, col: 3, locked: true }]}
			targets={CORNER_OPEN}
			preview={{ ...corner, building: 'farm' }}
			onCapitalGridPlotClick={(/** @type {ComponentEvent} */ event) => {
				if (
					CORNER_OPEN.some(
						({ row, col }) =>
							row === event.value.row && col === event.value.col
					)
				) {
					corner = { row: event.value.row, col: event.value.col };
				}
			}} />
	</Example>
	<Example
		label={`plots={mountainMat + ${houses.length} houses} fresh={the last}  (build one: the house drops onto its plot as the plot glows; #175)`}
		width={468}>
		<CapitalGrid
			plots={built}
			fresh={justBuilt} />
		<Button
			size="small"
			onButtonClick={() => {
				const next = BUILDABLE.find(
					(plot) => !houses.includes(plot.row * 9 + plot.col)
				);
				houses = next ? [...houses, next.row * 9 + next.col] : [];
			}}>Build a house</Button>
	</Example>
	<Example
		label={'shape={archipelago} biome="archipelago"  (11 rows; its islands are districts; a landmark hangs off the bottom; #36)'}
		width={468}>
		<CapitalGrid
			plots={ARCHIPELAGO}
			shape={matShape(capitalMat(7))}
			biome="archipelago"
			room
			pieces={[
				{
					id: 'forge',
					name: 'Forge',
					footprint: FOOTPRINTS.forge,
					row: 10,
					col: 3,
					locked: true,
				},
			]}
			highlight="districts" />
	</Example>
	<Example
		label={'shape={cloudCity} biome="cloud-city"  (each cloud a district, drawn along its sides; a complete cloud lit; #36)'}
		width={468}>
		<CapitalGrid
			plots={CLOUD_CITY}
			shape={matShape(capitalMat(10))}
			biome="cloud-city"
			highlight="districts" />
	</Example>
	<Example
		label="biome=&quot;swamp&quot;  (lily pads, one under a market; #36)"
		width={468}>
		<CapitalGrid
			plots={SWAMP}
			biome="swamp" />
	</Example>
	<Example
		label="biome=&quot;canyon&quot;  (cacti, one surrounded and impassable; #36)"
		width={468}>
		<CapitalGrid
			plots={CANYON}
			biome="canyon" />
	</Example>
	<!-- F&F's six mats (#40, awaiting review): ground, Quagmire's features, relief and overlay, as #133 approved them. -->
	{#each FF_MATS as [number, biome] (biome)}
		<Example
			label={`shape={matShape(capitalMat(${number}))} biome="${biome}"  (#40, awaiting review)`}
			width={468}>
			<CapitalGrid
				plots={matPlots(number)}
				shape={matShape(capitalMat(number))}
				{biome}
				highlight="districts" />
		</Example>
	{/each}
	<Example
		label={'plots={…, token at row 4, column 4} tokens={[{ row: 4, col: 4, seat: 2 }]}  (a Dream Monitors or Weefolk token, #40, awaiting review)'}
		width={468}>
		<CapitalGrid
			plots={capital(1, { 40: 'token', 39: 'house', 49: 'farm' })}
			tokens={[{ row: 4, col: 4, seat: 2 }]} />
	</Example>
</Section>
