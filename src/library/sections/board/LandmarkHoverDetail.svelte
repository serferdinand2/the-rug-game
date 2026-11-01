<!-- Library section: the landmark art, fancy name and printed capital footprint shown in a track-space tooltip. -->
<script>
	import LandmarkHoverDetail from '../../../lib/components/board/LandmarkHoverDetail.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="LandmarkHoverDetail"
	area="board"
	description="The shared detail row used in track-space and technology-card hover tooltips when a landmark is available: larger artwork on the left, a centered gold fancy-font name, and the exact capital footprint on the right, vertically centered on one row. Once a track landmark is claimed, the parent tooltip omits the detail.">
	<Example label={'id="lighthouse"'}>
		<LandmarkHoverDetail id="lighthouse" />
	</Example>
	<Example label={'id="academy"'}>
		<LandmarkHoverDetail id="academy" />
	</Example>
</Section>
