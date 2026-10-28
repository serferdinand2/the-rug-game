<!-- Library section: Die, a style C die body with its rolled face (#61): every face of the science, red and black dice, and a tumble. -->
<script>
	import Die from '../../../lib/components/board/Die.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** One of each distinct face: the science die's four tracks, and each conquer face. */
	const SCIENCE = [0, 1, 2, 3];
	const CONQUER = [0, 1, 2, 3, 4];
</script>

<Section
	name="Die"
	area="board"
	description="One die as the dice tray rolls it (#61): its style C body (a cream d12 for science, a red and a black d6 for conquests) with the rolled face drawn on top: the track's symbol, the VP in words, the resource's icon, or ? for the territory tile's benefit. Rolling, it tumbles; with reduced motion it doesn't.">
	<Example
		label={'die="science" face={0…3}  (exploration, science, technology, military; each is on 3 of the 12 faces)'}
		surface="chrome">
		<div class="rg-library-dice">
			{#each SCIENCE as face (face)}
				<Die
					die="science"
					{face} />
			{/each}
		</div>
	</Example>
	<Example
		label={'die="red" face={0…4}  (4, 5, 6, 7 VP and 1 VP per territory, on 2 faces)'}
		surface="chrome">
		<div class="rg-library-dice">
			{#each CONQUER as face (face)}
				<Die
					die="red"
					{face} />
			{/each}
		</div>
	</Example>
	<Example
		label={'die="black" face={0…4}  (coin, worker, food, culture, and ? for the tile\'s benefit, on 2 faces)'}
		surface="chrome">
		<div class="rg-library-dice">
			{#each CONQUER as face (face)}
				<Die
					die="black"
					{face} />
			{/each}
		</div>
	</Example>
	<Example
		label="rolling  (the tumble, on a loop here)"
		surface="chrome">
		<div class="rg-library-dice">
			<Die
				die="red"
				face={1}
				rolling />
			<Die
				die="black"
				face={2}
				rolling />
		</div>
	</Example>
</Section>

<style>
	.rg-library-dice {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-6);
	}
</style>
