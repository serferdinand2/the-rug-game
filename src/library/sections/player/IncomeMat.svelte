<!-- Library section: IncomeMat, a seat's four building rows with covered and exposed spaces. -->
<script>
	import IncomeMat from '../../../lib/components/player/IncomeMat.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { incomeRows } from '../../../lib/area/income.js';

	/** @param {Record<string, number>} buildings */
	const rowsFor = (buildings) => incomeRows({ incomeMat: { buildings } });

	const FRESH = rowsFor({ market: 5, house: 5, farm: 5, armory: 5 });
	const MID = rowsFor({ market: 3, house: 3, farm: 3, armory: 4 });
	const LATE = rowsFor({ market: 0, house: 1, farm: 2, armory: 0 });
</script>

<Section
	name="IncomeMat"
	area="player"
	description="The income mat: four building rows of six spaces. A space under a building shows the building; an exposed one shows its name in Cinzel and its income and scoring in words. Each building taken from the mat exposes the next space.">
	<Example
		label={'rows={fresh mat}  era={1}'}
		width={430}>
		<IncomeMat
			rows={FRESH}
			era={1} />
	</Example>
	<Example
		label={'rows={mid-game}  era={3}'}
		width={430}>
		<IncomeMat
			rows={MID}
			era={3} />
	</Example>
	<Example
		label={'rows={late game}  era={4}'}
		width={430}>
		<IncomeMat
			rows={LATE}
			era={4} />
	</Example>
</Section>
