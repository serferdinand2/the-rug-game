<!-- Library section: TrackBoard with the play-page mockup's four tracks, at its real width and height. -->
<script module>
	/** @typedef {import('../../../lib/ui.js').TrackId} TrackId */
	/** @typedef {import('../../../lib/ui.js').ResourceId} ResourceId */
	/** @typedef {import('../../../lib/ui.js').CostSymbol} CostSymbol */
	/** @typedef {import('../../../lib/ui.js').Seat} Seat */

	/**
	 * One track of the mockup's fixture.
	 * @typedef {Object} FixtureTrack
	 * @property {TrackId} id
	 * @property {string} name
	 * @property {{ name: string, landmark?: string }[]} spaces
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
	 * Builds one track of the mockup's fixture: landmarks sit on spaces 4, 7 and 10, and the tier prices follow the mockup.
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
			spaces: names.map((space, index) => ({
				name: space,
				landmark: landmarks[LANDMARK_SPACES.indexOf(index + 1)],
			})),
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
	description="The four advancement tracks stacked to fill the shared area's height, with one space selected across all of them.">
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
</Section>
