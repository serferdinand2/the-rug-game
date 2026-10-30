<!-- CardPreview: a tech or tapestry card shown in full over the shared area, from its kind and id (#96). -->
<script module>
	/**
	 * Properties of the CardPreview component itself.
	 * @typedef {Object} CardPreviewOwnProps
	 * @property {'tech' | 'tapestry'} kind - Which kind of card
	 * @property {string} [id] - The card's id, drawn from the engine's data
	 * @property {any} [data] - The card's face instead, when the caller already holds it, as a decision's shelf does (#118)
	 * @property {boolean} [side=false] - Beside a card shelf, at the left and without a scrim, so the shelf stays in sight
	 */

	/**
	 * Properties for the CardPreview component, including any attributes for its root element.
	 * @typedef {CardPreviewOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} CardPreviewProps
	 *
	 * @example
	 * <CardPreview kind="tech" id="clocks" />
	 * {#if inspected}
	 *   <CardPreview {...inspected} />
	 * {/if}
	 */
</script>

<script>
	import TapestryCard from './TapestryCard.svelte';
	import TechnologyCard from './TechnologyCard.svelte';

	/** @type {CardPreviewProps} */
	let { kind, id, data, side = false, ...attr } = $props();
</script>

<div
	aria-hidden="true"
	{...attr}
	class="rg-card-preview {attr.class ?? ''}"
	class:rg-card-preview--side={side}>
	{#if kind === 'tech'}
		<TechnologyCard
			{id}
			{data} />
	{:else}
		<TapestryCard
			{id}
			{data} />
	{/if}
</div>

<style>
	/* Over the positioned area it sits in, as the mockup's card overview: a scrim, the card, no pointer. */
	.rg-card-preview {
		position: absolute;
		z-index: var(--layer-popover);
		inset: 0;
		display: grid;
		place-items: center;
		background: var(--scrim);
		pointer-events: none;
	}

	/* A shelf card shown in full beside the shelf, at the left, so the shelf and its focus stay in sight (#28 review). */
	.rg-card-preview--side {
		justify-items: start;
		padding-left: var(--space-10);
		background: transparent;
	}
</style>
