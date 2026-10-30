<!-- Library section: CardTokenReserve, a card's starting tokens (#106). -->
<script>
	import CardTokenReserve from '../../../lib/components/player/CardTokenReserve.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardTokenReserve"
	area="player"
	description="A card's starting tokens on 62 px squares; those sent away leave their squares empty, from the left. See docs/ui/card-design-rules.md."
	><Example
		label="count={4}"
		width={425}
		><div class="rg-card-frame"><CardTokenReserve /></div></Example
	><Example
		label={'used={2} color="purple"'}
		width={425}
		><div class="rg-card-frame">
			<CardTokenReserve
				used={2}
				color="purple" />
		</div></Example
	></Section>
