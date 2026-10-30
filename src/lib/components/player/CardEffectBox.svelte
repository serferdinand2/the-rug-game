<!-- CardEffectBox: a beige trigger or scoring row: its symbol, then its title and rules (#106). -->
<script module>
	/**
	 * @typedef {Object} CardEffectBoxOwnProps
	 * @property {string} title - The trigger or condition, drawn in capitals
	 * @property {import('../../ui.js').CostSymbol} [gain] - The symbol is "+" and this resource
	 * @property {string} [label=''] - The symbol is this word or value, such as 'STOP' or '10 VP'
	 * @property {12 | 13 | 14 | 15} [symbolText] - Bold size of a word or "+" symbol in px; all but 15 are centred, 12 on a 1.1 line
	 * @property {import('svelte').Snippet} [symbol] - A pictogram symbol, when it is neither a gain nor a word
	 * @property {import('svelte').Snippet} [children] - The rules text
	 */
	/**
	 * @typedef {CardEffectBoxOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardEffectBoxProps
	 * @example
	 * <CardEffectBox
	 *   title="Final income turn"
	 *   label="10 VP"
	 *   symbolText={15}>Score 10 VP for each category predicted exactly.</CardEffectBox>
	 * <CardEffectBox
	 *   title="Place a token"
	 *   gain="any"
	 *   symbolText={13}>Gain any resource.</CardEffectBox>
	 */
</script>

<script>
	import CardResource from './CardResource.svelte';
	/** @type {CardEffectBoxProps} */
	let {
		title,
		gain,
		label = '',
		symbolText,
		symbol,
		children,
		...attr
	} = $props();
</script>

<div
	{...attr}
	class="rg-card-effect-box {symbolText
		? `rg-card-effect-box--text-${symbolText}`
		: ''} {attr.class ?? ''}"
	class:rg-card-effect-box--gain={gain !== undefined}>
	<div class="rg-card-effect-box--symbol">
		{#if gain !== undefined}+ <CardResource
				symbol={gain} />{:else if label}{label}{:else}{@render symbol?.()}{/if}
	</div>
	<div class="rg-card-effect-box--copy">
		<b class="rg-card-effect-box--title">{title}</b><span
			class="rg-card-effect-box--body">{@render children?.()}</span>
	</div>
</div>

<style>
	.rg-card-effect-box {
		display: grid;
		grid-template-columns: 64px 1fr;
		gap: 10px;
		align-items: center;
		padding: 8px;
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--control) 75%, transparent);
	}
	.rg-card-effect-box--symbol {
		--card-resource-center: 12px;
		--card-resource-height: 24px;
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		background: var(--card-filled-slot);
		border: 1px solid var(--line-strong);
	}
	.rg-card-effect-box--gain .rg-card-effect-box--symbol {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
	}
	.rg-card-effect-box--text-15 .rg-card-effect-box--symbol {
		font: var(--weight-bold) var(--font-size-base) / var(--leading-none)
			var(--font-body);
	}
	.rg-card-effect-box--text-14 .rg-card-effect-box--symbol {
		font: var(--weight-bold) var(--font-size-md) / var(--leading-none)
			var(--font-body);
		text-align: center;
	}
	.rg-card-effect-box--text-13 .rg-card-effect-box--symbol {
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-none)
			var(--font-body);
		text-align: center;
	}
	.rg-card-effect-box--text-12 .rg-card-effect-box--symbol {
		font: var(--weight-bold) var(--font-size-xs) / 1.1 var(--font-body);
		text-align: center;
	}
	.rg-card-effect-box--copy {
		display: grid;
		gap: 4px;
		color: var(--text);
		font: var(--font-size-xs) / 1.3 var(--font-body);
	}
	.rg-card-effect-box--title {
		color: var(--gold);
		text-transform: uppercase;
		font-size: var(--font-size-2xs);
	}
	.rg-card-effect-box--body :global(strong) {
		white-space: nowrap;
	}
</style>
