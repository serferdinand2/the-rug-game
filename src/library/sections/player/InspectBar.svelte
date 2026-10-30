<!-- Library section: InspectBar, the line over another player's tabs in the player area (#145), for each seat and without the way back. -->
<script>
	import InspectBar from '../../../lib/components/player/InspectBar.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {{ name: string, seat: import('../../../lib/ui.js').Seat }[]} */
	const PLAYERS = [
		{ name: "Vera's", seat: 2 },
		{ name: "Marko's", seat: 3 },
		{ name: "Ana's", seat: 4 },
		{ name: "Marcus'", seat: 5 },
	];

	let pressed = $state(0);
</script>

<Section
	name="InspectBar"
	area="player"
	description="Clicking another player's chip in the header shows their tabs in the player area, read-only, with a border in their colour (owner, 2026-10-30). This line sits over them: their colour square, whose area it is, and Back to your area. Their chip again, your own chip or Escape also go back.">
	<Example
		label={`seat={1} onInspectBarBack  (pressed ${pressed} times)`}
		width={430}>
		<InspectBar
			text="Viewing Cedarwyn's area"
			seat={1}
			onInspectBarBack={() => pressed++} />
	</Example>
	{#each PLAYERS as player (player.seat)}
		<Example
			label={`seat={${player.seat}}`}
			width={430}>
			<InspectBar
				text="Viewing {player.name} area"
				seat={player.seat} />
		</Example>
	{/each}
	<Example
		label={'seat={2} back={false}  (the public view has no own area)'}
		width={430}>
		<InspectBar
			text="Viewing Vera's area"
			seat={2}
			back={false} />
	</Example>
</Section>
