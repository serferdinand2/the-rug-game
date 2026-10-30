<!-- Library section: CardPreview (#96), a card shown in full over the shared area from its kind and id, over a scrim or beside a shelf. -->
<script>
	import CardPreview from '../../../lib/components/player/CardPreview.svelte';
	import { tapestryCardData } from '../../../lib/cards/game-cards.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="CardPreview"
	area="player"
	description="A tech or tapestry card shown in full over the shared area while a card in the player area or on a prompt's shelf is hovered or focused. Callers name the card by its kind and id; it draws the card, the scrim and the side variant, and takes no pointer.">
	<Example
		label={'kind="tech" id="clocks"'}
		wide
		width={1100}>
		<div class="rg-library-card-preview-stage">
			<CardPreview
				kind="tech"
				id="clocks" />
		</div>
	</Example>
	<Example
		label={'kind="tapestry" id="academia"'}
		wide
		width={1100}>
		<div class="rg-library-card-preview-stage">
			<CardPreview
				kind="tapestry"
				id="academia" />
		</div>
	</Example>
	<Example
		label={"kind=\"tapestry\" data={tapestryCardData('guilds')} side  (a shelf's own face, beside the shelf: at the left, no scrim)"}
		wide
		width={1100}>
		<div class="rg-library-card-preview-stage">
			<CardPreview
				kind="tapestry"
				data={tapestryCardData('guilds')}
				side />
		</div>
	</Example>
</Section>

<style>
	.rg-library-card-preview-stage {
		position: relative;
		height: 560px;
		contain: layout;
		background: var(--texture) var(--surface);
	}
</style>
