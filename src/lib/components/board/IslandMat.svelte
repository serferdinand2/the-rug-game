<!-- The Islanders' mat: its printed centre hex and the six hexes round it, drawn by the World Map over the card's picture and chosen like the map's hexes (#165). -->
<script module>
	/**
	 * Properties of the IslandMat component itself.
	 * @typedef {Object} IslandMatOwnProps
	 * @property {import('../../hexmap.js').MapHex[]} hexes - The mat's 7 hexes, from matMapHexes(view, seat)
	 * @property {number} seat - The mat's owner, which names its hexes in answers ('mat:<seat>:<position>')
	 * @property {string[]} [targets=[]] - Mat hex ids a decision can choose; each becomes a button
	 * @property {Record<string, number>} [scores={}] - The VP a picked tile scores on each target hex, as WorldMap's
	 * @property {string | null} [selected=null] - The chosen mat hex id, outlined in gold
	 * @property {import('../../hexmap.js').MapPreview | null} [preview=null] - A tile to show before it lies there; its `hex` is a mat hex id
	 * @property {Function} [onIslandMatSelect] - Callback fired with { hex } (a mat hex id) when the player chooses a target
	 */

	/**
	 * Properties for the IslandMat component, including any attributes for its root element.
	 * @typedef {IslandMatOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} IslandMatProps
	 *
	 * @example
	 * <IslandMat
	 *   hexes={matMapHexes(game, 1)}
	 *   seat={1}
	 *   targets={['mat:1:0', 'mat:1:3']}
	 *   selected={hex}
	 *   onIslandMatSelect={(event) => (hex = event.value.hex)} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { matId, matPrompt } from '../../island-mat.js';
	import WorldMap from './WorldMap.svelte';

	/** @type {IslandMatProps} */
	let {
		hexes,
		seat,
		targets = [],
		scores = {},
		selected = null,
		preview = null,
		onIslandMatSelect,
		...attr
	} = $props();

	let small = $derived(matPrompt({ targets, scores, selected, preview }));

	/** @param {ComponentEvent} event */
	const selectHandler = (event) => {
		const hex = matId(seat, event.value.hex);
		if (hex && typeof onIslandMatSelect === 'function') {
			onIslandMatSelect(
				new ComponentEvent({ hex }, event.target, event.originalEvent)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-island-mat {attr.class ? attr.class : ''}">
	<WorldMap
		class="rg-island-mat--map"
		overlay
		{hexes}
		targets={small.targets}
		scores={small.scores}
		selected={small.selected}
		preview={small.preview}
		label="Islanders mat"
		onWorldMapSelect={selectHandler} />
</div>

<style>
	.rg-island-mat {
		position: absolute;
		inset: 0;
	}
	.rg-island-mat :global(.rg-island-mat--map) {
		width: 100%;
		height: 100%;
	}
</style>
