<!-- The decision prompt over the shared area: a dark scrim, and at the screen's centre the panel with its title, content and Confirm, under an optional shelf of cards. -->
<script module>
	/**
	 * Properties of the DecisionPanel component itself.
	 * @typedef {Object} DecisionPanelOwnProps
	 * @property {string} title - The question, such as 'Choose a resource'
	 * @property {string} [status=''] - A line beside the actions: what is chosen, or what is missing; empty, a docked panel leaves it out
	 * @property {boolean} [statusWarn=false] - The status line is a warning, such as resources lost to the cap (#75)
	 * @property {string} [confirmLabel='Confirm choice'] - The confirming button's text
	 * @property {boolean} [confirmDisabled=false] - Nothing valid is chosen yet
	 * @property {import('../../ui.js').TrackId | null} [track=null] - The track that tints the bottom bar and border, as the mockup's --track
	 * @property {'default' | 'income'} [tone='default'] - income: the title, border and step strip in gold, for the viewer's income turn
	 * @property {boolean} [docked=false] - The board under it stays clickable: no scrim, and a narrow panel docked at the right instead of at the screen's centre, for a choice on the map; its content scrolls, so the title and Confirm stay in sight. It is --docked-panel-width wide and --docked-panel-inset in from the right, for the board beside it to keep free
	 * @property {boolean} [narrow=false] - The panel is --narrow-panel-width wide, as a pick of several resources, cards or tiles is (#75); otherwise as wide as its content, 480 to 900 px
	 * @property {import('svelte').Snippet} [steps] - The income steps, between the title and the content
	 * @property {string} [cancelLabel] - Shows a cancel button with this text, such as 'Cancel'; left out, there is none
	 * @property {import('svelte').Snippet} [children] - The content: the instruction and the choices; left out, the panel has no content area and its status line carries the instruction, leaving more room for a shelf
	 * @property {import('svelte').Snippet} [pinned] - Kept in sight between the content and the actions while a docked panel's content scrolls, such as what is chosen
	 * @property {import('svelte').Snippet<[number | undefined]>} [shelf] - Cards shown above the panel, as the card choices are; it gets the height it may take, once measured, so its cards can fit it (#57)
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
	 *
	 * @example
	 * <DecisionPanel title="Choose a tapestry card to keep" confirmLabel="Keep card">
	 *   {#snippet shelf(room)}<CardShelf kind="tapestry" {cards} {room} />{/snippet}
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
		narrow = false,
		statusWarn = false,
		steps,
		cancelLabel,
		children,
		pinned,
		shelf,
		onDecisionPanelConfirm,
		onDecisionPanelCancel,
		...attr
	} = $props();

	const uid = $props.id();

	/** The gap between the shelf and the panel. */
	const SHELF_GAP = 18;

	/** The stack's height, the most it may take, and the panel's. */
	let stackHeight = $state(0);
	let panelHeight = $state(0);
	/** The height the shelf may take above the panel (#57), once both are measured. */
	let room = $derived(
		stackHeight > 0
			? Math.max(0, stackHeight - panelHeight - SHELF_GAP)
			: undefined
	);

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
	class:rg-decision-panel--narrow={narrow}
	style:--rg-decision-panel-track={track ? trackColor(track) : undefined}
	style:--rg-decision-panel-gap="{SHELF_GAP}px">
	<span class="rg-decision-panel--spacer"></span>
	<div
		class="rg-decision-panel--stack"
		bind:clientHeight={stackHeight}>
		{#if shelf}
			<div class="rg-decision-panel--shelf">{@render shelf(room)}</div>
		{/if}
		<div
			class="rg-decision-panel--panel"
			class:rg-decision-panel--income={tone === 'income'}
			class:rg-decision-panel--tracked={track !== null}
			role="dialog"
			aria-modal="false"
			aria-labelledby="{uid}-title"
			bind:offsetHeight={panelHeight}>
			<div class="rg-decision-panel--top">
				<h2 id="{uid}-title">{title}</h2>
			</div>
			{#if steps}
				<div class="rg-decision-panel--steps">{@render steps()}</div>
			{/if}
			{#if children}
				<div
					class="rg-decision-panel--content"
					class:rg-decision-panel--content-pinned={pinned}>
					{@render children()}
				</div>
			{/if}
			{#if pinned}
				<div class="rg-decision-panel--pinned">{@render pinned()}</div>
			{/if}
			<div class="rg-decision-panel--bottom">
				<p
					class="rg-decision-panel--status"
					class:rg-decision-panel--status-empty={!status}
					class:rg-decision-panel--status-warn={statusWarn}
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
</div>

<style>
	/* Every prompt opens at the screen's centre (owner, #79): the scrim covers the shared area, and the shelf and the
	   panel stand in one column in the middle of it. */
	.rg-decision-panel {
		--rg-decision-panel-inline: 34px;
		position: absolute;
		z-index: var(--layer-popover);
		inset: 0;
		display: flex;
		justify-content: center;
		padding: var(--space-9) var(--rg-decision-panel-inline);
		background: color-mix(in srgb, var(--ink) 52%, transparent);
	}

	.rg-decision-panel--narrow .rg-decision-panel--panel {
		width: var(--narrow-panel-width);
		min-width: 0;
	}

	/* The stack's centre is the screen's: the screen is the nearest size container, or else the viewport, and this
	   area starts at its left edge, as the shared area does. The spacer takes twice the distance between the two
	   centres, and gives way first, so a stack wider than the room right of the screen's centre slides left and stays
	   on the board; wider than the board, the shelf scrolls (#79). */
	.rg-decision-panel--spacer {
		flex: 0 1000
			max(0px, calc(100cqw - 100% - 2 * var(--rg-decision-panel-inline)));
	}

	/* The shelf and the panel in one column, centred together; its height is the most the two may take. */
	.rg-decision-panel--stack {
		display: flex;
		flex: 0 1 auto;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 0;
		max-width: 100%;
	}

	/* The shelf is as tall as its cards, at most the room above the panel, which its cards size themselves to (#57). */
	.rg-decision-panel--shelf {
		display: flex;
		flex: 0 1 auto;
		justify-content: center;
		max-width: 100%;
		min-height: 0;
		margin-bottom: var(--rg-decision-panel-gap);
	}

	/* The panel is as wide as its content, up to 900 px. The limit is a length, not a percentage of the stack, so it
	   holds while the stack measures its own width: a row of many options would otherwise make the stack as wide as
	   the board and leave the spacer nothing (#79). */
	.rg-decision-panel--panel {
		flex: none;
		width: max-content;
		min-width: min(480px, 100%);
		max-width: 900px;
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

	/* What is pinned reads as the end of the content: the content gives up its bottom padding to it. */
	.rg-decision-panel--content-pinned {
		padding-bottom: 0;
	}

	.rg-decision-panel--pinned {
		padding: var(--space-6) var(--space-10) var(--space-10);
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

	.rg-decision-panel--status-warn {
		color: var(--danger);
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

	.rg-decision-panel--income .rg-decision-panel--content,
	.rg-decision-panel--income .rg-decision-panel--pinned {
		color: var(--income-body);
	}

	.rg-decision-panel--income .rg-decision-panel--bottom {
		background: var(--surface);
		box-shadow: none;
	}

	/* A choice on the map leaves the board clickable: no scrim, only the panel takes the pointer, docked at the
	   right beside the map rather than over its hexes (#26 review). What is chosen gets its own line. The panel is
	   --docked-panel-width wide and --docked-panel-inset in from the right, so a board can keep both free and lay the
	   map out beside it (#74). */
	.rg-decision-panel--docked {
		justify-content: flex-end;
		padding: 70px var(--docked-panel-inset) 14px
			var(--rg-decision-panel-inline);
		background: transparent;
		pointer-events: none;
	}

	.rg-decision-panel--docked .rg-decision-panel--spacer {
		display: none;
	}

	.rg-decision-panel--docked .rg-decision-panel--stack {
		justify-content: flex-start;
	}

	.rg-decision-panel--docked .rg-decision-panel--panel {
		pointer-events: auto;
	}

	/* Docked, the content scrolls between the title and the actions, so Confirm stays in sight however many choices
	   there are, such as an explore's eleven tiles (#74). */
	.rg-decision-panel--docked .rg-decision-panel--panel {
		display: flex;
		flex-direction: column;
		width: var(--docked-panel-width);
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

	/* Docked, an empty status line would still take a row and its gap above the actions. */
	.rg-decision-panel--docked .rg-decision-panel--status-empty {
		display: none;
	}
</style>
