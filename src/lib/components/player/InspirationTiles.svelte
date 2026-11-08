<!-- InspirationTiles: a player's inspiration tiles not yet placed, beside the income mat (#35 part 4); pointing at one shows its picture. -->
<script module>
	/**
	 * Properties of the InspirationTiles component itself.
	 * @typedef {Object} InspirationTilesOwnProps
	 * @property {import('../../engine/data/ids.js').BuildingId[]} tiles - The rows whose tile is still to place, in income-mat order
	 */
	/**
	 * Properties for the InspirationTiles component, including any attributes for its root element.
	 * @typedef {InspirationTilesOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} InspirationTilesProps
	 *
	 * @example
	 * <InspirationTiles tiles={spareTiles(seat)} />
	 */
</script>

<script>
	import { buildingName } from '../../game-names.js';
	import { artUrl } from '../../ui.js';
	import { pluralOf } from '../../words.js';

	/** @type {InspirationTilesProps} */
	let { tiles, ...attr } = $props();
</script>

<section
	{...attr}
	class="rg-inspiration-tiles {attr.class ?? ''}">
	<h3 class="rg-inspiration-tiles--title">
		Inspiration tiles <em>{tiles.length} to place</em>
	</h3>
	<ul class="rg-inspiration-tiles--list">
		{#each tiles as building (building)}
			<li>
				<button
					type="button"
					class="rg-inspiration-tiles--tile">
					<img
						src={artUrl(`building/${building}`)}
						alt="" />
					{pluralOf(buildingName(building))}
					<span class="rg-inspiration-tiles--picture">
						<img
							src={artUrl(
								`inspiration-tile/${pluralOf(building)}`
							)}
							alt="" />
						Improves spaces 2, 4 and 6 of the row
					</span>
				</button>
			</li>
		{/each}
	</ul>
</section>

<style>
	.rg-inspiration-tiles {
		display: grid;
		gap: var(--space-4);
	}

	.rg-inspiration-tiles--title {
		margin: 0;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-md) / var(--leading-tight)
			var(--font-body);
	}

	.rg-inspiration-tiles--title em {
		color: var(--muted);
		font-style: normal;
		font-weight: var(--weight-regular);
	}

	.rg-inspiration-tiles--list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* A tile's chip in the tiles' violet, gold-edged as the improved spaces are framed (approved mockup). */
	.rg-inspiration-tiles--tile {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-1) var(--space-4) var(--space-1) var(--space-2);
		border: 2px solid var(--gold);
		background: var(--inspiration-tile);
		color: var(--inspiration-tile-text);
		font: var(--weight-bold) var(--font-size-xs) / var(--leading-none)
			var(--font-body);
		cursor: default;
	}

	.rg-inspiration-tiles--tile:focus-visible {
		outline: var(--focus-outline);
		outline-offset: var(--focus-offset);
	}

	.rg-inspiration-tiles--tile > img {
		width: 24px;
		height: 24px;
		image-rendering: pixelated;
	}

	/* The tile's picture, over the chip while it is pointed at or focused. */
	.rg-inspiration-tiles--picture {
		position: absolute;
		bottom: calc(100% + var(--space-3));
		left: 0;
		z-index: var(--layer-popover);
		display: none;
		gap: var(--space-3);
		width: max-content;
		padding: var(--space-5);
		background: var(--chrome);
		box-shadow: var(--shadow-float);
		color: var(--muted);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-regular);
	}

	.rg-inspiration-tiles--tile:is(:hover, :focus-visible)
		.rg-inspiration-tiles--picture {
		display: grid;
	}

	.rg-inspiration-tiles--picture img {
		width: 160px;
		height: auto;
		image-rendering: pixelated;
	}
</style>
