<!-- Library section: the working host bot settings beneath a fixed-height player seat. -->
<script>
	import BotSettings from '../../../lib/components/lobby/BotSettings.svelte';
	import SeatCard from '../../../lib/components/lobby/SeatCard.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	/** @type {'automa' | 'shadow'} */
	let kind = $state('automa');
	let level = $state(2);
	let removed = $state(false);
	/** @param {import('../../../lib/component-event.js').ComponentEvent} event */
	const changeHandler = (event) => {
		kind = event.value.kind;
		level = event.value.level ?? level;
	};
</script>

<Section
	name="BotSettings"
	area="lobby"
	description="Host-only type, difficulty and removal controls beneath a bot's existing player seat. Shadow Empire uses the dark green button and has no level.">
	<Example
		label={`kind="${kind}" level={${level}} onBotSettingsChange onBotSettingsRemove`}
		surface="chrome"
		width={260}>
		{#if removed}
			<Button
				mode="primary"
				size="small"
				onButtonClick={() => (removed = false)}>Add bot</Button>
		{:else}
			<SeatCard
				state="player"
				seat={2}
				name="Egypt"
				botKind={kind}
				showCivilization={false} />
			<BotSettings
				{kind}
				{level}
				onBotSettingsChange={changeHandler}
				onBotSettingsRemove={() => (removed = true)} />
		{/if}
	</Example>
	<Example
		label={'kind="shadow" unavailable={["automa"]}'}
		surface="chrome"
		width={260}>
		<BotSettings
			kind="shadow"
			unavailable={['automa']} />
	</Example>
</Section>
