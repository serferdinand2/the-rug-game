<!-- Library section: CardPlacementRows, extracted from the reviewed cards. -->
<script>
	import CardPlacementRows from '../../../lib/components/player/CardPlacementRows.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
	import CardSlot from '../../../lib/components/player/CardSlot.svelte';
</script>

<Section
	name="CardPlacementRows"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardPlacementRows
				>{#each Array(4) as _}<CardSlot />{/each}</CardPlacementRows>
		</div></Example
	></Section>
