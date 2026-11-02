// The Utilitarians (03 §1.3, §1.8): their 2 tokens switch on the abilities of the listed landmarks they own, 2 at most; whoever starts with them first gains a tier II track landmark, with a token beside it.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { triggered } from '../abilities.js';
import { askSlot } from '../decisions/choose-slot.js';
import { canPay } from '../payment.js';
import { landmarksOwned } from '../effects/vp.js';
import { LANDMARKS } from '../data/landmarks.js';
import { RED_DIE } from '../data/dice.js';
import { RESOURCE_IDS, deepFreeze } from '../data/ids.js';
import { tierOf } from '../data/tracks.js';
import { RESOURCE_CAP } from '../effects/gain.js';

/** @typedef {import('../state.js').Context} Context */
/** @typedef {import('../state.js').State} State */
/** @typedef {import('../state.js').NewOperation} NewOperation */
/** @typedef {import('./civ.js').Affordable} Affordable */

/**
 * The Utilitarians' own state.
 * @typedef {Object} UtilitariansData
 * @property {string[]} active - The listed landmarks with a token beside them, in the order placed; the other tokens
 *   wait on the mat
 * @property {number} [lighthouseTurn] - The turn (`state.turn`) they last used the Lighthouse: once each advance turn
 */

/**
 * Where a token comes from to switch on a landmark just gained: the mat, or the listed landmark it leaves.
 * @typedef {{ landmark: string, from: 'mat' | string }} TokenMove
 */

/** Their tokens: at most this many abilities are on at once (03 §1.3). */
export const UTILITARIANS_TOKENS = 2;

/**
 * The landmarks the mat lists, in its order: the 4 tier II track landmarks, then the 4 tier III ones (03 §1.3).
 * @type {readonly string[]}
 */
export const UTILITARIANS_LANDMARKS = Object.freeze([
	'forge',
	'barracks',
	'lighthouse',
	'apothecary',
	'rubber-works',
	'tank-factory',
	'train-station',
	'academy',
]);

/** The VP of a tier III landmark's ability, for each advance into tier III or IV of its track (03 §1.3). */
export const UTILITARIANS_ADVANCE_VP = 4;

/**
 * The Lighthouse's trade: 2 territory tiles for any 1 resource (03 §1.3).
 * @type {{ pay: import('../data/effects.js').Cost, gain: import('../data/effects.js').Effect[] }}
 */
export const LIGHTHOUSE_TRADE = deepFreeze({
	pay: { territory: 2 },
	gain: [{ gain: { any: 1 } }],
});

/** Each listed landmark's place on the tracks, from the landmark data. */
const SOURCES = UTILITARIANS_LANDMARKS.map((id) => {
	const { source } = /** @type {import('../data/landmarks.js').Landmark} */ (
		LANDMARKS.find((landmark) => landmark.id === id)
	);
	return {
		id,
		.../** @type {{ track: import('../data/ids.js').TrackId, tier: number, space: number }} */ (
			source
		),
	};
});

/** The tier III landmarks: each one's ability rewards advancing into tier III or IV of its own track (03 §1.3). */
const TIER_THREE = SOURCES.filter(({ tier }) => tier === 3);

/**
 * The Utilitarians' state of a player, if they hold them and are set up.
 * @param {State} state
 * @param {number} player
 * @returns {UtilitariansData | undefined}
 */
function dataOf(state, player) {
	return playerSeat(state, player).civData.utilitarians;
}

/**
 * Whether a listed landmark's ability is on for a player: a token is beside it.
 * @param {State} state
 * @param {number} player
 * @param {string} landmark
 */
function isOn(state, player, landmark) {
	return dataOf(state, player)?.active.includes(landmark) === true;
}

/**
 * An operation gaining any 1 resource, which the Forge and the Apothecary give.
 * @param {number} player
 * @returns {NewOperation}
 */
function gainAny(player) {
	return { player, kind: 'effects', effects: [{ gain: { any: 1 } }] };
}

/**
 * Whether they may use the Lighthouse now: its token out, 2 territory tiles to pay with, and not used this turn.
 * @param {State} state
 * @param {number} player
 */
function lighthouseReady(state, player) {
	const data = dataOf(state, player);
	return (
		data !== undefined &&
		data.active.includes('lighthouse') &&
		data.lighthouseTurn !== state.turn &&
		canPay(state, player, LIGHTHOUSE_TRADE.pay)
	);
}

/**
 * The resources one more of which would make an advance affordable, those already at the cap left out.
 * @param {State} state
 * @param {number} player
 * @param {Affordable} affordable
 * @returns {import('../data/ids.js').ResourceId[]}
 */
function opening(state, player, affordable) {
	const { resources } = playerSeat(state, player);
	return RESOURCE_IDS.filter(
		(id) =>
			resources[id] < RESOURCE_CAP &&
			affordable({ ...resources, [id]: resources[id] + 1 })
	);
}

/**
 * The Lighthouse's trade: optional, for any 1 resource; or, when only its resource makes the turn's advance
 * affordable, mandatory and for one of the resources in `only`, so the advance always has an answer. Made, it is
 * marked used for the turn.
 * @param {number} player
 * @param {import('../data/ids.js').ResourceId[] | null} only
 * @returns {NewOperation}
 */
function lighthouseOp(player, only) {
	const offers =
		only === null
			? [structuredClone(LIGHTHOUSE_TRADE)]
			: only.map((id) => ({
					pay: structuredClone(LIGHTHOUSE_TRADE.pay),
					gain: [{ gain: { [id]: 1 } }],
				}));
	return {
		player,
		kind: 'effects',
		effects: [
			{
				trade: {
					offers,
					optional: only === null,
					purpose: 'lighthouse',
					then: { kind: 'utilitariansLighthouseUsed' },
				},
			},
		],
	};
}

/**
 * A token switches on a landmark's ability: from the mat, or moved from the listed landmark it leaves.
 * @param {Context} ctx
 * @param {number} player
 * @param {TokenMove} move
 */
function activate(ctx, player, { landmark, from }) {
	const data = /** @type {UtilitariansData} */ (dataOf(ctx.state, player));
	if (from === 'mat') {
		data.active.push(landmark);
	} else {
		data.active[data.active.indexOf(from)] = landmark;
	}
	emit(ctx.state, {
		type: 'utilitariansToken',
		player,
		landmark,
		...(from !== 'mat' && { from }),
	});
}

/**
 * Gained mid-game: they may put a token from the mat beside a listed landmark they own that has none, while one is
 * left on the mat; each placed asks again (03 §1.3).
 * @param {Context} ctx
 * @param {number} player
 */
function askPlace(ctx, player) {
	const { state } = ctx;
	const { active } = /** @type {UtilitariansData} */ (dataOf(state, player));
	if (active.length >= UTILITARIANS_TOKENS) {
		return;
	}
	const owned = landmarksOwned(state, player);
	askSlot(ctx, player, {
		options: UTILITARIANS_LANDMARKS.filter(
			(id) => owned.includes(id) && !active.includes(id)
		),
		optional: true,
		purpose: 'utilitariansPlace',
		then: { kind: 'utilitariansPlace' },
	});
}

/**
 * The setup of whoever starts with them: the tier II landmark chosen (`slot`) is gained, not from a track, and its
 * token goes beside it before its triggers, so its own gain neither offers a token nor counts as another landmark for
 * the Apothecary. With it gone meanwhile, nothing is gained and both tokens stay on the mat.
 * @type {import('../state.js').AutomaticKind}
 */
export function utilitariansStart(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	/** @type {string} */
	const landmark = op.slot;
	const at = state.landmarks.indexOf(landmark);
	if (at === -1) {
		emit(state, { type: 'noLandmarkLeft', player, landmark });
		return;
	}
	state.landmarks.splice(at, 1);
	emit(state, {
		type: 'landmarkGained',
		player,
		landmark,
		civ: 'utilitarians',
	});
	activate(ctx, player, { landmark, from: 'mat' });
	ctx.push([
		{ player, kind: 'placeLandmark', landmark },
		...triggered(state, 'landmarkGained', {
			player,
			landmark,
			fromTrack: false,
		}),
	]);
}

/**
 * Gained mid-game, a token from the mat goes beside the landmark chosen (`slot`); then they may place another.
 * @type {import('../state.js').AutomaticKind}
 */
export function utilitariansPlace(ctx, op) {
	const player = /** @type {number} */ (op.player);
	activate(ctx, player, { landmark: op.slot, from: 'mat' });
	askPlace(ctx, player);
}

/**
 * After gaining a listed landmark, they may switch on its ability: with a token left on the mat they may put it
 * there; with both out they may move one from another landmark (03 §1.3). Moving one with a token still on the mat
 * would only switch an ability off, so it isn't offered (my call).
 * @type {import('../state.js').AutomaticKind}
 */
export function utilitariansOffer(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {string} */
	const landmark = op.landmark;
	const { active } = /** @type {UtilitariansData} */ (
		dataOf(ctx.state, player)
	);
	/** @type {TokenMove[]} */
	const moves =
		active.length < UTILITARIANS_TOKENS
			? [{ landmark, from: 'mat' }]
			: active.map((from) => ({ landmark, from }));
	askSlot(ctx, player, {
		options: moves,
		optional: true,
		purpose: 'utilitariansToken',
		then: { kind: 'utilitariansToken' },
	});
}

/**
 * The token placed or moved beside the landmark just gained (`slot`, a TokenMove).
 * @type {import('../state.js').AutomaticKind}
 */
export function utilitariansToken(ctx, op) {
	activate(ctx, /** @type {number} */ (op.player), op.slot);
}

/**
 * After an advance turn's advance and all it gave: the Lighthouse, if they didn't use it as the turn started, so a tile
 * the advance gave can be spent (03 §1.3, §1.8).
 * @type {import('../state.js').AutomaticKind}
 */
export function utilitariansLighthouse(ctx, op) {
	const player = /** @type {number} */ (op.player);
	if (lighthouseReady(ctx.state, player)) {
		ctx.push([lighthouseOp(player, null)]);
	}
}

/**
 * The Lighthouse's trade was made: it is used for this turn.
 * @type {import('../state.js').AutomaticKind}
 */
export function utilitariansLighthouseUsed(ctx, op) {
	const data = /** @type {UtilitariansData} */ (
		dataOf(ctx.state, /** @type {number} */ (op.player))
	);
	data.lighthouseTurn = ctx.state.turn;
}

/** @type {import('./civ.js').Civ} */
export const utilitarians = {
	id: 'utilitarians',
	// The Lighthouse's resource may open an advance turn that nothing else can pay for (#33 ruling).
	opensAdvance: (state, player, affordable) =>
		lighthouseReady(state, player) &&
		opening(state, player, affordable).length > 0,
	// The tier II landmark only for whoever starts with them; gained later, tokens for landmarks owned (R113).
	setup(ctx, player, midGame) {
		const { state } = ctx;
		playerSeat(state, player).civData.utilitarians =
			/** @type {UtilitariansData} */ ({ active: [] });
		if (midGame) {
			askPlace(ctx, player);
			return;
		}
		askSlot(ctx, player, {
			options: SOURCES.filter(
				({ id, tier }) => tier === 2 && state.landmarks.includes(id)
			).map(({ id }) => id),
			purpose: 'utilitariansLandmark',
			then: { kind: 'utilitariansStart' },
		});
	},
	hooks: {
		// The Apothecary pays for any other landmark; a listed one also offers a token, unless a finished owner would be asked.
		// Nothing before they are set up: gained mid-game, the setup comes first.
		landmarkGained(state, owner, { player, landmark }) {
			const data = dataOf(state, owner);
			if (owner !== player || !data) {
				return [];
			}
			/** @type {NewOperation[]} */
			const ops = [];
			if (
				landmark !== 'apothecary' &&
				data.active.includes('apothecary')
			) {
				ops.push(gainAny(owner));
			}
			if (
				UTILITARIANS_LANDMARKS.includes(landmark) &&
				!data.active.includes(landmark) &&
				!seatOf(state, owner).finished
			) {
				ops.push({
					player: owner,
					kind: 'utilitariansOffer',
					landmark,
				});
			}
			return ops;
		},
		// The Forge: their own upgrade to the top row; an Inventors token's isn't theirs (as Golden Age, #20 design §7).
		upgraded: (state, owner, { player, icon, inventors }) =>
			owner === player &&
			icon === 'square' &&
			inventors === undefined &&
			isOn(state, owner, 'forge')
				? [gainAny(owner)]
				: [],
		// The Barracks: the red die's result again, whichever die they keep, so twice with both dice (03 §1.3), and after
		// a trap too, as the dice always roll (R107).
		conquerRolled: (state, owner, { player, red }) =>
			owner === player && isOn(state, owner, 'barracks')
				? [
						{
							player: owner,
							kind: 'effects',
							effects: [structuredClone(RED_DIE[red])],
						},
					]
				: [],
		// The Lighthouse, once each advance turn, before or after the advance (03 §1.8): offered as the turn starts; and when
		// only its resource pays for an advance, the turn starts with it, for such a resource (#33 ruling).
		advanceTurnStarted(state, owner, { player, affordable }) {
			if (owner !== player || !lighthouseReady(state, owner)) {
				return [];
			}
			if (affordable(playerSeat(state, owner).resources)) {
				return [lighthouseOp(owner, null)];
			}
			const only = opening(state, owner, affordable);
			return only.length > 0 ? [lighthouseOp(owner, only)] : [];
		},
		// Unused as the turn started, the Lighthouse is offered again after the advance, judged then.
		afterAdvance: (state, owner, { player }) =>
			owner === player && dataOf(state, owner)
				? [{ player: owner, kind: 'utilitariansLighthouse' }]
				: [],
		// Rubber Works, Tank Factory, Train Station and Academy: an advance into tier III or IV of their own track.
		advanced(state, owner, { player, track, to }) {
			if (owner !== player) {
				return [];
			}
			return TIER_THREE.filter(
				({ id, track: own }) =>
					own === track && tierOf(to) >= 3 && isOn(state, owner, id)
			).map(() => ({
				player: owner,
				kind: 'effects',
				effects: [{ vp: UTILITARIANS_ADVANCE_VP }],
			}));
		},
	},
	// The current rules: lose any 1 resource at the end of income turn 1 (03 FF.8.3, R34).
	adjustment: {
		firstTurnEnd(ctx, player) {
			ctx.push([
				{ player, kind: 'effects', effects: [{ lose: { any: 1 } }] },
			]);
		},
	},
};
