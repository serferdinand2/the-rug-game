<!-- Library section: CardFrame, extracted from the reviewed cards. -->
<script>
	import CardFrame from '../../../lib/components/player/CardFrame.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardFrame"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="425px frame"
		><CardFrame
			title="Collectors"
			portrait="/art/civ/collectors.svg"
			badges={['Arts & Architecture']}
			complexity={2}
			>{#snippet effect()}A 425 px card with large artwork and a readable
				main effect.{/snippet}
			<p style="padding:12px">Card layouts compose here.</p></CardFrame
		></Example
	></Section>
