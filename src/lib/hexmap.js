// The World Map's geometry (#26 design §5.2): flat-topped hexes laid out from the engine's axial keys, terrain wedges, the island, the pieces and the fit.
import { MAPS } from './engine/data/maps.js';
import { LANDMARKS } from './engine/data/landmarks.js';
import { terrainsOf, turned } from './engine/terrain.js';

/** @typedef {[number, number]} Point - x and y, with y pointing down */
/** @typedef {import('./ui.js').Terrain} Terrain */
/** @typedef {import('./ui.js').Seat} Seat */

/**
 * An outpost on a hex, standing or toppled, or a Nomads building or landmark that counts like one.
 * @typedef {Object} MapOutpost
 * @property {Seat} seat
 * @property {boolean} toppled
 * @property {{ kind: 'building' | 'landmark', id: string } | null} piece - The Nomads piece; null for an outpost
 */

/**
 * A civilization's token on a hex (Traders, Isolationists).
 * @typedef {Object} MapToken
 * @property {Seat} seat
 * @property {string} civ - The civilization's id, such as 'traders'
 */

/**
 * One hex of the board, ready to draw.
 * @typedef {Object} MapHex
 * @property {string} key - The engine's axial key, such as '2_-1'
 * @property {Point} center - At HEX_SIZE, or the size mapHexes was given
 * @property {Terrain[] | null} corners - The terrain at each of the 6 corners, clockwise from the top-left, already
 *   turned; null while the hex is unexplored
 * @property {Terrain[]} island - The terrains of an island in the middle, empty when there is none
 * @property {MapOutpost[]} outposts
 * @property {MapToken[]} tokens
 * @property {string} label - The hex for assistive technology: where it is, its terrains and whose pieces stand on it
 */

/** The hex size mapHexes lays the board out at: the distance from a hex's centre to its corners. */
export const HEX_SIZE = 40;

/** The island's small hexagon, as a share of the hex size. */
const ISLAND = 0.42;

const HALF_ROOT_3 = Math.sqrt(3) / 2;

/** Each corner's offset from the centre for a hex of size 1: top-left first, then clockwise (y points down). */
const CORNERS = /** @type {readonly Point[]} */ ([
	[-0.5, -HALF_ROOT_3],
	[0.5, -HALF_ROOT_3],
	[1, 0],
	[0.5, HALF_ROOT_3],
	[-0.5, HALF_ROOT_3],
	[-1, 0],
]);

/**
 * The centre of hex `a_b`: x = 1.5·s·(b − a), y = (√3/2)·s·(a + b). Start 1 is then at the top and the others
 * clockwise, as on the printed board, and side e of every hex faces its neighbour at HEX_SIDES[e].
 * @param {string} key - An axial key, such as '2_-1'
 * @param {number} size - The distance from a hex's centre to its corners
 * @returns {Point}
 */
export function hexCenter(key, size) {
	const [a, b] = key.split('_').map(Number);
	return [1.5 * size * (b - a), HALF_ROOT_3 * size * (a + b)];
}

/**
 * A corner of a flat-topped hex: 0 is the top-left vertex, then clockwise. Side e runs from corner e to corner e + 1.
 * @param {Point} center
 * @param {number} k - 0 to 5; other whole numbers wrap round
 * @param {number} size
 * @returns {Point}
 */
export function hexCorner(center, k, size) {
	const [dx, dy] = CORNERS[((k % 6) + 6) % 6];
	return [center[0] + dx * size, center[1] + dy * size];
}

/**
 * The wedge showing corner k's terrain: the centre, the middle of side k − 1, corner k and the middle of side k.
 * The six wedges tile the hex.
 * @param {Point} center
 * @param {number} k - 0 to 5
 * @param {number} size
 * @returns {Point[]}
 */
export function cornerWedge(center, k, size) {
	const before = hexCorner(center, k - 1, size);
	const corner = hexCorner(center, k, size);
	const after = hexCorner(center, k + 1, size);
	return [center, middle(before, corner), corner, middle(corner, after)];
}

/**
 * The island in the middle of a hex: a small hexagon split into one part per terrain, clockwise from the top-left.
 * @param {Point} center
 * @param {readonly Terrain[]} island - Empty when the hex has none
 * @param {number} size
 * @returns {{ terrain: Terrain, points: Point[] }[]}
 */
export function islandParts(center, island, size) {
	const radius = ISLAND * size;
	if (island.length === 1) {
		return [
			{
				terrain: island[0],
				points: CORNERS.map((_, k) => hexCorner(center, k, radius)),
			},
		];
	}
	return island.map((terrain, i) => {
		const ks = [0, 1, 2, 3, 4, 5].filter(
			(k) => Math.floor((k * island.length) / 6) === i
		);
		const last = /** @type {number} */ (ks.at(-1));
		return {
			terrain,
			points: [
				center,
				...ks.map((k) => hexCorner(center, k, radius)),
				hexCorner(center, last + 1, radius),
			],
		};
	});
}

/**
 * Where the pieces on a hex stand: side by side in one row, through the middle, or below the island when there is one.
 * The row shrinks to stay inside the hex.
 * @param {Point} center
 * @param {number} count
 * @param {boolean} island - The hex has an island, which the pieces leave visible
 * @param {number} size
 * @returns {{ x: number, y: number, size: number }[]} The centre and side of each piece's square spot
 */
export function pieceSpots(center, count, island, size) {
	const pad = 0.1 * size;
	// Just below the island's small hexagon.
	const top = (ISLAND * HALF_ROOT_3 + 0.04) * size;
	let piece = 0.34 * size;
	let gap = 0;
	let width = 0;
	let y = 0;
	for (;;) {
		gap = piece / 4;
		width = count * piece + (count - 1) * gap;
		y = island ? top + piece / 2 : 0;
		// A flat-topped hex narrows by 1/√3 for every unit away from its middle row.
		const lowest = Math.abs(y) + piece / 2;
		const room = 2 * (size - lowest / Math.sqrt(3) - pad);
		if (width <= room) {
			break;
		}
		piece *= 0.9;
	}
	return Array.from({ length: count }, (_, i) => ({
		x: center[0] - width / 2 + piece / 2 + i * (piece + gap),
		y: center[1] + y,
		size: piece,
	}));
}

/**
 * The view box that fits a set of hexes, with a margin for their edges.
 * @param {readonly { center: Point }[]} hexes
 * @param {number} size
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function fitBox(hexes, size) {
	if (hexes.length === 0) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}
	const margin = 0.1 * size;
	const xs = hexes.map((hex) => hex.center[0]);
	const ys = hexes.map((hex) => hex.center[1]);
	const left = Math.min(...xs) - size - margin;
	const top = Math.min(...ys) - HALF_ROOT_3 * size - margin;
	return {
		x: left,
		y: top,
		width: Math.max(...xs) + size + margin - left,
		height: Math.max(...ys) + HALF_ROOT_3 * size + margin - top,
	};
}

/**
 * A hex's name for players: its axial key with a true minus sign, such as '2,−1'.
 * @param {string} key
 * @returns {string}
 */
export function hexName(key) {
	return key.replace('_', ',').replaceAll('-', '−');
}

/**
 * A list of points as an SVG `points` attribute.
 * @param {readonly Point[]} points
 * @returns {string}
 */
export function svgPoints(points) {
	return points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
}

/**
 * Every hex of the game's map side, from a game view: its terrains, its pieces and its label.
 * @param {import('./engine/view.js').View} view - The game, as view() gives it to any seat
 * @param {number} [size=HEX_SIZE]
 * @returns {MapHex[]}
 */
export function mapHexes(view, size = HEX_SIZE) {
	// terrainsOf reads only the map side and the hexes, which every view shows.
	const state = /** @type {import('./engine/state.js').State} */ (
		/** @type {unknown} */ (view)
	);
	/** @param {number} seat */
	const nameOf = (seat) => view.seats[seat - 1]?.name ?? `Seat ${seat}`;
	return MAPS[view.map].hexes.map((key) => {
		const hex = view.hexes[key];
		const terrains = terrainsOf(state, key);
		/** @type {Terrain[] | null} */
		const corners = terrains ? turned(terrains.corners, hex.orient) : null;
		/** @type {Terrain[]} */
		const island = terrains ? [...terrains.island] : [];
		/** @type {MapOutpost[]} */
		const outposts = hex.outposts.map((outpost) => ({
			seat: /** @type {Seat} */ (outpost.seat),
			toppled: outpost.toppled,
			piece: pieceOf(outpost.piece),
		}));
		/** @type {MapToken[]} */
		const tokens = hex.tokens.map((token) => ({
			seat: /** @type {Seat} */ (token.seat),
			civ: token.civ,
		}));
		return {
			key,
			center: hexCenter(key, size),
			corners,
			island,
			outposts,
			tokens,
			label: hexLabel(key, corners, island, outposts, tokens, nameOf),
		};
	});
}

/**
 * @param {import('./engine/state.js').Outpost['piece']} piece
 * @returns {MapOutpost['piece']}
 */
function pieceOf(piece) {
	if (!piece) {
		return null;
	}
	if ('building' in piece) {
		return { kind: 'building', id: piece.building };
	}
	return { kind: 'landmark', id: piece.landmark };
}

/**
 * "Hex 2,−1: desert and sea. Ana: 2 outposts. Bo: 1 toppled outpost, a Traders token."
 * @param {string} key
 * @param {Terrain[] | null} corners
 * @param {Terrain[]} island
 * @param {MapOutpost[]} outposts
 * @param {MapToken[]} tokens
 * @param {(seat: number) => string} nameOf
 * @returns {string}
 */
function hexLabel(key, corners, island, outposts, tokens, nameOf) {
	let land = corners ? words([...new Set(corners)]) : 'unexplored';
	if (island.length > 0) {
		land += `, with an island of ${words(island)}`;
	}
	const seats = [
		...new Set([...outposts, ...tokens].map((item) => item.seat)),
	].sort((a, b) => a - b);
	const pieces = seats.map((seat) => {
		const own = outposts.filter((outpost) => outpost.seat === seat);
		const standing = own.filter((o) => !o.piece && !o.toppled).length;
		const toppled = own.filter((o) => !o.piece && o.toppled).length;
		const items = [
			...(standing ? [count(standing, 'outpost')] : []),
			...(toppled ? [count(toppled, 'toppled outpost')] : []),
			...own
				.filter((o) => o.piece)
				.map((o) => {
					const piece =
						/** @type {NonNullable<MapOutpost['piece']>} */ (
							o.piece
						);
					return article(
						`${o.toppled ? 'toppled ' : ''}${pieceName(piece)}`
					);
				}),
			...tokens
				.filter((token) => token.seat === seat)
				.map((token) => article(`${titleCase(token.civ)} token`)),
		];
		return `${nameOf(seat)}: ${items.join(', ')}.`;
	});
	return [`Hex ${hexName(key)}: ${land}.`, ...pieces].join(' ');
}

/** @param {NonNullable<MapOutpost['piece']>} piece */
function pieceName(piece) {
	if (piece.kind === 'landmark') {
		return (
			LANDMARKS.find((landmark) => landmark.id === piece.id)?.name ??
			titleCase(piece.id)
		);
	}
	return titleCase(piece.id);
}

/**
 * "desert", "desert and sea", "desert, forest and sea".
 * @param {readonly string[]} list
 */
function words(list) {
	if (list.length < 2) {
		return list.join('');
	}
	return `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
}

/**
 * @param {number} n
 * @param {string} noun
 */
function count(n, noun) {
	return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

/** @param {string} phrase */
function article(phrase) {
	return `${/^[aeiou]/i.test(phrase) ? 'an' : 'a'} ${phrase}`;
}

/** @param {string} id - Kebab case, such as 'the-chosen' */
function titleCase(id) {
	return id
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * @param {Point} a
 * @param {Point} b
 * @returns {Point}
 */
function middle(a, b) {
	return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/** @param {number} n */
function round(n) {
	return Math.round(n * 100) / 100;
}
