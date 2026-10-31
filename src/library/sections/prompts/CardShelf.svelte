<!-- Library section: CardShelf, the cards a decision offers, for tapestry cards, tech cards, civilizations, capital mats and landmark cards. -->
<script>
	import CardShelf from '../../../lib/components/prompts/CardShelf.svelte';
	import { shelfFace } from '../../../lib/prompts.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/** @type {number | null} */
	let tapestry = $state(1);
	/** @type {number | null} */
	let tech = $state(null);
	/** @type {number | null} */
	let civ = $state(null);
	/** @type {number | null} */
	let mat = $state(0);
	/** @type {number | null} */
	let landmark = $state(0);
	/** @type {number[]} */
	let paid = $state([0, 2]);
	let inspected = $state('');

	/**
	 * Shelf cards with their faces, as the prompt state hands them over (#118).
	 * @param {import('../../../lib/decision-kinds.js').Shelf} kind
	 * @param {[id: string, label: string][]} cards
	 * @param {number} [deck] - The tech deck's count, for a 'deck' card
	 */
	const cardsOf = (kind, cards, deck) =>
		cards.map(([id, label], index) => ({
			index,
			label,
			face: shelfFace(kind, id, deck),
		}));
</script>

<Section
	name="CardShelf"
	area="prompts"
	description="The cards a decision offers, in a row above the panel. Each card is a button; the chosen one is outlined in gold, and a tapestry or tech card is also lifted. Civilization cards are whole, 425 px wide at their own height, shrinking only as far as the shelf's height needs (never below 0.75), capital mats are their 9×9 grid of terrain tiles, and Plans & Ploys' landmark cards are whole, 319 px wide (#32); each sizes its own button, so the outline fits it. Hovering or focusing a card reports it so the screen can show it in full.">
	<Example
		label={`kind="tapestry"  (selected ${tapestry})${inspected ? `  · inspecting ${inspected}` : ''}`}
		surface="ink"
		wide>
		<CardShelf
			kind="tapestry"
			cards={cardsOf('tapestry', [
				['academia', 'Academia'],
				['age-of-discovery', 'Age of Discovery'],
				['capitalism', 'Capitalism'],
			])}
			selected={tapestry}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				(tapestry = event.value)}
			onCardShelfInspect={(/** @type {ComponentEvent} */ event) =>
				(inspected =
					event.value === null ? '' : String(event.value))} />
	</Example>
	<Example
		label={'kind="tapestry" with six cards  (more than four fan out; a row too wide for the shelf scrolls)'}
		surface="ink"
		wide>
		<CardShelf
			kind="tapestry"
			cards={[
				'academia',
				'age-of-discovery',
				'capitalism',
				'monarchy',
				'colonialism',
				'trap-1',
			].map((id, index) => ({
				index,
				label: id,
				face: shelfFace('tapestry', id),
			}))}
			selected={null} />
	</Example>
	<Example
		label={`kind="tech" with the deck  (selected ${tech})`}
		surface="ink"
		wide>
		<CardShelf
			kind="tech"
			cards={cardsOf(
				'tech',
				[
					['clocks', 'Clocks'],
					['bakery', 'Bakery'],
					['compass', 'Compass'],
					['deck', 'Top of the deck'],
				],
				21
			)}
			selected={tech}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				(tech = event.value)} />
	</Example>
	<Example
		label={`kind="civ"  (one reviewed, one plain · selected ${civ})`}
		surface="ink"
		wide>
		<CardShelf
			kind="civ"
			cards={cardsOf('civ', [
				['collectors', 'Collectors'],
				['nomads', 'Nomads'],
			])}
			selected={civ}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				(civ = event.value)} />
	</Example>
	<Example
		label={'kind="civ" room={460}  (the height a decision panel leaves the shelf: the row shrinks to fit it, never below 0.75; #57, #79)'}
		surface="ink"
		wide>
		<CardShelf
			kind="civ"
			cards={cardsOf('civ', [
				['collectors', 'Collectors'],
				['nomads', 'Nomads'],
			])}
			room={460} />
	</Example>
	<Example
		label={`kind="mat"  (each mat's own grid, 380px · selected ${mat})`}
		surface="ink"
		wide>
		<CardShelf
			kind="mat"
			cards={cardsOf('mat', [
				['1', 'Mountain mat'],
				['2', 'Second mat'],
			])}
			selected={mat}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				(mat = event.value)} />
	</Example>
	<Example
		label={`kind="landmark"  (the landmark-card draft, #32 · selected ${landmark})`}
		surface="ink"
		wide>
		<CardShelf
			kind="landmark"
			cards={cardsOf('landmark', [
				['skyscraper', 'Skyscraper'],
				['tv-station', 'TV Station'],
				['urban-farm', 'Urban Farm'],
			])}
			selected={landmark}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				(landmark = event.value)} />
	</Example>
	<Example
		label={`kind="tapestry" selected={[${paid.join(', ')}]}  (paying 2 cards: several chosen)`}
		surface="ink"
		wide>
		<CardShelf
			kind="tapestry"
			cards={cardsOf('tapestry', [
				['academia', 'Academia'],
				['age-of-discovery', 'Age of Discovery'],
				['capitalism', 'Capitalism'],
			])}
			selected={paid}
			disabled={paid.length >= 2
				? [0, 1, 2].filter((i) => !paid.includes(i))
				: []}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				(paid = paid.includes(event.value)
					? paid.filter((i) => i !== event.value)
					: [...paid, event.value])} />
	</Example>
</Section>
