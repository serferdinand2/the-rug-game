<!-- Library section: TieSteps for a tie the tallest landmark separates, and a shared victory. -->
<script>
	import TieSteps from '../../../lib/components/results/TieSteps.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {import('../../../lib/results.js').TieExplanation} */
	const SPLIT = {
		vp: 87,
		intro: 'You and Ana both finished on 87 VP. Under the current official rules, the tiebreaks decide their order.',
		steps: [
			{
				title: 'Tallest landmark in the capital',
				values: [
					{
						seat: 1,
						name: 'You',
						value: 'Fusion Reactor',
						landmark: true,
					},
					{
						seat: 2,
						name: 'Ana',
						value: 'Lighthouse',
						landmark: true,
					},
				],
				separates: true,
			},
		],
		outcome: 'You take 1st place.',
	};

	/** @type {import('../../../lib/results.js').TieExplanation} */
	const SHARED = {
		vp: 87,
		intro: 'You and Ana both finished on 87 VP. Under the current official rules, the tiebreaks decide their order.',
		steps: [
			{
				title: 'Tallest landmark in the capital',
				values: [
					{
						seat: 1,
						name: 'You',
						value: 'Fusion Reactor',
						landmark: true,
					},
					{
						seat: 2,
						name: 'Ana',
						value: 'Fusion Reactor',
						landmark: true,
					},
				],
				separates: false,
			},
			{
				title: 'Resources left',
				values: [
					{
						seat: 1,
						name: 'You',
						value: '2 resources',
						landmark: false,
					},
					{
						seat: 2,
						name: 'Ana',
						value: '2 resources',
						landmark: false,
					},
				],
				separates: false,
			},
		],
		outcome: 'You and Ana share 1st place.',
	};
</script>

<Section
	name="TieSteps"
	area="results"
	description="How a tie was decided, step by step, as the owner asked (#15): who tied, then each step of the rules' chain with every tied player's value (a landmark's name in gold) and whether it separated them, then the outcome.">
	<Example label={'tie={separated by the tallest landmark}'}>
		<div style="width: 340px">
			<TieSteps tie={SPLIT} />
		</div>
	</Example>
	<Example label={'tie={a shared victory}'}>
		<div style="width: 340px">
			<TieSteps tie={SHARED} />
		</div>
	</Example>
</Section>
