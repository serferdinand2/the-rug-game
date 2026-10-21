<!-- Library section: TierPrice for each era, in track colours, normal and highlighted. -->
<script>
	import TierPrice from '../../../lib/components/board/TierPrice.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	// Three spaces' width at the 1920×1080 reference.
	const TIER = 'width: 346px';
</script>

<Section
	name="TierPrice"
	area="board"
	description="One tier's price centred over its three spaces: the era numeral, a dot and the price symbols between two rules as thick as the progress lines. The rules and text turn gold while one of the tier's spaces is hovered or focused.">
	<Example label={'era={1} symbols={["any"]} track="exploration"'}>
		<div style={TIER}>
			<TierPrice
				era={1}
				symbols={['any']}
				track="exploration" />
		</div>
	</Example>
	<Example label={'era={2} symbols={["food", "any"]} track="exploration"'}>
		<div style={TIER}>
			<TierPrice
				era={2}
				symbols={['food', 'any']}
				track="exploration" />
		</div>
	</Example>
	<Example
		label={'era={2} symbols={["food", "any"]} track="exploration" highlighted'}>
		<div style={TIER}>
			<TierPrice
				era={2}
				symbols={['food', 'any']}
				track="exploration"
				highlighted />
		</div>
	</Example>
	<Example
		label={'era={3} symbols={["worker", "any", "any"]} track="science"'}>
		<div style={TIER}>
			<TierPrice
				era={3}
				symbols={['worker', 'any', 'any']}
				track="science" />
		</div>
	</Example>
	<Example label={'era={4} symbols={["coin", "coin"]} track="technology"'}>
		<div style={TIER}>
			<TierPrice
				era={4}
				symbols={['coin', 'coin']}
				track="technology" />
		</div>
	</Example>
	<Example
		label={'era={4} symbols={["culture", "culture"]} track="military" highlighted'}>
		<div style={TIER}>
			<TierPrice
				era={4}
				symbols={['culture', 'culture']}
				track="military"
				highlighted />
		</div>
	</Example>
</Section>
