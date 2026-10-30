<!-- CardShelf: the cards a decision offers, shown in a row above the panel; each is a pressable card, the chosen one outlined in gold. -->
<script module>
	/**
	 * One card on the shelf.
	 * @typedef {Object} ShelfCard
	 * @property {number} index - The answer's index
	 * @property {string} id - A tapestry or tech card id, a civilization id, a capital mat's number, or 'deck'
	 * @property {string} label - The card in words, for assistive technology
	 * @property {number} [deck] - For the tech deck: the cards left
	 */

	/**
	 * Properties of the CardShelf component itself.
	 * @typedef {Object} CardShelfOwnProps
	 * @property {'tapestry' | 'tech' | 'civ' | 'mat'} kind - What the cards are
	 * @property {ShelfCard[]} cards - The cards in order
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
	import CapitalGrid from '../player/CapitalGrid.svelte';
	import CardFan from '../player/CardFan.svelte';
	import CivilizationCard from '../player/CivilizationCard.svelte';
	import ScaledCard from '../player/ScaledCard.svelte';
	import TapestryCard from '../player/TapestryCard.svelte';
	import TechnologyCard from '../player/TechnologyCard.svelte';
	import { tapestryCardData, techCardData } from '../../cards/game-cards.js';
	import { CARD_SIZES } from '../../cards/card-sizes.js';
	import { matPlots } from '../../area/capital.js';
	import { CAPITAL_MATS } from '../../engine/data/capitals.js';
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
	let civFit = $derived(
		kind === 'civ' && tallest > 0 && fitHeight > 0
			? Math.min(
					1,
					Math.max(CIV_MIN_FIT, (fitHeight - CIV_ROOM) / tallest)
				)
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

	/** A mat's terrain, which is its id. */
	const biomeOf = (/** @type {{ id: string }} */ mat) =>
		/** @type {import('../../ui.js').CapitalBiome} */ (mat.id);

	/**
	 * @param {string} id
	 */
	const matOf = (id) =>
		CAPITAL_MATS.find((mat) => mat.number === Number(id)) ??
		CAPITAL_MATS[0];

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

	/** @param {ComponentEvent} event - The fan's, whose value is the card's position, or null when it ends */
	const fanInspectHandler = (event) => {
		if (typeof onCardShelfInspect === 'function') {
			onCardShelfInspect(
				new ComponentEvent(
					event.value.index === null
						? null
						: cards[event.value.index].index,
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
			{#if kind === 'tapestry'}
				<ScaledCard
					scale={SCALE.tapestry}
					{...CARD_SIZES.tapestry}
					aria-hidden="true">
					<TapestryCard data={tapestryCardData(offer.id)} />
				</ScaledCard>
			{:else if kind === 'tech'}
				<ScaledCard
					scale={SCALE.tech}
					{...CARD_SIZES.tech}
					aria-hidden="true">
					{#if offer.id === 'deck'}
						<span class="rg-card-shelf--back">
							<b>Deck · {offer.deck ?? 0}</b>
						</span>
					{:else}
						<TechnologyCard data={techCardData(offer.id)} />
					{/if}
				</ScaledCard>
			{:else if kind === 'civ'}
				<ScaledCard
					scale={civFit}
					{...CARD_SIZES.civilization}
					bind:measuredHeight={civHeights[offer.index]}
					aria-hidden="true">
					<CivilizationCard
						id={offer.id}
						state="empty" />
				</ScaledCard>
			{:else}
				{@const mat = matOf(offer.id)}
				<span
					class="rg-card-shelf--whole rg-card-shelf--mat-face"
					aria-hidden="true">
					<b class="rg-card-shelf--mat-name">{mat.name}</b>
					<CapitalGrid
						plots={matPlots(mat.number)}
						biome={biomeOf(mat)}
						{terrainSeed}
						label="{mat.name} capital, 9 by 9 plots" />
				</span>
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

	.rg-card-shelf--whole {
		display: block;
		text-align: left;
	}

	.rg-card-shelf--back {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		border: var(--border-thick) solid var(--card-line);
		background: var(--card-band-start);
		color: var(--card-title);
		font: var(--weight-title) var(--font-size-3xl) / var(--leading-tight)
			var(--font-title);
	}

	/* A capital mat: its name on a card band over its 9×9 grid of plots, large enough to read the districts and the
	   impassable plots (#56). */
	.rg-card-shelf--mat-face {
		width: 392px;
		box-sizing: border-box;
		padding: 0 var(--space-3) var(--space-3);
		border: var(--border-thick) solid var(--card-line);
		background: var(--ink);
	}

	.rg-card-shelf--mat-name {
		display: block;
		margin: 0 calc(-1 * var(--space-3)) var(--space-3);
		padding: var(--space-4) var(--space-6);
		background: linear-gradient(
			90deg,
			var(--card-band-start),
			var(--card-band-middle) 65%,
			var(--card-band-end)
		);
		color: var(--card-title);
		font: var(--weight-title) var(--font-size-xl) / var(--leading-tight)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
	}
</style>
