<!-- CardTerrainRewards: a card's rows of terrain marker, terrain name and reward; a used terrain fades and its name is struck through (#106). -->
<script module>
	/**
	 * One terrain's reward.
	 * @typedef {Object} CardTerrainReward
	 * @property {'sea' | 'desert' | 'forest' | 'grassland' | 'mountain'} terrain - Its terrain hex marker
	 * @property {string} name - The terrain's name
	 * @property {import('../../ui.js').CostSymbol} gain - The resource gained first
	 * @property {string} effect - What follows the resource
	 * @property {boolean} [used=false] - Already used
	 */
	/**
	 * @typedef {Object} CardTerrainRewardsOwnProps
	 * @property {readonly CardTerrainReward[]} rows - The terrains, in the card's order
	 */
	/**
	 * @typedef {CardTerrainRewardsOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardTerrainRewardsProps
	 * @example
	 * <CardTerrainRewards
	 *   rows={[
	 *     { terrain: 'desert', name: 'Desert', gain: 'coin', effect: 'roll the black conquer die twice and take one result.', used: true },
	 *     { terrain: 'forest', name: 'Forest', gain: 'food', effect: 'roll the red conquer die twice and gain both results.' },
	 *   ]} />
	 */
</script>

<script>
	import CardResource from './CardResource.svelte';
	/** @type {CardTerrainRewardsProps} */
	let { rows, ...attr } = $props();
</script>

<ul
	{...attr}
	class="rg-card-terrain-rewards {attr.class ?? ''}">
	{#each rows as row (row.terrain)}
		<li
			class="rg-card-terrain-rewards--row"
			class:rg-card-terrain-rewards--used={row.used}>
			<img
				src="/art/terrain/{row.terrain}.svg"
				alt="" /><span class="rg-card-terrain-rewards--name"
				>{row.name}</span
			><span class="rg-card-terrain-rewards--effect"
				>+ <CardResource symbol={row.gain} />; {row.effect}</span>
		</li>
	{/each}
</ul>

<style>
	.rg-card-terrain-rewards {
		display: grid;
		gap: 5px;
		margin: 0;
		padding: 0 12px;
		list-style: none;
	}
	.rg-card-terrain-rewards--row {
		display: grid;
		grid-template-columns: 38px 74px 1fr;
		gap: 8px;
		align-items: center;
		min-height: 62px;
		padding: 7px;
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--control) 75%, transparent);
	}
	.rg-card-terrain-rewards--used {
		opacity: 0.55;
	}
	.rg-card-terrain-rewards--row > img {
		width: 32px;
		height: 32px;
		image-rendering: pixelated;
	}
	.rg-card-terrain-rewards--name {
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-xs) / 1.2 var(--font-body);
	}
	.rg-card-terrain-rewards--used .rg-card-terrain-rewards--name {
		text-decoration: line-through;
	}
	.rg-card-terrain-rewards--effect {
		--card-resource-center: -4px;
		font: var(--font-size-xs) / 1.3 var(--font-body);
	}
</style>
