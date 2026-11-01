<!-- Library section: the compact landmark name and footprint used on track offers. -->
<script>
	import TrackLandmark from '../../../lib/components/board/TrackLandmark.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="TrackLandmark"
	area="board"
	description="The compact landmark-offer label: the printed footprint beside its gold name. The offer appears on track spaces only while the landmark remains available.">
	<Example label={'id="lighthouse" name="Lighthouse"  (2 × 2)'}>
		<TrackLandmark
			id="lighthouse"
			name="Lighthouse" />
	</Example>
	<Example label={'id="academy" name="Academy"  (3 × 2)'}>
		<TrackLandmark
			id="academy"
			name="Academy" />
	</Example>
	<Example label={'id="rubber-works" name="Rubber Works"  (irregular 4 × 4)'}>
		<TrackLandmark
			id="rubber-works"
			name="Rubber Works" />
	</Example>
</Section>
