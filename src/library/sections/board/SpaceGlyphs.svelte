<!-- Library section: SpaceGlyphs with every kind of glyph, counts, the red X, and the dense and bonus variants. -->
<script>
	import SpaceGlyphs from '../../../lib/components/board/SpaceGlyphs.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/glyphs.js').Glyph} Glyph */

	// A row like a space's benefit: the glyphs are its items, as SpaceGlyphs draws no box of its own.
	const ROW =
		'display: flex; flex-wrap: wrap; align-items: center; gap: 4px 3px';

	/** @type {Glyph[]} */
	const ART = [
		{ kind: 'resource', id: 'coin', count: 1 },
		{ kind: 'resource', id: 'food', count: 2 },
		{ kind: 'resource', id: 'any', count: 1 },
		{ kind: 'building', id: 'house', count: 1 },
		{ kind: 'building', id: 'armory', count: 3 },
		{ kind: 'track', id: 'science' },
	];

	/** @type {Glyph[]} */
	const SYMBOLS = [
		{ kind: 'word', text: 'Tile', count: 2 },
		{ kind: 'word', text: 'Space tile', count: 1 },
		{ kind: 'word', text: 'Explore', count: 1 },
		{ kind: 'word', text: 'Science die', count: 1 },
		{ kind: 'word', text: 'Conquer', count: 1 },
		{ kind: 'word', text: 'Tech', count: 1 },
		{ kind: 'word', text: 'Invent', count: 2 },
		{ kind: 'word', text: 'Tapestry', count: 2 },
		{ kind: 'word', text: 'Civilization', count: 1 },
	];

	/** @type {Glyph[]} */
	const SHAPES = [
		{ kind: 'word', text: 'Advance', count: 2 },
		{ kind: 'word', text: 'May advance', count: 1 },
		{ kind: 'word', text: 'Regress', count: 1 },
		{ kind: 'word', text: 'Upgrade', count: 1 },
		{ kind: 'word', text: 'Circle benefit', count: 1 },
		{ kind: 'word', text: 'Square benefit', count: 1 },
		{ kind: 'word', text: 'Score capital', count: 1 },
		{ kind: 'word', text: 'Restart', count: 1 },
		{ kind: 'word', text: 'Repeat', count: 1 },
		{ kind: 'word', text: 'May refresh', count: 1 },
	];

	/** @type {Glyph[]} */
	const WORDS = [
		{ kind: 'word', text: 'Track lead', count: 1 },
		{ kind: 'word', text: 'Landmark', count: 2 },
		{ kind: 'word', text: 'Both dice', count: 1 },
		{ kind: 'word', text: 'Science die', count: 1, cross: true },
		{ kind: 'word', text: 'Opponent', count: 1, cross: true },
	];

	/** @type {Glyph[]} */
	const SCORING = [
		{ kind: 'vp', count: 5 },
		{ kind: 'or' },
		{ kind: 'vp', count: null },
		{ kind: 'per' },
		{ kind: 'building', id: 'market', count: 1 },
		{ kind: 'plus' },
		{ kind: 'word', text: 'Tapestry', count: 1 },
	];

	/** Glyphs as Glass, Steel and Plastic draw them, sharing a short space with a bonus. @type {Glyph[]} */
	const DENSE = [
		{ kind: 'resource', id: 'coin', count: 1 },
		{ kind: 'or' },
		{ kind: 'word', text: 'Tile', count: 1 },
		{ kind: 'or' },
		{ kind: 'vp', count: null },
		{ kind: 'per' },
		{ kind: 'building', id: 'house', count: 1 },
	];
</script>

<Section
	name="SpaceGlyphs"
	area="board"
	description="A track space's symbols in a row (#115): resources, buildings and tracks as their art, with ×N over one; tiles, cards, explore, conquer and the science die as their symbols (tiles and inventions repeat); the arrows, Upgrade, the circle and square benefits, Score capital, Restart, Repeat and May refresh as their shapes; any other word in a small box, and a red X on a benefit taken without its own benefit; VP and the ×, + and / joints. Its root has no box, so the glyphs lay out in the row, grid or column around them. TrackSpace draws its benefit and bonus with it, and its container steps resize the glyphs: in a short space the words and the X tighten, in a large one the pictures grow.">
	<Example label={'glyphs={[resources, buildings, a track]}'}>
		<div style={ROW}>
			<SpaceGlyphs glyphs={ART} />
		</div>
	</Example>
	<Example
		label={'glyphs={[tiles, explore, the science die, conquer, cards]}'}>
		<div style={ROW}>
			<SpaceGlyphs glyphs={SYMBOLS} />
		</div>
	</Example>
	<Example
		label={'glyphs={[the arrows, Upgrade, the benefit shapes, Score capital, Restart, Repeat, May refresh]}'}>
		<div style={ROW}>
			<SpaceGlyphs glyphs={SHAPES} />
		</div>
	</Example>
	<Example
		label={'glyphs={[words, a small note, crossed glyphs]}  (cross: true draws the red X)'}>
		<div style={ROW}>
			<SpaceGlyphs glyphs={WORDS} />
		</div>
	</Example>
	<Example label={'glyphs={[VP, /, VP, ×, a building, +, a card]}'}>
		<div style={ROW}>
			<SpaceGlyphs glyphs={SCORING} />
		</div>
	</Example>
	<Example
		label={'variant="dense"  (Glass, Steel and Plastic: 18px pictures, buildings and VP at full size, shorter joints)'}>
		<div style={ROW}>
			<SpaceGlyphs
				glyphs={DENSE}
				variant="dense" />
		</div>
	</Example>
	<Example
		label={'variant="bonus"  (18px pictures, gold words without a box)'}>
		<div style="{ROW}; color: var(--gold)">
			<SpaceGlyphs
				glyphs={[{ kind: 'resource', id: 'any', count: 1 }]}
				variant="bonus" />
			<b>:</b>
			<SpaceGlyphs
				glyphs={[
					{ kind: 'word', text: 'Tapestry', count: 3 },
					{ kind: 'or' },
					{ kind: 'vp', count: 10 },
					{ kind: 'word', text: 'Landmark', count: 1 },
				]}
				variant="bonus" />
		</div>
	</Example>
</Section>
