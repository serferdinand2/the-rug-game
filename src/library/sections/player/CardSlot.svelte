<!-- Library section: CardSlot, extracted from the reviewed cards; a slot a decision offers is a button (#78). -->
<script>
	import CardSlot from '../../../lib/components/player/CardSlot.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';

	/** The slot picked in the pickable example. */
	let picked = $state('b');

	/** @param {import('../../../lib/component-event.js').ComponentEvent} event */
	const slotPickHandler = (event) => {
		picked = event.value;
	};
</script>

<Section
	name="CardSlot"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardSlot
				size={62}
				label="Empty placement" /><CardSlot
				size={75}
				label="Filled placement"
				filled />
		</div></Example
	><Example label="pickable · pickable picked · value onCardSlotPick"
		><div
			class="rg-card-frame"
			data-state="play"
			style:display="flex"
			style:gap="var(--space-3)">
			{#each ['a', 'b', 'c'] as value (value)}<CardSlot
					size={62}
					pickable
					picked={picked === value}
					{value}
					onCardSlotPick={slotPickHandler}
					>{value.toUpperCase()}</CardSlot
				>{/each}
		</div></Example
	></Section>
