<!-- Library section: DecisionPanel, the decision prompt over the shared area, with its scrim, content and Confirm. -->
<script>
	import DecisionOption from '../../../lib/components/prompts/DecisionOption.svelte';
	import DecisionPanel from '../../../lib/components/prompts/DecisionPanel.svelte';
	import IncomeSteps from '../../../lib/components/prompts/IncomeSteps.svelte';
	import TilePicker from '../../../lib/components/prompts/TilePicker.svelte';
	import TurnControl from '../../../lib/components/prompts/TurnControl.svelte';
	import { tilePreview, tileWords } from '../../../lib/area/explore.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {{ label: string, symbols: import('../../../lib/ui.js').CostSymbol[] }[]} */
	const OPTIONS = [
		{ label: 'Pay 1 food and 1 coin', symbols: ['food', 'coin'] },
		{ label: 'Pay 1 food and 1 worker', symbols: ['food', 'worker'] },
		{ label: 'Pay 2 food', symbols: ['food', 'food'] },
	];

	const STEPS = [
		{ id: 'civilization', label: 'Civilization' },
		{ id: 'tapestry', label: 'Tapestry card' },
		{ id: 'upgrade', label: 'Upgrade' },
		{ id: 'score', label: 'Score' },
		{ id: 'income', label: 'Income' },
	];

	/**
	 * Tiles for the explore's row, as the game screen builds them.
	 * @param {number[]} ids
	 * @param {(number | null)[]} [vps]
	 */
	const tilesOf = (ids, vps = []) =>
		ids.map((id, index) => ({
			id,
			label: tileWords(id),
			...tilePreview(id, 0),
			vp: vps[index] ?? null,
		}));

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
	<Example
		label={'track="exploration"  (the bottom bar takes the track tint)'}
		wide
		width={1100}>
		<div class="rg-library-decision-stage rg-library-decision-stage--short">
			<DecisionPanel
				title="Choose a track"
				status="Exploration"
				track="exploration">
				<div class="rg-library-decision-options">
					<DecisionOption
						label="Exploration"
						art={[{ kind: 'track', id: 'exploration' }]}
						pressed />
					<DecisionOption
						label="Science"
						art={[{ kind: 'track', id: 'science' }]} />
				</div>
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={'tone="income" steps={IncomeSteps}'}
		wide
		width={1100}>
		<div class="rg-library-decision-stage rg-library-decision-stage--short">
			<DecisionPanel
				title="Choose a tapestry card"
				tone="income"
				status="Choose a card to continue.">
				{#snippet steps()}
					<IncomeSteps
						steps={STEPS}
						current="tapestry" />
				{/snippet}
				<div class="rg-library-decision-options">
					<DecisionOption
						label="Take 1 coin"
						art={[{ kind: 'resource', id: 'coin', count: 1 }]} />
					<DecisionOption
						label="Take 2 food"
						art={[{ kind: 'resource', id: 'food', count: 2 }]}
						pressed />
				</div>
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={'docked  (a choice on the map: no scrim, the panel at the right, what is chosen on its own line)'}
		wide
		width={1100}>
		<div class="rg-library-decision-stage">
			<DecisionPanel
				title="Choose a territory to conquer"
				status="Hex 1,0, held by Ben"
				confirmLabel="Conquer"
				cancelLabel="Choose another territory"
				docked>
				<div class="rg-library-decision-options">
					<DecisionOption
						label="Hex 1,0, held by Ben"
						pressed />
				</div>
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={"docked  (an explore: the player's tiles, the chosen hex and the turn)"}
		wide
		width={1100}>
		<div class="rg-library-decision-stage rg-library-decision-stage--tall">
			<DecisionPanel
				title="Choose where to explore"
				confirmLabel="Explore"
				docked>
				{@render exploreTiles(tilesOf([6, 19, 33], [3, 4, 2]), 19)}
				{#snippet pinned()}
					{@render exploreChosen('Hex 1,0, turned 3 times', 3)}
				{/snippet}
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={'docked  (an explore with 11 tiles in a box 700px tall: the tiles scroll; what is chosen, the turn and Explore stay in sight)'}
		wide
		width={1100}>
		<div class="rg-library-decision-stage rg-library-decision-stage--700">
			<DecisionPanel
				title="Choose where to explore"
				confirmLabel="Explore"
				confirmDisabled
				docked>
				{@render exploreTiles(
					tilesOf([1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41]),
					null
				)}
				{#snippet pinned()}
					{@render exploreChosen(
						'Pick a tile, or a lit hex on the map.',
						null
					)}
				{/snippet}
			</DecisionPanel>
		</div>
	</Example>
</Section>

<!-- The explore as the game screen draws it: the lead and the tile row scroll in the content, while what is chosen
     and the turn control are pinned above the actions, with no status line. -->
{#snippet exploreTiles(
	/** @type {ReturnType<typeof tilesOf>} */ tiles,
	/** @type {number | null} */ selected
)}
	<div class="rg-library-explore">
		<p class="rg-library-explore--lead">
			Pick one of your tiles and a lit hex, then turn the tile until you
			like it.
		</p>
		<p class="rg-library-explore--label">Your tiles · {tiles.length}</p>
		<TilePicker
			{tiles}
			{selected} />
	</div>
{/snippet}

{#snippet exploreChosen(
	/** @type {string} */ chosen,
	/** @type {number | null} */ vp
)}
	<div class="rg-library-explore">
		<p
			class="rg-library-explore--chosen"
			role="status">
			{chosen}{#if vp !== null}<span class="rg-library-explore--spoken"
					>, {vp} VP</span
				>{/if}
		</p>
		<TurnControl {vp} />
	</div>
{/snippet}

<style>
	.rg-library-decision-stage {
		position: relative;
		height: 420px;
		background: var(--texture) var(--surface);
	}

	.rg-library-decision-stage--short {
		height: 340px;
	}

	.rg-library-decision-stage--tall {
		height: 620px;
	}

	.rg-library-decision-stage--700 {
		height: 700px;
	}

	/* The explore's content, styled as the game screen styles it (src/screens/Game.svelte). */
	.rg-library-explore {
		display: grid;
		gap: var(--space-6);
	}

	.rg-library-explore--lead,
	.rg-library-explore--label,
	.rg-library-explore--chosen {
		margin: 0;
	}

	.rg-library-explore--lead {
		color: var(--muted);
		font-size: var(--font-size-md);
	}

	.rg-library-explore--label {
		color: var(--muted);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-bold);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}

	.rg-library-explore--chosen {
		color: var(--text);
		font-size: var(--font-size-md);
	}

	.rg-library-explore--spoken {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	.rg-library-decision-options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
	}
</style>
