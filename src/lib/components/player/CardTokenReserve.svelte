<!-- CardTokenReserve: a card's starting tokens on compact squares, those already sent away left empty (#106). -->
<script module>
	/**
	 * @typedef {Object} CardTokenReserveOwnProps
	 * @property {number} [count=4] - Number of initial token squares
	 * @property {number} [used=0] - Tokens already sent away, emptied from the left
	 * @property {'blue' | 'red' | 'green' | 'yellow' | 'purple'} [color='blue'] - Player colour
	 */
	/**
	 * @typedef {CardTokenReserveOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardTokenReserveProps
	 * @example
	 * <CardTokenReserve />
	 * <CardTokenReserve
	 *   count={4}
	 *   used={2}
	 *   color="red" />
	 */
</script>

<script>
	import CardSlot from './CardSlot.svelte';
	import PlayerToken from './PlayerToken.svelte';
	/** @type {CardTokenReserveProps} */
	let { count = 4, used = 0, color = 'blue', ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-card-token-reserve {attr.class ?? ''}"
	aria-label={`${Math.max(0, count - used)} of ${count} player tokens remain`}>
	{#each Array(count) as _, i}<CardSlot
			label={`Token ${i + 1}`}
			size={62}
			>{#if i >= used}<PlayerToken
					{color}
					size={26}
					decorative />{/if}</CardSlot
		>{/each}
</div>

<style>
	.rg-card-token-reserve {
		display: flex;
		justify-content: space-between;
		margin: 2px 12px 12px;
	}
</style>
