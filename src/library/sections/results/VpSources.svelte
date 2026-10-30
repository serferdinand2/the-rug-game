<!-- Library section: VpSources in one compact column (the scoreboard), in two (the final standings), and with no VP. -->
<script>
	import VpSources from '../../../lib/components/results/VpSources.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {import('../../../lib/results.js').SourceLine[]} */
	const SOURCES = [
		{ id: 'income', label: 'Income turn scoring', vp: 35 },
		{ id: 'tracks', label: 'Advancement rewards', vp: 21 },
		{ id: 'tapestry', label: 'Tapestry effects', vp: 16 },
		{ id: 'civ', label: 'Civilization abilities', vp: 10 },
		{ id: 'paid', label: 'VP paid', vp: -3 },
	];
</script>

<Section
	name="VpSources"
	area="results"
	description="Where a player's VP came from, one line per source with its VP, as awarded during play. The scoreboard lists them in one compact column, the final standings in two; without sources it shows its empty words, or nothing.">
	<Example label={'sources={5 sources}'}>
		<div style="width: 380px; font-size: var(--font-size-xs)">
			<VpSources sources={SOURCES} />
		</div>
	</Example>
	<Example
		label={'sources={5 sources} columns={2}'}
		wide>
		<VpSources
			sources={SOURCES}
			columns={2} />
	</Example>
	<Example label={'sources={[]} empty="No VP this game."'}>
		<VpSources
			sources={[]}
			empty="No VP this game." />
	</Example>
</Section>
