// What an item on F&F's income-mat overlay is, in words (#39): for the log, the prompts and the Eras tab.
import { buildingName, masterpieceName, techName } from './game-names.js';
import { countWords } from './words.js';

/**
 * An item reserved on the overlay, in words: "a Farm", "Microscope", "space tile 4", "3 territory tiles", "an outpost"
 * or "a reminder".
 * @param {Record<string, any> | null | undefined} item - A ReservedItem from the view
 * @returns {string}
 */
export function reservedWords(item) {
	if (!item || typeof item !== 'object') {
		return 'an item';
	}
	if (typeof item.building === 'string') {
		return `a ${buildingName(item.building)}`;
	}
	if (typeof item.tech === 'string') {
		return techName(item.tech);
	}
	if (typeof item.space === 'number') {
		return `space tile ${item.space}`;
	}
	if (typeof item.masterpiece === 'string') {
		return masterpieceName(item.masterpiece);
	}
	if (Array.isArray(item.territory)) {
		return countWords(
			item.territory.length,
			'territory tile',
			'territory tiles'
		);
	}
	if (item.outpost) {
		return 'an outpost';
	}
	return 'a reminder';
}
