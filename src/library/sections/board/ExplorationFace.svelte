<!-- Library section for the approved Exploration tile faces and their optional bands. -->
<script>
	import ExplorationFace from '../../../lib/components/board/ExplorationFace.svelte';
	import { TRACKS } from '../../../lib/engine/data/tracks.js';
	import { bonusGlyphs } from '../../../lib/glyphs.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const spaces = [1, 4, 5, 9, 10, 11, 12];
	const names = [
		'Scouting',
		'Rafts',
		'Wagons',
		'Navigation',
		'Ships',
		'Tunnels',
		'Trains',
		'Cars',
		'Airplanes',
		'Space Shuttle',
		'Interstellar',
		'Warpgates',
	];
</script>

<Section
	name="ExplorationFace"
	area="board"
	description="The reusable Exploration face within a pointed track tile. Compare territory and space hexes, exploration arrows, operators, score cups, landmark placement and the optional band. The complete twelve-space row is in TrackBoard.">
	{#each spaces as space}
		<Example label={`Exploration ${space} · ${names[space - 1]}`}>
			<div
				style="width: 116px; height: 132px; background: #252f2b; --rg-track-space-color: #55a783; --track-tip: 16px;">
				<ExplorationFace
					{space}
					last={space === names.length}
					name={names[space - 1]}
					landmark={space === 4
						? 'Lighthouse'
						: space === 10
							? 'Launch Pad'
							: undefined}
					bonus={bonusGlyphs(TRACKS.exploration[space].bonus)} />
			</div>
		</Example>
	{/each}
</Section>
