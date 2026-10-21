<!-- Library section: WorldMap with the play-page mockup's five rows, and a small map with every terrain. -->
<script>
	import WorldMap from '../../../lib/components/board/WorldMap.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const S = 'sea';
	const F = 'forest';
	const G = 'grassland';
	const D = 'desert';
	const M = 'mountain';
	const U = 'unexplored';

	/** The mockup's map, a review fixture rather than the real board. @type {import('../../../lib/ui.js').Terrain[][]} */
	const MOCKUP = [
		[S, S, S, S, S, S, S, S, S, S],
		[S, F, U, D, U, M, U, G, S, S],
		[S, G, M, U, F, U, D, F, M, S],
		[S, D, U, G, U, M, F, U, S, S],
		[S, S, S, S, S, S, S, S, S, S],
	];

	/** @type {import('../../../lib/ui.js').Terrain[][]} */
	const SMALL = [
		[S, F, G],
		[D, M, U],
	];
</script>

<Section
	name="WorldMap"
	area="board"
	description="The schematic world map: point-up hexagons coloured by terrain, odd rows half a hex to the right, unexplored hexes dashed. Exploration and conquest targeting are not designed yet, so the map is static.">
	<Example
		label={'rows={the mockup\'s five rows} label="World map preview"'}
		wide
		width={1428}>
		<WorldMap
			rows={MOCKUP}
			label="World map preview" />
	</Example>
	<Example
		label={'rows={[[sea, forest, grassland], [desert, mountain, unexplored]]}'}
		width={360}>
		<WorldMap rows={SMALL} />
	</Example>
</Section>
