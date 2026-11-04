<!-- Library section: SymbolKey, the key to the track spaces' symbols that How to play's Symbols tab shows. -->
<script>
	import SymbolKey from '../../../lib/components/board/SymbolKey.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="SymbolKey"
	area="board"
	description="Every symbol the track spaces draw and what it means (#174), each drawn by SpaceGlyphs as the board draws it, in three groups: what you gain or do, buildings and resources, and how a space reads. How to play shows it as its Symbols tab.">
	<Example
		label={'groups={SYMBOL_KEY}  (the default)'}
		surface="chrome"
		wide>
		<SymbolKey />
	</Example>
</Section>
