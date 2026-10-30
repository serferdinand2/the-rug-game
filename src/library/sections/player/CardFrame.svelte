<!-- Library section: CardFrame, the civilization card and its plain paper (#106). -->
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
			editions={['aa']}
			complexity={2}
			>{#snippet effect()}A 425 px card with large artwork and a readable
				main effect.{/snippet}
			<p style="padding:12px">Card layouts compose here.</p></CardFrame
		></Example
	><Example
		label="plain"
		width={425}
		><CardFrame plain
			><p style="margin:0;padding:12px">
				Only the paper and its palette, for a card pattern on its own.
			</p></CardFrame
		></Example
	></Section>
