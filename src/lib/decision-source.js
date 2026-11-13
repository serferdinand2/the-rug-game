import {
	civilizationName,
	hexName,
	landmarkName,
	masterpieceName,
	spaceName,
	tapestryName,
	techName,
	trackName,
} from './game-names.js';
import { ARTS_TRACK, TRACK_IDS } from './engine/data/ids.js';

/** Public, display-ready source information. Hidden card identifiers are never named. @param {any} source @param {any} game @param {number | null} viewer @returns {any} */
export function decisionSource(source, game, viewer) {
	if (!source || typeof source !== 'object') return undefined;
	const publicIds = JSON.stringify({
		seats: game?.seats ?? [],
		faceUp: game?.supply?.tech?.faceUp ?? [],
		masterpieces: game?.supply?.masterpieces?.faceUp ?? [],
	});
	/** @param {unknown} id */
	const visible = (id) =>
		typeof id === 'string' && publicIds.includes(JSON.stringify(id));
	const owner =
		Number.isInteger(source.player) && source.player !== viewer
			? game?.seats?.[source.player - 1]?.name
			: null;
	const whose = owner ? `${owner}'s ` : '';
	if (
		[...TRACK_IDS, ARTS_TRACK].includes(source.track) &&
		Number.isInteger(source.space) &&
		source.space > 0 &&
		source.space <= 12
	)
		return {
			kind: 'track',
			track: source.track,
			space: source.space,
			name: spaceName(source.track, source.space),
			trackName: trackName(source.track),
			bonus: !!source.bonus,
		};
	if (typeof source.civ === 'string' && visible(source.civ))
		return {
			kind: 'named',
			prefix: `From ${whose}`,
			name: civilizationName(source.civ),
			art: `civ/${source.civ}`,
			suffix:
				source.part === 'adjustment'
					? `${civilizationName(source.civ).endsWith('s') ? '’' : '’s'} adjustment`
					: source.part === 'setup'
						? `${civilizationName(source.civ).endsWith('s') ? '’' : '’s'} setup`
						: `${civilizationName(source.civ).endsWith('s') ? '’' : '’s'} ability`,
		};
	/** @type {[string, string, (id: string) => string][]} */
	const namedKinds = [
		['tech', ' technology', techName],
		['tapestry', ' tapestry card', tapestryName],
		['masterpiece', ' masterpiece', masterpieceName],
		['landmarkCard', ' landmark card', landmarkName],
	];
	for (const [key, label, namer] of namedKinds) {
		const id = source[key];
		if (typeof id === 'string')
			return visible(id)
				? {
						kind: 'named',
						prefix: `From ${whose}`,
						name: namer(id),
						art: `${key === 'landmarkCard' ? 'landmark-card' : key}/${id}`,
						...(['tech', 'tapestry', 'masterpiece'].includes(key)
							? { inspect: { kind: key, id } }
							: {}),
						suffix:
							label +
							(key === 'tech' &&
							['square', 'circle'].includes(source.icon)
								? ` · ${source.icon} benefit`
								: ''),
					}
				: { kind: 'plain', text: `From ${whose}card effect` };
	}
	if (
		source.capital === 'district' ||
		source.capital === 'row' ||
		source.capital === 'column'
	)
		return {
			kind: 'plain',
			text: `From completing a ${source.capital} in your capital`,
		};
	if (source.trap)
		return { kind: 'plain', text: 'From a trap during conquest' };
	if (typeof source.hex === 'string')
		return {
			kind: 'territory',
			prefix: source.conquest
				? `From ${whose}conquest of `
				: 'From territory ',
			name:
				Number.isInteger(source.tile) && !source.conquest
					? `tile ${source.tile} (${hexName(source.hex)})`
					: hexName(source.hex),
		};
	if (
		Number.isInteger(source.spaceTile) ||
		typeof source.spaceTile === 'string'
	)
		return {
			kind: 'territory',
			prefix: 'From space tile ',
			name: String(source.spaceTile),
		};
	if (source.hiddenCard) return { kind: 'plain', text: 'From a card effect' };
	if (typeof source.achievement === 'string')
		return { kind: 'plain', text: 'From an achievement' };
	if (typeof source.incomeReason === 'string')
		return { kind: 'plain', text: source.incomeReason };
	if (
		Number.isInteger(source.incomeTurn) &&
		source.incomeTurn > 0 &&
		typeof source.step === 'string' &&
		source.step.length > 0
	)
		return {
			kind: 'plain',
			text: `From income turn ${source.incomeTurn}: ${source.step.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}`,
		};
	return undefined;
}
