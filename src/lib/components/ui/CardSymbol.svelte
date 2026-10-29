<!-- The three 24px card-back symbols, vectorized pixel for pixel from the approved PNGs. -->
<script module>
	/**
	 * @typedef {Object} CardSymbolOwnProps
	 * @property {'tech' | 'tapestry' | 'civilization'} kind - Card-back design
	 * @property {number} [size=24] - Display size in CSS pixels
	 * @property {boolean} [decorative=false] - Empty alt text when another label names the card
	 */
	/**
	 * @typedef {CardSymbolOwnProps & import('svelte/elements').HTMLImgAttributes} CardSymbolProps
	 * @example <CardSymbol kind="tapestry" size={24} />
	 */
</script>

<script>
	import { artUrl } from '../../ui.js';

	/** @type {CardSymbolProps} */
	let { kind, size = 24, decorative = false, ...attr } = $props();

	const names = {
		tech: 'Tech card',
		tapestry: 'Tapestry card',
		civilization: 'Civilization card',
	};
</script>

<img
	{...attr}
	class="rg-card-symbol {attr.class ? attr.class : ''}"
	src={artUrl(`symbol/${kind}-card`)}
	width={size}
	height={size}
	alt={decorative ? '' : names[kind]}
	draggable="false" />
