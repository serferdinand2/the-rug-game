<!-- Library section: CardTechnologyTransfer, extracted from the reviewed cards. -->
<script>
	import CardTechnologyTransfer from '../../../lib/components/player/CardTechnologyTransfer.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardTechnologyTransfer"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardTechnologyTransfer /><CardTechnologyTransfer active />
		</div></Example
	></Section>
