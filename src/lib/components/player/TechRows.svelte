<!-- TechRows: a player's three tech rows, top first (#94): fanned with their shapes in Your area's Tech tab, or wrapped smaller in the players overview. -->
<script module>
	/**
	 * Properties of the TechRows component itself.
	 * @typedef {Object} TechRowsOwnProps
	 * @property {{ top: string[], middle: string[], bottom: string[] }} tech - The seat's tech card ids by row
	 * @property {'fan' | 'wrap'} [layout='fan'] - 'fan': each row a CardFan of cards at 0.42 under its shape, and a box saying it is empty; 'wrap': each row's cards at 0.4, wrapping, under a plain heading
	 * @property {Function} [onTechRowsInspect] - Callback fired with a card's id when it is hovered or focused in the fan, and with null on leave
	 */

	/**
	 * Properties for the TechRows component, including any attributes for its root element. Its root is
	 * `display: contents`, so the rows lay out in the place they are drawn: the Tech tab flows them, and the
	 * overview's detail grids each heading and its cards.
	 * @typedef {TechRowsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TechRowsProps
	 *
	 * @example
	 * <TechRows
	 *   tech={seat.tech}
	 *   onTechRowsInspect={(event) => (shown = event.value)}
	 * />
	 */
</script>

<script>
	import CardFan from './CardFan.svelte';
	import ScaledCard from './ScaledCard.svelte';
	import TechnologyCard from './TechnologyCard.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { TECH_ROWS } from '../../area/tech-rows.js';
	import { techCardData } from '../../cards/game-cards.js';
	import { CARD_SIZES } from '../../cards/card-sizes.js';

	/** @type {TechRowsProps} */
	let { tech, layout = 'fan', onTechRowsInspect, ...attr } = $props();

	/**
	 * Reports the card hovered or focused in a row's fan, by its id, or null on leave.
	 * @param {ComponentEvent} event - From CardFan: { index, item }, the item being the card's id (#96)
	 */
	const fanInspectHandler = (event) => {
		if (typeof onTechRowsInspect === 'function') {
			onTechRowsInspect(
				new ComponentEvent(
					event.value.item,
					event.target,
					event.originalEvent
				)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-tech-rows {attr.class ? attr.class : ''}"
	class:rg-tech-rows--fan={layout === 'fan'}
	class:rg-tech-rows--wrap={layout === 'wrap'}>
	{#each TECH_ROWS as row (row.id)}
		<section class="rg-tech-rows--row">
			{#if layout === 'fan'}
				<h3 class="rg-tech-rows--title">
					<i
						class="rg-tech-rows--shape rg-tech-rows--shape-{row.shape}"
						aria-hidden="true"></i
					>{row.label}
				</h3>
				{#if tech[row.id].length}
					<CardFan
						items={tech[row.id]}
						overlap={120}
						label="{row.label} tech cards"
						onCardFanInspect={fanInspectHandler}>
						{#snippet card(/** @type {string} */ id)}
							<ScaledCard
								scale={0.42}
								{...CARD_SIZES.tech}>
								<TechnologyCard data={techCardData(id)} />
							</ScaledCard>
						{/snippet}
					</CardFan>
				{:else}
					<div class="rg-tech-rows--empty">No cards yet</div>
				{/if}
			{:else}
				<h3 class="rg-tech-rows--title">{row.label}</h3>
				<div class="rg-tech-rows--cards">
					{#each tech[row.id] as id (id)}
						<ScaledCard
							scale={0.4}
							{...CARD_SIZES.tech}>
							<TechnologyCard data={techCardData(id)} />
						</ScaledCard>
					{:else}
						<p class="rg-tech-rows--empty">No cards</p>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</div>

<style>
	/* The rows are items of whatever lays them out: the Tech tab flows them, the overview's detail grids them. */
	.rg-tech-rows {
		display: contents;
	}

	.rg-tech-rows--fan .rg-tech-rows--row {
		margin-bottom: var(--space-8);
	}

	/* In the overview each heading and its cards are the detail grid's own items. */
	.rg-tech-rows--wrap .rg-tech-rows--row {
		display: contents;
	}

	.rg-tech-rows--fan .rg-tech-rows--title {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin: 0 0 var(--space-4);
		color: var(--text);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-tight)
			var(--font-body);
	}

	.rg-tech-rows--wrap .rg-tech-rows--title {
		justify-self: start;
		margin: var(--space-4) 0 0;
		font-size: var(--font-size-sm);
	}

	.rg-tech-rows--shape {
		width: 14px;
		height: 14px;
		border: 3px solid var(--text);
	}

	.rg-tech-rows--shape-circle {
		border-radius: 50%;
	}

	.rg-tech-rows--shape-none {
		display: none;
	}

	.rg-tech-rows--cards {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-self: start;
	}

	.rg-tech-rows--fan .rg-tech-rows--empty {
		display: grid;
		place-items: center;
		height: 60px;
		border: var(--border) solid var(--line);
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-tech-rows--wrap .rg-tech-rows--empty {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}
</style>
