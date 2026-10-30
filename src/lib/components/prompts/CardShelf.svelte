<!-- CardShelf: the cards a decision offers, shown in a row above the panel; each is a pressable card, the chosen one outlined in gold. -->
<script module>
	/** @typedef {import('../../prompts.js').ShelfCard} ShelfCard - One card: its index, label and face, from shelfCards() or shelfFace() (#118) */

	/**
	 * Properties of the CardShelf component itself.
	 * @typedef {Object} CardShelfOwnProps
	 * @property {'tapestry' | 'tech' | 'civ' | 'mat'} kind - What the cards are
	 * @property {ShelfCard[]} cards - The cards in order, each with its face resolved (#118)
	 * @property {string} [label] - Names the row for assistive technology; defaults to the kind, such as 'Tapestry cards to choose from'
	 * @property {number | number[] | null} [selected=null] - The chosen card's index, or the indexes of several chosen at once (#75)
	 * @property {number[]} [disabled=[]] - Indexes of cards that can't be pressed now, as when enough are chosen (#75)
	 * @property {number} [terrainSeed=0] - For capital mats: the table's terrain seed, so a mat looks as it will in the Capital tab (#56)
	 * @property {number} [room] - The height the shelf may take, from the decision panel (#79): civilization cards fit it. Left out, the shelf's own height
	 * @property {Function} [onCardShelfSelect] - Callback fired when a card is pressed; its value is the card's index
	 * @property {Function} [onCardShelfInspect] - Callback fired when a card is hovered or focused, and with null when that ends; its value is the card's index
	 */

	/**
	 * Properties for the CardShelf component, including any attributes for its root element.
	 * @typedef {CardShelfOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} CardShelfProps
	 *
	 * @example
	 * <CardShelf kind="tapestry" cards={cards} selected={picked} onCardShelfSelect={(event) => (picked = event.value)} />
	 */
</script>

<script>
	import CapitalMatFace from '../player/CapitalMatFace.svelte';
	import CardFan from '../player/CardFan.svelte';
	import CivilizationCard from '../player/CivilizationCard.svelte';
	import ScaledCard from '../player/ScaledCard.svelte';
	import TapestryCard from '../player/TapestryCard.svelte';
	import TechDeckBack from '../player/TechDeckBack.svelte';
	import TechnologyCard from '../player/TechnologyCard.svelte';
	import { CARD_SIZES, fitScale } from '../../cards/card-sizes.js';
	import { ComponentEvent } from '../../component-event.js';

	/**
	 * The scale the shelf draws tapestry and tech cards at. Civilization cards are drawn whole, at their own height,
	 * as the decision mockup shows them (#57, #58), and capital mats as their 9×9 grid (#56); each sizes its own
	 * button, so the gold outline fits it.
	 */
	const SCALE = { tapestry: 0.7, tech: 0.65 };

	/** How far each fanned tapestry card hides under the one before it. */
	const FAN_OVERLAP = 72;
	/** The smallest a row of civilization cards shrinks to fit the shelf's height; below it, the shelf scrolls. */
	const CIV_MIN_FIT = 0.75;
	/** The shelf's padding, top and bottom, which also holds the chosen card's outline. */
	const CIV_ROOM = 2 * 8;

	/** @type {CardShelfProps} */
	let {
		kind,
		cards,
		selected = null,
		disabled = [],
		terrainSeed = 0,
		room,
		label,
		onCardShelfSelect,
		onCardShelfInspect,
		...attr
	} = $props();

	/** The shelf's height, and each civilization card's own height, unscaled, by answer index. */
	let shelfHeight = $state(0);
	/** @type {Record<number, number>} */
	let civHeights = $state({});
	let tallest = $derived(
		Math.max(0, ...cards.map((card) => civHeights[card.index] ?? 0))
	);
	/** The height the cards may take: the room the panel gives, or the shelf's own. */
	let fitHeight = $derived(room ?? shelfHeight);
	/** Civilization cards at full size when they fit that height; otherwise the row shrinks just enough. */
	let civScale = $derived(
		kind === 'civ'
			? fitScale(fitHeight, tallest, { min: CIV_MIN_FIT, room: CIV_ROOM })
			: 1
	);

	/** The row's default name, by kind. */
	const LABELS = {
		tapestry: 'Tapestry cards to choose from',
		tech: 'Tech cards to choose from',
		civ: 'Civilizations to choose from',
		mat: 'Capital mats to choose from',
	};

	/** Tapestry cards fan out only when there are too many to sit side by side (#28 review). */
	let fanned = $derived(kind === 'tapestry' && cards.length > 4);

	/** The fan counts its cards by position; the shelf's props and events use the answers' indexes. */
	let chosen = $derived(
		cards.flatMap((card, position) =>
			(
				Array.isArray(selected)
					? selected.includes(card.index)
					: selected === card.index
			)
				? [position]
				: []
		)
	);
	let waiting = $derived(
		cards.flatMap((card, position) =>
			disabled.includes(card.index) ? [position] : []
		)
	);

	/** @param {ComponentEvent} event - The fan's, whose value is the card's position */
	const fanSelectHandler = (event) => {
		if (typeof onCardShelfSelect === 'function') {
			onCardShelfSelect(
				new ComponentEvent(
					cards[event.value.index].index,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/** @param {ComponentEvent} event - The fan's, whose item is the shelf card, or null when it ends (#96) */
	const fanInspectHandler = (event) => {
		if (typeof onCardShelfInspect === 'function') {
			onCardShelfInspect(
				new ComponentEvent(
					event.value.item?.index ?? null,
					event.target,
					event.originalEvent
				)
			);
		}
	};
</script>

<!-- The shelf scrolls and centres its row; the fan inside lays the cards out and names the group. -->
<div
	{...attr}
	class="rg-card-shelf rg-card-shelf--{kind} {attr.class ? attr.class : ''}"
	class:rg-card-shelf--fanned={fanned}
	bind:clientHeight={shelfHeight}>
	<CardFan
		class="rg-card-shelf--row"
		look="shelf"
		lift={kind === 'tapestry' || kind === 'tech'}
		items={cards}
		key={(/** @type {ShelfCard} */ card) => card.index}
		labels={cards.map((card) => card.label)}
		label={label ?? LABELS[kind]}
		overlap={fanned ? FAN_OVERLAP : 0}
		selected={chosen}
		disabled={waiting}
		onCardFanSelect={fanSelectHandler}
		onCardFanInspect={fanInspectHandler}>
		{#snippet card(/** @type {ShelfCard} */ offer)}
			{@const face = offer.face}
			{#if typeof face === 'string'}
				<ScaledCard
					scale={civScale}
					{...CARD_SIZES.civilization}
					bind:measuredHeight={civHeights[offer.index]}
					aria-hidden="true">
					<CivilizationCard
						id={face}
						state="empty" />
				</ScaledCard>
			{:else if 'plots' in face}
				<CapitalMatFace
					name={face.name}
					plots={face.plots}
					biome={face.biome}
					{terrainSeed}
					aria-hidden="true" />
			{:else if 'deck' in face}
				<ScaledCard
					scale={SCALE.tech}
					{...CARD_SIZES.tech}
					aria-hidden="true">
					<TechDeckBack count={face.count} />
				</ScaledCard>
			{:else if 'timing' in face}
				<ScaledCard
					scale={SCALE.tapestry}
					{...CARD_SIZES.tapestry}
					aria-hidden="true">
					<TapestryCard data={face} />
				</ScaledCard>
			{:else}
				<ScaledCard
					scale={SCALE.tech}
					{...CARD_SIZES.tech}
					aria-hidden="true">
					<TechnologyCard data={face} />
				</ScaledCard>
			{/if}
		{/snippet}
	</CardFan>
</div>

<style>
	/* Cards that don't fit scroll sideways rather than spill off both edges out of reach (#28 review). */
	.rg-card-shelf {
		isolation: isolate;
		display: flex;
		align-items: flex-end;
		justify-content: safe center;
		max-width: 100%;
		overflow-x: auto;
		padding: var(--space-8) var(--space-4) var(--space-4);
	}

	/* CardFan's root, reached through its class prop: the cards stand 10 px apart. */
	.rg-card-shelf :global(.rg-card-shelf--row) {
		gap: var(--space-5);
	}

	/* Many tapestry cards overlap, as the mockup fans them (CardFan's overlap); the hovered one comes forward. */
	.rg-card-shelf--fanned :global(.rg-card-shelf--row) {
		gap: 0;
	}

	/* Civilizations and capital mats sit whole and 18 px apart, as in the decision mockup; the chosen one is outlined
	   where it stands, so the outline always fits it (#58). A shelf too small for them scrolls. */
	.rg-card-shelf--civ,
	.rg-card-shelf--mat {
		padding: var(--space-4);
		scrollbar-width: thin;
	}

	.rg-card-shelf--civ :global(.rg-card-shelf--row),
	.rg-card-shelf--mat :global(.rg-card-shelf--row) {
		gap: 18px;
	}
</style>
