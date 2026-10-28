<!-- LandmarkCard: the reviewed landmark card frame, ready for rule text supplied by game data. -->
<script module>
	/**
	 * @typedef {Object} LandmarkCardOwnProps
	 * @property {string} title - Landmark name
	 * @property {string} artwork - Full landmark card picture
	 * @property {readonly string[]} footprint - Capital plots covered, top row first
	 * @property {string} edition - Expansion name
	 * @property {string} [condition='Rules text pending'] - End-of-turn condition
	 */
	/** @typedef {LandmarkCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} LandmarkCardProps */
</script>

<script>
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
	<header class="rg-landmark-card__band"><h3>{title}</h3></header>
	<div class="rg-landmark-card__visual">
		<img
			src={artwork}
			alt={`${title} artwork`} />
		<div
			class="rg-landmark-card__footprint"
			style={`--cols:${footprint[0]?.length ?? 0}`}
			aria-label={`Capital footprint: ${footprint.join(' / ')}`}>
			{#each footprint as row, rowIndex (rowIndex)}
				{#each [...row] as plot, columnIndex (`${rowIndex}-${columnIndex}`)}
					<span class:empty={plot === '.'}></span>
				{/each}
			{/each}
		</div>
	</div>
	<div class="rg-landmark-card__condition">
		<small>END OF YOUR TURN · GAIN THIS LANDMARK WHEN YOU</small>
		<p>{condition}</p>
	</div>
	<footer class="rg-landmark-card__footer">
		<span class="rg-landmark-card__edition">{edition}</span>
	</footer>
</article>
