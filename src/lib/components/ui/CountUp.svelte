<!-- CountUp: a number that counts to its new value, with a green +n that rises and fades when it grows (#174); at once with reduced motion. -->
<script module>
	/**
	 * Properties of the CountUp component itself.
	 * @typedef {Object} CountUpOwnProps
	 * @property {number} value - The number to show
	 * @property {boolean} [still=false] - Change at once, without counting or the +n, as a prompt's preview does
	 */

	/**
	 * Properties for the CountUp component, including any attributes for its root element.
	 * @typedef {CountUpOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} CountUpProps
	 *
	 * @example
	 * <b><CountUp value={coins} /></b>
	 */
</script>

<script>
	import { untrack } from 'svelte';
	import { COUNT_MS, countAt, prefersReducedMotion } from '../../motion.js';

	/** @type {CountUpProps} */
	let { value, still = false, ...attr } = $props();

	let shown = $state(untrack(() => value));
	/** The rise of the last gain, keyed so a new one plays again. */
	let gain = $state(
		/** @type {{ amount: number, key: number } | null} */ (null)
	);

	$effect(() => {
		const to = value;
		const from = untrack(() => shown);
		if (to === from) {
			return;
		}
		if (untrack(() => still) || prefersReducedMotion()) {
			shown = to;
			gain = null;
			return;
		}
		if (to > from) {
			gain = { amount: to - from, key: performance.now() };
		}
		const start = performance.now();
		let frame = requestAnimationFrame(function step(now) {
			shown = countAt(from, to, (now - start) / COUNT_MS);
			if (shown !== to) {
				frame = requestAnimationFrame(step);
			}
		});
		return () => cancelAnimationFrame(frame);
	});
</script>

<!-- The +n is drawn by CSS from data-gain, so the number's text stays the number alone. -->
<span
	{...attr}
	class="rg-count-up {attr.class ? attr.class : ''}"
	>{shown}{#if gain}{#key gain.key}<i
				class="rg-count-up--gain"
				aria-hidden="true"
				data-gain="+{gain.amount}"></i
			>{/key}{/if}</span>

<style>
	.rg-count-up {
		position: relative;
		display: inline-block;
		font-variant-numeric: tabular-nums;
	}

	/* The gain rises from the number and fades. */
	.rg-count-up--gain::after {
		content: attr(data-gain);
	}

	.rg-count-up--gain {
		position: absolute;
		bottom: 60%;
		left: 100%;
		margin-left: var(--space-1);
		color: var(--ok);
		font-size: var(--font-size-xs);
		font-style: normal;
		font-weight: var(--weight-bold);
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		animation: rg-count-up-gain 0.9s var(--ease-out);
	}

	@keyframes rg-count-up-gain {
		0% {
			opacity: 0;
			transform: translateY(6px);
		}

		20% {
			opacity: 1;
		}

		100% {
			opacity: 0;
			transform: translateY(-18px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-count-up--gain {
			display: none;
		}
	}
</style>
