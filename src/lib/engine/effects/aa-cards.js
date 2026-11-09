// Arts & Architecture's tapestry cards whose rules are their own effect kind (#37; 03 §2.5): Political Posturing, Spymaster played as a tapestry card, Age of Enlightenment and Silk Road.
import { triggered } from '../abilities.js';
import { playerSeat } from '../state.js';
import { askSlot } from '../decisions/choose-slot.js';
import { claimAchievement } from '../achievements.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { drawTapestry } from './gain.js';
import { rollScience } from './research.js';
import { advanceBlocked } from '../abilities.js';
import {
	LAST_SPACE,
	TIER_FIRST_SPACES,
	activationOps,
	movableFroms,
	moveToken,
} from '../movement.js';
import { emit } from '../events.js';
import { ARTS_TRACK } from '../data/ids.js';
import { TRACKS } from '../data/tracks.js';

/**
 * Political Posturing: a token on the highest open box of an achievement the player hasn't earned, and its VP; they
 * now hold it (03 §2.12). One achievement is taken without asking; with none open, nothing happens.
 * @type {import('../state.js').EffectHandler}
 */
export function politicalPosturing(ctx, player) {
	const { state } = ctx;
	const options = ACHIEVEMENTS.filter(
		({ id, vp }) =>
			!state.achievements[id].includes(player) &&
			state.achievements[id].length < vp[state.map].length
	).map(({ id }) => id);
	askSlot(ctx, player, {
		options,
		purpose: 'politicalPosturing',
		then: { kind: 'politicalPostured' },
	});
}

/**
 * Claims the achievement Political Posturing chose.
 * @type {import('../state.js').AutomaticKind}
 */
export function politicalPostured(ctx, op) {
	claimAchievement(ctx, /** @type {number} */ (op.player), op.slot);
}

/**
 * Spymaster played as a tapestry card, after its 5 VP: draw 1 tapestry card, which the player may play at once on
 * top of this card (03 §2.5). With no card behind the ability (a Heralds copy), the card stays in the hand.
 * @type {import('../state.js').EffectHandler}
 */
export function spymaster(ctx, player, value, op) {
	const cards = drawTapestry(ctx, player, 1);
	if (cards.length === 0) {
		return;
	}
	const slots = playerSeat(ctx.state, player).incomeMat.tapestry;
	const card = op?.source?.card;
	const era = slots.findIndex((slot) => card && slot.at(-1) === card) + 1;
	ctx.push([
		...triggered(ctx.state, 'tapestryGained', { player, cards }),
		...(era > 0
			? [
					{
						player,
						kind: 'chooseTapestry',
						options: [...cards],
						era,
						optional: true,
					},
				]
			: []),
	]);
}

/**
 * Age of Enlightenment: roll the table's science die (R6, #35), then advance once or twice on the rolled track (my
 * call: it always advances), and gain only the final space's benefit (03 §2.5).
 * @type {import('../state.js').EffectHandler}
 */
export function ageOfEnlightenment(ctx, player) {
	rollScience(ctx, player, { kind: 'enlightenmentRolled' });
}

/**
 * How far Age of Enlightenment advances on the rolled track: twice while a token there is 2 or more spaces from the
 * end, else once; nothing on a track the player can't advance on.
 * @type {import('../state.js').AutomaticKind}
 */
export function enlightenmentRolled(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const track = op.track;
	if (advanceBlocked(ctx.state, player, track)) {
		return;
	}
	const froms = movableFroms(playerSeat(ctx.state, player), track, 'advance');
	if (froms.length === 0) {
		return;
	}
	const most = froms.some((from) => from < LAST_SPACE - 1) ? 2 : 1;
	askSlot(ctx, player, {
		options: most === 2 ? [1, 2] : [1],
		purpose: 'enlightenment',
		then: { kind: 'enlightenmentMoves', track },
	});
}

/**
 * Age of Enlightenment's advances, without benefits, then the final space's benefit without its bonus.
 * @type {import('../state.js').AutomaticKind}
 */
export function enlightenmentMoves(ctx, op) {
	const track = op.track;
	const advance = { advance: { tracks: [track], noBenefit: true } };
	ctx.push([
		{
			player: op.player,
			kind: 'effects',
			effects: [
				...Array.from({ length: op.slot }, () =>
					structuredClone(advance)
				),
				{ repeat: { track, noBonus: true } },
			],
		},
	]);
}

/**
 * Silk Road: straight to the first space of the arts track's next tier (R128: from the start, tier I's space 1), then
 * that space's benefit, and its bonus may be paid, or its landmark while nobody has it (03 §2.5). It is an advance, so
 * what answers advancing does (Artistic Inspiration, S.T.E.A.M.), but it passes no landmark. From tier IV, nothing.
 * @type {import('../state.js').EffectHandler}
 */
export function silkRoad(ctx, player) {
	const { state } = ctx;
	if (advanceBlocked(state, player, ARTS_TRACK)) {
		return;
	}
	const from = Math.max(
		...movableFroms(playerSeat(state, player), ARTS_TRACK, 'advance'),
		-1
	);
	const to = [1, ...TIER_FIRST_SPACES].find((first) => first > from);
	if (from === -1 || to === undefined) {
		return;
	}
	moveToken(ctx, player, {
		track: ARTS_TRACK,
		from,
		to,
		benefit: false,
		jump: true,
	});
	const landmark = TRACKS[ARTS_TRACK][to].landmark;
	ctx.push([
		...triggered(state, 'advanced', {
			player,
			track: ARTS_TRACK,
			from,
			to,
			claimedPassed: 0,
		}),
		...(landmark && state.landmarks.includes(landmark)
			? [
					{
						player,
						kind: 'chooseSlot',
						options: ['benefit', 'landmark'],
						optional: false,
						purpose: 'silkRoad',
						then: { kind: 'silkRoadGain', space: to },
					},
				]
			: activationOps(ctx, player, ARTS_TRACK, to)),
	]);
}

/**
 * Silk Road's choice: the space's benefit and bonus, or its landmark, gained and placed as a track's.
 * @type {import('../state.js').AutomaticKind}
 */
export function silkRoadGain(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	if (op.slot === 'benefit') {
		ctx.push(activationOps(ctx, player, ARTS_TRACK, op.space));
		return;
	}
	const landmark = /** @type {string} */ (
		TRACKS[ARTS_TRACK][op.space].landmark
	);
	state.landmarks.splice(state.landmarks.indexOf(landmark), 1);
	emit(state, {
		type: 'landmarkGained',
		player,
		landmark,
		track: ARTS_TRACK,
	});
	ctx.push([
		{ player, kind: 'placeLandmark', landmark },
		...triggered(state, 'landmarkGained', {
			player,
			landmark,
			fromTrack: true,
		}),
	]);
}
