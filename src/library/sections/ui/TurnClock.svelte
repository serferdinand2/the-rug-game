<!-- Library section: TurnClock running, paused, in its last seconds and ticking down. -->
<script>
	import { onMount } from 'svelte';
	import TurnClock from '../../../lib/components/ui/TurnClock.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let live = $state(12_000);

	onMount(() => {
		const id = setInterval(() => {
			live = live > 100 ? live - 100 : 12_000;
		}, 100);
		return () => clearInterval(id);
	});
</script>

<Section
	name="TurnClock"
	area="ui"
	description="The turn clock in the game header: the player's colour mark and the time left. Paused clocks are muted; the viewer's own clock turns red and reads the seconds in words for the last 5 seconds.">
	<Example
		label={'ms={102000}'}
		surface="chrome">
		<TurnClock
			seat={1}
			ms={102_000} />
	</Example>
	<Example
		label={'running={false}'}
		surface="chrome">
		<TurnClock
			seat={2}
			ms={42_000}
			running={false} />
	</Example>
	<Example
		label={'warn'}
		surface="chrome">
		<TurnClock
			seat={1}
			ms={4_200}
			warn />
	</Example>
	<Example
		label={'ticking (loops from 0:12)'}
		surface="chrome">
		<TurnClock
			seat={3}
			ms={live}
			warn={live <= 5_000} />
	</Example>
</Section>
