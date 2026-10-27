<!-- Library section: IncomeSteps, the strip of an income turn's steps. -->
<script>
	import IncomeSteps from '../../../lib/components/prompts/IncomeSteps.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const STEPS = [
		{ id: 'civilization', label: 'Civilization' },
		{ id: 'tapestry', label: 'Tapestry card' },
		{ id: 'upgrade', label: 'Upgrade' },
		{ id: 'score', label: 'Score' },
		{ id: 'income', label: 'Income' },
	];
</script>

<Section
	name="IncomeSteps"
	area="prompts"
	description="The steps of the viewer's income turn in order. The one running now is gold and marked aria-current=step. Inside an income-toned DecisionPanel it becomes the gold band.">
	<Example
		label={'current="tapestry"'}
		surface="chrome">
		<IncomeSteps
			steps={STEPS}
			current="tapestry" />
	</Example>
	<Example
		label={'current={null}'}
		surface="chrome">
		<IncomeSteps steps={STEPS} />
	</Example>
</Section>
