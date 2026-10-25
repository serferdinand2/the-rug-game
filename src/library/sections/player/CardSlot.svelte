<!-- Library section: CardSlot, extracted from the reviewed cards. -->
<script>
	import CardSlot from '../../../lib/components/player/CardSlot.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardSlot"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardSlot
				size={62}
				label="Empty placement" /><CardSlot
				size={75}
				label="Filled placement"
				filled />
		</div></Example
	></Section>
