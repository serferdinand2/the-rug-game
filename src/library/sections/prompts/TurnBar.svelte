<!-- Library section: TurnBar in its neutral, selected, optional and waiting tones, and the Ships walk-through from the mockup. -->
<script>
	import TurnBar from '../../../lib/components/prompts/TurnBar.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const INCOME = {
		description: 'End this era, gain income and begin your next era.',
		label: 'Take income',
	};

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
	description="The footer. It always says what the current decision is, or what another player is doing. Its cost and actions sit at the right. While a space is chosen, the income choice folds behind Your turn and opens on hover or keyboard focus.">
	<Example
		label={'tone="neutral" income={…}'}
		surface="ink"
		wide>
		<TurnBar
			heading="The table is waiting for your move"
			detail="Choose an available advancement space or take income."
			income={INCOME} />
	</Example>
	<Example
		label={`tone="selected" properName="Ships" track="exploration" cost={['food', 'any']}  (hover or tab to Your turn)`}
		surface="ink"
		wide>
		<TurnBar
			tone="selected"
			heading="Advance to"
			properName="Ships"
			detail="Gain 1 VP per territory you control. You control 4 territories."
			track="exploration"
			cost={['food', 'any']}
			income={INCOME}>
			{#snippet actions()}
				<Button mode="primary">Advance · +4 VP</Button>
			{/snippet}
		</TurnBar>
	</Example>
	<Example
		label={`tone="optional" label="Optional action" properName="Farm" properIcon headingEnd="?" cost={['food']}`}
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
			income={INCOME}>
			{#snippet actions()}
				<Button>Skip</Button>
				<Button mode="primary">Pay &amp; build</Button>
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
			heading="Income turn 2 of 5"
			detail="Choose a tapestry card to play." />
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
				income={INCOME}
				onTurnBarIncome={() => go('neutral', 'onTurnBarIncome')} />
		{:else if step === 'selected'}
			<TurnBar
				tone="selected"
				heading="Advance to"
				properName="Ships"
				detail="Gain 1 VP per territory you control. You control 4 territories."
				track="exploration"
				cost={['food', 'any']}
				income={INCOME}
				onTurnBarIncome={() => go('neutral', 'onTurnBarIncome')}>
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
				income={INCOME}>
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
