// The Utilitarians (03 §1.3, §1.8): their 2 tokens switch on the abilities of the listed landmarks they own, 2 at most; whoever starts with them first gains a tier II track landmark, with a token beside it.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { triggered } from '../abilities.js';
import { askSlot } from '../decisions/choose-slot.js';
import { canPay } from '../payment.js';
import { landmarksOwned } from '../effects/vp.js';
import { LANDMARKS } from '../data/landmarks.js';
import { RED_DIE } from '../data/dice.js';
import { deepFreeze } from '../data/ids.js';

/** @typedef {import('../state.js').Context} Context */
/** @typedef {import('../state.js').State} State */
/** @typedef {import('../state.js').NewOperation} NewOperation */

/**
 * The Utilitarians' own state.
 * @typedef {Object} UtilitariansData
 * @property {string[]} active - The listed landmarks with a token beside them, in the order placed; the other tokens
 *   wait on the mat
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

/** The tier III landmarks: each one's ability rewards advancing on its own track from its space on (03 §1.3). */
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

/** @type {import('./civ.js').Civ} */
export const utilitarians = {
	id: 'utilitarians',
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
		// The Barracks: the red die's result again, whichever die they keep, so twice with both dice (03 §1.3).
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
		// The Lighthouse: offered as each advance turn starts, before the advance (03 §1.8 allows either; my call).
		advanceTurnStarted: (state, owner, { player }) =>
			owner === player &&
			isOn(state, owner, 'lighthouse') &&
			canPay(state, owner, LIGHTHOUSE_TRADE.pay)
				? [
						{
							player: owner,
							kind: 'effects',
							effects: [
								{
									trade: {
										offers: [
											structuredClone(LIGHTHOUSE_TRADE),
										],
										optional: true,
										purpose: 'lighthouse',
									},
								},
							],
						},
					]
				: [],
		// Rubber Works, Tank Factory, Train Station and Academy: an advance into tier III or IV of their own track.
		advanced(state, owner, { player, track, to }) {
			if (owner !== player) {
				return [];
			}
			return TIER_THREE.filter(
				({ id, track: own, space }) =>
					own === track && to >= space && isOn(state, owner, id)
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
