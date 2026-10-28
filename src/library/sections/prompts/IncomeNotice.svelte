<!-- Library section: IncomeNotice, the one-time notice after income turn 1 (#77), with the start every player has and an uneven one. -->
<script>
	import IncomeNotice from '../../../lib/components/prompts/IncomeNotice.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let closed = $state(0);
</script>

<Section
	name="IncomeNotice"
	area="prompts"
	description="When setup ends, the game takes every player's income turn 1, since a first turn is never a choice. Each player then sees this notice once, in the gold income panel: why nobody asked, what they start with, and what every later turn offers. Got it closes it; in the game, so does Escape when nothing else is open, and the footer offers no income while it shows.">
	<Example
		label={`resources={{ coin: 1, worker: 1, food: 1, culture: 1 }}  (every player's start; closed ${closed} times)`}
		wide
		width={1100}>
		<div class="rg-library-income-notice-stage">
			<IncomeNotice
				resources={{ coin: 1, worker: 1, food: 1, culture: 1 }}
				holdings="1 coin, 1 food, 1 worker, 1 culture, 1 territory tile and 1 tapestry card"
				onIncomeNoticeClose={() => (closed += 1)} />
		</div>
	</Example>
	<Example
		label={'resources={{ coin: 2, worker: 0, food: 1, culture: 0 }}  (a civilization changed the start: only what there is shows)'}
		wide
		width={1100}>
		<div class="rg-library-income-notice-stage">
			<IncomeNotice
				resources={{ coin: 2, worker: 0, food: 1, culture: 0 }}
				holdings="2 coins, 1 food and 3 tapestry cards" />
		</div>
	</Example>
</Section>

<style>
	.rg-library-income-notice-stage {
		position: relative;
		height: 420px;
		container-type: inline-size;
		background: var(--texture) var(--surface);
	}
</style>
