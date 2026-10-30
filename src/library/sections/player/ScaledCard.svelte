<!-- Library examples for ScaledCard, at the scales the game uses. -->
<script>
	import ScaledCard from '../../../lib/components/player/ScaledCard.svelte';
	import CivilizationCard from '../../../lib/components/player/CivilizationCard.svelte';
	import TapestryCard from '../../../lib/components/player/TapestryCard.svelte';
	import TechnologyCard from '../../../lib/components/player/TechnologyCard.svelte';
	import { CARD_SIZES } from '../../../lib/cards/card-sizes.js';
	import { tapestryCardData } from '../../../lib/cards/game-cards.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {number | undefined} */
	let civHeight = $state();
</script>

<Section
	name="ScaledCard"
	area="player"
	description="Any card shown smaller: the card keeps its layout at full size and is scaled as a whole, and the box takes the scaled size. Its size comes from CARD_SIZES; a tapestry or civilization card is measured, so the layout around it does not jump.">
	<Example
		label={'scale={0.7} {...CARD_SIZES.tapestry} · the choice shelf'}
		width={224}>
		<ScaledCard
			scale={0.7}
			{...CARD_SIZES.tapestry}>
			<TapestryCard data={tapestryCardData('academia')} />
		</ScaledCard>
	</Example>
	<Example
		label={'scale={0.6} {...CARD_SIZES.tapestry} · the current era'}
		width={192}>
		<ScaledCard
			scale={0.6}
			{...CARD_SIZES.tapestry}>
			<TapestryCard data={tapestryCardData('guilds')} />
		</ScaledCard>
	</Example>
	<Example
		label={'scale={0.42} {...CARD_SIZES.tapestry} · the hand'}
		width={134}>
		<ScaledCard
			scale={0.42}
			{...CARD_SIZES.tapestry}>
			<TapestryCard data={tapestryCardData('dark-ages')} />
		</ScaledCard>
	</Example>
	<Example
		label={'scale={0.65} {...CARD_SIZES.tech} · the choice shelf'}
		width={277}>
		<ScaledCard
			scale={0.65}
			{...CARD_SIZES.tech}>
			<TechnologyCard id="clocks" />
		</ScaledCard>
	</Example>
	<Example
		label={'scale={0.42} {...CARD_SIZES.tech} · the Tech tab'}
		width={179}>
		<ScaledCard
			scale={0.42}
			{...CARD_SIZES.tech}>
			<TechnologyCard id="bakery" />
		</ScaledCard>
	</Example>
	<Example
		label={'scale={0.4} {...CARD_SIZES.tech} · the players overview'}
		width={170}>
		<ScaledCard
			scale={0.4}
			{...CARD_SIZES.tech}>
			<TechnologyCard id="compass" />
		</ScaledCard>
	</Example>
	<Example
		label={`scale={0.75} {...CARD_SIZES.civilization} bind:measuredHeight · the smallest a shelf shrinks one (measured ${civHeight ?? '…'} px)`}
		width={319}>
		<ScaledCard
			scale={0.75}
			{...CARD_SIZES.civilization}
			bind:measuredHeight={civHeight}>
			<CivilizationCard
				id="collectors"
				state="empty" />
		</ScaledCard>
	</Example>
</Section>
