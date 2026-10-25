<!-- CardTokenReserve: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardTokenReserveOwnProps
	 * @property {number} [count] - Number of initial token squares
	 * @property {number} [used] - Tokens already sent away
	 * @property {'blue' | 'red' | 'green' | 'yellow' | 'purple'} [color] - Player colour
	 */
	/**
	 * @typedef {CardTokenReserveOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardTokenReserveProps
	 * @example
	 * <CardTokenReserve />
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
