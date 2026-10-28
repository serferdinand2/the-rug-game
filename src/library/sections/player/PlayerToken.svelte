<!-- Library section: PlayerToken by seat, at the sizes the game draws it, and by colour, as the reviewed cards use it. -->
<script>
	import PlayerToken from '../../../lib/components/player/PlayerToken.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';

	/** @type {import('../../../lib/ui.js').Seat[]} */
	const SEATS = [1, 2, 3, 4, 5];
</script>

<Section
	name="PlayerToken"
	area="player"
	description="A player's token. The game gives it a seat (#103), which sets the colour; the reviewed cards name a colour instead. See docs/ui/card-design-rules.md for the card composition rules."
	><Example label={'seat={1} … seat={5}'}
		>{#each SEATS as seat (seat)}<PlayerToken {seat} />{/each}</Example
	><Example label={'seat={2} size={24} · size={36} · size={48} decorative'}
		><PlayerToken
			seat={2}
			size={24}
			decorative /><PlayerToken
			seat={2}
			size={36}
			decorative /><PlayerToken
			seat={2}
			size={48}
			decorative /></Example
	><Example label="Reviewed card pattern: color=…"
		><div
			class="rg-card-frame"
			data-state="play">
			<PlayerToken color="blue" /><PlayerToken color="red" /><PlayerToken
				color="green" /><PlayerToken color="yellow" /><PlayerToken
				color="purple" />
		</div></Example
	></Section>
