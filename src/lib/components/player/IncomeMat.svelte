<!-- The income mat: four building rows of six spaces; a covered space's building lifts on hover or focus to show the printed space under it (#142). -->
<script module>
	/**
	 * Properties of the IncomeMat component itself.
	 * @typedef {Object} IncomeMatOwnProps
	 * @property {import('../../area/income.js').IncomeRowView[]} rows - The four building rows
	 * @property {number} era - 1 to 4, shown as I–IV in the heading
	 * @property {string | null} [lifted=null] - A covered space, by name, whose building is held up as if pointed at
	 */

	/**
	 * Properties for the IncomeMat component, including any attributes for its root element.
	 * @typedef {IncomeMatOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} IncomeMatProps
	 *
	 * @example
	 * <IncomeMat rows={incomeRows(seat)} era={2} lifted="Credit Cards" />
	 */
</script>

<script>
	import { roman } from '../../game-names.js';
	import { artUrl } from '../../ui.js';

	/** @type {IncomeMatProps} */
	let { rows, era, lifted = null, ...attr } = $props();
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
			<div class="rg-income-mat--row">
				<div class="rg-income-mat--head">
					<strong>{row.name}</strong>
					<span>{row.left} left</span>
				</div>
				<ul class="rg-income-mat--spaces">
					{#each row.spaces as space (space.name)}
						<!-- A covered space takes the focus so the keyboard can lift its building too (#142). -->
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<li
							class="rg-income-mat--space"
							class:rg-income-mat--space-covered={space.covered}
							class:rg-income-mat--space-lifted={space.covered &&
								space.name === lifted}
							aria-label={space.label}
							tabindex={space.covered ? 0 : undefined}>
							<b class="rg-income-mat--name">{space.name}</b>
							<span class="rg-income-mat--reward"
								>{space.reward}</span>
							{#if space.covered}
								<span class="rg-income-mat--cover">
									<span class="rg-income-mat--covered-name"
										>{space.name}</span>
								</span>
								<span class="rg-income-mat--shadow"></span>
								<img
									class="rg-income-mat--building"
									src={artUrl(`building/${row.building}`)}
									alt=""
									width="32"
									height="32" />
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

	/* A covered space is the printed space, with the building resting on it (issue 142). */
	.rg-income-mat--cover {
		position: absolute;
		inset: calc(-1 * var(--border));
		border: var(--border) solid var(--line);
		background: var(--raised);
		pointer-events: none;
		transition: opacity var(--duration-medium) var(--ease-out);
	}

	.rg-income-mat--covered-name {
		position: absolute;
		top: calc(50% + var(--space-5));
		right: var(--space-1);
		left: var(--space-1);
		color: var(--muted);
		font-size: var(--font-size-3xs);
		line-height: 1.1;
		overflow-wrap: anywhere;
	}

	/* Its shadow on the mat, along the space's top edge, once it is lifted. */
	.rg-income-mat--shadow {
		position: absolute;
		top: -7px;
		left: 50%;
		width: 44px;
		height: 14px;
		background: radial-gradient(
			closest-side,
			var(--card-shadow-strong),
			transparent
		);
		opacity: 0;
		pointer-events: none;
		transform: translateX(-50%) scale(0.5);
	}

	.rg-income-mat--building {
		position: absolute;
		top: calc(50% - 26px);
		left: 50%;
		width: 32px;
		height: 32px;
		image-rendering: pixelated;
		pointer-events: none;
		transform: translateX(-50%);
	}

	.rg-income-mat--space-covered:is(
			:hover,
			:focus-visible,
			.rg-income-mat--space-lifted
		)
		.rg-income-mat--cover {
		opacity: 0;
	}

	/* Option A (owner, issue 142): the building rises straight up to float above its space, nearer and casting a shadow. */
	@media (prefers-reduced-motion: no-preference) {
		.rg-income-mat--shadow,
		.rg-income-mat--building {
			transition:
				top var(--duration-medium) var(--ease-out),
				transform var(--duration-medium) var(--ease-out),
				filter var(--duration-medium) var(--ease-out),
				opacity var(--duration-medium) var(--ease-out);
		}

		.rg-income-mat--space-covered:is(
				:hover,
				:focus-visible,
				.rg-income-mat--space-lifted
			)
			.rg-income-mat--shadow {
			opacity: 1;
			transform: translateX(-50%);
		}

		.rg-income-mat--space-covered:is(
				:hover,
				:focus-visible,
				.rg-income-mat--space-lifted
			)
			.rg-income-mat--building {
			z-index: 1;
			top: -40px;
			filter: drop-shadow(var(--shadow-float));
			transform: translateX(-50%) scale(1.15);
		}
	}

	/* Reduced motion: the building fades where it stands. */
	@media (prefers-reduced-motion: reduce) {
		.rg-income-mat--space-covered:is(
				:hover,
				:focus-visible,
				.rg-income-mat--space-lifted
			)
			.rg-income-mat--building {
			opacity: 0;
		}
	}
</style>
