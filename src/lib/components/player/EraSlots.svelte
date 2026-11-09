<!-- The four era slots of the tapestry strip: Maker of Fire is printed until a card covers it; other slots show their top card, and a card can be chosen to look at; a card played into a slot slides in (#175). -->
<script module>
	/**
	 * Properties of the EraSlots component itself.
	 * @typedef {Object} EraSlotsOwnProps
	 * @property {import('../../area/income.js').EraSlotView[]} slots - The four era slots, and with F&F the overlay's (#39)
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
	import { rise } from '../../transitions.js';
	import { CARD_SIZES } from '../../cards/card-sizes.js';
	import ScaledCard from './ScaledCard.svelte';
	import TapestryCardBack from './TapestryCardBack.svelte';

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
		{#if slot.overlay}
			<!-- F&F's overlay (#39), awaiting review: what waits for income turn 5. -->
			<div class="rg-era-slots--slot rg-era-slots--overlay">
				<b>{slot.heading}</b>
				<span>{slot.text}</span>
			</div>
		{:else if slot.era === 1 && slot.card === 'Maker of Fire'}
			<div class="rg-era-slots--slot rg-era-slots--printed">
				<b>{slot.heading}</b>
				<span>{slot.text}</span>
			</div>
		{:else}
			<button
				type="button"
				class="rg-era-slots--slot"
				class:rg-era-slots--card={slot.card !== null || slot.faceDown}
				data-active={slot.active}
				aria-pressed={selected === slot.era}
				disabled={slot.card === null && !slot.faceDown}
				onclick={(event) => slotClickHandler(event, slot.era)}
				in:rise={{ x: -16, y: 0 }}>
				<b>{slot.heading}</b>
				{#if slot.faceDown}
					<ScaledCard
						scale={0.08}
						{...CARD_SIZES.tapestry}>
						<TapestryCardBack />
					</ScaledCard>
				{:else}
					{#key slot.card}
						<span in:rise={{ x: -16, y: 0 }}>{slot.text}</span>
					{/key}
				{/if}
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

	.rg-era-slots--overlay {
		border-style: dashed;
		border-color: var(--fantasies-futures);
		cursor: default;
	}

	.rg-era-slots--overlay span {
		color: var(--text);
	}

	.rg-era-slots--printed span {
		color: var(--military);
		font-family: var(--font-title);
	}
</style>
