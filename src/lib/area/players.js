// The players overview's cards (#27 design §4) and the header's chips (#90): each player's public facts, from the viewer's view.
import { civilizationOf } from '../game-names.js';
import { civAbilityText } from '../cards/civ-rules.js';
import { selfSummary } from '../overview.js';
import { mapHexes } from '../hexmap.js';
import { TERRAINS } from '../ui.js';
import {
	capitalScore,
	controlledTerritories,
	openDecisions,
	spacesAdvanced,
} from '../engine/game.js';
import { boardTracks } from '../board.js';
import { AUTOMA_CIVS } from '../engine/data/automa-civs.js';

/**
 * The props of one PlayerCard.
 * @typedef {Object} PlayerCardFacts
 * @property {import('../ui.js').Seat} seat
 * @property {string} name
 * @property {number} vp
 * @property {boolean} you
 * @property {boolean} host
 * @property {string} civilization
 * @property {number} era
 * @property {{ coin: number, worker: number, food: number, culture: number }} resources
 * @property {Record<import('../ui.js').TrackId, number>} tracks - Each track's furthest token, or 12 where AI Singularity took it off (#147)
 * @property {number} handSize - Only the count: a hand never leaves its owner's view
 * @property {number} capitalPoints - What the capital scores: its complete rows and columns, and the Architects' uniform lines again
 * @property {number} tech
 * @property {string[]} terrain - The land terrains of the territories they control, each once, in the interface's order
 * @property {never} [botKind]
 */

/** @typedef {{ seat: import('../ui.js').Seat, name: string, vp: number, botKind: 'automa' | 'shadow', civilization: string, tracks: Record<string, number>, landmarks: number, territories: number, incomeTurns: number, favouriteTrack: string, finished: boolean }} BotPlayerCardFacts */

/**
 * The props of one PlayerChip in the game header (#90).
 * @typedef {Object} PlayerChipFacts
 * @property {import('../ui.js').Seat} seat
 * @property {string} name
 * @property {string} civilization - Its name, or 'Setting up' before the player has one
 * @property {number} vp
 * @property {boolean} current - It is this player's turn
 * @property {boolean} closing - Their turn waits only on End turn (#146), so it is about to pass: the glow dims (#177)
 * @property {string | undefined} ability - The civilization's full ability, for the chip's tooltip
 * @property {'automa' | 'shadow'} [botKind] - Bot label without assuming player-only civilization state.
 */

/**
 * The seat whose turn waits only on its End turn (#146): the current player, when every open decision is their own
 * End turn. Null otherwise, as while a conquest's defender answers (#24) or anyone else still decides.
 * @param {any} view - The game as view() gives it to the viewer
 * @returns {number | null}
 */
function closingSeat(view) {
	const open = openDecisions(view);
	return open.length > 0 &&
		open.every(
			(op) => op.kind === 'confirmEndTurn' && op.player === view.current
		)
		? view.current
		: null;
}

/**
 * One chip per player seat, in seat order, for the game header (#90).
 * @param {any} view - The game as view() gives it to the viewer
 * @returns {PlayerChipFacts[]}
 */
export function playerChips(view) {
	const closing = closingSeat(view);
	return view.seats
		.filter((/** @type {any} */ seat) =>
			['player', 'automa', 'shadow'].includes(seat.kind)
		)
		.map((/** @type {any} */ seat) => ({
			seat: seat.seat,
			name: seat.name,
			civilization:
				seat.kind === 'player'
					? civilizationOf(seat)
					: botCivilization(seat),
			vp: seat.vp,
			current: view.current === seat.seat,
			closing: closing === seat.seat,
			ability:
				seat.kind === 'player' && seat.civs.length
					? (civAbilityText(seat.civs[0], view.version) ?? undefined)
					: undefined,
			...(seat.kind !== 'player' ? { botKind: seat.kind } : {}),
		}));
}

/** @param {any} seat @returns {string} */
function botCivilization(seat) {
	if (seat.kind === 'shadow') return 'Shadow Empire';
	return (
		AUTOMA_CIVS.find((civ) => civ.id === seat.civilization)?.name ??
		'Automa'
	);
}

/**
 * One card per player seat, in seat order.
 * @param {any} view - The game as view() gives it to the viewer
 * @param {number | null} viewer - The viewer's seat
 * @param {number | null} host - The host's seat
 * @returns {(PlayerCardFacts | BotPlayerCardFacts)[]}
 */
export function playerCards(view, viewer, host) {
	const hexes = new Map(mapHexes(view).map((hex) => [hex.key, hex]));
	return view.seats
		.filter((/** @type {any} */ seat) =>
			['player', 'automa', 'shadow'].includes(seat.kind)
		)
		.map((/** @type {any} */ seat) => {
			if (seat.kind !== 'player') {
				return {
					seat: seat.seat,
					name: seat.name,
					vp: seat.vp,
					botKind: seat.kind,
					civilization: botCivilization(seat),
					tracks: Object.fromEntries(
						boardTracks(view).map((track) => [
							track,
							spacesAdvanced(seat, track),
						])
					),
					landmarks: seat.landmarks?.length ?? 0,
					territories: controlledTerritories(view, seat.seat).length,
					incomeTurns: seat.incomeTurns,
					favouriteTrack: seat.favouriteTrack,
					finished: seat.finished,
				};
			}
			const summary =
				/** @type {import('../overview.js').SelfSummary} */ (
					selfSummary(view, seat.seat)
				);
			return {
				seat: summary.seat,
				name: seat.name,
				vp: seat.vp,
				you: seat.seat === viewer,
				host: seat.seat === host,
				civilization: civilizationOf(seat),
				era: summary.era,
				resources: { ...seat.resources },
				// The tracks in play: the arts track's too, after the four (#35).
				tracks: /** @type {Record<import('../ui.js').TrackId, number>} */ (
					Object.fromEntries(
						boardTracks(view).map((track) => [
							track,
							spacesAdvanced(seat, track),
						])
					)
				),
				handSize: summary.hand,
				capitalPoints: capitalScore(seat).vp,
				tech: summary.tech,
				terrain: landTerrains(view, seat.seat, hexes),
			};
		});
}

/**
 * The land terrains a player's territories show, each once, named for the card.
 * @param {any} view
 * @param {number} player
 * @param {Map<string, import('../hexmap.js').MapHex>} hexes
 * @returns {string[]}
 */
function landTerrains(view, player, hexes) {
	const shown = new Set(
		controlledTerritories(view, player).flatMap((key) => {
			const hex = hexes.get(key);
			return hex ? [...(hex.corners ?? []), ...hex.island] : [];
		})
	);
	return TERRAINS.filter(
		(terrain) => terrain.id !== 'sea' && shown.has(terrain.id)
	).map((terrain) => terrain.name);
}
