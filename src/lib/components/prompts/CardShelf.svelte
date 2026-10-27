<!-- CardShelf: the cards a decision offers, shown in a row above the panel; each is a pressable card, the chosen one lifted in gold. -->
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
	 * @property {number | null} [selected=null] - The chosen card's index
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
	import CivilizationCard from '../player/CivilizationCard.svelte';
	import TapestryCard from '../player/TapestryCard.svelte';
	import TechnologyCard from '../player/TechnologyCard.svelte';
	import { tapestryCardData, techCardData } from '../../cards/game-cards.js';
	import { CAPITAL_MATS } from '../../engine/data/capitals.js';
	import { ComponentEvent } from '../../component-event.js';
	import { artUrl } from '../../ui.js';

	/** Each kind's card size before scaling, and the scale the shelf draws it at. */
	const SIZES = {
		tapestry: { width: 319, height: 560, scale: 0.7 },
		tech: { width: 425, height: 286, scale: 0.65 },
		civ: { width: 425, height: 720, scale: 0.5 },
		mat: { width: 200, height: 220, scale: 1 },
	};

	/** @type {CardShelfProps} */
	let {
		kind,
		cards,
		selected = null,
		onCardShelfSelect,
		onCardShelfInspect,
		...attr
	} = $props();

	let size = $derived(SIZES[kind]);

	/**
	 * @param {string} id
	 */
	const matOf = (id) => CAPITAL_MATS[Number(id) - 1];

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
	{...attr}
	class="rg-card-shelf rg-card-shelf--{kind} {attr.class ? attr.class : ''}">
	{#each cards as card (card.index)}
		<button
			type="button"
			class="rg-card-shelf--card"
			aria-pressed={selected === card.index}
			aria-label={card.label}
			style:width="{size.width * size.scale}px"
			style:height="{size.height * size.scale}px"
			onclick={(event) => selectHandler(card.index, event)}
			onmouseenter={(event) => inspectHandler(card.index, event)}
			onmouseleave={(event) => inspectHandler(null, event)}
			onfocus={(event) => inspectHandler(card.index, event)}
			onblur={(event) => inspectHandler(null, event)}>
			<span
				class="rg-card-shelf--scaled"
				style:width="{size.width}px"
				style:height="{size.height}px"
				style:transform="scale({size.scale})"
				aria-hidden="true">
				{#if kind === 'tapestry'}
					<TapestryCard data={tapestryCardData(card.id)} />
				{:else if kind === 'tech'}
					{#if card.id === 'deck'}
						<span class="rg-card-shelf--back">
							<b>Deck · {card.deck ?? 0}</b>
						</span>
					{:else}
						<TechnologyCard data={techCardData(card.id)} />
					{/if}
				{:else if kind === 'civ'}
					<CivilizationCard
						id={card.id}
						state="empty" />
				{:else}
					<span class="rg-card-shelf--mat-face">
						<img
							src={artUrl(
								`capital-mat/${matOf(card.id).id.toLowerCase()}`
							)}
							alt=""
							width="160"
							height="160" />
						<b>{matOf(card.id).name}</b>
					</span>
				{/if}
			</span>
		</button>
	{/each}
</div>

<style>
	.rg-card-shelf {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		max-width: 100%;
		padding-top: var(--space-8);
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

	/* Tapestry cards overlap, as the mockup fans them; the hovered one comes forward. */
	.rg-card-shelf--tapestry .rg-card-shelf--card + .rg-card-shelf--card {
		margin-left: -72px;
	}

	.rg-card-shelf--tech,
	.rg-card-shelf--civ,
	.rg-card-shelf--mat {
		gap: var(--space-5);
	}

	.rg-card-shelf--card:hover,
	.rg-card-shelf--card:focus-visible {
		z-index: 10;
		outline: var(--border-thick) solid var(--gold);
		outline-offset: 2px;
	}

	.rg-card-shelf--card[aria-pressed='true'] {
		z-index: 11;
		outline: var(--border-thick) solid var(--gold);
		outline-offset: 3px;
		box-shadow: var(--shadow-float), var(--glow-gold);
		transform: translateY(-14px);
	}

	.rg-card-shelf--scaled {
		position: absolute;
		top: 0;
		left: 0;
		display: block;
		transform-origin: top left;
		text-align: left;
	}

	.rg-card-shelf--back,
	.rg-card-shelf--mat-face {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		border: var(--border-thick) solid var(--card-line);
		background: var(--card-paper);
		color: var(--card-text);
		font-family: var(--font-title);
	}

	.rg-card-shelf--back {
		background: var(--card-band-start);
		color: var(--card-title);
		font-size: var(--font-size-3xl);
	}

	.rg-card-shelf--mat-face {
		font-size: var(--font-size-xl);
	}
</style>
