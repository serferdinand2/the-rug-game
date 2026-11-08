<!-- Library section: MasterpieceRow, the face-up masterpieces and the deck on the arts track's line (#35 part 4). -->
<script>
	import MasterpieceRow from '../../../lib/components/board/MasterpieceRow.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {string | null} */
	let shown = $state(null);
</script>

<Section
	name="MasterpieceRow"
	area="board"
	description="The 3 face-up masterpieces and the deck's count, on the arts track's line beside its name (owner, #35 part 4). Pointing at a card reports it, so the shared area shows it in full.">
	<Example label={`faceUp deck={14}  (pointed at: ${shown ?? 'none'})`}>
		<MasterpieceRow
			faceUp={['painting', 'ballet', 'topiary']}
			deck={14}
			onMasterpieceRowInspect={(
				/** @type {import('../../../lib/component-event.js').ComponentEvent} */ event
			) => (shown = event.value)} />
	</Example>
	<Example
		label={'faceUp={2 cards} deck={0}  (R119: no discards left to shuffle)'}>
		<MasterpieceRow
			faceUp={['fresco', 'mime']}
			deck={0} />
	</Example>
</Section>
