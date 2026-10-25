<!-- Library section: CardEffectBox, extracted from the reviewed cards. -->
<script>
	import CardEffectBox from '../../../lib/components/player/CardEffectBox.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardEffectBox"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardEffectBox
				>{#snippet symbol()}10 VP{/snippet}<b>Final income turn</b><span
					>Score for an exact prediction.</span
				></CardEffectBox>
		</div></Example
	></Section>
