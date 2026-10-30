<!-- CardTechnologyTransfer: a schematic of a technology card moving from one owner's row into another's, the token marking it when active (#106). -->
<script module>
	/**
	 * @typedef {Object} CardTechnologyTransferOwnProps
	 * @property {boolean} [active=false] - Mark the moving card with a token in both rows
	 * @property {string} [from="Opponent's tech"] - The card's owner before
	 * @property {string} [to='Your tech'] - Its owner after
	 */
	/**
	 * @typedef {CardTechnologyTransferOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardTechnologyTransferProps
	 * @example
	 * <CardTechnologyTransfer />
	 * <CardTechnologyTransfer
	 *   active
	 *   from="Opponent's tech"
	 *   to="Your tech" />
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
	class="rg-card-technology-transfer {attr.class ?? ''}"
	aria-label="Example: a technology card moves from an opponent's top row into your bottom row">
	{#each [from, to] as owner, i}{#if i}<span
				class="rg-card-technology-transfer--arrow"
				aria-hidden="true">→</span
			>{/if}
		<div class="rg-card-technology-transfer--card">
			<span class="rg-card-technology-transfer--owner">{owner}</span
			>{#each ['Top', 'Middle', 'Bottom'] as row, j}<span
					class="rg-card-technology-transfer--row"
					class:rg-card-technology-transfer--target={active &&
						j === (i ? 2 : 0)}
					>{row}{#if active && j === (i ? 2 : 0)}<PlayerToken
							size={22}
							decorative
							class="rg-card-technology-transfer--token" />{/if}</span
				>{/each}
		</div>{/each}
</div>

<style>
	.rg-card-technology-transfer {
		display: grid;
		grid-template-columns: 1fr 22px 1fr;
		align-items: center;
		gap: 7px;
		margin: 0 12px 12px;
	}
	.rg-card-technology-transfer--card {
		display: grid;
		gap: 5px;
		padding: 7px;
		border: 1px solid var(--line-strong);
		background: var(--raised);
	}
	.rg-card-technology-transfer--owner {
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-2xs) / 1.2 var(--font-body);
		text-align: center;
		text-transform: uppercase;
	}
	.rg-card-technology-transfer--row {
		position: relative;
		display: grid;
		place-items: center;
		height: 32px;
		border: 1px solid var(--line-soft);
		color: var(--text);
		font: var(--font-size-xs) / var(--leading-none) var(--font-body);
	}
	.rg-card-technology-transfer--row.rg-card-technology-transfer--target {
		border: 2px solid var(--player-1);
	}
	.rg-card-technology-transfer--row
		:global(.rg-card-technology-transfer--token) {
		display: block;
		position: absolute;
		right: 5px;
		width: 22px;
		height: 22px;
	}
	.rg-card-technology-transfer--arrow {
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-2xl) / var(--leading-none)
			var(--font-body);
		text-align: center;
	}
</style>
