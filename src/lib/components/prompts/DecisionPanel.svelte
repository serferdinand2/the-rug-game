<!-- The decision prompt over the shared area: a dark scrim, an optional shelf of cards above, and the panel with its title, content and Confirm. -->
<script module>
	/**
	 * Properties of the DecisionPanel component itself.
	 * @typedef {Object} DecisionPanelOwnProps
	 * @property {string} title - The question, such as 'Choose a resource'
	 * @property {string} [status=''] - A line beside the actions: what is chosen, or what is missing
	 * @property {string} [confirmLabel='Confirm choice'] - The confirming button's text
	 * @property {boolean} [confirmDisabled=false] - Nothing valid is chosen yet
	 * @property {import('../../ui.js').TrackId | null} [track=null] - The track that tints the bottom bar and border, as the mockup's --track
	 * @property {'default' | 'income'} [tone='default'] - income: the title, border and step strip in gold, for the viewer's income turn
	 * @property {boolean} [docked=false] - The board under it stays clickable: no scrim, and a narrow panel docked at the right, for a choice on the map
	 * @property {import('svelte').Snippet} [steps] - The income steps, between the title and the content
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
	import { trackColor } from '../../ui.js';

	/** @type {DecisionPanelProps} */
	let {
		title,
		status = '',
		confirmLabel = 'Confirm choice',
		confirmDisabled = false,
		track = null,
		tone = 'default',
		docked = false,
		steps,
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
	class="rg-decision-panel {attr.class ? attr.class : ''}"
	class:rg-decision-panel--docked={docked}
	style:--rg-decision-panel-track={track ? trackColor(track) : undefined}>
	{#if shelf}
		<div class="rg-decision-panel--shelf">{@render shelf()}</div>
	{/if}
	<div
		class="rg-decision-panel--panel"
		class:rg-decision-panel--income={tone === 'income'}
		class:rg-decision-panel--tracked={track !== null}
		role="dialog"
		aria-modal="false"
		aria-labelledby="{uid}-title">
		<div class="rg-decision-panel--top">
			<h2 id="{uid}-title">{title}</h2>
		</div>
		{#if steps}
			<div class="rg-decision-panel--steps">{@render steps()}</div>
		{/if}
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

	/* A decision about a track takes a tint of it along the bottom, as the mockup's --track does. */
	.rg-decision-panel--tracked .rg-decision-panel--bottom {
		background: color-mix(
			in srgb,
			var(--rg-decision-panel-track) 18%,
			var(--chrome)
		);
		box-shadow: inset 0 -3px var(--rg-decision-panel-track);
	}

	.rg-decision-panel--tracked .rg-decision-panel--status {
		color: color-mix(
			in srgb,
			var(--rg-decision-panel-track) 35%,
			var(--text)
		);
	}

	.rg-decision-panel--tracked .rg-decision-panel--confirm:not(:disabled) {
		border-color: var(--rg-decision-panel-track);
		background: color-mix(
			in srgb,
			var(--rg-decision-panel-track) 65%,
			var(--text)
		);
		color: var(--ink);
	}

	/* The viewer's income turn is gold: the border, the title bar and the step strip. */
	.rg-decision-panel--income {
		border-color: var(--income-line);
		background:
			linear-gradient(
				color-mix(in srgb, var(--income-bottom) 80%, transparent),
				color-mix(in srgb, var(--income-bottom) 80%, transparent)
			),
			var(--texture) var(--income-bottom);
	}

	.rg-decision-panel--income .rg-decision-panel--top {
		border-bottom-color: var(--income-edge);
		background: linear-gradient(
			180deg,
			var(--income-top),
			var(--income-deep)
		);
	}

	.rg-decision-panel--income .rg-decision-panel--top h2 {
		color: var(--income-title);
	}

	/* The step strip is a gold band across the panel, its colours handed to the steps as custom properties. */
	.rg-decision-panel--steps {
		--rg-income-steps-color: var(--income-mute);
		--rg-income-steps-active: var(--income-active);
		--rg-income-steps-active-border: var(--income-bright);
		padding: var(--space-5) var(--space-10);
		border-bottom: var(--border) solid var(--income-edge);
		background: linear-gradient(
			180deg,
			var(--income-deep),
			var(--income-deeper)
		);
	}

	.rg-decision-panel--income .rg-decision-panel--content {
		color: var(--income-body);
	}

	.rg-decision-panel--income .rg-decision-panel--bottom {
		background: var(--surface);
		box-shadow: none;
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

	/* A choice on the map leaves the board clickable: no scrim, only the panel takes the pointer, docked at the
	   right beside the map rather than over its hexes (#26 review). What is chosen gets its own line. */
	.rg-decision-panel--docked {
		align-items: flex-end;
		justify-content: flex-start;
		padding-top: 70px;
		background: transparent;
		pointer-events: none;
	}

	.rg-decision-panel--docked > * {
		pointer-events: auto;
	}

	.rg-decision-panel--docked .rg-decision-panel--panel {
		width: 340px;
		min-width: 0;
		max-height: calc(100% - var(--space-9));
	}

	.rg-decision-panel--docked .rg-decision-panel--bottom {
		flex-wrap: wrap;
	}

	.rg-decision-panel--docked .rg-decision-panel--status {
		flex-basis: 100%;
	}
</style>
