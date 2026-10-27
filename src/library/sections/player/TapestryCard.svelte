<!-- Library examples for the TapestryCard frame. -->
<script>
	import TapestryCard from '../../../lib/components/player/TapestryCard.svelte';
	import { tapestryCardData } from '../../../lib/cards/game-cards.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="TapestryCard"
	area="player"
	description="319 px cards with the timing label beside the portrait; Trap has its own red band. The reviewed fixtures by id, and real cards from the engine's data.">
	<Example
		label="Academia · This Era"
		width={319}>
		<TapestryCard id="academia" />
	</Example>
	<Example
		label="Age of Discovery · When Played"
		width={319}>
		<TapestryCard id="age-of-discovery" />
	</Example>
	<Example
		label="Trap · Response"
		width={319}>
		<TapestryCard id="trap" />
	</Example>
	<Example
		label="data=tapestryCardData('academia') · This Era"
		width={319}>
		<TapestryCard data={tapestryCardData('academia')} />
	</Example>
	<Example
		label="data=tapestryCardData('dark-ages') · When Played"
		width={319}>
		<TapestryCard data={tapestryCardData('dark-ages')} />
	</Example>
	<Example
		label="data=tapestryCardData('guilds') · longest ability"
		width={319}>
		<TapestryCard data={tapestryCardData('guilds')} />
	</Example>
	<Example
		label="data=tapestryCardData('trap-1') · Trap · Response"
		width={319}>
		<TapestryCard data={tapestryCardData('trap-1')} />
	</Example>
</Section>
