<!-- ResourceRows: one row per resource to choose, as Board Game Arena's boxes, stacked (#75); the picked one gold. -->
<script module>
	/**
	 * One resource a row offers.
	 * @typedef {Object} RowChoice
	 * @property {import('../../picks.js').ResourceId} id
	 * @property {number} count - What the player would hold after the choices so far
	 * @property {boolean} disabled - No legal answer allows it now
	 * @property {string} [reason] - Why it is off, shown as its title
	 */

	/**
	 * One resource to choose.
	 * @typedef {Object} ResourceRow
	 * @property {import('../../picks.js').ResourceId | null} fixed - Set by the cost; the row has no choice
	 * @property {import('../../picks.js').ResourceId | null} picked - The resource chosen, if any
	 * @property {RowChoice[]} choices - What the row offers, in RESOURCES order; a fixed row's one resource
	 */

	/**
	 * Properties of the ResourceRows component itself.
	 * @typedef {Object} ResourceRowsOwnProps
	 * @property {ResourceRow[]} rows - The rows, fixed ones first (picks.js rowView)
	 * @property {boolean} [disabled=false] - Nothing can be pressed, as while the move is being sent
	 * @property {Function} [onResourceRowsPick] - Callback fired with `{ row, resource }` when a resource is pressed
	 */

	/**
	 * Properties for the ResourceRows component, including any attributes for its root element.
	 * @typedef {ResourceRowsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} ResourceRowsProps
	 *
	 * @example
	 * <ResourceRows rows={rowView(model, selection, held)} onResourceRowsPick={pick} />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { resourceName } from '../../game-names.js';

	/** @type {ResourceRowsProps} */
	let { rows, disabled = false, onResourceRowsPick, ...attr } = $props();

	/**
	 * @param {number} row
	 * @param {string} resource
	 * @param {MouseEvent} event
	 */
	const pickHandler = (row, resource, event) => {
		if (typeof onResourceRowsPick === 'function') {
			onResourceRowsPick(
				new ComponentEvent(
					{ row, resource },
					/** @type {HTMLButtonElement} */ (event.currentTarget),
					event
				)
			);
		}
	};
</script>

<div
	role="group"
	aria-label="Resources to choose"
	{...attr}
	class="rg-resource-rows {attr.class ? attr.class : ''}">
	{#each rows as row, index (index)}
		<div
			class="rg-resource-rows--row"
			role="group"
			aria-label="Resource {index + 1} of {rows.length}">
			<span
				class="rg-resource-rows--number"
				aria-hidden="true">{index + 1}</span>
			<div
				class="rg-resource-rows--box"
				class:rg-resource-rows--done={row.picked !== null}>
				{#each row.choices as choice (choice.id)}
					{#if row.fixed !== null}
						<span
							class="rg-resource-rows--choice rg-resource-rows--fixed"
							title="{resourceName(choice.id)}, set by the cost">
							<ResourceIcon
								symbol={choice.id}
								size="large"
								decorative />
							<span class="rg-resource-rows--count"
								>{choice.count}</span>
						</span>
					{:else}
						<button
							type="button"
							class="rg-resource-rows--choice"
							aria-pressed={row.picked === choice.id}
							aria-label="{resourceName(
								choice.id
							)}, {choice.count} held"
							title={choice.disabled
								? choice.reason
								: resourceName(choice.id)}
							data-id="row-{index}-{choice.id}"
							disabled={disabled || choice.disabled}
							onclick={(event) =>
								pickHandler(index, choice.id, event)}>
							<ResourceIcon
								symbol={choice.id}
								size="large"
								decorative />
							<span
								class="rg-resource-rows--count"
								aria-hidden="true">{choice.count}</span>
						</button>
					{/if}
				{/each}
			</div>
			<span
				class="rg-resource-rows--picked"
				class:rg-resource-rows--set={row.picked !== null}>
				{#if row.picked === null}
					—
				{:else}
					{resourceName(row.picked)}{row.fixed !== null
						? ' · set by the cost'
						: ''}
				{/if}
			</span>
		</div>
	{/each}
</div>

<style>
	.rg-resource-rows {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.rg-resource-rows--row {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.rg-resource-rows--number {
		width: var(--space-4);
		color: var(--faint);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-bold);
		text-align: right;
	}

	.rg-resource-rows--box {
		display: flex;
		gap: var(--space-1);
		padding: var(--space-2);
		border: var(--border) dashed var(--line-strong);
		border-radius: var(--radius);
		background: var(--control);
	}

	.rg-resource-rows--done {
		border-style: solid;
		border-color: var(--line);
	}

	.rg-resource-rows--choice {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		padding: 0;
		border: var(--border) solid transparent;
		border-radius: var(--radius);
		background: transparent;
	}

	button.rg-resource-rows--choice:not(:disabled):hover {
		background: var(--raised);
	}

	.rg-resource-rows--choice[aria-pressed='true'],
	.rg-resource-rows--fixed {
		border-color: var(--gold);
		background: var(--picked-fill);
		outline: var(--border-thick) solid var(--gold);
	}

	/* Focus on the picked one: its solid ring turns dashed and stands off, so focus reads apart from the pick. */
	.rg-resource-rows--choice[aria-pressed='true']:focus-visible {
		outline-style: dashed;
		outline-offset: var(--focus-offset);
	}

	.rg-resource-rows--done .rg-resource-rows--choice[aria-pressed='false'],
	.rg-resource-rows--choice:disabled {
		opacity: var(--opacity-unpickable);
	}

	.rg-resource-rows--choice:disabled {
		cursor: default;
	}

	.rg-resource-rows--count {
		position: absolute;
		right: 0;
		bottom: 0;
		min-width: 16px;
		padding: 0 var(--space-1);
		background: var(--ink);
		color: var(--text);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-bold);
		line-height: var(--leading-snug);
		text-align: center;
	}

	.rg-resource-rows--picked {
		min-width: 90px;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-resource-rows--set {
		color: var(--text);
	}
</style>
