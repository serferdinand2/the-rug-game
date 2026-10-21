<!-- A short status message in a gold-bordered box that fades in at the bottom of the screen and is read out politely. -->
<script module>
	/**
	 * Properties of the Toast component itself.
	 * @typedef {Object} ToastOwnProps
	 * @property {string} [message=''] - The text, such as 'Code copied.'
	 * @property {boolean} [visible=false] - Fades the message in; the parent hides it again, usually after a few seconds
	 * @property {'fixed' | 'inline'} [placement='fixed'] - fixed: centred at the bottom of the viewport; inline: in the page's flow, as on the library page
	 */

	/**
	 * Properties for the Toast component, including any attributes for its root element.
	 * @typedef {ToastOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} ToastProps
	 *
	 * @example
	 * <Toast message={toast} visible={Boolean(toast)} />
	 */
</script>

<script>
	/** @type {ToastProps} */
	let {
		message = '',
		visible = false,
		placement = 'fixed',
		...attr
	} = $props();
</script>

<!-- The live region stays in the page; only its box fades, so a new message is announced when it appears. -->
<div
	role="status"
	aria-live="polite"
	{...attr}
	class="rg-toast rg-toast--{placement} {attr.class ? attr.class : ''}"
	class:rg-toast--visible={visible}>
	<span class="rg-toast--box">{message}</span>
</div>

<style>
	.rg-toast {
		pointer-events: none;
	}

	.rg-toast--fixed {
		position: fixed;
		z-index: var(--layer-popover);
		bottom: 22px;
		left: 50%;
		transform: translateX(-50%);
	}

	.rg-toast--inline {
		display: inline-block;
	}

	.rg-toast--box {
		display: block;
		padding: var(--space-5) var(--space-8);
		border: var(--border) solid var(--gold);
		border-radius: var(--radius);
		background: var(--chrome);
		color: var(--text);
		opacity: 0;
		visibility: hidden;
		/* Hidden only after the fade, so assistive technology never reads a stale message. */
		transition:
			opacity var(--duration-fast) var(--ease),
			visibility 0s linear var(--duration-fast);
	}

	.rg-toast--visible .rg-toast--box {
		opacity: 1;
		visibility: visible;
		transition:
			opacity var(--duration-fast) var(--ease),
			visibility 0s;
	}
</style>
