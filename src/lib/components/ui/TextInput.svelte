<!-- A labelled text field: the launch page's name and table-code inputs, or the lobby's small gold read-only code. -->
<script module>
	/**
	 * Properties of the TextInput component itself.
	 * @typedef {Object} TextInputOwnProps
	 * @property {string} [label] - The field's name, such as 'Your name'; shown above the input unless hideLabel
	 * @property {boolean} [hideLabel=false] - Name the input for assistive technology only, as the lobby's code field does
	 * @property {string} [value=''] - The text; bindable
	 * @property {string} [placeholder] - Text shown while the field is empty
	 * @property {string} [name] - The input's form name
	 * @property {import('svelte/elements').HTMLInputAttributes['autocomplete']} [autocomplete] - The browser's autofill hint, such as 'nickname' or 'off'
	 * @property {number} [maxlength] - The most characters allowed
	 * @property {boolean} [readonly=false] - Shown but not editable, such as the lobby's table code
	 * @property {string} [hint] - A short muted note under the input
	 * @property {string} [error] - A validation message under the input; also marks the input invalid
	 * @property {'medium' | 'small'} [size='medium'] - medium: 44px, the launch page; small: 30px by 105px, gold and bold, the lobby's table code
	 * @property {Function} [onTextInputInput] - Callback fired on every keystroke, with the new text
	 * @property {Function} [onTextInputChange] - Callback fired when an edit is committed, with the text
	 * @property {Function} [onTextInputFocus] - Callback fired when the input takes the focus, with the text; its target is the input, so the lobby's code can select itself
	 */

	/**
	 * Properties for the TextInput component, including any attributes for its root element.
	 * @typedef {TextInputOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TextInputProps
	 *
	 * @example
	 * <TextInput
	 *   label="Table code"
	 *   placeholder="8-character code"
	 *   maxlength={8}
	 *   autocomplete="off"
	 *   error={codeError}
	 *   bind:value={code}
	 * />
	 * <TextInput label="Table code" hideLabel size="small" readonly value="DAWN2048" />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {TextInputProps} */
	let {
		label,
		hideLabel = false,
		value = $bindable(''),
		placeholder,
		name,
		autocomplete,
		maxlength,
		readonly = false,
		hint,
		error,
		size = 'medium',
		onTextInputInput,
		onTextInputChange,
		onTextInputFocus,
		...attr
	} = $props();

	const uid = $props.id();

	let describedBy = $derived(
		[hint ? `${uid}-hint` : '', error ? `${uid}-error` : '']
			.filter(Boolean)
			.join(' ') || undefined
	);

	/**
	 * @param {Event} event
	 */
	const inputHandler = (event) => {
		const target = /** @type {HTMLInputElement} */ (event.currentTarget);
		value = target.value;
		if (typeof onTextInputInput === 'function') {
			onTextInputInput(new ComponentEvent(value, target, event));
		}
	};

	/**
	 * @param {Event} event
	 */
	const changeHandler = (event) => {
		if (typeof onTextInputChange === 'function') {
			const target = /** @type {HTMLInputElement} */ (
				event.currentTarget
			);
			onTextInputChange(new ComponentEvent(target.value, target, event));
		}
	};

	/**
	 * @param {FocusEvent} event
	 */
	const focusHandler = (event) => {
		if (typeof onTextInputFocus === 'function') {
			const target = /** @type {HTMLInputElement} */ (
				event.currentTarget
			);
			onTextInputFocus(new ComponentEvent(target.value, target, event));
		}
	};
</script>

<div
	{...attr}
	class="rg-text-input rg-text-input--{size} {attr.class ? attr.class : ''}">
	{#if label && !hideLabel}
		<label
			class="rg-text-input--label"
			for="{uid}-input">{label}</label>
	{/if}
	<input
		class="rg-text-input--field"
		id="{uid}-input"
		type="text"
		{value}
		{placeholder}
		{name}
		{autocomplete}
		{maxlength}
		{readonly}
		aria-label={hideLabel ? label : undefined}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
		oninput={inputHandler}
		onchange={changeHandler}
		onfocus={focusHandler} />
	{#if hint}
		<p
			class="rg-text-input--hint"
			id="{uid}-hint">
			{hint}
		</p>
	{/if}
	<!-- Always present, so screen readers announce a message when it appears. -->
	<p
		class="rg-text-input--error"
		id="{uid}-error"
		aria-live="polite">
		{error ?? ''}
	</p>
</div>

<style>
	.rg-text-input {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.rg-text-input--small {
		display: inline-flex;
		width: 105px;
	}

	.rg-text-input--label {
		margin-bottom: var(--space-5);
		color: var(--text);
		font-size: var(--font-size-md);
		font-weight: var(--weight-bold);
		line-height: var(--leading-snug);
	}

	.rg-text-input--field {
		width: 100%;
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--text);
		transition:
			border-color var(--duration-fast) var(--ease),
			box-shadow var(--duration-fast) var(--ease);
	}

	.rg-text-input--field::placeholder {
		/* The mockup's grey, lifted just enough to read at 4.5:1 on ink. */
		color: color-mix(in srgb, var(--faint) 75%, var(--muted));
		opacity: 1;
	}

	.rg-text-input--field:focus {
		border-color: var(--gold);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--gold) 33%, transparent);
	}

	.rg-text-input--medium .rg-text-input--field {
		height: var(--input-height);
		padding: var(--space-5) var(--space-6);
		letter-spacing: 0.04em;
	}

	.rg-text-input--small .rg-text-input--field {
		height: var(--input-height-small);
		padding: var(--space-2) var(--space-4);
		color: var(--gold);
		font-size: var(--font-size-sm);
		font-weight: var(--weight-bold);
		letter-spacing: var(--letter-spacing-caps);
	}

	/* The lobby's read-only code keeps its line border on focus and shows only the page's focus outline, issue 102. */
	.rg-text-input--small .rg-text-input--field:focus {
		border-color: var(--line);
		box-shadow: none;
	}

	.rg-text-input--hint {
		margin: var(--space-3) 0 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-text-input--error {
		margin: var(--space-3) 0 0;
		color: color-mix(in srgb, var(--gold) 70%, var(--text));
		font-size: var(--font-size-sm);
	}

	.rg-text-input--error:empty {
		margin: 0;
	}
</style>
