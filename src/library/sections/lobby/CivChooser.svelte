<!-- Library section: CivChooser for the fifth seat's purple player, and with a current choice marked. -->
<script>
	import CivChooser from '../../../lib/components/lobby/CivChooser.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	const CIVILIZATIONS = [
		'Architects',
		'Alchemists',
		'Futurists',
		'Militants',
		'Nomads',
	];

	/** @type {string | null} */
	let chosen = $state(null);
	let lastEvent = $state('');

	/**
	 * @param {ComponentEvent} event
	 */
	const pickHandler = (event) => {
		chosen = event.value.civilization;
		lastEvent = 'onCivChooserPick';
	};

	/** The parent decides what Random means; here it simply takes the next civilization in the list. */
	function chooseNext() {
		const index = CIVILIZATIONS.indexOf(chosen ?? '');
		chosen = CIVILIZATIONS[(index + 1) % CIVILIZATIONS.length];
		lastEvent = 'onCivChooserRandom';
	}
</script>

<Section
	name="CivChooser"
	area="lobby"
	description="The civilization chooser that opens under the players. Its border takes the colour of the player being edited, not always yours. Random reports the press; the parent picks the civilization.">
	<Example
		label={`seat={5} selected=${chosen ? `"${chosen}"` : '{null}'}  (pick a tile or Random)${lastEvent ? `  · last: ${lastEvent}` : ''}`}
		surface="surface"
		width={1000}>
		<CivChooser
			seat={5}
			civilizations={CIVILIZATIONS}
			selected={chosen}
			onCivChooserPick={pickHandler}
			onCivChooserRandom={chooseNext} />
	</Example>
	<Example
		label={'seat={1} selected="Alchemists"'}
		surface="surface"
		width={1000}>
		<CivChooser
			seat={1}
			civilizations={CIVILIZATIONS}
			selected="Alchemists" />
	</Example>
</Section>
