<!-- Library examples for the TechnologyCard frame, each drawn from the engine's data (#108). -->
<script>
	import TechnologyCard from '../../../lib/components/player/TechnologyCard.svelte';
	import { techCardData } from '../../../lib/cards/game-cards.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="TechnologyCard"
	area="player"
	description="425 px horizontal technology cards with square and circle benefits, full artwork and prerequisites, each a real card from the engine's data: one per track and tier, and the income-mat innovations.">
	<Example
		label="data=techCardData('clocks') · Technology 2"
		width={425}>
		<TechnologyCard data={techCardData('clocks')} />
	</Example>
	<Example
		label="data=techCardData('concrete') · Exploration 2"
		width={425}>
		<TechnologyCard data={techCardData('concrete')} />
	</Example>
	<Example
		label="data=techCardData('paper') · Science 2"
		width={425}>
		<TechnologyCard data={techCardData('paper')} />
	</Example>
	<Example
		label="data=techCardData('dynamite') · Military 2"
		width={425}>
		<TechnologyCard data={techCardData('dynamite')} />
	</Example>
	<Example
		label="data=techCardData('time-travel') · Technology 4"
		width={425}>
		<TechnologyCard data={techCardData('time-travel')} />
	</Example>
	<Example
		label="data=techCardData('bakery') · the Farming innovation"
		width={425}>
		<TechnologyCard data={techCardData('bakery')} />
	</Example>
	<Example
		label="data=techCardData('stock-market') · the Banking innovation"
		width={425}>
		<TechnologyCard data={techCardData('stock-market')} />
	</Example>
	<Example
		label="data=techCardData('sewage-plumbing') · escaped title"
		width={425}>
		<TechnologyCard data={techCardData('sewage-plumbing')} />
	</Example>
</Section>
