<!-- CardPredictionTracks: categories of numbered 39 px targets, one predicted number each, as on the Mystics' mat (#106). -->
<script module>
	/**
	 * One category of numbers.
	 * @typedef {Object} CardPrediction
	 * @property {string} id - Its id, the first part of each number's spot id, such as 'districts' for 'districts:4'
	 * @property {string} label - Its name
	 * @property {string} [note] - Fainter words after the name, such as 'you have'
	 * @property {number} most - Its numbers run from 1 to this; nine spread across the card, fewer keep 39 px from the left
	 * @property {number} [selected] - The number predicted, drawn in the player's colour
	 */
	/**
	 * @typedef {Object} CardPredictionTracksOwnProps
	 * @property {readonly CardPrediction[]} categories - The categories, in the card's order
	 * @property {readonly string[]} [choices=[]] - The spot ids ('category:number') the open decision offers, drawn as buttons
	 * @property {string | null} [picked=null] - The offered spot the player has picked, in gold
	 * @property {Function} [onCardPredictionTracksPick] - Callback fired with the spot id when an offered number is pressed
	 */
	/**
	 * @typedef {CardPredictionTracksOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardPredictionTracksProps
	 * @example
	 * <CardPredictionTracks
	 *   categories={[
	 *     { id: 'techCards', label: 'Tech cards', note: 'you have', most: 9, selected: 4 },
	 *     { id: 'tracks', label: 'Completed advancement tracks', most: 4 },
	 *   ]}
	 *   choices={['tracks:1', 'tracks:2']}
	 *   picked="tracks:2"
	 *   onCardPredictionTracksPick={(event) => pick(event.value)} />
	 */
</script>

<script>
	import CardSlot from './CardSlot.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { spotChoice } from '../../card-spots.js';
	/** @type {CardPredictionTracksProps} */
	let {
		categories,
		choices = [],
		picked = null,
		onCardPredictionTracksPick,
		...attr
	} = $props();

	/**
	 * A number's pick, reported as the tracks' own.
	 * @param {ComponentEvent} event - Its value is the spot id
	 */
	const numberPickHandler = (event) => {
		if (typeof onCardPredictionTracksPick === 'function') {
			onCardPredictionTracksPick(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-card-prediction-tracks {attr.class ?? ''}">
	{#each categories as category (category.id)}
		<div class="rg-card-prediction-tracks--category">
			<div class="rg-card-prediction-tracks--label">
				{category.label}{#if category.note}
					<small>{category.note}</small>{/if}
			</div>
			<div
				class="rg-card-prediction-tracks--numbers"
				style:grid-template-columns={category.most < 9
					? `repeat(${category.most}, 39px)`
					: undefined}>
				{#each Array.from({ length: category.most }, (_, index) => index + 1) as value (value)}
					<CardSlot
						size={39}
						filled={category.selected === value}
						{...spotChoice(
							`${category.id}:${value}`,
							choices,
							picked,
							numberPickHandler
						)}
						class="rg-card-prediction-tracks--number {category.selected ===
						value
							? 'rg-card-prediction-tracks--selected'
							: ''}">{value}</CardSlot>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.rg-card-prediction-tracks {
		display: grid;
		gap: 9px;
		margin: 4px 12px 0;
		padding: 9px 0;
		border-top: 1px solid var(--line-soft);
		border-bottom: 1px solid var(--line-soft);
	}
	.rg-card-prediction-tracks--category {
		display: grid;
		gap: 5px;
	}
	.rg-card-prediction-tracks--category
		+ .rg-card-prediction-tracks--category {
		padding-top: 9px;
		border-top: 1px solid var(--line-soft);
	}
	.rg-card-prediction-tracks--label {
		display: flex;
		justify-content: space-between;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xs) / 1.2 var(--font-body);
	}
	.rg-card-prediction-tracks--label small {
		color: var(--muted);
		font-weight: var(--weight-regular);
	}
	.rg-card-prediction-tracks--numbers {
		display: grid;
		grid-template-columns: repeat(9, minmax(0, 1fr));
		gap: 4px;
	}
	/* CardSlot draws the square; the number sets its type. */
	.rg-card-prediction-tracks--numbers
		:global(.rg-card-prediction-tracks--number) {
		place-items: center;
		color: var(--card-text);
		font: var(--weight-bold) var(--font-size-md) / var(--leading-none)
			var(--font-body);
	}
	.rg-card-prediction-tracks--numbers
		:global(.rg-card-prediction-tracks--selected) {
		background: var(--card-filled-slot);
		box-shadow: var(--glow-current);
	}
	.rg-card-prediction-tracks--numbers
		:global(.rg-card-prediction-tracks--selected)::after {
		content: '';
		position: absolute;
		inset: 8px;
		border-radius: 50%;
		background: var(--player-1);
		opacity: 0.48;
	}
</style>
