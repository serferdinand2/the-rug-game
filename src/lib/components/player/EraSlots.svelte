<!-- The four era slots of the tapestry strip: Maker of Fire is printed until a card covers it; other slots show their top card, and a card can be chosen to look at. -->
<script module>
	/**
	 * Properties of the EraSlots component itself.
	 * @typedef {Object} EraSlotsOwnProps
	 * @property {import('../../area/income.js').EraSlotView[]} slots - The four era slots
	 * @property {number | null} [selected=null] - The era whose card is on show; bindable
	 * @property {Function} [onEraSlotsSelect] - Callback fired with the chosen era (a ComponentEvent) when a slot with a card is chosen
	 */

	/**
	 * Properties for the EraSlots component, including any attributes for its root element.
	 * @typedef {EraSlotsOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} EraSlotsProps
	 *
	 * @example
	 * <EraSlots slots={eraSlots(seat)} bind:selected={era} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { roman } from '../../ui.js';

	/** @type {EraSlotsProps} */
	let {
		slots,
		selected = $bindable(null),
		onEraSlotsSelect,
		...attr
	} = $props();

	/**
	 * @param {MouseEvent} event
	 * @param {number} era
	 */
	const slotClickHandler = (event, era) => {
		selected = era;
		if (typeof onEraSlotsSelect === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onEraSlotsSelect(new ComponentEvent(era, target, event));
		}
	};
</script>

<div
	role="group"
	aria-label="Your eras"
	{...attr}
	class="rg-era-slots {attr.class ? attr.class : ''}">
	{#each slots as slot (slot.era)}
		{@const text =
			slot.card ?? (slot.faceDown ? 'Face-down card' : 'Not yet chosen')}
		{#if slot.era === 1 && slot.id === null}
			<div class="rg-era-slots--slot rg-era-slots--printed">
				<b>Era {roman(slot.era)}</b>
				<span>{text}</span>
			</div>
		{:else}
			<button
				type="button"
				class="rg-era-slots--slot"
				class:rg-era-slots--card={slot.card !== null}
				data-active={slot.active}
				aria-pressed={selected === slot.era}
				disabled={slot.card === null}
				onclick={(event) => slotClickHandler(event, slot.era)}>
				<b>Era {roman(slot.era)}{slot.active ? ' · Active' : ''}</b>
				<span>{text}</span>
			</button>
		{/if}
	{/each}
</div>

<style>
	.rg-era-slots {
		display: grid;
		gap: var(--space-3);
	}

	.rg-era-slots--slot {
		display: grid;
		grid-template-columns: 90px 1fr;
		align-items: center;
		gap: var(--space-4);
		width: 100%;
		min-height: 50px;
		padding: var(--space-3) var(--space-5);
		border: var(--border) solid transparent;
		background: var(--raised);
		text-align: left;
		cursor: pointer;
	}

	.rg-era-slots--slot b {
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xs) / var(--leading-tight)
			var(--font-body);
	}

	.rg-era-slots--slot span {
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-tight)
			var(--font-body);
	}

	.rg-era-slots--card span {
		font-family: var(--font-title);
	}

	.rg-era-slots--slot[data-active='true'] {
		border-color: var(--bronze);
	}

	.rg-era-slots--slot[aria-pressed='true'] {
		background: color-mix(in srgb, var(--gold) 16%, var(--raised));
	}

	button.rg-era-slots--slot:hover:not(:disabled) {
		outline: var(--border) solid var(--gold);
		outline-offset: -1px;
	}

	.rg-era-slots--slot:disabled {
		cursor: default;
		opacity: 0.68;
	}

	.rg-era-slots--printed {
		cursor: default;
	}

	.rg-era-slots--printed span {
		color: var(--military);
		font-family: var(--font-title);
	}
</style>
