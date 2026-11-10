<!-- Library section: all six official Automa difficulty steps and a disabled control. -->
<script>
	import AutomaLevel from '../../../lib/components/lobby/AutomaLevel.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	let value = $state(2);
	/** @param {import('../../../lib/component-event.js').ComponentEvent} event */
	const changeHandler = (event) => {
		value = event.value;
	};
</script>

<Section
	name="AutomaLevel"
	area="lobby"
	description="The six official Automa levels as selectable squares, filling from left to right and announcing the selected difficulty name.">
	<Example
		label={`value={${value}} onAutomaLevelChange`}
		surface="chrome"
		width={260}>
		<AutomaLevel
			{value}
			onAutomaLevelChange={changeHandler} />
	</Example>
	<Example
		label="value={6} disabled"
		surface="chrome"
		width={260}>
		<AutomaLevel
			value={6}
			disabled />
	</Example>
</Section>
