<!-- Library section: CardClarity, a card's supporting rules with an optional setup line (#106). -->
<script>
	import CardClarity from '../../../lib/components/player/CardClarity.svelte';
	import CardResource from '../../../lib/components/player/CardResource.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardClarity"
	area="player"
	description="Supporting rules beneath the area they clarify, in 11 px Atkinson; a setup line follows after a break, fainter. See docs/ui/card-design-rules.md."
	><Example
		label="children"
		width={425}
		><div class="rg-card-frame">
			<CardClarity>
				Setup: put 4 player tokens here and gain 2 territory tiles. Each
				terrain can be used once.
			</CardClarity>
		</div></Example
	><Example
		label="children and setup"
		width={425}
		><div class="rg-card-frame">
			<CardClarity>
				If gained mid-game, place the token on any reward space and gain
				it immediately.{#snippet setup()}Setup, current rules: gain
					<CardResource symbol="any" /> and 10 VP.{/snippet}</CardClarity>
		</div></Example
	><Example
		label="above={16} minHeight={70}"
		width={425}
		><div class="rg-card-frame">
			<CardClarity
				above={16}
				minHeight={70}>
				Each track space can be used once. This advance gains the
				benefit, but cannot gain its bonus.
			</CardClarity>
		</div></Example
	></Section>
