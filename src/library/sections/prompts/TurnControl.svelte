<!-- Library section: TurnControl, the turn buttons and VP tag under the tile picker, with and without a chosen hex. -->
<script>
	import TurnControl from '../../../lib/components/prompts/TurnControl.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	let turns = $state(0);
</script>

<Section
	name="TurnControl"
	area="prompts"
	description="Turns the picked tile back (↺) or forward (↻) on the chosen hex, with a gold VP tag between the arrows and the hint that R turns it. Both buttons are disabled, and the tag reads 'No hex yet', until a hex is chosen.">
	<Example
		label="vp={null}  (disabled)"
		surface="chrome">
		<TurnControl vp={null} />
	</Example>
	<Example
		label="vp={3}"
		surface="chrome">
		<TurnControl vp={3} />
	</Example>
	<Example
		label="vp={0}"
		surface="chrome">
		<TurnControl vp={0} />
	</Example>
	<Example
		label={`turns = ${turns}  (press the arrows)`}
		surface="chrome">
		<TurnControl
			vp={turns}
			onTurnControlTurn={(/** @type {ComponentEvent} */ event) =>
				(turns += event.value.step)} />
	</Example>
</Section>
