<!-- Library section: CardTerrainRewards, extracted from the reviewed cards. -->
<script>
	import CardTerrainRewards from '../../../lib/components/player/CardTerrainRewards.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardTerrainRewards"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardTerrainRewards
				><li class="rg-card-treasure-row">
					<img
						src="/art/terrain/forest.svg"
						alt="" /><span>Forest</span><span
						>A terrain-specific reward.</span>
				</li></CardTerrainRewards>
		</div></Example
	></Section>
