<!-- Library section: Badge as expansion tags and as small capitals. -->
<script>
	import Badge from '../../../lib/components/ui/Badge.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="Badge"
	area="ui"
	description="Small labels: an expansion tag tinted with the expansion's colour, or the YOU, HOST and READY capitals on seats and player cards.">
	<Example
		label={'color="var(--arts-architecture)"'}
		surface="chrome">
		<Badge
			label="Arts & Architecture"
			color="var(--arts-architecture)" />
	</Example>
	<Example
		label={'color="var(--plans-ploys)"'}
		surface="chrome">
		<Badge
			label="Plans & Ploys"
			color="var(--plans-ploys)" />
	</Example>
	<Example
		label={'color="var(--fantasies-futures)"'}
		surface="chrome">
		<Badge
			label="Fantasies & Futures"
			color="var(--fantasies-futures)" />
	</Example>
	<Example
		label={'variant="caps"'}
		surface="chrome">
		<Badge
			label="You"
			variant="caps" />
		<Badge
			label="Host"
			variant="caps" />
	</Example>
	<Example
		label={'variant="caps" color="var(--ok)"'}
		surface="chrome">
		<Badge
			label="Ready"
			variant="caps"
			color="var(--ok)" />
	</Example>
</Section>
