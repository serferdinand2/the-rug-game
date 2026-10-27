<!-- Library section: PassScreen naming a player for a turn, for setup, for a question outside their turn, with a clock, and while their view opens. -->
<script>
	import PassScreen from '../../../lib/components/ui/PassScreen.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let taken = $state(0);
</script>

<Section
	name="PassScreen"
	area="ui"
	description="The hot-seat pass screen (#30): it names the next player, hides every hand until that player takes the screen, and waits 0.6 seconds before its button answers, so a click meant for the last player can't open the next one's view. A conquest's response question reads like any other question.">
	<Example
		label={'reason="It\'s Vera\'s turn."'}
		surface="surface"
		width={560}>
		<PassScreen
			name="Vera"
			seat={2}
			reason="It's Vera's turn."
			announce={false}
			onPassScreenTake={() => (taken += 1)} />
	</Example>
	<Example
		label={'reason="Marko\'s setup choices."'}
		surface="surface"
		width={560}>
		<PassScreen
			name="Marko"
			seat={1}
			reason="Marko's setup choices."
			announce={false} />
	</Example>
	<Example
		label={'reason="Ana has a choice to make." clockMs={74000}'}
		surface="surface"
		width={560}>
		<PassScreen
			name="Ana"
			seat={3}
			reason="Ana has a choice to make."
			clockMs={74_000}
			announce={false} />
	</Example>
	<Example
		label={'taking'}
		surface="surface"
		width={560}>
		<PassScreen
			name="Bo"
			seat={4}
			reason="It's Bo's turn."
			taking
			announce={false} />
	</Example>
	{#if taken > 0}
		<p>Taken {taken} {taken === 1 ? 'time' : 'times'}.</p>
	{/if}
</Section>
