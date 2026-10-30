<!-- Library section: IncomeReveal open, folded behind a stand-in turn label, and disabled (#122). -->
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
	description="The footer's Take income beside the turn label, with what taking income does. Folded, it closes to nothing and opens while its parent, the turn label's group in TurnBar, is hovered or holds the keyboard focus; disabled, it stays closed and can't be reached.">
	<Example
		label={`description label onIncomeRevealClick  (pressed ${pressed} ${pressed === 1 ? 'time' : 'times'})`}
		surface="chrome"
		wide>
		<div class="rg-library-income-reveal">
			<IncomeReveal
				{...INCOME}
				onIncomeRevealClick={() => (pressed += 1)} />
			<span class="rg-library-income-reveal--label">Your turn</span>
		</div>
	</Example>
	<Example
		label="folded  (hover or tab to Your turn)"
		surface="chrome"
		wide>
		<div class="rg-library-income-reveal">
			<IncomeReveal
				{...INCOME}
				folded
				onIncomeRevealClick={() => (pressed += 1)} />
			<span class="rg-library-income-reveal--label">Your turn</span>
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
			<span class="rg-library-income-reveal--label">Optional action</span>
		</div>
	</Example>
</Section>

<style>
	/* A stand-in for TurnBar's label group, the reveal's parent. */
	.rg-library-income-reveal {
		display: flex;
		align-items: center;
		min-height: 48px;
	}

	.rg-library-income-reveal--label {
		color: var(--gold);
		font: italic var(--weight-title) var(--font-size-xl) /
			var(--leading-none) var(--font-title);
		white-space: nowrap;
	}
</style>
