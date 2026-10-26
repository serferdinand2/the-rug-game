<!-- Library examples for the TapestryCard frame. -->
<script>
	import TapestryCard from '../../../lib/components/player/TapestryCard.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="TapestryCard"
	area="player"
	description="319 px cards with the timing label beside the portrait; Trap has its own red band.">
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
</Section>
