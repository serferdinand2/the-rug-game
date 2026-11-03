<!-- Library examples for TileBenefit. -->
<script>
	import TileBenefit from '../../../lib/components/player/TileBenefit.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** The tiles whose benefits differ in shape: one coin, two of a kind, an upgrade, a cross, a card, a building. */
	const TILES = [1, 2, 8, 12, 17, 22, 47];
</script>

<Section
	name="TileBenefit"
	area="player"
	description="A territory tile's benefit as a round badge: its icon, an upgrade arrow, a ×count or a cross, from territoryBenefit(). It is drawn at the middle of a tile in hand, and small at the top of a placed tile's hex on the World Map (#170). Drawn inside an SVG, round the origin, for a 36 px tile; scale it for another size.">
	{#each TILES as tile (tile)}
		<Example
			label="tile={tile}"
			width={72}>
			<svg
				viewBox="-24 -24 48 48"
				width="72"
				height="72"
				role="img"
				aria-label="Benefit of tile {tile}">
				<TileBenefit {tile} />
			</svg>
		</Example>
	{/each}
</Section>
