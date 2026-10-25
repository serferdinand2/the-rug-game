<!-- Library section: CardRewardColumns, extracted from the reviewed cards. -->
<script>
	import CardRewardColumns from '../../../lib/components/player/CardRewardColumns.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
	import CardSlot from '../../../lib/components/player/CardSlot.svelte';
</script>

<Section
	name="CardRewardColumns"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardRewardColumns
				>{#each [1, 2, 3] as column}<div
						class="rg-card-craftsmen-column">
						<div class="rg-card-craftsmen-column--rows">
							{#each Array(column) as _}<div
									class="rg-card-craftsmen-row">
									<CardSlot /><span
										class="rg-card-craftsmen-benefit"
										><b>5 VP</b></span>
								</div>{/each}
						</div>
					</div>{/each}</CardRewardColumns>
		</div></Example
	></Section>
