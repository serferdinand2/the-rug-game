<!-- Library section: SelfSummary, the compact Your overview at the foot of the player area. -->
<script>
	import SelfSummary from '../../../lib/components/player/SelfSummary.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="SelfSummary"
	area="player"
	description="The compact summary at the foot of the player area: the shown player's name, era, VP, counts and four resources. It follows the inspected player (#157), while your own pending resource choices stay yours.">
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
		label="inspected={true}  (another player's area)"
		width={430}>
		<SelfSummary
			seat={2}
			name="Wrenwick"
			era={2}
			vp={18}
			resources={{ coin: 3, worker: 2, food: 5, culture: 1 }}
			hand={2}
			tech={1}
			territories={3}
			lines={0}
			inspected />
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
	<Example
		label={"changed={['food']}  (while a prompt is open: the counts after the choices so far)"}
		width={430}>
		<SelfSummary
			seat={1}
			name="Cedarwyn"
			era={2}
			vp={21}
			resources={{ coin: 2, worker: 0, food: 8, culture: 1 }}
			changed={['food']}
			hand={2}
			tech={1}
			territories={3}
			lines={0} />
	</Example>
</Section>
