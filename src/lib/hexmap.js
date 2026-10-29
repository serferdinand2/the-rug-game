// The World Map's geometry (#26 design §5.2): flat-topped hexes laid out from the engine's axial keys, terrain wedges, the island, the pieces and the fit.
import {
	CLOUD_SIZE,
	CLOUD_SPOT,
	PICTURE_SIZE,
	VOLCANO_SIZE,
	VOLCANO_SPOTS,
	volcanoCorner,
} from './art/hex-overlays.js';
import { MAPS } from './engine/data/maps.js';
import { terrainsOf, turned } from './engine/terrain.js';
import { article, capitalize, countWords, joinList } from './words.js';
import {
	buildingName,
	civilizationName,
	hexName,
	landmarkName,
	seatName,
} from './game-names.js';

/** @typedef {[number, number]} Point - x and y, with y pointing down */
/** @typedef {{ x: number, y: number, width: number, height: number }} Box */
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
 * @property {boolean} clouds - The territory's picture shows clouds (R77); false while unexplored
 * @property {boolean} volcano - The territory's picture shows a volcano (R77); false while unexplored
 * @property {MapOutpost[]} outposts
 * @property {MapToken[]} tokens
 * @property {string} label - The hex for assistive technology: where it is, its terrains and whose pieces stand on it
 */

/** The hex size mapHexes lays the board out at: the distance from a hex's centre to its corners. */
export const HEX_SIZE = 40;

/** The island's small hexagon, as a share of the hex size. */
const ISLAND = 0.42;

const HALF_ROOT_3 = Math.sqrt(3) / 2;

/** The centre a territory's face is drawn round; each hex moves it to its own centre. */
const ORIGIN = /** @type {Point} */ ([0, 0]);

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
 * The coast: where one terrain is sea and the next is land, the radius they share, from the centre to the middle of
 * the side between their two corners. Wedge k and wedge k + 1 meet along the middle of side k.
 * @param {Point} center
 * @param {readonly Terrain[]} corners - Six terrains, clockwise from the top-left, already turned
 * @param {number} size
 * @returns {{ from: Point, to: Point }[]}
 */
export function coastLines(center, corners, size) {
	/** @type {{ from: Point, to: Point }[]} */
	const lines = [];
	corners.forEach((terrain, k) => {
		const next = corners[(k + 1) % 6];
		if ((terrain === 'sea') !== (next === 'sea')) {
			lines.push({
				from: center,
				to: middle(
					hexCorner(center, k, size),
					hexCorner(center, k + 1, size)
				),
			});
		}
	});
	return lines;
}

/**
 * Where a terrain hex picture (64 by 56, a hex of radius 32 touching its edges) goes for a hex of this size: its
 * bounding box, centred on the hex.
 * @param {Point} center
 * @param {number} size
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function hexPicture(center, size) {
	const height = 2 * HALF_ROOT_3 * size;
	return {
		x: center[0] - size,
		y: center[1] - height / 2,
		width: 2 * size,
		height,
	};
}

/**
 * Where an overlay from a territory picture goes on a hex, around the hex's centre: its spot and size in the 64×56
 * picture, scaled as hexPicture scales the whole picture.
 * @param {readonly [number, number]} spot - Its top-left pixel in the picture (src/lib/art/hex-overlays.js)
 * @param {readonly [number, number]} sizeInPicture - Its width and height in pixels
 * @param {number} size - The hex's size
 * @returns {{ x: number, y: number, width: number, height: number }} Relative to the hex's centre
 */
export function overlayBox(spot, sizeInPicture, size) {
	const [width, height] = PICTURE_SIZE;
	const across = (2 * size) / width;
	const down = (2 * HALF_ROOT_3 * size) / height;
	return {
		x: -size + spot[0] * across,
		y: -HALF_ROOT_3 * size + spot[1] * down,
		width: sizeInPicture[0] * across,
		height: sizeInPicture[1] * down,
	};
}

/**
 * A territory's face round the origin (#113): what TerritoryArt draws, cut by territoryClips at the same size.
 * @typedef {Object} TerritoryShapes
 * @property {Box} picture - Where each terrain picture goes, as hexPicture
 * @property {{ terrain: Terrain, k: number }[]} wedges - One per corner; wedge k is cut by the clips' wedges[k]
 * @property {Point[]} coasts - The far end of each coast line, which starts at the origin
 * @property {{ terrain: Terrain, n: number, i: number, points: string }[]} islands - Each part of the island, cut by
 *   the clips' islands[n − 1][i], with its outline
 * @property {Box | null} cloud - The cloud overlay, or null
 * @property {Box | null} volcano - The volcano overlay on its mountains' corner, or null
 */

/**
 * A territory's face round the origin, for a hex of this size: the terrain wedges, the coasts, the island and the
 * cloud and volcano overlays (R77), as the World Map and a tile in hand both draw it.
 * @param {readonly Terrain[]} corners - Six terrains, clockwise from the top-left, already turned
 * @param {readonly Terrain[]} island - Empty when there is none
 * @param {{ clouds: boolean, volcano: boolean }} pictures - What the territory's picture shows
 * @param {number} size
 * @returns {TerritoryShapes}
 */
export function territoryShapes(corners, island, { clouds, volcano }, size) {
	return {
		picture: hexPicture(ORIGIN, size),
		wedges: corners.map((terrain, k) => ({ terrain, k })),
		coasts: coastLines(ORIGIN, corners, size).map((line) => line.to),
		islands: islandParts(ORIGIN, island, size).map((part, i) => ({
			terrain: part.terrain,
			n: island.length,
			i,
			points: svgPoints(part.points),
		})),
		// The cloud sits at one spot in every turn; the volcano on its mountains' corner (#6).
		cloud: clouds ? overlayBox(CLOUD_SPOT, CLOUD_SIZE, size) : null,
		volcano: volcano
			? overlayBox(
					VOLCANO_SPOTS[volcanoCorner(corners)],
					[VOLCANO_SIZE, VOLCANO_SIZE],
					size
				)
			: null,
	};
}

/**
 * The clip outlines a territory's face is cut with, round the origin: the six wedges, and each part of an island of
 * 1 to 6 parts, which depends only on how many parts it has. One set serves every territory of this size.
 * @param {number} size
 * @returns {{ wedges: string[], islands: string[][] }} islands[n − 1][i] is part i of an island of n parts
 */
export function territoryClips(size) {
	return {
		wedges: [0, 1, 2, 3, 4, 5].map((k) =>
			svgPoints(cornerWedge(ORIGIN, k, size))
		),
		islands: [1, 2, 3, 4, 5, 6].map((n) =>
			islandParts(ORIGIN, Array(n).fill('sea'), size).map((part) =>
				svgPoints(part.points)
			)
		),
	};
}

/**
 * A territory in words, as every screen says it (#113): "sea, forest and mountain, with an island of desert, with
 * clouds". Each terrain is named once, in the order given. Clouds are scoring data (R77, #49), so a screen reader
 * hears them too.
 * @param {{ corners: readonly string[], island: readonly string[], clouds: boolean, volcano: boolean }} territory
 * @returns {string}
 */
export function territoryWords({ corners, island, clouds, volcano }) {
	let text = joinList([...new Set(corners)]);
	if (island.length > 0) {
		text += `, with an island of ${joinList([...new Set(island)])}`;
	}
	if (clouds) {
		text += ', with clouds';
	}
	if (volcano) {
		text += ', with a volcano';
	}
	return text;
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
	const nameOf = (seat) => seatName(view, seat);
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
			clouds: terrains?.clouds ?? false,
			volcano: terrains?.volcano ?? false,
			outposts,
			tokens,
			label: hexLabel(key, corners, island, outposts, tokens, nameOf, {
				clouds: terrains?.clouds ?? false,
				volcano: terrains?.volcano ?? false,
			}),
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
 * @param {{ clouds: boolean, volcano: boolean }} pictures - What the territory's picture shows (R77)
 * @returns {string}
 */
function hexLabel(key, corners, island, outposts, tokens, nameOf, pictures) {
	const land = corners
		? territoryWords({ corners, island, ...pictures })
		: 'unexplored';
	const seats = [
		...new Set([...outposts, ...tokens].map((item) => item.seat)),
	].sort((a, b) => a - b);
	const pieces = seats.map((seat) => {
		const own = outposts.filter((outpost) => outpost.seat === seat);
		const standing = own.filter((o) => !o.piece && !o.toppled).length;
		const toppled = own.filter((o) => !o.piece && o.toppled).length;
		const items = [
			...(standing ? [countWords(standing, 'outpost')] : []),
			...(toppled ? [countWords(toppled, 'toppled outpost')] : []),
			...own
				.filter((o) => o.piece)
				.map((o) => {
					const piece =
						/** @type {NonNullable<MapOutpost['piece']>} */ (
							o.piece
						);
					return withArticle(
						`${o.toppled ? 'toppled ' : ''}${pieceName(piece)}`
					);
				}),
			...tokens
				.filter((token) => token.seat === seat)
				.map((token) =>
					withArticle(`${civilizationName(token.civ)} token`)
				),
		];
		return `${nameOf(seat)}: ${items.join(', ')}.`;
	});
	return [`${capitalize(hexName(key))}: ${land}.`, ...pieces].join(' ');
}

/** @param {NonNullable<MapOutpost['piece']>} piece */
function pieceName(piece) {
	if (piece.kind === 'landmark') {
		return landmarkName(piece.id);
	}
	return buildingName(piece.id);
}

/**
 * A piece with its article: "a Farm", "an Armory".
 * @param {string} phrase
 * @returns {string}
 */
function withArticle(phrase) {
	return `${article(phrase)} ${phrase}`;
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
