<!-- Library section: TerritoryArt for a coast, an island of one and of four parts, clouds, a volcano, and a smaller size. -->
<script>
	import TerritoryArt from '../../../lib/components/board/TerritoryArt.svelte';
	import TerritoryClips from '../../../lib/components/board/TerritoryClips.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { tilePreview } from '../../../lib/area/explore.js';
	import { TERRITORY_TILES } from '../../../lib/engine/data/territory-tiles.js';

	/** @typedef {import('../../../lib/ui.js').Terrain} Terrain */

	/**
	 * The first printed tile that matches, as it lies unturned.
	 * @param {(tile: (typeof TERRITORY_TILES)[number]) => boolean} match
	 */
	function first(match) {
		const tile = TERRITORY_TILES.find(match);
		if (!tile) {
			throw new Error('No territory tile matches.');
		}
		return tilePreview(tile.id, 0);
	}

	/** The plain land and sea tiles carry no island or picture. */
	const plain = (/** @type {(typeof TERRITORY_TILES)[number]} */ t) =>
		t.island.length === 0 && !t.clouds && !t.volcano;

	const EXAMPLES = [
		{
			label: 'corners (a coast)',
			face: first(
				(t) =>
					plain(t) &&
					t.corners.includes('sea') &&
					t.corners.some((c) => c !== 'sea')
			),
		},
		{
			label: 'island={[…]}',
			face: first((t) => t.island.length > 0 && !t.clouds),
		},
		{
			label: 'island of 4 parts, clouds',
			// As the map's middle hex: sea round an island of four terrains.
			face: {
				corners: /** @type {Terrain[]} */ (Array(6).fill('sea')),
				island: /** @type {Terrain[]} */ ([
					'desert',
					'forest',
					'grassland',
					'mountain',
				]),
				clouds: true,
				volcano: false,
			},
		},
		{
			label: 'clouds',
			face: first((t) => t.clouds && !t.volcano && t.island.length === 0),
		},
		{ label: 'volcano', face: first((t) => t.volcano) },
	];
</script>

<Section
	name="TerritoryArt"
	area="board"
	description="A territory's face round the origin (#113): one terrain picture per corner wedge, the coast where land meets sea, the island's parts outlined, and the cloud and volcano overlays (R77). It draws inside an svg next to a TerritoryClips of the same size and prefix; the World Map and TerritoryTile both draw their territories with it.">
	{#each EXAMPLES as example, i (example.label)}
		<Example label={example.label}>
			<svg
				viewBox="-40 -35 80 70"
				width="80"
				height="70"
				aria-hidden="true">
				<TerritoryClips
					prefix="rg-library-territory-art-{i}"
					size={36} />
				<TerritoryArt
					prefix="rg-library-territory-art-{i}"
					size={36}
					{...example.face} />
			</svg>
		</Example>
	{/each}
	<Example label={'size={18}'}>
		<svg
			viewBox="-20 -18 40 36"
			width="40"
			height="36"
			aria-hidden="true">
			<TerritoryClips
				prefix="rg-library-territory-art-small"
				size={18} />
			<TerritoryArt
				prefix="rg-library-territory-art-small"
				size={18}
				{...EXAMPLES[1].face} />
		</svg>
	</Example>
</Section>
