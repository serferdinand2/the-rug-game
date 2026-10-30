<!-- LandmarkCard: the reviewed landmark card frame, ready for rule text supplied by game data. -->
<script module>
	/**
	 * @typedef {Object} LandmarkCardOwnProps
	 * @property {string} title - Landmark name
	 * @property {string} artwork - Full landmark card picture
	 * @property {readonly string[]} footprint - Capital plots covered, top row first
	 * @property {string} edition - Its edition's code, such as 'pp' or 'aa'
	 * @property {string} [condition='Rules text pending'] - End-of-turn condition
	 */
	/**
	 * @typedef {LandmarkCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} LandmarkCardProps
	 * @example
	 * <LandmarkCard title="Castle" artwork="/art/landmark-card/castle.svg" footprint={FOOTPRINTS.castle} edition="aa" />
	 */
</script>

<script>
	import CardBand from './CardBand.svelte';
	import CardEdition from './CardEdition.svelte';
	import LandmarkShape from './LandmarkShape.svelte';
	import '../../../styles/landmark-card.css';
	/** @type {LandmarkCardProps} */
	let {
		title,
		artwork,
		footprint,
		edition,
		condition = 'Rules text pending',
		...attr
	} = $props();
</script>

<article
	{...attr}
	class="rg-landmark-card {attr.class ?? ''}"
	aria-label={`${title} landmark card`}>
	<CardBand
		class="rg-landmark-card--band"
		{title}
		size="small" />
	<div class="rg-landmark-card--visual">
		<img
			src={artwork}
			alt={`${title} artwork`} />
		<div
			class="rg-landmark-card--footprint"
			aria-label={`Capital footprint: ${footprint.join(' / ')}`}>
			{#if footprint.length}
				<LandmarkShape
					{footprint}
					plotSize={20}
					gap={2}
					picture={false}
					plots
					color="var(--card-line-strong)"
					tint="var(--card-score-line)" />
			{/if}
		</div>
	</div>
	<div class="rg-landmark-card--condition">
		<small>END OF YOUR TURN · GAIN THIS LANDMARK WHEN YOU</small>
		<p>{condition}</p>
	</div>
	<footer class="rg-landmark-card--footer">
		<CardEdition code={edition} />
	</footer>
</article>
