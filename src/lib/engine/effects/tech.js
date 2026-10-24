// The invent effect: take a tech card from the display or the deck into the bottom row (01 §9.1, FAQ #24).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
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
 * @param {import('../state.js').State} state
 * @param {{ refresh?: boolean }} decision
 * @returns {{ card?: string, refresh?: true }[]}
 */
export function inventAnswers(state, decision) {
	const { faceUp } = state.supply.tech;
	/** @type {{ card?: string, refresh?: true }[]} */
	const answers = faceUp.map((card) => ({ card }));
	if (canDraw(state)) {
		answers.push({ card: 'deck' });
	}
	// A refresh with no cards anywhere would change nothing.
	if (decision.refresh && answers.length > 0) {
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
 */
function askInvent(ctx, player, left, refresh) {
	const answers = inventAnswers(ctx.state, { refresh });
	if (answers.length === 0) {
		emit(ctx.state, { type: 'noInvent', player });
		return;
	}
	if (answers.length === 1) {
		inventCard(ctx, player, answers[0], left);
		return;
	}
	ctx.push([{ player, kind: 'chooseInvent', left, refresh }]);
}

/**
 * Resolves one answer: a refresh, or a card into the bottom row. More cards, or the same count after a refresh, are asked for again.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {{ card?: string, refresh?: true }} answer
 * @param {number} left - Cards still to invent, this one included
 */
export function inventCard(ctx, player, answer, left) {
	const tech = ctx.state.supply.tech;
	if (answer.refresh) {
		refreshDisplay(ctx);
		askInvent(ctx, player, left, false);
		return;
	}
	const from = answer.card === 'deck' ? 'deck' : 'display';
	const card =
		answer.card === 'deck'
			? drawTech(ctx)
			: tech.faceUp.splice(tech.faceUp.indexOf(answer.card ?? ''), 1)[0];
	if (card === null || card === undefined) {
		throw new Error('inventCard found no card to take.');
	}
	playerSeat(ctx.state, player).tech.bottom.push(card);
	emit(ctx.state, { type: 'techInvented', player, card, from });
	refillDisplay(ctx);
	if (left > 1) {
		askInvent(ctx, player, left - 1, false);
	}
}

/**
 * The invent effect: `count` cards (default 1), with a refresh first if `refresh` is set.
 * @type {import('../state.js').EffectHandler}
 */
export function invent(ctx, player, value) {
	askInvent(ctx, player, value?.count ?? 1, value?.refresh === true);
}

/**
 * Upgrades one card: it moves to the end of the next row, and the benefit of the icon it reaches follows.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} card
 */
export function upgradeCard(ctx, player, card) {
	const rows = playerSeat(ctx.state, player).tech;
	const from = rows.bottom.includes(card) ? 'bottom' : 'middle';
	const to = from === 'bottom' ? 'middle' : 'top';
	rows[from].splice(rows[from].indexOf(card), 1);
	rows[to].push(card);
	emit(ctx.state, { type: 'techUpgraded', player, card, from, to });
	const icon = from === 'bottom' ? 'circle' : 'square';
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
