<!-- TilePicker: the territory tiles in a player's hand as a wrapping row of hexes, those on offer pressable, the picked one gold. -->
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
	 * @property {PickerTile[]} tiles - The tiles to draw, in order
	 * @property {number[]} [pickable] - The tiles that can be pressed; the others are drawn plain, not as buttons (#93). All of them by default
	 * @property {number | number[] | null} [selected=null] - The id of the picked tile, or the ids of several picked at once (#75)
	 * @property {number[]} [disabled=[]] - Tiles that can't be pressed now, as when enough are picked (#75)
	 * @property {'small' | 'large'} [size='small'] - small: a 34px tile in an 88×80 frame on the raised fill, for the decision panel; large: the tile at its own 36px in a frame that fits it, resting clear with a faint gold wash on hover, for the Terrain tab beside plain tiles (#93)
	 * @property {string} [dataIdPrefix='tile'] - Starts each pressable tile's data-id, `${dataIdPrefix}-${id}`, so two pickers on one screen keep their hooks apart
	 * @property {Function} [onTilePickerSelect] - Callback fired with `{ tile }` when a tile is pressed
	 */

	/**
	 * Properties for the TilePicker component, including any attributes for its root element.
	 * @typedef {TilePickerOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TilePickerProps
	 *
	 * @example
	 * <TilePicker tiles={tiles} selected={17} onTilePickerSelect={pick} />
	 * <TilePicker tiles={tiles} selected={[13, 21]} disabled={[]} onTilePickerSelect={toggle} />
	 * <TilePicker size="large" tiles={hand} pickable={[13, 21]} selected={13} dataIdPrefix="terrain-tile" onTilePickerSelect={pick} />
	 */
</script>

<script>
	import TerritoryTile from '../player/TerritoryTile.svelte';
	import VpTag from './VpTag.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { upToVp } from '../../hexmap.js';

	/** @type {TilePickerProps} */
	let {
		tiles,
		pickable,
		selected = null,
		disabled = [],
		size = 'small',
		dataIdPrefix = 'tile',
		onTilePickerSelect,
		...attr
	} = $props();

	/** The tile's hex radius: the frame's 34px when small, TerritoryTile's own when large. */
	let tileSize = $derived(size === 'small' ? 34 : undefined);

	/**
	 * @param {number} tile
	 * @returns {boolean}
	 */
	const isPickable = (tile) => !pickable || pickable.includes(tile);

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
			? `${tile.label}, ${upToVp(tile.vp)} on this hex`
			: tile.label;
</script>

<div
	role="group"
	aria-label="Your tiles"
	{...attr}
	class="rg-tile-picker {attr.class ? attr.class : ''}"
	class:rg-tile-picker--small={size === 'small'}
	class:rg-tile-picker--large={size === 'large'}>
	{#each tiles as tile (tile.id)}
		{#if isPickable(tile.id)}
			<button
				type="button"
				class="rg-tile-picker--tile"
				aria-pressed={isPicked(tile.id)}
				disabled={disabled.includes(tile.id)}
				aria-label={labelOf(tile)}
				data-id="{dataIdPrefix}-{tile.id}"
				onclick={(event) => selectHandler(tile.id, event)}>
				{#if typeof tile.vp === 'number'}
					<VpTag
						value={tile.vp}
						unit=""
						muted={tile.vp === 0}
						aria-hidden="true" />
				{/if}
				<span aria-hidden="true">
					<TerritoryTile
						id={tile.id}
						corners={tile.corners}
						island={tile.island}
						clouds={tile.clouds}
						volcano={tile.volcano}
						size={tileSize} />
				</span>
			</button>
		{:else}
			<TerritoryTile
				id={tile.id}
				corners={tile.corners}
				island={tile.island}
				clouds={tile.clouds}
				volcano={tile.volcano}
				size={tileSize} />
		{/if}
	{/each}
</div>

<style>
	/* A size sets the frame's fills: at rest, and on hover or focus. */
	.rg-tile-picker {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.rg-tile-picker--small {
		--rg-tile-picker-fill: var(--choice-fill);
		--rg-tile-picker-hover-fill: var(--rg-tile-picker-fill);
	}

	/* Clear at rest, so an offered tile reads as the plain tile beside it, framed. */
	.rg-tile-picker--large {
		--rg-tile-picker-fill: transparent;
		--rg-tile-picker-hover-fill: color-mix(
			in srgb,
			var(--gold) 10%,
			transparent
		);
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
		background: var(--rg-tile-picker-fill);
	}

	.rg-tile-picker--large .rg-tile-picker--tile {
		width: auto;
		height: auto;
	}

	.rg-tile-picker--tile:disabled {
		opacity: var(--opacity-unpickable);
		cursor: default;
	}

	.rg-tile-picker--tile:not(:disabled):hover,
	.rg-tile-picker--tile:focus-visible {
		border-color: var(--gold);
	}

	/* The wash leaves a picked tile its own fill. */
	.rg-tile-picker--tile:not(:disabled, [aria-pressed='true']):hover,
	.rg-tile-picker--tile:not([aria-pressed='true']):focus-visible {
		background: var(--rg-tile-picker-hover-fill);
	}

	.rg-tile-picker--tile[aria-pressed='true'] {
		border-color: var(--gold);
		background: var(--picked-fill);
		outline: var(--border-thick) solid var(--gold);
	}

	/* Focus on the picked tile: its solid ring hugging the border turns dashed and stands off, so focus reads apart
	   from the pick. */
	.rg-tile-picker--tile[aria-pressed='true']:focus-visible {
		outline-style: dashed;
		outline-offset: var(--focus-offset);
	}
</style>
