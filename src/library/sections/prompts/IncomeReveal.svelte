<!-- Library section: IncomeReveal open with its key, folded to its button, and disabled (#122, #174). -->
<script>
	import IncomeReveal from '../../../lib/components/prompts/IncomeReveal.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { incomeWords } from '../../../lib/turn.js';

	const INCOME = {
		description: incomeWords(2),
		label: 'Take income',
	};

	let pressed = $state(0);
</script>

<Section
	name="IncomeReveal"
	area="prompts"
	description="The footer's Take income, first among the actions on its right (#174), with what taking income does. Folded, while a space is chosen, only its button shows, its words as the title, and they open while the reveal is hovered or holds the keyboard focus; disabled, it can't be reached.">
	<Example
		label={`description label onIncomeRevealClick  (pressed ${pressed} ${pressed === 1 ? 'time' : 'times'})`}
		surface="chrome"
		wide>
		<div class="rg-library-income-reveal">
			<IncomeReveal
				{...INCOME}
				shortcut="I"
				onIncomeRevealClick={() => (pressed += 1)} />
		</div>
	</Example>
	<Example
		label={'folded shortcut="I"  (hover or tab to it)'}
		surface="chrome"
		wide>
		<div class="rg-library-income-reveal">
			<IncomeReveal
				{...INCOME}
				shortcut="I"
				folded
				onIncomeRevealClick={() => (pressed += 1)} />
		</div>
	</Example>
	<Example
		label="folded disabled  (stays closed on hover)"
		surface="chrome"
		wide>
		<div class="rg-library-income-reveal">
			<IncomeReveal
				{...INCOME}
				folded
				disabled />
		</div>
	</Example>
</Section>

<style>
	/* A row as tall as the footer's actions, the reveal at its right. */
	.rg-library-income-reveal {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		min-height: 48px;
	}
</style>
