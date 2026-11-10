<!-- All canonical scan orders, displayed with the game's shared hex geometry. -->
<script>
	import AutomaHexPattern from '../../../lib/components/player/AutomaHexPattern.svelte';
	import { HEX_PATTERNS } from '../../../lib/engine/automa-map.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="AutomaHexPattern"
	area="player"
	description="The full small-map scan diagram: the dark primary-row arrow, grey subsequent rows and row progression, and a highlighted first hex. The optional numbers expose the canonical priority order for review.">
	{#each HEX_PATTERNS as pattern, index (index)}
		<Example
			label={`Pattern ${index + 1} · full map and arrows`}
			width={290}>
			<AutomaHexPattern pattern={index + 1} />
		</Example>
	{/each}
	<Example
		label="Pattern 1 · canonical priority numbers exposed"
		width={290}>
		<AutomaHexPattern
			pattern={1}
			showOrder />
	</Example>
</Section>
