<!-- Library section: CardScoreLadder, extracted from the reviewed cards. -->
<script>
	import CardScoreLadder from '../../../lib/components/player/CardScoreLadder.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardScoreLadder"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardScoreLadder
				values={[1, 3, 6, 10, 15, 21]}
				current={3} />
		</div></Example
	></Section>
