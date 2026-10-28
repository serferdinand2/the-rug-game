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
	import CivilizationCard from '../player/CivilizationCard.svelte';
	import TapestryCard from '../player/TapestryCard.svelte';
	import TechnologyCard from '../player/TechnologyCard.svelte';
	import { tapestryCardData, techCardData } from '../../cards/game-cards.js';
	import { matPlots } from '../../area/capital.js';
	import { CAPITAL_MATS } from '../../engine/data/capitals.js';
	import { ComponentEvent } from '../../component-event.js';

	/**
	 * The tapestry and tech cards' size before scaling, and the scale the shelf draws them at. Civilization cards are
	 * drawn whole, 425 px wide at their own height, as the decision mockup shows them (#57, #58), and capital mats
	 * as their 9×9 grid (#56); each sizes its own button, so the gold outline fits it.
	 */
	const SCALED = {
		tapestry: { width: 319, height: 560, scale: 0.7 },
		tech: { width: 425, height: 286, scale: 0.65 },
	};

	/** A civilization card's width; its height is its own. */
	const CIV_WIDTH = 425;
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
		label,
		onCardShelfSelect,
		onCardShelfInspect,
		...attr
	} = $props();

	let size = $derived(
		kind === 'tapestry' || kind === 'tech' ? SCALED[kind] : null
	);

	/** The shelf's height, and each civilization card's own height, unscaled, by answer index. */
	let shelfHeight = $state(0);
	/** @type {Record<number, number>} */
	let civHeights = $state({});
	let tallest = $derived(
		Math.max(0, ...cards.map((card) => civHeights[card.index] ?? 0))
	);
	/** Civilization cards at full size when they fit the shelf's height; otherwise the row shrinks just enough. */
	let civFit = $derived(
		kind === 'civ' && tallest > 0 && shelfHeight > 0
			? Math.min(
					1,
					Math.max(CIV_MIN_FIT, (shelfHeight - CIV_ROOM) / tallest)
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

	/** A mat's terrain, which is its id. */
	const biomeOf = (/** @type {{ id: string }} */ mat) =>
		/** @type {import('../../ui.js').CapitalBiome} */ (mat.id);

	/**
	 * @param {string} id
	 */
	const matOf = (id) =>
		CAPITAL_MATS.find((mat) => mat.number === Number(id)) ??
		CAPITAL_MATS[0];

	/**
	 * @param {number} index
	 * @param {MouseEvent} event
	 */
	const selectHandler = (index, event) => {
		if (typeof onCardShelfSelect === 'function') {
			onCardShelfSelect(
				new ComponentEvent(
					index,
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
		}
	};

	/**
	 * @param {number | null} index
	 * @param {Event} event
	 */
	const inspectHandler = (index, event) => {
		if (typeof onCardShelfInspect === 'function') {
			onCardShelfInspect(
				new ComponentEvent(
					index,
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
		}
	};
</script>

<div
	role="group"
	aria-label={label ?? LABELS[kind]}
	{...attr}
	class="rg-card-shelf rg-card-shelf--{kind} {attr.class ? attr.class : ''}"
	class:rg-card-shelf--fanned={fanned}
	bind:clientHeight={shelfHeight}>
	{#each cards as card (card.index)}
		<button
			type="button"
			class="rg-card-shelf--card"
			aria-pressed={Array.isArray(selected)
				? selected.includes(card.index)
				: selected === card.index}
			disabled={disabled.includes(card.index)}
			aria-label={card.label}
			style:width={size ? `${size.width * size.scale}px` : undefined}
			style:height={size ? `${size.height * size.scale}px` : undefined}
			onclick={(event) => selectHandler(card.index, event)}
			onmouseenter={(event) => inspectHandler(card.index, event)}
			onmouseleave={(event) => inspectHandler(null, event)}
			onfocus={(event) => inspectHandler(card.index, event)}
			onblur={(event) => inspectHandler(null, event)}>
			{#if size}
				<span
					class="rg-card-shelf--scaled"
					style:width="{size.width}px"
					style:height="{size.height}px"
					style:transform="scale({size.scale})"
					aria-hidden="true">
					{#if kind === 'tapestry'}
						<TapestryCard data={tapestryCardData(card.id)} />
					{:else if card.id === 'deck'}
						<span class="rg-card-shelf--back">
							<b>Deck · {card.deck ?? 0}</b>
						</span>
					{:else}
						<TechnologyCard data={techCardData(card.id)} />
					{/if}
				</span>
			{:else if kind === 'civ'}
				<span
					class="rg-card-shelf--whole rg-card-shelf--fit"
					style:width="{CIV_WIDTH * civFit}px"
					style:height={civHeights[card.index]
						? `${civHeights[card.index] * civFit}px`
						: undefined}
					aria-hidden="true">
					<span
						class="rg-card-shelf--scaled"
						style:transform="scale({civFit})"
						bind:offsetHeight={civHeights[card.index]}>
						<CivilizationCard
							id={card.id}
							state="empty" />
					</span>
				</span>
			{:else}
				{@const mat = matOf(card.id)}
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
		</button>
	{/each}
</div>

<style>
	/* Cards that don't fit scroll sideways rather than spill off both edges out of reach (#28 review). */
	.rg-card-shelf {
		isolation: isolate;
		display: flex;
		align-items: flex-end;
		justify-content: safe center;
		gap: var(--space-5);
		max-width: 100%;
		overflow-x: auto;
		padding: var(--space-8) var(--space-4) var(--space-4);
	}

	.rg-card-shelf--card {
		position: relative;
		flex: none;
		padding: 0;
		border: 0;
		background: transparent;
		box-shadow: var(--shadow-float);
		cursor: pointer;
		transition: transform var(--duration-fast) var(--ease);
	}

	/* Many tapestry cards overlap, as the mockup fans them; the hovered one comes forward. */
	.rg-card-shelf--fanned {
		gap: 0;
	}

	.rg-card-shelf--fanned .rg-card-shelf--card + .rg-card-shelf--card {
		margin-left: -72px;
	}

	.rg-card-shelf--card:hover,
	.rg-card-shelf--card:focus-visible {
		z-index: 1;
		outline: var(--border-thick) solid var(--gold);
		outline-offset: 2px;
	}

	.rg-card-shelf--card:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.rg-card-shelf--card[aria-pressed='true'] {
		z-index: 2;
		outline: var(--border-thick) solid var(--gold);
		outline-offset: 3px;
		box-shadow: var(--shadow-float), var(--glow-gold);
		transform: translateY(-14px);
	}

	/* Civilizations and capital mats sit whole and 18 px apart, as in the decision mockup; the chosen one is outlined
	   where it stands, so the outline always fits it (#58). A shelf too small for them scrolls. */
	.rg-card-shelf--civ,
	.rg-card-shelf--mat {
		gap: 18px;
		padding: var(--space-4);
		scrollbar-width: thin;
	}

	.rg-card-shelf--civ .rg-card-shelf--card[aria-pressed='true'],
	.rg-card-shelf--mat .rg-card-shelf--card[aria-pressed='true'] {
		transform: none;
	}

	.rg-card-shelf--whole {
		display: block;
		text-align: left;
	}

	/* A civilization card keeps its layout at 425 px and is scaled as a whole; this box takes the scaled size. */
	.rg-card-shelf--fit {
		position: relative;
	}

	.rg-card-shelf--scaled {
		position: absolute;
		top: 0;
		left: 0;
		display: block;
		transform-origin: top left;
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
