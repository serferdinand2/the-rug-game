<!-- Library section: WorldMap on both sides of the board from dealt games, a mid-game board with every kind of piece, and target hexes to choose. -->
<script>
	import WorldMap from '../../../lib/components/board/WorldMap.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import {
		askedSeats,
		createGame,
		defaultAction,
		play,
		turned,
		view,
	} from '../../../lib/engine/game.js';
	import { seededRandom } from '../../../lib/engine/random.js';
	import { hexNeighbours } from '../../../lib/engine/data/maps.js';
	import { TERRITORY_TILES } from '../../../lib/engine/data/territory-tiles.js';
	import { mapHexes } from '../../../lib/hexmap.js';

	const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

	/**
	 * A game dealt with a fixed seed and its setup answered with the default picks, so the start outposts stand,
	 * as seat 1 sees it.
	 * @param {number} players
	 * @param {number} seed
	 */
	function dealt(players, seed) {
		const random = seededRandom(seed);
		let state = createGame({
			players: NAMES.slice(0, players).map((name) => ({ name })),
			version: 'current',
			random,
		});
		while (state.phase === 'setup') {
			const seat = askedSeats(state)[0];
			const action = /** @type {{ decision: number }} */ (
				defaultAction(state, seat)
			);
			state = play(state, seat, action, random);
		}
		return view(state, 1);
	}

	/**
	 * The hex a seat's outposts started on.
	 * @param {import('../../../lib/engine/view.js').View} game
	 * @param {number} seat
	 */
	function startOf(game, seat) {
		return /** @type {string} */ (
			Object.keys(game.hexes).find((key) =>
				game.hexes[key].outposts.some((o) => o.seat === seat)
			)
		);
	}

	/**
	 * The first unexplored hex next to another, on the board.
	 * @param {import('../../../lib/engine/view.js').View} game
	 * @param {string} key
	 */
	function unexploredNextTo(game, key) {
		return /** @type {string} */ (
			hexNeighbours(key).find((next) => game.hexes[next]?.tile === null)
		);
	}

	/**
	 * A review fixture, not a played game: a dealt large map where each player explored a territory next to their start
	 * and moved an outpost onto it, Bo conquered the middle island from Ana, Cy is the Traders and Dee the Nomads.
	 */
	function midGame() {
		const game = dealt(4, 7);
		// Tiles 17 and 41 have an island in the middle, 30 has clouds and 47 the volcano.
		const tiles = [17, 47, 41, 30];
		for (const seat of game.seats) {
			const start = startOf(game, seat.seat);
			const hex = unexploredNextTo(game, start);
			game.hexes[hex].tile = tiles[seat.seat - 1];
			game.hexes[hex].orient = seat.seat;
			game.hexes[start].outposts.pop();
			game.hexes[hex].outposts.push({ seat: seat.seat, toppled: false });
		}
		game.hexes['0_0'].outposts.push(
			{ seat: 1, toppled: true, toppledBy: 2 },
			{ seat: 2, toppled: false }
		);
		game.hexes[startOf(game, 3)].tokens.push({ seat: 3, civ: 'traders' });
		const nomads = startOf(game, 4);
		game.hexes[nomads].outposts.push(
			{ seat: 4, toppled: false, piece: { building: 'farm' } },
			{ seat: 4, toppled: true, piece: { landmark: 'lighthouse' } }
		);
		return game;
	}

	const small = mapHexes(dealt(3, 3));
	const large = mapHexes(dealt(4, 3));
	const busy = mapHexes(midGame());

	// A tile previewed on one unexplored hex: tile 17 (with an island), turned once.
	const previewGame = dealt(2, 5);
	const previewHex = hexNeighbours(startOf(previewGame, 1)).find(
		(key) => previewGame.hexes[key]?.tile === null
	);
	const previewTile = TERRITORY_TILES[16];
	const previewing = {
		hex: /** @type {string} */ (previewHex),
		corners: /** @type {any} */ (turned(previewTile.corners, 1)),
		island: /** @type {any} */ ([...previewTile.island]),
	};
	const previewHexes = mapHexes(previewGame);

	const exploring = dealt(2, 5);
	const exploringHexes = mapHexes(exploring);
	// Where Ana could explore: the unexplored hexes next to her start.
	const targets = hexNeighbours(startOf(exploring, 1)).filter(
		(key) => exploring.hexes[key]?.tile === null
	);
	// What the best tile would score on three of the lit hexes.
	const scores = Object.fromEntries(
		targets.slice(0, 3).map((key, i) => [key, [3, 2, 0][i]])
	);
	/** @type {string | null} */
	let chosen = $state(null);

	/**
	 * @param {import('../../../lib/component-event.js').ComponentEvent} event
	 */
	const selectHandler = (event) => {
		chosen = event.value.hex;
	};
</script>

<Section
	name="WorldMap"
	area="board"
	description="The board: the hexes of the game's map side, flat-topped, with start 1 at the top. The explored territories are painted at runtime as one 2.5D picture (#134): each run of one terrain, inside a tile and across hexes, is one mass, with a beach where land meets sea, the island in the middle, the cloud or volcano where hex-overlays.js puts them, and a faint rim and a faint edge between hexes; unexplored hexes use the unexplored picture and a dashed rim. Outposts are squares in their player's colour, lying down and outlined once toppled; a Nomads building or landmark carries a small mark, and a civilization token is a circle. With preview set, a tile not yet explored is painted on its own on its hex, at 85% opacity with a gold outline. With targets set, only the target hexes are buttons (green), the rest dim (a veil over their painted terrain), and the chosen one is outlined in gold. The map scales to fit its box.">
	<Example
		label={"hexes={mapHexes(view)}  (large map, 4 players dealt, in the shared area's box)"}
		wide
		width={1428}>
		<WorldMap
			hexes={large}
			style="height: 860px" />
	</Example>
	<Example
		label={'hexes={mapHexes(view)}  (small map, 3 players dealt)'}
		width={640}>
		<WorldMap
			hexes={small}
			label="Small map" />
	</Example>
	<Example
		label={'hexes={mapHexes(view)}  (mid-game fixture: explored tiles, two with islands, a cloud tile, the volcano, a conquered middle, a Traders token, Nomads pieces)'}
		width={640}>
		<WorldMap
			hexes={busy}
			label="Mid-game map" />
	</Example>
	<Example
		label={`targets={[${targets.map((key) => `'${key}'`).join(', ')}]} selected=${chosen === null ? 'null' : `'${chosen}'`}  (click or press Enter on a green hex)`}
		width={640}>
		<WorldMap
			hexes={exploringHexes}
			{targets}
			selected={chosen}
			label="Choose a hex to explore"
			onWorldMapSelect={selectHandler} />
	</Example>
	<Example
		label={`scores={${JSON.stringify(scores).replaceAll('"', "'")}}  (each lit hex shows the best VP the picked tile scores there)`}
		width={640}>
		<WorldMap
			hexes={exploringHexes}
			{targets}
			{scores}
			label="Scores on the lit hexes" />
	</Example>
	<Example
		label={`preview={{ hex: '${previewing.hex}', corners, island }}  (tile 17 turned once, shown before it is explored)`}
		width={640}>
		<WorldMap
			hexes={previewHexes}
			preview={previewing}
			label="Tile preview" />
	</Example>
</Section>
