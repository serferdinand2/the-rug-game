// The player tabs, and which one a decision opens (#27 design §1, §5), from its kind's facts (#129).
import { decisionFacts } from '../decision-kinds.js';

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
 * @param {{ kind: string, purpose?: string, answers?: any[], mat?: boolean } | null} decision
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
	// The Traders place their token on a lit territory of the map, the Spies pick a lit space of the tracks (#172).
	if (
		decision.kind === 'chooseSlot' &&
		(decision.purpose === 'traders' || decision.purpose === 'spiesSpace')
	) {
		return null;
	}
	// An explore onto the Islanders' mat is made on their card (#165).
	if (decision.kind === 'chooseExplore' && decision.mat === true) {
		return 'civ';
	}
	// The Heralds' hand cards are picked in the hand, not on the Eras tab (#172).
	if (
		decision.kind === 'chooseSlot' &&
		decision.purpose === 'heralds' &&
		(decision.answers ?? []).every((a) => typeof a.slot !== 'object')
	) {
		return 'hand';
	}
	return decisionFacts(decision).tab;
}
