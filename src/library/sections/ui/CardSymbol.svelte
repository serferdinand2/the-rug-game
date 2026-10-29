<script>
	import CardSymbol from '../../../lib/components/ui/CardSymbol.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	/** @type {Array<'tech' | 'tapestry' | 'civilization'>} */
	const kinds = ['tech', 'tapestry', 'civilization'];
</script>

<Section
	name="CardSymbol"
	area="ui"
	description="Native 24px tech, tapestry and civilization card symbols, traced from the approved transparent PNGs. The same SVG assets appear on advancement tracks and in the art gallery.">
	{#each kinds as kind}
		<Example
			label={`${kind} card · 24px`}
			surface="chrome">
			<CardSymbol {kind} />
		</Example>
	{/each}
</Section>
