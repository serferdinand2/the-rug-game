<!-- A dialog over a scrim, such as How to play or Table settings: a title, its content and Close; Escape and the backdrop close it, and the focus comes back. -->
<script module>
	/**
	 * Properties of the Dialog component itself.
	 * @typedef {Object} DialogOwnProps
	 * @property {string} title - The heading, which names the dialog, such as 'How to play'
	 * @property {boolean} [modal=true] - Over the whole screen on a dark scrim, with Tab kept inside; false: over its positioned parent only, on a lighter scrim, as Table settings over the board
	 * @property {'narrow' | 'wide'} [size='narrow'] - narrow: the launch column's width; wide: up to 1000px, as How to play in the game
	 * @property {import('svelte').Snippet} [children] - The content, between the title and the actions; it scrolls in its own element when the screen is short
	 * @property {import('svelte').Snippet} [actions] - The buttons at the bottom right; a gold Close by default
	 * @property {Function} [onDialogClose] - Callback fired when Close, Escape or a click on the backdrop closes the dialog
	 */

	/**
	 * Properties for the Dialog component, including any attributes for its root element, the scrim.
	 *
	 * The parent draws it while it is open, and removes it on onDialogClose. It remembers what had the focus as it
	 * opens, takes the focus into its box unless something inside already did, and gives it back when it closes.
	 * Escape is handled on the box and goes no further.
	 * @typedef {DialogOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} DialogProps
	 *
	 * @example
	 * {#if helpOpen}
	 *   <Dialog title="How to play" onDialogClose={() => (helpOpen = false)}>
	 *     <ol>…</ol>
	 *   </Dialog>
	 * {/if}
	 * <Dialog title="Table settings" modal={false} onDialogClose={close}>
	 *   …
	 *   {#snippet actions()}<Button mode="primary" onButtonClick={close}>Done</Button>{/snippet}
	 * </Dialog>
	 */
</script>

<script>
	import Button from './Button.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {DialogProps} */
	let {
		title,
		modal = true,
		size = 'narrow',
		children,
		actions,
		onDialogClose,
		...attr
	} = $props();

	const uid = $props.id();
	/** What the controls that may take the focus are, for keeping Tab inside a modal dialog. */
	const FOCUSABLE =
		'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

	/** What had the focus as the dialog opened, before anything inside could take it. */
	const opener = /** @type {HTMLElement | null} */ (
		typeof document === 'undefined' ? null : document.activeElement
	);

	/** @type {HTMLDivElement | undefined} */
	let box = $state();

	// The box takes the focus unless something inside took it first; the focus goes back to the opener on close.
	$effect(() => {
		if (box && !box.contains(document.activeElement)) {
			box.focus();
		}
	});
	$effect(() => () => {
		if (opener?.isConnected) {
			opener.focus();
		}
	});

	/**
	 * Escape closes the dialog and goes no further; in a modal dialog, Tab and Shift+Tab wrap round inside the box.
	 * @param {KeyboardEvent} event
	 */
	const boxKeydownHandler = (event) => {
		if (event.key === 'Escape') {
			event.stopPropagation();
			close(event);
		} else if (event.key === 'Tab' && modal) {
			wrap(event);
		}
	};

	/**
	 * Only a click on the backdrop itself closes the dialog.
	 * @param {MouseEvent} event
	 */
	const backdropClickHandler = (event) => {
		if (event.target === event.currentTarget) {
			close(event);
		}
	};

	/**
	 * @param {Event} event
	 */
	function close(event) {
		if (typeof onDialogClose === 'function') {
			onDialogClose(
				new ComponentEvent(
					null,
					/** @type {HTMLElement} */ (box),
					event
				)
			);
		}
	}

	/**
	 * Moves the focus from the last control to the first, or back from the first (or the box) to the last.
	 * @param {KeyboardEvent} event
	 */
	function wrap(event) {
		if (!box) {
			return;
		}
		const stops = /** @type {HTMLElement[]} */ ([
			...box.querySelectorAll(FOCUSABLE),
		]).filter(
			(element) =>
				element.tabIndex >= 0 &&
				!element.matches(':disabled') &&
				element.getClientRects().length > 0
		);
		const first = stops[0];
		const last = stops[stops.length - 1];
		const at = document.activeElement;
		if (!first || !last) {
			event.preventDefault();
			return;
		}
		if (event.shiftKey && (at === first || at === box)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && at === last) {
			event.preventDefault();
			first.focus();
		}
	}
</script>

<!-- The backdrop only closes on a pointer click; Escape and Close serve the keyboard. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	{...attr}
	class="rg-dialog {attr.class ? attr.class : ''}"
	class:rg-dialog--modeless={!modal}
	class:rg-dialog--narrow={size === 'narrow'}
	class:rg-dialog--wide={size === 'wide'}
	onclick={backdropClickHandler}>
	<div
		bind:this={box}
		class="rg-dialog--box"
		role="dialog"
		aria-modal={modal ? 'true' : 'false'}
		aria-labelledby="{uid}-title"
		tabindex="-1"
		onkeydown={boxKeydownHandler}>
		<h2
			id="{uid}-title"
			class="rg-dialog--title">
			{title}
		</h2>
		<div class="rg-dialog--body">
			{@render children?.()}
		</div>
		<div class="rg-dialog--actions">
			{#if actions}
				{@render actions()}
			{:else}
				<Button
					mode="gold"
					onButtonClick={(/** @type {ComponentEvent} */ event) =>
						close(/** @type {Event} */ (event.originalEvent))}
					>Close</Button>
			{/if}
		</div>
	</div>
</div>

<style>
	.rg-dialog {
		position: fixed;
		inset: 0;
		z-index: var(--layer-popover);
		display: grid;
		place-items: center;
		background: var(--scrim-strong);
	}

	/* Over its positioned parent only, so the rest of the screen stays in use. */
	.rg-dialog--modeless {
		position: absolute;
		background: var(--scrim);
	}

	/* A column as tall as its content, up to the screen's height less a margin; the body takes what is left. */
	.rg-dialog--box {
		display: flex;
		flex-direction: column;
		max-height: calc(100vh - 2 * var(--space-10));
		padding: var(--space-10);
		border: var(--border) solid var(--line-soft);
		border-radius: var(--radius);
		background: var(--chrome);
		box-shadow: var(--shadow-float);
	}

	/* The box itself takes the focus as it opens, for screen readers to read its title; it draws no ring. */
	.rg-dialog--box:focus {
		outline: none;
	}

	.rg-dialog--narrow .rg-dialog--box {
		width: var(--launch-width);
	}

	.rg-dialog--wide .rg-dialog--box {
		width: min(1000px, calc(100vw - 2 * var(--space-10)));
	}

	.rg-dialog--title {
		flex: none;
		margin: 0 0 var(--space-6);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
	}

	.rg-dialog--body {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		min-height: 0;
	}

	.rg-dialog--actions {
		display: flex;
		flex: none;
		justify-content: flex-end;
		margin-top: var(--space-9);
	}
</style>
