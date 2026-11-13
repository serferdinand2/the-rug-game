<!-- Library section: ArtsSymbol, the four shared Arts & Architecture symbols. -->
<script>
	import ArtsSymbol from '../../../lib/components/board/ArtsSymbol.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="ArtsSymbol"
	area="board"
	description="The four Arts & Architecture track benefits: create a masterpiece, inspire an income row, gain an income building, and broadcast. They share sizing and alignment with track symbols.">
	<Example label="create — masterpiece deck back">
		<ArtsSymbol kind="create" size={36} />
	</Example>
	<Example label="inspire — choose an income row">
		<ArtsSymbol kind="inspire" size={36} />
	</Example>
	<Example label="building — choose an income building">
		<ArtsSymbol kind="building" size={36} />
	</Example>
	<Example label="broadcast">
		<ArtsSymbol kind="broadcast" size={36} />
	</Example>
</Section>
