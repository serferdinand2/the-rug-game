<!-- Library section: DecisionOption, one choice in a decision prompt, plain or with resource symbols, pressed or not. -->
<script>
	import DecisionOption from '../../../lib/components/prompts/DecisionOption.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let pressed = $state(false);
</script>

<Section
	name="DecisionOption"
	area="prompts"
	description="One choice in a decision prompt: its words, optionally led by native 24px resource symbols, with a gold outline while it is the chosen one.">
	<Example
		label={'label="Take 1 coin"'}
		surface="chrome">
		<DecisionOption label="Take 1 coin" />
	</Example>
	<Example
		label={`symbols={['food', 'worker']} pressed={${pressed}}  (press it)`}
		surface="chrome">
		<DecisionOption
			label="Pay 1 food and 1 worker"
			symbols={['food', 'worker']}
			{pressed}
			onDecisionOptionClick={() => (pressed = !pressed)} />
	</Example>
</Section>
