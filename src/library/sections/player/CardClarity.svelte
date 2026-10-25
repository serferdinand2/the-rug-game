<!-- Library section: CardClarity, extracted from the reviewed cards. -->
<script>
	import CardClarity from '../../../lib/components/player/CardClarity.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardClarity"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardClarity
				><p>
					Clarifying text belongs beneath the placement spaces.
				</p></CardClarity>
		</div></Example
	></Section>
