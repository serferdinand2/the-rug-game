<!-- Library section: PlacementTray with one or two landmarks, selected, with turn buttons, as a return target, and hidden when empty, and pieces placed and gained in turn (#175). -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
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
	/** The turned example's quarter turns. */
	let turn = $state(0);

	/** The landmarks of the placing example (#175). */
	const MOVING = [
		LIGHTHOUSE,
		FORGE,
		{
			id: 'apothecary',
			name: 'Apothecary',
			footprint: FOOTPRINTS.apothecary,
		},
	];
	let waiting = $state([...MOVING]);
</script>

<Section
	name="PlacementTray"
	area="player"
	description="The To be placed tray under the capital. It shows only while a landmark is waiting or a placed one is being dragged back. Items can be selected for click-to-place, dragged onto the grid, or moved there with an arrow key. With onPlacementTrayTurn, each has turn buttons, and lands at that turn (#174).">
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
		label={"items={[Forge]} with children: A&A's cards that may take it, in the same box (#184)"}
		width={468}>
		<PlacementTray items={[FORGE]}>
			<p style="margin: 0; color: var(--muted);">
				Or on a card: the Capital tab draws Monuments' lit squares and
				Astrolabe here.
			</p>
		</PlacementTray>
	</Example>
	<Example
		label={`items={[Forge, rotation ${turn}]} onPlacementTrayTurn  (press the turn buttons)`}
		width={468}>
		<PlacementTray
			items={[{ ...FORGE, rotation: turn }]}
			onPlacementTrayTurn={(
				/** @type {import('../../../lib/component-event.js').ComponentEvent} */ event
			) => (turn = (turn + event.value.step + 4) % 4)} />
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
	<Example
		label={`items={${waiting.length} landmarks}  (place one: the others close up; gain one: it rises in; #175)`}
		width={468}>
		<PlacementTray items={waiting} />
		<span class="rg-library-placement-tray--buttons">
			<Button
				size="small"
				disabled={waiting.length === 0}
				onButtonClick={() => (waiting = waiting.slice(1))}
				>Place the first</Button>
			<Button
				size="small"
				disabled={waiting.length === MOVING.length}
				onButtonClick={() =>
					(waiting = [
						...waiting,
						MOVING.find((item) => !waiting.includes(item)) ??
							MOVING[0],
					])}>Gain one</Button>
		</span>
	</Example>
</Section>

<style>
	.rg-library-placement-tray--buttons {
		display: flex;
		gap: var(--space-5);
		margin-top: var(--space-6);
	}
</style>
