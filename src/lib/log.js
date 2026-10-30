// Words for the engine's events, for the table log (#29 design §5): one plain sentence for each event worth reading.
import { CAPITAL_MATS } from './engine/data/capitals.js';
import { BLACK_DIE, RED_DIE } from './engine/data/dice.js';
import { VERSIONS } from './engine/game.js';
import { RESOURCE_CAP } from './engine/effects/gain.js';
import { describeCost } from './describe.js';
import { PROPHECIES } from './decision-words.js';
import { article, capitalize, countWords, joinList } from './words.js';
import {
	achievementName,
	buildingName,
	expansionName,
	civilizationName,
	hexName,
	landmarkName,
	seatName,
	spaceName,
	tapestryCardOf,
	tapestryName,
	techName,
	trackName,
	variantName,
	versionName,
} from './game-names.js';

/** @typedef {import('./describe.js').Table} Game - The game as view() gives it: the seats' names */
/** @typedef {{ type?: unknown, seq?: unknown, player?: unknown, secret?: unknown } & Record<string, any>} LogEvent */

/**
 * One line of the table log.
 * @typedef {Object} LogEntry
 * @property {number} seq - The event's number
 * @property {number | null} player - The seat the line is about, for its colour; null for the whole table
 * @property {'turn' | 'income' | 'line' | 'notice'} kind - turn: a turnStarted divider; income: an income turn
 *   starting; notice: timedOut, undone, gameEnded, playerFinished; line: everything else
 * @property {string} text - One sentence ending with a full stop, such as "Ana advanced to Ships on Exploration."
 */

/**
 * The words of one event type: a sentence, or null when this event of the type says nothing worth reading.
 * @typedef {(event: Record<string, any>, game: Game | undefined, name: string) => string | null} Words
 */

/** @type {Readonly<Record<string, string>>} */ ({
	original: 'Original 2019 rules',
	current: 'Current official rules',
});

/** Where VP came from, as the end of a VP line says it (#29 design §2); other says nothing. */
const VP_FROM = /** @type {Readonly<Record<string, string>>} */ ({
	tracks: 'from the tracks',
	tapestry: 'from a tapestry card',
	tech: 'from a tech card',
	map: 'on the map',
	civ: 'from their civilization',
	income: 'in their income turn',
	capital: 'for their capital',
	achievements: 'for an achievement',
});

/** The event kinds that are table notices rather than plain lines. */
const NOTICES = ['timedOut', 'undone', 'gameEnded', 'playerFinished'];

/** Every event type the log deliberately leaves out: bookkeeping a reader learns nothing from. */
export const SILENT = new Set([
	// A space's benefit follows it as its own lines.
	'spaceActivated',
	// Lithium-Ion Battery's second use this turn: nothing happens.
	'oncePerTurnUsed',
	// Deck reshuffles.
	'deckShuffled',
	'techDeckShuffled',
	// The end of setup; the first turn's divider follows.
	'setupDone',
	// The move or income turn that follows says which turn was chosen.
	'turnChosen',
]);

/**
 * Whether a value is a plain object.
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isRecord(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Whether a value is a whole number of things.
 * @param {unknown} value
 * @returns {value is number}
 */
function isCount(value) {
	return Number.isInteger(value) && /** @type {number} */ (value) >= 0;
}

/**
 * Whether a value is a seat number.
 * @param {unknown} value
 * @returns {value is number}
 */
function isSeat(value) {
	return isCount(value) && value >= 1;
}

/**
 * The strings of a list, or none when it isn't one.
 * @param {unknown} value
 * @returns {string[]}
 */
function strings(value) {
	return Array.isArray(value)
		? value.filter((item) => typeof item === 'string')
		: [];
}

/**
 * Resources in words, such as "1 coin and 2 food"; null when there are none.
 * @param {unknown} resources
 * @returns {string | null}
 */
function resourceWords(resources) {
	if (!isRecord(resources)) {
		return null;
	}
	const words = describeCost(resources);
	return words === 'Nothing' ? null : words;
}

/**
 * A tapestry card as a log names it; a trap is "a trap".
 * @param {unknown} id
 * @returns {string}
 */
function tapestryWords(id) {
	return tapestryCardOf(id)?.id === 'trap' ? 'a trap' : tapestryName(id);
}

/**
 * A civilization with its article: "the Historians", "The Chosen".
 * @param {unknown} id
 * @returns {string}
 */
function civWords(id) {
	const name = civilizationName(id);
	return /^(the|a|an) /i.test(name) ? name : `the ${name}`;
}

/**
 * A capital mat's name from its number, such as "Mountain"; null for a number no mat has.
 * @param {unknown} number
 * @returns {string | null}
 */
function capitalName(number) {
	return CAPITAL_MATS.find((m) => m.number === number)?.name ?? null;
}

/**
 * A landmark with its article: "the Lighthouse".
 * @param {unknown} id
 * @returns {string}
 */
function landmarkWords(id) {
	return typeof id === 'string' ? `the ${landmarkName(id)}` : 'a landmark';
}

/**
 * An income building with its article: "a Farm", "an Armory".
 * @param {unknown} id
 * @returns {string}
 */
function buildingWords(id) {
	if (typeof id !== 'string') {
		return 'an income building';
	}
	const name = buildingName(id);
	return `${article(name)} ${name}`;
}

/**
 * A capital piece, `{ building }` or `{ landmark }`, with its article.
 * @param {unknown} piece
 * @returns {string}
 */
function pieceWords(piece) {
	if (isRecord(piece) && typeof piece.landmark === 'string') {
		return landmarkWords(piece.landmark);
	}
	return buildingWords(isRecord(piece) ? piece.building : undefined);
}

/**
 * Territory or space tiles by number: "territory tile 26", "space tiles 3 and 7".
 * @param {unknown} stack - 'territory' or 'space'
 * @param {unknown} tiles
 * @returns {string | null} Null for no tile
 */
function tileWords(stack, tiles) {
	const numbers = Array.isArray(tiles)
		? tiles.filter(isCount).map(String)
		: [];
	if (numbers.length === 0) {
		return null;
	}
	const kind = stack === 'space' ? 'space' : 'territory';
	return `${kind} ${numbers.length === 1 ? 'tile' : 'tiles'} ${joinList(numbers)}`;
}

/**
 * Whose a card or piece is, from its owner and the event's player: "their own" or "Bo's".
 * @param {Game | undefined} game
 * @param {unknown} owner
 * @param {unknown} player
 * @returns {string}
 */
function whose(game, owner, player) {
	return owner === player ? 'their own' : `${seatName(game, owner)}'s`;
}

/**
 * A conquer die's face in words: "5 VP", "1 coin", "the territory's benefit".
 * @param {unknown} face
 * @returns {string}
 */
function faceWords(face) {
	if (!isRecord(face)) {
		return 'nothing';
	}
	if (isCount(face.vp)) {
		return `${face.vp} VP`;
	}
	if (isRecord(face.vp)) {
		return '1 VP for each territory';
	}
	if ('tileBenefit' in face) {
		return "the territory's benefit";
	}
	return resourceWords(face.gain) ?? 'nothing';
}

/**
 * A THIS ERA ability, from an eraStarted or eraEnded event: "Monarchy", or "copy of Monarchy" when the ability is not
 * the card's own (Espionage, Heralds).
 * @param {Record<string, any>} event
 * @returns {string}
 */
function eraWords(event) {
	if (typeof event.ability !== 'string') {
		return 'tapestry ability';
	}
	const ability = tapestryName(event.ability);
	return event.card === event.ability ? ability : `copy of ${ability}`;
}

/**
 * What a Mystics prophecy counts, one and many: ['tech card', 'tech cards'].
 * @param {unknown} category
 * @returns {[string, string]}
 */
function prophecyNouns(category) {
	if (typeof category === 'string' && Object.hasOwn(PROPHECIES, category)) {
		const [, one, many] = PROPHECIES[category];
		return [one, many];
	}
	return ['thing', 'things'];
}

/** @type {Record<string, Words>} */
const WORDS = {
	// Setup.
	gameCreated(e, game) {
		const names = Array.isArray(e.seats)
			? e.seats
					.filter(isRecord)
					.map((s) =>
						typeof s.name === 'string' && s.name.trim() !== ''
							? s.name
							: seatName(game, s.seat)
					)
			: [];
		let text = 'A new game began';
		if (names.length > 0) {
			text += ` for ${joinList(names)}`;
		}
		if (VERSIONS.some((version) => version.id === e.version)) {
			text += ` under the ${versionName(e.version)}`;
		}
		const expansions = strings(e.expansions).map(expansionName);
		const variants = strings(e.variants).map((id) => variantName(id));
		const extras = [
			...(expansions.length > 0 ? [joinList(expansions)] : []),
			...(variants.length > 0
				? [
						`the ${variants.length === 1 ? 'variant' : 'variants'} ${joinList(variants)}`,
					]
				: []),
		];
		if (extras.length > 0) {
			text += `, with ${extras.join(' and ')}`;
		}
		return `${text}.`;
	},
	capitalDealt(e, game, name) {
		if (Array.isArray(e.options)) {
			const mats = e.options
				.map(capitalName)
				.filter((mat) => mat !== null);
			if (mats.length === 0) {
				return `${name} was dealt capital mats to choose from.`;
			}
			const noun = mats.length === 1 ? 'capital' : 'capitals';
			return `${name} was dealt the ${joinList(mats)} ${noun} to choose from.`;
		}
		const mat = capitalName(e.capital);
		return mat
			? `${name} was dealt the ${mat} capital.`
			: `${name} was dealt a capital mat.`;
	},
	civsDealt(e, game, name) {
		const civs = strings(isRecord(e.secret) ? e.secret.civs : undefined);
		return civs.length > 0
			? `${name} was dealt ${joinList(civs.map(civWords))} to choose from.`
			: `${name} was dealt civilizations to choose from.`;
	},
	capitalChosen(e, game, name) {
		const mat = capitalName(isRecord(e.secret) ? e.secret.capital : null);
		return mat
			? `${name} chose the ${mat} capital.`
			: `${name} chose a capital.`;
	},
	civChosen(e, game, name) {
		const civ = isRecord(e.secret) ? e.secret.civ : undefined;
		return typeof civ === 'string'
			? `${name} chose ${civWords(civ)}.`
			: `${name} chose a civilization.`;
	},
	setupRevealed(e, game) {
		const picks = Array.isArray(e.picks)
			? e.picks.filter(isRecord).map((pick) => {
					const mat = capitalName(pick.capital);
					const things = [
						...(typeof pick.civ === 'string'
							? [civWords(pick.civ)]
							: []),
						...(mat ? [`the ${mat} capital`] : []),
					];
					const who = seatName(game, pick.seat);
					return things.length > 0
						? `${who} has ${joinList(things)}`
						: `${who} has nothing`;
				})
			: [];
		return picks.length > 0
			? `The picks were revealed: ${picks.join('; ')}.`
			: 'The picks were revealed.';
	},
	outpostsPlaced(e, game, name) {
		const n = isCount(e.count) ? e.count : 2;
		return `${name} started with ${countWords(n, 'outpost', 'outposts')} on ${hexName(e.hex)}.`;
	},
	firstPlayerChosen: (e, game, name) => `${name} goes first.`,

	// Turns.
	turnStarted: (e, game, name) => `${name}'s turn.`,
	incomeTurnStarted: (e, game, name) =>
		isCount(e.turn) && e.turn > 0
			? `${name} began income turn ${e.turn}.`
			: `${name} began an income turn.`,
	firstBonus: (e, game, name) =>
		isCount(e.era) && e.era > 0
			? `${name} was the first of their neighbours to reach era ${e.era}.`
			: `${name} was the first of their neighbours to reach this era.`,
	playerFinished: (e, game, name) => `${name} has finished playing.`,
	gameEnded(e, game) {
		const ranking =
			isRecord(e.result) && Array.isArray(e.result.ranking)
				? e.result.ranking.filter(isRecord)
				: [];
		const winners = ranking.filter((r) => r.place === 1);
		if (winners.length === 0) {
			return 'The game is over.';
		}
		const names = joinList(winners.map((r) => seatName(game, r.seat)));
		const vp = isCount(winners[0].vp) ? ` with ${winners[0].vp} VP` : '';
		return winners.length === 1
			? `The game is over: ${names} won${vp}.`
			: `The game is over: ${names} share the win${vp}.`;
	},
	timedOut: (e, game, name) =>
		`${name}'s clock ran out; the rest of the turn was played for them.`,
	undone: (e, game, name) => `${name} took back a choice.`,

	// The tracks.
	tokenMoved(e, game, name) {
		const track = trackName(e.track);
		if (!isCount(e.to)) {
			return `${name} moved a token on ${track}.`;
		}
		if (e.to === 0) {
			return `${name} went back to the start of ${track}.`;
		}
		const space = spaceName(e.track, e.to);
		if (isCount(e.from) && e.to < e.from) {
			return `${name} went back to ${space} on ${track}.`;
		}
		return `${name} advanced to ${space} on ${track}.`;
	},
	tokenRestarted: (e, game, name) =>
		`${name} moved a token from ${trackName(e.from)} to the start of ${trackName(e.to)}.`,
	bonusPaid: (e, game, name) =>
		`${name} took the bonus of ${spaceName(e.track, e.space)}.`,
	benefitCopied: (e, game, name) =>
		`${name} copied the benefit of ${spaceName(e.track, e.space)} from ${seatName(game, e.from)}.`,
	scienceDieRolled: (e, game, name) =>
		`${name} rolled ${trackName(e.track)} on the science die.`,
	trackBlocked: (e, game, name) =>
		`${name} blocked their opponents from advancing on ${trackName(e.track)}.`,
	trackUnblocked: (e, game, name) =>
		`${name}'s block on ${trackName(e.track)} was lifted.`,
	achievementClaimed(e, game, name) {
		return typeof e.achievement === 'string'
			? `${name} claimed the achievement ${achievementName(e.achievement)}.`
			: `${name} claimed an achievement.`;
	},

	// Resources and VP.
	resourcesGained(e, game, name) {
		const gained = resourceWords(e.gained);
		const lost = resourceWords(e.lost);
		const over = lost
			? `${lost} went over the limit of ${RESOURCE_CAP}`
			: null;
		if (gained && over) {
			return `${name} gained ${gained}; ${over}.`;
		}
		if (gained) {
			return `${name} gained ${gained}.`;
		}
		return over ? `${name} gained nothing: ${over}.` : null;
	},
	resourcesPaid(e, game, name) {
		const paid = resourceWords(e.paid);
		return paid ? `${name} paid ${paid}.` : null;
	},
	resourcesLost(e, game, name) {
		const lost = resourceWords(e.lost);
		return lost ? `${name} lost ${lost}.` : null;
	},
	resourcesConverted(e, game, name) {
		const into = resourceWords(e.resources);
		if (!into) {
			return null;
		}
		const food = Object.values(e.resources).reduce(
			(sum, n) => sum + (isCount(n) ? n : 0),
			0
		);
		return `${name} converted ${food} food into ${into}.`;
	},
	vpGained(e, game, name) {
		if (!Number.isInteger(e.vp) || e.vp === 0) {
			return null;
		}
		const from =
			typeof e.source === 'string' && Object.hasOwn(VP_FROM, e.source)
				? ` ${VP_FROM[e.source]}`
				: '';
		return e.vp > 0
			? `${name} scored ${e.vp} VP${from}.`
			: `${name} lost ${-e.vp} VP${from}.`;
	},
	vpPaid: (e, game, name) =>
		isCount(e.vp) && e.vp > 0 ? `${name} paid ${e.vp} VP.` : null,
	tradeMade(e, game, name) {
		if (isSeat(e.host)) {
			return `${name} took up ${whose(game, e.host, e.player)} offer.`;
		}
		return `${name} made a trade.`;
	},
	noTrade: (e, game, name) => `${name} could not afford a trade.`,

	// The capital.
	buildingGained: (e, game, name) =>
		`${name} gained ${buildingWords(e.building)}.`,
	noBuildingLeft: (e, game, name) =>
		typeof e.building === 'string'
			? `${name} had no ${buildingName(e.building)} left to gain.`
			: `${name} had no income building left to gain.`,
	buildingPlaced: (e, game, name) =>
		isCount(e.craftsmen)
			? `${name} placed ${buildingWords(e.building)} in Craftsmen column ${e.craftsmen + 1}.`
			: `${name} placed ${buildingWords(e.building)} in their capital.`,
	buildingsSwapped: (e, game, name) =>
		`${name} swapped two income buildings in their capital.`,
	landmarkGained: (e, game, name) =>
		`${name} gained ${landmarkWords(e.landmark)}.`,
	noLandmarkLeft: (e, game, name) =>
		typeof e.landmark === 'string'
			? `${name} could not gain ${landmarkWords(e.landmark)}: it was already taken.`
			: `${name} found no track landmark left to gain.`,
	landmarkPlaced: (e, game, name) =>
		`${name} placed ${landmarkWords(e.landmark)} in their capital.`,
	placedBesideMat: (e, game, name) =>
		`${name} put ${pieceWords(e)} beside their capital mat.`,
	piecePlacedOnMap: (e, game, name) =>
		`${name} placed ${pieceWords(e.piece)} on ${hexName(e.hex)}.`,
	districtsCompleted(e, game, name) {
		const n = Array.isArray(e.districts) ? e.districts.length : 0;
		if (n === 0) {
			return null;
		}
		return n === 1
			? `${name} completed a district in their capital.`
			: `${name} completed ${n} districts in their capital.`;
	},
	capitalScored(e, game, name) {
		const parts = [
			...(isCount(e.rows) && e.rows > 0
				? [countWords(e.rows, 'complete row', 'complete rows')]
				: []),
			...(isCount(e.columns) && e.columns > 0
				? [countWords(e.columns, 'complete column', 'complete columns')]
				: []),
			...(isCount(e.uniform) && e.uniform > 0
				? [
						countWords(
							e.uniform,
							'line of a single building type',
							'lines of a single building type'
						),
					]
				: []),
		];
		return parts.length > 0
			? `${name} scored their capital: ${joinList(parts)}.`
			: null;
	},

	// The map.
	explored(e, game, name) {
		const where = `${name} explored ${hexName(e.hex)}`;
		return isCount(e.vp) && e.vp > 0
			? `${where}, matching ${countWords(e.vp, 'side', 'sides')}.`
			: `${where}.`;
	},
	noExplore: (e, game, name) => `${name} had nowhere to explore.`,
	spaceExplored: (e, game, name) =>
		isCount(e.tile)
			? `${name} explored space tile ${e.tile}.`
			: `${name} explored a space tile.`,
	noSpaceTile: (e, game, name) => `${name} had no space tile to explore.`,
	tilesGained(e, game, name) {
		const tiles = tileWords(e.stack, e.tiles);
		const kind = e.stack === 'space' ? 'space' : 'territory';
		return tiles
			? `${name} gained ${tiles}.`
			: `${name} found no ${kind} tile left to gain.`;
	},
	tilesDiscarded(e, game, name) {
		const tiles = tileWords(e.stack, e.tiles);
		return tiles ? `${name} discarded ${tiles}.` : null;
	},
	tileGiven: (e, game, name) =>
		isCount(e.tile)
			? `${name} gave territory tile ${e.tile} to ${seatName(game, e.to)}.`
			: `${name} gave a territory tile to ${seatName(game, e.to)}.`,
	tileBenefit: (e, game, name) =>
		isCount(e.tile)
			? `${name} gained the benefit of territory tile ${e.tile} on ${hexName(e.hex)}.`
			: `${name} gained no tile benefit: ${hexName(e.hex)} is a printed territory.`,
	outpostPlaced: (e, game, name) =>
		e.militarism === true
			? `${name} placed an outpost on ${hexName(e.hex)} with Militarism.`
			: `${name} placed an outpost on ${hexName(e.hex)}.`,
	noOutpost: (e, game, name) => `${name} had no outpost left to place.`,
	outpostToppled: (e, game, name) =>
		`${name}'s outpost on ${hexName(e.hex)} was toppled by ${seatName(game, e.by)}.`,
	outpostRaised: (e, game, name) =>
		`${name}'s outpost on ${hexName(e.hex)} stood up again.`,
	noConquer: (e, game, name) => `${name} had nothing to conquer.`,
	responsePlayed(e, game, name) {
		const attacker = seatName(game, e.attacker);
		const where = hexName(e.hex);
		const card = tapestryWords(e.card);
		return card === 'a trap'
			? `${name}'s trap stopped ${attacker}'s conquest of ${where}.`
			: `${name} played ${card} against ${attacker}'s conquest of ${where}.`;
	},
	responseDeclined: (e, game, name) =>
		`${name} did not respond to the conquest of ${hexName(e.hex)}.`,
	conquered: (e, game, name) =>
		e.trapped === true
			? `${name}'s conquest of ${hexName(e.hex)} failed.`
			: `${name} conquered ${hexName(e.hex)}.`,
	conquerDiceRolled: (e, game, name) =>
		`${name} rolled the conquer dice: red ${faceWords(isCount(e.red) ? RED_DIE[e.red] : undefined)}, black ${faceWords(isCount(e.black) ? BLACK_DIE[e.black] : undefined)}.`,

	// Tapestry cards.
	cardsDrawn(e, game, name) {
		const cards = strings(isRecord(e.secret) ? e.secret.cards : undefined);
		if (cards.length > 0) {
			return `${name} drew ${joinList(cards.map(tapestryWords))}.`;
		}
		if (!isCount(e.count)) {
			return `${name} drew tapestry cards.`;
		}
		return e.count === 0
			? `${name} found no tapestry card left to draw.`
			: `${name} drew ${e.count === 1 ? 'a tapestry card' : `${e.count} tapestry cards`}.`;
	},
	cardsDiscarded(e, game, name) {
		const cards = strings(e.cards);
		if (cards.length === 0) {
			return null;
		}
		const named =
			e.deck === 'tech' ? cards.map(techName) : cards.map(tapestryWords);
		return `${name} discarded ${joinList(named)}.`;
	},
	cardsRevealed(e, game, name) {
		const shown = strings(e.cards).map(tapestryWords);
		const found =
			typeof e.found === 'string' ? tapestryWords(e.found) : null;
		if (shown.length === 0) {
			return found
				? `${name} revealed and kept ${found}.`
				: `${name} found no tapestry card to reveal.`;
		}
		const discarded = `${name} revealed and discarded ${joinList(shown)}`;
		return found
			? `${discarded}, then kept ${found}.`
			: `${discarded}, and found no card to keep.`;
	},
	tapestryPlayed(e, game, name) {
		if (e.faceDown === true || typeof e.card !== 'string') {
			return `${name} played a tapestry card face down.`;
		}
		const card = tapestryWords(e.card);
		// R22: a trap played on an income turn is a tapestry card worth its VP.
		return card === 'a trap'
			? `${name} played a trap as a tapestry card.`
			: `${name} played ${card}.`;
	},
	noTapestryOnTop: (e, game, name) => `${name} had no tapestry card to play.`,
	eraStarted: (e, game, name) =>
		`${name}'s ${eraWords(e)} took effect for this era.`,
	eraEnded: (e, game, name) => `${name}'s ${eraWords(e)} ended.`,
	partnerChosen: (e, game, name) =>
		typeof e.track === 'string'
			? `${name} chose ${seatName(game, e.opponent)} and ${trackName(e.track)} for this era.`
			: `${name} chose ${seatName(game, e.opponent)} as their partner for this era.`,
	noCopy: (e, game, name) => `${name} had no tapestry card to copy.`,
	noColonialism: (e, game, name) =>
		`${name} controlled no territory tile for Colonialism.`,
	noMove: (e, game, name) => `${name}'s tapestry card had no effect.`,

	// Tech cards.
	techInvented: (e, game, name) =>
		e.from === 'deck'
			? `${name} invented ${techName(e.card)} from the deck.`
			: `${name} invented ${techName(e.card)}.`,
	techUpgraded(e, game, name) {
		const card = techName(e.card);
		if (e.to === 'middle' || e.to === 'top') {
			return `${name} upgraded ${card} to the ${e.to} row.`;
		}
		return `${name} upgraded ${card}.`;
	},
	techDisplayRefreshed(e) {
		const cards = strings(e.faceUp).map(techName);
		return cards.length > 0
			? `The face-up tech cards were replaced with ${joinList(cards)}.`
			: 'The face-up tech cards were cleared.';
	},
	noInvent: (e, game, name) => `${name} had no tech card to invent.`,
	noUpgrade: (e, game, name) => `${name} had no tech card to upgrade.`,
	// Assembly Line, Electronics and Nanotechnology (#144): the card's benefit follows as its own lines.
	techBenefitUsed(e, game, name) {
		const card = techName(e.card);
		if (e.icon === 'square') {
			return `${name} took the square benefit of ${card}, which stays in the top row.`;
		}
		if (e.icon === 'circle') {
			return `${name} took the circle benefit of ${card}, which stays in the middle row.`;
		}
		return `${name} took the benefit of ${card}.`;
	},
	noTechBenefit: (e, game, name) =>
		`${name} had no tech card to take a benefit from.`,

	// Civilizations.
	civAbilityUsed: (e, game, name) =>
		`${name} used the ability of ${civWords(e.civ)}.`,
	civGained: (e, game, name) => `${name} gained ${civWords(e.civ)}.`,
	civDiscarded: (e, game, name) => `${name} discarded ${civWords(e.civ)}.`,
	civsDrawn(e, game, name) {
		const civs = strings(isRecord(e.secret) ? e.secret.civs : undefined);
		if (civs.length > 0) {
			return `${name} drew ${joinList(civs.map(civWords))}.`;
		}
		return isCount(e.count) && e.count > 0
			? `${name} drew ${countWords(e.count, 'civilization', 'civilizations')}.`
			: `${name} drew civilizations.`;
	},
	noCivLeft: (e, game, name) => `${name} found no civilization left to gain.`,
	tokenPlaced(e, game, name) {
		const civ = civilizationName(e.civ);
		return `${name} placed ${article(civ)} ${civ} token on ${hexName(e.hex)}.`;
	},
	alchemistsRolled: (e, game, name) =>
		`${name}'s Alchemists rolled ${trackName(e.track)}.`,
	alchemistsBust: (e, game, name) =>
		`${name}'s Alchemists rolled a track twice and went bust.`,
	heraldsCopied: (e, game, name) =>
		`${name} used a Heralds token to copy ${whose(game, e.owner, e.player)} ${tapestryName(e.card)}.`,
	historiansGave: (e, game, name) =>
		`${name} gave ${seatName(game, e.to)} a Historians token.`,
	inventorsMarked: (e, game, name) =>
		`${name} put an Inventors token on ${whose(game, e.owner, e.player)} ${techName(e.card)}.`,
	inventorsTook: (e, game, name) =>
		`${name} took ${techName(e.card)} from ${seatName(game, e.from)} with the Inventors.`,
	merrymakersMoved: (e, game, name) =>
		isCount(e.column)
			? `${name} moved up Merrymakers column ${e.column + 1}.`
			: `${name} moved up a Merrymakers column.`,
	entertainersMoved(e, game, name) {
		const match =
			typeof e.space === 'string' && /^c(\d+)r(\d+)$/.exec(e.space);
		return match
			? `${name} moved the Entertainers token to column ${match[1]}, row ${match[2]}.`
			: `${name} moved the Entertainers token.`;
	},
	militantsCovered: (e, game, name) =>
		e.row === 'top' || e.row === 'bottom'
			? `${name} put an outpost on the Militants' ${e.row} row.`
			: `${name} put an outpost on the Militants mat.`,
	militantsUncovered: (e, game, name) =>
		e.row === 'top' || e.row === 'bottom'
			? `${name} took an outpost from the Militants' ${e.row} row.`
			: `${name} took an outpost from the Militants mat.`,
	cubePlaced: (e, game, name) =>
		`${name} put an Architects cube in their capital.`,
	prophecyMade(e, game, name) {
		const [one, many] = prophecyNouns(e.category);
		return isCount(e.value)
			? `${name} predicted ${countWords(e.value, one, many)}.`
			: `${name} made a prophecy.`;
	},
	prophecyReached(e, game, name) {
		const [, many] = prophecyNouns(e.category);
		return `${name} reached their prophecy of ${many}.`;
	},
};

/**
 * Words for one event, or null for bookkeeping the log leaves out, and for an event of a type it doesn't know.
 * An event's `secret` is named only when present, which view() allows in its own player's view alone.
 * @param {LogEvent | null | undefined} event - An event as the viewer's view gives it
 * @param {Game | null} [game] - The viewer's view, for the seats' names
 * @returns {string | null}
 */
export function eventText(event, game) {
	if (!isRecord(event) || typeof event.type !== 'string') {
		return null;
	}
	if (SILENT.has(event.type) || !Object.hasOwn(WORDS, event.type)) {
		return null;
	}
	const table = game ?? undefined;
	// A player's own name keeps the case they typed; "a player" starts its sentence.
	const name = seatName(table, event.player);
	return WORDS[event.type](
		event,
		table,
		isSeat(event.player) ? name : capitalize(name)
	);
}

/**
 * The kind of line an event makes.
 * @param {string} type
 * @returns {LogEntry['kind']}
 */
function kindOf(type) {
	if (type === 'turnStarted') {
		return 'turn';
	}
	if (type === 'incomeTurnStarted') {
		return 'income';
	}
	return NOTICES.includes(type) ? 'notice' : 'line';
}

/**
 * The log: one entry per event that has words, oldest first.
 * @param {readonly LogEvent[]} events - Already filtered by the caller: what an `undone` took back is gone
 * @param {Game | null} [game] - The viewer's view, for the seats' names
 * @returns {LogEntry[]}
 */
export function logEntries(events, game) {
	/** @type {LogEntry[]} */
	const entries = [];
	for (const event of events) {
		const text = eventText(event, game);
		if (text === null) {
			continue;
		}
		const type = /** @type {string} */ (event.type);
		entries.push({
			seq: isCount(event.seq) ? event.seq : 0,
			player:
				type !== 'gameEnded' && isSeat(event.player)
					? event.player
					: null,
			kind: kindOf(type),
			text,
		});
	}
	return entries;
}
