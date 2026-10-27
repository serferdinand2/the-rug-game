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
	 * @property {boolean} [docked=false] - The board under it stays clickable: no scrim, and a narrow panel docked at the right, for a choice on the map; its content scrolls, so the title and Confirm stay in sight
	 * @property {import('svelte').Snippet} [steps] - The income steps, between the title and the content
	 * @property {string} [cancelLabel] - Shows a cancel button with this text, such as 'Cancel'; left out, there is none
	 * @property {import('svelte').Snippet} [children] - The content: the instruction and the choices; left out, the panel has no content area and its status line carries the instruction, leaving more room for a shelf
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
	import Button from '../ui/Button.svelte';

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
	 * @param {ComponentEvent} event
	 */
	const confirmClickHandler = (event) => {
		if (typeof onDecisionPanelConfirm === 'function') {
			onDecisionPanelConfirm(
				new ComponentEvent(null, event.target, event.originalEvent)
			);
		}
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const cancelClickHandler = (event) => {
		if (typeof onDecisionPanelCancel === 'function') {
			onDecisionPanelCancel(
				new ComponentEvent(null, event.target, event.originalEvent)
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
		{#if children}
			<div class="rg-decision-panel--content">
				{@render children()}
			</div>
		{/if}
		<div class="rg-decision-panel--bottom">
			<p
				class="rg-decision-panel--status"
				role="status">
				{status}
			</p>
			{#if cancelLabel}
				<Button onButtonClick={cancelClickHandler}
					>{cancelLabel}</Button>
			{/if}
			<Button
				mode="confirm"
				class="rg-decision-panel--confirm"
				disabled={confirmDisabled}
				onButtonClick={confirmClickHandler}>{confirmLabel}</Button>
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

	/* The shelf takes the height above the panel, so the cards on it can size themselves to it (#57). */
	.rg-decision-panel--shelf {
		display: flex;
		flex: 1 1 0;
		justify-content: center;
		width: 100%;
		min-height: 0;
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

	/* Confirm takes the track's colour too, as the mockup's [data-track] #decision-confirm; the Button is reached
	   through its class prop. */
	.rg-decision-panel--tracked
		:global(.rg-decision-panel--confirm:not(:disabled)) {
		border-color: var(--rg-decision-panel-track);
		background: color-mix(
			in srgb,
			var(--rg-decision-panel-track) 65%,
			var(--text)
		);
		color: var(--ink);
	}

	.rg-decision-panel--tracked
		:global(.rg-decision-panel--confirm:not(:disabled):hover) {
		background: color-mix(
			in srgb,
			var(--rg-decision-panel-track) 55%,
			var(--text)
		);
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

	/* Docked, the content scrolls between the title and the actions, so Confirm stays in sight however many choices
	   there are, such as an explore's eleven tiles (#74). */
	.rg-decision-panel--docked .rg-decision-panel--panel {
		display: flex;
		flex-direction: column;
		width: 340px;
		min-width: 0;
		max-height: calc(100% - var(--space-9));
	}

	.rg-decision-panel--docked .rg-decision-panel--panel > * {
		flex: none;
	}

	.rg-decision-panel--docked .rg-decision-panel--content {
		flex: 0 1 auto;
		min-height: 0;
		overflow: auto;
	}

	.rg-decision-panel--docked .rg-decision-panel--bottom {
		flex-wrap: wrap;
	}

	.rg-decision-panel--docked .rg-decision-panel--status {
		flex-basis: 100%;
	}
</style>
