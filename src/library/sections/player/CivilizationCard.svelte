<!-- Library section: CivilizationCard, extracted from the reviewed cards; the six card civilizations' live state and choices (#78). -->
<script>
	import CivilizationCard from '../../../lib/components/player/CivilizationCard.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
	import { REVIEWED_CIVILIZATIONS } from '../../../lib/cards/reviewed-civilizations.js';
	import { civCardView } from '../../../lib/civ-card.js';
	import { civilizationName } from '../../../lib/game-names.js';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/**
	 * A game view in which `seat` holds `data` for `civ`, as civCardView reads it.
	 * @param {number} seat
	 * @param {string} civ
	 * @param {any} data
	 */
	function seatGame(seat, civ, data) {
		return {
			seats: [1, 2, 3, 4, 5].map((each) => ({
				seat: each,
				kind: 'player',
				name: `Seat ${each}`,
				civData: each === seat ? { [civ]: data } : {},
			})),
		};
	}

	/**
	 * A seat's card as it stands, offering the answers given on it.
	 * @param {1 | 2 | 3 | 4 | 5} seat
	 * @param {string} civ
	 * @param {any} data - The seat's civData for the civilization
	 * @param {any} [decision] - The open decision, without its player
	 */
	function liveCard(seat, civ, data, decision) {
		return civCardView(
			seatGame(seat, civ, data),
			seat,
			civ,
			decision ? { ...decision, player: seat } : null
		);
	}

	/** @param {string} purpose @param {any[]} slots */
	const slotDecision = (purpose, slots) => ({
		kind: 'chooseSlot',
		purpose,
		answers: slots.map((slot) => ({ slot })),
	});

	/**
	 * Each card civilization's live examples: a state that differs from the illustration, then a decision on it. The
	 * decisions go to seats whose colour is neither the available green nor the picked gold.
	 */
	const LIVE = [
		{
			civ: 'entertainers',
			seat: /** @type {const} */ (3),
			now: { at: 'c2r3' },
			nowLabel: "{ at: 'c2r3' }",
			choosingSeat: /** @type {const} */ (2),
			then: { at: 'c1r2' },
			decision: slotDecision('entertainers', ['c2r2', 'c2r3']),
			choosingLabel:
				"token on c1r2, choices c2r2 and c2r3 · selected='c2r2'",
			selected: 'c2r2',
		},
		{
			civ: 'entertainers',
			seat: /** @type {const} */ (4),
			now: { at: 'start' },
			nowLabel: "{ at: 'start' }",
		},
		{
			civ: 'merrymakers',
			seat: /** @type {const} */ (3),
			now: { levels: [1, 0, 2] },
			nowLabel: '{ levels: [1, 0, 2] }',
			choosingSeat: /** @type {const} */ (5),
			then: { levels: [1, 0, 2] },
			decision: slotDecision('merrymakers', [0, 1, 2]),
			choosingLabel: "choices m0l2, m1l1 and m2l3 · selected='m2l3'",
			selected: 'm2l3',
		},
		{
			civ: 'leaders',
			seat: /** @type {const} */ (4),
			now: { used: ['technology'] },
			nowLabel: "{ used: ['technology'] }",
			choosingSeat: /** @type {const} */ (1),
			then: { used: ['exploration'] },
			decision: slotDecision('leaders', [
				'science',
				'technology',
				'military',
				null,
			]),
			choosingLabel:
				"exploration used, choices science, technology and military · selected='military'",
			selected: 'military',
		},
		{
			civ: 'militants',
			seat: /** @type {const} */ (3),
			now: {
				top: [false, false, true, true],
				bottom: [false, true, true, true],
			},
			nowLabel:
				'{ top: [false, false, true, true], bottom: [false, true, true, true] }',
			choosingSeat: /** @type {const} */ (2),
			then: {
				top: [false, true, true, true],
				bottom: [false, false, true, true],
			},
			decision: slotDecision('militantsRow', ['top', 'bottom']),
			choosingLabel:
				"militantsRow, choices top1 and bottom2 · selected='top1'",
			selected: 'top1',
		},
		{
			civ: 'historians',
			seat: /** @type {const} */ (4),
			now: { squares: [true, false, true, false], given: { 1: 1, 3: 1 } },
			nowLabel: '{ squares: [true, false, true, false] }',
			choosingSeat: /** @type {const} */ (5),
			then: { squares: [false, true, true, true], given: { 1: 1 } },
			decision: slotDecision('historians', [
				{ to: 1, square: 1 },
				{ to: 1, square: 2 },
				{ to: 3, square: 1 },
				{ to: 3, square: 2 },
				null,
			]),
			choosingLabel: "choices square1 and square2 · selected='square1'",
			selected: 'square1',
		},
		{
			civ: 'mystics',
			seat: /** @type {const} */ (3),
			now: {
				predictions: {
					techCards: 6,
					districts: 2,
					territories: 7,
					tracks: 3,
				},
				reached: ['districts'],
			},
			nowLabel:
				"{ predictions: { techCards: 6, districts: 2, territories: 7, tracks: 3 }, reached: ['districts'] }",
			choosingSeat: /** @type {const} */ (1),
			then: { predictions: { techCards: 5 }, reached: [] },
			decision: {
				kind: 'chooseProphecy',
				category: 'districts',
				answers: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => ({
					value,
				})),
			},
			choosingLabel:
				"chooseProphecy for districts, choices 1 to 9 · selected='districts:4'",
			selected: 'districts:4',
		},
	];

	/** The spot picked on each choosing example, by its index in LIVE. */
	let picked = $state(LIVE.map((example) => example.selected ?? null));

	/**
	 * A choosing example's pick becomes its selected spot.
	 * @param {number} index - The example's index in LIVE
	 * @param {ComponentEvent} event - Its value is the spot id
	 */
	const cardPickHandler = (index, event) => {
		picked[index] = event.value;
	};
</script>

<Section
	name="CivilizationCard"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules. The six card civilizations draw a seat's live state and offer a decision's spots on the card (#78)."
	>{#each REVIEWED_CIVILIZATIONS as card}<Example
			label={`${civilizationName(card.id)} · ${card.edition}`}
			width={425}
			><CivilizationCard
				id={card.id}
				state="play" /></Example
		>{/each}<Example
		label="The Infiltrators (Plans &amp; Ploys) · no layout until its expansion: frame, portrait and name only"
		width={425}
		><CivilizationCard
			id="infiltrators"
			state="empty" /></Example
	>{#each LIVE as example, index (index)}<Example
			label={`id="${example.civ}" live={civCardView(…, ${example.nowLabel})} seat={${example.seat}}`}
			width={425}
			><CivilizationCard
				id={example.civ}
				live={liveCard(example.seat, example.civ, example.now)}
				seat={example.seat} /></Example
		>{#if example.choosingSeat}<Example
				label={`id="${example.civ}" live={civCardView(…, decision)}: ${example.choosingLabel} · seat={${example.choosingSeat}} onCivilizationCardPick`}
				width={425}
				><CivilizationCard
					id={example.civ}
					live={liveCard(
						example.choosingSeat,
						example.civ,
						example.then,
						example.decision
					)}
					seat={example.choosingSeat}
					selected={picked[index]}
					onCivilizationCardPick={(
						/** @type {ComponentEvent} */ event
					) => cardPickHandler(index, event)} /></Example
			>{/if}{/each}</Section>
