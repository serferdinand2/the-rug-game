<!-- Library section: CapitalCity as Your area's Capital tab and the players overview draw it, at rest and while a building waits for a plot. -->
<script>
	import CapitalCity from '../../../lib/components/player/CapitalCity.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { FOOTPRINTS } from '../../../lib/art/footprints.js';
	import { matPlots } from '../../../lib/area/capital.js';
	import { completionCounts } from '../../../lib/placement.js';

	/** @typedef {import('../../../lib/area/capital.js').CapitalView} CapitalView */
	/** @typedef {import('../../../lib/capital.js').PlotKind} PlotKind */

	/** Ana's capital on the Mountain mat, as in the CompletionCounters section: row 0, columns 0, 5 and 7, and two districts are complete. */
	const ANA_FILLED = [
		0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 18, 19, 20, 27, 36, 45, 54, 63, 72, 50,
		59, 68, 77, 25, 43, 52, 61, 79, 39, 40, 49, 73,
	];
	/** @type {PlotKind[]} */
	const KINDS = ['house', 'farm', 'market', 'landmark'];
	/** @type {PlotKind[]} */
	const ANA = matPlots(1).map((kind, index) =>
		ANA_FILLED.includes(index) ? KINDS[(index * 7 + 3) % 4] : kind
	);
	/** Her Lighthouse, locked, hanging over the bottom edge (R106). */
	const LIGHTHOUSE = {
		id: 'lighthouse',
		name: 'Lighthouse',
		footprint: FOOTPRINTS.lighthouse,
		row: 8,
		col: 3,
		rotation: 0,
		locked: true,
	};

	/** @type {CapitalView} */
	const CAPITAL = {
		mat: 1,
		name: 'Mountain',
		biome: 'mountain',
		terrainSeed: 0,
		plots: ANA,
		pieces: [LIGHTHOUSE],
		counts: completionCounts(ANA, [LIGHTHOUSE]),
		besideMat: [],
	};

	/** The open plots of row 2, lit for a gained farm. */
	const OPEN = ANA.flatMap((kind, index) =>
		kind === 'empty' && Math.floor(index / 9) === 2
			? [{ row: 2, col: index % 9 }]
			: []
	);
	let farm = $state(OPEN[0]);
</script>

<Section
	name="CapitalCity"
	area="player"
	description="A player's capital as Your area and the players overview draw it: the title with the mat's name, the 9×9 CapitalGrid with room for overhanging landmarks, and the CompletionCounters, whose hover or press lights the completed groups (the component keeps that state). Its root is display: contents, so the parent lays the three out; a grid that spaces its items sets --rg-capital-city-title-gap to 0.">
	<Example
		label={'owner="Capital City"  (Your area\'s Capital tab; hover or press a counter)'}
		surface="chrome"
		width={436}>
		<div>
			<CapitalCity
				capital={CAPITAL}
				owner="Capital City" />
		</div>
	</Example>
	<Example
		label={'owner="Ana" label="Ana\'s capital city"  (the players overview, in its spaced, centred grid)'}
		surface="chrome"
		width={436}>
		<div
			style:display="grid"
			style:justify-items="center"
			style:gap="var(--space-6)"
			style:--rg-capital-city-title-gap="0">
			<CapitalCity
				capital={CAPITAL}
				owner="Ana"
				label="Ana's capital city" />
		</div>
	</Example>
	<Example
		label={`owner="Capital City" targets={row 2's open plots} preview={{ row: 2, col: ${farm.col}, building: 'farm' }} awaitingPlacement  (click a lit plot)`}
		surface="chrome"
		width={436}>
		<div>
			<CapitalCity
				capital={CAPITAL}
				owner="Capital City"
				targets={OPEN}
				preview={{ ...farm, building: 'farm' }}
				awaitingPlacement
				onCapitalCityPlotClick={(
					/** @type {import('../../../lib/component-event.js').ComponentEvent} */ event
				) => (farm = event.value)} />
		</div>
	</Example>
</Section>
