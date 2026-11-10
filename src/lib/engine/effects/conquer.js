// The conquer effect, the conquer dice and the black die's "?": take a territory, then roll for its reward (R8, R16, R17, R107).
import { emit } from '../events.js';
import { playerSeat, isPlayerSeat, seatOf } from '../state.js';
import { TERRITORY_TILES } from '../data/territory-tiles.js';
import { RED_DIE, BLACK_DIE } from '../data/dice.js';
import { claimAchievement, checkToppleTwo } from '../achievements.js';
import { hasEra, triggered } from '../abilities.js';
import { MAPS } from '../data/maps.js';
import { conquerTargets, loneOpponent } from '../map.js';
import { itemCount } from '../control.js';
import { takeOutpost } from '../outposts.js';
import { isolationistsOffer } from '../civs/isolationists.js';
import { diceOp } from '../responses.js';

/**
 * Conquers a hex: an outpost goes on it, and an opponent's lone outpost or Nomads piece topples; a lone Treasure Hunters
 * token stays standing, its seat the defender (R114). The dice follow (a defender who qualifies is asked for a response
 * between the two).
 * Against an opponent, Pillage and Plunder gives both dice and stops traps (design §8); with Plans & Ploys its defender
 * is still asked, as the expansion's other response cards may answer it (03 §1.2, #33).
 * On a territory that held no item, the Isolationists may put a token beside the outpost before the dice (#20 design §7).
 * The `outpostTaken` triggers wait below the conquest, so they come after it.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} hex
 * @param {'always' | 'ifOpponent' | undefined} bothDice
 */
export function conquerHex(ctx, player, hex, bothDice) {
	const state = ctx.state;
	// R17: "if an opponent controlled it" is judged now, before any trap.
	const opponent = loneOpponent(state, hex, player);
	const token = isolationistsOffer(state, player, hex);
	const plunder =
		opponent !== null && hasEra(state, player, 'pillage-and-plunder');
	const both =
		plunder ||
		bothDice === 'always' ||
		(bothDice === 'ifOpponent' && opponent !== null);
	// The opponent's lone outpost or Nomads piece, before the attacker's joins it; a Treasure Hunters token has none (R114).
	const [lone] = opponent !== null ? state.hexes[hex].outposts : [];
	takeOutpost(ctx, player);
	state.hexes[hex].outposts.push({ seat: player, toppled: false });
	emit(state, { type: 'outpostPlaced', player, hex });
	if (lone !== undefined) {
		lone.toppled = true;
		lone.toppledBy = player;
		emit(state, {
			type: 'outpostToppled',
			player: opponent,
			hex,
			by: player,
		});
	}
	// Solo Automa's face-down tapestry pool is an automatic defence, never a bot-owned decision.
	if (
		opponent !== null &&
		seatOf(state, opponent).kind === 'automa' &&
		!plunder
	) {
		const defender =
			/** @type {import('../state.js').BotSeat & {trapCards: string[]}} */ (
				seatOf(state, opponent)
			);
		while (defender.trapCards.length > 0) {
			const [card] = defender.trapCards.splice(
				ctx.random(defender.trapCards.length),
				1
			);
			state.supply.tapestry.discard.push(card);
			emit(state, {
				type: 'botTrapDiscarded',
				player: opponent,
				card,
				hex,
			});
			if (card === 'trap' || card.startsWith('trap-')) {
				for (const outpost of state.hexes[hex].outposts) {
					if (outpost.seat === opponent) {
						outpost.toppled = false;
						delete outpost.toppledBy;
					}
					if (outpost.seat === player) {
						outpost.toppled = true;
						outpost.toppledBy = opponent;
					}
				}
				emit(state, {
					type: 'automaTrapSprung',
					player: opponent,
					attacker: player,
					hex,
				});
				break;
			}
		}
		ctx.push([diceOp(player, hex, both)]);
		return;
	}
	if (
		opponent !== null &&
		(!plunder || state.expansions.includes('pp')) &&
		asksResponse(state, opponent)
	) {
		// The question holds the dice and pushes them once answered, so a response can act first (#33). It is asked
		// whatever the defender holds, so the table learns nothing about their hand.
		ctx.push([
			{
				player: opponent,
				kind: 'chooseResponse',
				attacker: player,
				hex,
				both,
			},
		]);
		return;
	}
	// A territory with no item has no defender, so the Isolationists' offer only ever comes here.
	ctx.push([...token, diceOp(player, hex, both)]);
}

/**
 * Whether the defender is asked for a response: a player seat with at least 1 tapestry card that is still playing, or
 * under the Original rules, finished (R108). Hand sizes are public, so skipping an empty hand reveals nothing.
 * @param {import('../state.js').State} state
 * @param {number} defender
 * @returns {boolean}
 */
function asksResponse(state, defender) {
	if (!isPlayerSeat(state, defender)) {
		return false;
	}
	const seat = playerSeat(state, defender);
	return (
		seat.hand.length > 0 && (!seat.finished || state.version === 'original')
	);
}

/**
 * The conquer effect. With no outpost left or no target it does nothing; with one target it conquers at once;
 * otherwise its player chooses.
 * @type {import('../state.js').EffectHandler}
 */
export function conquer(ctx, player, value) {
	const anywhere = value?.anywhere === true;
	const bothDice = value?.bothDice;
	/** @type {string[] | undefined} */
	let only = value?.only;
	// Topiary (R53): only a territory with no outpost or other item on it.
	if (value?.empty === true) {
		const listed = only;
		only = MAPS[ctx.state.map].hexes.filter(
			(hex) =>
				itemCount(ctx.state, hex) === 0 &&
				(listed === undefined || listed.includes(hex))
		);
	}
	const targets =
		playerSeat(ctx.state, player).outposts > 0
			? conquerTargets(ctx.state, player, anywhere, only)
			: [];
	if (targets.length === 0) {
		emit(ctx.state, { type: 'noConquer', player });
		return;
	}
	if (targets.length === 1) {
		conquerHex(ctx, player, targets[0], bothDice);
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseConquer',
			anywhere,
			bothDice,
			...(only !== undefined && { only }),
		},
	]);
}

/**
 * The automatic operation after a conquest: roll both dice, then give both faces (black first) or let the player pick one (01 §7.3).
 * The dice always roll, even after a trap. Pirate Rule then gives the tile's benefit, also after a trap (design §8).
 * The `conquerRolled` triggers, told both faces, follow the conquest's own die or dice (#33).
 * After a Surrender (`op.surrender`, the defender), the defender's own roll follows the attacker's (#33).
 * The conquest is over, so the `countsChanged` triggers follow, once (#20 design §7, Mystics).
 * @type {import('../state.js').AutomaticKind}
 */
export function conquerDice(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const hex = /** @type {string} */ (op.hex);
	// The outpost just placed is the player's last one on the hex (outposts are appended), so an older toppled one
	// of theirs there is not a trap.
	const placed = ctx.state.hexes[hex].outposts.findLast(
		(o) => o.seat === player
	);
	const trapped = placed !== undefined && placed.toppled;
	emit(ctx.state, { type: 'conquered', player, hex, trapped });
	// The conquest is over, so a topple a trap undid no longer counts (design §9).
	if (hex === MAPS[ctx.state.map].middle && !trapped) {
		claimAchievement(ctx, player, 'middle-island');
	}
	// The attacker first, then the others with an outpost here in seat order.
	const others = new Set(
		ctx.state.hexes[hex].outposts
			.map((o) => o.seat)
			.filter((seat) => seat !== player)
			.sort((a, b) => a - b)
	);
	for (const seat of [player, ...others]) {
		checkToppleTwo(ctx, seat);
	}
	// Pushed below the dice and Pirate Rule, which are the conquest's own reward.
	const counts = triggered(ctx.state, 'countsChanged', { player });
	// Automa never receives conquest dice benefits. A human defender's trap still resolves before this operation.
	if (!isPlayerSeat(ctx.state, player)) {
		ctx.push(counts);
		return;
	}
	const red = ctx.random(6);
	const black = ctx.random(6);
	emit(ctx.state, { type: 'conquerDiceRolled', player, red, black });
	// What answers the dice (the Utilitarians' Barracks, #33) comes after the conquest's own die or dice. Nothing in a
	// base game answers it.
	const rolled = triggered(ctx.state, 'conquerRolled', {
		player,
		hex,
		red,
		black,
	});
	/** @type {import('../state.js').NewOperation[]} */
	const surrender =
		typeof op.surrender === 'number'
			? [{ player: op.surrender, kind: 'surrenderDice', hex }]
			: [];
	const pirate = hasEra(ctx.state, player, 'pirate-rule')
		? [
				{
					player,
					kind: 'effects',
					effects: [{ tileBenefit: {} }],
					source: { hex },
				},
			]
		: [];
	if (op.both) {
		// Black then red: black's "?" can lead to a conquer that adds a territory, which red's "1 VP per territory"
		// should count. Nothing in black's chain can reduce what red counts, so black first is never worse. The list is
		// ordered, so nothing asks.
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [
					structuredClone(BLACK_DIE[black]),
					structuredClone(RED_DIE[red]),
				],
				ordered: true,
				source: { hex },
			},
			...rolled,
			...pirate,
			...counts,
			...surrender,
		]);
		return;
	}
	ctx.push([
		{ player, kind: 'chooseDie', hex, red, black },
		...rolled,
		...pirate,
		...counts,
		...surrender,
	]);
}

/**
 * The black die's "?": the benefit printed on the conquered territory tile. A printed territory gives nothing (R8);
 * after a trap the tile's benefit still comes (R107, as on BGA).
 * @type {import('../state.js').EffectHandler}
 */
export function tileBenefit(ctx, player, value, op) {
	const hex = /** @type {{ hex: string }} */ (op.source).hex;
	const number = ctx.state.hexes[hex].tile;
	const tile = number !== null && number <= 48 ? number : null;
	emit(ctx.state, { type: 'tileBenefit', player, hex, tile });
	if (tile !== null) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: structuredClone(TERRITORY_TILES[tile - 1].benefit),
				source: { hex },
			},
		]);
	}
}
