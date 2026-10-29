<!-- MasterpieceCard: the owner-approved square Arts & Architecture masterpiece frame. -->
<script module>
	/**
	 * @typedef {Object} MasterpieceCardOwnProps
	 * @property {string} title - Masterpiece name
	 * @property {string} artwork - Full masterpiece artwork URL
	 * @property {string} [artworkAlt] - Artwork description
	 * @property {import('svelte').Snippet} effects - Effect content beside the art
	 */
	/**
	 * @typedef {MasterpieceCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} MasterpieceCardProps
	 * @example
	 * <MasterpieceCard title="Painting" artwork="/art/masterpiece/painting.svg" artworkAlt="Painting artwork">
	 * 	{#snippet effects()}<p>Gain <strong>4 VP</strong>.</p>{/snippet}
	 * </MasterpieceCard>
	 */
</script>

<script>
	import CardBand from './CardBand.svelte';
	import CardEdition from './CardEdition.svelte';
	import '../../../styles/masterpiece-card.css';
	/** @type {MasterpieceCardProps} */
	let { title, artwork, artworkAlt = '', effects, ...attr } = $props();
</script>

<article
	{...attr}
	class="rg-masterpiece-card {attr.class ?? ''}"
	aria-label={`${title} masterpiece card`}>
	<CardBand
		class="rg-masterpiece-card--band"
		{title}
		size="medium" />
	<div class="rg-masterpiece-card--body">
		<div class="rg-masterpiece-card--effects">{@render effects()}</div>
		<img
			class="rg-masterpiece-card--art"
			src={artwork}
			alt={artworkAlt} />
	</div>
	<footer class="rg-masterpiece-card--footer">
		<CardEdition code="aa" />
	</footer>
</article>
