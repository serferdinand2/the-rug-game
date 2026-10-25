<!-- CardScoreLadder: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardScoreLadderOwnProps
	 * @property {number[]} values - Points at each collection count
	 * @property {number} [current] - Current count
	 * @property {string} [label] - Scoring timing
	 */
	/**
	 * @typedef {CardScoreLadderOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardScoreLadderProps
	 * @example
	 * <CardScoreLadder />
	 */
</script>

<script>
	/** @type {CardScoreLadderProps} */
	let { values, current = 0, label = 'End of game VP', ...attr } = $props();
</script>

<div
	{...attr}
	class="rg-card-frame--score {attr.class ?? ''}">
	<div class="rg-card-ladder-label">{label}</div>
	<ol class="rg-card-frame--vps">
		{#each values as points, index}<li
				class="rg-card-vp"
				class:rg-card-is-current={index + 1 === current}
				class:rg-card-is-reached={index + 1 <= current}
				data-n={index + 1}
				aria-label={`${index + 1} different items: ${points} VP`}>
				<span class="rg-card-vp--n">{index + 1}</span><span
					class="rg-card-vp--pips"
					>{#each Array(index + 1) as _}<i></i>{/each}</span
				><span class="rg-card-vp--pts">{points}<small>VP</small></span>
			</li>{/each}
	</ol>
	<div class="rg-card-frame--counts">
		{#each values as _, i}<span>{i + 1}</span>{/each}
	</div>
</div>
