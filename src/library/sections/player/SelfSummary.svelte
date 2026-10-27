<!-- Library section: SelfSummary, the compact Your overview at the foot of the player area. -->
<script>
	import SelfSummary from '../../../lib/components/player/SelfSummary.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="SelfSummary"
	area="player"
	description="Your overview: the viewer's name, era and VP, their hand, tech, territory and capital-line counts, and the four resources with their native 24px icons. It sits at the foot of the player area and updates with every answer.">
	<Example
		label={'seat={1} era={3}  (mid-game)'}
		width={430}>
		<SelfSummary
			seat={1}
			name="Cedarwyn"
			era={3}
			vp={37}
			resources={{ coin: 2, worker: 4, food: 3, culture: 1 }}
			hand={4}
			tech={3}
			territories={4}
			lines={2} />
	</Example>
	<Example
		label={'seat={5} era={1}  (the first turn)'}
		width={430}>
		<SelfSummary
			seat={5}
			name="Wrenwick"
			era={1}
			vp={0}
			resources={{ coin: 0, worker: 0, food: 0, culture: 0 }}
			hand={0}
			tech={0}
			territories={1}
			lines={0} />
	</Example>
</Section>
