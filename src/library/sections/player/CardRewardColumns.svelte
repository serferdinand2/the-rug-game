<!-- Library section: CardRewardColumns, the Craftsmen's columns beside and the Merrymakers' columns inside (#106). -->
<script>
	import CardRewardColumns from '../../../lib/components/player/CardRewardColumns.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/** @type {{ title: string, note: string, rows: { vp?: number, gain?: import('../../../lib/ui.js').CostSymbol, text?: string, keep?: string, after?: string, building?: string, filled?: boolean }[] }[]} */
	const BESIDE = [
		{
			title: 'Column A',
			note: 'fill from bottom',
			rows: [
				{ vp: 5 },
				{
					text: 'Gain 1 territory tile',
					building: 'farm',
					filled: true,
				},
				{ gain: 'worker', building: 'house', filled: true },
			],
		},
		{
			title: 'Column C',
			note: 'fill from bottom',
			rows: [
				{ vp: 15 },
				{
					text: 'Research',
					keep: 'with benefit;',
					after: 'bonus is available',
				},
				{ gain: 'culture' },
			],
		},
	];
	/** @type {{ id: string, moved?: boolean, cells: { id: string, gains?: import('../../../lib/ui.js').CostSymbol[], also?: string, lines?: string[], current?: boolean }[] }[]} */
	const INSIDE = [
		{
			id: 'm0',
			moved: true,
			cells: [
				{ id: 'm0l3', gains: ['culture'], also: 'armory' },
				{ id: 'm0l2', gains: ['worker', 'food'], current: true },
				{ id: 'm0l1', gains: ['coin'] },
			],
		},
		{
			id: 'm1',
			cells: [
				{ id: 'm1l3', lines: ['Explore +', 'Research'] },
				{ id: 'm1l2', lines: ['Invent +', 'tapestry card'] },
				{ id: 'm1l1', lines: ['Territory tile'] },
			],
		},
	];
	let picked = $state('m1l1');

	/** @param {ComponentEvent} event */
	const pickHandler = (event) => {
		picked = event.value;
	};
</script>

<Section
	name="CardRewardColumns"
	area="player"
	description="Columns of reward squares: filled from the bottom with each benefit beside its 62 px square, a building in the player's colour on a filled one; or climbed by a token from the start square, the rewards inside 75 px squares, the token's square in the player's colour, the squares a decision offers as buttons. See docs/ui/card-design-rules.md."
	><Example
		label="columns, two rows filled"
		width={425}
		><div class="rg-card-frame">
			<CardRewardColumns columns={BESIDE} />
		</div></Example
	><Example
		label={`kind="inside" columns choices={['m1l1']} picked="${picked}"`}
		width={425}
		><div class="rg-card-frame">
			<CardRewardColumns
				kind="inside"
				columns={INSIDE}
				choices={['m1l1']}
				{picked}
				onCardRewardColumnsPick={pickHandler} />
		</div></Example
	></Section>
