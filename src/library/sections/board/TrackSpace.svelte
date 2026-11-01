<!-- Library section: TrackSpace as the first, a landmark, the last and a selected space, with benefits and bonuses, reporting hover, and short and large spaces. -->
<script>
	import TrackSpace from '../../../lib/components/board/TrackSpace.svelte';
	import { TRACKS } from '../../../lib/engine/data/tracks.js';
	import { describeBonus, describeEffects } from '../../../lib/describe.js';
	import { bonusGlyphs, spaceGlyphs } from '../../../lib/glyphs.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	// A space's real width at the 1920×1080 reference.
	const TILE = 'width: 116px';

	/**
	 * A real space's benefit, bonus and words (#59).
	 * @param {import('../../../lib/ui.js').TrackId} track
	 * @param {number} space
	 */
	function effects(track, space) {
		const { benefit, bonus } = TRACKS[track][space];
		return {
			benefit: spaceGlyphs(benefit),
			bonus: bonusGlyphs(bonus),
			words: bonus
				? `${describeEffects(benefit)}. Bonus: ${describeBonus(bonus)}.`
				: `${describeEffects(benefit)}.`,
		};
	}

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
	description="One pointed space on a track: its name, benefit, optional bonus, and any available landmark offer. Available landmarks show a compact footprint and name; the offer disappears after it is claimed. The first space has a flat left edge and the last a dashed finish line; selection draws a gold outline, and keyboard focus a dashed one.">
	<Example label={'track="exploration" space={1} name="Scouting"'}>
		<div style={TILE}>
			<TrackSpace
				track="exploration"
				space={1}
				name="Scouting"
				{...effects('exploration', 1)} />
		</div>
	</Example>
	<Example label={'space={4} name="Navigation" landmark="Lighthouse"'}>
		<div style={TILE}>
			<TrackSpace
				track="exploration"
				space={4}
				name="Navigation"
				landmark="Lighthouse"
				{...effects('exploration', 4)} />
		</div>
	</Example>
	<Example
		label={'track="science" space={7} name="Academic Research" landmark="Academy"'}>
		<div style={TILE}>
			<TrackSpace
				track="science"
				space={7}
				name="Academic Research"
				landmark="Academy"
				{...effects('science', 7)} />
		</div>
	</Example>
	<Example
		label={'track="technology" space={7} name="Rubber Works" landmark="Rubber Works" · irregular 4×4 footprint'}>
		<div style={TILE}>
			<TrackSpace
				track="technology"
				space={7}
				name="Rubber Works"
				landmark="Rubber Works"
				{...effects('technology', 7)} />
		</div>
	</Example>
	<Example label={'track="military" space={12} name="Mechs" last'}>
		<div style={TILE}>
			<TrackSpace
				track="military"
				space={12}
				name="Mechs"
				last
				{...effects('military', 12)} />
		</div>
	</Example>
	<Example label={'space={5} name="Ships" selected'}>
		<div style={TILE}>
			<TrackSpace
				track="exploration"
				space={5}
				name="Ships"
				selected
				{...effects('exploration', 5)} />
		</div>
	</Example>
	<Example
		label={`track="technology" selected={${chosen}}  onTrackSpaceHover → ${hover}  (hover, Tab, click)`}>
		<div style={TILE}>
			<TrackSpace
				track="technology"
				space={3}
				name="Stone Tools"
				{...effects('technology', 3)}
				selected={chosen}
				onTrackSpaceClick={() => (chosen = !chosen)}
				onTrackSpaceHover={hoverHandler} />
		</div>
	</Example>
	<Example
		label={'track="exploration" space={8} name="Cars"  (on a board with height to spare, TrackBoard makes a space up to 1.25 times as tall)'}>
		<div style="{TILE}; --rg-track-space-aspect: 4 / 5">
			<TrackSpace
				track="exploration"
				space={8}
				name="Cars"
				{...effects('exploration', 8)} />
		</div>
	</Example>
	<Example
		label={'track="exploration" space={10} name="Space Shuttle" landmark="Launch Pad"  (a large space, 136px and 1.25 times as tall, as on a 2240×1260 screen: 11px words, larger symbols)'}>
		<div style="width: 136px; --rg-track-space-aspect: 4 / 5">
			<TrackSpace
				track="exploration"
				space={10}
				name="Space Shuttle"
				landmark="Launch Pad"
				{...effects('exploration', 10)} />
		</div>
	</Example>
	<Example
		label={'track="technology" space={11} name="Nanotechnology"  (a large space, 156px and 1.25 times as tall, as on a 2560×1440 screen: 12px words, larger symbols)'}>
		<div style="width: 156px; --rg-track-space-aspect: 4 / 5">
			<TrackSpace
				track="technology"
				space={11}
				name="Nanotechnology"
				{...effects('technology', 11)} />
		</div>
	</Example>
	<Example
		label={'track="military" space={7} name="Tanks" landmark="Tank Factory"  (a large space, 156px, as on a 2560×1440 screen)'}>
		<div style="width: 156px; --rg-track-space-aspect: 4 / 5">
			<TrackSpace
				track="military"
				space={7}
				name="Tanks"
				landmark="Tank Factory"
				{...effects('military', 7)} />
		</div>
	</Example>
	<Example
		label={'track="technology" space={6} name="Steel"  (a short space, 84px, as on a 1366×768 screen: smaller symbols)'}>
		<div style="width: 84px">
			<TrackSpace
				track="technology"
				space={6}
				name="Steel"
				{...effects('technology', 6)} />
		</div>
	</Example>
</Section>
