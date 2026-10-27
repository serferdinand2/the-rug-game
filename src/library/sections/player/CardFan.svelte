<!-- Library examples for CardFan. -->
<script>
	import CardFan from '../../../lib/components/player/CardFan.svelte';
	import TapestryCard from '../../../lib/components/player/TapestryCard.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const hand = ['academia', 'age-of-discovery', 'age-of-sail', 'trap'];

	/** @type {number | null} */
	let inspected = $state(null);
	/** @type {number | null} */
	let chosen = $state(null);
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
				(inspected = event.value.index)}>
			{#snippet card(/** @type {string} */ id)}
				<div style:zoom="0.5">
					<TapestryCard {id} />
				</div>
			{/snippet}
		</CardFan>
		<p>Inspecting: {inspected === null ? 'none' : hand[inspected]}</p>
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
</Section>
