<!-- Library section: EraSlots, the four era slots with an active era and a face-down card. -->
<script>
	import EraSlots from '../../../lib/components/player/EraSlots.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { eraSlots } from '../../../lib/area/income.js';

	/** @param {(string | null)[][]} tapestry @param {string | null} active */
	const slotsFor = (tapestry, active) =>
		eraSlots({
			incomeMat: { tapestry },
			era: active ? { card: active, ability: {} } : null,
		});

	const FRESH = slotsFor([[], [], [], []], null);
	const MID = slotsFor(
		[[], ['age-of-discovery'], ['capitalism'], []],
		'capitalism'
	);
	const HIDDEN = slotsFor(
		[[], ['age-of-discovery'], ['capitalism'], [null]],
		null
	);
	let selected = $state(/** @type {number | null} */ (3));
</script>

<Section
	name="EraSlots"
	area="player"
	description="The four era slots: Era I is the printed Maker of Fire; later slots show their top tapestry card, 'Face-down card' or 'Not yet chosen'. The active era is outlined, and a slot with a card can be chosen to look at it.">
	<Example
		label={'slots={fresh}  (nothing chosen yet)'}
		width={430}>
		<EraSlots slots={FRESH} />
	</Example>
	<Example
		label={'slots={mid-game}  bind:selected  (Era III active)'}
		width={430}>
		<EraSlots
			slots={MID}
			bind:selected />
	</Example>
	<Example
		label={'slots={with a face-down card}'}
		width={430}>
		<EraSlots slots={HIDDEN} />
	</Example>
</Section>
