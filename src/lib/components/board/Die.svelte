<!-- Die: one die as the dice tray rolls it (#61), its style C body with the rolled face drawn on top. -->
<script module>
	/**
	 * Properties of the Die component itself.
	 * @typedef {Object} DieOwnProps
	 * @property {import('../../dice.js').DieId} die - The science die (d12) or the red or black conquer die (d6)
	 * @property {number} face - The face it lands on: an index into the die's faces (engine/data/dice.js)
	 * @property {number} [size=72] - Its width and height, in pixels
	 * @property {boolean} [rolling=false] - It tumbles, flipping through other faces before it lands on `face`; with reduced motion it doesn't
	 * @property {number} [seed=0] - Varies the faces it flips through, so two dice in the tray don't tumble alike
	 */

	/**
	 * Properties for the Die component, including any attributes for its root element.
	 * @typedef {DieOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} DieProps
	 *
	 * @example
	 * <Die die="red" face={1} />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	import { TUMBLE_MS, faceOf, tumbleOf } from '../../dice.js';
	import { artUrl } from '../../ui.js';

	/** @type {DieProps} */
	let { die, face, size = 72, rolling = false, seed = 0, ...attr } = $props();

	/** @type {number | null} The face it shows mid-tumble; null once it has landed */
	let tumbling = $state(null);

	// While it rolls, it flips through tumbleOf's faces, again each tumble (the library loops it), landing on `face`.
	$effect(() => {
		if (!rolling) {
			tumbling = null;
			return;
		}
		const steps = tumbleOf(die, face, seed);
		/** @type {ReturnType<typeof setTimeout>[]} */
		let timers = [];
		const tumble = () => {
			timers = steps.map((step) =>
				setTimeout(() => (tumbling = step.face), step.at)
			);
			timers.push(setTimeout(tumble, TUMBLE_MS));
		};
		tumble();
		return () => timers.forEach(clearTimeout);
	});

	let shown = $derived(faceOf(die, tumbling ?? face));
	let resource = $derived(
		/** @type {import('../../ui.js').CostSymbol} */ (
			shown.kind === 'resource' ? shown.id : 'coin'
		)
	);
</script>

<span
	aria-hidden="true"
	data-die={die}
	data-face={face}
	{...attr}
	class="rg-die rg-die--{die} {attr.class ? attr.class : ''}"
	class:rg-die--rolling={rolling}
	style:--rg-die-size="{size}px"
	style:--rg-die-tumble="{TUMBLE_MS}ms">
	<img
		class="rg-die--body"
		src={artUrl(`die/${die}-body`)}
		alt="" />
	<span class="rg-die--face">
		{#if shown.kind === 'track'}
			<img
				class="rg-die--track"
				src={artUrl(`track/${shown.id}`)}
				alt="" />
		{:else if shown.kind === 'vp'}
			<span class="rg-die--vp">{shown.words}</span>
		{:else if shown.kind === 'resource'}
			<ResourceIcon
				symbol={resource}
				size="medium"
				decorative />
		{:else}
			<span class="rg-die--tile">?</span>
		{/if}
	</span>
</span>

<style>
	.rg-die {
		position: relative;
		display: inline-grid;
		width: var(--rg-die-size);
		height: var(--rg-die-size);
		place-items: center;
	}

	.rg-die--body {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
	}

	.rg-die--face {
		position: relative;
		display: grid;
		width: 62%;
		height: 62%;
		place-items: center;
		text-align: center;
	}

	.rg-die--track {
		width: 70%;
		height: 70%;
		image-rendering: pixelated;
	}

	.rg-die--vp,
	.rg-die--tile {
		font-weight: var(--weight-bold);
		line-height: var(--leading-none);
	}

	.rg-die--vp {
		color: var(--text);
		font-size: var(--font-size-xs);
	}

	.rg-die--tile {
		color: var(--text);
		font-size: var(--font-size-xl);
	}

	.rg-die--rolling {
		animation: rg-die-tumble var(--rg-die-tumble) linear infinite;
	}

	/* Thrown in spinning, it strikes the tray three times, each bounce lower, then rocks still on its rolled face. Each
	   fall eases in and each rise eases out. */
	@keyframes rg-die-tumble {
		0% {
			transform: translateY(-60%) rotate(-540deg) scale(0.75);
			animation-timing-function: cubic-bezier(0.5, 0, 1, 1);
		}
		20% {
			transform: translateY(5%) rotate(-250deg) scale(1.06, 0.94);
			animation-timing-function: cubic-bezier(0, 0, 0.5, 1);
		}
		32% {
			transform: translateY(-24%) rotate(-120deg) scale(0.96);
			animation-timing-function: cubic-bezier(0.5, 0, 1, 1);
		}
		44% {
			transform: translateY(4%) rotate(-40deg) scale(1.05, 0.95);
			animation-timing-function: cubic-bezier(0, 0, 0.5, 1);
		}
		54% {
			transform: translateY(-10%) rotate(12deg);
			animation-timing-function: cubic-bezier(0.5, 0, 1, 1);
		}
		64% {
			transform: translateY(2%) rotate(-8deg) scale(1.02, 0.98);
			animation-timing-function: ease-out;
		}
		76% {
			transform: translateY(-2%) rotate(4deg);
			animation-timing-function: ease-in-out;
		}
		88% {
			transform: rotate(-1.5deg);
			animation-timing-function: ease-out;
		}
		100% {
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-die--rolling {
			animation: none;
		}
	}
</style>
