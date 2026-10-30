<!-- Library section: TrackBoard with the play-page mockup's four tracks and the real spaces' benefits, at its real width and height, and with a stand-in fifth track (#120). -->
<script module>
	import { TRACKS } from '../../../lib/engine/data/tracks.js';
	import { describeBonus, describeEffects } from '../../../lib/describe.js';
	import { bonusGlyphs, spaceGlyphs } from '../../../lib/glyphs.js';

	/** @typedef {import('../../../lib/ui.js').TrackId} TrackId */
	/** @typedef {import('../../../lib/ui.js').ResourceId} ResourceId */
	/** @typedef {import('../../../lib/ui.js').CostSymbol} CostSymbol */
	/** @typedef {import('../../../lib/ui.js').Seat} Seat */

	/**
	 * One track of the mockup's fixture.
	 * @typedef {Object} FixtureTrack
	 * @property {TrackId} id
	 * @property {string} name
	 * @property {import('../../../lib/components/board/Track.svelte').TrackSpaceEntry[]} spaces
	 * @property {CostSymbol[][]} tiers
	 * @property {{ seat: Seat, name: string, position: number }[]} players
	 */

	/** The four players of the mockup, by seat. @type {readonly { seat: Seat, name: string }[]} */
	const PLAYERS = [
		{ seat: 1, name: 'You' },
		{ seat: 2, name: 'Ana' },
		{ seat: 3, name: 'Marko' },
		{ seat: 4, name: 'Vera' },
	];

	/** The spaces that hold the mockup's landmarks. */
	const LANDMARK_SPACES = [4, 7, 10];

	/**
	 * Builds one track of the mockup's fixture: landmarks sit on spaces 4, 7 and 10, the tier prices follow the mockup,
	 * and each space shows the real space's benefit and bonus (#59).
	 * @param {TrackId} id
	 * @param {string} name
	 * @param {ResourceId} resource - The resource the mockup's prices show for this track
	 * @param {number[]} positions - Spaces reached by You, Ana, Marko and Vera
	 * @param {string[]} names - The twelve space names
	 * @param {string[]} landmarks - The landmarks on spaces 4, 7 and 10
	 * @returns {FixtureTrack}
	 */
	function fixtureTrack(id, name, resource, positions, names, landmarks) {
		return {
			id,
			name,
			spaces: names.map((space, index) => {
				const { benefit, bonus } = TRACKS[id][index + 1];
				return {
					name: space,
					landmark: landmarks[LANDMARK_SPACES.indexOf(index + 1)],
					benefit: spaceGlyphs(benefit),
					bonus: bonusGlyphs(bonus),
					words: bonus
						? `${describeEffects(benefit)}. Bonus: ${describeBonus(bonus)}.`
						: `${describeEffects(benefit)}.`,
				};
			}),
			tiers: [
				['any'],
				[resource, 'any'],
				[resource, 'any', 'any'],
				[resource, resource],
			],
			players: PLAYERS.map((player, index) => ({
				...player,
				position: positions[index],
			})),
		};
	}

	/** The play-page mockup's four tracks. */
	export const BOARD_TRACKS = [
		fixtureTrack(
			'exploration',
			'Exploration',
			'food',
			[4, 2, 5, 1],
			[
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
			],
			['Lighthouse', 'Train Station', 'Launch Pad']
		),
		fixtureTrack(
			'science',
			'Science',
			'worker',
			[2, 1, 3, 6],
			[
				'Astronomy',
				'Mathematics',
				'Herbalism',
				'Medicine',
				'Chemistry',
				'Biology',
				'Academic Research',
				'Nutrition',
				'Physics',
				'Neuroscience',
				'Quantum Physics',
				'Alien Biology',
			],
			['Apothecary', 'Academy', 'Laboratory']
		),
		fixtureTrack(
			'technology',
			'Technology',
			'coin',
			[5, 0, 2, 3],
			[
				'Pottery',
				'Carpentry',
				'Stone Tools',
				'Metallurgy',
				'Glass',
				'Steel',
				'Rubber',
				'Plastic',
				'Electronics',
				'Computers',
				'Nanotech',
				'AI Singularity',
			],
			['Forge', 'Rubber Works', 'Tech Hub']
		),
		fixtureTrack(
			'military',
			'Military',
			'culture',
			[1, 6, 0, 2],
			[
				'Archery',
				'Bladed Weapons',
				'Walls',
				'Standing Army',
				'Cavalry',
				'Gunpowder',
				'Tanks',
				'Warplanes',
				'Anti-Aircraft',
				'Nuclear Bomb',
				'Drone Assassins',
				'Mechs',
			],
			['Barracks', 'Tank Factory', 'Fusion Reactor']
		),
	];

	/**
	 * The four tracks and a stand-in fifth, as Arts & Architecture will have (#120): a copy of Science under the arts
	 * track's id, only to show that five fit. #35 brings the arts track's own spaces and colour.
	 * @type {FixtureTrack[]}
	 */
	const FIVE_TRACKS = [
		...BOARD_TRACKS,
		{
			...BOARD_TRACKS[1],
			id: /** @type {TrackId} */ ('arts'),
			name: 'Arts (stand-in)',
		},
	];
</script>

<script>
	import TrackBoard from '../../../lib/components/board/TrackBoard.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {{ track: TrackId, space: number } | null} */
	let selected = $state({ track: 'exploration', space: 5 });
</script>

<Section
	name="TrackBoard"
	area="board"
	description="The advancement tracks stacked to fill the shared area's height, with one space selected across all of them. Each track takes an equal share, so the base game's four and Arts & Architecture's five both fit.">
	<Example
		label={`tracks={the mockup's four tracks} selected={${JSON.stringify(selected)}}  (hover, Tab or click the spaces)`}
		wide
		width={1428}>
		<div style="height: 892px">
			<TrackBoard
				tracks={BOARD_TRACKS}
				available={[
					{ track: 'exploration', space: 5 },
					{ track: 'science', space: 4 },
					{ track: 'technology', space: 6 },
				]}
				bind:selected />
		</div>
	</Example>
	<Example
		label={'tracks={the four tracks and a stand-in fifth}  (five tracks share the same height at 1920×1080, #120)'}
		wide
		width={1428}>
		<!-- The stand-in borrows Arts & Architecture's colour until #35 gives the arts track its own. -->
		<div style="height: 892px; --arts: var(--arts-architecture)">
			<TrackBoard tracks={FIVE_TRACKS} />
		</div>
	</Example>
</Section>
