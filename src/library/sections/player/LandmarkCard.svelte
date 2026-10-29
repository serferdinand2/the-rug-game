<!-- Library examples for the reviewed LandmarkCard frame. -->
<script>
	import LandmarkCard from '../../../lib/components/player/LandmarkCard.svelte';
	import { FOOTPRINTS } from '../../../lib/art/footprints.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="LandmarkCard"
	area="player"
	description="319 px landmark frame, with the capital footprint beside the art, the end-of-turn condition and the edition footer. The condition reads Rules text pending until game data supplies it.">
	<Example
		label="Castle · an irregular footprint with empty plots"
		width={319}>
		<LandmarkCard
			title="Castle"
			artwork="/art/landmark-card/castle.svg"
			footprint={FOOTPRINTS.castle}
			edition="aa" />
	</Example>
	<Example
		label="Windmill · a footprint two rows tall"
		width={319}>
		<LandmarkCard
			title="Windmill"
			artwork="/art/landmark-card/windmill.svg"
			footprint={FOOTPRINTS.windmill}
			edition="aa" />
	</Example>
</Section>
