<!-- Library examples for the TechnologyCard frame, each drawn from the engine's data (#108), A&A's new prerequisites first (#37). -->
<script>
	import TechnologyCard from '../../../lib/components/player/TechnologyCard.svelte';
	import { techCardData } from '../../../lib/cards/game-cards.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="TechnologyCard"
	area="player"
	description="425 px horizontal technology cards with square and circle benefits, full artwork and prerequisites, each a real card from the engine's data. All six landmark-granting innovation cards are included so their square-benefit landmark hover details can be checked here.">
	<!-- #37: Arts & Architecture's new prerequisites, awaiting review. -->
	<Example
		label="data=techCardData('astrolabe') · A&A, a landmark on this card · awaiting review"
		width={425}>
		<TechnologyCard data={techCardData('astrolabe')} />
	</Example>
	<Example
		label="data=techCardData('astrolabe', {'{'} held: 'forge' {'}'}) · holding the Forge in a game · awaiting review"
		width={425}>
		<TechnologyCard data={techCardData('astrolabe', { held: 'forge' })} />
	</Example>
	<Example
		label="data=techCardData('suburbs') · A&A, no prerequisite · awaiting review"
		width={425}>
		<TechnologyCard data={techCardData('suburbs')} />
	</Example>
	<Example
		label="data=techCardData('opera') · A&A, Arts 2"
		width={425}>
		<TechnologyCard data={techCardData('opera')} />
	</Example>
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
		label="data=techCardData('barn') · the Breeding innovation"
		width={425}>
		<TechnologyCard data={techCardData('barn')} />
	</Example>
	<Example
		label="data=techCardData('com-tower') · the Telephone innovation"
		width={425}>
		<TechnologyCard data={techCardData('com-tower')} />
	</Example>
	<Example
		label="data=techCardData('library') · the Writing innovation"
		width={425}>
		<TechnologyCard data={techCardData('library')} />
	</Example>
	<Example
		label="data=techCardData('stock-market') · the Banking innovation"
		width={425}>
		<TechnologyCard data={techCardData('stock-market')} />
	</Example>
	<Example
		label="data=techCardData('treasury') · the Currency innovation"
		width={425}>
		<TechnologyCard data={techCardData('treasury')} />
	</Example>
	<Example
		label="data=techCardData('sewage-plumbing') · escaped title"
		width={425}>
		<TechnologyCard data={techCardData('sewage-plumbing')} />
	</Example>
	<Example
		label="data=techCardData('levitation') · F&F: charm-or-5 prerequisite, single use (#39, awaiting review)"
		width={425}>
		<TechnologyCard data={techCardData('levitation')} />
	</Example>
	<Example
		label="data=techCardData('pyrokinesis') · F&F, repeatable (#39, awaiting review)"
		width={425}>
		<TechnologyCard data={techCardData('pyrokinesis')} />
	</Example>
	<Example
		label="data=techCardData('mind-control', {'{'} flipped: true {'}'}) · F&F, its single use spent (#39, awaiting review)"
		width={425}>
		<TechnologyCard
			data={techCardData('mind-control', { flipped: true })} />
	</Example>
	<Example
		label={`data=techCardData('clocks')  (data-cards="dark" on the page: the menu's Dark cards)`}
		width={425}>
		<div data-cards="dark">
			<TechnologyCard data={techCardData('clocks')} />
		</div>
	</Example>
	<Example
		label={`data=techCardData('dynamite')  (data-cards="dark")`}
		width={425}>
		<div data-cards="dark">
			<TechnologyCard data={techCardData('dynamite')} />
		</div>
	</Example>
</Section>
