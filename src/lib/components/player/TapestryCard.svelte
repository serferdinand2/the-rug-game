<!-- TapestryCard: the owner-reviewed portrait, timing and rules frame, from a fixture or the engine's data. -->
<script module>
	/** @typedef {import('../../cards/card-layouts.js').TapestryCardData} TapestryCardData */
	/**
	 * @typedef {Object} TapestryCardOwnProps
	 * @property {string} [id] - Tapestry card id from the reviewed fixtures, used when `data` is not given
	 * @property {TapestryCardData} [data] - A real card's face, from `tapestryCardData()` in game-cards.js
	 */
	/**
	 * @typedef {TapestryCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TapestryCardProps
	 * @example
	 * <TapestryCard id="academia" />
	 * <TapestryCard data={tapestryCardData('dark-ages')} />
	 */
</script>

<script>
	import {
		tapestryCardMarkup,
		tapestryFixture,
	} from '../../cards/card-layouts.js';
	import '../../../styles/card-layouts.css';
	/** @type {TapestryCardProps} */
	let { id, data, ...attr } = $props();
	const card = $derived(data ?? tapestryFixture(id ?? ''));
</script>

<div
	{...attr}
	class="rg-tapestry-card {attr.class ?? ''}">
	{@html tapestryCardMarkup(card)}
</div>
