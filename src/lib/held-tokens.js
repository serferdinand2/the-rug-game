// Another player's token moves while their advance shows (#179 design): where the queue of displays holds each token, and the track board drawn with the holds.

/**
 * Where the board draws one player's token on one track while an advance of theirs is queued.
 * @typedef {Object} TokenHold
 * @property {number} position - The space the token is drawn on
 * @property {number} final - The space the queued advances leave it on; the hold is drawn only while the game's position is this one
 */

/** No token held, as under reduced motion: never changed. @type {ReadonlyMap<string, TokenHold>} */
export const NO_HOLDS = new Map();

/**
 * The key of a player's token on a track, as `heldTokens()` maps it.
 * @param {number} seat
 * @param {string} track
 * @returns {string}
 */
export function holdKey(seat, track) {
	return `${seat}:${track}`;
}

/**
 * The tokens the queue holds back: an advance not yet on show keeps its player's token on the space it left, and the
 * one on show, once its display has moved it, puts the token on the space it reached. The first queued advance for a
 * player and track decides, so queued advances move a token one display at a time.
 * @param {import('./player-actions.js').ActionQueue} queue
 * @param {boolean} moved - The display on show has moved its token
 * @returns {Map<string, TokenHold>}
 */
export function heldTokens(queue, moved) {
	/** @type {Map<string, TokenHold>} */
	const held = new Map();
	queue.items.forEach((item, index) => {
		if (index < queue.at || item.kind !== 'advance') {
			return;
		}
		const { track, space, from } = item.picture;
		const key = holdKey(item.player, track);
		const hold = held.get(key);
		if (hold) {
			hold.final = space;
			return;
		}
		held.set(key, {
			position: index === queue.at && moved ? space : from,
			final: space,
		});
	});
	return held;
}

/**
 * The track board with each held token on its held space, while the game's position is the hold's final one: a token
 * another move has since taken elsewhere (a step back, an income turn's advance, AI Singularity's restart) is drawn
 * where it is. With `still`, every player is marked so their tokens go to their spaces without a hop (Skip all).
 * A track with nothing to change is returned as it was.
 * @template {{ id: string, players: { seat: number, position: number, still?: boolean }[] }} T
 * @param {T[]} tracks - The board, from trackBoard()
 * @param {ReadonlyMap<string, TokenHold>} held - From heldTokens()
 * @param {boolean} [still=false]
 * @returns {T[]}
 */
export function holdTokens(tracks, held, still = false) {
	return tracks.map((track) => {
		const holds = track.players.map((player) => {
			const hold = held.get(holdKey(player.seat, track.id));
			return hold && hold.final === player.position ? hold : null;
		});
		if (!still && holds.every((hold) => hold === null)) {
			return track;
		}
		return {
			...track,
			players: track.players.map((player, index) => ({
				...player,
				position: holds[index]?.position ?? player.position,
				...(still ? { still: true } : {}),
			})),
		};
	});
}
