// The 22 base Automa decision cards and the shared 12-card Shadow Empire pool (02 §9.1, §9.4; R59).
import { deepFreeze } from './ids.js';

/** @typedef {import('./ids.js').BoardTrackId} BoardTrackId */
/** ALL excludes finished tracks; LMK seeks the nearest unclaimed landmark or track end; END seeks the nearest track end (02 §9.4). @typedef {'ALL' | 'LMK' | 'END'} AutomaTrackIndicator */
/** The heart means the acting bot's favourite, not a fixed track. @typedef {BoardTrackId | 'favourite'} AutomaTrackTiebreaker */

/**
 * A base card's printed data. The left card supplies track indicators and income;
 * the right supplies track/hex tiebreakers and topple. Automa reads the stored
 * top-to-bottom tiebreakers forwards; Shadow Empire reads them backwards (02 §9.4).
 * @typedef {Object} AutomaCard
 * @property {number} id - Printed ID, 1–22
 * @property {'decision' | 'progress'} deck - Circle IDs 1–7; rectangle IDs 8–22
 * @property {AutomaTrackIndicator} automaTrack
 * @property {AutomaTrackIndicator} shadowEmpireTrack
 * @property {readonly AutomaTrackTiebreaker[]} trackTiebreakers
 * @property {number} hexPattern - Pattern ID 1–10, resolved separately (R39)
 * @property {boolean} income
 * @property {boolean} topple
 */

// Exact base rows from docs/research/02-base-content.md §9.4. No arts icon is
// invented for replacement cards: bot games with arts are unavailable (R59).
/** @type {readonly AutomaCard[]} */
export const AUTOMA_CARDS = deepFreeze([
	{
		id: 1,
		deck: 'decision',
		automaTrack: 'END',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'favourite',
			'military',
			'exploration',
			'technology',
			'science',
		],
		hexPattern: 1,
		income: true,
		topple: true,
	},
	{
		id: 2,
		deck: 'decision',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'LMK',
		trackTiebreakers: [
			'military',
			'exploration',
			'favourite',
			'science',
			'technology',
		],
		hexPattern: 2,
		income: true,
		topple: false,
	},
	{
		id: 3,
		deck: 'decision',
		automaTrack: 'LMK',
		shadowEmpireTrack: 'END',
		trackTiebreakers: [
			'science',
			'technology',
			'military',
			'exploration',
			'favourite',
		],
		hexPattern: 1,
		income: false,
		topple: true,
	},
	{
		id: 4,
		deck: 'decision',
		automaTrack: 'LMK',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'technology',
			'science',
			'favourite',
			'military',
			'exploration',
		],
		hexPattern: 3,
		income: true,
		topple: false,
	},
	{
		id: 5,
		deck: 'decision',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'LMK',
		trackTiebreakers: [
			'exploration',
			'military',
			'technology',
			'science',
			'favourite',
		],
		hexPattern: 10,
		income: false,
		topple: false,
	},
	{
		id: 6,
		deck: 'decision',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'military',
			'science',
			'favourite',
			'technology',
			'exploration',
		],
		hexPattern: 1,
		income: false,
		topple: true,
	},
	{
		id: 7,
		deck: 'decision',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'favourite',
			'technology',
			'exploration',
			'military',
			'science',
		],
		hexPattern: 5,
		income: false,
		topple: false,
	},
	{
		id: 8,
		deck: 'progress',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'exploration',
			'military',
			'technology',
			'favourite',
			'science',
		],
		hexPattern: 6,
		income: true,
		topple: false,
	},
	{
		id: 9,
		deck: 'progress',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'technology',
			'science',
			'favourite',
			'exploration',
			'military',
		],
		hexPattern: 4,
		income: true,
		topple: true,
	},
	{
		id: 10,
		deck: 'progress',
		automaTrack: 'LMK',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'military',
			'exploration',
			'technology',
			'science',
			'favourite',
		],
		hexPattern: 9,
		income: false,
		topple: true,
	},
	{
		id: 11,
		deck: 'progress',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'LMK',
		trackTiebreakers: [
			'favourite',
			'exploration',
			'military',
			'science',
			'technology',
		],
		hexPattern: 7,
		income: false,
		topple: false,
	},
	{
		id: 12,
		deck: 'progress',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'science',
			'technology',
			'favourite',
			'military',
			'exploration',
		],
		hexPattern: 8,
		income: true,
		topple: true,
	},
	{
		id: 13,
		deck: 'progress',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'LMK',
		trackTiebreakers: [
			'science',
			'technology',
			'military',
			'favourite',
			'exploration',
		],
		hexPattern: 6,
		income: false,
		topple: false,
	},
	{
		id: 14,
		deck: 'progress',
		automaTrack: 'LMK',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'exploration',
			'favourite',
			'science',
			'military',
			'technology',
		],
		hexPattern: 4,
		income: true,
		topple: true,
	},
	{
		id: 15,
		deck: 'progress',
		automaTrack: 'LMK',
		shadowEmpireTrack: 'LMK',
		trackTiebreakers: [
			'favourite',
			'military',
			'technology',
			'exploration',
			'science',
		],
		hexPattern: 9,
		income: false,
		topple: true,
	},
	{
		id: 16,
		deck: 'progress',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'LMK',
		trackTiebreakers: [
			'technology',
			'exploration',
			'favourite',
			'science',
			'military',
		],
		hexPattern: 7,
		income: true,
		topple: false,
	},
	{
		id: 17,
		deck: 'progress',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'exploration',
			'favourite',
			'technology',
			'military',
			'science',
		],
		hexPattern: 5,
		income: true,
		topple: false,
	},
	{
		id: 18,
		deck: 'progress',
		automaTrack: 'LMK',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'favourite',
			'exploration',
			'military',
			'science',
			'technology',
		],
		hexPattern: 1,
		income: false,
		topple: false,
	},
	{
		id: 19,
		deck: 'progress',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'military',
			'technology',
			'science',
			'exploration',
			'favourite',
		],
		hexPattern: 2,
		income: true,
		topple: true,
	},
	{
		id: 20,
		deck: 'progress',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'technology',
			'exploration',
			'science',
			'military',
			'favourite',
		],
		hexPattern: 1,
		income: false,
		topple: false,
	},
	{
		id: 21,
		deck: 'progress',
		automaTrack: 'ALL',
		shadowEmpireTrack: 'END',
		trackTiebreakers: [
			'exploration',
			'technology',
			'favourite',
			'science',
			'military',
		],
		hexPattern: 3,
		income: true,
		topple: true,
	},
	{
		id: 22,
		deck: 'progress',
		automaTrack: 'END',
		shadowEmpireTrack: 'ALL',
		trackTiebreakers: [
			'military',
			'exploration',
			'technology',
			'favourite',
			'science',
		],
		hexPattern: 1,
		income: false,
		topple: true,
	},
]);

/** The 2-player Shadow Empire variant uses IDs 1–12 (02 §9.1), referencing the same base records. @type {readonly AutomaCard[]} */
export const SHADOW_EMPIRE_CARDS = deepFreeze(
	AUTOMA_CARDS.filter((card) => card.id <= 12)
);
