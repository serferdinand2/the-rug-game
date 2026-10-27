<!-- Library section: ScoreBoard during a game with the current rules, and with the original rules (no landmark tiebreak). -->
<script>
	import ScoreBoard from '../../../lib/components/log/ScoreBoard.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {import('../../../lib/results.js').ScoreRow[]} */
	const ROWS = [
		{
			seat: 2,
			name: 'Bo',
			civ: 'Militants',
			place: 1,
			vp: 41,
			sources: [
				{ id: 'income', label: 'Income turn scoring', vp: 18 },
				{ id: 'tracks', label: 'Advancement rewards', vp: 12 },
				{ id: 'map', label: 'Exploring and conquering', vp: 11 },
			],
			resources: 3,
			landmark: 'Barracks',
		},
		{
			seat: 1,
			name: 'Ana',
			civ: 'Alchemists',
			place: 2,
			vp: 37,
			sources: [
				{ id: 'income', label: 'Income turn scoring', vp: 20 },
				{ id: 'tapestry', label: 'Tapestry effects', vp: 12 },
				{ id: 'civ', label: 'Civilization abilities', vp: 5 },
			],
			resources: 5,
			landmark: null,
		},
		{
			seat: 3,
			name: 'Cy',
			civ: 'Nomads',
			place: 3,
			vp: 0,
			sources: [],
			resources: 4,
			landmark: null,
		},
	];
</script>

<Section
	name="ScoreBoard"
	area="log"
	description="The scores during play: the players by VP, the viewer marked with their colour, each with where the VP came from and the tiebreak values of the table's rules (the tallest landmark only under the current rules, then the resources).">
	<Example label={'rows={current rules} you={1}'}>
		<div style="width: 420px">
			<ScoreBoard
				rows={ROWS}
				you={1} />
		</div>
	</Example>
	<Example label={'rows={original rules: no landmark tiebreak}'}>
		<div style="width: 420px">
			<ScoreBoard
				rows={ROWS.map(({ landmark: _landmark, ...row }) => row)} />
		</div>
	</Example>
</Section>
