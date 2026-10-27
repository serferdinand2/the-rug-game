<!-- Library section: CardShelf, the cards a decision offers, for tapestry cards, tech cards, civilizations and capital mats. -->
<script>
	import CardShelf from '../../../lib/components/prompts/CardShelf.svelte';
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
	let inspected = $state('');
</script>

<Section
	name="CardShelf"
	area="prompts"
	description="The cards a decision offers, in a row above the panel. Each card is a button; the chosen one is outlined in gold, and a tapestry or tech card is also lifted. Civilization cards are whole, 425 px wide at their own height, shrinking only as far as the shelf's height needs (never below 0.75), and capital mats are their 9×9 grid of terrain tiles; each sizes its own button, so the outline fits it. Hovering or focusing a card reports it so the screen can show it in full.">
	<Example
		label={`kind="tapestry"  (selected ${tapestry})${inspected ? `  · inspecting ${inspected}` : ''}`}
		surface="ink"
		wide>
		<CardShelf
			kind="tapestry"
			cards={[
				{ index: 0, id: 'academia', label: 'Academia' },
				{ index: 1, id: 'age-of-discovery', label: 'Age of Discovery' },
				{ index: 2, id: 'capitalism', label: 'Capitalism' },
			]}
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
			].map((id, index) => ({ index, id, label: id }))}
			selected={null} />
	</Example>
	<Example
		label={`kind="tech" with the deck  (selected ${tech})`}
		surface="ink"
		wide>
		<CardShelf
			kind="tech"
			cards={[
				{ index: 0, id: 'clocks', label: 'Clocks' },
				{ index: 1, id: 'bakery', label: 'Bakery' },
				{ index: 2, id: 'compass', label: 'Compass' },
				{ index: 3, id: 'deck', label: 'Top of the deck', deck: 21 },
			]}
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
			cards={[
				{ index: 0, id: 'collectors', label: 'Collectors' },
				{ index: 1, id: 'nomads', label: 'Nomads' },
			]}
			selected={civ}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				(civ = event.value)} />
	</Example>
	<Example
		label={`kind="mat"  (each mat's own grid, 380px · selected ${mat})`}
		surface="ink"
		wide>
		<CardShelf
			kind="mat"
			cards={[
				{ index: 0, id: '1', label: 'Mountain mat' },
				{ index: 1, id: '2', label: 'Second mat' },
			]}
			selected={mat}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				(mat = event.value)} />
	</Example>
</Section>
