<!-- Library section: CompletionCounters on their own and inspecting Ana's capital by hover and toggle. -->
<script>
	import CompletionCounters from '../../../lib/components/player/CompletionCounters.svelte';
	import CapitalGrid from '../../../lib/components/player/CapitalGrid.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { completionCounts } from '../../../lib/placement.js';

	/** @typedef {import('../../../lib/capital.js').PlotKind} PlotKind */
	/** @typedef {import('../../../lib/capital.js').GroupKind} GroupKind */
	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/** Ana's capital in the players overview mockup. */
	const ANA_FILLED = [
		0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 18, 19, 20, 27, 28, 29, 36, 45,
		54, 63, 72, 14, 23, 32, 41, 50, 59, 68, 77, 16, 25, 34, 43, 52, 61, 70,
		79, 5, 22, 39, 56, 73,
	];
	const ANA_BLOCKED = [4, 22, 40, 58, 76];
	/** @type {PlotKind[]} */
	const KINDS = ['house', 'farm', 'market', 'landmark'];
	/** @type {PlotKind[]} */
	const ANA = Array.from({ length: 81 }, (_, index) =>
		ANA_BLOCKED.includes(index)
			? 'blocked'
			: ANA_FILLED.includes(index)
				? KINDS[(index * 7 + 3) % 4]
				: 'empty'
	);
	const ANA_COUNTS = completionCounts(ANA, []);

	let hovered = $state(/** @type {GroupKind | null} */ (null));
	let toggled = $state(/** @type {GroupKind | null} */ (null));
</script>

<Section
	name="CompletionCounters"
	area="player"
	description="Three equal counters under a capital: completed rows, columns and districts, with a line, a column and a square as their symbols. Hovering or focusing one shows its groups on the grid; pressing one keeps them shown.">
	<Example
		label={`Interactive with CapitalGrid: active=${toggled ? `"${toggled}"` : '{null}'}, hovered=${hovered ? `"${hovered}"` : '{null}'}  (hover or press a counter)`}
		surface="chrome"
		width={468}>
		<div
			style:display="grid"
			style:gap="var(--space-3)">
			<CapitalGrid
				plots={ANA}
				highlight={hovered ?? toggled}
				label="Ana’s capital city, 9 by 9 plots" />
			<CompletionCounters
				counts={ANA_COUNTS}
				active={toggled}
				onCompletionCountersHover={(
					/** @type {ComponentEvent} */ event
				) => (hovered = event.value)}
				onCompletionCountersToggle={(
					/** @type {ComponentEvent} */ event
				) =>
					(toggled = toggled === event.value ? null : event.value)} />
		</div>
	</Example>
	<Example
		label={'counts={{ rows: 1, columns: 3, districts: 1 }}'}
		width={468}>
		<CompletionCounters counts={{ rows: 1, columns: 3, districts: 1 }} />
	</Example>
	<Example
		label={'active="columns"'}
		width={468}>
		<CompletionCounters
			counts={{ rows: 1, columns: 3, districts: 1 }}
			active="columns" />
	</Example>
	<Example
		label={'counts={{ rows: 0, columns: 0, districts: 0 }}'}
		width={468}>
		<CompletionCounters counts={{ rows: 0, columns: 0, districts: 0 }} />
	</Example>
</Section>
