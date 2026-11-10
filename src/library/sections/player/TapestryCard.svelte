<!-- Library examples for the TapestryCard frame, each drawn from the engine's data (#108). -->
<script>
	import TapestryCard from '../../../lib/components/player/TapestryCard.svelte';
	import { tapestryCardData } from '../../../lib/cards/game-cards.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="TapestryCard"
	area="player"
	description="319 px cards with the timing label beside the portrait; Trap has its own red band. Each is a real card from the engine's data.">
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
		label="data=tapestryCardData('age-of-discovery') · When Played, the science die"
		width={319}>
		<TapestryCard data={tapestryCardData('age-of-discovery')} />
	</Example>
	<Example
		label="data=tapestryCardData('guilds') · longest ability"
		width={319}>
		<TapestryCard data={tapestryCardData('guilds')} />
	</Example>
	<Example
		label="data=tapestryCardData('trap-1') · Trap · Response, with its note"
		width={319}>
		<TapestryCard data={tapestryCardData('trap-1')} />
	</Example>
	<Example
		label="data=tapestryCardData('microbial-magic') · F&F, both charms (#39, awaiting review)"
		width={319}>
		<TapestryCard data={tapestryCardData('microbial-magic')} />
	</Example>
	<Example
		label="data=tapestryCardData('zombie-army') · F&F, a left charm only (#39, awaiting review)"
		width={319}>
		<TapestryCard data={tapestryCardData('zombie-army')} />
	</Example>
	<Example
		label={`data=tapestryCardData('secret-societies')  (data-cards="dark"; #39, awaiting review)`}
		width={319}>
		<div data-cards="dark">
			<TapestryCard data={tapestryCardData('secret-societies')} />
		</div>
	</Example>
	<Example
		label={`data=tapestryCardData('academia')  (data-cards="dark" on the page: the menu's Dark cards)`}
		width={319}>
		<div data-cards="dark">
			<TapestryCard data={tapestryCardData('academia')} />
		</div>
	</Example>
	<Example
		label={`data=tapestryCardData('trap-1')  (data-cards="dark")`}
		width={319}>
		<div data-cards="dark">
			<TapestryCard data={tapestryCardData('trap-1')} />
		</div>
	</Example>
</Section>
