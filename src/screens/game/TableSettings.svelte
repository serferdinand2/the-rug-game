<!-- The table settings during a game (#29 design §9, from #24): the host changes the turn timer and undo, as in the lobby. -->
<script module>
	/**
	 * Properties of the TableSettings screen part itself.
	 * @typedef {Object} TableSettingsOwnProps
	 * @property {import('../../lib/game.svelte.js').GameStore} store - Its room's timer and undo, and the config's timers
	 * @property {Function} [onTableSettingsClose] - Callback fired when Done is pressed or Escape
	 */

	/**
	 * Properties for TableSettings, including any attributes for its root element.
	 * @typedef {TableSettingsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TableSettingsProps
	 *
	 * @example
	 * <TableSettings {store} onTableSettingsClose={() => (settingsOpen = false)} />
	 */
</script>

<script>
	import Button from '../../lib/components/ui/Button.svelte';
	import PlaySettings from '../../lib/components/lobby/PlaySettings.svelte';
	import { ComponentEvent } from '../../lib/component-event.js';

	/** @type {TableSettingsProps} */
	let { store, onTableSettingsClose, ...attr } = $props();

	const uid = $props.id();

	/** @type {HTMLDivElement | undefined} */
	let panel = $state();

	// The dialog takes the focus when it opens, and gives it back to where it was when it closes.
	$effect(() => {
		const before = /** @type {HTMLElement | null} */ (
			document.activeElement
		);
		panel?.focus();
		return () => before?.focus?.();
	});

	/**
	 * @param {Event} event
	 */
	function close(event) {
		if (typeof onTableSettingsClose === 'function') {
			onTableSettingsClose(
				new ComponentEvent(
					null,
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
		}
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	const keyHandler = (event) => {
		if (event.key === 'Escape') {
			close(event);
		}
	};
</script>

<svelte:window onkeydown={keyHandler} />

<div
	{...attr}
	class="rg-table-settings {attr.class ? attr.class : ''}">
	<div
		bind:this={panel}
		class="rg-table-settings--panel"
		role="dialog"
		aria-modal="false"
		aria-labelledby="{uid}-title"
		tabindex="-1">
		<h2 id="{uid}-title">Table settings</h2>
		<p>Changes apply at once. A timer change restarts every clock.</p>
		<PlaySettings
			timers={store.config?.timers ?? [0]}
			timer={store.room.timer}
			undo={store.room.undo}
			onPlaySettingsChange={(/** @type {ComponentEvent} */ event) =>
				store.settings(event.value)} />
		<div class="rg-table-settings--actions">
			<Button
				mode="primary"
				onButtonClick={close}>Done</Button>
		</div>
	</div>
</div>

<style>
	.rg-table-settings {
		position: absolute;
		z-index: var(--layer-popover);
		inset: 0;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, var(--ink) 52%, transparent);
	}

	.rg-table-settings--panel {
		display: grid;
		outline: none;
		gap: var(--space-6);
		width: min(560px, 100%);
		padding: var(--space-9) var(--space-10);
		border: var(--border) solid var(--line);
		background: var(--texture) var(--chrome);
		box-shadow: var(--shadow-float);
	}

	.rg-table-settings--panel h2 {
		margin: 0;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-3xl) / var(--leading-tight)
			var(--font-body);
	}

	.rg-table-settings--panel p {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-table-settings--actions {
		display: flex;
		justify-content: flex-end;
	}
</style>
