<!-- Library section: EraNote, the era card under the capital, with a card, the active one, face down, the printed Maker of Fire and none yet. -->
<script>
	import EraNote from '../../../lib/components/player/EraNote.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="EraNote"
	area="player"
	description="The tapestry card of the era a player is in, under their capital on the Capital tab (#174): its name in Cinzel gold and its text, as the Eras tab's card says it.">
	<Example
		label={'heading="Era III" name="Dystopia" copy="…"'}
		width={440}>
		<EraNote
			heading="Era III"
			name="Dystopia"
			copy="Gain a track landmark nobody owns." />
	</Example>
	<Example
		label={'heading="Era II · Active" name="Alliance" copy="…"'}
		width={440}>
		<EraNote
			heading="Era II · Active"
			name="Alliance"
			copy="Choose an opponent. Neither of you may conquer the other's territories. Whenever they upgrade a tech card, you gain the same benefit after them." />
	</Example>
	<Example
		label={'heading="Era III" faceDown'}
		width={440}>
		<EraNote
			heading="Era III"
			faceDown />
	</Example>
	<Example
		label={'heading="Era I" name="Maker of Fire"  (printed on the mat, no text)'}
		width={440}>
		<EraNote
			heading="Era I"
			name="Maker of Fire" />
	</Example>
	<Example
		label={'heading="Era I"  (no card yet)'}
		width={440}>
		<EraNote heading="Era I" />
	</Example>
</Section>
