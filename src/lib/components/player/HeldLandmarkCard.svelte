<!-- The landmark card a player drafted, on the Civ tab (#32, option A): its heading, the goal line, and the card, marked once its landmark is gained. -->
<script module>
	/**
	 * Properties of the HeldLandmarkCard component itself.
	 * @typedef {Object} HeldLandmarkCardOwnProps
	 * @property {import('../../area/landmark-card.js').HeldLandmarkCard} held - The card, its goal's state and its line, from heldLandmarkCard()
	 */

	/**
	 * Properties for the HeldLandmarkCard component, including any attributes for its root element.
	 * @typedef {HeldLandmarkCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} HeldLandmarkCardProps
	 *
	 * @example
	 * <HeldLandmarkCard held={heldLandmarkCard(seat, true)} />
	 */
</script>

<script>
	import LandmarkCard from './LandmarkCard.svelte';

	/** @type {HeldLandmarkCardProps} */
	let { held, ...attr } = $props();
</script>

<section
	{...attr}
	class="rg-held-landmark-card {attr.class ? attr.class : ''}"
	class:rg-held-landmark-card--gained={held.state === 'gained'}>
	<h2>Landmark card</h2>
	<p
		class="rg-held-landmark-card--line"
		class:rg-held-landmark-card--done={held.state !== 'open'}>
		{held.line}
	</p>
	<div class="rg-held-landmark-card--card">
		<LandmarkCard
			title={held.data.title}
			artwork={held.data.artwork}
			footprint={held.data.footprint}
			edition={held.data.edition}
			condition={held.data.condition} />
		{#if held.state === 'gained'}
			<span class="rg-held-landmark-card--stamp">Gained</span>
		{/if}
	</div>
</section>

<style>
	.rg-held-landmark-card {
		display: grid;
		gap: var(--space-4);
		justify-items: start;
	}

	.rg-held-landmark-card h2 {
		margin: 0;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
	}

	.rg-held-landmark-card--line {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-held-landmark-card--done {
		color: var(--ok);
	}

	.rg-held-landmark-card--card {
		position: relative;
	}

	/* A gained card has done its work: it fades back, under a gold mark. */
	.rg-held-landmark-card--gained
		.rg-held-landmark-card--card
		> :global(*:first-child) {
		opacity: 0.75;
	}

	.rg-held-landmark-card--stamp {
		position: absolute;
		top: 60px;
		right: -20px;
		padding: var(--space-2) var(--space-6);
		border: var(--border-thick) solid var(--gold);
		background: var(--chrome);
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-sm) / 1 var(--font-body);
		transform: rotate(8deg);
	}
</style>
