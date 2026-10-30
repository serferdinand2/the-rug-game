<!-- Library section: TextInput as the launch page's name and code fields, with a hint and an error, the lobby's small read-only code, and a hot-seat seat's small name field. -->
<script>
	import TextInput from '../../../lib/components/ui/TextInput.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let name = $state('');
	let seatName = $state('');
	let code = $state('DAWN20');
	let codeError = $derived(
		/^[A-Za-z0-9]{8}$/.test(code) ? '' : 'Enter an 8-character table code.'
	);

	/**
	 * Selects the whole code, as TableCode does.
	 * @param {import('../../../lib/component-event.js').ComponentEvent} event
	 */
	const selectHandler = (event) => {
		/** @type {HTMLInputElement} */ (event.target).select();
	};
</script>

<Section
	name="TextInput"
	area="ui"
	description="Text fields with a bold label: the launch page's name and table-code inputs, with an optional hint and a validation message, the lobby's small gold read-only code, which keeps its line border on focus, and a hot-seat seat's small name field, which takes the gold focus and fills its frame with block.">
	<Example
		label={`label="Your name" value="${name}"  (type in it)`}
		surface="chrome"
		width={530}>
		<TextInput
			label="Your name"
			name="player-name"
			autocomplete="nickname"
			placeholder="Leave it empty to generate a mythical or historical name"
			bind:value={name} />
	</Example>
	<Example
		label={`label="Table code" maxlength={8} error="${codeError}"  (type 8 letters or digits)`}
		surface="chrome"
		width={530}>
		<TextInput
			label="Table code"
			name="table-code"
			autocomplete="off"
			maxlength={8}
			placeholder="8-character code"
			error={codeError}
			bind:value={code} />
	</Example>
	<Example
		label={'label="Your name" hint="…"'}
		surface="chrome"
		width={530}>
		<TextInput
			label="Your name"
			value="Asterdoria"
			hint="Other players see this name at the table." />
	</Example>
	<Example
		label={'size="small" label="Table code" hideLabel readonly value="DAWN2048" onTextInputFocus  (focus it: the code selects itself, as in the lobby)'}
		surface="chrome">
		<TextInput
			size="small"
			label="Table code"
			hideLabel
			readonly
			value="DAWN2048"
			onTextInputFocus={selectHandler} />
	</Example>
	<Example
		label={'size="small" block label="Name of the player in seat 3" hideLabel placeholder="Name, or leave empty"  (a hot-seat seat\'s name field; focus it for the gold glow)'}
		surface="chrome"
		width={222}>
		<TextInput
			size="small"
			block
			label="Name of the player in seat 3"
			hideLabel
			placeholder="Name, or leave empty"
			maxlength={24}
			autocomplete="off"
			bind:value={seatName} />
	</Example>
</Section>
