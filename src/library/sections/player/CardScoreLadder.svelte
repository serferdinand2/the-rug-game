<!-- Library section: CardScoreLadder, the stepped and the flat end-of-game score (#106). -->
<script>
	import CardScoreLadder from '../../../lib/components/player/CardScoreLadder.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';

	const STEPPED = [1, 3, 6, 10, 15, 21].map((points, index) => ({
		count: index + 1,
		points,
	}));
	const FLAT = [
		{ count: 1, points: 5 },
		{ count: 2, points: 10 },
		{ count: 3, points: 16 },
		{ count: 4, points: 23 },
		{ count: 5, points: 31 },
		{ count: '6+', points: 40 },
	];
</script>

<Section
	name="CardScoreLadder"
	area="player"
	description="A card's score by count, in Atkinson with X VP on one line: rising gold steps with the counts beneath (the Collectors), or equal boxes with the count above the VP and a worked example (the Isolationists). See docs/ui/card-design-rules.md."
	><Example
		label="steps"
		width={425}
		><div class="rg-card-frame">
			<CardScoreLadder steps={STEPPED} />
		</div></Example
	><Example
		label={'steps current={3}'}
		width={425}
		><div class="rg-card-frame">
			<CardScoreLadder
				steps={STEPPED}
				current={3} />
		</div></Example
	><Example
		label={'kind="flat" label steps example'}
		width={425}
		><div class="rg-card-frame">
			<CardScoreLadder
				kind="flat"
				label="Final income turn · territories in your largest connected landmass of one terrain"
				steps={FLAT}
				example={{
					pictures: Array(3).fill('/art/terrain/grassland.svg'),
					text: '3 connected grassland territories',
					result: '= 16 VP',
				}} />
		</div></Example
	></Section>
