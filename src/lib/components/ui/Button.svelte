<!-- A button in one of the game's six looks: primary, secondary, gold, confirm, success or danger. -->
<script module>
	/** @typedef {'primary' | 'secondary' | 'gold' | 'confirm' | 'success' | 'danger'} ButtonMode */

	/**
	 * Properties of the Button component itself.
	 * @typedef {Object} ButtonOwnProps
	 * @property {ButtonMode} [mode='secondary'] - primary: the green commit action; secondary: raised, as Take income; gold: create, join, ready, take the seat; confirm: solid gold, a decision panel's Confirm (the play mockup's #decision-confirm); success: start game; danger: leave table
	 * @property {'small' | 'medium' | 'large'} [size='medium'] - 30, 36 or 44 pixels tall
	 * @property {boolean} [block=false] - Fill the container's width
	 * @property {boolean} [selected] - A toggle's pressed state, such as I'm ready; sets aria-pressed
	 * @property {string} [tint] - A track's colour as a token reference from trackColor, such as 'var(--military)': primary takes 60% of it over the text colour, as the optional footer's commit button; confirm takes 65% with a border of the colour itself while it can be pressed, as a track decision's Confirm (#117); other modes ignore it
	 * @property {import('svelte').Snippet} [children] - The label
	 * @property {Function} [onButtonClick] - Callback fired when the button is pressed
	 */

	/**
	 * Properties for the Button component, including any attributes for its root button.
	 * @typedef {ButtonOwnProps & import('svelte/elements').HTMLButtonAttributes} ButtonProps
	 *
	 * @example
	 * <Button mode="gold" size="large" block onButtonClick={() => createTable()}>
	 *   Create a table
	 * </Button>
	 *
	 * @example
	 * <Button mode="confirm" tint={trackColor('military')}>Confirm choice</Button>
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {ButtonProps} */
	let {
		mode = 'secondary',
		size = 'medium',
		block = false,
		selected,
		tint,
		children,
		onButtonClick,
		...attr
	} = $props();

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onButtonClick === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onButtonClick(new ComponentEvent(undefined, target, event));
		}
	};
</script>

<button
	type="button"
	aria-pressed={selected}
	{...attr}
	class="rg-button rg-button--{mode} rg-button--{size} {attr.class
		? attr.class
		: ''}"
	class:rg-button--block={block}
	class:rg-button--selected={selected}
	class:rg-button--tinted={Boolean(tint)}
	style:--rg-button-tint={tint}
	onclick={clickHandler}>
	{@render children?.()}
</button>

<style>
	.rg-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--raised);
		color: var(--text);
		font-weight: var(--weight-bold);
		letter-spacing: var(--letter-spacing-button);
		white-space: nowrap;
		transition:
			background var(--duration-fast) var(--ease),
			border-color var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease),
			box-shadow var(--duration-fast) var(--ease);
	}

	.rg-button--small {
		min-height: var(--input-height-small);
		padding: var(--space-2) var(--space-4);
		font-size: var(--font-size-xs);
	}

	.rg-button--medium {
		min-height: var(--control-size);
		padding: var(--space-3) var(--space-6);
		font-size: var(--font-size-sm);
	}

	.rg-button--large {
		min-height: var(--input-height);
		padding: var(--space-5) var(--space-7);
		font-size: var(--font-size-base);
	}

	.rg-button--block {
		width: 100%;
	}

	.rg-button--secondary:hover {
		border-color: var(--gold);
		color: var(--gold);
	}

	.rg-button--primary {
		border-color: var(--action);
		background: var(--action);
		color: var(--ink);
	}

	.rg-button--primary:hover {
		background: color-mix(in srgb, var(--action) 88%, var(--text));
	}

	.rg-button--gold {
		border-color: color-mix(in srgb, var(--gold) 65%, var(--ink));
		background: color-mix(in srgb, var(--gold) 22%, var(--ink));
		color: color-mix(in srgb, var(--gold) 60%, var(--text));
	}

	.rg-button--gold:hover,
	.rg-button--gold.rg-button--selected {
		border-color: var(--gold);
		background: color-mix(in srgb, var(--gold) 32%, var(--ink));
		color: color-mix(in srgb, var(--gold) 35%, var(--text));
	}

	.rg-button--gold.rg-button--selected {
		box-shadow: var(--glow-gold-strong);
	}

	.rg-button--confirm {
		border-color: var(--gold);
		background: var(--gold);
		color: var(--ink);
	}

	.rg-button--confirm:hover {
		background: color-mix(in srgb, var(--gold) 88%, var(--text));
	}

	/* A track's tint (issue 117): primary is the optional footer's commit button, as the mockup's .turnbar.optional
	   .btn.primary; confirm is a track decision's Confirm, as its [data-track] #decision-confirm. */
	.rg-button--tinted.rg-button--primary {
		--rg-button-tint-fill: color-mix(
			in srgb,
			var(--rg-button-tint) 60%,
			var(--text)
		);
		border-color: var(--rg-button-tint-fill);
		background: var(--rg-button-tint-fill);
	}

	.rg-button--tinted.rg-button--primary:hover {
		background: color-mix(
			in srgb,
			var(--rg-button-tint-fill) 88%,
			var(--text)
		);
	}

	/* A Confirm that cannot be pressed yet stays gold. */
	.rg-button--tinted.rg-button--confirm:not(:disabled) {
		border-color: var(--rg-button-tint);
		background: color-mix(in srgb, var(--rg-button-tint) 65%, var(--text));
	}

	.rg-button--tinted.rg-button--confirm:not(:disabled):hover {
		background: color-mix(in srgb, var(--rg-button-tint) 55%, var(--text));
	}

	.rg-button--success {
		border-color: color-mix(in srgb, var(--action) 75%, var(--ink));
		background: color-mix(in srgb, var(--action) 30%, var(--ink));
		color: color-mix(in srgb, var(--ok) 60%, var(--text));
	}

	.rg-button--success:hover {
		border-color: var(--ok);
		background: color-mix(in srgb, var(--action) 42%, var(--ink));
	}

	.rg-button--danger {
		border-color: color-mix(in srgb, var(--danger) 65%, var(--ink));
		background: color-mix(in srgb, var(--danger) 20%, var(--ink));
		color: color-mix(in srgb, var(--danger) 55%, var(--text));
	}

	.rg-button--danger:hover {
		border-color: var(--danger);
		background: color-mix(in srgb, var(--danger) 30%, var(--ink));
	}

	.rg-button:disabled {
		opacity: var(--opacity-disabled);
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Not choosable yet, but still focusable and clickable, so the screen can say why (#97). */
	.rg-button[aria-disabled='true'] {
		opacity: var(--opacity-disabled);
		cursor: default;
	}
</style>
