<!-- Library section: accessible landmark footprint previews at compact and card sizes. -->
<script>
	import LandmarkFootprint from '../../../lib/components/player/LandmarkFootprint.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="LandmarkFootprint"
	area="player"
	description="An accessible footprint preview built from the canonical landmark definition. Plot outlines expose the exact shape and dimensions; the picture remains clipped to those plots.">
	<Example label={'id="lighthouse" plotSize={5}  (track offer)'}>
		<LandmarkFootprint
			id="lighthouse"
			plotSize={5} />
	</Example>
	<Example label={'id="academy" plotSize={9}  (larger offer)'}>
		<LandmarkFootprint
			id="academy"
			plotSize={9} />
	</Example>
	<Example label={'id="rubber-works" plotSize={6}  (irregular footprint)'}>
		<LandmarkFootprint
			id="rubber-works"
			plotSize={6} />
	</Example>
	<Example label={'id="bakery" plotSize={8}  (card-size preview)'}>
		<LandmarkFootprint
			id="bakery"
			plotSize={8} />
	</Example>
</Section>
