<!-- The Tech tab's player rows and face-up display cards. -->
<script module>
	/**
	 * Properties of the TechTab screen part itself.
	 * @typedef {Object} TechTabOwnProps
	 * @property {string} title - The translated heading
	 * @property {any} tech - The player's technology rows
	 * @property {number} deck - The number of cards still in the deck
	 * @property {string[]} faceUp - The cards in the display
	 * @property {Function} [onTechTabInspect] - Callback fired with the inspected card id, or null on leave
	 */

	/**
	 * Properties for TechTab, including any attributes for its root element.
	 * @typedef {TechTabOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TechTabProps
	 *
	 * @example
	 * <TechTab {title} {tech} {deck} {faceUp} onTechTabInspect={inspect} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../lib/component-event.js';
	import { CARD_SIZES } from '../../lib/cards/card-sizes.js';
	import { techCardData } from '../../lib/cards/game-cards.js';
	import CardFan from '../../lib/components/player/CardFan.svelte';
	import ScaledCard from '../../lib/components/player/ScaledCard.svelte';
	import TechnologyCard from '../../lib/components/player/TechnologyCard.svelte';
	import TechRows from '../../lib/components/player/TechRows.svelte';

	/** @type {TechTabProps} */
	let { title, tech, deck, faceUp, onTechTabInspect, ...attr } = $props();

	/**
	 * @param {ComponentEvent} event
	 */
	const rowsInspectHandler = (event) => {
		inspect(event.value, event);
	};

	/**
	 * CardFan reports both its index and the item id.
	 * @param {ComponentEvent} event
	 */
	const displayInspectHandler = (event) => {
		inspect(event.value.item, event);
	};

	/**
	 * @param {string | null} id
	 * @param {ComponentEvent} event
	 */
	function inspect(id, event) {
		if (typeof onTechTabInspect === 'function') {
			onTechTabInspect(
				new ComponentEvent(id, event.target, event.originalEvent)
			);
		}
	}
</script>

<div
	{...attr}
	class="rg-tech-tab {attr.class ? attr.class : ''}">
	<h2 class="rg-player-tabs--title">{title}</h2>
	<TechRows
		{tech}
		onTechRowsInspect={rowsInspectHandler} />
	<section class="rg-player-tabs--row">
		<h3 class="rg-player-tabs--row-title">
			The display · {deck} in the deck
		</h3>
		<CardFan
			items={faceUp}
			overlap={120}
			label="Face-up tech cards"
			onCardFanInspect={displayInspectHandler}>
			{#snippet card(/** @type {string} */ id)}
				<ScaledCard
					scale={0.42}
					{...CARD_SIZES.tech}>
					<TechnologyCard data={techCardData(id)} />
				</ScaledCard>
			{/snippet}
		</CardFan>
	</section>
</div>

<style>
	.rg-tech-tab {
		display: contents;
	}

	.rg-player-tabs--row {
		margin-bottom: var(--space-8);
	}

	.rg-player-tabs--row-title {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin: 0 0 var(--space-4);
		color: var(--text);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-tight)
			var(--font-body);
	}
</style>
