<!-- The turn clock in the game header: a player's colour mark and the time left, red in the last seconds. -->
<script module>
	/**
	 * Properties of the TurnClock component itself.
	 * @typedef {Object} TurnClockOwnProps
	 * @property {import('../../ui.js').Seat} seat - The seat the clock belongs to; sets the colour mark
	 * @property {number} ms - Milliseconds left; the parent ticks it
	 * @property {boolean} [running=true] - false shows the clock paused and muted
	 * @property {boolean} [warn=false] - The viewer's own clock in its last 5 seconds: red, and read in words
	 */

	/**
	 * Properties for the TurnClock component, including any attributes for its root element.
	 * @typedef {TurnClockOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TurnClockProps
	 *
	 * @example
	 * <TurnClock seat={1} ms={102000} />
	 * <TurnClock seat={1} ms={4200} warn />
	 */
</script>

<script>
	import { formatClock } from '../../clock.js';
	import { playerColor } from '../../ui.js';

	/** @type {TurnClockProps} */
	let { seat, ms, running = true, warn = false, ...attr } = $props();

	const text = $derived(formatClock(ms));
	const seconds = $derived(Math.ceil(Math.max(0, ms) / 1000));
</script>

<div
	{...attr}
	class="rg-turn-clock {running ? '' : 'rg-turn-clock--paused'} {warn
		? 'rg-turn-clock--warn'
		: ''} {attr.class ? attr.class : ''}"
	style:--rg-turn-clock-color={playerColor(seat)}>
	<span
		class="rg-turn-clock--mark"
		aria-hidden="true"></span>
	<span class="rg-turn-clock--time">{text}</span>
	{#if warn}
		<span
			class="rg-turn-clock--words"
			aria-hidden="true">{seconds} s left</span>
	{/if}
	<span
		class="rg-turn-clock--live"
		role="status"
		aria-live="polite">{warn ? `${seconds} seconds left` : ''}</span>
</div>

<style>
	.rg-turn-clock {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		box-sizing: border-box;
		height: 36px;
		padding: 0 var(--space-6);
		border: var(--border) solid var(--muted);
		background: var(--surface);
		color: var(--text);
		font-family: var(--font-body);
		font-size: var(--font-size-base);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.rg-turn-clock--mark {
		width: 10px;
		height: 10px;
		background: var(--rg-turn-clock-color);
	}

	.rg-turn-clock--time {
		font-weight: var(--weight-bold);
	}

	.rg-turn-clock--words {
		font-size: var(--font-size-xs);
	}

	.rg-turn-clock--live {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	.rg-turn-clock--paused {
		color: var(--muted);
	}

	.rg-turn-clock--paused .rg-turn-clock--mark {
		opacity: 0.5;
	}

	.rg-turn-clock--warn {
		border-color: var(--danger);
		color: var(--danger);
	}
</style>
