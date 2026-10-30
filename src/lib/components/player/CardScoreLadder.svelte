<!-- CardScoreLadder: a card's end-of-game score by count, as the Collectors' stepped ladder or the Isolationists' flat row of boxes (#106). -->
<script module>
	/**
	 * One step of the score: how many, and what it is worth.
	 * @typedef {Object} CardScoreStep
	 * @property {number | string} count - The count, such as 3 or '6+'
	 * @property {number} points - Its VP
	 */
	/**
	 * A worked example under a flat score.
	 * @typedef {Object} CardScoreExample
	 * @property {string[]} pictures - Artwork URLs, one per counted item
	 * @property {string} text - What the pictures count
	 * @property {string} result - What they score, such as '= 16 VP'
	 */
	/**
	 * @typedef {Object} CardScoreLadderOwnProps
	 * @property {CardScoreStep[]} steps - The score at each count, in order
	 * @property {'stepped' | 'flat'} [kind='stepped'] - Rising gold steps with the counts beneath, or equal boxes with the count above the VP
	 * @property {number} [current=0] - The step reached, from 1; 0 for none
	 * @property {string} [label='End of game VP'] - When it scores, and for the flat kind what it counts
	 * @property {string} [noun='different items'] - What the stepped count counts, for each step's label
	 * @property {CardScoreExample} [example] - A worked example under the flat kind
	 */
	/**
	 * @typedef {CardScoreLadderOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardScoreLadderProps
	 * @example
	 * <CardScoreLadder
	 *   steps={[1, 3, 6, 10, 15, 21].map((points, i) => ({ count: i + 1, points }))}
	 *   current={3} />
	 * <CardScoreLadder
	 *   kind="flat"
	 *   label="Final income turn · territories in your largest connected landmass of one terrain"
	 *   steps={[{ count: 1, points: 5 }, { count: '6+', points: 40 }]}
	 *   example={{ pictures: ['/art/terrain/grassland.svg'], text: '1 grassland territory', result: '= 5 VP' }} />
	 */
</script>

<script>
	/** @type {CardScoreLadderProps} */
	let {
		steps,
		kind = 'stepped',
		current = 0,
		label = 'End of game VP',
		noun = 'different items',
		example,
		...attr
	} = $props();
</script>

{#if kind === 'flat'}
	<div
		{...attr}
		class="rg-card-score-ladder rg-card-score-ladder--flat {attr.class ??
			''}">
		<div class="rg-card-score-ladder--title">{label}</div>
		<div class="rg-card-score-ladder--boxes">
			{#each steps as step (step.count)}<span
					class="rg-card-score-ladder--box"
					><small>{step.count}</small>{step.points} VP</span
				>{/each}
		</div>
		{#if example}
			<div class="rg-card-score-ladder--example">
				{#each example.pictures as picture, index (index)}<img
						src={picture}
						alt="" />{/each}<span>{example.text}</span><b
					>{example.result}</b>
			</div>
		{/if}
	</div>
{:else}
	<div
		{...attr}
		class="rg-card-score-ladder {attr.class ?? ''}">
		<div class="rg-card-score-ladder--label">{label}</div>
		<ol class="rg-card-score-ladder--steps">
			{#each steps as step, index (step.count)}<li
					class="rg-card-score-ladder--step"
					class:rg-card-score-ladder--current={index + 1 === current}
					style:height={`${38 + index * 8}px`}
					aria-label={`${step.count} ${noun}: ${step.points} VP`}>
					<span class="rg-card-score-ladder--points"
						>{step.points}<small>VP</small></span>
				</li>{/each}
		</ol>
		<div class="rg-card-score-ladder--counts">
			{#each steps as step (step.count)}<span>{step.count}</span>{/each}
		</div>
	</div>
{/if}

<style>
	.rg-card-score-ladder {
		margin: 12px 12px 10px;
		padding-top: 8px;
		border-top: var(--border) solid var(--line);
	}
	.rg-card-score-ladder--flat {
		margin: 8px 12px 0;
		padding: 9px;
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--control) 75%, transparent);
	}
	.rg-card-score-ladder--label {
		display: block;
		margin-bottom: 6px;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xs) / 1.2 var(--font-body);
		letter-spacing: 0;
	}
	.rg-card-score-ladder--steps {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: var(--space-3);
		align-items: end;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.rg-card-score-ladder--step {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 0;
		padding-top: var(--space-2);
		background-color: color-mix(in srgb, var(--gold) 13%, var(--control));
		background-image: url('../../../styles/card-paper-noise.svg');
		background-size: 256px 256px;
		border-top: var(--border-thick) solid var(--gold);
	}
	.rg-card-score-ladder--step.rg-card-score-ladder--current {
		background: color-mix(in srgb, var(--player-1) 26%, var(--control));
		border-top-color: var(--player-1);
	}
	.rg-card-score-ladder--points {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 3px;
		white-space: nowrap;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-base) / var(--leading-none)
			var(--font-body);
	}
	.rg-card-score-ladder--points small {
		display: inline;
		margin: 0;
		color: inherit;
		font: var(--weight-bold) var(--font-size-3xs) / var(--leading-none)
			var(--font-body);
		letter-spacing: var(--letter-spacing-caps);
		text-align: center;
	}
	.rg-card-score-ladder--counts {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: var(--space-3);
		margin-top: var(--space-2);
		color: var(--faint);
		font-size: var(--font-size-3xs);
		font-weight: var(--weight-bold);
		text-align: center;
	}
	.rg-card-score-ladder--title {
		margin-bottom: 7px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-2xs) / 1.2 var(--font-body);
		text-transform: uppercase;
	}
	.rg-card-score-ladder--boxes {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 5px;
	}
	.rg-card-score-ladder--box {
		display: grid;
		place-items: center;
		gap: 3px;
		min-height: 48px;
		border: 1px solid var(--line-soft);
		background: var(--raised);
		font: var(--weight-bold) var(--font-size-xs) / var(--leading-none)
			var(--font-body);
	}
	.rg-card-score-ladder--box small {
		color: var(--muted);
		font-size: var(--font-size-3xs);
		font-weight: var(--weight-regular);
	}
	.rg-card-score-ladder--example {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 8px;
		color: var(--muted);
		font: var(--font-size-2xs) / 1.2 var(--font-body);
	}
	.rg-card-score-ladder--example img {
		width: 26px;
		height: 26px;
	}
	.rg-card-score-ladder--example b {
		margin-left: 4px;
		color: var(--text);
	}
</style>
