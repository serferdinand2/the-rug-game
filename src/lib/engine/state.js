// The shape of the game state and of everything that works on it, plus the seat lookups.

/** @typedef {import('./data/ids.js').VersionId} VersionId */
/** @typedef {import('./data/ids.js').TrackId} TrackId */
/** @typedef {import('./data/ids.js').ResourceId} ResourceId */
/** @typedef {import('./data/ids.js').BuildingId} BuildingId */
/** @typedef {import('./random.js').Random} Random */
/** @typedef {{ seat: number, toppled: boolean }} Outpost */
/** @typedef {{ tile: number | null, orient: number, outposts: Outpost[] }} Hex */
/**
 * Common to every kind of seat.
 * @typedef {Object} Seat
 * @property {number} seat
 * @property {'player' | 'automa' | 'shadow'} kind
 * @property {string} name
 * @property {number} vp
 * @property {Record<TrackId, number[]>} tracks - Token spaces per track, [0] at the start
 * @property {TrackId[]} restartedTracks - Tracks whose token AI Singularity took off space 12; each still counts as complete, 12 spaces advanced (FAQ #9)
 * @property {number} outposts - In supply
 * @property {number} incomeTurns
 * @property {boolean} finished
 */
/**
 * Only on kind 'player'.
 * @typedef {Object} PlayerFields
 * @property {Record<ResourceId, number>} resources
 * @property {{ buildings: Record<BuildingId, number>, tapestry: string[][] }} incomeMat - Buildings left in each row; 4 era slots, each a stack
 * @property {{ mat: number | null }} capital
 * @property {string[]} besideMat - Landmarks that didn't fit
 * @property {string[]} hand
 * @property {{ bottom: string[], middle: string[], top: string[] }} tech
 * @property {number[]} territoryTiles
 * @property {number[]} spaceTiles
 * @property {number[]} exploredSpace
 * @property {string[]} civs
 * @property {{ capital?: number, civ?: string }} picks - Setup picks until the reveal
 */
/** @typedef {Seat & PlayerFields} PlayerSeat */
/**
 * @typedef {Object} Supply
 * @property {{ deck: string[], faceUp: string[], discard: string[] }} tech
 * @property {{ deck: string[], discard: string[] }} tapestry
 * @property {number[]} territory
 * @property {number[]} territoryDiscard - Discarded territory tiles, out of the game (FAQ #20)
 * @property {number[]} space
 * @property {string[]} civs
 * @property {number[]} capitals - Mats nobody holds, face up
 */
/** @typedef {{ id: number, batch: number, player: number | null, kind: string } & Record<string, any>} Operation */
/** @typedef {{ player: number | null, kind: string } & Record<string, any>} NewOperation */
/** @typedef {{ player: number, stack: Operation[] }} Lane */
/** @typedef {{ player: number, ops: NewOperation[] }} NewLane */
/** @typedef {{ id: number, batch: number, player: null, kind: 'group', lanes: Lane[] }} Group */
/** @typedef {{ seq: number, type: string, player?: number, secret?: Record<string, any> } & Record<string, any>} GameEvent */
/**
 * @typedef {Object} State
 * @property {VersionId} version
 * @property {string[]} expansions
 * @property {'small' | 'large'} map
 * @property {'setup' | 'play' | 'over'} phase
 * @property {number} first
 * @property {number | null} current
 * @property {(Seat | PlayerSeat)[]} seats - Index = seat - 1
 * @property {Supply} supply
 * @property {Record<string, Hex>} hexes
 * @property {string[]} landmarks - Ids nobody owns yet
 * @property {Record<string, number[]>} achievements - Seats in box order
 * @property {{ player: number, track: TrackId, space: number }[]} activated - Track spaces activated this turn, cleared when a turn starts (R19)
 * @property {(Operation | Group)[]} pending - Index 0 is the top
 * @property {number} nextId
 * @property {number} seq
 * @property {GameEvent[]} events
 */
/**
 * What a handler may use.
 * @typedef {Object} Context
 * @property {State} state
 * @property {Random} random
 * @property {(ops: NewOperation[]) => Operation[]} push - Onto the stack the handler runs in (the main stack or a lane)
 * @property {(lanes: NewLane[]) => Group} pushGroup - Main stack only; throws Error inside a lane
 */
/** @typedef {Record<string, any>} Answer - An action without its `decision` id */
/**
 * @typedef {Object} DecisionKind
 * @property {readonly string[]} hidden - Fields only the decision's player sees
 * @property {(state: State, decision: Operation) => Answer[]} answers - Every legal answer, default first
 * @property {(state: State, decision: Operation, answer: Answer) => void} check - Throws PlayerError
 * @property {(ctx: Context, decision: Operation, answer: Answer) => void} resolve
 */
/** @typedef {(ctx: Context, op: Operation) => void} AutomaticKind */
/** @typedef {(ctx: Context, player: number, value: any, op: Operation) => void} EffectHandler - `op` is the effects operation it runs in, with its `source` */

/**
 * Finds a seat of any kind.
 * @param {State} state
 * @param {number} seat - 1 to n
 * @returns {Seat | PlayerSeat}
 * @throws {Error} For an unknown seat (a bug, not a player's mistake)
 */
export function seatOf(state, seat) {
	const found = state.seats.find((s) => s.seat === seat);
	if (!found) {
		throw new Error(`There is no seat ${seat}.`);
	}
	return found;
}

/**
 * Whether `seat` names a seat of the game that holds a player's own things.
 * @param {State} state
 * @param {unknown} seat
 * @returns {boolean}
 */
export function isPlayerSeat(state, seat) {
	if (typeof seat !== 'number' || !Number.isInteger(seat)) {
		return false;
	}
	const found = state.seats.find((s) => s.seat === seat);
	return !!found && found.kind === 'player';
}

/**
 * Finds a seat that holds a player's own things (not an Automa or Shadow Empire).
 * @param {State} state
 * @param {number} seat - 1 to n
 * @returns {PlayerSeat}
 * @throws {Error} For an unknown seat or one that is not a player
 */
export function playerSeat(state, seat) {
	const found = seatOf(state, seat);
	if (found.kind !== 'player') {
		throw new Error(`Seat ${seat} is not a player.`);
	}
	return /** @type {PlayerSeat} */ (found);
}
