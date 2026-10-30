<!-- CardFrame: the 425 px civilization card: its band, portrait and main effect, the card's patterns, and its edition and complexity; plain, only the paper (#106). -->
<script module>
	/**
	 * @typedef {Object} CardFrameOwnProps
	 * @property {string} [title] - Card title; a plain frame has none
	 * @property {string} [portrait] - Full artwork URL; a plain frame has none
	 * @property {string} [portraitAlt] - Artwork description
	 * @property {string[]} [editions] - Its editions' codes, such as ['aa'], each a chip at the foot (#109)
	 * @property {number} [complexity] - Complexity dots
	 * @property {boolean} [plain=false] - Only the paper and its palette around the children: no band, portrait or foot,
	 *   for showing a card pattern on its own
	 * @property {number} [bodyMinHeight] - Least height of the portrait row in px, so a short effect keeps the reviewed proportions
	 * @property {number} [textLeading] - Line height of the main effect, when it needs more air than 1.38
	 * @property {'empty' | 'play'} [state] - Demonstration state
	 * @property {import('svelte').Snippet} [effect] - Main effect beside the art
	 * @property {import('svelte').Snippet} [children] - Card layout
	 */
	/**
	 * @typedef {CardFrameOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardFrameProps
	 * @example
	 * <CardFrame
	 *   title="Leaders"
	 *   portrait="/art/civ/leaders.svg"
	 *   complexity={1}
	 *   bodyMinHeight={184}
	 *   textLeading={1.5}>
	 *   {#snippet effect()}At the start of income turns 2–5, cover one unused track space.{/snippet}
	 *   <CardClarity>Each track space can be used once.</CardClarity>
	 * </CardFrame>
	 * <CardFrame plain>
	 *   <CardEffectList>…</CardEffectList>
	 * </CardFrame>
	 */
</script>

<script>
	import CardBand from './CardBand.svelte';
	import CardEdition from './CardEdition.svelte';
	import '../../../styles/card-patterns.css';
	/** @type {CardFrameProps} */
	let {
		title = '',
		portrait = '',
		portraitAlt = '',
		editions = ['base'],
		complexity = 1,
		plain = false,
		bodyMinHeight,
		textLeading,
		state = 'empty',
		effect,
		children,
		...attr
	} = $props();
</script>

{#if plain}
	<article
		{...attr}
		class="rg-card-frame rg-card-frame--plain {attr.class ?? ''}">
		{@render children?.()}
	</article>
{:else}
	<article
		{...attr}
		class="rg-card-frame {attr.class ?? ''}"
		data-state={state}
		aria-label={title + ' civilization card'}>
		<CardBand
			class="rg-card-frame--band"
			{title}
			size="large" />
		<div
			class="rg-card-frame--body"
			style:min-height={bodyMinHeight === undefined
				? undefined
				: `${bodyMinHeight}px`}>
			<img
				class="rg-card-frame--portrait"
				src={portrait}
				alt={portraitAlt} />
			<div
				class="rg-card-frame--text"
				style:line-height={textLeading}>
				{@render effect?.()}
			</div>
		</div>
		{@render children?.()}
		<footer class="rg-card-frame--foot">
			<span class="rg-card-frame--editions"
				>{#each editions as code (code)}<CardEdition
						{code} />{/each}</span
			><span
				class="rg-card-frame--complexity"
				aria-label={`Complexity ${complexity} of 3`}
				>{#each [1, 2, 3] as level}<i
						class="rg-card-frame--dot"
						class:rg-card-frame--off={level > complexity}></i
					>{/each}</span>
		</footer>
	</article>
{/if}

<style>
	.rg-card-frame :global(.rg-card-frame--band) {
		min-height: 49px;
		padding: var(--space-4) var(--space-6);
	}
	.rg-card-frame--body {
		display: grid;
		grid-template-columns: 160px 1fr;
		align-items: start;
		gap: 12px;
		padding: 12px;
	}
	.rg-card-frame--portrait {
		width: 160px;
		height: 160px;
		box-shadow:
			0 0 0 1px var(--bronze),
			0 0 0 3px var(--ink);
	}
	.rg-card-frame--text {
		margin: 0 0 var(--space-4);
		font-size: var(--font-size-base);
		line-height: 1.38;
	}
	.rg-card-frame--foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 7px 12px 9px;
		border-top: 1px solid var(--line);
	}
	.rg-card-frame--editions {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.rg-card-frame--complexity {
		display: inline-flex;
		gap: 3px;
		align-items: center;
	}
	.rg-card-frame--dot {
		width: 7px;
		height: 7px;
		background: var(--gold);
		transform: rotate(45deg);
	}
	.rg-card-frame--off {
		background: transparent;
		box-shadow: inset 0 0 0 1px
			color-mix(in srgb, var(--gold) 55%, transparent);
	}
</style>
