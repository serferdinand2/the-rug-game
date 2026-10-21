<!-- Library section: TrackSpace as the first, a landmark, the last and a selected space, and reporting hover. -->
<script>
	import TrackSpace from '../../../lib/components/board/TrackSpace.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	// A space's real width at the 1920×1080 reference.
	const TILE = 'width: 116px';

	let hover = $state('nothing yet');
	let chosen = $state(false);

	/**
	 * @param {import('../../../lib/component-event.js').ComponentEvent} event
	 */
	const hoverHandler = (event) => {
		hover = JSON.stringify(event.value);
	};
</script>

<Section
	name="TrackSpace"
	area="board"
	description="One pointed space on a track: its name at the top left, any landmark at the bottom over a darker track-coloured band, and its number in the arrow tip. The first space has a flat left edge and the last a dashed finish line; selection draws a gold outline, and keyboard focus a dashed one.">
	<Example label={'track="exploration" space={1} name="Scouting"'}>
		<div style={TILE}>
			<TrackSpace
				track="exploration"
				space={1}
				name="Scouting" />
		</div>
	</Example>
	<Example label={'space={4} name="Navigation" landmark="Lighthouse"'}>
		<div style={TILE}>
			<TrackSpace
				track="exploration"
				space={4}
				name="Navigation"
				landmark="Lighthouse" />
		</div>
	</Example>
	<Example
		label={'track="science" space={7} name="Academic Research" landmark="Academy"'}>
		<div style={TILE}>
			<TrackSpace
				track="science"
				space={7}
				name="Academic Research"
				landmark="Academy" />
		</div>
	</Example>
	<Example label={'track="military" space={12} name="Mechs"'}>
		<div style={TILE}>
			<TrackSpace
				track="military"
				space={12}
				name="Mechs" />
		</div>
	</Example>
	<Example label={'space={5} name="Ships" selected'}>
		<div style={TILE}>
			<TrackSpace
				track="exploration"
				space={5}
				name="Ships"
				selected />
		</div>
	</Example>
	<Example
		label={`track="technology" selected={${chosen}}  onTrackSpaceHover → ${hover}  (hover, Tab, click)`}>
		<div style={TILE}>
			<TrackSpace
				track="technology"
				space={3}
				name="Stone Tools"
				selected={chosen}
				onTrackSpaceClick={() => (chosen = !chosen)}
				onTrackSpaceHover={hoverHandler} />
		</div>
	</Example>
</Section>
