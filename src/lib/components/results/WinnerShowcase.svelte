<!-- WinnerShowcase: the winner under the final standings (#174): their civilization's portrait in a gold frame, its name, and their capital as it ended; each winner of a shared win. It is the results' entrance: after the standings, the portrait rises into its frame, then the capital (#175). -->
<script module>
	/**
	 * Properties of the WinnerShowcase component itself.
	 * @typedef {Object} WinnerShowcaseOwnProps
	 * @property {import('../../results.js').Winner[]} winners - From `winners()`; with none, nothing is drawn
	 */

	/**
	 * Properties for the WinnerShowcase component, including any attributes for its root element.
	 * @typedef {WinnerShowcaseOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} WinnerShowcaseProps
	 *
	 * @example
	 * <WinnerShowcase winners={winners(game, room.code)} />
	 */
</script>

<script>
	import CapitalCity from '../player/CapitalCity.svelte';
	import { joinList } from '../../words.js';
	import { artUrl } from '../../ui.js';

	/** @type {WinnerShowcaseProps} */
	let { winners, ...attr } = $props();

	let heading = $derived(
		winners.length === 1
			? `${winners[0].name} won with ${/^the /i.test(winners[0].civ) ? winners[0].civ : `the ${winners[0].civ}`}`
			: `${joinList(winners.map((winner) => winner.name))} share the win`
	);
</script>

{#if winners.length}
	<section
		aria-label="The winner"
		{...attr}
		class="rg-winner-showcase {attr.class ? attr.class : ''}">
		<h2 class="rg-winner-showcase--heading">{heading}</h2>
		<div class="rg-winner-showcase--winners">
			{#each winners as winner (winner.seat)}
				<div class="rg-winner-showcase--winner">
					<figure class="rg-winner-showcase--civ">
						{#if winner.civId}
							<img
								class="rg-winner-showcase--portrait"
								src={artUrl(`civ/${winner.civId}`)}
								alt=""
								draggable="false" />
						{/if}
						<figcaption>
							<b class="rg-winner-showcase--civ-name"
								>{winner.civ}</b>
							<span class="rg-winner-showcase--score"
								>{winner.name} · {winner.vp} VP</span>
						</figcaption>
					</figure>
					{#if winner.capital}
						<div class="rg-winner-showcase--capital">
							<CapitalCity
								capital={winner.capital}
								owner="{winner.name}'s capital"
								label="{winner.name}'s capital city" />
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	.rg-winner-showcase {
		display: grid;
		gap: var(--space-6);
		padding-top: var(--space-8);
		border-top: var(--border) solid var(--line-soft);
	}

	.rg-winner-showcase--heading {
		margin: 0;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xl) var(--font-body);
	}

	.rg-winner-showcase--winners {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-10);
	}

	.rg-winner-showcase--winner {
		display: flex;
		align-items: flex-start;
		gap: var(--space-9);
	}

	.rg-winner-showcase--civ {
		display: grid;
		gap: var(--space-4);
		width: 150px;
		margin: 0;
	}

	.rg-winner-showcase--portrait {
		display: block;
		width: 150px;
		height: 150px;
		border: var(--border-thick) solid var(--gold);
		box-shadow: var(--glow-gold);
		image-rendering: pixelated;
	}

	.rg-winner-showcase--civ figcaption {
		display: grid;
		gap: var(--space-2);
	}

	.rg-winner-showcase--civ-name {
		color: var(--gold);
		font: var(--weight-title) var(--font-size-xl) var(--font-title);
	}

	.rg-winner-showcase--score {
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	/* The capital as it ended, small: its title, grid and counters stack in this column. */
	.rg-winner-showcase--capital {
		display: grid;
		width: 260px;
		--rg-capital-city-title-gap: var(--space-4);
	}

	/* The results' entrance (issue 175): once the standings are in, the heading fades in, the portrait rises and grows
	   into its gold frame over the focal time, and the capital follows it. */
	.rg-winner-showcase--heading {
		animation: rg-winner-showcase-fade var(--duration-slow) var(--ease-out)
			300ms backwards;
	}

	.rg-winner-showcase--civ {
		animation: rg-winner-showcase-rise var(--duration-focal) var(--ease-out)
			380ms backwards;
	}

	.rg-winner-showcase--capital {
		animation: rg-winner-showcase-rise var(--duration-focal) var(--ease-out)
			560ms backwards;
	}

	@keyframes rg-winner-showcase-fade {
		from {
			opacity: 0;
		}
	}

	@keyframes rg-winner-showcase-rise {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.96);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-winner-showcase--heading,
		.rg-winner-showcase--civ,
		.rg-winner-showcase--capital {
			animation: none;
		}
	}
</style>
