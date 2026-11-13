// Fantasies & Futures' income-mat overlay (03 FF.2.2, #39): the items cards reserve there, and their use on income turn 5.
import { emit } from '../events.js';
import { drawAvailableTiles } from '../automa-time-travelers.js';
import { playerSeat } from '../state.js';
import { shuffle } from '../random.js';
import { triggered } from '../abilities.js';
import { canDraw, drawTech, refillDisplay } from '../tech.js';
import { drawMasterpiece, fireChosen } from '../masterpieces.js';
import { artsInPlay } from '../tracks-in-play.js';
import { askHex } from '../decisions/choose-hex.js';
import { exploreSpaceTile } from './explore.js';
import { upgradeCard } from './tech.js';
import { tapestryCard } from '../data/tapestry-cards.js';
import { MAPS } from '../data/maps.js';
import { psionic, sampleCard } from '../civs/psionics.js';

/** @typedef {import('../data/ids.js').BuildingId} BuildingId */
/**
 * An item on a player's overlay: the card on the mat that reserved it (`card`, null for a copy with no card behind
 * it), the card whose rules apply (`ability`), and what it is. Public, as everything on the income mat.
 * @typedef {{ id: number, card: string | null, ability: string } & ({ building: BuildingId } | { tech: string } | { space: number } | { masterpiece: string } | { territory: number[] } | { outpost: true } | { token: true })} ReservedItem
 */

/**
 * The territories a player may take an outpost from for Zombie Army: on the map, holding that one upright outpost of
 * theirs and nothing else, no token, no Nomads piece, not shared (03 FF.4.3 #38).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
export function zombieHexes(state, player) {
	return MAPS[state.map].hexes.filter((key) => {
		const hex = state.hexes[key];
		const [only] = hex.outposts;
		return (
			hex.outposts.length === 1 &&
			only.seat === player &&
			!only.toppled &&
			only.piece === undefined &&
			hex.tokens.length === 0 &&
			!hex.shared
		);
	});
}

/**
 * Puts an item on the player's overlay. On or after income turn 5 it is used at once (03 FF.2.2).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {{ card: string | null, ability: string }} from
 * @param {Record<string, any>} what - The item's kind and payload
 */
export function addReserved(ctx, player, from, what) {
	const seat = playerSeat(ctx.state, player);
	const item = /** @type {ReservedItem} */ ({
		id: ctx.state.nextId++,
		card: from.card,
		ability: from.ability,
		...what,
	});
	(seat.reserved ??= []).push(item);
	emit(ctx.state, { type: 'itemReserved', player, item: { ...item } });
	/** @type {import('../state.js').NewOperation[]} */
	const ops = [...triggered(ctx.state, 'countsChanged', { player })];
	if (seat.incomeTurns >= 5) {
		ops.push({
			player,
			kind: 'effects',
			effects: [{ useReserved: { ...item } }],
		});
	}
	if (ops.length > 0) {
		ctx.push(ops);
	}
}

/**
 * The reserve effect (03 FF.4.3): the card whose ability runs reserves its item. A building is the next of its type
 * off the income mat; `tech` a face-up card or the deck's top (R82); `space` and `masterpiece` 1 of up to that many
 * drawn, the rest shuffled back; `territory` that many tiles from the supply; `outposts` up to that many of the player's
 * outposts (Zombie Army); `token` a reminder. With nothing to reserve, nothing happens.
 * @type {import('../state.js').EffectHandler}
 */
export function reserve(ctx, player, value, op) {
	const { state } = ctx;
	const seat = playerSeat(state, player);
	const from = {
		card: op?.source?.card ?? null,
		ability: op?.source?.tapestry ?? op?.source?.card ?? '',
	};
	if (value.building !== undefined) {
		const id = /** @type {BuildingId} */ (value.building);
		if (seat.incomeMat.buildings[id] === 0) {
			emit(state, { type: 'noBuildingLeft', player, building: id });
			return;
		}
		seat.incomeMat.buildings[id] -= 1;
		// The Artificers' slide moved the building just taken (#40).
		if (seat.incomeMat.slid) {
			delete seat.incomeMat.slid[id];
		}
		addReserved(ctx, player, from, { building: id });
		return;
	}
	if (value.tech) {
		const options = [
			...state.supply.tech.faceUp,
			...(canDraw(state) ? ['deck'] : []),
		];
		if (options.length === 0) {
			emit(state, { type: 'noReserve', player });
		} else if (options.length === 1) {
			reserveTech(ctx, player, from, options[0]);
		} else {
			ctx.push([{ player, kind: 'chooseReserveTech', options, ...from }]);
		}
		return;
	}
	if (value.space !== undefined || value.masterpiece !== undefined) {
		const stack = value.space !== undefined ? 'space' : 'masterpieces';
		// The Psionics draw one more (R74; draw 3 keep 1 becomes draw 4 keep 1, DQ 18).
		const count =
			(value.space ?? value.masterpiece) +
			(psionic(state, player) ? 1 : 0);
		/** @type {(number | string)[]} */
		const drawn = [];
		while (drawn.length < count) {
			const next =
				stack === 'space'
					? drawAvailableTiles(state, 'space', 1)[0]
					: (drawMasterpiece(ctx) ?? undefined);
			if (next === undefined) {
				break;
			}
			drawn.push(next);
		}
		if (drawn.length === 0) {
			emit(state, { type: 'noReserve', player });
		} else if (drawn.length === 1) {
			keepReserved(ctx, player, from, stack, drawn[0], []);
		} else {
			ctx.push([
				{
					player,
					kind: 'chooseReserve',
					stack,
					options: drawn,
					...from,
				},
			]);
		}
		return;
	}
	if (value.territory !== undefined) {
		const tiles = state.supply.territory.splice(0, value.territory);
		if (tiles.length === 0) {
			emit(state, { type: 'noReserve', player });
			return;
		}
		addReserved(ctx, player, from, { territory: tiles });
		return;
	}
	if (value.outposts !== undefined) {
		askHex(ctx, player, zombieHexes(state, player), true, 'zombieArmy', {
			kind: 'zombieTake',
			left: value.outposts,
			...from,
		});
		return;
	}
	addReserved(ctx, player, from, { token: true });
}

/**
 * Takes the tech card chosen for Lost Artifacts, face up onto the overlay: a face-up card, refilled in its place, or the
 * deck's top (R82).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {{ card: string | null, ability: string }} from
 * @param {string} choice - A face-up card's id, or `'deck'`
 * @param {string} [kept] - The deck's card the Psionics kept of the 2 they drew (R74)
 */
export function reserveTech(ctx, player, from, choice, kept) {
	const tech = ctx.state.supply.tech;
	/** @type {string | null | undefined} */
	let card = null;
	if (choice === 'deck') {
		if (kept !== undefined) {
			card = kept;
		} else if (psionic(ctx.state, player)) {
			// The Psionics draw 2 and keep 1 (R74).
			card = sampleCard(ctx, player, 'tech', () => drawTech(ctx), {
				reserve: from,
			});
			if (card === undefined) {
				return;
			}
		} else {
			card = drawTech(ctx);
		}
	} else {
		const slot = tech.faceUp.indexOf(choice);
		if (slot !== -1) {
			card = tech.faceUp.splice(slot, 1)[0];
			const replacement = drawTech(ctx);
			if (replacement !== null) {
				tech.faceUp.splice(slot, 0, replacement);
			}
		}
	}
	if (card === null) {
		throw new Error(`reserveTech can't take ${choice}.`);
	}
	refillDisplay(ctx);
	addReserved(ctx, player, from, { tech: card });
}

/**
 * Keeps one drawn space tile or masterpiece on the overlay and shuffles the others back into their stack.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {{ card: string | null, ability: string }} from
 * @param {'space' | 'masterpieces'} stack
 * @param {number | string} kept
 * @param {(number | string)[]} others
 */
export function keepReserved(ctx, player, from, stack, kept, others) {
	const { supply } = ctx.state;
	if (stack === 'space') {
		supply.space = shuffle(
			[...supply.space, .../** @type {number[]} */ (others)],
			ctx.random
		);
		addReserved(ctx, player, from, { space: kept });
		return;
	}
	const pile = /** @type {NonNullable<typeof supply.masterpieces>} */ (
		supply.masterpieces
	);
	pile.deck = shuffle(
		[...pile.deck, .../** @type {string[]} */ (others)],
		ctx.random
	);
	addReserved(ctx, player, from, { masterpiece: kept });
}

/**
 * Takes the outpost on the hex picked for Zombie Army onto the overlay, vacating the territory, then asks for the next
 * while any are left to take.
 * @type {import('../state.js').AutomaticKind}
 */
export function zombieTake(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const from = { card: op.card, ability: op.ability };
	ctx.state.hexes[op.hex].outposts = [];
	emit(ctx.state, { type: 'outpostLifted', player, hex: op.hex });
	// First, so on or after income turn 5 every take comes before any conquer and no outpost is lifted twice.
	addReserved(ctx, player, from, { outpost: true });
	if (op.left > 1) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ reserve: { outposts: op.left - 1 } }],
				source: { tapestry: from.ability, card: from.card },
			},
		]);
	}
}

/**
 * The useAllReserved effect: income turn 5's step, every item on the overlay in the order the player chooses (R132).
 * @type {import('../state.js').EffectHandler}
 */
export function useAllReserved(ctx, player) {
	const items = playerSeat(ctx.state, player).reserved ?? [];
	if (items.length === 0) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: items.map((item) => ({ useReserved: { ...item } })),
			ordered: false,
		},
	]);
}

/**
 * The useReserved effect: one item leaves the overlay and does what its card says on income turn 5 (#39 design §6). An
 * item already used does nothing. Its VP is the tapestry cards'.
 * @type {import('../state.js').EffectHandler}
 */
export function useReserved(ctx, player, value) {
	const { state } = ctx;
	const seat = playerSeat(state, player);
	const at = (seat.reserved ?? []).findIndex((item) => item.id === value.id);
	if (at === -1) {
		return;
	}
	const [item] = /** @type {ReservedItem[]} */ (seat.reserved).splice(at, 1);
	emit(state, { type: 'reservedUsed', player, item: { ...item } });
	const source = { tapestry: item.ability, card: item.card };
	/** @type {(effects: object[]) => void} */
	const run = (effects) => {
		ctx.push([{ player, kind: 'effects', effects, ordered: true, source }]);
	};
	if ('building' in item) {
		ctx.push([{ player, kind: 'placeBuilding', building: item.building }]);
	} else if ('tech' in item) {
		seat.tech.bottom.push(item.tech);
		emit(state, {
			type: 'techInvented',
			player,
			card: item.tech,
			from: 'reserved',
		});
		ctx.push([
			...triggered(state, 'invented', { player, card: item.tech }),
			{ player, kind: 'upgradeReserved', card: item.tech },
			{ player, kind: 'upgradeReserved', card: item.tech },
			...triggered(state, 'countsChanged', { player }),
		]);
	} else if ('space' in item) {
		seat.spaceTiles.push(item.space);
		if (item.ability === 'generation-ships' && artsInPlay(state)) {
			run([
				{
					choice: [
						[{ exploreSpace: { tile: item.space } }],
						[
							{ discardSpace: { tile: item.space } },
							{ inspire: {} },
						],
					],
				},
			]);
		} else {
			exploreSpaceTile(ctx, player, item.space);
		}
	} else if ('masterpiece' in item) {
		// R133: it joins the player's masterpieces and fires once at once.
		(seat.masterpieces ??= []).push({
			card: item.masterpiece,
			used: false,
		});
		emit(state, {
			type: 'masterpieceCreated',
			player,
			card: item.masterpiece,
			from: 'reserved',
		});
		fireChosen(
			ctx,
			{ player, purpose: 'broadcast' },
			{ seat: player, card: item.masterpiece }
		);
	} else if ('territory' in item) {
		seat.territoryTiles.push(...item.territory);
		run(
			item.territory.map((tile) => ({
				explore: { anywhere: true, tile },
			}))
		);
	} else if ('outpost' in item) {
		// R85: one normal conquer; with no target the outpost stays in the supply.
		seat.outposts += 1;
		run([{ conquer: {} }]);
	} else {
		run(structuredClone(tapestryCard(item.ability).fifth ?? []));
	}
}

/**
 * Upgrades Lost Artifacts' card, ignoring its prerequisite, while it is still in a bottom or middle row.
 * @type {import('../state.js').AutomaticKind}
 */
export function upgradeReserved(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const { bottom, middle } = playerSeat(ctx.state, player).tech;
	if (bottom.includes(op.card) || middle.includes(op.card)) {
		upgradeCard(ctx, player, op.card);
	}
}

/**
 * The discardSpace effect: a space tile from the player's supply goes face up to the discards (Generation Ships).
 * @type {import('../state.js').EffectHandler}
 */
export function discardSpace(ctx, player, value) {
	const seat = playerSeat(ctx.state, player);
	const at = seat.spaceTiles.indexOf(value.tile);
	if (at === -1) {
		return;
	}
	seat.spaceTiles.splice(at, 1);
	ctx.state.supply.spaceDiscard.push(value.tile);
	emit(ctx.state, {
		type: 'tilesDiscarded',
		player,
		stack: 'space',
		tiles: [value.tile],
	});
}

/**
 * Ecstatic Visions: reserve 1 of 3 masterpieces or 1 of 3 space tiles, the player's choice; without the arts track,
 * space tiles only (03 FF.4.3 #9).
 * @type {import('../state.js').EffectHandler}
 */
export function ecstaticVisions(ctx, player, value, op) {
	/** @type {object[]} */
	const effects = artsInPlay(ctx.state)
		? [
				{
					choice: [
						[{ reserve: { masterpiece: 3 } }],
						[{ reserve: { space: 3 } }],
					],
				},
			]
		: [{ reserve: { space: 3 } }];
	ctx.push([
		{ player, kind: 'effects', effects, ordered: true, source: op.source },
	]);
}
