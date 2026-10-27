<!-- Library examples for the TechnologyCard frame. -->
<script>
	import TechnologyCard from '../../../lib/components/player/TechnologyCard.svelte';
	import { techCardData } from '../../../lib/cards/game-cards.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="TechnologyCard"
	area="player"
	description="425 px horizontal technology cards with square and circle benefits, full artwork and prerequisites: the reviewed fixtures by id, and real cards from the engine's data.">
	<Example
		label="Clocks · Technology condition"
		width={425}>
		<TechnologyCard id="clocks" />
	</Example>
	<Example
		label="Concrete · Exploration condition"
		width={425}>
		<TechnologyCard id="concrete" />
	</Example>
	<Example
		label="Dynamite · Military condition"
		width={425}>
		<TechnologyCard id="dynamite" />
	</Example>
	<Example
		label="Bakery · Innovation condition"
		width={425}>
		<TechnologyCard id="bakery" />
	</Example>
	<Example
		label="data=techCardData('clocks') · engine data"
		width={425}>
		<TechnologyCard data={techCardData('clocks')} />
	</Example>
	<Example
		label="data=techCardData('time-travel') · Technology 4"
		width={425}>
		<TechnologyCard data={techCardData('time-travel')} />
	</Example>
	<Example
		label="data=techCardData('sewage-plumbing') · escaped title"
		width={425}>
		<TechnologyCard data={techCardData('sewage-plumbing')} />
	</Example>
	<Example
		label="data=techCardData('stock-market') · Banking innovation"
		width={425}>
		<TechnologyCard data={techCardData('stock-market')} />
	</Example>
</Section>
