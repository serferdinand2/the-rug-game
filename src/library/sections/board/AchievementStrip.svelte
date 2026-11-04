<!-- Library section: AchievementStrip with no claims, partial claims and every place taken, and claims stamped in one by one (#175). -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
	import AchievementStrip from '../../../lib/components/board/AchievementStrip.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {import('../../../lib/components/board/AchievementStrip.svelte').AchievementStripEntry[]} */
	const none = [
		{ id: 'complete-track', name: 'Complete a track', vp: 15, claimed: [] },
		{ id: 'topple-two', name: 'Topple two outposts', vp: 15, claimed: [] },
		{
			id: 'middle-island',
			name: 'Conquer the middle',
			vp: 10,
			claimed: [],
		},
	];
	/** @type {import('../../../lib/components/board/AchievementStrip.svelte').AchievementStripEntry[]} */
	const partial = [
		{
			id: 'complete-track',
			name: 'Complete a track',
			vp: 5,
			claimed: [3, 1],
		},
		{ id: 'topple-two', name: 'Topple two outposts', vp: 10, claimed: [2] },
		{
			id: 'middle-island',
			name: 'Conquer the middle',
			vp: 10,
			claimed: [],
		},
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

	/** The claiming example's claims, in order (#175). */
	let claims = $state(
		/** @type {import('../../../lib/ui.js').Seat[]} */ ([])
	);
	let claiming = $derived([
		{
			...none[0],
			claimed: claims,
			vp: claims.length >= 3 ? null : 15 - 5 * claims.length,
		},
		none[1],
		none[2],
	]);
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
	<Example
		label={`achievements={Complete a track claimed by ${claims.length}}  (claim it: the player's square stamps in; #175)`}
		surface="chrome"
		wide>
		<span class="rg-library-achievement-strip--claiming">
			<AchievementStrip achievements={claiming} />
			<Button
				size="small"
				onButtonClick={() =>
					(claims =
						claims.length >= 3
							? []
							: [
									...claims,
									/** @type {import('../../../lib/ui.js').Seat} */ (
										claims.length + 1
									),
								])}
				>{claims.length >= 3 ? 'Clear the claims' : 'Claim it'}</Button>
		</span>
	</Example>
</Section>

<style>
	.rg-library-achievement-strip--claiming {
		display: flex;
		align-items: center;
		gap: var(--space-9);
	}
</style>
