<!-- Library section: IconButton for sound (on and muted), history, menu (closed and open) and close. -->
<script>
	import IconButton from '../../../lib/components/ui/IconButton.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let muted = $state(false);
	let expanded = $state(false);
</script>

<Section
	name="IconButton"
	area="ui"
	description="The square 36px header controls: sound, history, menu and close. Muting draws a red slash over a still-light note.">
	<Example
		label={`icon="sound" label="Mute" muted={${muted}}  (click it)`}
		surface="chrome">
		<IconButton
			icon="sound"
			label="Mute"
			{muted}
			onIconButtonClick={() => (muted = !muted)} />
	</Example>
	<Example
		label={'icon="sound" label="Mute" muted'}
		surface="chrome">
		<IconButton
			icon="sound"
			label="Mute"
			muted />
	</Example>
	<Example
		label={'icon="history" label="History"'}
		surface="chrome">
		<IconButton
			icon="history"
			label="History" />
	</Example>
	<Example
		label={`icon="menu" label="Menu" expanded={${expanded}}  (click it)`}
		surface="chrome">
		<IconButton
			icon="menu"
			label="Menu"
			{expanded}
			onIconButtonClick={() => (expanded = !expanded)} />
	</Example>
	<Example
		label={'icon="close" label="Close"'}
		surface="chrome">
		<IconButton
			icon="close"
			label="Close" />
	</Example>
</Section>
