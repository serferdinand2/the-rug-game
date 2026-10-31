<!-- Library section: the landmark art, fancy name and printed capital footprint shown in a track-space tooltip. -->
<script>
	import LandmarkHoverDetail from '../../../lib/components/board/LandmarkHoverDetail.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="LandmarkHoverDetail"
	area="board"
	description="The shared detail row used in a track-space hover tooltip when an unclaimed landmark is available: its larger artwork, gold fancy-font name and exact capital footprint, vertically centered on one row. Once claimed, the parent tooltip omits the detail.">
	<Example label={'id="lighthouse"'}>
		<LandmarkHoverDetail id="lighthouse" />
	</Example>
	<Example label={'id="academy"'}>
		<LandmarkHoverDetail id="academy" />
	</Example>
</Section>
