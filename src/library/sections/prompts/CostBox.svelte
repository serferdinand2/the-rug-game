<!-- Library section: CostBox with a track's colour, as an optional cost, and with resource colours on a bronze border. -->
<script>
	import CostBox from '../../../lib/components/prompts/CostBox.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="CostBox"
	area="prompts"
	description="The price in the footer, just before the action buttons: a Cost label and the resource symbols joined by plus signs. With a track, the squares and the border take the track's colour. Its aria-label reads the price in words.">
	<Example
		label={`symbols={['food', 'any']} track="exploration"`}
		surface="chrome">
		<CostBox
			symbols={['food', 'any']}
			track="exploration" />
	</Example>
	<Example
		label={`symbols={['food']} track="exploration" label="Optional cost"`}
		surface="chrome">
		<CostBox
			symbols={['food']}
			track="exploration"
			label="Optional cost" />
	</Example>
	<Example
		label={`symbols={['culture', 'any', 'any']} track="military"`}
		surface="chrome">
		<CostBox
			symbols={['culture', 'any', 'any']}
			track="military" />
	</Example>
	<Example
		label={`symbols={['coin', 'worker']}  (no track)`}
		surface="chrome">
		<CostBox symbols={['coin', 'worker']} />
	</Example>
</Section>
