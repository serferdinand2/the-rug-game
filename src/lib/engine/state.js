// The shape of the game state and of everything that works on it, plus the seat lookups.

/** @typedef {import('./data/ids.js').VersionId} VersionId */
/** @typedef {import('./data/ids.js').TrackId} TrackId */
/** @typedef {import('./data/ids.js').ResourceId} ResourceId */
/** @typedef {import('./data/ids.js').BuildingId} BuildingId */
/** @typedef {import('./random.js').Random} Random */
/**
 * An outpost on a hex, or a Nomads piece: a building or landmark that gives control and topples like an outpost, but is
 * never counted as one (#20 design §8).
 * @typedef {{ seat: number, toppled: boolean, toppledBy?: number, piece?: { building: BuildingId } | { landmark: string } }} Outpost
 */
/**
 * A civilization's token on a hex (Traders, Isolationists, the Infiltrators' player tokens). It is an item, but gives
 * no control (R33), except a Treasure Hunters token's (R114).
 * @typedef {{ seat: number, civ: string }} MapToken
 */
/**
 * A map hex. Its items are its outposts (pieces included) and its tokens; with more than one, nobody can conquer it.
 * `shared` marks a territory the Infiltrators share with an opponent: each seat with an upright outpost there controls
 * it (#33, 03 §1.3). A base game never sets it.
 * @typedef {{ tile: number | null, orient: number, outposts: Outpost[], tokens: MapToken[], shared?: boolean }} Hex
 */
/**
 * A player's active THIS ERA ability (design §5).
 * @typedef {Object} Era
 * @property {string | null} card - The card on the income mat whose covering ends it
 * @property {string} ability - The card whose rules apply; it differs from `card` only for a copied ability (Espionage)
 * @property {number} [opponent] - Named by Alliance and Marriage of State
 * @property {TrackId} [track] - Named by Marriage of State
 */
/**
 * Common to every kind of seat.
 * @typedef {Object} Seat
 * @property {number} seat
 * @property {'player' | 'automa' | 'shadow'} kind
 * @property {string} name
 * @property {number} vp
 * @property {Partial<Record<import('./stack.js').VpSource, number>>} vpSources - VP by where it came from; adds up to vp (#29)
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
 * @property {{ buildings: Record<BuildingId, number>, tapestry: string[][], faceDown: string[] }} incomeMat - Buildings left in each row; 4 era slots, each a stack; the ids of face-down cards, which view() hides
 * @property {{ mat: number | null, buildings: import('./city.js').PlacedBuilding[], landmarks: import('./city.js').PlacedLandmark[], cubes: number[] }} capital - `landmarks`: those covering at least 1 grid plot (R13); `cubes`: the plots the Architects' cubes make impassable (#20 design §5)
 * @property {string[]} besideMat - Landmark and income building ids that didn't fit, in order
 * @property {string[]} hand
 * @property {{ bottom: string[], middle: string[], top: string[] }} tech
 * @property {number[]} territoryTiles
 * @property {number[]} spaceTiles
 * @property {number[]} exploredSpace
 * @property {string[]} civs - The civilization chosen at setup first, then those gained later (#20 design §5)
 * @property {Record<string, any>} civData - Each civilization's own state, by civilization id; public, like everything on a civilization mat
 * @property {Era | null} era - The active THIS ERA ability, if any
 * @property {{ capital?: number, civ?: string }} picks - Setup picks until the reveal
 * @property {{ card: string, gained: boolean } | null} landmarkCard - The landmark card drafted at setup, face up, and whether its landmark is gained (#32)
 * @property {string | null} start - The hex its two outposts started on, its capital-city territory; null until setup places them (#33)
 * @property {{ card: string, used: boolean }[]} [masterpieces] - With the arts track only: the masterpieces held, in the order gained, public; `used` for a single-use card turned face down (#35)
 * @property {BuildingId[]} [inspired] - With the arts track only: the income rows that hold the player's inspiration tile, in the order placed (#35)
 */
/** @typedef {Seat & PlayerFields} PlayerSeat */
/**
 * @typedef {Object} Supply
 * @property {{ deck: string[], faceUp: string[], discard: string[] }} tech
 * @property {{ deck: string[], discard: string[] }} tapestry
 * @property {number[]} territory
 * @property {number[]} territoryDiscard - Discarded territory tiles, out of the game (FAQ #20)
 * @property {number[]} space
 * @property {number[]} spaceDiscard - Discarded space tiles (the Aliens' mat, #33), out of the game, face up
 * @property {string[]} civs
 * @property {string[]} civDiscard - Civilizations discarded mid-game (Mystics), face up; the newest last
 * @property {number[]} capitals - Mats nobody holds, face up
 * @property {string[]} landmarkCards - The face-down landmark deck: the cards nobody drafted (#32)
 * @property {{ deck: string[], faceUp: string[], discard: string[] }} [masterpieces] - With the arts track only: the face-down deck, the 3 face up and the discards, face up (#35)
 */
/** @typedef {{ id: number, batch: number, player: number | null, kind: string } & Record<string, any>} Operation - `origin`, when set, is where its VP counts (#29) */
/** @typedef {{ player: number | null, kind: string } & Record<string, any>} NewOperation */
/** @typedef {{ player: number, stack: Operation[] }} Lane */
/** @typedef {{ player: number, ops: NewOperation[] }} NewLane */
/** @typedef {{ id: number, batch: number, player: null, kind: 'group', lanes: Lane[] }} Group */
/** @typedef {{ seq: number, type: string, player?: number, secret?: Record<string, any> } & Record<string, any>} GameEvent */
/**
 * @typedef {Object} State
 * @property {VersionId} version
 * @property {string[]} expansions
 * @property {string[]} variants - The ids of the optional variants switched on, from VARIANTS (#53)
 * @property {boolean} confirmEnd - Whether each turn ends with a `confirmEndTurn` its player answers, so undo and the last outcome stay in reach (#146)
 * @property {'small' | 'large'} map
 * @property {'setup' | 'play' | 'over'} phase
 * @property {number} first
 * @property {number | null} current
 * @property {number} turn - Turns started so far: 0 during setup, 1 for the first turn
 * @property {'advance' | 'income' | null} turnKind - The kind of turn the current player chose, null until they choose
 *   and outside play; income turn 1 is an income turn without a choice (#33: the Advisors give only on advance turns)
 * @property {(Seat | PlayerSeat)[]} seats - Index = seat - 1
 * @property {Supply} supply
 * @property {Record<string, Hex>} hexes
 * @property {string[]} landmarks - Ids nobody owns yet
 * @property {Record<string, number[]>} achievements - Seats in box order
 * @property {{ player: number, track: TrackId, space: number }[]} activated - Track spaces activated this turn, cleared when a turn starts (R19)
 * @property {{ player: number, card: string }[]} usedThisTurn - Tech cards whose once-per-turn benefit was used this turn, cleared when a turn starts (FAQ #6)
 * @property {{ player: number, track: TrackId }[]} blocks - Dictatorship blocks: the player's opponents may not advance on the track until turn order next reaches or skips the player (R26)
 * @property {import('./ranking.js').Result | null} result - The final ranking, once the game is over
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

/**
 * A seat's neighbours: the seats directly before and after it in seat order, each once (01 §4.2).
 * In a 2-player game the one opponent is both; alone, a seat has none until #31 adds the bots.
 * It lives here, with the other seat lookups, so the gain effect can find the Advisors without importing income.js (#33).
 * @param {State} state
 * @param {number} player
 * @returns {number[]}
 */
export function neighbours(state, player) {
	const { seats } = state;
	const at = seats.findIndex((s) => s.seat === player);
	const around = [
		seats[(at - 1 + seats.length) % seats.length].seat,
		seats[(at + 1) % seats.length].seat,
	];
	return [...new Set(around)].filter((seat) => seat !== player);
}
