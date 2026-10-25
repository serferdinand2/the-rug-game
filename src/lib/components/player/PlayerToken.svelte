<!-- PlayerToken: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} PlayerTokenOwnProps
	 * @property {'blue' | 'red' | 'green' | 'yellow' | 'purple'} [color] - Player artwork colour
	 * @property {number} [size] - Display height; native artwork is 32px
	 * @property {boolean} [decorative] - Nearby text already describes the token
	 */
	/**
	 * @typedef {PlayerTokenOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} PlayerTokenProps
	 * @example
	 * <PlayerToken />
	 */
</script>

<script>
	import { artUrl } from '../../ui.js';
	/** @type {PlayerTokenProps} */
	let { color = 'blue', size = 32, decorative = false, ...attr } = $props();
</script>

<img
	{...attr}
	class="rg-player-token {attr.class ?? ''}"
	src={artUrl(`piece/token-${color}`)}
	width={size}
	height={size}
	alt={decorative ? '' : `${color} player token`}
	draggable="false" />

<style>
	.rg-player-token {
		object-fit: contain;
		image-rendering: pixelated;
		flex: none;
	}
</style>
