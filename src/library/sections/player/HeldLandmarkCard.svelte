<!-- Library section: HeldLandmarkCard, a player's landmark card on the Civ tab with its goal not met, met this turn, and gained. -->
<script>
	import HeldLandmarkCard from '../../../lib/components/player/HeldLandmarkCard.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { heldLandmarkCard } from '../../../lib/area/landmark-card.js';

	/**
	 * A seat of the view holding a landmark card.
	 * @param {string} card
	 * @param {{ gained?: boolean, territoryTiles?: number[] }} [more]
	 */
	const seatWith = (card, { gained = false, territoryTiles = [] } = {}) => ({
		landmarkCard: { card, gained },
		tech: { bottom: [], middle: [], top: [] },
		capital: { mat: 1, buildings: [], landmarks: [], cubes: [] },
		territoryTiles,
	});

	const OPEN = heldLandmarkCard(
		seatWith('urban-farm', { territoryTiles: [1, 2] }),
		true
	);
	const MET = heldLandmarkCard(
		seatWith('urban-farm', { territoryTiles: [1, 2, 3, 4, 5, 6] }),
		true
	);
	const GAINED = heldLandmarkCard(
		seatWith('skyscraper', { gained: true }),
		false
	);
</script>

<Section
	name="HeldLandmarkCard"
	area="player"
	description="A player's Plans & Ploys landmark card on the Civ tab, under the civilization cards (#32, option A): the heading, a goal line saying how far the goal is, or that it is met and the landmark comes at the end of the turn, or that it is gained, then the card. A gained card fades back under a gold Gained mark. Another player's tab shows theirs, the line speaking of them.">
	{#if OPEN}
		<Example
			label={'held={Urban Farm, 2 of 6 tiles}  (yours)'}
			surface="chrome"
			width={425}>
			<HeldLandmarkCard held={OPEN} />
		</Example>
	{/if}
	{#if MET}
		<Example
			label={'held={Urban Farm, met}  (yours)'}
			surface="chrome"
			width={425}>
			<HeldLandmarkCard held={MET} />
		</Example>
	{/if}
	{#if GAINED}
		<Example
			label={"held={Skyscraper, gained}  (another player's)"}
			surface="chrome"
			width={425}>
			<HeldLandmarkCard held={GAINED} />
		</Example>
	{/if}
</Section>
