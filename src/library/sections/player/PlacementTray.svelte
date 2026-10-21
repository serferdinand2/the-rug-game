<!-- Library section: PlacementTray with one or two landmarks, selected, as a return target, and hidden when empty. -->
<script>
	import PlacementTray from '../../../lib/components/player/PlacementTray.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { FOOTPRINTS } from '../../../lib/art/footprints.js';

	const LIGHTHOUSE = {
		id: 'lighthouse',
		name: 'Lighthouse',
		footprint: FOOTPRINTS.lighthouse,
		color: 'var(--exploration)',
	};
	const FORGE = { id: 'forge', name: 'Forge', footprint: FOOTPRINTS.forge };

	/** @type {string | null} */
	let selectedId = $state('lighthouse');
</script>

<Section
	name="PlacementTray"
	area="player"
	description="The To be placed tray under the capital. It shows only while a landmark is waiting or a placed one is being dragged back. Items can be selected for click-to-place, dragged onto the grid, or moved there with an arrow key.">
	<Example
		label={`items={[Lighthouse, Forge]} selectedId=${selectedId ? `"${selectedId}"` : '{null}'}  (click an item)`}
		width={468}>
		<PlacementTray
			items={[LIGHTHOUSE, FORGE]}
			{selectedId}
			onPlacementTraySelect={(
				/** @type {import('../../../lib/component-event.js').ComponentEvent} */ event
			) =>
				(selectedId =
					selectedId === event.value.id ? null : event.value.id)} />
	</Example>
	<Example
		label={'items={[Lighthouse]}'}
		width={468}>
		<PlacementTray items={[LIGHTHOUSE]} />
	</Example>
	<Example
		label={'items={[Lighthouse]} selectedId="lighthouse"'}
		width={468}>
		<PlacementTray
			items={[LIGHTHOUSE]}
			selectedId="lighthouse" />
	</Example>
	<Example
		label={'items={[]} returnTarget  (a placed piece is being dragged back)'}
		width={468}>
		<PlacementTray returnTarget />
	</Example>
	<Example
		label={'items={[]}  (renders nothing)'}
		width={468}>
		<PlacementTray />
	</Example>
</Section>
