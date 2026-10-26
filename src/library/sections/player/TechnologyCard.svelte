<!-- Library examples for the TechnologyCard frame. -->
<script>
	import TechnologyCard from '../../../lib/components/player/TechnologyCard.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="TechnologyCard"
	area="player"
	description="425 px horizontal technology cards with square and circle benefits, full artwork and prerequisites.">
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
</Section>
