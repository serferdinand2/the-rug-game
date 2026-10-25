<!-- Library section: PlayerToken, extracted from the reviewed cards. -->
<script>
	import PlayerToken from '../../../lib/components/player/PlayerToken.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="PlayerToken"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<PlayerToken color="blue" /><PlayerToken color="red" /><PlayerToken
				color="green" /><PlayerToken color="yellow" /><PlayerToken
				color="purple" />
		</div></Example
	></Section>
