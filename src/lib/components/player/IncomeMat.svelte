<!-- The income mat: four building rows of six spaces; exposed rewards use the track glyphs (#151). -->
<script module>
	/**
	 * Properties of the IncomeMat component itself.
	 * @typedef {Object} IncomeMatOwnProps
	 * @property {import('../../area/income.js').IncomeRowView[]} rows - The four building rows
	 * @property {number} era - 1 to 4, shown as I–IV in the heading
	 */

	/**
	 * Properties for the IncomeMat component, including any attributes for its root element.
	 * @typedef {IncomeMatOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} IncomeMatProps
	 *
	 * @example
	 * <IncomeMat rows={incomeRows(seat)} era={2} />
	 */
</script>

<script>
	import { roman } from '../../game-names.js';
	import { artUrl } from '../../ui.js';
	import SpaceGlyphs from '../board/SpaceGlyphs.svelte';

	/** @type {IncomeMatProps} */
	let { rows, era, ...attr } = $props();
</script>

<section
	aria-label="Income mat"
	{...attr}
	class="rg-income-mat {attr.class ? attr.class : ''}">
	<h2>
		Income mat · <span class="rg-income-mat--era">Era {roman(era)}</span>
	</h2>
	<p>
		Each building removed from the mat exposes the next printed space. Open
		spaces score before they pay income.
	</p>
	<div class="rg-income-mat--rows">
		{#each rows as row (row.building)}
			<div class="rg-income-mat--row rg-income-mat--row-{row.building}">
				<div class="rg-income-mat--head">
					<strong>{row.name}</strong>
					<span>{row.left} left</span>
				</div>
				<ul class="rg-income-mat--spaces">
					{#each row.spaces as space (space.name)}
						<li
							class="rg-income-mat--space {space.covered
								? 'rg-income-mat--space-covered'
								: ''}"
							{...space.covered ? { tabindex: 0 } : {}}
							role="img"
							aria-label={space.label}>
							<div class="rg-income-mat--tile-content">
								<b
									class="rg-income-mat--name"
					class:rg-income-mat--name-symbology={space.name === 'Symbology'}
									class:rg-income-mat--name-fit={[
										'Preservation',
										'Fertilization',
										'E-Commerce',
									].includes(space.name)}>{space.name}</b>
								{#if space.incomeGlyphs.length > 0}
									<b class="rg-income-mat--effect-label"
										>Income:</b>
								{/if}
								<div
									class="rg-income-mat--reward"
									class:rg-income-mat--reward-push={space
										.incomeGlyphs.length === 0}>
									{#if space.incomeGlyphs.length > 0}
										<span class="rg-income-mat--symbols">
											<SpaceGlyphs
												glyphs={space.incomeGlyphs}
												variant="dense" />
										</span>
									{/if}
									{#if space.scoreGlyphs.length > 0}
										<span class="rg-income-mat--symbols">
											<SpaceGlyphs
												glyphs={space.scoreGlyphs}
												variant="dense" />
										</span>
									{/if}
								</div>
							</div>
							{#if space.covered}
								<span class="rg-income-mat--cover">
									<img
										class="rg-income-mat--building"
										src={artUrl(`building/${row.building}`)}
										alt=""
										width="32"
										height="32" />
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</section>

<style>
	.rg-income-mat h2 {
		margin: 0;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
	}

	.rg-income-mat--era {
		color: var(--gold);
	}

	.rg-income-mat > p {
		margin: var(--space-3) 0 var(--space-8);
		color: var(--muted);
		font-size: var(--font-size-sm);
		line-height: 1.35;
	}

	.rg-income-mat--rows {
		display: grid;
		gap: var(--space-6);
	}

	.rg-income-mat--row {
		min-width: 0;
	}

	.rg-income-mat--row-market {
		--rg-income-mat-hover: var(--technology);
	}

	.rg-income-mat--row-house {
		--rg-income-mat-hover: var(--science);
	}

	.rg-income-mat--row-farm {
		--rg-income-mat-hover: var(--exploration);
	}

	.rg-income-mat--row-armory {
		--rg-income-mat-hover: var(--military);
	}

	.rg-income-mat--head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-4);
		margin-bottom: var(--space-2);
	}

	.rg-income-mat--head strong {
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-tight)
			var(--font-body);
	}

	.rg-income-mat--head span {
		color: var(--muted);
		font-size: var(--font-size-2xs);
	}

	.rg-income-mat--spaces {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rg-income-mat--space {
		position: relative;
		display: flex;
		container-type: inline-size;
		box-sizing: border-box;
		min-width: 0;
		height: 110px;
		padding: 4px var(--space-1);
		border: var(--border) solid var(--card-score-line);
		background: var(--card-slot);
		color: var(--card-text);
		text-align: center;
		box-shadow: 0 0 11px
			color-mix(in srgb, var(--rg-income-mat-hover) 68%, transparent);
	}

	.rg-income-mat--tile-content {
		position: relative;
		z-index: 0;
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		min-width: 0;
	}

	.rg-income-mat--name {
		width: 100%;
		min-height: 24px;
		color: var(--card-text);
		font: var(--weight-bold) var(--font-size-3xs) / 1.1 var(--font-title);
		overflow-wrap: anywhere;
	}

	.rg-income-mat--name-fit {
		font-size: var(--font-size-income-mat-fit);
		white-space: nowrap;
	}

	.rg-income-mat--name-symbology {
		font-size: calc(var(--font-size-3xs) - 1px);
		white-space: nowrap;
	}

	.rg-income-mat--reward {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: stretch;
		flex-wrap: wrap;
		gap: 2px;
		box-sizing: border-box;
		width: calc(100% - 4px);
		height: 60px;
		margin-inline: 2px;
		padding: 2px;
		background: var(--control);
		border: 2px solid var(--gold);
		box-shadow: inset 0 1px 2px
			var(--scrim-strong);
	}

	.rg-income-mat--reward-push {
		margin-top: auto;
	}

	.rg-income-mat--effect-label {
		align-self: center;
		margin-top: auto;
		margin-bottom: 2px;
		color: var(--card-text);
		font-weight: var(--weight-bold);
		font-size: var(--font-size-3xs);
	}

	.rg-income-mat--symbols {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-width: 0;
	}

	.rg-income-mat--symbols {
		--rg-vp-cup-size: 19px;
		--rg-space-glyphs-text: var(--font-size-3xs);
	}

	.rg-income-mat--symbols
		:global(.rg-space-glyphs--joint.rg-space-glyphs--times) {
		margin-inline: -2px;
	}

	.rg-income-mat--symbols
		:global(.rg-space-glyphs--dense img:not(.rg-space-glyphs--card-icon)) {
		width: 20px;
		height: 20px;
	}

	.rg-income-mat--space-covered {
		isolation: isolate;
	}

	.rg-income-mat--cover {
		position: absolute;
		inset: 0;
		z-index: 1;
		display: grid;
		place-items: center;
		background: var(--raised);
		transition:
			transform var(--duration-medium) var(--ease-out),
			filter var(--duration-medium) var(--ease-out);
	}

	.rg-income-mat--building {
		width: 32px;
		height: 32px;
		image-rendering: pixelated;
	}

	.rg-income-mat--space-covered:is(:hover, :focus-visible)
		.rg-income-mat--cover {
		transform: translateX(-100%);
		filter: drop-shadow(
			-5px 0 4px var(--scrim)
		);
	}

	.rg-income-mat--space-covered:is(:hover, :focus-visible) {
		box-shadow:
			inset 0 0 0 1px
				color-mix(in srgb, var(--rg-income-mat-hover) 60%, transparent),
			inset 0 0 15px
				color-mix(in srgb, var(--rg-income-mat-hover) 42%, transparent),
			0 0 11px
				color-mix(in srgb, var(--rg-income-mat-hover) 68%, transparent);
	}

	.rg-income-mat--space-covered:is(:hover, :focus-visible)
		.rg-income-mat--tile-content {
		z-index: 3;
	}

	.rg-income-mat--space-covered::after {
		position: absolute;
		inset: 0;
		z-index: 2;
		content: '';
		background: color-mix(
			in srgb,
			var(--rg-income-mat-hover) 32%,
			transparent
		);
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--duration-fast) var(--ease-out);
	}

	.rg-income-mat--space-covered:is(:hover, :focus-visible)::after {
		opacity: 1;
	}

	.rg-income-mat--space-covered img {
		width: 32px;
		height: 32px;
		image-rendering: pixelated;
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-income-mat--space-covered:is(:hover, :focus-visible)
			.rg-income-mat--cover {
			transform: translateX(-100%);
			filter: none;
			transition: none;
		}
	}
</style>

