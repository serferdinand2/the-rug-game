<!-- Library section: LandmarkShape with its picture, turned, with every plot outlined, filling a box, and as the plain plots a landmark card prints. -->
<script>
	import LandmarkShape from '../../../lib/components/player/LandmarkShape.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { FOOTPRINTS } from '../../../lib/art/footprints.js';
</script>

<Section
	name="LandmarkShape"
	area="player"
	description="A landmark's footprint as one SVG shape (#110): its picture clipped to the covered plots with the border inside them, or the plain plots as a landmark card prints them. LandmarkPiece and LandmarkCard draw their shapes with it, and #63 will put it on the track spaces.">
	<Example label={'id="academy" plotSize={29}'}>
		<LandmarkShape
			id="academy"
			footprint={FOOTPRINTS.academy}
			plotSize={29} />
	</Example>
	<Example label={'id="academy" rotation={1} plotSize={29}'}>
		<LandmarkShape
			id="academy"
			footprint={FOOTPRINTS.academy}
			rotation={1}
			plotSize={29} />
	</Example>
	<Example label={'id="lighthouse" plotSize={29} color="var(--exploration)"'}>
		<LandmarkShape
			id="lighthouse"
			footprint={FOOTPRINTS.lighthouse}
			plotSize={29}
			color="var(--exploration)" />
	</Example>
	<Example label={'id="rubber-works" plotSize={29} plots'}>
		<LandmarkShape
			id="rubber-works"
			footprint={FOOTPRINTS['rubber-works']}
			plotSize={29}
			plots />
	</Example>
	<Example
		label={'id="rubber-works" rotation={2}  (no plotSize: fills a 120 px box)'}>
		<div
			style:width="120px"
			style:height="120px">
			<LandmarkShape
				id="rubber-works"
				footprint={FOOTPRINTS['rubber-works']}
				rotation={2} />
		</div>
	</Example>
	<Example
		label={'footprint={castle} plotSize={20} gap={2} picture={false} plots  (as on a landmark card)'}>
		<LandmarkShape
			footprint={FOOTPRINTS.castle}
			plotSize={20}
			gap={2}
			picture={false}
			plots
			color="var(--card-line-strong)"
			tint="var(--card-score-line)" />
	</Example>
</Section>
