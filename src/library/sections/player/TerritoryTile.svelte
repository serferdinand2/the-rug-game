<!-- Library examples for TerritoryTile. -->
<script>
	import TerritoryTile from '../../../lib/components/player/TerritoryTile.svelte';
	import { terrainView } from '../../../lib/area/terrain.js';
	import { turned } from '../../../lib/engine/game.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const { territories } = terrainView({
		territoryTiles: [1, 5, 17, 47],
		spaceTiles: [],
		exploredSpace: [],
	});
	// Tile 17 as the explore prompt shows it after two turns: each turn is painted, not rotated.
	const turnedTile = {
		...territories[2],
		corners: /** @type {any} */ (turned(territories[2].corners, 2)),
	};
</script>

<Section
	name="TerritoryTile"
	area="player"
	description="A territory tile in hand: a small flat-topped hex painted at its turn as the World Map paints a territory (#134), with its number. Tile 1 shows clouds and tile 47 the volcano.">
	{#each territories as tile (tile.id)}
		<Example
			label="id={tile.id}{tile.island.length ? ' with island' : ''}"
			width={72}>
			<TerritoryTile {...tile} />
		</Example>
	{/each}
	<Example
		label="id={17} corners={'{'}turned(corners, 2){'}'}"
		width={72}>
		<TerritoryTile {...turnedTile} />
	</Example>
	<Example
		label="size={24}"
		width={48}>
		<TerritoryTile
			{...territories[0]}
			size={24} />
	</Example>
</Section>
