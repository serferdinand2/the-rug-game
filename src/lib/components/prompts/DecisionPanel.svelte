<!-- The decision prompt over the shared area: a dark scrim, an optional shelf of cards above, and the panel with its title, content and Confirm. -->
<script module>
	/**
	 * Properties of the DecisionPanel component itself.
	 * @typedef {Object} DecisionPanelOwnProps
	 * @property {string} title - The question, such as 'Choose a resource'
	 * @property {string} [status=''] - A line beside the actions: what is chosen, or what is missing
	 * @property {string} [confirmLabel='Confirm choice'] - The confirming button's text
	 * @property {boolean} [confirmDisabled=false] - Nothing valid is chosen yet
	 * @property {string} [cancelLabel] - Shows a cancel button with this text, such as 'Cancel'; left out, there is none
	 * @property {import('svelte').Snippet} [children] - The content: the instruction and the choices
	 * @property {import('svelte').Snippet} [shelf] - Cards shown above the panel, as the card choices are
	 * @property {Function} [onDecisionPanelConfirm] - Callback fired when Confirm is pressed
	 * @property {Function} [onDecisionPanelCancel] - Callback fired when the cancel button is pressed
	 */

	/**
	 * Properties for the DecisionPanel component, including any attributes for its root element.
	 * @typedef {DecisionPanelOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} DecisionPanelProps
	 *
	 * @example
	 * <DecisionPanel title="Choose a resource" confirmDisabled={!picked} onDecisionPanelConfirm={send}>
	 *   <DecisionOption …/>
	 * </DecisionPanel>
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {DecisionPanelProps} */
	let {
		title,
		status = '',
		confirmLabel = 'Confirm choice',
		confirmDisabled = false,
		cancelLabel,
		children,
		shelf,
		onDecisionPanelConfirm,
		onDecisionPanelCancel,
		...attr
	} = $props();

	const uid = $props.id();

	/**
	 * @param {MouseEvent} event
	 */
	const confirmClickHandler = (event) => {
		if (typeof onDecisionPanelConfirm === 'function') {
			onDecisionPanelConfirm(
				new ComponentEvent(
					null,
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const cancelClickHandler = (event) => {
		if (typeof onDecisionPanelCancel === 'function') {
			onDecisionPanelCancel(
				new ComponentEvent(
					null,
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-decision-panel {attr.class ? attr.class : ''}">
	{#if shelf}
		<div class="rg-decision-panel--shelf">{@render shelf()}</div>
	{/if}
	<div
		class="rg-decision-panel--panel"
		role="dialog"
		aria-modal="false"
		aria-labelledby="{uid}-title">
		<div class="rg-decision-panel--top">
			<h2 id="{uid}-title">{title}</h2>
		</div>
		<div class="rg-decision-panel--content">
			{@render children?.()}
		</div>
		<div class="rg-decision-panel--bottom">
			<p
				class="rg-decision-panel--status"
				role="status">
				{status}
			</p>
			{#if cancelLabel}
				<button
					type="button"
					class="rg-decision-panel--button"
					onclick={cancelClickHandler}>{cancelLabel}</button>
			{/if}
			<button
				type="button"
				class="rg-decision-panel--button rg-decision-panel--confirm"
				disabled={confirmDisabled}
				onclick={confirmClickHandler}>{confirmLabel}</button>
		</div>
	</div>
</div>

<style>
	.rg-decision-panel {
		position: absolute;
		z-index: var(--layer-popover);
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		padding: 26px 34px 14px;
		background: color-mix(in srgb, var(--ink) 52%, transparent);
	}

	.rg-decision-panel--shelf {
		display: flex;
		justify-content: center;
		width: 100%;
		min-height: 0;
		max-height: calc(100% - 250px);
		margin-bottom: 18px;
	}

	.rg-decision-panel--panel {
		flex: 0 1 auto;
		width: max-content;
		min-width: min(480px, 100%);
		max-width: min(900px, 100%);
		max-height: 100%;
		overflow: auto;
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background:
			linear-gradient(
				color-mix(in srgb, var(--ink) 60%, transparent),
				color-mix(in srgb, var(--ink) 60%, transparent)
			),
			var(--texture) var(--chrome);
		color: var(--text);
		box-shadow: var(--shadow-float);
	}

	.rg-decision-panel--top,
	.rg-decision-panel--bottom {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		padding: var(--space-8) var(--space-10);
	}

	.rg-decision-panel--top {
		border-bottom: var(--border) solid var(--line);
	}

	.rg-decision-panel--top h2 {
		flex: 1;
		margin: 0;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-3xl) / var(--leading-tight)
			var(--font-body);
	}

	.rg-decision-panel--content {
		padding: var(--space-9) var(--space-10) var(--space-10);
	}

	.rg-decision-panel--bottom {
		border-top: var(--border) solid var(--line);
	}

	.rg-decision-panel--status {
		flex: 1;
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-decision-panel--button {
		padding: var(--space-4) var(--space-6);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--raised);
		color: var(--text);
		font-weight: var(--weight-bold);
	}

	.rg-decision-panel--button:hover:not(:disabled),
	.rg-decision-panel--button:focus-visible {
		border-color: var(--gold);
		color: var(--gold);
	}

	.rg-decision-panel--confirm {
		border-color: var(--action);
		background: color-mix(in srgb, var(--action) 22%, var(--control));
		color: color-mix(in srgb, var(--action) 45%, var(--text));
	}

	.rg-decision-panel--button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
