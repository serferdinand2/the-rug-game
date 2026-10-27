<!-- Library section: TableLog with a few turns of a game, and empty. -->
<script>
	import TableLog from '../../../lib/components/log/TableLog.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {import('../../../lib/components/log/TableLog.svelte').TableLogEntry[]} */
	const ENTRIES = [
		{
			seq: 1,
			player: null,
			kind: 'line',
			text: 'A new game began under the Current official rules, with the variant Tapestry draft.',
		},
		{ seq: 11, player: 1, kind: 'turn', text: 'Ana’s turn' },
		{
			seq: 12,
			player: 1,
			kind: 'income',
			text: 'Ana began income turn 1.',
		},
		{
			seq: 14,
			player: 1,
			kind: 'line',
			text: 'Ana gained 1 coin, 1 worker, 1 food and 1 culture.',
		},
		{ seq: 21, player: 2, kind: 'turn', text: 'Bo’s turn' },
		{
			seq: 23,
			player: 2,
			kind: 'line',
			text: 'Bo advanced to Scouting on Exploration.',
		},
		{
			seq: 24,
			player: 2,
			kind: 'line',
			text: 'Bo gained 2 territory tiles.',
		},
		{ seq: 31, player: 3, kind: 'turn', text: 'Cy’s turn' },
		{
			seq: 33,
			player: 3,
			kind: 'line',
			text: 'Cy conquered hex 2,3.',
		},
		{
			seq: 40,
			player: 3,
			kind: 'notice',
			text: 'Cy’s clock ran out; the rest of the turn was played for them.',
		},
	];
</script>

<Section
	name="TableLog"
	area="log"
	description="The table's log: oldest first, the newest kept in view unless the reader scrolls back. A thin rule in the player's colour marks each turn; each entry starts with its player's colour; income turns are gold and notices (a timeout, an undo, the end) are italic.">
	<Example label={'entries={a few turns}'}>
		<div
			style="width: 420px; height: 320px; display: flex; flex-direction: column">
			<TableLog entries={ENTRIES} />
		</div>
	</Example>
	<Example label={'entries={[]}'}>
		<div style="width: 420px">
			<TableLog entries={[]} />
		</div>
	</Example>
</Section>
