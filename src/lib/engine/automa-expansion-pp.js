// Plans & Ploys' known Automa civilizations (03 §1.7; R46–R47).
import { AUTOMA_CARDS } from './data/automa-cards.js';
import { SCIENCE_DIE } from './data/dice.js';
import { deepFreeze } from './data/ids.js';
import { tracksOf } from './tracks-in-play.js';
import { emit } from './events.js';
import { moveToken, spacesAdvanced } from './movement.js';
import { seatOf } from './state.js';
import { drawTech } from './tech.js';
import { drawMasterpiece } from './masterpieces.js';
import { takeTapestryCard } from './effects/gain.js';
import { vp } from './effects/vp.js';
import { drawAvailableTiles } from './automa-time-travelers.js';
import { hasFfAutomaCivilization } from './automa-expansion-ff.js';
import { TRACKS } from './data/tracks.js';

/** P&P civilizations with verified favorite icons. A die determines their favourite at setup. */
export const PP_AUTOMA_CIVS = deepFreeze([
	{
		id: 'equalizers',
		name: 'Equalizers',
		favouriteTrack: 'die',
		incomeAbilities: [{ kind: 'equalizers', turns: [2, 3, 4, 5] }],
	},
	{
		id: 'hucksters',
		name: 'Hucksters',
		favouriteTrack: 'die',
		incomeAbilities: [{ kind: 'hucksters', turns: [2, 3, 4, 5] }],
	},
]);

/** @typedef {'space' | 'territory' | 'tapestry' | 'tech' | 'masterpiece'} HuckstersItem */
/** @param {import('./random.js').Random} random */
export function rollExpansionFavourite(random) {
	return SCIENCE_DIE[random(SCIENCE_DIE.length)];
}

/** The human's track is a target only when it is 1 or 2 spaces ahead. */
/** @param {import('./state.js').State} state @param {number} player @param {number} human */
export function equalizerTracks(state, player, human) {
	const bot = seatOf(state, player),
		opponent = seatOf(state, human);
	return tracksOf(state).filter((track) => {
		const distance =
			spacesAdvanced(opponent, track) - spacesAdvanced(bot, track);
		return distance === 1 || distance === 2;
	});
}

/** Selects only a qualifying track using the printed card's top-to-bottom tiebreak. */
/** @param {import('./state.js').State} state @param {number} player @param {number} human @param {readonly string[]} order */
export function equalizerTrack(state, player, human, order) {
	const valid = equalizerTracks(state, player, human);
	const favourite = /** @type {any} */ (seatOf(state, player)).favouriteTrack;
	return (
		order
			.map((item) => (item === 'favourite' ? favourite : item))
			.find((track) => valid.includes(track)) ?? null
	);
}

/** Runs Equalizers' income ability; landmarks and observer triggers use the normal move path. */
/** @param {import('./state.js').Context} ctx @param {number} player */
export function equalizersIncome(ctx, player) {
	const bot = /** @type {any} */ (seatOf(ctx.state, player));
	const human = ctx.state.seats.find((seat) => seat.kind === 'player');
	if (!human) return;
	let card = AUTOMA_CARDS.find(
		(entry) => entry.id === bot.incomePair?.tiebreakerCard
	);
	// With no card up, a progress-deck card is sampled and left in the deck (R36).
	if (!card && bot.progressDeck?.length) {
		const id = bot.progressDeck[ctx.random(bot.progressDeck.length)];
		card = AUTOMA_CARDS.find((entry) => entry.id === id);
	}
	const valid = equalizerTracks(ctx.state, player, human.seat);
	if (valid.length > 1 && !card)
		throw new Error('Equalizers need a decision card to break this tie.');
	const track = card
		? equalizerTrack(ctx.state, player, human.seat, card.trackTiebreakers)
		: (valid[0] ?? null);
	if (!track) {
		vp(ctx, player, 5, /** @type {any} */ ({ origin: 'civ' }));
		return;
	}
	const from = spacesAdvanced(bot, track),
		to = spacesAdvanced(human, track);
	const returns =
		hasFfAutomaCivilization(bot, 'time-travelers') &&
		TRACKS[/** @type {import('./data/ids.js').TrackId} */ (track)].some(
			(space) =>
				space.space > from &&
				space.space <= to &&
				space.landmark &&
				ctx.state.landmarks.includes(space.landmark)
		);
	// Queue only the destination's benefit. moveToken adds movement and landmark
	// triggers ahead of this operation, as in the base Automa advance.
	const pair = bot.incomePair?.tiebreakerCard
		? bot.incomePair
		: card && { trackCard: card.id, tiebreakerCard: card.id };
	ctx.push([
		{ player, kind: 'botBenefit', track, space: to, pair },
		...(returns ? [{ player, kind: 'botTimeTravelReturn', track }] : []),
	]);
	moveToken(ctx, player, { track, from, to, benefit: false });
	if (bot.favouriteMarker === 'track-token' && bot.favouriteTrack === track) {
		const marker = bot.tracks[track].indexOf(from);
		if (marker !== -1) bot.tracks[track][marker] = to;
	}
}

/** @param {import('./state.js').State} state @param {number} player */
function poolFor(state, player) {
	const bot = /** @type {any} */ (seatOf(state, player));
	return (bot.huckstersPool ??= {
		space: [],
		territory: [],
		tapestry: [],
		tech: [],
		masterpiece: [],
	});
}

/** Draws a face-up pool item; ordinary deck exhaustion/reshuffling rules still apply. */
/** @param {import('./state.js').Context} ctx @param {number} player @param {HuckstersItem} kind */
export function addHuckstersItem(ctx, player, kind) {
	let item;
	if (kind === 'tapestry') item = takeTapestryCard(ctx);
	else if (kind === 'tech') item = drawTech(ctx);
	else if (kind === 'masterpiece')
		item = ctx.state.supply.masterpieces ? drawMasterpiece(ctx) : null;
	else item = drawAvailableTiles(ctx.state, kind, 1)[0];
	if (item === undefined || item === null) return null;
	poolFor(ctx.state, player)[kind].push(item);
	emit(ctx.state, { type: 'huckstersPoolAdded', player, kind, item });
	return item;
}

/** At setup, the initial space and tapestry precede the favourite-track item. */
/** @param {import('./state.js').Context} ctx @param {number} player */
export function setupHucksters(ctx, player) {
	addHuckstersItem(ctx, player, 'space');
	addHuckstersItem(ctx, player, 'tapestry');
	addHuckstersIncomeItem(ctx, player);
}

/** Adds the item corresponding to the current favourite. */
/** @param {import('./state.js').Context} ctx @param {number} player */
export function addHuckstersIncomeItem(ctx, player) {
	const favourite = /** @type {any} */ (seatOf(ctx.state, player))
		.favouriteTrack;
	/** @type {Record<string, HuckstersItem>} */
	const item = {
		exploration: 'territory',
		science: 'tapestry',
		military: 'tapestry',
		technology: 'tech',
		arts: 'masterpiece',
	};
	return item[favourite]
		? addHuckstersItem(ctx, player, item[favourite])
		: null;
}

/** Number of pool items counted as landmarks only for Automa income scoring. */
/** @param {import('./state.js').State} state @param {number} player */
export function huckstersScoreCount(state, player) {
	return Object.values(poolFor(state, player)).reduce(
		(sum, items) => sum + /** @type {any[]} */ (items).length,
		0
	);
}

/** Pool alternatives are available only to a human on their own advance turn. */
/** @param {import('./state.js').State} state @param {number} human @param {HuckstersItem} kind */
export function huckstersOffers(state, human, kind) {
	if (
		state.current !== human ||
		state.turnKind !== 'advance' ||
		seatOf(state, human).kind !== 'player'
	)
		return [];
	return state.seats
		.filter((seat) => {
			const bot = /** @type {any} */ (seat);
			return (
				seat.kind === 'automa' &&
				(bot.civilization === 'hucksters' ||
					bot.secondCivilization === 'hucksters')
			);
		})
		.flatMap((seat) =>
			/** @type {any} */ (
				/** @type {any} */ (seat).huckstersPool?.[kind] ?? []
			).map((/** @type {string | number} */ item) => ({
				player: seat.seat,
				kind,
				item,
			}))
		);
}

/** Removes an explicitly selected item; callers perform the normal gain and its triggers. */
/** @param {import('./state.js').State} state @param {number} human @param {number} owner @param {HuckstersItem} kind @param {string | number} item */
export function takeHuckstersOffer(state, human, owner, kind, item) {
	if (
		!huckstersOffers(state, human, kind).some(
			(offer) => offer.player === owner && offer.item === item
		)
	)
		return false;
	const list = poolFor(state, owner)[kind];
	list.splice(list.indexOf(item), 1);
	emit(state, {
		type: 'huckstersPoolTaken',
		player: human,
		owner,
		kind,
		item,
	});
	return true;
}
