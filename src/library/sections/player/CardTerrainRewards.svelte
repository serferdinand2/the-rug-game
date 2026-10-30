<!-- Library section: CardTerrainRewards, a card's terrain reward rows (#106). -->
<script>
	import CardTerrainRewards from '../../../lib/components/player/CardTerrainRewards.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';

	const ROWS = /** @type {const} */ ([
		{
			terrain: 'desert',
			name: 'Desert',
			gain: 'coin',
			effect: 'roll the black conquer die twice and take one result.',
		},
		{
			terrain: 'mountain',
			name: 'Mountain',
			gain: 'worker',
			effect: 'roll both conquer dice and gain both results.',
		},
	]);
</script>

<Section
	name="CardTerrainRewards"
	area="player"
	description="Rows of a terrain hex marker, the terrain's name and its reward, the resource kept with its +; a used terrain fades and its name is struck through. See docs/ui/card-design-rules.md."
	><Example
		label="rows"
		width={425}
		><div class="rg-card-frame">
			<CardTerrainRewards rows={ROWS} />
		</div></Example
	><Example
		label="rows, the first used"
		width={425}
		><div class="rg-card-frame">
			<CardTerrainRewards
				rows={ROWS.map((row, index) => ({
					...row,
					used: index === 0,
				}))} />
		</div></Example
	></Section>
