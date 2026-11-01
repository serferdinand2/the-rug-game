<!-- TapestryCardBack: a full portrait back using the approved tapestry symbol's stepped weave. -->
<script module>
	/**
	 * Properties of the TapestryCardBack component itself.
	 * @typedef {Object} TapestryCardBackOwnProps
	 * @property {boolean} [frame=true] - Whether to draw the brown frame around the card back
	 *
	 * Properties for TapestryCardBack, including attributes for its root element.
	 * @typedef {TapestryCardBackOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TapestryCardBackProps
	 * @example <TapestryCardBack />
	 */
</script>

<script>
	import { artUrl } from '../../ui.js';

	/** @type {TapestryCardBackProps} */
	let { frame = true, ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-tapestry-card-back {attr.class ?? ''}"
	class:rg-tapestry-card-back--unframed={!frame}
	role="img"
	aria-label="Face-down tapestry card">
	<img
		src={artUrl('card-back/tapestry')}
		alt=""
		aria-hidden="true" />
	<div class="rg-tapestry-card-back--label">
		<b>Tapestry</b>
		<span>Face down</span>
	</div>
</div>

<style>
	.rg-tapestry-card-back {
		position: relative;
		isolation: isolate;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		width: 319px;
		height: 560px;
		border: 6px solid var(--card-band-start);
		box-shadow: 0 12px 18px var(--card-shadow-strong);
		color: var(--card-paper);
		text-align: center;
	}

	.rg-tapestry-card-back--unframed {
		border: 0;
	}

	.rg-tapestry-card-back > img {
		position: absolute;
		z-index: -1;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.rg-tapestry-card-back--label {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-6) var(--space-8);
		border: 2px solid var(--gold);
		background: var(--scrim-strong);
	}

	.rg-tapestry-card-back--label b {
		color: var(--gold);
		font: var(--weight-title) var(--font-size-2xl) / var(--leading-tight)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
	}

	.rg-tapestry-card-back--label span {
		color: var(--card-paper);
		font-size: var(--font-size-sm);
	}
</style>
