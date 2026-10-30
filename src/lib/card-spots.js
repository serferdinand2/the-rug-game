// The CardSlot props of a spot on a civilization card's pattern: a button when the open decision offers it (#78, #106).

/**
 * The props that make a CardSlot a spot the open decision offers, or none when it doesn't.
 * @param {string} spot - The spot's id on its card, such as 'c2r1' or 'districts:4'
 * @param {readonly string[]} choices - The spots the open decision offers
 * @param {string | null | undefined} picked - The spot the player has picked
 * @param {(event: import('./component-event.js').ComponentEvent) => void} pick - CardSlot's onCardSlotPick
 * @returns {Record<string, any>} Props to spread on the CardSlot
 */
export function spotChoice(spot, choices, picked, pick) {
	return choices.includes(spot)
		? {
				pickable: true,
				picked: picked === spot,
				value: spot,
				'data-id': `civ-spot-${spot}`,
				onCardSlotPick: pick,
			}
		: {};
}
