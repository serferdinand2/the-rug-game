<!-- Library section: InspirationTiles, the tiles a player has still to place (#35 part 4). -->
<script>
	import InspirationTiles from '../../../lib/components/player/InspirationTiles.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="InspirationTiles"
	area="player"
	description="Arts & Architecture's inspiration tiles not yet placed, under the income mat on the Income tab: one chip per row, in the tiles' violet edged in gold. Pointing at a chip, or focusing it, shows the tile's picture.">
	<Example label={"tiles={['house', 'farm', 'armory']}  (hover a tile)"}>
		<div style="padding-top: 200px">
			<InspirationTiles tiles={['house', 'farm', 'armory']} />
		</div>
	</Example>
</Section>
