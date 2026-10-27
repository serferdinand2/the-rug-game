<!-- Library section: TilePicker, the territory tiles in hand as pressable hexes, with the VP each scores on the chosen hex. -->
<script>
	import TilePicker from '../../../lib/components/prompts/TilePicker.svelte';
	import { tilePreview, tileWords } from '../../../lib/area/explore.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/**
	 * @param {number[]} ids
	 * @param {(number | null)[]} [vps]
	 */
	const tilesOf = (ids, vps = []) =>
		ids.map((id, index) => ({
			id,
			label: tileWords(id),
			...tilePreview(id, 0),
			vp: vps[index] ?? null,
		}));

	let picked = $state(5);
	let reported = $state('');
</script>

<Section
	name="TilePicker"
	area="prompts"
	description="The territory tiles in a player's hand as a wrapping row of pressable hexes about 88×80 px. The picked one has a 2px gold outline and a gold tint. When a hex is chosen, each tile carries a corner tag with the VP it would score there.">
	<Example
		label="tiles={3}  (nothing picked)"
		surface="chrome">
		<TilePicker tiles={tilesOf([3, 17, 40])} />
	</Example>
	<Example
		label="selected={17}"
		surface="chrome">
		<TilePicker
			tiles={tilesOf([3, 17, 40])}
			selected={17} />
	</Example>
	<Example
		label="vp on each tile  (including +0)"
		surface="chrome">
		<TilePicker
			tiles={tilesOf([3, 17, 40], [4, 0, 2])}
			selected={3} />
	</Example>
	<Example
		label="one tile alone, picked"
		surface="chrome">
		<TilePicker
			tiles={tilesOf([22], [1])}
			selected={22} />
	</Example>
	<Example
		label="11 tiles in a 296px box  (the docked panel's width, wrapping)"
		surface="chrome">
		<div style="width: 296px">
			<TilePicker
				tiles={tilesOf([1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41])} />
		</div>
	</Example>
	<Example
		label={`selected={${picked}}  ${reported}  (press a tile)`}
		surface="chrome">
		<TilePicker
			tiles={tilesOf([5, 11, 30], [2, 3, 0])}
			selected={picked}
			onTilePickerSelect={(/** @type {ComponentEvent} */ event) => {
				picked = event.value.tile;
				reported = `onTilePickerSelect → { tile: ${event.value.tile} }`;
			}} />
	</Example>
</Section>
