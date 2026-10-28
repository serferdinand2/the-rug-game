<!-- Library section: TurnControl, the turn buttons and VP tag under the tile picker, with and without a chosen hex. -->
<script>
	import TurnControl from '../../../lib/components/prompts/TurnControl.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/** What the example tile scores in each of its 6 turns. */
	const VP = [2, 0, 1, 3, 1, 0];

	/** The example tile's turn, 0-5, wrapping as the game's does. */
	let turn = $state(0);
</script>

<Section
	name="TurnControl"
	area="prompts"
	description="Turns the picked tile back (↺) or forward (↻) on the chosen hex, with a gold VP tag between the arrows and the hint that R turns it. Both buttons are disabled, and the tag reads 'No hex yet', until a hex is chosen.">
	<Example
		label={'vp={null}  (disabled)'}
		surface="chrome">
		<TurnControl vp={null} />
	</Example>
	<Example
		label={'vp={3}'}
		surface="chrome">
		<TurnControl vp={3} />
	</Example>
	<Example
		label={'vp={0}'}
		surface="chrome">
		<TurnControl vp={0} />
	</Example>
	<Example
		label={`turn = ${turn}, vp={${VP[turn]}}  (press the arrows: 6 turns, each with its own VP)`}
		surface="chrome">
		<TurnControl
			vp={VP[turn]}
			onTurnControlTurn={(/** @type {ComponentEvent} */ event) =>
				(turn = (turn + event.value.step + 6) % 6)} />
	</Example>
</Section>
