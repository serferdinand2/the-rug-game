<!-- Library section for the full portrait tapestry-card back. -->
<script>
	import TapestryCardBack from '../../../lib/components/player/TapestryCardBack.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="TapestryCardBack"
	area="player"
	description="The full 319×560 portrait back used for a face-down tapestry card. It enlarges the approved tapestry-card symbol's stepped brown-and-green weave into the card's warm frame.">
	<Example
		label="Full size · 319×560"
		surface="ink"
		width={319}>
		<TapestryCardBack />
	</Example>
</Section>
