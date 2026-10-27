// The tech and tapestry cards as their faces show them, built from the engine's data with describe.js's words (#27 design §3).
import { techCard } from '../engine/data/tech-cards.js';
import { tapestryCard } from '../engine/data/tapestry-cards.js';
import { INCOME_MAT } from '../engine/data/income-mat.js';
import { describeEffects, describeTapestryCard } from '../describe.js';

/** @typedef {import('./card-layouts.js').TechnologyCardData} TechnologyCardData */
/** @typedef {import('./card-layouts.js').TapestryCardData} TapestryCardData */

/** The timing labels of card-design-rules.md, by the engine's timing. */
const TIMINGS = Object.freeze({ played: 'When Played', era: 'This Era' });

/** The trap's timing label. */
const TRAP_TIMING = 'Trap · Response';

/**
 * A text as a sentence on a card: it ends with a full stop.
 * @param {string} text
 * @returns {string}
 */
function sentence(text) {
	return /[.!?]$/.test(text) ? text : `${text}.`;
}

/**
 * An income-mat innovation's printed name, such as 'Farming', from its id.
 * @param {string} id
 * @returns {string}
 */
function innovationName(id) {
	const space = Object.values(INCOME_MAT)
		.flat()
		.find((s) => s.id === id);
	if (!space) {
		throw new Error(`no income-mat innovation ${id}`);
	}
	return space.name;
}

/**
 * A tech card's face: its art, its circle and square benefits in words, and its top-row prerequisite, a track tier
 * or an income-mat innovation (R18).
 * @param {string} id - A tech card id, such as 'clocks'
 * @returns {TechnologyCardData}
 */
export function techCardData(id) {
	const card = techCard(id);
	/** @type {TechnologyCardData} */
	const data = {
		title: card.name,
		art: card.id,
		circle: sentence(describeEffects(card.circle)),
		square: sentence(describeEffects(card.square)),
	};
	if ('innovation' in card.requires) {
		data.innovation = innovationName(card.requires.innovation);
	} else {
		data.track = card.requires.track;
		data.level = card.requires.tier;
	}
	return data;
}

/**
 * A tapestry card's face: its art, its timing and its ability in words. The trap is a response card, with what it
 * gains played as a tapestry card as its note (R22).
 * @param {string} id - A tapestry card id, such as 'academia'; each trap copy, such as 'trap-3', is the trap
 * @returns {TapestryCardData}
 */
export function tapestryCardData(id) {
	const card = tapestryCard(id);
	const trap = card.id === 'trap';
	const { ability, note } = describeTapestryCard(card.id);
	/** @type {TapestryCardData} */
	const data = {
		title: card.name,
		art: card.id,
		timing: trap ? TRAP_TIMING : TIMINGS[card.timing],
		copy: sentence(ability),
	};
	if (note !== undefined) {
		data.note = sentence(note);
	}
	if (trap) {
		data.trap = true;
	}
	return data;
}
