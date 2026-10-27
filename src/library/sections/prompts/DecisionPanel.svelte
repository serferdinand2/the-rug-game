<!-- Library section: DecisionPanel, the decision prompt over the shared area, with its scrim, content and Confirm. -->
<script>
	import DecisionOption from '../../../lib/components/prompts/DecisionOption.svelte';
	import DecisionPanel from '../../../lib/components/prompts/DecisionPanel.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {{ label: string, symbols: import('../../../lib/ui.js').CostSymbol[] }[]} */
	const OPTIONS = [
		{ label: 'Pay 1 food and 1 coin', symbols: ['food', 'coin'] },
		{ label: 'Pay 1 food and 1 worker', symbols: ['food', 'worker'] },
		{ label: 'Pay 2 food', symbols: ['food', 'food'] },
	];

	/** @type {number | null} */
	let picked = $state(null);
	let sent = $state('');
</script>

<Section
	name="DecisionPanel"
	area="prompts"
	description="The decision prompt: a dark scrim over the shared area only, and the panel a little above the footer with the question, the choices and Confirm. It grows with its content up to the shared area and scrolls inside.">
	<Example
		label={'title="How do you pay for Ships?"  (choose, then Confirm)'}
		wide
		width={1100}>
		<div class="rg-library-decision-stage">
			<DecisionPanel
				title="How do you pay for Ships?"
				status={sent
					? `Sent: ${sent}`
					: picked === null
						? 'Choose a payment to continue.'
						: OPTIONS[picked].label}
				confirmDisabled={picked === null}
				cancelLabel="Cancel"
				onDecisionPanelConfirm={() =>
					(sent = picked === null ? '' : OPTIONS[picked].label)}
				onDecisionPanelCancel={() => {
					picked = null;
					sent = '';
				}}>
				<div class="rg-library-decision-options">
					{#each OPTIONS as option, index (option.label)}
						<DecisionOption
							label={option.label}
							symbols={option.symbols}
							pressed={picked === index}
							onDecisionOptionClick={() => (picked = index)} />
					{/each}
				</div>
			</DecisionPanel>
		</div>
	</Example>
</Section>

<style>
	.rg-library-decision-stage {
		position: relative;
		height: 420px;
		background: var(--texture) var(--surface);
	}

	.rg-library-decision-options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
	}
</style>
