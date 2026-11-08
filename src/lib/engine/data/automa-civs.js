// The four base Automa civilization definitions and their income abilities (02 §9.3).
import { deepFreeze } from './ids.js';

/** @typedef {import('./ids.js').BoardTrackId} BoardTrackId */

/**
 * Base civilization income instructions; the array preserves their printed order.
 * The Conquerors' single-token count must be more than two, hence a minimum of
 * three; the toppled token belongs to Shadow Empire and uses the hex tiebreaker.
 * It is placed on one of the Automa's territories with only one token (02 §9.3).
 * Civilization VP is never multiplied by the income mat (02 §9.3, r6 note).
 * @typedef {{kind: 'advance', turns: readonly number[], track: BoardTrackId, withBenefits: true} | {kind: 'conquerIfFewerTerritoriesThanIncomeTurn', turns: readonly number[]} | {kind: 'reinforceWithToppledShadowEmpireOutpost', turns: readonly number[], minimumSingleTokenTerritories: number, tiebreaker: 'hex'} | {kind: 'scienceDieAdvance', turns: readonly number[], withBenefits: true} | {kind: 'score', turns: readonly number[], per: 'territory' | 'landmark', vp: number, multiplied: false}} AutomaCivilizationIncomeAbility
 */

/**
 * An Automa civ, separate from playable human civilizations. Selection depends
 * on the rules version (R36), not on these unchanged base definitions.
 * @typedef {Object} AutomaCivilization
 * @property {'explorers' | 'conquerors' | 'scientists' | 'engineers'} id
 * @property {string} name
 * @property {BoardTrackId} favouriteTrack
 * @property {readonly AutomaCivilizationIncomeAbility[]} incomeAbilities
 */

/** @type {readonly AutomaCivilization[]} */
export const AUTOMA_CIVS = deepFreeze([
	{
		id: 'explorers',
		name: 'Explorers',
		favouriteTrack: 'exploration',
		incomeAbilities: [
			{
				kind: 'advance',
				turns: [2, 4],
				track: 'exploration',
				withBenefits: true,
			},
			{
				kind: 'advance',
				turns: [3, 5],
				track: 'military',
				withBenefits: true,
			},
		],
	},
	{
		id: 'conquerors',
		name: 'Conquerors',
		favouriteTrack: 'military',
		incomeAbilities: [
			{
				kind: 'conquerIfFewerTerritoriesThanIncomeTurn',
				turns: [2, 3, 4, 5],
			},
			{
				kind: 'reinforceWithToppledShadowEmpireOutpost',
				turns: [2, 3, 4, 5],
				minimumSingleTokenTerritories: 3,
				tiebreaker: 'hex',
			},
			{
				kind: 'score',
				turns: [2, 3, 4, 5],
				per: 'territory',
				vp: 1,
				multiplied: false,
			},
		],
	},
	{
		id: 'scientists',
		name: 'Scientists',
		favouriteTrack: 'science',
		incomeAbilities: [
			{ kind: 'scienceDieAdvance', turns: [3, 4, 5], withBenefits: true },
		],
	},
	{
		id: 'engineers',
		name: 'Engineers',
		favouriteTrack: 'technology',
		incomeAbilities: [
			{
				kind: 'score',
				turns: [2, 3, 4, 5],
				per: 'landmark',
				vp: 1,
				multiplied: false,
			},
		],
	},
]);
