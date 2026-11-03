// The Islanders' mat on screen (#165): its 7 hexes laid out as a small map the World Map component can draw, and the keys that tie a mat hex of the engine ('mat:1:2') to a hex of that map.
import { hexNeighbours } from './engine/data/maps.js';
import {
	ISLANDERS_CENTRE,
	ISLANDERS_CENTRE_SLOTS,
	MAT_HEXES,
	matHex,
} from './engine/island.js';
import { TERRITORY_TILES } from './engine/data/territory-tiles.js';
import { turned } from './engine/terrain.js';
import { HEX_SIZE, hexCenter } from './hexmap.js';

/** @typedef {import('./hexmap.js').MapHex} MapHex */
/** @typedef {import('./hexmap.js').MapPreview} MapPreview */
/** @typedef {import('./ui.js').Terrain} Terrain */

/** The mat's printed centre, as the axial key of the small map. */
export const CENTRE_KEY = '0_0';

/** The small map's hex for each mat position: the centre's neighbours, side by side with the board's own sides. */
const RING = hexNeighbours(CENTRE_KEY);

/**
 * The small map's key for a mat hex id.
 * @param {string} hex - 'mat:<seat>:<position>'
 * @returns {string | null} Null for anything else
 */
export function matKey(hex) {
	const match = /^mat:\d+:([0-5])$/.exec(hex);
	return match ? RING[Number(match[1])] : null;
}

/**
 * The mat hex id of a small map's key, for a seat.
 * @param {number} seat
 * @param {string} key
 * @returns {string | null} Null for the centre, which nothing can be put on
 */
export function matId(seat, key) {
	const position = RING.indexOf(key);
	return position === -1 ? null : matHex(seat, position);
}

/**
 * Whether a seat holds the Islanders' mat: they have been set up.
 * @param {any} game - The game as view() gives it
 * @param {number} seat
 * @returns {boolean}
 */
export function hasMat(game, seat) {
	const found = game?.seats?.find((/** @type {any} */ s) => s.seat === seat);
	return Array.isArray(found?.civData?.islanders?.hexes);
}

/**
 * The mat's 7 hexes as a small map: the printed centre, then the six hexes with their tile or none.
 * @param {any} game - The game as view() gives it
 * @param {number} seat
 * @param {number} [size=HEX_SIZE]
 * @returns {MapHex[]}
 */
export function matMapHexes(game, seat, size = HEX_SIZE) {
	const found = game?.seats?.find((/** @type {any} */ s) => s.seat === seat);
	/** @type {({ tile: number, orient: number } | null)[]} */
	const lying = found?.civData?.islanders?.hexes ?? [];
	/** @param {string} key @param {Terrain[] | null} corners @param {Terrain[]} island @param {boolean} clouds @param {boolean} volcano @param {string} label @param {number | null} [tile] */
	const hex = (
		key,
		corners,
		island,
		clouds,
		volcano,
		label,
		tile = null
	) => ({
		key,
		center: hexCenter(key, size),
		corners,
		island,
		clouds,
		volcano,
		tile,
		outposts: [],
		tokens: [],
		label,
	});
	return [
		{
			...hex(
				CENTRE_KEY,
				/** @type {Terrain[]} */ ([...ISLANDERS_CENTRE]),
				[],
				false,
				false,
				'The printed centre of the Islanders mat'
			),
			// Painted in its 12 sectors, as it scores: a quarter of the hex for each terrain.
			slots: /** @type {Terrain[]} */ ([...ISLANDERS_CENTRE_SLOTS]),
		},
		...RING.map((key, position) => {
			const tile = lying[position] ?? null;
			if (!tile) {
				return hex(
					key,
					null,
					[],
					false,
					false,
					`Islanders mat hex ${position + 1}: empty`
				);
			}
			const data = TERRITORY_TILES[tile.tile - 1];
			return hex(
				key,
				/** @type {Terrain[]} */ (
					/** @type {unknown} */ (turned(data.corners, tile.orient))
				),
				/** @type {Terrain[]} */ (
					/** @type {unknown} */ ([...data.island])
				),
				data.clouds,
				data.volcano,
				`Islanders mat hex ${position + 1}: tile ${tile.tile}`,
				tile.tile
			);
		}),
	];
}

/**
 * The small map's targets, scores, selection and preview for the mat hexes of a prompt: the board's own are left out.
 * @param {{ targets: string[], scores: Record<string, number>, selected: string | null, preview: MapPreview | null }} prompt
 * @returns {{ targets: string[], scores: Record<string, number>, selected: string | null, preview: MapPreview | null }}
 */
export function matPrompt({ targets, scores, selected, preview }) {
	/** @type {Record<string, number>} */
	const matScores = {};
	for (const [hex, vp] of Object.entries(scores)) {
		const key = matKey(hex);
		if (key) {
			matScores[key] = vp;
		}
	}
	const previewKey = preview ? matKey(preview.hex) : null;
	return {
		targets: targets.flatMap((hex) => matKey(hex) ?? []),
		scores: matScores,
		selected: selected ? matKey(selected) : null,
		preview: preview && previewKey ? { ...preview, hex: previewKey } : null,
	};
}

/** How many hexes ring the centre. */
export const MAT_SIZE = MAT_HEXES;
