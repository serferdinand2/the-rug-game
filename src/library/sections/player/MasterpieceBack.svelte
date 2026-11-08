<!-- Library section: MasterpieceBack, the masterpiece deck's back with its count (#35 part 4). -->
<script>
	import MasterpieceBack from '../../../lib/components/player/MasterpieceBack.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="MasterpieceBack"
	area="player"
	description="The masterpiece deck's back, a masterpiece card's 319 × 259 px, drawn from static/art/card-back/masterpiece.svg with the cards left over its foot. The shelf shows it beside the 3 face-up masterpieces when a player creates: the deck's top card is taken unseen.">
	<Example
		label="count={14}"
		width={319}>
		<MasterpieceBack count={14} />
	</Example>
</Section>
