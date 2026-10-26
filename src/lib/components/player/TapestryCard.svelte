<!-- TapestryCard: the owner-reviewed portrait, timing and rules frame. -->
<script module>
	/**
	 * @typedef {Object} TapestryCardOwnProps
	 * @property {string} id - Tapestry card id from the reviewed fixtures
	 */
	/**
	 * @typedef {TapestryCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TapestryCardProps
	 * @example
	 * <TapestryCard id="academia" />
	 */
</script>

<script>
	import { tapestryCardMarkup } from '../../cards/card-layouts.js';
	import '../../../styles/card-layouts.css';
	/** @type {TapestryCardProps} */
	let { id, ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-tapestry-card {attr.class ?? ''}">
	{@html tapestryCardMarkup(id)}
</div>
