<!-- Library section: CardResource, extracted from the reviewed cards. -->
<script>
	import CardResource from '../../../lib/components/player/CardResource.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardResource"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	><Example label="Reviewed card pattern"
		><div
			class="rg-card-frame"
			data-state="play">
			<CardResource symbol="any" />
			<CardResource symbol="coin" />
			<CardResource symbol="worker" />
			<CardResource symbol="food" />
			<CardResource symbol="culture" />
		</div></Example
	></Section>
