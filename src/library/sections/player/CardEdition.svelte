<!-- Library section: CardEdition, the edition chip at the foot of every card family (#109), in each edition's card colour. -->
<script>
	import CardEdition from '../../../lib/components/player/CardEdition.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const CODES = ['base', 'pp', 'aa', 'ff'];
</script>

<Section
	name="CardEdition"
	area="player"
	description="The edition chip at a card's foot, the same for every card family: base brown, Plans & Ploys green, Arts & Architecture purple and Fantasies & Futures teal (owner, #109), each on the card paper.">
	{#each CODES as code (code)}
		<Example
			label={`code="${code}"`}
			width={200}>
			<div
				style="padding: 10px 12px; background: var(--card-paper) url('/src/styles/card-paper-noise.svg') repeat">
				<CardEdition {code} />
			</div>
		</Example>
	{/each}
</Section>
