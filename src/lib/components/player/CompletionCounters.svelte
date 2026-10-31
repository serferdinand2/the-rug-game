<!-- The three counters under a capital: completed rows, columns and districts, which show their groups on the grid when hovered or toggled. -->
<script module>
	/** @typedef {import('../../capital.js').GroupKind} GroupKind */

	/**
	 * Properties of the CompletionCounters component itself.
	 * @typedef {Object} CompletionCountersOwnProps
	 * @property {Record<GroupKind, number>} counts - How many rows, columns and districts are complete
	 * @property {GroupKind | null} [active=null] - The counter toggled on, whose groups stay highlighted
	 * @property {Function} [onCompletionCountersHover] - Callback fired with a kind when a counter is hovered or focused, and with null when it is left
	 * @property {Function} [onCompletionCountersToggle] - Callback fired with a kind when a counter is pressed
	 */

	/**
	 * Properties for the CompletionCounters component, including any attributes for its root element.
	 * @typedef {CompletionCountersOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} CompletionCountersProps
	 *
	 * @example
	 * <CompletionCounters
	 *   counts={{ rows: 1, columns: 3, districts: 1 }}
	 *   {active}
	 *   onCompletionCountersHover={(event) => (hovered = event.value)}
	 *   onCompletionCountersToggle={(event) => (active = active === event.value ? null : event.value)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {CompletionCountersProps} */
	let {
		counts,
		active = null,
		onCompletionCountersHover,
		onCompletionCountersToggle,
		...attr
	} = $props();

	/** @type {readonly { kind: GroupKind, name: string, mark: string }[]} */
	const COUNTERS = [
		{ kind: 'rows', name: 'rows', mark: 'row' },
		{ kind: 'columns', name: 'columns', mark: 'column' },
		{ kind: 'districts', name: 'districts', mark: 'district' },
	];

	/**
	 * @param {Event} event
	 * @param {GroupKind | null} kind
	 */
	const hover = (event, kind) => {
		if (typeof onCompletionCountersHover === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onCompletionCountersHover(new ComponentEvent(kind, target, event));
		}
	};

	/**
	 * @param {PointerEvent} event
	 * @param {GroupKind} kind
	 */
	const pointerenterHandler = (event, kind) => hover(event, kind);

	/**
	 * @param {PointerEvent} event
	 */
	const pointerleaveHandler = (event) => hover(event, null);

	/**
	 * @param {FocusEvent} event
	 * @param {GroupKind} kind
	 */
	const focusHandler = (event, kind) => hover(event, kind);

	/**
	 * @param {FocusEvent} event
	 */
	const blurHandler = (event) => hover(event, null);

	/**
	 * @param {MouseEvent} event
	 * @param {GroupKind} kind
	 */
	const clickHandler = (event, kind) => {
		if (typeof onCompletionCountersToggle === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onCompletionCountersToggle(new ComponentEvent(kind, target, event));
		}
	};
</script>

<div
	role="group"
	aria-label="Completed capital sections"
	{...attr}
	class="rg-completion-counters {attr.class ? attr.class : ''}">
	{#each COUNTERS as counter (counter.kind)}
		<button
			type="button"
			class="rg-completion-counters--counter"
			class:rg-completion-counters--active={active === counter.kind}
			aria-label="Completed {counter.name}: {counts[counter.kind]}"
			aria-pressed={active === counter.kind}
			title="Completed {counter.name}"
			onpointerenter={(event) => pointerenterHandler(event, counter.kind)}
			onpointerleave={pointerleaveHandler}
			onfocus={(event) => focusHandler(event, counter.kind)}
			onblur={blurHandler}
			onclick={(event) => clickHandler(event, counter.kind)}>
			<i
				class="rg-completion-counters--mark rg-completion-counters--{counter.mark}"
				aria-hidden="true"></i>
			<b class="rg-completion-counters--count">{counts[counter.kind]}</b>
		</button>
	{/each}
</div>

<style>
	.rg-completion-counters {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-3);
		margin-block-start: var(--space-3);
		width: 100%;
	}

	.rg-completion-counters--counter {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		min-width: 0;
		min-height: 42px;
		padding: var(--space-3) var(--space-4);
		border: 0;
		border-radius: var(--radius);
		background: var(--raised);
		color: var(--muted);
		text-align: center;
		transition: color var(--duration-fast) var(--ease);
	}

	.rg-completion-counters--counter:hover,
	.rg-completion-counters--active {
		color: var(--text);
	}

	.rg-completion-counters--mark {
		position: relative;
		display: block;
		flex: none;
		width: 18px;
		height: 18px;
	}

	.rg-completion-counters--row::before,
	.rg-completion-counters--column::before {
		content: '';
		position: absolute;
		background: currentColor;
	}

	.rg-completion-counters--row::before {
		top: 8px;
		right: 1px;
		left: 1px;
		height: var(--border-thick);
	}

	.rg-completion-counters--column::before {
		top: 1px;
		bottom: 1px;
		left: 8px;
		width: var(--border-thick);
	}

	.rg-completion-counters--district {
		border: var(--border-thick) solid currentColor;
	}

	.rg-completion-counters--count {
		color: var(--gold);
		font-size: var(--font-size-lg);
		font-weight: var(--weight-bold);
		line-height: var(--leading-none);
	}
</style>
