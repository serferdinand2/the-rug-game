// The player tabs, and which one a decision opens (#27 design §1, §5), from its kind's facts (#129).
import { kindFacts } from '../decision-kinds.js';

/** The tabs of the player area, in the mockup's order. */
export const TABS = Object.freeze([
	{ id: 'capital', label: 'Capital' },
	{ id: 'hand', label: 'Hand' },
	{ id: 'income', label: 'Income' },
	{ id: 'eras', label: 'Eras' },
	{ id: 'civ', label: 'Civ' },
	{ id: 'tech', label: 'Tech' },
	{ id: 'terrain', label: 'Terrain' },
]);

/**
 * The tab a decision opens by itself, or null when its things are elsewhere (the board, or nowhere in particular).
 * A placement answered only with map hexes (the Nomads) belongs to the map.
 * @param {{ kind: string, answers?: any[] } | null} decision
 * @returns {string | null}
 */
export function tabFor(decision) {
	if (!decision) {
		return null;
	}
	if (
		decision.kind === 'choosePlacement' &&
		(decision.answers ?? []).every((a) => typeof a.hex === 'string')
	) {
		return null;
	}
	return kindFacts(decision.kind).tab;
}
