// Official base bot turns. Every advance and income step is an operation, so human triggers settle between them.
import { AUTOMA_CARDS } from './data/automa-cards.js';
import { AUTOMA_LEVELS } from './data/automa-levels.js';
import { AUTOMA_CIVS } from './data/automa-civs.js';
import { automaCivilizationsFor } from './data/automa-expansion-civs.js';
import {
	equalizersIncome,
	setupHucksters,
	addHuckstersIncomeItem,
	huckstersScoreCount,
} from './automa-expansion-pp.js';
import { askInfluencersTrendy } from './automa-expansion-aa.js';
import {
	gainCharmerIncome,
	resolveTimeTravelersIncome,
	hasFfAutomaCivilization,
	ffDecisionPairAdvances,
	erraticsAdvance,
	timeTravelersLandmarks,
	setupCharmers,
} from './automa-expansion-ff.js';
import { TRACKS } from './data/tracks.js';
import { scienceFaces } from './data/dice.js';
import { defaultDie } from './science-die.js';
import { refreshFaceUp } from './masterpieces.js';
import { MAPS, hexNeighbours } from './data/maps.js';
import { drawAutomaPair, drawShadowEmpirePair } from './automa-decks.js';
import { selectBotTrack } from './automa-selection.js';
import {
	automaDistance,
	hexesByPattern as hexPatternOrder,
} from './automa-map.js';
import { seatOf } from './state.js';
import { emit } from './events.js';
import { moveToken, spacesAdvanced } from './movement.js';
import { controlledTerritories } from './control.js';
import { exploreHexes, conquerTargets } from './map.js';
import { conquerHex } from './effects/conquer.js';
import { refreshDisplay } from './tech.js';
import { shuffle } from './random.js';
import { vp } from './effects/vp.js';
import { PlayerError } from './errors.js';

/** Runtime fields stay separate from human-only state.
 * @typedef {import('./state.js').BotSeat & {decisionDeck: number[], currentPair: import('./automa-decks.js').DecisionPair | null, favouriteTrack: import('./data/ids.js').TrackId} & Record<string, any>} RuntimeBot
 */
/** @param {import('./state.js').State} state @param {number} player @returns {RuntimeBot} */
const botOf = (state, player) =>
	/** @type {RuntimeBot} */ (seatOf(state, player));
/** @param {number} id */
const cardOf = (id) => {
	const card = AUTOMA_CARDS.find((c) => c.id === id);
	if (!card) throw new Error(`Unknown Automa card ${id}.`);
	return card;
};

/** A solo Shadow shares Automa's turn; a standalone Shadow occupies its normal seat.
 * @param {import('./state.js').State} state @param {number} player
 */
export function sharedShadow(state, player) {
	return (
		seatOf(state, player).kind === 'shadow' &&
		state.seats.some((s) => s.kind === 'automa')
	);
}

/** @param {import('./state.js').Context} ctx @param {number} player */
export function startBotTurn(ctx, player) {
	const { state } = ctx;
	const bot = botOf(state, player);
	ctx.push([{ player, kind: 'endTurn' }]);
	if (bot.kind === 'shadow') {
		state.turnKind = 'advance';
		emit(state, { type: 'turnChosen', player, turn: 'advance' });
		if (bot.decisionDeck.length === 0)
			changeFavourite(state, bot, bot.currentPair?.tiebreakerCard);
		const pair = drawShadowEmpirePair(
			/** @type {RuntimeBot & import('./automa-decks.js').ShadowDeckState} */ (
				bot
			),
			ctx.random
		);
		emit(state, {
			type: 'botDecisionCards',
			player,
			pair,
			bot: 'shadow',
			favourites: favouriteSnapshot(state),
		});
		ctx.push([{ player, kind: 'botSelectAdvance', pair }]);
		return;
	}
	if (bot.incomeTurns === 0) {
		beginIncome(ctx, bot);
		return;
	}
	const pair = drawAutomaPair(
		/** @type {RuntimeBot & import('./automa-decks.js').AutomaDeckState} */ (
			bot
		),
		ctx.random
	);
	if (pair)
		emit(state, {
			type: 'botDecisionCards',
			player,
			pair,
			bot: 'automa',
			favourites: favouriteSnapshot(state),
		});
	if (
		!pair ||
		(bot.decisionDeck.length === 0 && cardOf(pair.trackCard).income)
	) {
		beginIncome(ctx, bot);
		return;
	}
	state.turnKind = 'advance';
	emit(state, { type: 'turnChosen', player, turn: 'advance' });
	ctx.push(pairOps(state, bot, pair));
}

/** The report keeps the favourite shown when these cards were used, even after later income turns.
 * @param {import('./state.js').State} state
 */
function favouriteSnapshot(state) {
	return Object.fromEntries(
		state.seats
			.filter((seat) => seat.kind !== 'player')
			.map((seat) => [seat.seat, botOf(state, seat.seat).favouriteTrack])
	);
}

/** @param {import('./state.js').State} state @param {RuntimeBot} bot @param {import('./automa-decks.js').DecisionPair} pair @returns {import('./state.js').NewOperation[]} */
function pairOps(state, bot, pair) {
	return [
		bot,
		...state.seats.filter(
			(s) =>
				s.kind === 'shadow' && !hasFfAutomaCivilization(bot, 'erratics')
		),
	].map((s) => ({ player: s.seat, kind: 'botSelectAdvance', pair }));
}

/** @type {import('./state.js').AutomaticKind} */
export function botSelectAdvance(ctx, op) {
	const bot = botOf(ctx.state, Number(op.player));
	const card = cardOf(op.pair.trackCard);
	const track = selectBotTrack(
		ctx.state,
		bot.seat,
		bot.kind === 'shadow' ? card.shadowEmpireTrack : card.automaTrack,
		cardOf(op.pair.tiebreakerCard),
		bot.kind
	);
	if (track)
		ctx.push(
			Array.from(
				{
					length:
						bot.kind === 'automa' ? ffDecisionPairAdvances(bot) : 1,
				},
				() => ({
					player: bot.seat,
					kind: 'botAdvance',
					track,
					benefit: true,
					pair: op.pair,
					pairAdvance: op.id,
				})
			)
		);
}

/** @type {import('./state.js').AutomaticKind} */
export function botAdvance(ctx, op) {
	const player = Number(op.player),
		bot = botOf(ctx.state, player);
	const from = spacesAdvanced(bot, op.track);
	if (op.pairAdvance && bot.cancelledPairAdvance === op.pairAdvance) return;
	const to = Math.max(0, Math.min(12, from + (op.regress ? -1 : 1)));
	if (from === to) return;
	if (op.pairAdvance && hasFfAutomaCivilization(bot, 'erratics')) {
		const human = ctx.state.seats.find((seat) => seat.kind === 'player');
		if (human && erraticsAdvance(bot, human, op.track).skip) {
			vp(ctx, player, 3, /** @type {any} */ ({ origin: 'civ' }));
			return;
		}
	}
	const landmark =
		TRACKS[/** @type {import('./data/ids.js').TrackId} */ (op.track)]?.[to]
			?.landmark;
	const returns =
		bot.kind === 'automa' &&
		!op.regress &&
		hasFfAutomaCivilization(bot, 'time-travelers') &&
		landmark &&
		ctx.state.landmarks.includes(landmark);
	// The shared movement path awards landmarks, achievements and human observer triggers, but never a human bonus.
	if ((op.benefit && !op.regress && bot.kind === 'automa') || returns)
		ctx.push([
			...(op.benefit && !op.regress && bot.kind === 'automa'
				? [
						{
							player,
							kind: 'botBenefit',
							track: op.track,
							space: to,
							pair: op.pair,
						},
					]
				: []),
			...(returns
				? [
						{
							player,
							kind: 'botTimeTravelReturn',
							track: op.track,
							pairAdvance: op.pairAdvance,
						},
					]
				: []),
		]);
	moveToken(ctx, player, { track: op.track, from, to, benefit: false });
	if (bot.kind === 'shadow' && !op.regress) {
		advanceTwinImpact(ctx, bot, op.track);
	}
	// The extra token marks the favourite and travels with the Automa token.
	if (
		bot.kind === 'automa' &&
		bot.favouriteMarker === 'track-token' &&
		bot.favouriteTrack === op.track
	) {
		const markers =
			bot.tracks[
				/** @type {import('./data/ids.js').TrackId} */ (op.track)
			];
		const marker = markers.indexOf(from);
		if (marker !== -1) markers[marker] = to;
	}
}

/** Twin Impact advances one space on the next clockwise track whenever Shadow advances. It takes landmarks for the
 * Automa box, but earns no track benefits or achievements and does not fire civilization triggers (A&A Automa rules).
 * @param {import('./state.js').Context} ctx
 * @param {RuntimeBot} shadow
 * @param {import('./data/ids.js').TrackId} shadowTrack
 */
function advanceTwinImpact(ctx, shadow, shadowTrack) {
	const twinTracks = /** @type {any} */ (shadow).twinTracks;
	if (!twinTracks) return;
	// R66's verified clockwise order; #186 blocks the arts-track position.
	/** @type {import('./data/ids.js').BoardTrackId[]} */
	const clockwise = ['military', 'science', 'exploration', 'technology'];
	const nextTrack = clockwise[
		(clockwise.indexOf(/** @type {import('./data/ids.js').BoardTrackId} */ (shadowTrack)) +
			1) %
			clockwise.length
	];
	const tokens = twinTracks[nextTrack];
	if (!tokens?.length) return;
	const from = Math.max(...tokens);
	if (from >= 12) return;
	const to = from + 1;
	tokens[tokens.indexOf(from)] = to;
	emit(ctx.state, {
		type: 'twinImpactMoved',
		player: shadow.seat,
		track: nextTrack,
		from,
		to,
	});
	const landmark = TRACKS[nextTrack]?.[to]?.landmark;
	if (!landmark || !ctx.state.landmarks.includes(landmark)) return;
	ctx.state.landmarks.splice(ctx.state.landmarks.indexOf(landmark), 1);
	const owner = /** @type {RuntimeBot} */ (
		ctx.state.seats.find((seat) => seat.kind === 'automa') ?? shadow
	);
	owner.landmarks.push(landmark);
	emit(ctx.state, {
		type: 'landmarkGained',
		player: shadow.seat,
		owner: owner.seat,
		landmark,
		track: nextTrack,
		twinImpact: true,
	});
}

/** @type {import('./state.js').AutomaticKind} */
export function botTimeTravelReturn(ctx, op) {
	const bot = botOf(ctx.state, Number(op.player));
	const from = spacesAdvanced(bot, op.track);
	if (op.pairAdvance) bot.cancelledPairAdvance = op.pairAdvance;
	const tokens =
		bot.tracks[/** @type {import('./data/ids.js').TrackId} */ (op.track)];
	for (let i = 0; i < tokens.length; i++)
		if (tokens[i] === from) tokens[i] = 0;
	emit(ctx.state, {
		type: 'tokenMoved',
		player: bot.seat,
		track: op.track,
		from,
		to: 0,
	});
}

/** @type {import('./state.js').AutomaticKind} */
export function botBenefit(ctx, op) {
	const player = Number(op.player),
		space = Number(op.space),
		track = op.track;
	/** @param {string} kind @param {Record<string, any>} [extra] */
	const push = (kind, extra = {}) =>
		ctx.push([{ player, kind, pair: op.pair, ...extra }]);
	if (track === 'exploration' && [2, 3, 4, 7, 9].includes(space))
		push('botMap', { action: 'explore', anywhere: space === 9 });
	if (track === 'technology') {
		if ([1, 3, 4, 7].includes(space)) {
			refreshDisplay(ctx);
			emit(ctx.state, { type: 'techRefreshed', player });
		}
		if (space === 2)
			gainTapestry(ctx, botOf(ctx.state, player), 'trapCards');
	}
	if (track === 'military') {
		if ([2, 6].includes(space))
			gainTapestry(ctx, botOf(ctx.state, player), 'trapCards');
		if ([1, 3, 5, 6, 7, 8, 12].includes(space))
			push('botMap', { action: 'conquer', anywhere: space === 8 });
	}
	if (track === 'arts') {
		if (space === 1)
			gainTapestry(ctx, botOf(ctx.state, player), 'trapCards');
		if (space === 7) refreshFaceUp(ctx, player);
		if ([9, 11].includes(space))
			push('botResearch', {
				tracks: ['military', 'technology', 'exploration', 'science'],
				benefit: true,
			});
	}
	if (track === 'science') {
		if ([2, 4].includes(space))
			gainTapestry(ctx, botOf(ctx.state, player), 'trapCards');
		if ([1, 3, 5, 6, 12].includes(space))
			push('botResearch', { benefit: [5, 6].includes(space) });
		if ([9, 10, 11].includes(space))
			push('botResearch', {
				tracks:
					space === 10
						? ['military', 'technology']
						: ['military', 'technology', 'exploration'],
				regress: space === 10,
				steps: space === 11 ? 2 : 1,
				benefit: true,
			});
	}
}

/** @type {import('./state.js').AutomaticKind} */
export function botResearch(ctx, op) {
	const faces = scienceFaces(defaultDie(ctx.state));
	const valid = op.tracks ?? [...new Set(faces)];
	let track;
	do {
		track = faces[ctx.random(faces.length)];
		emit(ctx.state, {
			type: 'scienceDieRolled',
			player: op.player,
			track,
			...(faces.length === 20 ? { scienceDie: 'd20' } : {}),
		});
	} while (!valid.includes(track));
	ctx.push(
		Array.from({ length: op.steps ?? 1 }, () => ({
			player: op.player,
			kind: 'botAdvance',
			track,
			benefit: op.benefit,
			regress: op.regress,
			pair: op.pair,
		}))
	);
}

/** @param {import('./state.js').Context} ctx @param {RuntimeBot} bot @param {'trapCards'|'multiplierCards'} field */
function gainTapestry(ctx, bot, field) {
	const supply = ctx.state.supply.tapestry;
	if (supply.deck.length === 0 && supply.discard.length) {
		supply.deck = shuffle(supply.discard, ctx.random);
		supply.discard = [];
	}
	const card = supply.deck.shift();
	if (card) {
		bot[field].push(card);
		emit(ctx.state, {
			type: 'botTapestryGained',
			player: bot.seat,
			destination: field,
			count: 1,
		});
	}
}

/** @param {import('./state.js').Context} ctx @param {RuntimeBot} bot */
function beginIncome(ctx, bot) {
	const human = ctx.state.seats.find((s) => s.kind === 'player');
	if (!human) throw new Error('Automa needs a human player.');
	bot.incomeTurns++;
	ctx.state.turnKind = 'income';
	emit(ctx.state, { type: 'turnChosen', player: bot.seat, turn: 'income' });
	emit(ctx.state, {
		type: 'incomeTurnStarted',
		player: bot.seat,
		turn: bot.incomeTurns,
	});
	const level = AUTOMA_LEVELS.find((l) => l.level === bot.level);
	if (!level) throw new Error('Unknown Automa difficulty.');
	const firstBonus = level.scoreMultipliers.firstEra[bot.incomeTurns];
	if (
		firstBonus &&
		ctx.state.seats
			.filter((s) => s.kind === 'player')
			.every((s) => s.incomeTurns < bot.incomeTurns)
	) {
		vp(
			ctx,
			bot.seat,
			firstBonus,
			/** @type {any} */ ({ origin: 'income' })
		);
	}
	if (!bot.currentPair) {
		const id = bot.progressDeck[0];
		bot.incomePair = { trackCard: id, tiebreakerCard: id };
		bot.progressDeck = shuffle(bot.progressDeck, ctx.random);
	} else bot.incomePair = bot.currentPair;
	// The verified A&A level-3 chart matches base level 4; levels 1 and 2
	// add two progress cards on income turns 3 and 4.
	const aa = ctx.state.expansions.includes('aa');
	const chart =
		aa && level.level === 3
			? (AUTOMA_LEVELS.find((entry) => entry.level === 4) ?? level)
			: level;
	/** @type {import('./state.js').NewOperation[]} */
	const ops = chart.incomeRows
		.filter((row) => row.turns.includes(bot.incomeTurns))
		.map((row) => ({
			player: bot.seat,
			kind: 'botIncomeStep',
			step: row.kind,
			cards:
				row.cardsByTurn?.[bot.incomeTurns] === undefined
					? undefined
					: row.cardsByTurn[bot.incomeTurns] +
						(aa &&
						level.level <= 2 &&
						[3, 4].includes(bot.incomeTurns)
							? 2
							: 0),
		}));
	if (bot.incomeTurns === 1)
		for (const extra of level.firstIncomeExtras) {
			if (extra.kind === 'humanAdvance')
				for (const track of extra.tracks)
					ops.push({
						player: human.seat,
						kind: 'effects',
						effects: [{ advance: { tracks: [track] } }],
					});
			if (extra.kind === 'botAdvance')
				for (const seat of ctx.state.seats.filter(
					(s) => s.kind !== 'player'
				))
					for (const track of extra.tracks)
						ops.push({
							player: seat.seat,
							kind: 'botAdvance',
							track:
								track === 'favourite'
									? botOf(ctx.state, seat.seat).favouriteTrack
									: track,
							benefit: true,
							pair: bot.incomePair,
						});
		}
	ops.push({ player: bot.seat, kind: 'botIncomeDone' });
	ctx.push(ops);
}

/** @param {import('./state.js').State} state @param {RuntimeBot} bot @param {number | undefined} card */
function changeFavourite(state, bot, card) {
	const old = bot.favouriteTrack,
		current = spacesAdvanced(bot, old);
	if (
		current < 12 &&
		!state.seats.some((s) => spacesAdvanced(s, old) > current)
	)
		return;
	if (!card) return;
	const next = selectBotTrack(state, bot.seat, 'LMK', cardOf(card), bot.kind);
	if (!next) return;
	if (bot.favouriteMarker === 'track-token') {
		const markers = bot.tracks[old];
		const at = markers.indexOf(current);
		if (at !== -1 && markers.length > 1) markers.splice(at, 1);
		bot.tracks[next].push(spacesAdvanced(bot, next));
	}
	bot.favouriteTrack = next;
	emit(state, { type: 'botFavouriteChanged', player: bot.seat, track: next });
}

/** @type {import('./state.js').AutomaticKind} */
export function botIncomeStep(ctx, op) {
	const bot = botOf(ctx.state, Number(op.player)),
		turn = bot.incomeTurns,
		pair = bot.incomePair;
	switch (op.step) {
		case 'changeFavourite':
			for (const seat of ctx.state.seats.filter(
				(s) =>
					s.kind !== 'player' &&
					!(
						s.kind === 'shadow' &&
						hasFfAutomaCivilization(bot, 'erratics')
					)
			))
				changeFavourite(
					ctx.state,
					botOf(ctx.state, seat.seat),
					pair?.tiebreakerCard
				);
			break;
		case 'advanceBots':
			ctx.push(pairOps(ctx.state, bot, pair));
			break;
		case 'civilizationIncome':
			ctx.push(
				[bot.civilization, bot.secondCivilization]
					.filter(Boolean)
					.map((civilization) => ({
						player: bot.seat,
						kind: 'botCivilizationIncome',
						civilization,
					}))
			);
			break;
		case 'score': {
			const level = AUTOMA_LEVELS.find((l) => l.level === bot.level);
			if (!level) throw new Error('Unknown Automa difficulty.');
			const col = Math.min(3, bot.multiplierCards.length),
				m = level.scoreMultipliers;
			const score =
				(bot.landmarks.length +
					([bot.civilization, bot.secondCivilization].includes(
						'hucksters'
					)
						? huckstersScoreCount(ctx.state, bot.seat)
						: 0) +
					controlledTerritories(ctx.state, bot.seat).length) *
					m.landmarksAndTerritories[col] +
				(spacesAdvanced(bot, 'military') +
					spacesAdvanced(bot, 'science')) *
					m.militaryAndScience[col] +
				(spacesAdvanced(bot, 'technology') +
					spacesAdvanced(bot, 'exploration') +
					(bot.tracks.arts ? spacesAdvanced(bot, 'arts') : 0)) *
					m.technologyAndExploration[col];
			vp(ctx, bot.seat, score, /** @type {any} */ ({ origin: 'income' }));
			break;
		}
		case 'addProgressCards':
			bot.decisionDiscard.push(
				...bot.progressDeck.splice(0, op.cards ?? 0)
			);
			break;
		case 'coverMultiplier':
			gainTapestry(ctx, bot, 'multiplierCards');
			break;
		case 'gainTrapCard':
			gainTapestry(ctx, bot, 'trapCards');
			break;
		case 'shuffleDecisionDeck': {
			const pairIds = bot.currentPair
				? [bot.currentPair.trackCard, bot.currentPair.tiebreakerCard]
				: [];
			bot.decisionDeck = shuffle(
				[...bot.decisionDeck, ...bot.decisionDiscard, ...pairIds],
				ctx.random
			);
			bot.decisionDiscard = [];
			bot.currentPair = null;
			break;
		}
	}
	emit(ctx.state, {
		type: 'botIncomeStep',
		player: bot.seat,
		step: op.step,
		turn,
	});
}

/** @type {import('./state.js').AutomaticKind} */
export function botCivilizationIncome(ctx, op) {
	const bot = botOf(ctx.state, Number(op.player));
	if (bot.incomeTurns >= 2 && op.civilization === 'equalizers') {
		equalizersIncome(ctx, bot.seat);
		return;
	}
	if (bot.incomeTurns >= 2 && op.civilization === 'hucksters') {
		addHuckstersIncomeItem(ctx, bot.seat);
		return;
	}
	if (bot.incomeTurns >= 2 && op.civilization === 'muses') {
		ctx.push([{ player: bot.seat, kind: 'botMusesIncome' }]);
		return;
	}
	if (bot.incomeTurns >= 2 && op.civilization === 'influencers') {
		ctx.push([{ player: bot.seat, kind: 'botInfluencersIncome' }]);
		return;
	}
	if (bot.incomeTurns >= 2 && op.civilization === 'charmers') {
		gainCharmerIncome(ctx, bot);
		return;
	}
	if (bot.incomeTurns >= 2 && op.civilization === 'time-travelers') {
		const human = ctx.state.seats.find((seat) => seat.kind === 'player');
		if (human) resolveTimeTravelersIncome(ctx, human.seat);
		return;
	}
	const civ = AUTOMA_CIVS.find((c) => c.id === op.civilization);
	if (!civ) return;
	ctx.push(
		civ.incomeAbilities
			.filter((a) => a.turns.includes(bot.incomeTurns))
			.map((ability) => ({
				player: bot.seat,
				kind: 'botCivilizationAbility',
				ability,
			}))
	);
}

/** @type {import('./state.js').AutomaticKind} */
export function botCivilizationAbility(ctx, op) {
	const bot = botOf(ctx.state, Number(op.player)),
		ability = op.ability;
	const count = controlledTerritories(ctx.state, bot.seat).length;
	if (ability.kind === 'advance')
		ctx.push([
			{
				player: bot.seat,
				kind: 'botAdvance',
				track: ability.track,
				benefit: true,
				pair: bot.incomePair,
			},
		]);
	if (ability.kind === 'scienceDieAdvance')
		ctx.push([
			{
				player: bot.seat,
				kind: 'botResearch',
				benefit: true,
				pair: bot.incomePair,
			},
		]);
	if (
		ability.kind === 'conquerIfFewerTerritoriesThanIncomeTurn' &&
		count < bot.incomeTurns
	)
		ctx.push([
			{
				player: bot.seat,
				kind: 'botMap',
				action: 'conquer',
				pair: bot.incomePair,
			},
		]);
	if (ability.kind === 'score')
		vp(
			ctx,
			bot.seat,
			(ability.per === 'landmark' ? bot.landmarks.length : count) *
				ability.vp,
			/** @type {any} */ ({ origin: 'civ' })
		);
	if (ability.kind === 'reinforceWithToppledShadowEmpireOutpost') {
		const singles = controlledTerritories(ctx.state, bot.seat).filter(
			(hex) =>
				ctx.state.hexes[hex].outposts.length +
					ctx.state.hexes[hex].tokens.length ===
				1
		);
		const shadow = ctx.state.seats.find((s) => s.kind === 'shadow');
		if (
			singles.length >= ability.minimumSingleTokenTerritories &&
			shadow &&
			shadow.outposts > 0
		) {
			const hex = hexPatternOrder(
				cardOf(bot.incomePair.tiebreakerCard).hexPattern
			).find((h) => singles.includes(h));
			if (hex) {
				shadow.outposts--;
				ctx.state.hexes[hex].outposts.push({
					seat: shadow.seat,
					toppled: true,
				});
				emit(ctx.state, {
					type: 'outpostPlaced',
					player: shadow.seat,
					hex,
					toppled: true,
				});
			}
		}
	}
}

/** The level-6 extra civilization is explicitly the human's setup choice, not another random draw.
 * @type {import('./state.js').DecisionKind}
 */
export const chooseAutomaCivilization = {
	hidden: [],
	answers(state, op) {
		return automaCivilizationsFor(state.expansions, state.variants)
			.filter((c) => c.id !== botOf(state, op.bot).civilization)
			.map((c) => ({ civilization: c.id }));
	},
	check(state, op, answer) {
		if (
			!chooseAutomaCivilization
				.answers(state, op)
				.some((a) => a.civilization === answer.civilization)
		)
			throw new PlayerError('Choose a second Automa civilization.');
	},
	resolve(ctx, op, answer) {
		botOf(ctx.state, op.bot).secondCivilization = answer.civilization;
		if (answer.civilization === 'hucksters') setupHucksters(ctx, op.bot);
		if (answer.civilization === 'influencers')
			askInfluencersTrendy(ctx, op.bot, true);
		if (answer.civilization === 'charmers')
			setupCharmers(ctx, botOf(ctx.state, op.bot));
		if (answer.civilization === 'erratics') {
			const shadow = ctx.state.seats.find(
				(seat) => seat.kind === 'shadow'
			);
			if (shadow)
				for (const track of Object.keys(shadow.tracks))
					shadow.tracks[
						/** @type {import('./data/ids.js').TrackId} */ (track)
					] = [];
		}
		if (answer.civilization === 'time-travelers') {
			const options = timeTravelersLandmarks(
				ctx.state.landmarks,
				ctx.state.expansions
			);
			if (options.length)
				ctx.push([
					{
						player: Number(op.player),
						kind: 'chooseLandmark',
						options,
						purpose: 'timeTravelers',
					},
				]);
		}
		emit(ctx.state, {
			type: 'automaCivilizationChosen',
			player: op.bot,
			civilization: answer.civilization,
			second: true,
		});
	},
};

/** @param {import('./state.js').Context} ctx */
export function askAutomaSetup(ctx) {
	const bot = /** @type {RuntimeBot | undefined} */ (
		ctx.state.seats.find((s) => s.kind === 'automa')
	);
	const human = ctx.state.seats.find((s) => s.kind === 'player');
	if (bot?.civilization === 'hucksters') setupHucksters(ctx, bot.seat);
	if (bot?.civilization === 'influencers')
		askInfluencersTrendy(ctx, bot.seat, true);
	if (bot?.civilization === 'time-travelers' && human) {
		const options = timeTravelersLandmarks(
			ctx.state.landmarks,
			ctx.state.expansions
		);
		if (options.length)
			ctx.push([
				{
					player: human.seat,
					kind: 'chooseLandmark',
					options,
					purpose: 'timeTravelers',
				},
			]);
	}
	if (bot && bot.level === 6 && !bot.secondCivilization && human)
		ctx.push([
			{
				player: human.seat,
				kind: 'chooseAutomaCivilization',
				bot: bot.seat,
			},
		]);
}

/** @type {import('./state.js').AutomaticKind} */
export function botIncomeDone(ctx, op) {
	const bot = botOf(ctx.state, Number(op.player));
	if (bot.incomeTurns >= 5) {
		bot.finished = true;
		for (const s of ctx.state.seats.filter((s) => s.kind === 'shadow'))
			s.finished = true;
	}
	emit(ctx.state, {
		type: 'incomeTurnEnded',
		player: bot.seat,
		turn: bot.incomeTurns,
	});
}

/** @type {import('./state.js').AutomaticKind} */
export function botMap(ctx, op) {
	const { state } = ctx,
		bot = botOf(state, Number(op.player));
	const human = state.seats.find((s) => s.kind === 'player');
	if (!human) return;
	let pair = op.pair ?? bot.currentPair;
	if (!pair) {
		// R36: a human effect may reach Automa before its first decision pair is face up.
		const id = bot.progressDeck[0];
		if (id === undefined)
			throw new Error('Automa has no progress tiebreaker.');
		pair = { trackCard: id, tiebreakerCard: id };
		bot.progressDeck = shuffle(bot.progressDeck, ctx.random);
	}
	const card = cardOf(pair.tiebreakerCard),
		owned = controlledTerritories(state, human.seat);
	let targets = exploreHexes(state, bot.seat, !!op.anywhere);
	/** @param {string} a @param {string} b */
	const distance = (a, b) =>
		automaDistance(state, bot.seat, human.seat, a, b);
	/** @param {string[]} values @param {(h:string)=>number} score @param {boolean} [max] */
	const closest = (values, score, max = false) => {
		const value = (max ? Math.max : Math.min)(...values.map(score));
		return values.filter((h) => score(h) === value);
	};
	if (op.action === 'conquer') {
		if (bot.outposts === 0) return;
		const legal = conquerTargets(state, bot.seat, !!op.anywhere),
			opponent = legal.filter((h) => owned.includes(h));
		if (opponent.length) targets = opponent;
		else
			targets = [...new Set([...legal, ...targets])].filter(
				(h) =>
					card.topple ||
					!hexNeighbours(h).some((n) => owned.includes(n))
			);
		if (!state.achievements['middle-island'].includes(bot.seat))
			targets = closest(targets, (h) =>
				distance(h, MAPS[state.map].middle)
			);
		if (!opponent.length && owned.length) {
			const singles = owned.filter(
				(h) =>
					state.hexes[h].outposts.length +
						state.hexes[h].tokens.length ===
					1
			);
			const near = singles.length ? singles : owned;
			targets = closest(targets, (h) =>
				Math.min(...near.map((n) => distance(h, n)))
			);
		}
	} else if (bot.favouriteTrack !== 'military' && owned.length)
		targets = closest(
			targets,
			(h) => Math.min(...owned.map((n) => distance(h, n))),
			true
		);
	const hex = hexPatternOrder(card.hexPattern).find((h) =>
		targets.includes(h)
	);
	if (!hex) return;
	if (state.hexes[hex].tile === null) {
		const tile = state.supply.territory.shift();
		if (tile === undefined) return;
		const orient = ctx.random(6);
		state.hexes[hex].tile = tile;
		state.hexes[hex].orient = orient;
		emit(state, {
			type: 'explored',
			player: bot.seat,
			hex,
			tile,
			orient,
			vp: 0,
		});
	}
	if (op.action === 'conquer') {
		const neutral = !owned.includes(hex);
		conquerHex(ctx, bot.seat, hex, undefined);
		const shadow = state.seats.find((s) => s.kind === 'shadow');
		if (
			neutral &&
			card.topple &&
			hex !== MAPS[state.map].middle &&
			shadow &&
			shadow.outposts > 0
		) {
			shadow.outposts--;
			state.hexes[hex].outposts.push({
				seat: shadow.seat,
				toppled: true,
			});
			emit(state, {
				type: 'outpostPlaced',
				player: shadow.seat,
				hex,
				toppled: true,
			});
		}
	}
}
