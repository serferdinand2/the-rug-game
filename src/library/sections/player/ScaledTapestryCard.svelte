<!-- Library examples for ScaledTapestryCard, at the scales the game uses. -->
<script>
	import ScaledTapestryCard from '../../../lib/components/player/ScaledTapestryCard.svelte';
	import { tapestryCardData } from '../../../lib/cards/game-cards.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="ScaledTapestryCard"
	area="player"
	description="A whole TapestryCard shown smaller, keeping its measured height so the layout around it does not jump: 0.7 on the choice shelf, 0.6 for the current era and 0.42 in the hand.">
	<Example
		label="scale=0.7 · the choice shelf"
		width={224}>
		<ScaledTapestryCard
			data={tapestryCardData('academia')}
			scale={0.7} />
	</Example>
	<Example
		label="scale=0.6 · the current era"
		width={192}>
		<ScaledTapestryCard
			data={tapestryCardData('guilds')}
			scale={0.6} />
	</Example>
	<Example
		label="scale=0.42 · the hand"
		width={134}>
		<ScaledTapestryCard
			data={tapestryCardData('dark-ages')}
			scale={0.42} />
	</Example>
</Section>
