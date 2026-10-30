<!-- Library section: CardPredictionTracks, numbered prediction targets by category (#106). -->
<script>
	import CardPredictionTracks from '../../../lib/components/player/CardPredictionTracks.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	const CATEGORIES = [
		{ id: 'techCards', label: 'Tech cards', note: 'you have', most: 9 },
		{ id: 'tracks', label: 'Completed advancement tracks', most: 4 },
	];
	let picked = $state('tracks:3');

	/** @param {ComponentEvent} event */
	const pickHandler = (event) => {
		picked = event.value;
	};
</script>

<Section
	name="CardPredictionTracks"
	area="player"
	description="Categories of 39 px numbered targets: nine spread across the card, fewer keep their squares from the left. The predicted number takes the player's colour; the numbers a decision offers are buttons with the green outline, the picked one gold. See docs/ui/card-design-rules.md."
	><Example
		label="categories"
		width={425}
		><div class="rg-card-frame">
			<CardPredictionTracks categories={CATEGORIES} />
		</div></Example
	><Example
		label="categories, techCards selected={4}"
		width={425}
		><div class="rg-card-frame">
			<CardPredictionTracks
				categories={CATEGORIES.map((category) => ({
					...category,
					selected: category.id === 'techCards' ? 4 : undefined,
				}))} />
		</div></Example
	><Example
		label={`choices={['tracks:1' … 'tracks:4']} picked="${picked}"`}
		width={425}
		><div class="rg-card-frame">
			<CardPredictionTracks
				categories={CATEGORIES}
				choices={['tracks:1', 'tracks:2', 'tracks:3', 'tracks:4']}
				{picked}
				onCardPredictionTracksPick={pickHandler} />
		</div></Example
	></Section>
