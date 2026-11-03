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
 * The tabs with the counts they show after their label: the cards in hand, and the territory tiles in hand (#169).
 * @param {{ hand: number, territories: number }} counts
 * @returns {{ id: string, label: string, count?: number }[]}
 */
export function tabsWithCounts({ hand, territories }) {
	return TABS.map((tab) => {
		if (tab.id === 'hand') {
			return { ...tab, count: hand };
		}
		if (tab.id === 'terrain') {
			return { ...tab, count: territories };
		}
		return { ...tab };
	});
}

/**
 * The tab a decision opens by itself, or null when its things are elsewhere (the board, or nowhere in particular).
 * A placement answered only with map hexes (the Nomads) belongs to the map.
 * @param {{ kind: string, answers?: any[], mat?: boolean } | null} decision
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
	// An explore onto the Islanders' mat is made on their card (#165).
	if (decision.kind === 'chooseExplore' && decision.mat === true) {
		return 'civ';
	}
	return kindFacts(decision.kind).tab;
}
