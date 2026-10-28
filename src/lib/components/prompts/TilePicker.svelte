<!-- TilePicker: the territory tiles in a player's hand as a wrapping row of pressable hexes, the picked one gold. -->
<script module>
	/**
	 * One tile on offer.
	 * @typedef {Object} PickerTile
	 * @property {number} id - The tile's number, 1-48
	 * @property {string} label - The tile in words, for screen readers
	 * @property {import('../../ui.js').Terrain[]} corners - Six corner terrains, clockwise from the top-left
	 * @property {import('../../ui.js').Terrain[]} island - The terrains of the island in the middle
	 * @property {boolean} [clouds=false] - The picture shows clouds
	 * @property {boolean} [volcano=false] - The picture shows a volcano
	 * @property {number | null} [vp] - What the tile scores on the chosen hex, when one is chosen
	 */

	/**
	 * Properties of the TilePicker component itself.
	 * @typedef {Object} TilePickerOwnProps
	 * @property {PickerTile[]} tiles - The tiles to pick from
	 * @property {number | number[] | null} [selected=null] - The id of the picked tile, or the ids of several picked at once (#75)
	 * @property {number[]} [disabled=[]] - Tiles that can't be pressed now, as when enough are picked (#75)
	 * @property {Function} [onTilePickerSelect] - Callback fired with `{ tile }` when a tile is pressed
	 */

	/**
	 * Properties for the TilePicker component, including any attributes for its root element.
	 * @typedef {TilePickerOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TilePickerProps
	 *
	 * @example
	 * <TilePicker tiles={tiles} selected={17} onTilePickerSelect={pick} />
	 * <TilePicker tiles={tiles} selected={[13, 21]} disabled={[]} onTilePickerSelect={toggle} />
	 */
</script>

<script>
	import TerritoryTile from '../player/TerritoryTile.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {TilePickerProps} */
	let {
		tiles,
		selected = null,
		disabled = [],
		onTilePickerSelect,
		...attr
	} = $props();

	/**
	 * @param {number} tile
	 * @returns {boolean}
	 */
	const isPicked = (tile) =>
		Array.isArray(selected) ? selected.includes(tile) : selected === tile;

	/**
	 * @param {number} tile
	 * @param {MouseEvent} event
	 */
	const selectHandler = (tile, event) => {
		if (typeof onTilePickerSelect === 'function') {
			onTilePickerSelect(
				new ComponentEvent(
					{ tile },
					/** @type {HTMLButtonElement} */ (event.currentTarget),
					event
				)
			);
		}
	};

	/**
	 * @param {PickerTile} tile
	 * @returns {string}
	 */
	const labelOf = (tile) =>
		typeof tile.vp === 'number'
			? `${tile.label}, up to ${tile.vp} VP on this hex`
			: tile.label;
</script>

<div
	role="group"
	aria-label="Your tiles"
	{...attr}
	class="rg-tile-picker {attr.class ? attr.class : ''}">
	{#each tiles as tile (tile.id)}
		<button
			type="button"
			class="rg-tile-picker--tile"
			aria-pressed={isPicked(tile.id)}
			disabled={disabled.includes(tile.id)}
			aria-label={labelOf(tile)}
			data-id="tile-{tile.id}"
			onclick={(event) => selectHandler(tile.id, event)}>
			{#if typeof tile.vp === 'number'}
				<span
					class="rg-tile-picker--vp"
					class:rg-tile-picker--vp-zero={tile.vp === 0}
					aria-hidden="true">+{tile.vp}</span>
			{/if}
			<span aria-hidden="true">
				<TerritoryTile
					id={tile.id}
					corners={tile.corners}
					island={tile.island}
					clouds={tile.clouds}
					volcano={tile.volcano}
					size={34} />
			</span>
		</button>
	{/each}
</div>

<style>
	.rg-tile-picker {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.rg-tile-picker--tile {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 88px;
		height: 80px;
		padding: var(--space-2);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--raised) 70%, transparent);
	}

	.rg-tile-picker--tile:disabled {
		opacity: 0.35;
	}

	.rg-tile-picker--tile:not(:disabled):hover,
	.rg-tile-picker--tile:focus-visible {
		border-color: var(--gold);
	}

	.rg-tile-picker--tile[aria-pressed='true'] {
		border-color: var(--gold);
		background: color-mix(in srgb, var(--gold) 17%, var(--surface));
		outline: var(--border-thick) solid var(--gold);
	}

	/* Focus on the picked tile: its solid ring hugging the border turns dashed and stands off, so focus reads apart
	   from the pick. */
	.rg-tile-picker--tile[aria-pressed='true']:focus-visible {
		outline-style: dashed;
		outline-offset: var(--focus-offset);
	}

	.rg-tile-picker--vp {
		position: absolute;
		top: calc(var(--border) * -1);
		right: calc(var(--border) * -1);
		padding: 0 var(--space-3);
		background: var(--gold);
		color: var(--ink);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-bold);
		line-height: var(--leading-snug);
	}

	.rg-tile-picker--vp-zero {
		background: var(--line);
		color: var(--text);
	}
</style>
