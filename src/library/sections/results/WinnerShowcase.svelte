<!-- Library section: WinnerShowcase with one winner, a shared win, and a winner without a civilization's picture. -->
<script>
	import WinnerShowcase from '../../../lib/components/results/WinnerShowcase.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { FOOTPRINTS } from '../../../lib/art/footprints.js';
	import { matPlots } from '../../../lib/area/capital.js';
	import { completionCounts } from '../../../lib/placement.js';

	/** @typedef {import('../../../lib/capital.js').PlotKind} PlotKind */
	/** @typedef {import('../../../lib/results.js').Winner} Winner */

	/** @type {PlotKind[]} */
	const KINDS = ['house', 'farm', 'market', 'armory'];
	/**
	 * A mat with every third open plot built on.
	 * @param {number} mat
	 * @returns {PlotKind[]}
	 */
	const built = (mat) =>
		matPlots(mat).map((kind, index) =>
			kind === 'empty' && index % 3 === 0 ? KINDS[index % 4] : kind
		);
	const BEN = built(4);
	const LIGHTHOUSE = {
		id: 'lighthouse',
		name: 'Lighthouse',
		footprint: FOOTPRINTS.lighthouse,
		row: 1,
		col: 1,
		rotation: 0,
		locked: true,
	};

	/** @type {Winner} */
	const WINNER = {
		seat: 2,
		name: 'Ben',
		civ: 'Traders',
		civId: 'traders',
		vp: 67,
		capital: {
			mat: 4,
			name: 'Desert',
			biome: 'desert',
			terrainSeed: 3,
			plots: BEN,
			pieces: [LIGHTHOUSE],
			counts: completionCounts(BEN, [LIGHTHOUSE]),
			besideMat: [],
		},
	};
	const ANA = built(1);
	/** @type {Winner} */
	const SHARED = {
		seat: 1,
		name: 'Ana',
		civ: 'Alchemists',
		civId: 'alchemists',
		vp: 67,
		capital: {
			mat: 1,
			name: 'Mountain',
			biome: 'mountain',
			terrainSeed: 1,
			plots: ANA,
			pieces: [],
			counts: completionCounts(ANA, []),
			besideMat: [],
		},
	};
</script>

<Section
	name="WinnerShowcase"
	area="results"
	description="The winner under the final standings (#174), shown to everyone: their civilization's portrait in a gold frame, its name, their name and VP, and their capital as it ended. A shared win shows each winner.">
	<Example
		label={'winners={[Ben, Traders, 67 VP]}'}
		wide>
		<WinnerShowcase winners={[WINNER]} />
	</Example>
	<Example
		label={'winners={[Ana, Ben]}  (a shared win)'}
		wide>
		<WinnerShowcase winners={[SHARED, WINNER]} />
	</Example>
	<Example
		label={'winners={[{ civId: null, capital: null }]}  (no picture, no capital)'}
		wide>
		<WinnerShowcase winners={[{ ...WINNER, civId: null, capital: null }]} />
	</Example>
</Section>
