<!-- Library section: DiceTray, the roll in the middle of the screen for the whole table (#61): a conquest's dice, and two science rolls in one batch. -->
<script>
	import DiceTray from '../../../lib/components/board/DiceTray.svelte';
	import DecisionPanel from '../../../lib/components/prompts/DecisionPanel.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
	import CardShelf from '../../../lib/components/prompts/CardShelf.svelte';
	import Example from '../../Example.svelte';
	import Screen from '../../Screen.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/dice.js').Roll} Roll */

	/** @type {Roll[]} */
	const CONQUEST = [
		{
			id: '1',
			player: 2,
			dice: [
				{ die: 'red', face: 1 },
				{ die: 'black', face: 2 },
			],
			caption: 'Vera rolls the conquer dice',
			spoken: 'Vera rolled the conquer dice: red 5 VP, black 1 food.',
			bust: false,
		},
	];
	/** @type {Roll[]} */
	const EMPIRICISM = [
		{
			id: '2',
			player: 1,
			dice: [{ die: 'science', face: 0 }],
			caption: 'You roll the science die',
			spoken: 'Ana rolled Exploration on the science die.',
			bust: false,
		},
		{
			id: '3',
			player: 1,
			dice: [{ die: 'science', face: 2 }],
			caption: 'You roll the science die',
			spoken: 'Ana rolled Technology on the science die.',
			bust: false,
		},
	];

	/** @type {Roll[]} */
	let rolls = $state([]);
	let batch = $state(0);
	let done = $state(0);
	/** @type {Roll[]} */
	let besideRolls = $state([]);
	let besideBatch = $state(0);
	/** @type {Roll[]} */
	let shelfRolls = $state([]);
	let shelfBatch = $state(0);

	/** @param {Roll[]} next */
	const roll = (next) => {
		rolls = next;
		batch += 1;
	};
</script>

<Section
	name="DiceTray"
	area="board"
	description="A roll over the middle of the screen, on every screen at the table (#61): the dice tumble for about a second, land on their faces under a caption naming who rolls and why, hold, and fade; several rolls in one batch play one after another. A click or Escape ends it; it takes no focus, and a live region reads each result once. With reduced motion the dice land at once.">
	<Example
		label={`batch={${batch}}  (press a button; finished ${done} time${done === 1 ? '' : 's'})`}
		wide
		width={1100}>
		<div class="rg-library-tray-stage">
			<div class="rg-library-tray-controls">
				<Button onButtonClick={() => roll(CONQUEST)}
					>Roll the conquer dice</Button>
				<Button onButtonClick={() => roll(EMPIRICISM)}
					>Roll the science die twice (Empiricism)</Button>
			</div>
			<DiceTray
				{rolls}
				{batch}
				onDiceTrayDone={() => (done += 1)} />
		</div>
	</Example>
	<Example
		label={'panel="panel"  (with a decision panel open, the tray rolls at the top of the board, clear of it; press the button)'}
		wide
		width={1100}>
		<div class="rg-library-tray-controls">
			<Button
				onButtonClick={() => {
					besideRolls = CONQUEST;
					besideBatch += 1;
				}}>Roll beside the panel</Button>
		</div>
		<div class="rg-library-tray-stage rg-library-tray-stage--screen">
			<DecisionPanel
				narrow
				title="Choose a resource"
				status="Pick a resource."
				confirmDisabled>
				<p class="rg-library-tray-lead">
					An Alchemists bust gains 1 resource of your choice.
				</p>
			</DecisionPanel>
			<DiceTray
				rolls={besideRolls}
				batch={besideBatch}
				panel="panel" />
		</div>
	</Example>
	<Example
		label={'panel="shelf"  (cards on the shelf can fill the board\'s height, so the tray rolls over the player area; the game\'s screen at 1920×1080, scaled; press the button; #79)'}
		wide
		width={1100}>
		<div class="rg-library-tray-controls">
			<Button
				onButtonClick={() => {
					shelfRolls = CONQUEST;
					shelfBatch += 1;
				}}>Roll beside the shelf</Button>
		</div>
		<Screen board={shelfBoard}>
			<DiceTray
				rolls={shelfRolls}
				batch={shelfBatch}
				panel="shelf" />
		</Screen>
	</Example>
</Section>

{#snippet shelfBoard()}
	<DecisionPanel
		title="Choose your civilization"
		status="Choose a card above, then confirm it here."
		confirmLabel="Keep civilization"
		confirmDisabled>
		{#snippet shelf(/** @type {number | undefined} */ room)}
			<CardShelf
				kind="civ"
				cards={[
					{ index: 0, id: 'historians', label: 'Historians' },
					{ index: 1, id: 'leaders', label: 'Leaders' },
				]}
				{room} />
		{/snippet}
	</DecisionPanel>
{/snippet}

<style>
	/* The tray is fixed to the screen's centre; the stage stands in for the screen, as a size container that a centred
	   panel finds its centre in and a containing block for the tray. */
	.rg-library-tray-stage {
		position: relative;
		height: 420px;
		container-type: inline-size;
		background: var(--texture) var(--surface);
	}

	/* As tall as the play area at 1920×1080, so the tray's place beside a centred panel matches the game's. */
	.rg-library-tray-stage--screen {
		height: 964px;
	}

	.rg-library-tray-lead {
		margin: 0;
		color: var(--muted);
	}

	.rg-library-tray-controls {
		display: flex;
		gap: var(--space-4);
		padding: var(--space-6);
	}
</style>
