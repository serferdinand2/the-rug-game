<!-- CardEffectList: a card's triggered and scoring effects, a column of CardEffectBox rows inside the card's inset (#106). -->
<script module>
	/**
	 * @typedef {Object} CardEffectListOwnProps
	 * @property {number} [above] - Space above it in px, when the area above needs some
	 * @property {import('svelte').Snippet} [children] - The CardEffectBox rows
	 */
	/**
	 * @typedef {CardEffectListOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardEffectListProps
	 * @example
	 * <CardEffectList above={14}>
	 *   <CardEffectBox
	 *     title="First time reached"
	 *     gain="any"
	 *     symbolText={15}>Gain one resource of your choice.</CardEffectBox>
	 * </CardEffectList>
	 */
</script>

<script>
	/** @type {CardEffectListProps} */
	let { above, children, ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-card-effect-list {attr.class ?? ''}"
	style:margin-top={above === undefined ? undefined : `${above}px`}>
	{@render children?.()}
</div>

<style>
	.rg-card-effect-list {
		display: grid;
		gap: 8px;
		margin: 0 12px;
	}
</style>
