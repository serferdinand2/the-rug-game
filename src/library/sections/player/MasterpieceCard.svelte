<!-- Library example for the owner-approved MasterpieceCard frame. -->
<script>
	import MasterpieceCard from '../../../lib/components/player/MasterpieceCard.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="MasterpieceCard"
	area="player"
	description="319 px masterpiece frame, with a centered beige effect box, full artwork, and an Arts & Architecture edition footer.">
	<Example
		label="Painting · gain 4 VP and any 1 resource"
		width={319}>
		<MasterpieceCard
			title="Painting"
			artwork="/art/masterpiece/painting.svg"
			artworkAlt="Painting artwork">
			{#snippet effects()}
				<p>Gain <strong>4 VP</strong>.</p>
				<p>
					<span class="rg-masterpiece-card--resource"
						>+<img
							src="/art/resource-24/any.svg"
							alt="any resource"
							width="24"
							height="24" /></span>
				</p>
			{/snippet}
		</MasterpieceCard>
	</Example>
</Section>
