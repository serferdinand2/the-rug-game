// What lasts for a player: the active THIS ERA ability, which #20's civilizations join, the triggers it answers, advance blocks and allies (design §5, §6).
import { emit } from './events.js';
import { isPlayerSeat, playerSeat, seatOf } from './state.js';
import { ERA_HOOKS } from './eras.js';

/** @typedef {import('./data/ids.js').TrackId} TrackId */

/**
 * The track an ability keeps its own holder from advancing on (design §5).
 * @type {Record<string, TrackId>}
 */
const OWN_BLOCKS = { 'broker-of-peace': 'military', theocracy: 'science' };

/**
 * A player's active THIS ERA ability.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {import('./state.js').Era | null} Null with no active ability, or for a seat that isn't a player
 */
export function eraOf(state, player) {
	if (!isPlayerSeat(state, player)) {
		return null;
	}
	return playerSeat(state, player).era;
}

/**
 * The id of the card whose THIS ERA rules apply to a player now.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string | null}
 */
export function eraAbility(state, player) {
	return eraOf(state, player)?.ability ?? null;
}

/**
 * Whether one THIS ERA ability is active for a player.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {string} id - A tapestry card id, such as 'monarchy'
 * @returns {boolean}
 */
export function hasEra(state, player, id) {
	return eraAbility(state, player) === id;
}

/**
 * The player seats in seat order, which is clockwise, starting with `from`.
 * @param {import('./state.js').State} state
 * @param {number} from
 * @returns {number[]}
 */
function playersFrom(state, from) {
	const { seats } = state;
	const at = seats.indexOf(seatOf(state, from));
	return [...seats.slice(at), ...seats.slice(0, at)]
		.filter((s) => s.kind === 'player')
		.map((s) => s.seat);
}

/**
 * The other player seats, clockwise from the player's left: the next seat in seat order first.
 * Only player seats are opponents until #31 adds the bots.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {number[]}
 */
export function opponents(state, player) {
	return playersFrom(state, player).filter((seat) => seat !== player);
}

/**
 * The trigger handlers of each ability active for a seat: its THIS ERA card's. #20 adds its civilizations' here.
 * @param {import('./state.js').State} state
 * @param {number} seat
 * @returns {Record<string, import('./eras.js').Hook>[]}
 */
function activeHooks(state, seat) {
	const ability = eraAbility(state, seat);
	return ability !== null && Object.hasOwn(ERA_HOOKS, ability)
		? [ERA_HOOKS[ability]]
		: [];
}

/**
 * Asks every player seat whose active abilities care about something that happened, in seat order from the
 * acting player, and returns the operations their handlers give. The caller pushes them where they belong.
 * @param {import('./state.js').State} state
 * @param {string} hook - What happened, such as 'invented' or 'advanced' (design §6)
 * @param {{ player: number } & Record<string, any>} payload - `player` is the seat it happened to
 * @returns {import('./state.js').NewOperation[]}
 */
export function triggered(state, hook, payload) {
	return playersFrom(state, payload.player).flatMap((owner) =>
		activeHooks(state, owner).flatMap((hooks) =>
			Object.hasOwn(hooks, hook) ? hooks[hook](state, owner, payload) : []
		)
	);
}

/**
 * Whether a player may not advance on a track now: their own Broker of Peace or Theocracy,
 * or another player's Dictatorship block (design §5). Regressing is never blocked.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {TrackId} track
 * @returns {boolean}
 */
export function advanceBlocked(state, player, track) {
	const ability = eraAbility(state, player);
	if (ability !== null && OWN_BLOCKS[ability] === track) {
		return true;
	}
	return state.blocks.some((b) => b.player !== player && b.track === track);
}

/**
 * The player's allies: the seats whose Alliance names the player, and the seat the player's Alliance names.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {number[]} In seat order
 */
export function allies(state, player) {
	const own = eraOf(state, player);
	return state.seats
		.map((s) => s.seat)
		.filter((seat) => {
			if (seat === player) {
				return false;
			}
			const era = eraOf(state, seat);
			return (
				(era?.ability === 'alliance' && era.opponent === player) ||
				(own?.ability === 'alliance' && own.opponent === seat)
			);
		});
}

/**
 * Lifts every Dictatorship block of a player, as turn order reaches or skips their seat (R26).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 */
export function liftBlocks(ctx, player) {
	const { state } = ctx;
	const lifted = state.blocks.filter((b) => b.player === player);
	if (lifted.length === 0) {
		return;
	}
	state.blocks = state.blocks.filter((b) => b.player !== player);
	for (const { track } of lifted) {
		emit(state, { type: 'trackUnblocked', player, track });
	}
}
