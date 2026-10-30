<!-- Library section: TurnBar in its neutral, selected, optional and waiting tones with the income reveal passed in (#122), the forced and first income turns (#77), the finished game (#105), and the Ships walk-through from the mockup. -->
<script>
	import IncomeReveal from '../../../lib/components/prompts/IncomeReveal.svelte';
	import TurnBar from '../../../lib/components/prompts/TurnBar.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { incomeWords } from '../../../lib/turn.js';

	const INCOME = {
		description: incomeWords(2),
		label: 'Take income',
	};

	const FORCED = "You can't pay for any advance, so take an income turn.";

	/** @type {'neutral' | 'selected' | 'optional'} */
	let step = $state('neutral');
	let lastEvent = $state('');

	let label = $derived(
		`tone="${step}"  (click Ships, then the footer's buttons)${lastEvent ? `  · last: ${lastEvent}` : ''}`
	);

	/**
	 * Moves the walk-through on and names the callback that did it.
	 * @param {'neutral' | 'selected' | 'optional'} next
	 * @param {string} callback
	 */
	function go(next, callback) {
		step = next;
		lastEvent = callback;
	}
</script>

{#snippet open()}
	<IncomeReveal {...INCOME} />
{/snippet}

{#snippet folded()}
	<IncomeReveal
		{...INCOME}
		folded />
{/snippet}

{#snippet unavailable()}
	<IncomeReveal
		{...INCOME}
		folded
		disabled />
{/snippet}

{#snippet openWalk()}
	<IncomeReveal
		{...INCOME}
		onIncomeRevealClick={() => go('neutral', 'onIncomeRevealClick')} />
{/snippet}

{#snippet foldedWalk()}
	<IncomeReveal
		{...INCOME}
		folded
		onIncomeRevealClick={() => go('neutral', 'onIncomeRevealClick')} />
{/snippet}

{#snippet farm()}
	<svg
		viewBox="0 0 18 18"
		width="100%"
		height="100%"
		aria-hidden="true"
		><path
			d="M2 8.2 9 3l7 5.2M4 7v8h10V7M7 15v-4h4v4M2 16h14M3 12c1.4-.9 2.7-.9 4 0m4 0c1.4-.9 2.7-.9 4 0"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round" /></svg>
{/snippet}

<Section
	name="TurnBar"
	area="prompts"
	description="The footer gives the turn's context while the decision panel asks the question. Its cost and actions sit at the right. While a space is chosen, the income choice folds behind Your turn and opens on hover or keyboard focus.">
	<Example
		label={'tone="neutral" reveal={IncomeReveal}'}
		surface="ink"
		wide>
		<TurnBar
			heading="The table is waiting for your move"
			detail="Choose an available advancement space or take income."
			reveal={open} />
	</Example>
	<Example
		label={`tone="selected" properName="Ships" track="exploration" cost={['food', 'any']} reveal={IncomeReveal folded}  (hover or tab to Your turn)`}
		surface="ink"
		wide>
		<TurnBar
			tone="selected"
			heading="Advance to"
			properName="Ships"
			detail="Gain 1 VP per territory you control. You control 4 territories."
			track="exploration"
			cost={['food', 'any']}
			reveal={folded}>
			{#snippet actions()}
				<Button mode="primary">Advance · +4 VP</Button>
			{/snippet}
		</TurnBar>
	</Example>
	<Example
		label={`tone="optional" label="Optional action" properName="Farm" properIcon headingEnd="?" cost={['food']} reveal={IncomeReveal folded disabled}`}
		surface="ink"
		wide>
		<TurnBar
			tone="optional"
			label="Optional action"
			heading="Build a"
			properName="Farm"
			properIcon={farm}
			headingEnd="?"
			detail="Pay the shown resource to place a Farm in your capital city, or skip this benefit."
			track="exploration"
			cost={['food']}
			reveal={unavailable}>
			{#snippet actions()}
				<Button>Skip</Button>
				<Button mode="primary">Pay &amp; build</Button>
			{/snippet}
		</TurnBar>
	</Example>
	<Example
		label={'label="Your decision"  (question stays in the panel)'}
		surface="ink"
		wide>
		<TurnBar
			label="Your decision"
			heading="Your turn · Advance to Navigation" />
	</Example>
	<Example
		label={'heading="You can\'t pay for any advance…"  (income is the only move: a gold Take income where Advance sits, no reveal; #77)'}
		surface="ink"
		wide>
		<TurnBar
			heading={FORCED}
			detail={incomeWords(3)}>
			{#snippet actions()}
				<Button mode="gold">Take income</Button>
			{/snippet}
		</TurnBar>
	</Example>
	<Example
		label={'the same before income turn 5, and with a track space selected  (the footer keeps it: no Advance; #77)'}
		surface="ink"
		wide>
		<TurnBar
			heading={FORCED}
			detail={incomeWords(5)}>
			{#snippet actions()}
				<Button mode="gold">Take income</Button>
			{/snippet}
		</TurnBar>
	</Example>
	<Example
		label={'tone="income" detail="Every player\'s first turn…"  (income turn 1 asking something, such as the tapestry draft; #77)'}
		surface="ink"
		wide>
		<TurnBar
			tone="income"
			label="Your income turn"
			heading="Income turn 1 · Income"
			detail="Every player’s first turn is an income turn." />
	</Example>
	<Example
		label={'tone="waiting"  (another player\'s income turn 1 asking them something; #77)'}
		surface="ink"
		wide>
		<TurnBar
			tone="waiting"
			label="Ana’s turn"
			labelColor="var(--player-2)"
			heading="Ana is taking their first income turn." />
	</Example>
	<Example
		label={'heading="Take an income turn?"  (Take income or I asks first; I or Enter takes it, Esc goes back; #83)'}
		surface="ink"
		wide>
		<TurnBar
			heading="Take an income turn?"
			detail={incomeWords(2)}>
			{#snippet actions()}
				<Button>Cancel</Button>
				<Button mode="gold">Take income</Button>
			{/snippet}
		</TurnBar>
	</Example>
	<Example
		label={'heading="Advance on which track?"  (after A: 1 to 4 answer, a track with nothing to pay for is off; #83)'}
		surface="ink"
		wide>
		<TurnBar
			heading="Advance on which track?"
			detail="Press its number, or Esc to go back.">
			{#snippet actions()}
				<Button>1 · Exploration</Button>
				<Button>2 · Science</Button>
				<Button disabled>3 · Technology</Button>
				<Button>4 · Military</Button>
				<Button>Cancel</Button>
			{/snippet}
		</TurnBar>
	</Example>
	<Example
		label={'tone="income" label="Income turn"  (gold, no income button)'}
		surface="ink"
		wide>
		<TurnBar
			tone="income"
			label="Income turn"
			heading="Income turn 2 · Tapestry" />
	</Example>
	<Example
		label={'tone="waiting" label="Ana’s turn" labelColor="var(--player-2)"'}
		surface="ink"
		wide>
		<TurnBar
			tone="waiting"
			label="Ana’s turn"
			labelColor="var(--player-2)"
			heading="Ana is choosing where to conquer…" />
	</Example>
	<Example
		label={'tone="complete" label="Game complete"  (the results footer, as the host sees it; #105)'}
		surface="ink"
		wide>
		<TurnBar
			tone="complete"
			label="Game complete"
			heading="The game is complete."
			detail="The final standings, and where each player's VP came from.">
			{#snippet actions()}
				<Button>Review game board</Button>
				<Button mode="secondary">Return to tables</Button>
				<Button mode="gold">Deal again</Button>
			{/snippet}
		</TurnBar>
	</Example>
	<Example
		label={'tone="complete"  (the board review after the game, with Results back)'}
		surface="ink"
		wide>
		<TurnBar
			tone="complete"
			label="Game complete"
			heading="The game is complete."
			detail="The board as the game ended.">
			{#snippet actions()}
				<Button mode="gold">Results</Button>
			{/snippet}
		</TurnBar>
	</Example>
	<Example
		{label}
		surface="ink"
		wide>
		<p>
			<Button
				size="small"
				selected={step !== 'neutral'}
				disabled={step !== 'neutral'}
				onButtonClick={() => go('selected', 'Ships space chosen')}
				>Ships (stands in for the track space)</Button>
		</p>
		{#if step === 'neutral'}
			<TurnBar
				heading="The table is waiting for your move"
				detail="Choose an available advancement space or take income."
				reveal={openWalk} />
		{:else if step === 'selected'}
			<TurnBar
				tone="selected"
				heading="Advance to"
				properName="Ships"
				detail="Gain 1 VP per territory you control. You control 4 territories."
				track="exploration"
				cost={['food', 'any']}
				reveal={foldedWalk}>
				{#snippet actions()}
					<Button
						mode="primary"
						onButtonClick={() => go('optional', 'Advance')}
						>Advance · +4 VP</Button>
				{/snippet}
			</TurnBar>
		{:else}
			<TurnBar
				tone="optional"
				label="Optional action"
				heading="Build a"
				properName="Farm"
				properIcon={farm}
				headingEnd="?"
				detail="Pay the shown resource to place a Farm in your capital city, or skip this benefit."
				track="exploration"
				cost={['food']}
				reveal={unavailable}>
				{#snippet actions()}
					<Button onButtonClick={() => go('neutral', 'Skip')}
						>Skip</Button>
					<Button
						mode="primary"
						onButtonClick={() => go('neutral', 'Pay & build')}
						>Pay &amp; build</Button>
				{/snippet}
			</TurnBar>
		{/if}
	</Example>
</Section>
