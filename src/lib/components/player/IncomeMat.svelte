<!-- The income mat: four building rows of six spaces; covered spaces show their building, exposed ones their name and reward. -->
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
	import { artUrl, roman } from '../../ui.js';

	/** @type {IncomeMatProps} */
	let { rows, era, ...attr } = $props();

	/** @type {Record<string, string>} */
	const ROW_NAMES = {
		market: 'Markets',
		house: 'Houses',
		farm: 'Farms',
		armory: 'Armories',
	};
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
					<strong>{ROW_NAMES[row.building]}</strong>
					<span>{row.left} left</span>
				</div>
				<ul class="rg-income-mat--spaces">
					{#each row.spaces as space (space.name)}
						<li
							class="rg-income-mat--space {space.covered
								? 'rg-income-mat--space-covered'
								: ''}"
							aria-label={space.covered
								? `${space.name}, covered by a ${row.building}`
								: `${space.name}. ${space.reward}`}>
							{#if space.covered}
								<img
									src={artUrl(`building/${row.building}`)}
									alt=""
									width="32"
									height="32" />
								<span class="rg-income-mat--covered-name"
									>{space.name}</span>
							{:else}
								<b class="rg-income-mat--name">{space.name}</b>
								<span class="rg-income-mat--reward"
									>{space.reward}</span>
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
		flex-direction: column;
		align-items: center;
		min-width: 0;
		min-height: 96px;
		padding: var(--space-3) var(--space-1);
		border: var(--border) solid var(--card-score-line);
		background: var(--card-filled-slot);
		color: var(--card-text);
		text-align: center;
	}

	.rg-income-mat--name {
		width: 100%;
		min-height: 24px;
		font-family: var(--font-title);
		font-size: var(--font-size-3xs);
		line-height: 1.1;
		overflow-wrap: anywhere;
	}

	.rg-income-mat--reward {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		width: 100%;
		font: var(--weight-bold) var(--font-size-3xs) / 1.15 var(--font-body);
		overflow-wrap: anywhere;
	}

	.rg-income-mat--space-covered {
		justify-content: center;
		gap: var(--space-2);
		border-color: var(--line);
		background: var(--raised);
	}

	.rg-income-mat--space-covered::after {
		position: absolute;
		inset: 0;
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

	.rg-income-mat--space-covered:hover::after {
		opacity: 1;
	}

	.rg-income-mat--space-covered img {
		width: 32px;
		height: 32px;
		image-rendering: pixelated;
	}

	.rg-income-mat--covered-name {
		color: var(--muted);
		font-size: var(--font-size-3xs);
		line-height: 1.1;
		overflow-wrap: anywhere;
	}
</style>
