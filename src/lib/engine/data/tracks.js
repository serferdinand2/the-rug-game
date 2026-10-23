// The four advancement tracks: every space's benefit, bonus and landmark, the tier costs and each track's resource (01 §1.2, §3).
import { deepFreeze } from './ids.js';

/** @typedef {import('./ids.js').TrackId} TrackId */
/** @typedef {import('./ids.js').ResourceId} ResourceId */
/** @typedef {import('./ids.js').BuildingId} BuildingId */
/** @typedef {import('./effects.js').Effect} Effect */
/** @typedef {import('./effects.js').Bonus} Bonus */
/** @typedef {import('./effects.js').Cost} Cost */

/**
 * One space of a track. Index 0 of a track is its start; indexes 1–12 are the spaces.
 * @typedef {Object} TrackSpace
 * @property {string} id - The name as a slug, such as 'navigation'
 * @property {number} space - 0 (the start) to 12
 * @property {string} name - As printed, such as 'Navigation'
 * @property {number} tier - 1–4, three spaces each; 0 for the start
 * @property {Effect[]} benefit - Mandatory. Its parts are taken in any order (01 §3.1, step 4), unless `ordered`
 * @property {boolean} ordered - The parts resolve in the order listed, because the reference prints "then"
 * @property {Bonus | null} bonus - The optional extra, paid for at most once
 * @property {string | null} landmark - The slug of the landmark the first player into this tier gains, on spaces 4, 7 and 10
 */

/**
 * A tier's price: `track` is the track's own resource, `any` is resources of the player's choice.
 * @typedef {Object} TierCost
 * @property {number} [track]
 * @property {number} [any]
 */

/**
 * The extra parts of a space, where it has them.
 * @typedef {Object} SpaceExtras
 * @property {boolean} [ordered]
 * @property {Bonus} [bonus]
 * @property {string} [landmark]
 */

/** Each track's resource, used in its tier costs (01 §1.2). @type {Readonly<Record<TrackId, ResourceId>>} */
export const TRACK_RESOURCE = deepFreeze({
	exploration: 'food',
	science: 'worker',
	technology: 'coin',
	military: 'culture',
});

/** The income building that matches each track (01 §1.2). @type {Readonly<Record<TrackId, BuildingId>>} */
export const TRACK_BUILDING = deepFreeze({
	exploration: 'farm',
	science: 'house',
	technology: 'market',
	military: 'armory',
});

/** The price of advancing into each tier, the same on every track apart from its resource (01 §3.1). @type {Readonly<Record<1 | 2 | 3 | 4, TierCost>>} */
export const TIER_COSTS = deepFreeze({
	1: { any: 1 },
	2: { track: 1, any: 1 },
	3: { track: 1, any: 2 },
	4: { track: 2 },
});

/**
 * A space without its number and tier, which its place on the track sets.
 * @param {string} name
 * @param {Effect[]} benefit
 * @param {SpaceExtras} [extras]
 * @returns {Omit<TrackSpace, 'space' | 'tier'>}
 */
function space(name, benefit, extras = {}) {
	return {
		id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
		name,
		benefit,
		ordered: extras.ordered ?? false,
		bonus: extras.bonus ?? null,
		landmark: extras.landmark ?? null,
	};
}

/**
 * The bonus most spaces have: pay 1 resource of your choice (01 §3.6).
 * @param {Effect[]} gain
 * @returns {Bonus}
 */
function payAny(gain) {
	return { pay: { any: 1 }, gain };
}

/**
 * A whole track: its start, then the 12 spaces numbered and tiered in threes.
 * @param {Omit<TrackSpace, 'space' | 'tier'>[]} spaces
 * @returns {TrackSpace[]}
 */
function track(spaces) {
	return [
		{ ...space('Start', []), space: 0, tier: 0 },
		...spaces.map((entry, index) => ({
			...entry,
			space: index + 1,
			tier: Math.ceil((index + 1) / 3),
		})),
	];
}

const ALL_BUT_SCIENCE = /** @type {TrackId[]} */ ([
	'exploration',
	'technology',
	'military',
]);

/**
 * Every track space, by track and space number: `TRACKS.exploration[4]` is Navigation.
 * Names and benefits come from the F&F Track Reference, checked against the board (01 §3.2–3.5).
 * @type {Readonly<Record<TrackId, readonly TrackSpace[]>>}
 */
export const TRACKS = deepFreeze({
	exploration: track([
		space('Scouting', [{ gain: { territory: 2 } }]),
		space('Rafts', [{ explore: {} }], {
			bonus: payAny([{ gain: { tapestry: 1 } }]),
		}),
		space('Wagons', [
			{ choice: [[{ explore: {} }], [{ building: 'farm' }]] },
		]),
		space('Navigation', [{ gain: { territory: 1 } }, { explore: {} }], {
			ordered: true,
			landmark: 'lighthouse',
		}),
		space('Ships', [{ vp: { per: 'territory' } }], {
			bonus: payAny([{ building: 'farm' }]),
		}),
		space('Tunnels', [{ gain: { territory: 1 } }, { building: 'farm' }], {
			bonus: payAny([{ explore: {} }]),
		}),
		space('Trains', [{ gain: { territory: 2 } }, { explore: {} }], {
			ordered: true,
			landmark: 'train-station',
		}),
		space('Cars', [{ building: 'farm' }, { vp: { per: 'farm' } }], {
			ordered: true,
			bonus: { pay: { territory: 2 }, gain: [{ vp: 5 }] },
		}),
		space(
			'Airplanes',
			[{ gain: { territory: 2 } }, { explore: { anywhere: true } }],
			{ ordered: true, bonus: payAny([{ gain: { tapestry: 1 } }]) }
		),
		space(
			'Space Shuttle',
			[{ vp: { per: 'trackSpace', track: 'technology' } }],
			{
				landmark: 'launch-pad',
				bonus: { pay: { territory: 3 }, gain: [{ vp: 10 }] },
			}
		),
		// Explored space tiles go next to the income mat.
		space(
			'Interstellar Travel',
			[{ gain: { space: 3 } }, { exploreSpace: {} }],
			{
				ordered: true,
			}
		),
		space('Warpgates', [{ exploreSpace: {} }], {
			bonus: payAny([{ exploreSpace: {} }]),
		}),
	]),
	science: track([
		space('Astronomy', [{ research: { noBenefit: true } }]),
		space('Mathematics', [{ gain: { tapestry: 1 } }], {
			bonus: payAny([{ building: 'house' }]),
		}),
		space('Herbalism', [
			{
				choice: [
					[{ research: { noBenefit: true } }],
					[{ building: 'house' }],
				],
			},
		]),
		space(
			'Medicine',
			[{ vp: { per: 'techCard' } }, { gain: { tapestry: 1 } }],
			{
				landmark: 'apothecary',
			}
		),
		space('Chemistry', [{ research: {} }], {
			bonus: { pay: { tapestry: 2 }, gain: [{ vp: 5 }] },
		}),
		space('Biology', [
			{ choice: [[{ research: {} }], [{ building: 'house' }]] },
		]),
		space('Academic Research', [{ repeat: {} }], { landmark: 'academy' }),
		space('Nutrition', [{ building: 'house' }, { vp: { per: 'house' } }], {
			ordered: true,
		}),
		space('Physics', [{ advance: { tracks: ALL_BUT_SCIENCE } }]),
		// The board shows technology and military only, not exploration (01 §3.3).
		space(
			'Neuroscience',
			[{ regress: { tracks: ['technology', 'military'] } }],
			{ landmark: 'laboratory' }
		),
		// The second advance may use the same track or another one.
		space(
			'Quantum Physics',
			[
				{ advance: { tracks: ALL_BUT_SCIENCE } },
				{ advance: { tracks: ALL_BUT_SCIENCE } },
			],
			{ ordered: true }
		),
		space('Alien Biology', [
			{ research: { noBenefit: true, rolls: 4, offTrackVp: 5 } },
		]),
	]),
	technology: track([
		space('Pottery', [{ invent: {} }]),
		space('Carpentry', [{ gain: { tapestry: 1 } }], {
			bonus: payAny([{ building: 'market' }]),
		}),
		space('Stone Tools', [
			{ choice: [[{ invent: {} }], [{ building: 'market' }]] },
		]),
		space('Metallurgy', [{ invent: { refresh: true } }], {
			landmark: 'forge',
		}),
		space(
			'Glass',
			[
				{
					choice: [
						[{ building: 'farm' }],
						[{ building: 'house' }],
						[{ building: 'armory' }],
					],
				},
			],
			{ bonus: payAny([{ upgrade: {} }]) }
		),
		space('Steel', [{ vp: { per: 'armory' } }, { building: 'market' }], {
			bonus: payAny([{ invent: {} }]),
		}),
		space('Rubber', [{ invent: { refresh: true, count: 2 } }], {
			landmark: 'rubber-works',
		}),
		space('Plastic', [{ building: 'market' }, { vp: { per: 'market' } }], {
			ordered: true,
			bonus: payAny([{ upgrade: {} }]),
		}),
		// The reference says "in any order"; the circle may be the card just upgraded (01 §12 #8).
		space('Electronics', [
			{ upgrade: {} },
			{ techBenefit: { icon: 'circle' } },
		]),
		space(
			'Computers',
			[
				{ vp: { per: 'trackSpace', track: 'military' } },
				{ vp: { per: 'trackSpace', track: 'science' } },
			],
			{ landmark: 'tech-hub' }
		),
		// The neoprene board's bonus discards 2 tech cards. That is an optional variant, not modelled here (01 §12 #11).
		space(
			'Nanotechnology',
			[{ upgrade: {} }, { techBenefit: { icon: 'square' } }],
			{ bonus: { pay: { tech: 3 }, gain: [{ vp: 10 }] } }
		),
		space('AI Singularity', [
			{ gain: { coin: 1, worker: 1, food: 1, culture: 1 } },
			{ restartToken: {} },
		]),
	]),
	military: track([
		space('Archery', [{ conquer: {} }]),
		space('Bladed Weapons', [{ gain: { tapestry: 1 } }], {
			bonus: payAny([{ building: 'armory' }]),
		}),
		space('Walls', [
			{ choice: [[{ conquer: {} }], [{ building: 'armory' }]] },
		]),
		space(
			'Standing Army',
			[{ gain: { worker: 1 } }, { vp: { per: 'territoryTile' } }],
			{ landmark: 'barracks' }
		),
		space('Cavalry', [{ conquer: {} }, { building: 'armory' }]),
		space('Gunpowder', [{ conquer: {} }, { gain: { tapestry: 1 } }], {
			bonus: payAny([{ building: 'armory' }]),
		}),
		// R17: both dice when an opponent controlled the territory, even if the conquest is trapped.
		space('Tanks', [{ conquer: { bothDice: 'ifOpponent' } }], {
			landmark: 'tank-factory',
		}),
		space('Warplanes', [{ conquer: { anywhere: true } }], {
			bonus: payAny([{ gain: { tapestry: 1 } }]),
		}),
		space('Anti-Aircraft Defense', [
			{ building: 'armory' },
			{ vp: { per: 'tapestryCard' } },
		]),
		space(
			'Nuclear Bomb',
			[
				{ vp: { per: 'trackSpace', track: 'exploration' } },
				{ tapestryOnTop: {} },
			],
			{ landmark: 'fusion-reactor' }
		),
		space('Drone Assassins', [{ scoreCapital: {} }], {
			bonus: { pay: { tapestry: 3 }, gain: [{ vp: 10 }] },
		}),
		// The extra civilization goes to the left of the current civ mat.
		space('Mechs', [{ conquer: { bothDice: 'always' } }, { gainCiv: {} }]),
	]),
});

/**
 * Returns the cost of advancing into a track space: the price of its tier, in the track's resource.
 * @param {TrackId} track - The track being advanced on.
 * @param {number} space - The space being entered, 1–12.
 * @returns {Cost} The resources to pay.
 */
export function advanceCost(track, space) {
	if (!Number.isInteger(space) || space < 1 || space > 12) {
		throw new RangeError(`track spaces run from 1 to 12, not ${space}`);
	}
	const tier = /** @type {1 | 2 | 3 | 4} */ (Math.ceil(space / 3));
	const { track: own = 0, any = 0 } = TIER_COSTS[tier];
	/** @type {Cost} */
	const cost = {};
	if (own) {
		cost[TRACK_RESOURCE[track]] = own;
	}
	if (any) {
		cost.any = any;
	}
	return cost;
}
