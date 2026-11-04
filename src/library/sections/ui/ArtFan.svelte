<!-- Library section: ArtFan with three civilizations, and with a landmark and two tapestry cards. -->
<script>
	import ArtFan from '../../../lib/components/ui/ArtFan.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="ArtFan"
	area="ui"
	description="Three pictures laid as cards in a fan, as on a table (#174). The landing page and the lobby show two beside their panels, picked at random on each visit by artFans(): three civilizations on the left, a landmark and two tapestry cards on the right.">
	<Example
		label={'cards={[Alchemists, Mystics, Traders]}'}
		width={360}>
		<ArtFan
			cards={[
				{ name: 'Alchemists', art: 'civ/alchemists', titleSize: 'large' },
				{ name: 'Mystics', art: 'civ/mystics', titleSize: 'large' },
				{ name: 'Traders', art: 'civ/traders', titleSize: 'large' },
			]} />
	</Example>
	<Example
		label={'cards={[Lighthouse, Renaissance, Alliance]}'}
		width={360}>
		<ArtFan
			cards={[
				{ name: 'Lighthouse', art: 'landmark/lighthouse', titleSize: 'small' },
				{ name: 'Renaissance', art: 'tapestry/renaissance', titleSize: 'small' },
				{ name: 'Alliance', art: 'tapestry/alliance', titleSize: 'small' },
			]} />
	</Example>
</Section>
