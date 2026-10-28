<!-- Library section: TerritoryClips, one set cutting three territory faces in one svg. -->
<script>
	import TerritoryClips from '../../../lib/components/board/TerritoryClips.svelte';
	import TerritoryArt from '../../../lib/components/board/TerritoryArt.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { tilePreview } from '../../../lib/area/explore.js';

	const PREFIX = 'rg-library-territory-clips';
	const FACES = [tilePreview(5, 0), tilePreview(17, 1), tilePreview(47, 2)];
</script>

<Section
	name="TerritoryClips"
	area="board"
	description="The clip outlines a territory's face is cut with (#113): the six corner wedges, and each part of an island of one to six parts, which depends only on how many parts it has. It draws nothing itself: one set in an svg serves every TerritoryArt of its size there, as on the World Map.">
	<Example label={'prefix="…" size={36}, three TerritoryArt'}>
		<svg
			viewBox="-40 -35 240 70"
			width="240"
			height="70"
			aria-hidden="true">
			<TerritoryClips
				prefix={PREFIX}
				size={36} />
			{#each FACES as face, i (i)}
				<TerritoryArt
					prefix={PREFIX}
					size={36}
					transform="translate({i * 80} 0)"
					{...face} />
			{/each}
		</svg>
	</Example>
</Section>
