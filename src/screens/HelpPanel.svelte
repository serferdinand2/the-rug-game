<!-- How to play before a game (#25): creating, joining and setting up a table. Rules help comes with the game screen. -->
<script module>
	/**
	 * Properties of the HelpPanel screen part itself.
	 * @typedef {Object} HelpPanelOwnProps
	 * @property {Function} [onHelpPanelClose] - Callback fired when Close, Escape or the backdrop closes the panel
	 */

	/**
	 * Properties for HelpPanel, including any attributes for its root element.
	 * @typedef {HelpPanelOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} HelpPanelProps
	 *
	 * @example
	 * {#if helpOpen}<HelpPanel onHelpPanelClose={() => (helpOpen = false)} />{/if}
	 */
</script>

<script>
	import Button from '../lib/components/ui/Button.svelte';
	import { ComponentEvent } from '../lib/component-event.js';

	/** @type {HelpPanelProps} */
	let { onHelpPanelClose, ...attr } = $props();

	/** @type {HTMLElement | undefined} */
	let dialog = $state();

	$effect(() => {
		dialog?.querySelector('button')?.focus();
	});

	/**
	 * @param {Event} event
	 */
	function close(event) {
		if (typeof onHelpPanelClose === 'function') {
			onHelpPanelClose(
				new ComponentEvent(
					null,
					/** @type {HTMLElement} */ (dialog),
					event
				)
			);
		}
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	const windowKeydownHandler = (event) => {
		if (event.key === 'Escape') {
			close(event);
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const backdropClickHandler = (event) => {
		if (event.target === event.currentTarget) {
			close(event);
		}
	};
</script>

<svelte:window onkeydown={windowKeydownHandler} />

<!-- The backdrop only closes on a pointer click; Escape and Close serve the keyboard. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	{...attr}
	class="rg-help-panel {attr.class ? attr.class : ''}"
	onclick={backdropClickHandler}>
	<div
		bind:this={dialog}
		class="rg-help-panel--dialog"
		role="dialog"
		aria-modal="true"
		aria-labelledby="rg-help-panel-title">
		<h2
			id="rg-help-panel-title"
			class="rg-help-panel--title">
			How to play
		</h2>
		<ol class="rg-help-panel--steps">
			<li>Enter your name, or leave it empty for a generated one.</li>
			<li>
				<strong>Create a table</strong>, then share its 8-character code
				with your friends. They join with <strong>Join table</strong>,
				or from the Open tables list.
			</li>
			<li>
				In the lobby, the host picks the rules, the turn timer, undo and
				any variants. Everyone can mark themselves ready.
			</li>
			<li>
				For one screen, switch the table to <strong>Local mode</strong>
				and add each player by name.
			</li>
			<li>
				The host starts the game. Each player is dealt two civilizations
				and keeps one.
			</li>
		</ol>
		<div class="rg-help-panel--actions">
			<Button
				mode="gold"
				onButtonClick={(/** @type {any} */ event) =>
					close(event.originalEvent)}>Close</Button>
		</div>
	</div>
</div>

<style>
	.rg-help-panel {
		position: fixed;
		inset: 0;
		z-index: var(--layer-popover);
		display: grid;
		place-items: center;
		background: color-mix(in srgb, var(--ink) 70%, transparent);
	}

	.rg-help-panel--dialog {
		width: var(--launch-width);
		padding: var(--space-10);
		border: var(--border) solid var(--line-soft);
		border-radius: var(--radius);
		background: var(--chrome);
		box-shadow: var(--shadow-float);
	}

	.rg-help-panel--title {
		margin: 0 0 var(--space-6);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
	}

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

	.rg-help-panel--actions {
		display: flex;
		justify-content: flex-end;
		margin-top: var(--space-9);
	}
</style>
