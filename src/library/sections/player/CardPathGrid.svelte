<!-- Library section: CardPathGrid, reward squares joined by legal links (#106). -->
<script>
	import CardPathGrid from '../../../lib/components/player/CardPathGrid.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	const HEADS = ['1st move', '2nd', '3rd'];
	/** @type {{ id: string, gain?: import('../../../lib/ui.js').CostSymbol, picture?: string, text?: string }[]} */
	const SPACES = [
		{ id: 'c1r1', gain: 'worker' },
		{ id: 'c2r1', picture: '/art/building/farm.svg', text: 'Farm' },
		{ id: 'c3r1', text: 'Conquer' },
		{ id: 'c1r2', gain: 'culture' },
		{ id: 'c2r2', picture: '/art/building/market.svg', text: 'Market' },
		{ id: 'c3r2', text: 'Invent' },
	];
	/** @type {[string, string][]} */
	const LINKS = [
		['c1r1', 'c2r1'],
		['c1r1', 'c2r2'],
		['c1r2', 'c2r2'],
		['c2r1', 'c3r2'],
		['c2r2', 'c3r1'],
	];
	const START = 'Start at the left; move one column each income turn.';
	let picked = $state('c2r2');

	/** @param {ComponentEvent} event */
	const pickHandler = (event) => {
		picked = event.value;
	};
</script>

<Section
	name="CardPathGrid"
	area="player"
	description="75 px reward squares in columns, joined only by the links a token may follow, with the start token beneath; the token's square takes the player's colour and the start token fades. The squares a decision offers are buttons, the picked one gold. See docs/ui/card-design-rules.md."
	><Example
		label="heads spaces links start"
		width={425}
		><div class="rg-card-frame">
			<CardPathGrid
				heads={HEADS}
				spaces={SPACES}
				links={LINKS}
				start={START} />
		</div></Example
	><Example
		label={`current="c1r1" choices={['c2r1', 'c2r2']} picked="${picked}"`}
		width={425}
		><div class="rg-card-frame">
			<CardPathGrid
				heads={HEADS}
				spaces={SPACES}
				links={LINKS}
				start={START}
				current="c1r1"
				choices={['c2r1', 'c2r2']}
				{picked}
				onCardPathGridPick={pickHandler} />
		</div></Example
	></Section>
