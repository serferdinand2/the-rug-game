<!-- The log and scores panel (#29 design §5): over the player area, the table's log or the current scores, chosen by two tabs, closed with its button or Escape. -->
<script module>
	/**
	 * Properties of the LogPanel screen part itself.
	 * @typedef {Object} LogPanelOwnProps
	 * @property {any} game - The game as view() gives it to the viewer
	 * @property {number | null} seat - The viewer's seat, marked on the scores
	 * @property {'log' | 'scores'} [tab='log'] - The tab on show; bindable
	 * @property {Function} [onLogPanelClose] - Callback fired when the panel is closed
	 */

	/**
	 * Properties for LogPanel, including any attributes for its root element.
	 * @typedef {LogPanelOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} LogPanelProps
	 *
	 * @example
	 * <LogPanel {game} {seat} bind:tab onLogPanelClose={() => (logOpen = false)} />
	 */
</script>

<script>
	import IconButton from '../../lib/components/ui/IconButton.svelte';
	import Tabs from '../../lib/components/ui/Tabs.svelte';
	import TableLog from '../../lib/components/log/TableLog.svelte';
	import ScoreBoard from '../../lib/components/log/ScoreBoard.svelte';
	import { ComponentEvent } from '../../lib/component-event.js';
	import { liveEvents } from '../../lib/event-feed.js';
	import { logEntries } from '../../lib/log.js';
	import { scoreboard } from '../../lib/results.js';

	/** @type {LogPanelProps} */
	let {
		game,
		seat,
		tab = $bindable('log'),
		onLogPanelClose,
		...attr
	} = $props();

	let entries = $derived(logEntries(liveEvents(game.events), game));
	let rows = $derived(scoreboard(game));

	/**
	 * @param {Event} event
	 */
	function close(event) {
		if (typeof onLogPanelClose === 'function') {
			onLogPanelClose(
				new ComponentEvent(
					null,
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
		}
	}

	/**
	 * Escape closes the panel.
	 * @param {KeyboardEvent} event
	 */
	const keyHandler = (event) => {
		if (event.key === 'Escape') {
			close(event);
		}
	};
</script>

<svelte:window onkeydown={keyHandler} />

<section
	aria-label="Log and scores"
	{...attr}
	class="rg-log-panel {attr.class ? attr.class : ''}">
	<div class="rg-log-panel--head">
		<Tabs
			label="Log and scores"
			tabs={[
				{ id: 'log', label: 'Log' },
				{ id: 'scores', label: 'Scores' },
			]}
			bind:value={tab} />
		<IconButton
			icon="close"
			label="Close the log"
			onIconButtonClick={close} />
	</div>
	<div
		class="rg-log-panel--body"
		role="tabpanel"
		id="{tab}-panel"
		aria-labelledby="{tab}-tab">
		{#if tab === 'log'}
			<TableLog {entries} />
		{:else}
			<ScoreBoard
				{rows}
				you={seat} />
		{/if}
	</div>
</section>

<style>
	.rg-log-panel {
		position: absolute;
		z-index: var(--layer-popover);
		top: 0;
		right: 0;
		bottom: 0;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		width: calc((100% - var(--play-gap)) / 4);
		border-left: var(--border) solid var(--line);
		background: var(--texture) var(--surface);
		box-shadow: var(--shadow-float);
	}

	.rg-log-panel--head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding-right: var(--space-5);
		border-bottom: var(--border) solid var(--line);
	}

	.rg-log-panel--body {
		display: flex;
		flex-direction: column;
		min-height: 0;
		padding: var(--space-6) 22px var(--space-8);
		overflow-y: auto;
	}
</style>
