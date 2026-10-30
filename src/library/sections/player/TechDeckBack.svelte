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
	description="The top of the tech deck, offered beside the face-up tech cards: 'Deck · N' in gold on the card band's colour. As a card it fills a tech card's frame, scaled with it; as a chip it sits beside an option's words, as PromptArt draws it (#118).">
	<Example
		label={'count={21}  (in a ScaledCard at 0.65 with CARD_SIZES.tech · the shelf)'}
		surface="ink"
		width={277}>
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
