<!-- Library section: OverviewCloseBar, the footer while the players overview is open. -->
<script>
	import OverviewCloseBar from '../../../lib/components/prompts/OverviewCloseBar.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let closed = $state(0);
</script>

<Section
	name="OverviewCloseBar"
	area="prompts"
	description="The footer while the players overview is open, whatever decision waits underneath: one full-width button between two upward chevrons. Hover or keyboard focus turns the text and chevrons gold.">
	<Example
		label={`onOverviewCloseBarClick  (pressed ${closed} ${closed === 1 ? 'time' : 'times'})`}
		surface="ink"
		wide>
		<OverviewCloseBar onOverviewCloseBarClick={() => (closed += 1)} />
	</Example>
</Section>
