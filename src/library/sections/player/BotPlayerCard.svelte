<!-- Bots have public facts but no human mat or resource summary. -->
<script>
	import BotPlayerCard from '../../../lib/components/player/BotPlayerCard.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="BotPlayerCard"
	area="player"
	description="A bot's public score, track progress, landmark box and territories, without fabricated human resources or mats.">
	<Example
		label="Egypt · Automa Scientists · income turn 3"
		width={425}>
		<BotPlayerCard
			seat={2}
			name="Egypt"
			vp={37}
			botKind="automa"
			civilization="Scientists"
			tracks={{ exploration: 3, science: 7, technology: 4, military: 2 }}
			landmarks={2}
			territories={4}
			incomeTurns={3}
			favouriteTrack="science"
			finished={false} />
	</Example>
	<Example
		label="Mesopotamia · Shadow Empire does not score"
		width={425}>
		<BotPlayerCard
			seat={3}
			name="Mesopotamia"
			vp={0}
			botKind="shadow"
			civilization="Shadow Empire"
			tracks={{ exploration: 4, science: 5, technology: 6, military: 8 }}
			landmarks={0}
			territories={0}
			incomeTurns={0}
			favouriteTrack="military"
			finished={false} />
	</Example>
</Section>
