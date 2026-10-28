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
	import '../../../styles/masterpiece-card.css';
	/** @type {MasterpieceCardProps} */
	let { title, artwork, artworkAlt = '', effects, ...attr } = $props();
</script>

<article
	{...attr}
	class="rg-masterpiece-card {attr.class ?? ''}"
	aria-label={`${title} masterpiece card`}>
	<header class="rg-masterpiece-card__band">
		<h3>{title}</h3>
	</header>
	<div class="rg-masterpiece-card__body">
		<div class="rg-masterpiece-card__effects">{@render effects()}</div>
		<img
			class="rg-masterpiece-card__art"
			src={artwork}
			alt={artworkAlt} />
	</div>
	<footer class="rg-masterpiece-card__footer">
		<span class="rg-masterpiece-card__edition"
			>Arts &amp; Architecture</span>
	</footer>
</article>
