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
	<Example
		label={`art={[food ×2]}  (48px above the words)`}
		surface="chrome">
		<DecisionOption
			label="Take 2 food"
			art={[{ kind: 'resource', id: 'food', count: 2 }]} />
	</Example>
	<Example
		label={`art={[track]} vp={4}  (the gold +n VP badge)`}
		surface="chrome">
		<DecisionOption
			label="Advance on Science"
			art={[{ kind: 'track', id: 'science' }]}
			vp={4} />
	</Example>
	<Example
		label={`art={[coin, worker]} pressed`}
		surface="chrome">
		<DecisionOption
			label="Take 1 coin and 1 worker"
			art={[
				{ kind: 'resource', id: 'coin', count: 1 },
				{ kind: 'resource', id: 'worker', count: 1 },
			]}
			pressed />
	</Example>
</Section>
