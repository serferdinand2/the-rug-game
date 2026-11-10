<!-- Every canonical decision face and both roles used by action reports. -->
<script>
	import AutomaDecisionCard from '../../../lib/components/player/AutomaDecisionCard.svelte';
	import { AUTOMA_CARDS } from '../../../lib/engine/data/automa-cards.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="AutomaDecisionCard"
	area="player"
	description="All 22 decision cards generated from canonical data, with the shared card paper and gold title, green band and footer, and a star on the actor's favourite track.">
	<Example
		label="id=4 · track / income role · favourite Science"
		width={290}>
		<AutomaDecisionCard
			id={4}
			role="track"
			favouriteTrack="science" />
	</Example>
	<Example
		label="id=3 · hex / topple role"
		width={290}>
		<AutomaDecisionCard
			id={3}
			role="hex" />
	</Example>
	{#each AUTOMA_CARDS as card (card.id)}
		<Example
			label={`Automa #${card.id} · complete face`}
			width={290}>
			<AutomaDecisionCard {card} />
		</Example>
	{/each}
</Section>
