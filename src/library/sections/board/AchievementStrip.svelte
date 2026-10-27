<!-- Library section: AchievementStrip with no claims, partial claims and every place taken. -->
<script>
	import AchievementStrip from '../../../lib/components/board/AchievementStrip.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {import('../../../lib/components/board/AchievementStrip.svelte').AchievementStripEntry[]} */
	const none = [
		{ id: 'complete-track', name: 'Complete a track', vp: 15, claimed: [] },
		{ id: 'topple-two', name: 'Topple two outposts', vp: 15, claimed: [] },
		{ id: 'middle-island', name: 'Conquer the middle', vp: 10, claimed: [] },
	];
	/** @type {import('../../../lib/components/board/AchievementStrip.svelte').AchievementStripEntry[]} */
	const partial = [
		{ id: 'complete-track', name: 'Complete a track', vp: 5, claimed: [3, 1] },
		{ id: 'topple-two', name: 'Topple two outposts', vp: 10, claimed: [2] },
		{ id: 'middle-island', name: 'Conquer the middle', vp: 10, claimed: [] },
	];
	/** @type {import('../../../lib/components/board/AchievementStrip.svelte').AchievementStripEntry[]} */
	const full = [
		{
			id: 'complete-track',
			name: 'Complete a track',
			vp: null,
			claimed: [1, 2, 3],
		},
		{
			id: 'topple-two',
			name: 'Topple two outposts',
			vp: null,
			claimed: [4, 5, 2],
		},
		{
			id: 'middle-island',
			name: 'Conquer the middle',
			vp: null,
			claimed: [5, 1],
		},
	];
</script>

<Section
	name="AchievementStrip"
	area="board"
	description="The three achievements on one line at the right of the shared area's head: the colour squares of the players who claimed each, in order, and the VP the next claimant gets.">
	<Example label="achievements=[no claims]">
		<AchievementStrip achievements={none} />
	</Example>
	<Example label="achievements=[partial claims]">
		<AchievementStrip achievements={partial} />
	</Example>
	<Example label="achievements=[every place taken]">
		<AchievementStrip achievements={full} />
	</Example>
</Section>
