<!-- TieSteps: how one tie was decided, step by step: who tied, each step's values (a landmark's name in gold), whether it separated them, and the outcome. -->
<script module>
	/**
	 * Properties of the TieSteps component itself.
	 * @typedef {Object} TieStepsOwnProps
	 * @property {import('../../results.js').TieExplanation} tie - From tieExplanations(game)
	 */

	/**
	 * Properties for the TieSteps component, including any attributes for its root element.
	 * @typedef {TieStepsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TieStepsProps
	 *
	 * @example
	 * {#each tieExplanations(game) as tie (tie.vp)}<TieSteps {tie} />{/each}
	 */
</script>

<script>
	/** @type {TieStepsProps} */
	let { tie, ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-tie-steps {attr.class ? attr.class : ''}">
	<p class="rg-tie-steps--intro">{tie.intro}</p>
	<ol class="rg-tie-steps--steps">
		{#each tie.steps as step, index (index)}
			<li class="rg-tie-steps--step">
				<div class="rg-tie-steps--title">
					<span>{index + 1}.</span>{step.title}
				</div>
				<div class="rg-tie-steps--values">
					{#each step.values as item (item.seat)}
						<div>
							<span>{item.name}</span>
							<b class:rg-tie-steps--landmark={item.landmark}
								>{item.value}</b>
						</div>
					{/each}
				</div>
				<p class="rg-tie-steps--result">
					{step.separates
						? 'This step separates them.'
						: 'Still tied after this step.'}
				</p>
			</li>
		{/each}
	</ol>
	<p class="rg-tie-steps--outcome">{tie.outcome}</p>
</div>

<style>
	.rg-tie-steps {
		min-width: 0;
	}

	.rg-tie-steps--intro,
	.rg-tie-steps--outcome {
		margin: 0 0 13px;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-tie-steps--outcome {
		margin: var(--space-5) 0 0;
		color: var(--text);
		font-weight: var(--weight-bold);
	}

	.rg-tie-steps--steps {
		display: grid;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rg-tie-steps--step {
		padding: var(--space-6) 13px;
		border-top: var(--border) solid var(--line);
		background: color-mix(in srgb, var(--raised) 75%, transparent);
	}

	.rg-tie-steps--title {
		display: flex;
		align-items: baseline;
		gap: 7px;
		color: var(--gold);
		font-size: var(--font-size-sm);
		font-weight: var(--weight-bold);
	}

	.rg-tie-steps--title span {
		color: var(--muted);
		font-size: var(--font-size-xs);
	}

	.rg-tie-steps--values {
		display: grid;
		gap: var(--space-2);
		margin-top: var(--space-4);
		font-size: var(--font-size-sm);
	}

	.rg-tie-steps--values div {
		display: flex;
		justify-content: space-between;
		gap: var(--space-6);
	}

	.rg-tie-steps--values b {
		text-align: right;
	}

	.rg-tie-steps--landmark {
		color: var(--gold);
		font: var(--weight-title) var(--font-size-sm) / var(--leading-snug)
			var(--font-title);
	}

	.rg-tie-steps--result {
		margin: 9px 0 0;
		color: var(--muted);
		font-size: var(--font-size-xs);
	}
</style>
