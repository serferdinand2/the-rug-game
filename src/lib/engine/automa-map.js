// Automa's small-map hex tie-break patterns and traversable path distance (02 §9.6–§9.8; R41).
import { MAPS, hexNeighbours } from './data/maps.js';

/**
 * The companion app's hex order, produced from its row/column projection of
 * axial board coordinates. Its ID 16 is the middle island.
 * @type {readonly string[]}
 */
export const APP_HEXES = Object.freeze(
	[...MAPS.small.hexes].sort((left, right) => {
		const [leftA, leftB] = left.split('_').map(Number);
		const [rightA, rightB] = right.split('_').map(Number);
		const leftRow = leftA + leftB + 7;
		const rightRow = rightA + rightB + 7;
		const leftColumn = -leftA + leftB + 4;
		const rightColumn = -rightA + rightB + 4;
		return leftRow - rightRow || leftColumn - rightColumn;
	})
);

/** @type {readonly (readonly number[])[]} */
export const HEX_PATTERNS = Object.freeze(
	[
		[
			0, 2, 5, 1, 4, 7, 10, 14, 3, 6, 9, 13, 17, 21, 8, 12, 16, 20, 24,
			28, 11, 15, 19, 23, 27, 31, 18, 22, 26, 30, 33, 25, 29, 32,
		],
		[
			5, 2, 0, 14, 10, 7, 4, 1, 21, 17, 13, 9, 6, 3, 28, 24, 20, 16, 12,
			8, 31, 27, 23, 19, 15, 11, 33, 30, 26, 22, 18, 32, 29, 25,
		],
		[
			14, 21, 28, 5, 10, 17, 24, 31, 2, 7, 13, 20, 27, 33, 0, 4, 9, 16,
			23, 30, 1, 6, 12, 19, 26, 32, 3, 8, 15, 22, 29, 11, 18, 25,
		],
		[
			28, 21, 14, 31, 24, 17, 10, 5, 33, 27, 20, 13, 7, 2, 30, 23, 16, 9,
			4, 0, 32, 26, 19, 12, 6, 1, 29, 22, 15, 8, 3, 25, 18, 11,
		],
		[
			28, 31, 33, 21, 24, 27, 30, 32, 14, 17, 20, 23, 26, 29, 10, 13, 16,
			19, 22, 25, 5, 7, 9, 12, 15, 18, 2, 4, 6, 8, 11, 0, 1, 3,
		],
		[
			33, 31, 28, 32, 30, 27, 24, 21, 29, 26, 23, 20, 17, 14, 25, 22, 19,
			16, 13, 10, 18, 15, 12, 9, 7, 5, 11, 8, 6, 4, 2, 3, 1, 0,
		],
		[
			32, 29, 25, 33, 30, 26, 22, 18, 31, 27, 23, 19, 15, 11, 28, 24, 20,
			16, 12, 8, 21, 17, 13, 9, 6, 3, 14, 10, 7, 4, 1, 5, 2, 0,
		],
		[
			25, 29, 32, 18, 22, 26, 30, 33, 11, 15, 19, 23, 27, 31, 8, 12, 16,
			20, 24, 28, 3, 6, 9, 13, 17, 21, 1, 4, 7, 10, 14, 0, 2, 5,
		],
		[
			25, 18, 11, 29, 22, 15, 8, 3, 32, 26, 19, 12, 6, 1, 30, 23, 16, 9,
			4, 0, 33, 27, 20, 13, 7, 2, 31, 24, 17, 10, 5, 28, 21, 14,
		],
		[
			11, 18, 25, 3, 8, 15, 22, 29, 1, 6, 12, 19, 26, 32, 0, 4, 9, 16, 23,
			30, 2, 7, 13, 20, 27, 33, 5, 10, 17, 24, 31, 14, 21, 28,
		],
	].map((pattern) => Object.freeze(pattern))
);

/**
 * Small-map hexes in the companion app's card tie-break order (02 §7.3, §9.8).
 * @param {number} pattern - The card's 1-based hex-pattern id
 * @returns {string[]}
 * @throws {RangeError} When the pattern id is not 1–10
 */
export function hexesByPattern(pattern) {
	if (
		!Number.isInteger(pattern) ||
		pattern < 1 ||
		pattern > HEX_PATTERNS.length
	) {
		throw new RangeError(`Unknown Automa hex pattern ${pattern}.`);
	}
	return HEX_PATTERNS[pattern - 1].map((ordinal) => APP_HEXES[ordinal]);
}

/**
 * R41 path distance: move through hexes without an Automa outpost and with at
 * most one human-owned map item. Unexplored hexes can be on the path.
 * @param {import('./state.js').State} state
 * @param {number} automa - Automa's seat number
 * @param {number} human - Human seat number
 * @param {string} from
 * @param {string} to
 * @returns {number} Fewest hex steps, or Infinity when no route exists
 */
export function automaDistance(state, automa, human, from, to) {
	const board = new Set(MAPS[state.map].hexes);
	if (!board.has(from) || !board.has(to)) {
		return Infinity;
	}
	if (from === to) {
		return 0;
	}
	/** @param {string} hex */
	const passable = (hex) => {
		const { outposts, tokens } = state.hexes[hex];
		return (
			!outposts.some((outpost) => outpost.seat === automa) &&
			outposts.filter((outpost) => outpost.seat === human).length +
				tokens.filter((token) => token.seat === human).length <=
				1
		);
	};
	/** @type {{ hex: string, distance: number }[]} */
	const queue = [{ hex: from, distance: 0 }];
	const visited = new Set([from]);
	for (let at = 0; at < queue.length; at += 1) {
		const { hex, distance } = queue[at];
		for (const next of hexNeighbours(hex)) {
			if (!board.has(next) || visited.has(next) || !passable(next)) {
				continue;
			}
			if (next === to) {
				return distance + 1;
			}
			visited.add(next);
			queue.push({ hex: next, distance: distance + 1 });
		}
	}
	return Infinity;
}
