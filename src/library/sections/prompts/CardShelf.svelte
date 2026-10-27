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
	description="The cards a decision offers, in a row above the panel. Each card is a button; the chosen one is outlined in gold and lifted. Hovering or focusing a card reports it so the screen can show it in full.">
	<Example
		label={`kind="tapestry"  (selected ${tapestry})${inspected ? `  · inspecting ${inspected}` : ''}`}
		surface="ink"
		wide>
		<CardShelf
			kind="tapestry"
			cards={[
				{ index: 0, id: 'academia', label: 'Academia' },
				{ index: 1, id: 'age-of-discovery', label: 'Age of Discovery' },
				{ index: 2, id: 'ammonia', label: 'Ammonia' },
			]}
			selected={tapestry}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				(tapestry = event.value)}
			onCardShelfInspect={(/** @type {ComponentEvent} */ event) =>
				(inspected =
					event.value === null ? '' : String(event.value))} />
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
		label={`kind="mat"  (selected ${mat})`}
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
