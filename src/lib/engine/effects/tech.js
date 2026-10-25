// The tech effects: invent, upgrade, techBenefit and landmark, and their helpers (01 §8, FAQ #6, #8 and #24).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';
import {
	canDraw,
	drawTech,
	refillDisplay,
	refreshDisplay,
	upgradable,
} from '../tech.js';
import { techCard } from '../data/tech-cards.js';

/**
 * What a player may answer when inventing: each face-up card, the top of the deck, and, before the first card, a refresh.
 * `faceUpOnly` leaves out the deck and the refresh; `deckOnly` leaves only the deck (Steam Tycoon).
 * @param {import('../state.js').State} state
 * @param {{ refresh?: boolean, invent?: { faceUpOnly?: boolean, deckOnly?: boolean } }} decision
 * @returns {{ card?: string, refresh?: true }[]}
 */
export function inventAnswers(state, decision) {
	const { faceUp } = state.supply.tech;
	const { faceUpOnly = false, deckOnly = false } = decision.invent ?? {};
	/** @type {{ card?: string, refresh?: true }[]} */
	const answers = deckOnly ? [] : faceUp.map((card) => ({ card }));
	if (faceUpOnly) {
		return answers;
	}
	if (canDraw(state)) {
		answers.push({ card: 'deck' });
	}
	// A refresh with nothing to draw only deals the same cards back.
	if (decision.refresh && !deckOnly && canDraw(state) && answers.length > 0) {
		answers.push({ refresh: true });
	}
	return answers;
}

/**
 * Asks for the next card to invent. With no answer it stops quietly; with one it takes it at once.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} left - Cards still to invent
 * @param {boolean} refresh - Whether a refresh is still allowed
 * @param {Record<string, any>} options - The invent effect's other options, which carry over to each of its cards
 */
function askInvent(ctx, player, left, refresh, options) {
	const answers = inventAnswers(ctx.state, { refresh, invent: options });
	if (answers.length === 0) {
		emit(ctx.state, { type: 'noInvent', player });
		return;
	}
	if (answers.length === 1) {
		inventCard(ctx, player, answers[0], left, options);
		return;
	}
	ctx.push([
		{ player, kind: 'chooseInvent', left, refresh, invent: options },
	]);
}

/**
 * Resolves one answer: a refresh, or a card into the bottom row. After a refresh the same count is asked for again.
 * After a card, its triggers, then its `countsChanged` triggers (#20 design §7), resolve before the next card is asked for (design §6).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {{ card?: string, refresh?: true }} answer
 * @param {number} left - Cards still to invent, this one included
 * @param {Record<string, any>} [options] - The invent effect's other options, which carry over to each of its cards
 */
export function inventCard(ctx, player, answer, left, options = {}) {
	const tech = ctx.state.supply.tech;
	if (answer.refresh) {
		refreshDisplay(ctx);
		askInvent(ctx, player, left, false, options);
		return;
	}
	const from = answer.card === 'deck' ? 'deck' : 'display';
	/** @type {number} */
	let slot = -1;
	/** @type {string | null | undefined} */
	let card;
	if (answer.card === 'deck') {
		card = drawTech(ctx);
	} else {
		slot = tech.faceUp.indexOf(answer.card ?? '');
		if (slot === -1) {
			throw new Error(
				'inventCard found that card is not in the display.'
			);
		}
		card = tech.faceUp.splice(slot, 1)[0];
	}
	if (card === null || card === undefined) {
		throw new Error('inventCard found no card to take.');
	}
	playerSeat(ctx.state, player).tech.bottom.push(card);
	emit(ctx.state, { type: 'techInvented', player, card, from });
	// The replacement takes the taken card's place (design §5).
	if (slot !== -1) {
		const replacement = drawTech(ctx);
		if (replacement !== null) {
			tech.faceUp.splice(slot, 0, replacement);
		}
	}
	refillDisplay(ctx);
	/** @type {import('../state.js').NewOperation[]} */
	const ops = triggered(ctx.state, 'invented', { player, card });
	if (options.thenUpgrade) {
		ops.push({ player, kind: 'upgradeTech', card });
	}
	ops.push(...triggered(ctx.state, 'countsChanged', { player }));
	if (left > 1) {
		ops.push({
			player,
			kind: 'effects',
			effects: [
				{ invent: { ...options, count: left - 1, refresh: false } },
			],
		});
	}
	ctx.push(ops);
}

/**
 * Upgrades the card Steam Tycoon or Technocracy just invented, if it is still in the bottom row.
 * @type {import('../state.js').AutomaticKind}
 */
export function upgradeTech(ctx, op) {
	const player = /** @type {number} */ (op.player);
	if (playerSeat(ctx.state, player).tech.bottom.includes(op.card)) {
		upgradeCard(ctx, player, op.card);
	}
}

/**
 * The invent effect: `count` cards (default 1), with a refresh first if `refresh` is set.
 * @type {import('../state.js').EffectHandler}
 */
export function invent(ctx, player, value) {
	const { count = 1, refresh = false, ...options } = value ?? {};
	askInvent(ctx, player, count, refresh === true, options);
}

/**
 * Upgrades one card: it moves to the end of the next row, and the benefit of the icon it reaches follows.
 * Then come the `upgraded` triggers, and last the `countsChanged` triggers (#20 design §7).
 * @param {import('../state.js').Context} ctx
 * @param {number} player - The card's owner
 * @param {string} card
 * @param {number} [inventors] - The Inventors seat whose token upgrades the card, named in the `upgraded` payload (#20 design §7)
 */
export function upgradeCard(ctx, player, card, inventors) {
	const rows = playerSeat(ctx.state, player).tech;
	if (!rows.bottom.includes(card) && !rows.middle.includes(card)) {
		throw new Error(
			'upgradeCard found that card is not in a bottom or middle row.'
		);
	}
	const from = rows.bottom.includes(card) ? 'bottom' : 'middle';
	const to = from === 'bottom' ? 'middle' : 'top';
	rows[from].splice(rows[from].indexOf(card), 1);
	rows[to].push(card);
	emit(ctx.state, { type: 'techUpgraded', player, card, from, to });
	const icon = from === 'bottom' ? 'circle' : 'square';
	// The `passive` mark is deliberately not carried: a card's benefit is never passive civilization VP, and a finished player gains nothing else (01 §4.3).
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(techCard(card)[icon]),
			source: { tech: card, icon },
		},
		// After the card's benefit, so "after them" holds (Alliance).
		...triggered(ctx.state, 'upgraded', {
			player,
			card,
			icon,
			...(inventors !== undefined && { inventors }),
		}),
		...triggered(ctx.state, 'countsChanged', { player }),
	]);
}

/**
 * The upgrade effect (§7): mandatory with one card is automatic, with none says so; optional always asks while a card can be upgraded.
 * @type {import('../state.js').EffectHandler}
 */
export function upgrade(ctx, player, value) {
	const cards = upgradable(ctx.state, player);
	const optional = value?.optional === true;
	if (cards.length === 0) {
		if (!optional) {
			emit(ctx.state, { type: 'noUpgrade', player });
		}
		return;
	}
	if (cards.length === 1 && !optional) {
		upgradeCard(ctx, player, cards[0]);
		return;
	}
	ctx.push([{ player, kind: 'chooseUpgrade', optional }]);
}

/**
 * The cards a tech benefit may use: the middle row for the circle, the top row for the square.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {'circle' | 'square'} icon
 * @returns {string[]}
 */
export function techBenefitOptions(state, player, icon) {
	const rows = playerSeat(state, player).tech;
	return [...(icon === 'circle' ? rows.middle : rows.top)];
}

/**
 * Pushes one card's circle or square benefit without moving the card (§8).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} card
 * @param {'circle' | 'square'} icon
 */
export function useTechBenefit(ctx, player, card, icon) {
	// The `passive` mark is deliberately not carried: a card's benefit is never passive civilization VP, and a finished player gains nothing else (01 §4.3).
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(techCard(card)[icon]),
			source: { tech: card, icon },
		},
	]);
}

/**
 * The techBenefit effect (§8, FAQ #8): the circle of a middle-row card or the square of a top-row card, without moving it.
 * One option is taken automatically; with none, nothing happens.
 * @type {import('../state.js').EffectHandler}
 */
export function techBenefit(ctx, player, value) {
	const { icon } = value;
	const options = techBenefitOptions(ctx.state, player, icon);
	if (options.length === 0) {
		emit(ctx.state, { type: 'noTechBenefit', player });
		return;
	}
	if (options.length === 1) {
		useTechBenefit(ctx, player, options[0], icon);
		return;
	}
	ctx.push([{ player, kind: 'chooseTechBenefit', icon, options }]);
}

/**
 * The landmark effect (§8): a landmark card's square gains its landmark and places it, if nobody owns it yet.
 * @type {import('../state.js').EffectHandler}
 */
export function landmark(ctx, player, value) {
	const { state } = ctx;
	const id = /** @type {string} */ (value);
	const at = state.landmarks.indexOf(id);
	if (at === -1) {
		emit(state, { type: 'noLandmarkLeft', player, landmark: id });
		return;
	}
	state.landmarks.splice(at, 1);
	emit(state, { type: 'landmarkGained', player, landmark: id, tech: true });
	ctx.push([
		{ player, kind: 'placeLandmark', landmark: id },
		...triggered(state, 'landmarkGained', {
			player,
			landmark: id,
			fromTrack: false,
		}),
	]);
}
