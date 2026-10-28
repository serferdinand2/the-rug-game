<!-- DiceTray: a roll over the middle of the screen for the whole table (#61); a batch plays one roll after another, then fades. -->
<script module>
	/** How long the dice tumble, and how long they hold their faces, in milliseconds. */
	export const TUMBLE_MS = 1000;
	export const HOLD_MS = 1500;

	/**
	 * Properties of the DiceTray component itself.
	 * @typedef {Object} DiceTrayOwnProps
	 * @property {import('../../dice.js').Roll[]} rolls - The batch's rolls, in order (dice.js rollsOf)
	 * @property {number} batch - A new value plays `rolls` from the start; a refresh keeps it, so nothing replays
	 * @property {Function} [onDiceTrayDone] - Callback fired when a batch has played or been dismissed
	 */

	/**
	 * Properties for the DiceTray component, including any attributes for its root element.
	 * @typedef {DiceTrayOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} DiceTrayProps
	 *
	 * @example
	 * <DiceTray rolls={rollsOf(store.fresh, game, seat)} batch={store.freshCount} />
	 */
</script>

<script>
	import { untrack } from 'svelte';
	import Die from './Die.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {DiceTrayProps} */
	let { rolls, batch, onDiceTrayDone, ...attr } = $props();

	/** @type {import('../../dice.js').Roll[]} The batch on show, kept while later props change */
	let playing = $state([]);
	/** @type {number | null} The roll on show, by index */
	let current = $state(null);
	let rolling = $state(false);
	let spoken = $state('');
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;
	/** @type {HTMLElement | undefined} The live region, always there, so the done event has an element */
	let region = $state();
	/** The batch already played, so a new mount with the same batch plays nothing. */
	let started = untrack(() => batch);

	const still = () =>
		typeof window !== 'undefined' &&
		Boolean(
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
		);

	/** Ends the batch: the tray goes, and the callback fires. */
	function finish() {
		clearTimeout(timer);
		const was = current !== null;
		current = null;
		rolling = false;
		if (was && region && typeof onDiceTrayDone === 'function') {
			onDiceTrayDone(new ComponentEvent(null, region));
		}
	}

	/**
	 * Plays one roll: it tumbles, lands and holds, then the next plays.
	 * @param {number} index
	 */
	function play(index) {
		if (index >= playing.length) {
			finish();
			return;
		}
		current = index;
		const tumble = still() ? 0 : TUMBLE_MS;
		rolling = tumble > 0;
		timer = setTimeout(() => {
			rolling = false;
			spoken = playing[index].spoken;
			timer = setTimeout(() => play(index + 1), HOLD_MS);
		}, tumble);
	}

	$effect(() => {
		const next = batch;
		if (next === started) {
			return;
		}
		started = next;
		const batchRolls = untrack(() => rolls);
		if (batchRolls.length === 0) {
			return;
		}
		clearTimeout(timer);
		playing = batchRolls;
		play(0);
	});
	$effect(() => () => clearTimeout(timer));

	/**
	 * Escape ends the batch, and closes nothing else while the tray is up.
	 * @param {KeyboardEvent} event
	 */
	const keyHandler = (event) => {
		if (event.key === 'Escape' && current !== null) {
			event.stopPropagation();
			finish();
		}
	};
</script>

<svelte:window onkeydowncapture={keyHandler} />

<p
	bind:this={region}
	class="rg-dice-tray--spoken"
	role="status">
	{spoken}
</p>
{#if current !== null && playing[current]}
	{@const roll = playing[current]}
	<div
		role="presentation"
		{...attr}
		class="rg-dice-tray {attr.class ? attr.class : ''}"
		class:rg-dice-tray--bust={roll.bust}
		data-roll={roll.id}
		onclick={finish}>
		<div class="rg-dice-tray--dice">
			{#each roll.dice as rolled, index (`${roll.id}-${index}`)}
				<Die
					die={rolled.die}
					face={rolled.face}
					size={88}
					{rolling} />
			{/each}
		</div>
		<p class="rg-dice-tray--caption">{roll.caption}</p>
	</div>
{/if}

<style>
	.rg-dice-tray {
		position: fixed;
		z-index: var(--layer-tray);
		top: 50%;
		left: 50%;
		display: grid;
		justify-items: center;
		gap: var(--space-6);
		min-width: 280px;
		padding: var(--space-8) var(--space-10);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background:
			linear-gradient(
				color-mix(in srgb, var(--ink) 60%, transparent),
				color-mix(in srgb, var(--ink) 60%, transparent)
			),
			var(--texture) var(--chrome);
		box-shadow: var(--shadow-float);
		transform: translate(-50%, -50%);
		cursor: pointer;
		animation: rg-dice-tray-in var(--duration-fast) var(--ease);
	}

	.rg-dice-tray--dice {
		display: flex;
		gap: var(--space-8);
	}

	.rg-dice-tray--caption {
		margin: 0;
		color: var(--text);
		font-size: var(--font-size-md);
		font-weight: var(--weight-bold);
	}

	.rg-dice-tray--bust .rg-dice-tray--caption {
		color: var(--danger);
	}

	/* Words for screen readers only. */
	.rg-dice-tray--spoken {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: 0;
		overflow: hidden;
		clip-path: inset(50%);
	}

	@keyframes rg-dice-tray-in {
		from {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-dice-tray {
			animation: none;
		}
	}
</style>
