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
 * @property {{ buildings: Record<BuildingId, number>, tapestry: string[][], faceDown: string[], slid?: Partial<Record<BuildingId, number>>, flush?: Partial<Record<BuildingId, boolean>> }} incomeMat - Buildings left in each row; 4 era slots, each a stack; the ids of face-down cards, which view() hides; the
 *   Artificers' rows whose leftmost building slid left, by how far, and their row slid flush left (F&F, #40)
 * @property {{ mat: number | null, buildings: import('./city.js').PlacedBuilding[], landmarks: import('./city.js').PlacedLandmark[], cubes: number[], tokens?: { row: number, col: number, seat: number }[] }} capital - `landmarks`: those covering at least 1 grid plot (R13); `cubes`: the plots the Architects' cubes make impassable (#20 design §5)
 * @property {string[]} besideMat - Landmark and income building ids that didn't fit, in order
 * @property {string[]} hand
 * @property {{ bottom: string[], middle: string[], top: string[] }} tech
 * @property {number[]} territoryTiles
 * @property {number[]} spaceTiles
 * @property {number[]} exploredSpace
 * @property {string[]} civs - The civilization chosen at setup first, then those gained later (#20 design §5)
 * @property {Record<string, any>} civData - Each civilization's own state, by civilization id; public, like everything on a civilization mat
 * @property {Era | null} era - The active THIS ERA ability, if any
 * @property {boolean} [playingOn] - F&F: the Elder Ones or the Merfolk, playing on after income turn 5 until they can't (#40)
 * @property {{ capital?: number, civ?: string, dealt?: number[] }} picks - Setup picks until the reveal; `dealt` is every
 * mat a joint pick was dealt (#36), so the reveal returns the others to the supply
 * @property {{ card: string, gained: boolean } | null} landmarkCard - The landmark card drafted at setup, face up, and whether its landmark is gained (#32)
 * @property {string | null} start - The hex its two outposts started on, its capital-city territory; null until setup places them (#33)
 * @property {{ card: string, used: boolean }[]} [masterpieces] - With the arts track only: the masterpieces held, in the order gained, public; `used` for a single-use card turned face down (#35)
 * @property {BuildingId[]} [inspired] - With the arts track only: the income rows that hold the player's inspiration tile, in the order placed (#35)
 * @property {Record<string, string>} [techLandmarks] - With A&A only: the landmark each landmark tech card holds, by card (03 §2, #37)
 * @property {{ card: string, gained: boolean }[]} [extraLandmarkCards] - With A&A only: the landmark cards kept besides the drafted one (Infrastructure Upgrade, #37)
 * @property {Record<string, import('./card-pieces.js').CardPiece[]>} [onCards] - With A&A only: the pieces on each tapestry card of theirs that holds some, by the card on the mat (#37)
 * @property {boolean} [playedCharmed] - With F&F only: whether a charmed tapestry card ever went face up onto their mat, for the charm-or-5 tech prerequisite (R68, #39)
 * @property {string[]} [charmsUsed] - With F&F only: the cards on their mat whose right charm has triggered, each once (R67, #39)
 * @property {import('./effects/reserved.js').ReservedItem[]} [reserved] - With F&F only: the items on their income mat's overlay, in the order placed (03 FF.2.2, #39)
 * @property {string[]} [flippedTech] - With F&F only: their single-use tech cards whose square was gained, flipped for good (03 FF.2.3, #39)
 */
/** @typedef {Seat & PlayerFields & { kind: 'player' }} PlayerSeat */
/**
 * A bot's common state. Its rule-specific fields belong to its own bot module,
 * never to PlayerFields: neither bot has a player's hand, mat or resources.
 * `landmarks` is its physical box; solo Shadow acquisitions are stored in Automa's box instead (02 §9.5).
 * @typedef {Seat & { kind: 'automa' | 'shadow', landmarks: string[] }} BotSeat
 */
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
 * @property {string[]} [landmarkDiscard] - With A&A only: the landmarks discarded with their tech card, out of the game (03 §2, #37)
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
 * @property {'advance' | 'income' | 'merfolk' | null} turnKind - The kind of turn the current player chose, null until they choose; 'merfolk' is
 *   the Merfolk's turn after income turn 5 (#40)
 *   and outside play; income turn 1 is an income turn without a choice (#33: the Advisors give only on advance turns)
 * @property {(Seat | PlayerSeat)[]} seats - Index = seat - 1
 * @property {Supply} supply
 * @property {Record<string, Hex>} hexes
 * @property {string[]} landmarks - Ids nobody owns yet
 * @property {Record<string, number[]>} achievements - Seats in box order
 * @property {{ player: number, track: TrackId, space: number }[]} activated - Track spaces activated this turn, cleared when a turn starts (R19)
 * @property {{ player: number, card: string }[]} usedThisTurn - Tech cards whose once-per-turn benefit was used this turn, cleared when a turn starts (FAQ #6)
 * @property {{ player: number, card: string }[]} lockedTech - Tech cards Ceramics upgraded this turn, which may not be upgraded again until a turn starts (#35, RB-AA p3)
 * @property {{ player: number, track: TrackId, tier: 2 | 3 | 4 }[]} takenTiers - Tiers the player whose turn it is moved into this turn whose landmark was already taken, for the Castle's goal; cleared when a turn starts (#35, 03 §2.10)
 * @property {{ player: number, track: TrackId }[]} blocks - Dictatorship blocks: the player's opponents may not advance on the track until turn order next reaches or skips the player (R26)
 * @property {{ player: number, guess?: TrackId, hit?: TrackId }[]} [omens] - Good Omens' guesses this turn, and the first
 *   right one, rewarded at the turn's end (F&F, #40)
 * @property {{ player: number, track: TrackId }[]} [spymasters] - Played Spymasters whose advance comes at the end of the turn (A&A, R127); set once one is played
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
 * Creates only a bot's shared pieces; setup adds its rule-specific state.
 * @param {number} seat - 1 to n
 * @param {'automa' | 'shadow'} kind
 * @param {string} name
 * @param {readonly string[]} tracks - The tracks in play
 * @param {number} outposts - Validated supply chosen by setup; map placement is separate
 * @returns {BotSeat}
 */
export function createBotSeat(seat, kind, name, tracks, outposts) {
	return {
		seat,
		kind,
		name,
		vp: 0,
		vpSources: {},
		tracks: /** @type {Record<TrackId, number[]>} */ (
			Object.fromEntries(tracks.map((id) => [id, [0]]))
		),
		restartedTracks: [],
		outposts,
		incomeTurns: 0,
		finished: false,
		landmarks: [],
	};
}

/**
 * Whether `seat` names an Automa or Shadow Empire seat of the game.
 * @param {State} state
 * @param {unknown} seat
 * @returns {boolean}
 */
export function isBotSeat(state, seat) {
	if (typeof seat !== 'number' || !Number.isInteger(seat)) {
		return false;
	}
	const found = state.seats.find((s) => s.seat === seat);
	return !!found && (found.kind === 'automa' || found.kind === 'shadow');
}

/**
 * Finds an Automa or Shadow Empire seat without treating it as a player.
 * @param {State} state
 * @param {number} seat - 1 to n
 * @returns {BotSeat}
 * @throws {Error} For an unknown seat or one that is not a bot
 */
export function botSeat(state, seat) {
	const found = seatOf(state, seat);
	if (found.kind !== 'automa' && found.kind !== 'shadow') {
		throw new Error(`Seat ${seat} is not a bot.`);
	}
	return /** @type {BotSeat} */ (found);
}

/**
 * A seat's neighbours: the seats directly before and after it in seat order, each once (01 §4.2).
 * Bots count as neighbours too. With two seats the one opponent is both; alone, a seat has none.
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
