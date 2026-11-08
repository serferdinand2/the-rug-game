<!-- MasterpieceRow: the 3 face-up masterpieces and the deck, on the arts track's line beside its name (owner, #35 part 4). -->
<script module>
	/**
	 * Properties of the MasterpieceRow component itself.
	 * @typedef {Object} MasterpieceRowOwnProps
	 * @property {string[]} faceUp - The face-up masterpieces, up to 3
	 * @property {number} deck - The cards left in the face-down deck
	 * @property {Function} [onMasterpieceRowInspect] - Callback fired with a face-up card's id when it is hovered or focused, and with null on leave
	 */
	/**
	 * Properties for the MasterpieceRow component, including any attributes for its root element.
	 * @typedef {MasterpieceRowOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} MasterpieceRowProps
	 *
	 * @example
	 * <MasterpieceRow faceUp={['painting', 'ballet', 'topiary']} deck={14} onMasterpieceRowInspect={show} />
	 */
</script>

<script>
	import MasterpieceChip from '../player/MasterpieceChip.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {MasterpieceRowProps} */
	let { faceUp, deck, onMasterpieceRowInspect, ...attr } = $props();

	/**
	 * Passes a chip's card on.
	 * @param {ComponentEvent} event - From MasterpieceChip: the id, or null
	 */
	const chipInspectHandler = (event) => {
		if (typeof onMasterpieceRowInspect === 'function') {
			onMasterpieceRowInspect(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-masterpiece-row {attr.class ?? ''}">
	<span class="rg-masterpiece-row--label">Masterpieces</span>
	{#each faceUp as id (id)}
		<MasterpieceChip
			{id}
			size="tiny"
			onMasterpieceChipInspect={chipInspectHandler} />
	{/each}
	<span class="rg-masterpiece-row--deck">Deck · {deck}</span>
</div>

<style>
	.rg-masterpiece-row {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--space-3);
	}

	.rg-masterpiece-row--label {
		color: var(--muted);
		font-size: var(--font-size-3xs);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}

	.rg-masterpiece-row--deck {
		padding: var(--space-1) var(--space-4);
		border: var(--border) dashed var(--line-strong);
		color: var(--muted);
		font-size: var(--font-size-xs);
		line-height: var(--leading-none);
		white-space: nowrap;
	}
</style>
