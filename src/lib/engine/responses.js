// The response cards a defender discards against a conquest (#17, #33; 01 §7.4, 03 §1.2, §1.4): which they may play now, and what each does before the dice.
import { emit } from './events.js';
import { playerSeat, seatOf } from './state.js';
import { hasEra, triggered } from './abilities.js';
import { controlledTerritories } from './control.js';
import { spacesAdvanced } from './movement.js';
import { askHex } from './decisions/choose-hex.js';
import { hexNeighbours } from './data/maps.js';
import { BLACK_DIE, RED_DIE } from './data/dice.js';
import { tapestryCard } from './data/tapestry-cards.js';

/** What Surprise Party gains (03 §1.4). */
const SURPRISE_PARTY_VP = 15;

/**
 * The conquest's dice, rolled for the attacker once any response is settled (01 §7.3).
 * @param {number} attacker
 * @param {string} hex
 * @param {boolean} both - Both dice's results rather than one (R17, Pillage and Plunder)
 * @param {number} [surrender] - A defender who played Surrender rolls both dice after the attacker
 * @returns {import('./state.js').NewOperation}
 */
export function diceOp(attacker, hex, both, surrender) {
	return {
		player: attacker,
		kind: 'conquerDice',
		hex,
		both,
		...(surrender !== undefined && { surrender }),
	};
}

/**
 * The territories a defender may retreat to from a conquered hex: those next to it they control, even one already
 * holding 2 items (03 §1.4).
 * @param {import('./state.js').State} state
 * @param {number} defender
 * @param {string} hex
 * @returns {string[]}
 */
export function retreatHexes(state, defender, hex) {
	const owned = new Set(controlledTerritories(state, defender));
	return hexNeighbours(hex).filter((near) => owned.has(near));
}

/**
 * The response cards in a defender's hand they may play against this conquest, in hand order: a trap (never against
 * Pillage and Plunder), Retreat with a territory to go to, Surprise Party when further along Military than the
 * attacker, and Surrender.
 * @param {import('./state.js').State} state
 * @param {number} defender
 * @param {number} attacker
 * @param {string} hex
 * @returns {string[]}
 */
export function responseCards(state, defender, attacker, hex) {
	const plunder = hasEra(state, attacker, 'pillage-and-plunder');
	const seat = playerSeat(state, defender);
	return seat.hand.filter((card) => {
		const data = tapestryCard(card);
		if (data.response !== 'conquest') {
			return false;
		}
		if (data.id === 'trap') {
			return !plunder;
		}
		if (data.id === 'retreat') {
			return retreatHexes(state, defender, hex).length > 0;
		}
		if (data.id === 'surprise-party') {
			return (
				spacesAdvanced(seat, 'military') >
				spacesAdvanced(seatOf(state, attacker), 'military')
			);
		}
		return true;
	});
}

/**
 * Stands the defender's toppled outpost up again and topples the attacker's in its place, as a trap or a Surprise
 * Party does.
 * @param {import('./state.js').State} state
 * @param {number} defender
 * @param {number} attacker
 * @param {string} hex
 */
function turnTables(state, defender, attacker, hex) {
	for (const outpost of state.hexes[hex].outposts) {
		if (outpost.seat === defender && outpost.toppled) {
			outpost.toppled = false;
			delete outpost.toppledBy;
			emit(state, { type: 'outpostRaised', player: defender, hex });
		} else if (outpost.seat === attacker && !outpost.toppled) {
			outpost.toppled = true;
			outpost.toppledBy = defender;
			emit(state, {
				type: 'outpostToppled',
				player: attacker,
				hex,
				by: defender,
			});
		}
	}
}

/**
 * A played response card's effect, then the attacker's dice. The card has left the hand.
 * @param {import('./state.js').Context} ctx
 * @param {{ defender: number, attacker: number, hex: string, card: string, both: boolean }} response
 */
export function playResponse(ctx, { defender, attacker, hex, card, both }) {
	const { state } = ctx;
	const id = tapestryCard(card).id;
	if (id === 'retreat') {
		askHex(
			ctx,
			defender,
			retreatHexes(state, defender, hex),
			false,
			'retreat',
			{
				kind: 'retreatTo',
				from: hex,
				attacker,
				both,
			}
		);
		return;
	}
	if (id === 'surrender') {
		ctx.push([diceOp(attacker, hex, both, defender)]);
		return;
	}
	turnTables(state, defender, attacker, hex);
	if (id === 'surprise-party') {
		emit(state, {
			type: 'surprisePartyThrown',
			player: defender,
			attacker,
			hex,
		});
	}
	// R21: a trap gains 1 resource of the trapper's choice; Surprise Party gains 15 VP. Control changed, so the
	// defender's `countsChanged` triggers follow (#20 design §7, Mystics).
	ctx.push([
		{
			player: defender,
			kind: 'effects',
			effects:
				id === 'surprise-party'
					? [{ vp: SURPRISE_PARTY_VP }]
					: [{ gain: { any: 1 } }],
		},
		...triggered(state, 'countsChanged', { player: defender }),
		diceOp(attacker, hex, both),
	]);
}

/**
 * Retreat to the chosen territory: the defender's toppled outpost leaves the conquered hex and stands on it; they gain
 * 1 worker (R45). The conquest stands, so the attacker's dice follow.
 * @type {import('./state.js').AutomaticKind}
 */
export function retreatTo(ctx, op) {
	const { state } = ctx;
	const defender = /** @type {number} */ (op.player);
	const from = /** @type {string} */ (op.from);
	const to = /** @type {string} */ (op.hex);
	const outposts = state.hexes[from].outposts;
	const at = outposts.findIndex((o) => o.seat === defender && o.toppled);
	if (at !== -1) {
		outposts.splice(at, 1);
	}
	state.hexes[to].outposts.push({ seat: defender, toppled: false });
	emit(state, { type: 'retreated', player: defender, hex: from, to });
	ctx.push([
		{
			player: defender,
			kind: 'effects',
			effects: [{ gain: { worker: 1 } }],
		},
		...triggered(state, 'countsChanged', { player: defender }),
		diceOp(/** @type {number} */ (op.attacker), from, op.both === true),
	]);
}

/**
 * Surrender's roll, after the attacker's: the defender rolls both conquer dice and gains both results, black first,
 * as a conquest's both dice are (03 §1.4).
 * @type {import('./state.js').AutomaticKind}
 */
export function surrenderDice(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const red = ctx.random(6);
	const black = ctx.random(6);
	emit(ctx.state, { type: 'surrenderRolled', player, red, black });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				structuredClone(BLACK_DIE[black]),
				structuredClone(RED_DIE[red]),
			],
			ordered: true,
			source: { hex: op.hex },
		},
	]);
}
