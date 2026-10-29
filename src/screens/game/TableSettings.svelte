<!-- The table settings during a game (#29 design §9, from #24): the host changes the turn timer and undo, as in the lobby. -->
<script module>
	/**
	 * Properties of the TableSettings screen part itself.
	 * @typedef {Object} TableSettingsOwnProps
	 * @property {import('../../lib/game.svelte.js').GameStore} store - Its room's timer and undo, and the config's timers
	 * @property {Function} [onTableSettingsClose] - Callback fired when Done, Escape or the backdrop closes the settings
	 */

	/**
	 * Properties for TableSettings, including any attributes for its root element, Dialog's scrim.
	 * @typedef {TableSettingsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TableSettingsProps
	 *
	 * @example
	 * <TableSettings {store} onTableSettingsClose={() => (settingsOpen = false)} />
	 */
</script>

<script>
	import Button from '../../lib/components/ui/Button.svelte';
	import Dialog from '../../lib/components/ui/Dialog.svelte';
	import PlaySettings from '../../lib/components/lobby/PlaySettings.svelte';
	import { ComponentEvent } from '../../lib/component-event.js';

	/** @type {TableSettingsProps} */
	let { store, onTableSettingsClose, ...attr } = $props();

	/**
	 * Done, Escape or the backdrop closed the settings.
	 * @param {ComponentEvent} event
	 */
	const closeHandler = (event) => {
		if (typeof onTableSettingsClose === 'function') {
			onTableSettingsClose(
				new ComponentEvent(null, event.target, event.originalEvent)
			);
		}
	};
</script>

<!-- Over the board only, so the header and footer stay in use. -->
<Dialog
	{...attr}
	class="rg-table-settings {attr.class ? attr.class : ''}"
	title="Table settings"
	modal={false}
	onDialogClose={closeHandler}>
	<div class="rg-table-settings--content">
		<p>Changes apply at once. A timer change restarts every clock.</p>
		<PlaySettings
			timers={store.config?.timers ?? [0]}
			timer={store.room.timer}
			undo={store.room.undo}
			onPlaySettingsChange={(/** @type {ComponentEvent} */ event) =>
				store.settings(event.value)} />
	</div>
	{#snippet actions()}
		<Button
			mode="primary"
			onButtonClick={closeHandler}>Done</Button>
	{/snippet}
</Dialog>

<style>
	.rg-table-settings--content {
		display: grid;
		gap: var(--space-6);
	}

	.rg-table-settings--content p {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}
</style>
