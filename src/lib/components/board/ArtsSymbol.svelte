<!-- Arts-track benefits as reusable symbols. -->
<script module>
	/**
	 * @typedef {Object} ArtsSymbolProps
	 * @property {'create' | 'inspire' | 'building' | 'broadcast'} kind
	 * @property {number} [size=24] - Display size in CSS pixels
	 * @property {boolean} [decorative=false] - Another label names the symbol
	 */
</script>

<script>
	import { artUrl } from '../../ui.js';
	/** @type {ArtsSymbolProps} */
	let { kind, size, decorative = false } = $props();
	const labels = {
		create: 'Create a masterpiece',
		inspire: 'Inspire an income row',
		building: 'Income building of your choice',
		broadcast: 'Broadcast',
	};
</script>

<span
	class="rg-arts-symbol"
	role="img"
	aria-label={decorative ? undefined : labels[kind]}
	aria-hidden={decorative ? 'true' : undefined}
	style:--rg-arts-symbol-size={size === undefined ? undefined : `${size}px`}>
	{#if kind === 'create'}
		<img
			src={artUrl('card-back/masterpiece')}
			alt=""
			draggable="false" />
	{:else if kind === 'inspire'}
		<svg
			viewBox="0 0 24 24"
			aria-hidden="true">
			<path
				d="M12 2a7 7 0 0 0-4.6 12.3c1.2 1 1.6 1.9 1.7 3.2h5.8c.1-1.3.5-2.2 1.7-3.2A7 7 0 0 0 12 2Z" />
			<path d="M9 20h6m-5 2h4" />
		</svg>
	{:else if kind === 'building'}
		<svg
			viewBox="0 0 24 24"
			aria-hidden="true">
			<path d="M3 10 12 3l9 7v11H3ZM3 10h18" />
		</svg>
	{:else}
		<svg
			viewBox="0 0 24 24"
			aria-hidden="true">
			<path
				d="M2 7a16 16 0 0 1 20 0M5 11a11 11 0 0 1 14 0M8 15a6 6 0 0 1 8 0" />
			<circle
				cx="12"
				cy="19"
				r="1.5"
				class="rg-arts-symbol--dot" />
		</svg>
	{/if}
</span>

<style>
	.rg-arts-symbol {
		display: inline-flex;
		flex: none;
		width: var(--rg-arts-symbol-size, 24px);
		height: var(--rg-arts-symbol-size, 24px);
		align-items: center;
		justify-content: center;
		color: var(--gold);
	}
	.rg-arts-symbol img,
	.rg-arts-symbol svg {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.rg-arts-symbol img {
		image-rendering: pixelated;
	}
	.rg-arts-symbol svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 2.5;
		stroke-linecap: square;
		stroke-linejoin: miter;
	}
	.rg-arts-symbol .rg-arts-symbol--dot {
		fill: currentColor;
		stroke: none;
	}
</style>
