<!-- How to play before a game (#25): creating, joining and setting up a table. Rules help comes with the game screen. -->
<script module>
	/**
	 * Properties of the HelpPanel screen part itself.
	 * @typedef {Object} HelpPanelOwnProps
	 * @property {Function} [onHelpPanelClose] - Callback fired when Close, Escape or the backdrop closes the panel
	 */

	/**
	 * Properties for HelpPanel, including any attributes for its root element, Dialog's scrim.
	 * @typedef {HelpPanelOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} HelpPanelProps
	 *
	 * @example
	 * {#if helpOpen}<HelpPanel onHelpPanelClose={() => (helpOpen = false)} />{/if}
	 */
</script>

<script>
	import Dialog from '../lib/components/ui/Dialog.svelte';
	import { ComponentEvent } from '../lib/component-event.js';

	/** @type {HelpPanelProps} */
	let { onHelpPanelClose, ...attr } = $props();

	/**
	 * Close, Escape or the backdrop closed the dialog.
	 * @param {ComponentEvent} event
	 */
	const dialogCloseHandler = (event) => {
		if (typeof onHelpPanelClose === 'function') {
			onHelpPanelClose(
				new ComponentEvent(null, event.target, event.originalEvent)
			);
		}
	};
</script>

<Dialog
	{...attr}
	class="rg-help-panel {attr.class ? attr.class : ''}"
	title="How to play"
	onDialogClose={dialogCloseHandler}>
	<ol class="rg-help-panel--steps">
		<li>Enter your name, or leave it empty for a generated one.</li>
		<li>
			<strong>Create a table</strong>, then share its 8-character code
			with your friends. They join with <strong>Join table</strong>, or
			from the Open tables list.
		</li>
		<li>
			In the lobby, the host picks the rules, the turn timer, undo and any
			variants. Everyone can mark themselves ready.
		</li>
		<li>
			For one screen, switch the table to <strong>Local mode</strong> and add
			each player by name.
		</li>
		<li>
			The host starts the game. Each player is dealt two civilizations and
			keeps one.
		</li>
	</ol>
</Dialog>

<style>
	.rg-help-panel--steps {
		display: grid;
		gap: var(--space-5);
		margin: 0;
		padding-left: var(--space-10);
		color: var(--muted);
		line-height: var(--leading-normal);
	}

	.rg-help-panel--steps strong {
		color: var(--text);
	}
</style>
