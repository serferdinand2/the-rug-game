// The state invariants the simulation checks after every action: every card, tile and piece in one place (#21 design §5).
import assert from 'node:assert/strict';
import { DECISIONS } from '../../src/lib/engine/kinds.js';
import { openDecisions } from '../../src/lib/engine/stack.js';
import {
	BASE_CIVS,
	BASE_TAPESTRY,
	techDeck,
} from '../../src/lib/engine/decks.js';
import { LANDMARKS } from '../../src/lib/engine/data/landmarks.js';
import { TERRITORY_TILES } from '../../src/lib/engine/data/territory-tiles.js';
import { SPACE_TILES } from '../../src/lib/engine/data/space-tiles.js';
import { SMALL_MAP_PAIRS } from '../../src/lib/engine/data/capitals.js';
import { RESOURCE_CAP } from '../../src/lib/engine/effects/gain.js';
import {
	BUILDING_IDS,
	RESOURCE_IDS,
	TRACK_IDS,
} from '../../src/lib/engine/data/ids.js';
import { allOps } from './views.mjs';

/** @typedef {import('../../src/lib/engine/state.js').State} State */
/** @typedef {import('../../src/lib/engine/state.js').PlayerSeat} PlayerSeat */

/** Every income building of each kind a player owns (01 §2.2). */
const BUILDINGS_EACH = 5;
/** Every outpost a player owns: 2 start on the map, 8 in supply (01 §2.2). */
const OUTPOSTS = 10;
/** The tokens on the Traders' and Isolationists' mats (02 §1.2). */
const CIV_TOKENS = { traders: 4, isolationists: 4 };
const MATS = [1, 2, 3, 4, 5, 6];
const TERRITORY_IDS = TERRITORY_TILES.map((t) => t.id);
const SPACE_IDS = SPACE_TILES.map((t) => t.id);
const LANDMARK_IDS = LANDMARKS.map((l) => l.id);

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
		],
		techDeck(state.variants)
	);
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
		BASE_TAPESTRY
	);
	exactlyOnce(
		'territory tiles',
		[
			...supply.territory,
			...supply.territoryDiscard,
			...players.flatMap((p) => p.territoryTiles),
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
			...players.flatMap((p) => [...p.spaceTiles, ...p.exploredSpace]),
		],
		SPACE_IDS
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
		],
		BASE_CIVS
	);
	exactlyOnce(
		'capital mats',
		[
			...supply.capitals,
			...players.flatMap((p) => {
				if (p.capital.mat !== null) {
					return [p.capital.mat];
				}
				// Until the reveal, a kept small-map mat holds its pair: the other one joins the supply then.
				const kept = p.picks.capital;
				return kept === undefined
					? []
					: (SMALL_MAP_PAIRS.find((pair) => pair.includes(kept)) ?? [
							kept,
						]);
			}),
			...opsOf('chooseCapital').flatMap((op) => op.options),
		],
		MATS
	);
	exactlyOnce(
		'landmarks',
		[
			...state.landmarks,
			...players.flatMap((p) => [
				...p.capital.landmarks.map((piece) => piece.landmark),
				...p.besideMat.filter(
					(id) => !BUILDING_IDS.includes(/** @type {any} */ (id))
				),
			]),
			...pieces.flatMap((piece) =>
				'landmark' in piece ? [piece.landmark] : []
			),
			...placing.flatMap((op) =>
				op.landmark !== undefined ? [op.landmark] : []
			),
		],
		LANDMARK_IDS
	);

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
		for (const track of TRACK_IDS) {
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
