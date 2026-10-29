// The static main-screen mockup's own copy of the reviewed card fixtures and their string markup (#108): the app draws its
// cards in Svelte from the engine's data (TechnologyCard, TapestryCard), so this mockup keeps the builders it was made with.
/** @typedef {{title:string,art:string,circle:string,square:string,track?:string,level?:number,innovation?:string}} TechnologyCardData */
/** @typedef {{title:string,art:string,timing:string,copy:string,note?:string,trap?:boolean,edition?:string}} TapestryCardData */
/** @type {Readonly<Record<string, TechnologyCardData>>} */
export const TECHNOLOGY_CARDS = Object.freeze({
	clocks: {
		title: 'Clocks',
		art: 'clocks',
		circle: 'Advance on Technology without benefit or bonus.',
		square: '1 VP per Technology track space advanced.',
		track: 'technology',
		level: 2,
	},
	concrete: {
		title: 'Concrete',
		art: 'concrete',
		circle: 'Gain 1 market.',
		square: '1 VP per market in your capital.',
		track: 'exploration',
		level: 2,
	},
	dynamite: {
		title: 'Dynamite',
		art: 'dynamite',
		circle: 'Conquer 1 territory.',
		square: '1 VP per territory you control.',
		track: 'military',
		level: 2,
	},
	bakery: {
		title: 'Bakery',
		art: 'bakery',
		circle: 'Gain 4 VP.',
		square: 'Place the Bakery landmark.',
		innovation: 'Farming',
	},
	paper: {
		title: 'Paper',
		art: 'paper',
		circle: 'Gain a house.',
		square: '1 VP per house in your capital.',
		track: 'science',
		level: 2,
	},
	calendar: {
		title: 'Calendar',
		art: 'calendar',
		circle: 'Gain 1 culture.',
		square: 'Gain 7 VP.',
		track: 'exploration',
		level: 2,
	},
});

/** @type {Readonly<Record<string, TapestryCardData>>} */
export const TAPESTRY_CARDS = Object.freeze({
	academia: {
		title: 'Academia',
		art: 'academia',
		timing: 'This Era',
		copy: 'Whenever you invent a tech card or gain a tapestry card, gain 3 VP.',
	},
	'age-of-discovery': {
		title: 'Age of Discovery',
		art: 'age-of-discovery',
		timing: 'When Played',
		copy: 'Roll the science die. All players advance on the track it shows; only you gain its benefit. You may pay the bonus.',
	},
	trap: {
		title: 'Trap',
		art: 'trap',
		timing: 'Trap · Response',
		copy: 'Discard this card when an opponent tries to conquer one of your territories. Gain 1 resource of your choice, keep control, and topple their outpost. They still gain their conquer-die benefit.',
		note: 'Played as a tapestry card on an income turn, Trap gains 10 VP.',
		trap: true,
	},
	'age-of-sail': {
		title: 'Age of Sail',
		art: 'age-of-sail',
		timing: 'This Era',
		copy: 'Whenever you explore, draw a total of 3 territory tiles. Before placing, you may give 1 to an opponent to gain 3 VP.',
	},
	alliance: {
		title: 'Alliance',
		art: 'alliance',
		timing: 'This Era',
		copy: 'Choose an opponent. Neither of you may conquer the other’s territories. Whenever they upgrade a tech card, you gain the same benefit after them.',
	},
	cartography: {
		title: 'Cartography',
		art: 'cartography',
		timing: 'When Played',
		copy: 'Gain 1 territory tile and explore with it. If that exploration scores at least 3 VP, you may also conquer that territory.',
	},
	dystopia: {
		title: 'Dystopia',
		art: 'dystopia',
		timing: 'When Played',
		copy: 'Gain any track landmark still on the landmark board and place it in your capital.',
	},
	capitalism: {
		title: 'Capitalism',
		art: 'capitalism',
		timing: 'This Era',
		copy: 'When you gain income, gain 2 VP per coin earned. Whenever you gain a market, also gain 1 coin.',
	},
});

/** @param {string} value */
const escape = (value) =>
	String(value).replace(
		/[&<>"']/g,
		(character) =>
			/** @type {Record<string,string>} */ ({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
			})[character] ?? character
	);

/**
 * A reviewed technology fixture by id.
 * @param {string} id
 * @returns {TechnologyCardData}
 */
export function technologyFixture(id) {
	const card = TECHNOLOGY_CARDS[id];
	if (!card) throw new Error(`Unknown technology card: ${id}`);
	return card;
}

/**
 * A reviewed tapestry fixture by id.
 * @param {string} id
 * @returns {TapestryCardData}
 */
export function tapestryFixture(id) {
	const card = TAPESTRY_CARDS[id];
	if (!card) throw new Error(`Unknown tapestry card: ${id}`);
	return card;
}

/**
 * A technology card's markup, from a fixture or from the engine's data (game-cards.js).
 * @param {TechnologyCardData | string} card - A fixture, or its id
 * @returns {string}
 */
export function technologyCardMarkup(card) {
	if (typeof card === 'string') {
		card = technologyFixture(card);
	}
	const track = card.track
		? card.track[0].toUpperCase() + card.track.slice(1)
		: '';
	const requirement = card.innovation
		? `<b>${escape(card.innovation)} uncovered</b>`
		: `<img src="/art/track/${card.track}.svg" alt=""><b class="rg-tech-layout__track rg-tech-layout__track--${card.track}">${track}</b><b>${card.level}</b>`;
	return `<div class="rg-tech-layout" aria-label="${escape(card.title)} technology card"><header class="rg-tech-layout__band"><strong>${escape(card.title)}</strong></header><div class="rg-tech-layout__body"><img class="rg-tech-layout__art" src="/art/tech/${escape(card.art)}.svg" alt=""><div class="rg-tech-layout__effects"><div class="rg-tech-layout__effect"><span class="rg-tech-layout__shape rg-tech-layout__shape--square" aria-label="Square benefit"></span><div><small>Square · top row</small><p>${escape(card.square)}</p></div></div><div class="rg-tech-layout__effect"><span class="rg-tech-layout__shape rg-tech-layout__shape--circle" aria-label="Circle benefit"></span><div><small>Circle · middle row</small><p>${escape(card.circle)}</p></div></div></div></div><div class="rg-tech-layout__conditions"><span class="rg-tech-layout__condition">${requirement}</span><span class="rg-tech-layout__condition"><i class="rg-tech-layout__shape rg-tech-layout__shape--square" aria-hidden="true"></i><b>Top row</b></span></div><footer class="rg-tech-layout__footer"><span class="rg-card-edition rg-card-edition--base">Base game</span></footer></div>`;
}

/**
 * A tapestry card's markup, from a fixture or from the engine's data (game-cards.js).
 * @param {TapestryCardData | string} card - A fixture, or its id
 * @returns {string}
 */
export function tapestryCardMarkup(card) {
	if (typeof card === 'string') {
		card = tapestryFixture(card);
	}
	const timingClass = card.trap
		? 'trap'
		: card.timing === 'When Played'
			? 'when-played'
			: 'this-era';
	return `<div class="rg-tapestry-layout${card.trap ? ' rg-tapestry-layout--trap' : ''}" aria-label="${escape(card.title)} tapestry card"><header class="rg-tapestry-layout__band"><strong>${escape(card.title)}</strong></header><div class="rg-tapestry-layout__portrait"><img src="/art/tapestry/${escape(card.art)}.svg" alt="">${card.timing ? `<span class="rg-tapestry-layout__timing rg-tapestry-layout__timing--${timingClass}">${escape(card.timing)}</span>` : ''}</div><p class="rg-tapestry-layout__copy">${escape(card.copy)}${card.note ? `<span class="rg-tapestry-layout__note">${escape(card.note)}</span>` : ''}</p><footer class="rg-tapestry-layout__footer"><span class="rg-card-edition ${card.edition && card.edition !== 'Base game' ? 'rg-card-edition--arts' : 'rg-card-edition--base'}">${escape(card.edition ?? 'Base game')}</span></footer></div>`;
}
