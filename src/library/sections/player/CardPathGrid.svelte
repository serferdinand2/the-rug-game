<!-- Library section: CardPathGrid, extracted from the reviewed cards. -->
<script>
	import CardPathGrid from '../../../lib/components/player/CardPathGrid.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
	import CardSlot from '../../../lib/components/player/CardSlot.svelte';
</script>

<Section
	name="CardPathGrid"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardPathGrid
				><div class="rg-card-entertainer-path--grid">
					{#each Array(16) as _, i}<CardSlot size={75}
							>{i + 1}</CardSlot
						>{/each}
				</div></CardPathGrid>
		</div></Example
	></Section>
