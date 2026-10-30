<!-- Library section: CapitalMatFace, a capital mat on offer: its name over its 9×9 grid. -->
<script>
	import CapitalMatFace from '../../../lib/components/player/CapitalMatFace.svelte';
	import { shelfFace } from '../../../lib/prompts.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/prompts.js').MatFace} MatFace */

	const MOUNTAIN = /** @type {MatFace} */ (shelfFace('mat', '1'));
	const SECOND = /** @type {MatFace} */ (shelfFace('mat', '2'));
</script>

<Section
	name="CapitalMatFace"
	area="player"
	description="A capital mat on offer at setup: its name on a card band over its 9×9 grid of plots, its impassable plots under the mat's relief, 392 px wide, large enough to read the districts (#56). The table's terrain seed makes it look as it will in the Capital tab. CardShelf draws one per mat (#118).">
	<Example
		label={`name="${MOUNTAIN.name}" biome="${MOUNTAIN.biome}"`}
		surface="ink"
		width={392}>
		<CapitalMatFace
			name={MOUNTAIN.name}
			plots={MOUNTAIN.plots}
			biome={MOUNTAIN.biome} />
	</Example>
	<Example
		label={`name="${SECOND.name}" biome="${SECOND.biome}" terrainSeed={7}`}
		surface="ink"
		width={392}>
		<CapitalMatFace
			name={SECOND.name}
			plots={SECOND.plots}
			biome={SECOND.biome}
			terrainSeed={7} />
	</Example>
</Section>
