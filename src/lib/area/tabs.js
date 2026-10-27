// The player tabs, and which one a decision opens (#27 design §1, §5).

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

/** The tab each decision kind's things are on. */
const TAB_OF = Object.freeze({
	choosePlacement: 'capital',
	chooseSwap: 'capital',
	chooseTapestry: 'hand',
	chooseKeep: 'hand',
	chooseDiscard: 'hand',
	chooseCopy: 'eras',
	chooseInvent: 'tech',
	chooseUpgrade: 'tech',
	chooseTechBenefit: 'tech',
	chooseCivAbility: 'civ',
	chooseAlchemists: 'civ',
	chooseProphecy: 'civ',
	chooseSlot: 'civ',
	chooseSpaceTile: 'terrain',
	chooseGift: 'terrain',
});

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
	return (
		/** @type {Record<string, string>} */ (TAB_OF)[decision.kind] ?? null
	);
}
