<!-- Library section: TechDeckBack, the tech deck's back, as a card on the shelf and as a chip beside an option. -->
<script>
	import TechDeckBack from '../../../lib/components/player/TechDeckBack.svelte';
	import ScaledCard from '../../../lib/components/player/ScaledCard.svelte';
	import { CARD_SIZES } from '../../../lib/cards/card-sizes.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="TechDeckBack"
	area="player"
	description="The top of the tech deck, offered beside the face-up tech cards: its full landscape back enlarges the approved tech-card symbol's stepped brown-and-green weave, with 'Deck · N' retained for the remaining count. As a card it fills the 425×298 tech frame, scaled with it; as a chip it stays a compact label beside an option's words (#118).">
	<Example
		label={'count={21} · full card size 425×298'}
		surface="ink"
		width={425}>
		<ScaledCard
			scale={1}
			{...CARD_SIZES.tech}>
			<TechDeckBack count={21} />
		</ScaledCard>
	</Example>
	<Example
		label={'count={21} · shelf scale 0.65'}
		surface="ink"
		width={276}>
		<ScaledCard
			scale={0.65}
			{...CARD_SIZES.tech}>
			<TechDeckBack count={21} />
		</ScaledCard>
	</Example>
	<Example
		label={'count={4} size="chip"  (beside an option)'}
		surface="ink">
		<TechDeckBack
			count={4}
			size="chip" />
	</Example>
</Section>
