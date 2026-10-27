<!-- IncomeSteps: the strip of an income turn's steps, with the one running now marked. -->
<script module>
	/**
	 * Properties of the IncomeSteps component itself.
	 * @typedef {Object} IncomeStepsOwnProps
	 * @property {{ id: string, label: string }[]} steps - The turn's steps in order
	 * @property {string | null} [current=null] - The id of the step running now
	 */

	/**
	 * Properties for the IncomeSteps component, including any attributes for its root list.
	 * @typedef {IncomeStepsOwnProps & import('svelte/elements').HTMLAttributes<HTMLOListElement>} IncomeStepsProps
	 *
	 * @example
	 * <IncomeSteps steps={[{ id: 'score', label: 'Score' }, { id: 'income', label: 'Income' }]} current="score" />
	 */
</script>

<script>
	/** @type {IncomeStepsProps} */
	let { steps, current = null, ...attr } = $props();
</script>

<ol
	aria-label="Income turn steps"
	{...attr}
	class="rg-income-steps {attr.class ? attr.class : ''}">
	{#each steps as step (step.id)}
		<li
			class="rg-income-steps--step"
			class:rg-income-steps--active={step.id === current}
			aria-current={step.id === current ? 'step' : undefined}>
			{step.label}
		</li>
	{/each}
</ol>

<style>
	.rg-income-steps {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rg-income-steps--step {
		padding: var(--space-2) var(--space-3);
		border-bottom: var(--border) solid var(--line);
		color: var(--rg-income-steps-color, var(--muted));
		font-size: var(--font-size-xs);
	}

	.rg-income-steps--active {
		border-color: var(--rg-income-steps-active-border, var(--gold));
		color: var(--rg-income-steps-active, var(--gold));
		font-weight: var(--weight-bold);
	}
</style>
