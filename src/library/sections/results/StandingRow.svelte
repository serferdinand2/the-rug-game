<!-- Library section: StandingRow for the winner, the viewer and another player, closed and open. -->
<script>
	import StandingRow from '../../../lib/components/results/StandingRow.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {import('../../../lib/results.js').StandingRow[]} */
	const ROWS = [
		{
			seat: 2,
			name: 'Ana',
			civ: 'Militants',
			place: 1,
			vp: 87,
			winner: true,
			sources: [
				{ id: 'income', label: 'Income turn scoring', vp: 35 },
				{ id: 'tracks', label: 'Advancement rewards', vp: 21 },
				{ id: 'tapestry', label: 'Tapestry effects', vp: 16 },
				{ id: 'civ', label: 'Civilization abilities', vp: 10 },
				{ id: 'achievements', label: 'Achievements', vp: 5 },
			],
		},
		{
			seat: 1,
			name: 'You',
			civ: 'Alchemists',
			place: 2,
			vp: 71,
			winner: false,
			sources: [
				{ id: 'income', label: 'Income turn scoring', vp: 38 },
				{ id: 'map', label: 'Exploring and conquering', vp: 36 },
				{ id: 'paid', label: 'VP paid', vp: -3 },
			],
		},
	];

	let open = $state(true);
</script>

<Section
	name="StandingRow"
	area="results"
	description="One player in the final standings, as Lazar's end screen draws it: the place, their token, name and civilization, and their final VP. The winners' rows are gold; the viewer's has a bar in their colour. Pressing the name opens where the VP came from, as awarded during play.">
	<Example
		label={`row={the winner} expanded={${open}}  (press the name)`}
		wide>
		<StandingRow
			row={ROWS[0]}
			bind:expanded={open} />
	</Example>
	<Example
		label={'row={2nd} you'}
		wide>
		<StandingRow
			row={ROWS[1]}
			you />
	</Example>
</Section>
