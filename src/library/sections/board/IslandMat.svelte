<!-- Library section: IslandMat empty, with tiles lying on it, and with hexes to choose and a tile previewed. -->
<script>
	import IslandMat from '../../../lib/components/board/IslandMat.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { matMapHexes } from '../../../lib/island-mat.js';
	import { turned } from '../../../lib/engine/game.js';
	import { TERRITORY_TILES } from '../../../lib/engine/data/territory-tiles.js';

	const mat = (
		/** @type {({ tile: number, orient: number } | null)[]} */ hexes
	) =>
		matMapHexes(
			{ seats: [{ seat: 1, civData: { islanders: { hexes } } }] },
			1
		);

	const empty = mat(Array(6).fill(null));
	// Tile 17 has an island in the middle, 30 has clouds and 47 the volcano.
	const laid = mat([
		{ tile: 17, orient: 0 },
		{ tile: 30, orient: 2 },
		null,
		null,
		{ tile: 47, orient: 1 },
		null,
	]);
	const targets = ['mat:1:2', 'mat:1:3', 'mat:1:5'];
	const scores = { 'mat:1:2': 2, 'mat:1:3': 0, 'mat:1:5': 1 };
	const tile = TERRITORY_TILES[2];
	const previewing = {
		hex: 'mat:1:2',
		corners: /** @type {any} */ (turned(tile.corners, 1)),
		island: /** @type {any} */ ([...tile.island]),
	};
	/** @type {string | null} */
	let chosen = $state('mat:1:3');
</script>

<Section
	name="IslandMat"
	area="board"
	description="The Islanders' mat (#165): the printed centre hex and the six hexes round it, drawn by the World Map, so the tiles lying there join into one coast with the centre as they join on the board. With targets set the empty hexes to explore are green buttons, scores tags the VP the picked tile earns there, and preview shows that tile before it lies. Answers name the hexes 'mat:<seat>:<position>', as the engine does.">
	<Example
		label={'hexes={matMapHexes(view, seat)}  (nothing explored yet)'}
		width={360}>
		<IslandMat
			hexes={empty}
			seat={1} />
	</Example>
	<Example
		label={'hexes={matMapHexes(view, seat)}  (three tiles lying: an island, clouds, the volcano)'}
		width={360}>
		<IslandMat
			hexes={laid}
			seat={1} />
	</Example>
	<Example
		label={`targets={['mat:1:2', 'mat:1:3', 'mat:1:5']} selected='${chosen}' scores  (click a green hex)`}
		width={360}>
		<IslandMat
			hexes={laid}
			seat={1}
			{targets}
			{scores}
			selected={chosen}
			onIslandMatSelect={(/** @type {any} */ event) =>
				(chosen = event.value.hex)} />
	</Example>
	<Example
		label={"preview={{ hex: 'mat:1:2', corners, island }}  (tile 3 turned once)"}
		width={360}>
		<IslandMat
			hexes={laid}
			seat={1}
			preview={previewing} />
	</Example>
</Section>
