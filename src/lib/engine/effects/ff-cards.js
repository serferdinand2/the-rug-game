// Fantasies & Futures' tapestry cards whose rules are their own effect kind (03 FF.4.3, #40).
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { shuffle } from '../random.js';
import { takeTapestryCard } from './gain.js';
import { drawTileFor } from './tile-uses.js';
import { cityPlots, completeDistricts, seatShape } from '../city.js';
import { tapestryCard } from '../data/tapestry-cards.js';
import { rollScience } from './research.js';
import { useTechBenefit } from './tech.js';
import { drawTech } from '../tech.js';
import { LAST_SPACE, moveToken, benefitOps } from '../movement.js';
import { tracksOf } from '../tracks-in-play.js';
import { techCard } from '../data/tech-cards.js';

/** @typedef {import('../data/ids.js').TrackId} TrackId */

/**
 * A seat's most advanced token on a track (Doppelgangers' rule for comparisons, 03 FF.4.3 #7; R136, R137).
 * @param {import('../state.js').Seat} seat
 * @param {TrackId} track
 * @returns {number}
 */
export function furthest(seat, track) {
	return Math.max(0, ...(seat.tracks[track] ?? [0]));
}

/**
 * Alien Disclosure: gain 1 space tile, then, with 5 VP to spend, you may pay them to explore it now (R86).
 * @type {import('../state.js').EffectHandler}
 */
export function alienDisclosure(ctx, player, value, op) {
	drawTileFor(ctx, player, 'space', 'alienDisclosure', op.source);
}

/**
 * Alien Disclosure with its tile drawn, or none left.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number | undefined} tile
 * @param {any} source
 */
export function alienDisclosureWith(ctx, player, tile, source) {
	if (tile === undefined || playerSeat(ctx.state, player).vp < 5) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				{
					trade: {
						offers: [
							{
								pay: { vp: 5 },
								gain: [{ exploreSpace: { tile } }],
							},
						],
						optional: true,
					},
				},
			],
			source,
		},
	]);
}

/**
 * Chimera-Citizen Rights: roll the science die without advancing; its face decides the gain (03 FF.4.3 #3).
 * @type {import('../state.js').EffectHandler}
 */
export function chimera(ctx, player, value, op) {
	rollScience(ctx, player, { kind: 'chimeraRolled', source: op.source });
}

/** What each face of the science die gives Chimera-Citizen Rights (03 FF.4.3 #3). */
const CHIMERA = /** @type {Record<TrackId, object[]>} */ ({
	exploration: [{ explore: {} }, { gain: { culture: 1 } }],
	military: [{ explore: {} }, { gain: { culture: 1 } }],
	science: [{ upgrade: {} }],
	technology: [{ upgrade: {} }],
	arts: [{ inspire: {} }],
});

/**
 * The gain for Chimera-Citizen Rights' rolled face.
 * @type {import('../state.js').AutomaticKind}
 */
export function chimeraRolled(ctx, op) {
	const track = /** @type {TrackId} */ (op.track);
	ctx.push([
		{
			player: op.player,
			kind: 'effects',
			effects: structuredClone(CHIMERA[track]),
			ordered: true,
			source: op.source,
		},
	]);
}

/**
 * Citadel of Power: reveal tech cards from the deck until one grants a landmark; gain that landmark, discard that card
 * and shuffle the others back (03 FF.4.3 #4). The revealed cards are seen by all.
 * @type {import('../state.js').EffectHandler}
 */
export function citadelOfPower(ctx, player, value, op) {
	const tech = ctx.state.supply.tech;
	/** @type {string[]} */
	const revealed = [];
	/** @type {string | null} */
	let found = null;
	const total = tech.deck.length + tech.discard.length;
	while (found === null && revealed.length < total) {
		const card = drawTech(ctx);
		if (card === null) {
			break;
		}
		if (techCard(card).landmark !== undefined) {
			found = card;
		} else {
			revealed.push(card);
		}
	}
	// The cards revealed go back into the deck, so the log names only the one found (R135, #40).
	emit(ctx.state, {
		type: 'techRevealed',
		player,
		count: revealed.length + (found ? 1 : 0),
		found,
	});
	tech.deck = shuffle([...tech.deck, ...revealed], ctx.random);
	if (found === null) {
		return;
	}
	tech.discard.push(found);
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				{ landmark: /** @type {string} */ (techCard(found).landmark) },
			],
			source: op.source,
		},
	]);
}

/**
 * Déjà Vu: 7 VP, or the benefit (not the bonus) of a tier-II space, 4 to 6, you have reached or passed (03 FF.4.3 #6).
 * @type {import('../state.js').EffectHandler}
 */
export function dejaVu(ctx, player, value, op) {
	const seat = seatOf(ctx.state, player);
	const options = tracksOf(ctx.state).flatMap((track) =>
		[4, 5, 6]
			.filter((space) => furthest(seat, track) >= space)
			.map((space) => ({ track, space }))
	);
	if (options.length === 0) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ vp: 7 }],
				source: op.source,
			},
		]);
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseTrackSpace',
			purpose: 'dejaVu',
			options,
			vp: 7,
			source: op.source,
		},
	]);
}

/**
 * Temporal Nomadism: go back to a space of your choice on a track you haven't completed, and gain its benefit, not its
 * bonus (03 FF.4.3 #35). The most advanced token moves.
 * @type {import('../state.js').EffectHandler}
 */
export function temporalNomadism(ctx, player) {
	const seat = seatOf(ctx.state, player);
	const options = tracksOf(ctx.state)
		.filter(
			(track) =>
				furthest(seat, track) < LAST_SPACE &&
				!seat.restartedTracks.includes(track)
		)
		.flatMap((track) =>
			Array.from(
				{ length: Math.max(0, furthest(seat, track) - 1) },
				(_, i) => ({
					track,
					space: i + 1,
				})
			)
		);
	if (options.length === 0) {
		emit(ctx.state, { type: 'noRegress', player });
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseTrackSpace',
			purpose: 'temporalNomadism',
			options,
		},
	]);
}

/**
 * Doppelgangers: a token of yours from your supply onto a track, on a space where an opponent has one; no benefit,
 * no bonus (03 FF.4.3 #7). Later it advances like any of your tokens.
 * @type {import('../state.js').EffectHandler}
 */
export function doppelgangers(ctx, player) {
	const { state } = ctx;
	const options = tracksOf(state).flatMap((track) =>
		[
			...new Set(
				state.seats
					.filter((s) => s.seat !== player)
					.flatMap((s) =>
						(s.tracks[track] ?? []).filter((space) => space > 0)
					)
			),
		]
			.sort((a, b) => a - b)
			.map((space) => ({ track, space }))
	);
	if (options.length === 0) {
		emit(state, { type: 'noDoppelganger', player });
		return;
	}
	ctx.push([
		{ player, kind: 'chooseTrackSpace', purpose: 'doppelgangers', options },
	]);
}

/**
 * How many tapestry cards Seer Sight reveals: one per completed district of the player's capital (03 FF.4.3 #30).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {number}
 */
export function seerSightReveals(state, player) {
	const seat = playerSeat(state, player);
	if (seat.capital.mat === null) {
		return 0;
	}
	return completeDistricts(cityPlots(seat), seatShape(seat)).length;
}

/**
 * Seer Sight: reveal a tapestry card from the deck per completed district, score 3 VP for each THIS ERA card among
 * them (a response card that is THIS ERA as a tapestry included), and discard them (03 FF.4.3 #30).
 * @type {import('../state.js').EffectHandler}
 */
export function seerSight(ctx, player, value, op) {
	const count = seerSightReveals(ctx.state, player);
	/** @type {string[]} */
	const cards = [];
	while (cards.length < count) {
		const card = takeTapestryCard(ctx);
		if (card === undefined) {
			break;
		}
		cards.push(card);
	}
	ctx.state.supply.tapestry.discard.push(...cards);
	emit(ctx.state, { type: 'tapestryRevealed', player, cards: [...cards] });
	const era = cards.filter(
		(card) => tapestryCard(card).timing === 'era'
	).length;
	if (era > 0) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ vp: 3 * era }],
				source: op.source,
			},
		]);
	}
}

/**
 * Resolves a track space picked for Déjà Vu (its benefit) or Temporal Nomadism (a move back there, with its benefit).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {'dejaVu' | 'temporalNomadism' | 'doppelgangers'} purpose
 * @param {{ track: TrackId, space: number }} pick
 */
export function trackSpacePicked(ctx, player, purpose, { track, space }) {
	if (purpose === 'doppelgangers') {
		seatOf(ctx.state, player).tracks[track].push(space);
		emit(ctx.state, { type: 'tokenCopied', player, track, space });
		return;
	}
	if (purpose === 'dejaVu') {
		emit(ctx.state, { type: 'benefitRepeated', player, track, space });
		ctx.push(benefitOps(ctx.state, player, track, space));
		return;
	}
	const from = furthest(seatOf(ctx.state, player), track);
	moveToken(ctx, player, {
		track,
		from,
		to: space,
		benefit: true,
		noBonus: true,
		jump: true,
	});
}

/**
 * Muses: 7 VP, or the gain of a track where your token is farther than every opponent's (03 FF.4.3 #25, Mike Young; R136).
 * @type {import('../state.js').EffectHandler}
 */
export function muses(ctx, player, value, op) {
	const { state } = ctx;
	const seat = seatOf(state, player);
	const others = state.seats.filter((s) => s.seat !== player);
	/** @type {Record<string, object[]>} */
	const GAINS = {
		exploration: [{ gain: { territory: 1 } }, { building: 'farm' }],
		science: [{ research: {} }],
		technology: [{ invent: { refresh: true, count: 2 } }],
		military: [{ gain: { culture: 1 } }, { vp: { per: 'territory' } }],
		arts: [{ create: {} }],
	};
	const ahead = tracksOf(state).filter((track) =>
		others.every((other) => furthest(seat, track) > furthest(other, track))
	);
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				{
					choice: [
						[{ vp: 7 }],
						...ahead.map((track) => GAINS[track]),
					],
				},
			],
			source: op.source,
		},
	]);
}

/**
 * Technomancy: gain the circle benefits of 2 of the 3 face-up tech cards; they stay face up (03 FF.4.3 #34).
 * @type {import('../state.js').EffectHandler}
 */
export function technomancy(ctx, player) {
	const options = [...ctx.state.supply.tech.faceUp];
	if (options.length <= 2) {
		for (const card of options.reverse()) {
			useTechBenefit(ctx, player, card, 'circle');
		}
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseTechBenefit',
			icon: 'circle',
			options,
			count: 2,
		},
	]);
}

/**
 * Uploaded Consciousness: you may discard a territory tile from your supply for 1 tapestry card and 1 resource of your
 * choice, up to 3 times, one at a time (03 FF.4.3 #36).
 * @type {import('../state.js').EffectHandler}
 */
export function uploadedConsciousness(ctx, player, value, op) {
	const left = value?.left ?? 3;
	if (
		left <= 0 ||
		playerSeat(ctx.state, player).territoryTiles.length === 0
	) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				{
					trade: {
						offers: [
							{
								pay: { territory: 1 },
								gain: [
									{ gain: { tapestry: 1, any: 1 } },
									{
										uploadedConsciousness: {
											left: left - 1,
										},
									},
								],
							},
						],
						optional: true,
					},
				},
			],
			source: op.source,
		},
	]);
}
