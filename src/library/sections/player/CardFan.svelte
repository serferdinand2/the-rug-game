<!-- Library examples for CardFan. -->
<script>
	import CardFan from '../../../lib/components/player/CardFan.svelte';
	import ScaledCard from '../../../lib/components/player/ScaledCard.svelte';
	import TapestryCard from '../../../lib/components/player/TapestryCard.svelte';
	import TechnologyCard from '../../../lib/components/player/TechnologyCard.svelte';
	import { CARD_SIZES } from '../../../lib/cards/card-sizes.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const hand = ['academia', 'age-of-discovery', 'age-of-sail', 'trap'];

	/** @type {string | null} */
	let inspected = $state(null);
	/** @type {number | null} */
	let chosen = $state(null);
	/** @type {number[]} */
	let paid = $state([1]);
	let waiting = $derived(
		paid.length >= 2
			? hand.flatMap((_, index) => (paid.includes(index) ? [] : [index]))
			: []
	);
</script>

<Section
	name="CardFan"
	area="player"
	description="Cards overlapping; hovering or focusing one raises it without moving the others and reports it for a full view.">
	<Example
		label="items=4 overlap=54"
		wide>
		<CardFan
			items={hand}
			label="Tapestry cards in hand"
			onCardFanInspect={(/** @type {any} */ event) =>
				(inspected = event.value.item)}>
			{#snippet card(/** @type {string} */ id)}
				<div style:zoom="0.5">
					<TapestryCard {id} />
				</div>
			{/snippet}
		</CardFan>
		<p>Inspecting: {inspected ?? 'none'}</p>
	</Example>
	<Example
		label="selected={chosen}"
		wide>
		<CardFan
			items={hand}
			overlap={90}
			selected={chosen}
			label="Choose a tapestry card"
			onCardFanSelect={(/** @type {any} */ event) =>
				(chosen = event.value.index)}>
			{#snippet card(/** @type {string} */ id)}
				<div style:zoom="0.5">
					<TapestryCard {id} />
				</div>
			{/snippet}
		</CardFan>
	</Example>
	<Example
		label={`look="shelf" selected={[${paid.join(', ')}]} disabled={[${waiting.join(', ')}]} overlap={72}  (several chosen; the rest wait once two are; CardShelf's look)`}
		surface="ink"
		wide>
		<CardFan
			items={hand}
			look="shelf"
			overlap={72}
			selected={paid}
			disabled={waiting}
			labels={hand}
			label="Choose two tapestry cards"
			onCardFanSelect={(/** @type {any} */ event) =>
				(paid = paid.includes(event.value.index)
					? paid.filter((index) => index !== event.value.index)
					: [...paid, event.value.index])}>
			{#snippet card(/** @type {string} */ id)}
				<ScaledCard
					scale={0.7}
					{...CARD_SIZES.tapestry}>
					<TapestryCard {id} />
				</ScaledCard>
			{/snippet}
		</CardFan>
	</Example>
	<Example
		label={'look="shelf" lift={false} selected={0}  (whole cards stay where they stand)'}
		surface="ink"
		wide>
		<CardFan
			items={['clocks', 'bakery']}
			look="shelf"
			lift={false}
			selected={0}>
			{#snippet card(/** @type {string} */ id)}
				<ScaledCard
					scale={0.65}
					{...CARD_SIZES.tech}>
					<TechnologyCard {id} />
				</ScaledCard>
			{/snippet}
		</CardFan>
	</Example>
</Section>
