<!-- Library section: IncomeMat, a seat's four building rows with covered and exposed spaces, and A&A's inspired rows (#35). -->
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
	/** Arts & Architecture: the Markets row inspired, its spaces 2, 4 and 6 improved (#35). */
	const INSPIRED = incomeRows({
		incomeMat: { buildings: { market: 3, house: 5, farm: 5, armory: 5 } },
		inspired: ['market'],
	});
</script>

<Section
	name="IncomeMat"
	area="player"
	description="The income mat: four rows of six 110px tiles. With Arts & Architecture, an inspired row's spaces 2, 4 and 6 read the tile's improved rewards in a gold frame with its +, and `preview` frames a row's with a dashed line while the player chooses where to inspire (#35). Every tile uses the same layout: a brown fancy-font name at the top, then an optional Income label above the 60px dark reward box with a 2px gold border. Covered tiles add the row's building over the same printed tile; hovering or focusing slides the building left. The VP cup is 19px, and multiplication signs have no added spacing within this mat.">
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
		label={'rows={Markets inspired}  era={3}  preview="farm"  (A&A, #35)'}
		width={430}>
		<IncomeMat
			rows={INSPIRED}
			era={3}
			preview="farm" />
	</Example>
	<Example
		label={'rows={late game}  era={4}'}
		width={430}>
		<IncomeMat
			rows={LATE}
			era={4} />
	</Example>
</Section>
