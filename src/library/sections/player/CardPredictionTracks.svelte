<!-- Library section: CardPredictionTracks, extracted from the reviewed cards. -->
<script>
	import CardPredictionTracks from '../../../lib/components/player/CardPredictionTracks.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
	import CardSlot from '../../../lib/components/player/CardSlot.svelte';
</script>

<Section
	name="CardPredictionTracks"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardPredictionTracks
				><div class="rg-card-mystic-prediction">
					<div class="rg-card-mystic-prediction--label">
						Tech cards
					</div>
					<div class="rg-card-mystic-prediction--numbers">
						{#each Array(9) as _, i}<CardSlot size={39}
								>{i + 1}</CardSlot
							>{/each}
					</div>
				</div></CardPredictionTracks>
		</div></Example
	></Section>
