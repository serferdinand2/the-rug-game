<!-- Library section: TableLog with a few turns of a game, the oldest folded, and empty, and lines arriving while it is open (#175). -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
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

	/** The arriving example's lines (#175): new ones come in as they are added. */
	let arriving = $state([...ENTRIES]);
</script>

<Section
	name="TableLog"
	area="log"
	description="The table's log: oldest first, the newest kept in view unless the reader scrolls back. A thin rule in the player's colour marks each turn; each entry starts with its player's colour; income turns are gold and notices (a timeout, an undo, the end) are italic. Every turn but the last two folds to its main event and “+n more”, which opens it (#174): here Ana's.">
	<Example label={'entries={a few turns}  (Ana’s turn folded: click it)'}>
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
	<Example
		label={`entries={${arriving.length} lines}  (add a line: it comes in; open the folded turn: its lines unfold one after another; #175)`}
		width={430}>
		<div class="rg-library-table-log--frame">
			<TableLog entries={arriving} />
		</div>
		<Button
			size="small"
			onButtonClick={() =>
				(arriving = [
					...arriving,
					{
						seq: (arriving.at(-1)?.seq ?? 0) + 1,
						player: 3,
						kind: 'line',
						text: 'Cy gained 2 coins.',
					},
				])}>Add a line</Button>
	</Example>
</Section>

<style>
	.rg-library-table-log--frame {
		height: 260px;
		margin-bottom: var(--space-6);
	}
</style>
