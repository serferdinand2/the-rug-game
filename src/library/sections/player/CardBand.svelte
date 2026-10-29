<!-- Library section: CardBand, the title band of every card family (#109), at its three approved title sizes and as the trap's red band. -->
<script>
	import CardBand from '../../../lib/components/player/CardBand.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="CardBand"
	area="player"
	description="The brown title band over the paper noise, shared by the civilization, tech, tapestry, landmark and masterpiece cards: a gold Cinzel title at one of the three approved sizes, and the trap's red band. The card's own class sets its height and padding.">
	<Example
		label={'title="Collectors" size="large"  (a civilization card, 28 px)'}
		width={425}>
		<CardBand
			title="Collectors"
			size="large"
			style="min-height: 49px; padding: 8px 12px" />
	</Example>
	<Example
		label={'title="Clocks" size="medium"  (tech and masterpiece cards, 22 px)'}
		width={425}>
		<CardBand
			title="Clocks"
			size="medium"
			style="height: 40px; padding: 0 10px" />
	</Example>
	<Example
		label={'title="Academia" size="small"  (tapestry and landmark cards, 21 px)'}
		width={319}>
		<CardBand
			title="Academia"
			size="small"
			style="height: 49px; padding: 0 12px" />
	</Example>
	<Example
		label={'title="Trap" size="small" trap'}
		width={319}>
		<CardBand
			title="Trap"
			size="small"
			trap
			style="height: 49px; padding: 0 12px" />
	</Example>
</Section>
