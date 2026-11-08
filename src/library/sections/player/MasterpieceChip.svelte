<!-- Library section: MasterpieceChip, a masterpiece as a chip, tiny and small, and face down once used (#35 part 4). -->
<script>
	import MasterpieceChip from '../../../lib/components/player/MasterpieceChip.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {string | null} */
	let shown = $state(null);
</script>

<Section
	name="MasterpieceChip"
	area="player"
	description="One masterpiece as a chip: its picture and name on the card paper, tiny on the arts track's line and small in the player area. A used single-use card lies face down, the arts symbol and 'used', and shows no card. Pointing at a chip, or focusing it, reports its id so the shared area can show the card.">
	<Example label={`size="small"  (pointed at: ${shown ?? 'none'})`}>
		<MasterpieceChip
			id="painting"
			onMasterpieceChipInspect={(
				/** @type {import('../../../lib/component-event.js').ComponentEvent} */ event
			) => (shown = event.value)} />
	</Example>
	<Example label={'size="tiny"'}>
		<MasterpieceChip
			id="ballet"
			size="tiny" />
	</Example>
	<Example label={'used  (Art Deco and Mime, face down once used)'}>
		<MasterpieceChip
			id="mime"
			used />
	</Example>
	<Example label={`data-cards="dark" on the page  (the menu's Dark cards)`}>
		<div data-cards="dark">
			<MasterpieceChip id="krav-maga" />
		</div>
	</Example>
</Section>
