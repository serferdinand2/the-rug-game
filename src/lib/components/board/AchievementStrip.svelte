<!-- The three achievements on one line: each with the colour squares of the players who claimed it, in order, and the VP the next claimant gets. -->
<script module>
	/**
	 * One achievement in the strip.
	 * @typedef {Object} AchievementStripEntry
	 * @property {string} id
	 * @property {string} name - The short name, such as 'Complete a track'
	 * @property {number | null} vp - The VP the next claimant gets, or null when every place is taken
	 * @property {import('../../ui.js').Seat[]} claimed - The seats that claimed it, in order
	 */

	/**
	 * Properties of the AchievementStrip component itself.
	 * @typedef {Object} AchievementStripOwnProps
	 * @property {AchievementStripEntry[]} achievements - The achievements, in board order
	 */

	/**
	 * Properties for the AchievementStrip component, including any attributes for its root element.
	 * @typedef {AchievementStripOwnProps & import('svelte/elements').HTMLAttributes<HTMLUListElement>} AchievementStripProps
	 *
	 * @example
	 * <AchievementStrip achievements={achievements(view)} />
	 */
</script>

<script>
	import { artUrl, playerColor } from '../../ui.js';

	/** @type {AchievementStripProps} */
	let { achievements, ...attr } = $props();
</script>

<ul
	aria-label="Achievements"
	{...attr}
	class="rg-achievement-strip {attr.class ? attr.class : ''}">
	{#each achievements as achievement (achievement.id)}
		<li
			class="rg-achievement-strip--item"
			aria-label="{achievement.name}, {achievement.claimed.length
				? `claimed by seat ${achievement.claimed.join(', ')}`
				: 'not claimed'}{achievement.vp === null
				? ', no places left'
				: `, next ${achievement.vp} VP`}">
			<span class="rg-achievement-strip--name">{achievement.name}</span>
			{#each achievement.claimed as seat, index (index)}
				<i
					class="rg-achievement-strip--claim"
					style:background={playerColor(seat)}></i>
			{/each}
			<span class="rg-achievement-strip--vp">
				{#if achievement.vp === null}
					–
				{:else}
					<img
						src={artUrl('symbol/victory-points')}
						alt=""
						width="16"
						height="16"
						draggable="false" />{achievement.vp}
				{/if}
			</span>
		</li>
	{/each}
</ul>

<style>
	.rg-achievement-strip {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		margin: 0;
		padding: 0;
		list-style: none;
		white-space: nowrap;
	}

	.rg-achievement-strip--item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 3px var(--space-3);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--raised);
		font: var(--weight-bold) var(--font-size-2xs) / var(--leading-none)
			var(--font-body);
	}

	.rg-achievement-strip--name {
		color: var(--muted);
	}

	.rg-achievement-strip--claim {
		width: 10px;
		height: 10px;
		border: var(--border) solid var(--ink);
		border-radius: 2px;
	}

	.rg-achievement-strip--vp {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: var(--gold);
	}

	.rg-achievement-strip--vp img {
		width: 16px;
		height: 16px;
		image-rendering: pixelated;
	}
</style>
