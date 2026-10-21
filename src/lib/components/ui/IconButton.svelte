<!-- A square 36px header control with a glyph: sound, history, menu or close, with the red slash when muted. -->
<script module>
	/** @typedef {'sound' | 'history' | 'menu' | 'close'} IconButtonIcon */

	/**
	 * Properties of the IconButton component itself.
	 * @typedef {Object} IconButtonOwnProps
	 * @property {IconButtonIcon} icon - The glyph: sound ♪, history ↶, menu ☰ or close ✕
	 * @property {string} label - The accessible name, such as 'Mute' or 'Menu'; also the tooltip. Keep it fixed and let muted and expanded carry the state
	 * @property {boolean} [muted] - Draws the red diagonal slash over the glyph and sets aria-pressed; leave it out for controls that do not toggle
	 * @property {boolean} [expanded] - Sets aria-expanded, for a control that opens a menu or panel
	 * @property {Function} [onIconButtonClick] - Callback fired when the control is pressed, with the icon as its value
	 */

	/**
	 * Properties for the IconButton component, including any attributes for its root button.
	 * @typedef {IconButtonOwnProps & import('svelte/elements').HTMLButtonAttributes} IconButtonProps
	 *
	 * @example
	 * <IconButton
	 *   icon="sound"
	 *   label="Mute"
	 *   muted={muted}
	 *   onIconButtonClick={() => (muted = !muted)}
	 * />
	 * <IconButton icon="menu" label="Menu" expanded={menuOpen} onIconButtonClick={() => (menuOpen = !menuOpen)} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {IconButtonProps} */
	let { icon, label, muted, expanded, onIconButtonClick, ...attr } = $props();

	/** The glyph drawn for each icon. */
	const GLYPHS = Object.freeze({
		sound: '♪',
		history: '↶',
		menu: '☰',
		close: '✕',
	});

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onIconButtonClick === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onIconButtonClick(new ComponentEvent(icon, target, event));
		}
	};
</script>

<button
	type="button"
	aria-label={label}
	title={label}
	aria-pressed={muted}
	aria-expanded={expanded}
	{...attr}
	class="rg-icon-button {attr.class ? attr.class : ''}"
	class:rg-icon-button--muted={muted}
	onclick={clickHandler}>
	<span
		class="rg-icon-button--glyph"
		aria-hidden="true">{GLYPHS[icon]}</span>
</button>

<style>
	.rg-icon-button {
		position: relative;
		display: grid;
		flex: none;
		place-items: center;
		width: var(--control-size);
		height: var(--control-size);
		padding: 0;
		border: 0;
		border-radius: var(--radius);
		background: var(--control);
		color: var(--muted);
		font-size: var(--font-size-xl);
		line-height: var(--leading-none);
		transition:
			background var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease);
	}

	.rg-icon-button:hover,
	.rg-icon-button:focus-visible {
		background: var(--raised);
		color: var(--text);
	}

	/* The note stays light under the slash, so the control still reads as sound. */
	.rg-icon-button--muted {
		color: var(--text);
	}

	.rg-icon-button--muted::after {
		content: '';
		position: absolute;
		top: 17px;
		right: 7px;
		left: 7px;
		height: 2px;
		background: var(--danger);
		box-shadow: var(--glow-danger);
		transform: rotate(-45deg);
		pointer-events: none;
	}

	.rg-icon-button--glyph {
		display: block;
	}
</style>
