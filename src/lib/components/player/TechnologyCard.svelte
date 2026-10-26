<!-- TechnologyCard: the owner-reviewed horizontal technology frame. -->
<script module>
	/**
	 * @typedef {Object} TechnologyCardOwnProps
	 * @property {string} id - Technology card id from the reviewed fixtures
	 */
	/**
	 * @typedef {TechnologyCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TechnologyCardProps
	 * @example
	 * <TechnologyCard id="clocks" />
	 */
</script>

<script>
	import { technologyCardMarkup } from '../../cards/card-layouts.js';
	import '../../../styles/card-layouts.css';
	/** @type {TechnologyCardProps} */
	let { id, ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-technology-card {attr.class ?? ''}">
	{@html technologyCardMarkup(id)}
</div>
