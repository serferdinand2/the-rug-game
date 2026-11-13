<!-- Library section: PlotCardGrid, an A&A plot card's squares: lit for a Farm with one picked, Commercial Center's printed benefits, the Forge placed hanging off, and a card's pieces as the Eras tab draws them (#184). -->
<script>
	import PlotCardGrid from '../../../lib/components/player/PlotCardGrid.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import {
		cardTargets,
		heldPlotCard,
		plotLanding,
	} from '../../../lib/area/placement-targets.js';

	/** The pieces already on the cards: a Market and an Armory on Monuments, a House on Commercial Center. */
	const ON_CARDS = {
		monuments: [
			{ building: 'market', row: 2, col: 0 },
			{ building: 'armory', row: 2, col: 1 },
		],
		'commercial-center': [{ building: 'house', row: 0, col: 0 }],
	};

	/**
	 * A placement's options on a card's open squares, as the prompt gives them.
	 * @param {string} card
	 * @param {{ row: number, col: number }[]} squares
	 * @param {number | null} rotation
	 * @param {number} [from]
	 */
	const on = (card, squares, rotation, from = 0) =>
		squares.map((square, index) => ({
			index: from + index,
			square: { card, ...square, rotation },
		}));

	const FARM_OPTIONS = [
		...on(
			'monuments',
			[
				{ row: 0, col: 2 },
				{ row: 1, col: 1 },
				{ row: 1, col: 2 },
				{ row: 2, col: 2 },
			],
			null
		),
		...on(
			'commercial-center',
			[
				{ row: 0, col: 1 },
				{ row: 1, col: 0 },
				{ row: 1, col: 1 },
			],
			null,
			4
		),
	];
	const FARM = cardTargets({
		piece: { building: 'farm' },
		options: FARM_OPTIONS,
		picked: null,
		onCards: ON_CARDS,
	}).plots;
	const FARM_PICKED = cardTargets({
		piece: { building: 'farm' },
		options: FARM_OPTIONS,
		picked: 2,
		onCards: ON_CARDS,
	}).plots;

	// The Forge's places on Monuments: each covers open squares only, hanging off where it must.
	const FORGE_OPTIONS = on(
		'monuments',
		[
			{ row: -1, col: 1 },
			{ row: 0, col: 1 },
			{ row: 0, col: 2 },
			{ row: 1, col: 2 },
		],
		0
	);
	const FORGE = cardTargets({
		piece: { landmark: 'forge' },
		options: FORGE_OPTIONS,
		picked: plotLanding(
			FORGE_OPTIONS,
			'monuments',
			{ row: 2, col: 2 },
			0,
			null,
			'forge'
		),
		onCards: ON_CARDS,
	}).plots;

	const ERAS = heldPlotCard('monuments', [
		...ON_CARDS.monuments,
		{ landmark: 'forge', row: 1, col: 2, rotation: 0 },
	]);

	let picked = $state(/** @type {number | null} */ (null));
	let live = $derived(
		cardTargets({
			piece: { building: 'farm' },
			options: FARM_OPTIONS,
			picked,
			onCards: ON_CARDS,
		}).plots
	);
</script>

<Section
	name="PlotCardGrid"
	area="player"
	description="An Arts & Architecture plot card's squares (#184): printed squares on the card's paper, the pieces on them, landmarks hanging off, and the squares a placement lights as the capital's plots are lit. The Capital tab draws one under the capital for each plot card a gained piece may go on, and the Eras tab draws the top card's pieces with it. Awaiting review.">
	<Example
		label="A Farm: the open squares of Monuments and Commercial Center lit (the printed benefits show faintly)">
		<div style="display: flex; gap: var(--space-8); align-items: end;">
			{#each FARM as card (card.card)}
				<PlotCardGrid
					{card}
					onPlotCardGridPick={() => {}} />
			{/each}
		</div>
	</Example>
	<Example label="Picked: the Farm previewed on Monuments' row 2, column 3">
		<PlotCardGrid
			card={FARM_PICKED[0]}
			onPlotCardGridPick={() => {}} />
	</Example>
	<Example
		label="The Forge placed over Monuments' right squares, hanging off (room kept for every place offered)">
		<PlotCardGrid
			card={FORGE[0]}
			onPlotCardGridPick={() => {}} />
	</Example>
	<Example label="On the Eras tab: what the card holds, nothing lit">
		{#if ERAS}
			<PlotCardGrid card={ERAS} />
		{/if}
	</Example>
	<Example label="Try it: press a lit square">
		<div style="display: flex; gap: var(--space-8); align-items: end;">
			{#each live as card (card.card)}
				<PlotCardGrid
					{card}
					onPlotCardGridPick={(
						/** @type {import('../../../lib/component-event.js').ComponentEvent} */ event
					) => (picked = event.value.index)} />
			{/each}
		</div>
	</Example>
</Section>
