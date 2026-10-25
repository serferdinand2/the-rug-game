<!-- CardTechnologyTransfer: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardTechnologyTransferOwnProps
	 * @property {boolean} [active] - Highlight the illustrated transfer
	 * @property {string} [from] - Previous owner label
	 * @property {string} [to] - New owner label
	 */
	/**
	 * @typedef {CardTechnologyTransferOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardTechnologyTransferProps
	 * @example
	 * <CardTechnologyTransfer />
	 */
</script>

<script>
	import PlayerToken from './PlayerToken.svelte';
	/** @type {CardTechnologyTransferProps} */
	let {
		active = false,
		from = "Opponent's tech",
		to = 'Your tech',
		...attr
	} = $props();
</script>

<div
	{...attr}
	class="rg-card-inventor-tech {attr.class ?? ''}"
	aria-label="Example: a technology card moves from an opponent's top row into your bottom row">
	{#each [from, to] as owner, i}{#if i}<span
				class="rg-card-inventor-tech--arrow"
				aria-hidden="true">→</span
			>{/if}
		<div class="rg-card-inventor-tech--card">
			<span class="rg-card-inventor-tech--owner">{owner}</span
			>{#each ['Top', 'Middle', 'Bottom'] as row, j}<span
					class="rg-card-inventor-tech--row"
					class:rg-card-is-target={active && j === (i ? 2 : 0)}
					>{row}{#if active && j === (i ? 2 : 0)}<PlayerToken
							size={22}
							decorative />{/if}</span
				>{/each}
		</div>{/each}
</div>
