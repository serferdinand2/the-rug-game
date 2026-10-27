<!-- TechnologyCard: the owner-reviewed horizontal technology frame, from a fixture or the engine's data. -->
<script module>
	/** @typedef {import('../../cards/card-layouts.js').TechnologyCardData} TechnologyCardData */
	/**
	 * @typedef {Object} TechnologyCardOwnProps
	 * @property {string} [id] - Technology card id from the reviewed fixtures, used when `data` is not given
	 * @property {TechnologyCardData} [data] - A real card's face, from `techCardData()` in game-cards.js
	 */
	/**
	 * @typedef {TechnologyCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TechnologyCardProps
	 * @example
	 * <TechnologyCard id="clocks" />
	 * <TechnologyCard data={techCardData('time-travel')} />
	 */
</script>

<script>
	import {
		technologyCardMarkup,
		technologyFixture,
	} from '../../cards/card-layouts.js';
	import '../../../styles/card-layouts.css';
	/** @type {TechnologyCardProps} */
	let { id, data, ...attr } = $props();
	const card = $derived(data ?? technologyFixture(id ?? ''));
</script>

<div
	{...attr}
	class="rg-technology-card {attr.class ?? ''}">
	{@html technologyCardMarkup(card)}
</div>
