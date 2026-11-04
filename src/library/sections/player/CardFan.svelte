<!-- Library examples for CardFan, and a hand that gains and plays cards (#175). -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
	import CardFan from '../../../lib/components/player/CardFan.svelte';
	import ScaledCard from '../../../lib/components/player/ScaledCard.svelte';
	import TapestryCard from '../../../lib/components/player/TapestryCard.svelte';
	import TechnologyCard from '../../../lib/components/player/TechnologyCard.svelte';
	import { CARD_SIZES } from '../../../lib/cards/card-sizes.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const hand = ['academia', 'age-of-discovery', 'age-of-sail', 'trap'];
	const long = [
		'industrialism',
		'trade-economy',
		'alliance',
		'feudalism',
		'renaissance',
	];
	/** The Hand tab's scale (#158). */
	const scale = 0.6;

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

	/** The cards the gaining example deals from (#175). */
	const DECK = [
		'academia',
		'age-of-discovery',
		'age-of-sail',
		'trap',
		'industrialism',
		'trade-economy',
	];
	let dealt = $state(['academia', 'age-of-sail', 'trap']);
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
		label="wrap cardWidth={191}  (the Hand tab's rows in its 436 px at 1920×1080, #158; another player's backs use them too)"
		wide>
		<div style:width="436px">
			<CardFan
				items={long}
				wrap
				cardWidth={scale * CARD_SIZES.tapestry.width}
				label="Tapestry cards in hand"
				onCardFanInspect={(/** @type {any} */ event) =>
					(inspected = event.value.item)}>
				{#snippet card(/** @type {string} */ id)}
					<ScaledCard
						{scale}
						{...CARD_SIZES.tapestry}>
						<TapestryCard {id} />
					</ScaledCard>
				{/snippet}
			</CardFan>
		</div>
	</Example>
	<Example
		label="wrap cardWidth={191} at 316 px  (1440×900: two to a row)"
		wide>
		<div style:width="316px">
			<CardFan
				items={long.slice(0, 3)}
				wrap
				cardWidth={scale * CARD_SIZES.tapestry.width}
				label="Tapestry cards in hand">
				{#snippet card(/** @type {string} */ id)}
					<ScaledCard
						{scale}
						{...CARD_SIZES.tapestry}>
						<TapestryCard {id} />
					</ScaledCard>
				{/snippet}
			</CardFan>
		</div>
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
	<Example
		label={`items={${dealt.length} cards} key={id}  (gain or play a card: a gained card rises in and the others close up; #175)`}
		wide>
		<CardFan
			items={dealt}
			key={(/** @type {string} */ id) => id}
			label="Tapestry cards in hand">
			{#snippet card(/** @type {string} */ id)}
				<div style:zoom="0.5">
					<TapestryCard {id} />
				</div>
			{/snippet}
		</CardFan>
		<span class="rg-library-card-fan--buttons">
			<Button
				size="small"
				disabled={dealt.length >= DECK.length}
				onButtonClick={() =>
					(dealt = [
						...dealt,
						DECK.find((id) => !dealt.includes(id)) ?? DECK[0],
					])}>Gain a card</Button>
			<Button
				size="small"
				disabled={dealt.length === 0}
				onButtonClick={() =>
					(dealt = dealt.filter(
						(_, index) => index !== Math.min(1, dealt.length - 1)
					))}>Play the second card</Button>
		</span>
	</Example>
</Section>

<style>
	.rg-library-card-fan--buttons {
		display: flex;
		gap: var(--space-5);
	}
</style>
