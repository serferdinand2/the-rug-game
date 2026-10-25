<!-- Library section: CardTokenReserve, extracted from the reviewed cards. -->
<script>
	import CardTokenReserve from '../../../lib/components/player/CardTokenReserve.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardTokenReserve"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardTokenReserve /><CardTokenReserve
				used={2}
				color="purple" />
		</div></Example
	></Section>
