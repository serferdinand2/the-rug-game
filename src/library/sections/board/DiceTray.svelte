<!-- Library section: DiceTray, the roll in the middle of the screen for the whole table (#61): a conquest's dice, and two science rolls in one batch. -->
<script>
	import DiceTray from '../../../lib/components/board/DiceTray.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
	import Example from '../../Example.svelte';
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
</Section>

<style>
	/* The tray is fixed to the screen's centre; contained, the stage stands in for the screen. */
	.rg-library-tray-stage {
		position: relative;
		height: 420px;
		contain: layout;
		background: var(--texture) var(--surface);
	}

	.rg-library-tray-controls {
		display: flex;
		gap: var(--space-4);
		padding: var(--space-6);
	}
</style>
