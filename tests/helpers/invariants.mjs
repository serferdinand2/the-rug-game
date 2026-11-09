// The state invariants the simulation checks after every action: every card, tile and piece in one place (#21 design §5).
import assert from 'node:assert/strict';
import { DECISIONS } from '../../src/lib/engine/kinds.js';
import { openDecisions } from '../../src/lib/engine/stack.js';
import { civsFor, tapestryFor, techDeck } from '../../src/lib/engine/decks.js';
import { techCard } from '../../src/lib/engine/data/tech-cards.js';
import { landmarksFor } from '../../src/lib/engine/data/landmarks.js';
import { artsInPlay, tracksOf } from '../../src/lib/engine/tracks-in-play.js';
import { MASTERPIECES } from '../../src/lib/engine/data/masterpieces.js';
import { landmarkCardsFor } from '../../src/lib/engine/data/landmark-cards.js';
import { TERRITORY_TILES } from '../../src/lib/engine/data/territory-tiles.js';
import { spaceTilesFor } from '../../src/lib/engine/data/space-tiles.js';
import {
	SMALL_MAP_PAIRS,
	advancedMatsFor,
} from '../../src/lib/engine/data/capitals.js';
import { RESOURCE_CAP } from '../../src/lib/engine/effects/gain.js';
import {
	UTILITARIANS_LANDMARKS,
	UTILITARIANS_TOKENS,
} from '../../src/lib/engine/civs/utilitarians.js';
import { BUILDING_IDS, RESOURCE_IDS } from '../../src/lib/engine/data/ids.js';
import { allOps } from './views.mjs';

/** @typedef {import('../../src/lib/engine/state.js').State} State */
/** @typedef {import('../../src/lib/engine/state.js').PlayerSeat} PlayerSeat */

/** Every income building of each kind a player owns (01 §2.2). */
const BUILDINGS_EACH = 5;
/** Every outpost a player owns: 2 start on the map, 8 in supply (01 §2.2). */
const OUTPOSTS = 10;
/** The tokens on the Traders', Isolationists' (02 §1.2) and Treasure Hunters' (03 §1.3) mats. */
const CIV_TOKENS = { traders: 4, isolationists: 4, 'treasure-hunters': 4 };
const MATS = [1, 2, 3, 4, 5, 6];
const TERRITORY_IDS = TERRITORY_TILES.map((t) => t.id);

/**
 * Asserts that `found` holds every id of `expected` exactly once, naming what is duplicated and what is missing.
 * @param {string} label
 * @param {readonly (string | number)[]} found
 * @param {readonly (string | number)[]} expected
 */
function exactlyOnce(label, found, expected) {
	/** @type {Map<string | number, number>} */
	const counts = new Map();
	for (const id of found) {
		counts.set(id, (counts.get(id) ?? 0) + 1);
	}
	const twice = [...counts].filter(([, n]) => n > 1).map(([id]) => id);
	const extra = [...counts.keys()].filter((id) => !expected.includes(id));
	const missing = expected.filter((id) => !counts.has(id));
	assert.ok(
		twice.length + extra.length + missing.length === 0,
		`${label}: twice [${twice}], unknown [${extra}], missing [${missing}]`
	);
}

/**
 * Checks the whole state after an action and throws an AssertionError naming the first broken invariant.
 * @param {State} state
 * @param {number} [previousSeq] - The state's `seq` before the action, which every new event must exceed
 */
export function checkState(state, previousSeq = 0) {
	const { supply } = state;
	const players = /** @type {PlayerSeat[]} */ (
		state.seats.filter((s) => s.kind === 'player')
	);
	const ops = allOps(state);
	const outposts = Object.values(state.hexes).flatMap((hex) => hex.outposts);
	const pieces = outposts.flatMap((o) => (o.piece ? [o.piece] : []));
	/** @param {string} kind */
	const opsOf = (kind) => ops.filter((op) => op.kind === kind);
	// A gained piece waits in its placement, asked or automatic, until it lands.
	const placing = ops.filter((op) =>
		['choosePlacement', 'placeLandmark', 'placeBuilding'].includes(op.kind)
	);

	// #33: the kind of the turn being taken, once chosen; there is none outside play, nor without a current player.
	assert.ok(
		[null, 'advance', 'income'].includes(state.turnKind),
		`turn kind ${state.turnKind}`
	);
	if (state.turnKind !== null) {
		assert.equal(state.phase, 'play', `a turn kind in ${state.phase}`);
		assert.notEqual(state.current, null, 'a turn kind with no turn');
	}

	exactlyOnce(
		'tech cards',
		[
			...supply.tech.deck,
			...supply.tech.faceUp,
			...supply.tech.discard,
			...players.flatMap((p) => [
				...p.tech.bottom,
				...p.tech.middle,
				...p.tech.top,
			]),
			// #33: the Recyclers' drawn cards wait in their keep question.
			...opsOf('chooseKeepTech').flatMap((op) => op.options),
		],
		techDeck(state.expansions, state.variants)
	);
	// #37: a landmark sits only on its holder's A&A landmark tech card (03 §2).
	for (const p of players) {
		const rows = [...p.tech.bottom, ...p.tech.middle, ...p.tech.top];
		for (const card of Object.keys(p.techLandmarks ?? {})) {
			assert.ok(
				rows.includes(card) && 'landmark' in techCard(card).requires,
				`seat ${p.seat}'s landmark on ${card}`
			);
		}
	}
	exactlyOnce(
		'tapestry cards',
		[
			...supply.tapestry.deck,
			...supply.tapestry.discard,
			...players.flatMap((p) => [
				...p.hand,
				...p.incomeMat.tapestry.flat(),
			]),
		],
		tapestryFor(state.expansions, state.variants)
	);
	exactlyOnce(
		'territory tiles',
		[
			...supply.territory,
			...supply.territoryDiscard,
			...players.flatMap((p) => p.territoryTiles),
			// #165: the tiles lying on the Islanders' mats.
			...players.flatMap((p) =>
				(p.civData.islanders?.hexes ?? []).flatMap(
					(/** @type {any} */ lying) => (lying ? [lying.tile] : [])
				)
			),
			// Printed territories (49 and up) are part of the map, not tiles.
			...Object.values(state.hexes).flatMap((hex) =>
				hex.tile !== null && TERRITORY_IDS.includes(hex.tile)
					? [hex.tile]
					: []
			),
		],
		TERRITORY_IDS
	);
	exactlyOnce(
		'space tiles',
		[
			...supply.space,
			...supply.spaceDiscard,
			...players.flatMap((p) => [
				...p.spaceTiles,
				...p.exploredSpace,
				// #33: the tile on the Aliens' mat.
				...(typeof p.civData.aliens?.tile === 'number'
					? [p.civData.aliens.tile]
					: []),
			]),
		],
		spaceTilesFor(state.expansions).map((t) => t.id)
	);
	// #35: with the arts track, each masterpiece is in the deck, face up, discarded or held, and each player's
	// inspiration tiles lie on different rows; without it there are neither.
	if (artsInPlay(state)) {
		const pile = /** @type {NonNullable<typeof supply.masterpieces>} */ (
			supply.masterpieces
		);
		exactlyOnce(
			'masterpieces',
			[
				...pile.deck,
				...pile.faceUp,
				...pile.discard,
				...players.flatMap((p) =>
					(p.masterpieces ?? []).map((held) => held.card)
				),
			],
			MASTERPIECES.map((m) => m.id)
		);
		assert.ok(pile.faceUp.length <= 3, 'more than 3 masterpieces face up');
		assert.ok(
			pile.faceUp.length === 3 ||
				pile.deck.length + pile.discard.length === 0,
			'fewer than 3 masterpieces face up with more to draw (R119)'
		);
		for (const p of players) {
			const rows = p.inspired ?? [];
			assert.ok(
				Array.isArray(p.masterpieces) && Array.isArray(p.inspired),
				`seat ${p.seat} has no masterpieces or inspiration tiles`
			);
			assert.equal(
				new Set(rows).size,
				rows.length,
				`seat ${p.seat} inspired a row twice`
			);
			assert.ok(
				rows.every((row) => BUILDING_IDS.includes(row)),
				`seat ${p.seat} inspired [${rows}]`
			);
		}
	} else {
		assert.ok(
			!('masterpieces' in supply),
			'masterpieces without the arts track'
		);
		for (const p of players) {
			assert.ok(
				!('masterpieces' in p) && !('inspired' in p),
				`seat ${p.seat} has masterpieces or tiles without the arts track`
			);
		}
	}
	// #32: each landmark card is in the deck, offered in the draft, or kept by one player.
	exactlyOnce(
		'landmark cards',
		[
			...supply.landmarkCards,
			// Infrastructure Upgrade's offer is the deck itself, still there (#37).
			...opsOf('chooseLandmarkCard')
				.filter((op) => op.purpose !== 'infrastructureUpgrade')
				.flatMap((op) => op.options),
			...players.flatMap((p) => [
				...(p.landmarkCard ? [p.landmarkCard.card] : []),
				// #37: Infrastructure Upgrade's.
				...(p.extraLandmarkCards ?? []).map((held) => held.card),
			]),
		],
		landmarkCardsFor(state.expansions).map((c) => c.id)
	);
	exactlyOnce(
		'civilizations',
		[
			...supply.civs,
			...supply.civDiscard,
			...players.flatMap((p) => [
				...p.civs,
				...(p.picks.civ !== undefined ? [p.picks.civ] : []),
			]),
			...opsOf('chooseCiv').flatMap((op) => op.options),
			...opsOf('chooseMatAndCiv').flatMap((op) => op.civs),
			// #37: Plague's drawn civilization, while its player decides.
			...opsOf('chooseSlot')
				.filter((op) => op.purpose === 'plague')
				.map((op) => op.then.civ),
			...opsOf('plagueChoice').map((op) => op.civ),
		],
		civsFor(state.expansions, state.variants)
	);
	exactlyOnce(
		'capital mats',
		[
			...supply.capitals,
			...players.flatMap((p) => {
				if (p.capital.mat !== null) {
					return [p.capital.mat];
				}
				// Until the reveal, a kept mat holds every mat dealt with it (#36), or its small-map pair: the others
				// join the supply then.
				const kept = p.picks.capital;
				if (kept === undefined) {
					return [];
				}
				return (
					p.picks.dealt ??
					SMALL_MAP_PAIRS.find((pair) => pair.includes(kept)) ?? [
						kept,
					]
				);
			}),
			...opsOf('chooseCapital').flatMap((op) => op.options),
			...opsOf('chooseMatAndCiv').flatMap((op) => op.mats),
		],
		[...MATS, ...advancedMatsFor(state.expansions)]
	);
	exactlyOnce(
		'landmarks',
		[
			...state.landmarks,
			// #37: discarded with their tech card, out of the game.
			...(supply.landmarkDiscard ?? []),
			...players.flatMap((p) => [
				...p.capital.landmarks.map((piece) => piece.landmark),
				...p.besideMat.filter(
					(id) => !BUILDING_IDS.includes(/** @type {any} */ (id))
				),
				// #37: on A&A's landmark tech cards, each holding one, in a row of its owner's.
				...Object.values(p.techLandmarks ?? {}),
				// #37: on A&A's tapestry cards.
				...Object.values(p.onCards ?? {}).flatMap((pieces) =>
					pieces.flatMap((piece) =>
						'landmark' in piece ? [piece.landmark] : []
					)
				),
			]),
			...pieces.flatMap((piece) =>
				'landmark' in piece ? [piece.landmark] : []
			),
			...placing.flatMap((op) =>
				op.landmark !== undefined ? [op.landmark] : []
			),
		],
		landmarksFor(state.expansions, state.variants).map((l) => l.id)
	);

	// #33: only the Infiltrators share a territory, which then holds the upright outposts of two seats or more; nothing
	// topples there, as two items stop a conquest (03 §1.3).
	for (const [key, hex] of Object.entries(state.hexes)) {
		if (hex.shared === undefined) {
			continue;
		}
		const sharing = new Set(
			hex.outposts.filter((o) => !o.toppled).map((o) => o.seat)
		);
		assert.ok(
			hex.shared === true &&
				state.expansions.includes('pp') &&
				sharing.size >= 2,
			`${key} is shared by ${sharing.size} seats`
		);
	}

	for (const p of players) {
		const mine = outposts.filter((o) => o.seat === p.seat);
		for (const building of BUILDING_IDS) {
			const count =
				p.incomeMat.buildings[building] +
				p.capital.buildings.filter((b) => b.building === building)
					.length +
				p.besideMat.filter((id) => id === building).length +
				(p.civData.craftsmen ?? [])
					.flat()
					.filter((/** @type {string} */ id) => id === building)
					.length +
				mine.filter(
					(o) =>
						o.piece &&
						'building' in o.piece &&
						o.piece.building === building
				).length +
				// #37: on A&A's tapestry cards.
				Object.values(p.onCards ?? {})
					.flat()
					.filter(
						(piece) =>
							'building' in piece && piece.building === building
					).length +
				placing.filter(
					(op) => op.player === p.seat && op.building === building
				).length;
			assert.equal(
				count,
				BUILDINGS_EACH,
				`seat ${p.seat} owns ${count} ${building} buildings`
			);
		}
		const own = p.outposts + mine.filter((o) => !o.piece).length;
		assert.equal(own, OUTPOSTS, `seat ${p.seat} owns ${own} outposts`);
		for (const [civ, total] of Object.entries(CIV_TOKENS)) {
			const data = p.civData[civ];
			if (data === undefined) {
				continue;
			}
			const placed = Object.values(state.hexes).flatMap((hex) =>
				hex.tokens.filter((t) => t.seat === p.seat && t.civ === civ)
			).length;
			assert.equal(
				data.tokens + placed,
				total,
				`seat ${p.seat} owns ${data.tokens + placed} ${civ} tokens`
			);
		}
		// #33: the Infiltrators' player tokens stand only on an opponent's capital-city territory (03 §1.3).
		for (const [key, hex] of Object.entries(state.hexes)) {
			for (const token of hex.tokens) {
				if (token.seat !== p.seat || token.civ !== 'infiltrators') {
					continue;
				}
				const owner = players.find((other) => other.start === key);
				assert.ok(
					owner !== undefined && owner.seat !== p.seat,
					`seat ${p.seat} has an infiltrators token on ${key}, no opponent's capital-city territory`
				);
			}
		}
		// #33: the Utilitarians' tokens out, each beside a listed landmark the seat owns or is placing (03 §1.3).
		const active = p.civData.utilitarians?.active;
		if (active !== undefined) {
			const owned = [
				...p.capital.landmarks.map((piece) => piece.landmark),
				...p.besideMat,
				...mine.flatMap((o) =>
					o.piece && 'landmark' in o.piece ? [o.piece.landmark] : []
				),
				...placing
					.filter((op) => op.player === p.seat)
					.map((op) => op.landmark),
			];
			assert.ok(
				active.length <= UTILITARIANS_TOKENS &&
					new Set(active).size === active.length &&
					active.every(
						(/** @type {string} */ id) =>
							UTILITARIANS_LANDMARKS.includes(id) &&
							owned.includes(id)
					),
				`seat ${p.seat} has utilitarians tokens beside [${active}]`
			);
		}
		for (const resource of RESOURCE_IDS) {
			const value = p.resources[resource];
			assert.ok(
				Number.isInteger(value) && value >= 0 && value <= RESOURCE_CAP,
				`seat ${p.seat} has ${value} ${resource}`
			);
		}
		assert.ok(Number.isInteger(p.vp), `seat ${p.seat} has ${p.vp} VP`);
		// #29: every VP gained or paid is credited to a source, so the sources add up to the VP.
		const credited = Object.values(p.vpSources).reduce((a, b) => a + b, 0);
		assert.equal(
			credited,
			p.vp,
			`seat ${p.seat}'s VP sources add up to ${credited}, not ${p.vp}`
		);
		// The tracks in play, the arts track's too, and no other (#35).
		assert.deepEqual(
			Object.keys(p.tracks),
			tracksOf(state),
			`seat ${p.seat}'s tracks`
		);
		for (const track of tracksOf(state)) {
			for (const space of p.tracks[track]) {
				assert.ok(
					Number.isInteger(space) && space >= 0 && space <= 12,
					`seat ${p.seat} has a token on ${track} space ${space}`
				);
			}
		}
		if (p.finished) {
			assert.equal(p.era, null, `finished seat ${p.seat} has an era`);
		} else if (p.era?.card) {
			const card = p.era.card;
			assert.ok(
				p.incomeMat.tapestry.some((slot) => slot.at(-1) === card),
				`seat ${p.seat}'s era card ${card} is not on top of a slot`
			);
		}
	}

	state.events.forEach((event, i) => {
		if (i > 0) {
			// Undo takes the log back, so the numbers jump only just before an 'undone' event.
			const previous = state.events[i - 1].seq;
			if (event.type === 'undone') {
				assert.ok(
					event.seq > previous,
					`undone seq ${event.seq} follows ${previous}`
				);
				assert.equal(
					event.from,
					previous + 1,
					`undone from ${event.from} is not ${previous + 1}`
				);
			} else {
				assert.equal(
					event.seq,
					previous + 1,
					`event seq ${event.seq} follows ${previous}`
				);
			}
		}
	});
	if (state.events.length > 0) {
		assert.equal(state.events.at(-1)?.seq, state.seq, 'the last seq');
		assert.ok(
			state.seq >= previousSeq,
			`seq went from ${previousSeq} down to ${state.seq}`
		);
	}

	const ids = ops.map((op) => op.id);
	assert.equal(new Set(ids).size, ids.length, 'decision ids are not unique');
	if (state.phase !== 'over') {
		const open = openDecisions(state);
		assert.ok(
			open.length > 0,
			'the game is not over, but no decision is open'
		);
		for (const op of open) {
			assert.ok(
				DECISIONS[op.kind].answers(state, op).length > 0,
				`seat ${op.player}'s open ${op.kind} has no legal answer`
			);
		}
	}
}
