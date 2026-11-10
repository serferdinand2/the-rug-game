<!-- Shared bot report treatment using the exact public pair. -->
<script>
	import BotActionReport from '../../../lib/components/board/BotActionReport.svelte';
	import { AUTOMA_CARDS } from '../../../lib/engine/data/automa-cards.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="BotActionReport"
	area="board"
	description="Green pixel-noise action reports with the actor's player-coloured square, Automa label, and the exact revealed decision pair.">
	<Example
		label="Egypt · player red · exact pair #4 / #3"
		width={640}>
		<BotActionReport
			name="Egypt"
			seat={2}
			cards={[AUTOMA_CARDS[3], AUTOMA_CARDS[2]]}
			>Egypt advances on Exploration.</BotActionReport>
	</Example>
	<Example
		label="Mesopotamia · player green · Shadow Empire · favourite Military"
		width={640}>
		<BotActionReport
			name="Mesopotamia"
			seat={3}
			cards={[AUTOMA_CARDS[0], AUTOMA_CARDS[1]]}
			favouriteTrack="military"
			>Mesopotamia advances on Military.</BotActionReport>
	</Example>
</Section>
