<!-- SymbolKey: every symbol the track spaces draw and what it means (#174), each drawn by SpaceGlyphs as the board draws it; How to play's Symbols tab. -->
<script module>
	/**
	 * Properties of the SymbolKey component itself.
	 * @typedef {Object} SymbolKeyOwnProps
	 * @property {readonly { heading: string, rows: readonly import('../../glyphs.js').SymbolKeyRow[] }[]} [groups=SYMBOL_KEY] - The groups of rows, from src/lib/glyphs.js
	 */

	/**
	 * Properties for the SymbolKey component, including any attributes for its root element.
	 * @typedef {SymbolKeyOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} SymbolKeyProps
	 *
	 * @example
	 * <SymbolKey />
	 */
</script>

<script>
	import SpaceGlyphs from './SpaceGlyphs.svelte';
	import { SYMBOL_KEY } from '../../glyphs.js';
	import { artUrl } from '../../ui.js';

	/** @type {SymbolKeyProps} */
	let { groups = SYMBOL_KEY, ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-symbol-key {attr.class ? attr.class : ''}">
	<p class="rg-symbol-key--intro">
		Each track space shows its benefit as symbols, and its bonus in the dark
		box below, as the printed board does. Hover a space to read it in words.
	</p>
	{#each groups as group (group.heading)}
		<h3 class="rg-symbol-key--heading">{group.heading}</h3>
		<dl class="rg-symbol-key--rows">
			{#each group.rows as row (row.words)}
				<div class="rg-symbol-key--row">
					<dt
						class="rg-symbol-key--symbol"
						class:rg-symbol-key--bonus={Boolean(row.bonus)}>
						{#if row.glyphs}
							<SpaceGlyphs glyphs={row.glyphs} />
						{:else if row.bonus}
							<SpaceGlyphs
								glyphs={row.bonus.pay}
								variant="bonus" />
							<strong class="rg-symbol-key--then">:</strong>
							<SpaceGlyphs
								glyphs={row.bonus.gain}
								variant="bonus" />
						{:else if row.landmark}
							<span class="rg-symbol-key--landmark"
								><img
									src={artUrl(
										`landmark/${row.landmark.toLowerCase().replaceAll(' ', '-')}`
									)}
									alt=""
									draggable="false" />{row.landmark}</span>
						{/if}
					</dt>
					<dd class="rg-symbol-key--words">{row.words}</dd>
				</div>
			{/each}
		</dl>
	{/each}
</div>

<style>
	.rg-symbol-key {
		display: grid;
		gap: var(--space-4);
	}

	.rg-symbol-key--intro {
		margin: 0;
		color: var(--text);
		line-height: var(--leading-normal);
	}

	.rg-symbol-key--heading {
		margin: var(--space-5) 0 0;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-md) var(--font-body);
	}

	.rg-symbol-key--rows {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-4) var(--space-9);
		margin: 0;
	}

	.rg-symbol-key--row {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		min-height: 40px;
	}

	/* A piece of a track space: its symbols on the exploration track's tint. */
	.rg-symbol-key--symbol {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		min-width: 76px;
		min-height: 38px;
		padding: var(--space-2) var(--space-3);
		border: var(--border) solid var(--line);
		background: color-mix(in srgb, var(--exploration) 24%, var(--control));
		color: var(--text);
	}

	.rg-symbol-key--bonus {
		background: color-mix(in srgb, var(--ink) 60%, var(--control));
	}

	.rg-symbol-key--then {
		margin-inline: 3px;
		color: var(--gold);
	}

	.rg-symbol-key--landmark {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--gold);
		font: var(--weight-title) var(--font-size-2xs) / 1 var(--font-title);
	}

	.rg-symbol-key--landmark img {
		width: 14px;
		height: 14px;
		object-fit: contain;
		image-rendering: pixelated;
	}

	.rg-symbol-key--words {
		margin: 0;
		color: var(--text);
		font-size: var(--font-size-sm);
		line-height: var(--leading-snug);
	}
</style>
