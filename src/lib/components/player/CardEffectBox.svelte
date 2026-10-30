<!-- CardEffectBox: a beige trigger or scoring row: its symbol (a gain, a word or a pictogram), then its title and rules (#106, #107). -->
<script module>
	/**
	 * @typedef {Object} CardEffectBoxOwnProps
	 * @property {string} title - The trigger or condition, drawn in capitals
	 * @property {import('../../ui.js').CostSymbol} [gain] - The symbol is "+" and this resource
	 * @property {string} [label=''] - The symbol is this word or value, such as 'STOP' or '10 VP'
	 * @property {12 | 13 | 14 | 15} [symbolText] - Bold size of a word or "+" symbol in px; all but 15 are centred, 12 on a 1.1 line
	 * @property {import('../../cards/civ-cards.js').CardPictogram} [pictogram] - The symbol is this pictogram, when it is
	 *   neither a gain nor a word: `district` and `lines` (the Architects), `territory` with an optional outpost `piece`
	 *   (the Traders and the Nomads), `tracks` and `resources` in a 2×2 block, a mini tapestry `card` with its `picture`,
	 *   or an `era` numeral on one (the Heralds)
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
	 * <CardEffectBox
	 *   title="Supplies"
	 *   pictogram={{ kind: 'resources' }}>Gain 1 of each resource.</CardEffectBox>
	 */
</script>

<script>
	import CardResource from './CardResource.svelte';
	import { artUrl } from '../../ui.js';
	import { RESOURCE_IDS, TRACK_IDS } from '../../engine/data/ids.js';

	/** @type {CardEffectBoxProps} */
	let {
		title,
		gain,
		label = '',
		symbolText,
		pictogram,
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
				symbol={gain} />{:else if label}{label}{:else if pictogram?.kind === 'district'}<span
				class="rg-card-effect-box--district"
				>{#each Array(9) as _, index (index)}<i></i>{/each}</span
			>{:else if pictogram?.kind === 'lines'}<span
				class="rg-card-effect-box--lines"
				>{#each Array(3) as _, index (index)}<i></i>{/each}</span
			>{:else if pictogram?.kind === 'territory'}<span
				class="rg-card-effect-box--territory"
				>{#if pictogram.piece}<img
						src={pictogram.piece}
						alt="" />{/if}</span
			>{:else if pictogram?.kind === 'tracks'}<span
				class="rg-card-effect-box--quad rg-card-effect-box--tracks"
				>{#each TRACK_IDS as track (track)}<img
						src={artUrl(`track/${track}`)}
						alt="" />{/each}</span
			>{:else if pictogram?.kind === 'resources'}<span
				class="rg-card-effect-box--quad"
				>{#each RESOURCE_IDS as resource (resource)}<CardResource
						symbol={resource} />{/each}</span
			>{:else if pictogram?.kind === 'card'}<span
				class="rg-card-effect-box--mini-card"
				><img
					src={pictogram.picture}
					alt="" /></span
			>{:else if pictogram?.kind === 'era'}<span
				class="rg-card-effect-box--mini-card rg-card-effect-box--era"
				title={pictogram.title}><b>{pictogram.numeral}</b></span
			>{/if}
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
	/* The pictograms: the Architects' district and line icons. */
	.rg-card-effect-box--district {
		display: grid;
		grid-template-columns: repeat(3, 12px);
		grid-template-rows: repeat(3, 12px);
		gap: 2px;
	}
	.rg-card-effect-box--district i {
		display: block;
		background: var(--card-path);
		border: 1px solid var(--card-strong-text);
	}
	.rg-card-effect-box--district i:nth-child(3n) {
		background: var(--card-score-line);
	}
	.rg-card-effect-box--lines {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.rg-card-effect-box--lines i {
		display: block;
		width: 38px;
		height: 8px;
		background: var(--card-path);
	}
	.rg-card-effect-box--lines i:nth-child(2) {
		background: var(--card-score-line);
	}
	/* A map territory, empty or with an outpost (the Traders and the Nomads). */
	.rg-card-effect-box--territory {
		position: relative;
		display: grid;
		place-items: center;
		width: 42px;
		height: 38px;
		background: var(--line-strong);
		clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
	}
	.rg-card-effect-box--territory::before {
		content: '';
		position: absolute;
		inset: 2px;
		background: var(--raised);
		clip-path: inherit;
	}
	.rg-card-effect-box--territory img {
		position: relative;
		z-index: 1;
		width: 29px;
		height: 29px;
	}
	/* Four track symbols or four resources in a 2×2 block (#47). */
	.rg-card-effect-box--quad {
		display: grid;
		grid-template-columns: repeat(2, 24px);
		gap: 4px;
		place-items: center;
	}
	.rg-card-effect-box--tracks img {
		width: 24px;
		height: 24px;
		image-rendering: pixelated;
	}
	/* A mini tapestry card (the Heralds). */
	.rg-card-effect-box--mini-card {
		position: relative;
		display: block;
		width: 38px;
		height: 50px;
		padding: 3px 3px 0;
		background: var(--ink);
		box-shadow: 0 0 0 1px var(--line-strong);
	}
	.rg-card-effect-box--mini-card img {
		width: 32px;
		height: 32px;
	}
	.rg-card-effect-box--mini-card::before {
		content: '';
		position: absolute;
		left: 3px;
		right: 3px;
		bottom: 4px;
		height: 5px;
		background: var(--gold);
	}
	/* Maker of Fire, printed on the income mat with no picture of its own: era I in a mini tapestry card (#47). */
	.rg-card-effect-box--era {
		display: grid;
		place-items: center;
		padding-bottom: 8px;
	}
	.rg-card-effect-box--era b {
		color: var(--gold);
		font: var(--weight-title) var(--font-size-xl) / var(--leading-none)
			var(--font-title);
	}
</style>
