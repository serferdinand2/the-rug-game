<!-- Library examples for TerritoryTile. -->
<script>
	import TerritoryTile from '../../../lib/components/player/TerritoryTile.svelte';
	import { terrainView } from '../../../lib/area/terrain.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const { territories } = terrainView({
		territoryTiles: [1, 5, 17],
		spaceTiles: [],
		exploredSpace: [],
	});
</script>

<Section
	name="TerritoryTile"
	area="player"
	description="A territory tile in hand: a small flat-topped hex drawn like the World Map's, with its number.">
	{#each territories as tile (tile.id)}
		<Example
			label="id={tile.id}{tile.island.length ? ' with island' : ''}"
			width={72}>
			<TerritoryTile {...tile} />
		</Example>
	{/each}
	<Example
		label="size={24}"
		width={48}>
		<TerritoryTile
			{...territories[0]}
			size={24} />
	</Example>
</Section>
