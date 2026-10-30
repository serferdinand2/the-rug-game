<!-- Library section: TextInput as the launch page's name and code fields, with a hint and an error, and the lobby's small read-only code. -->
<script>
	import TextInput from '../../../lib/components/ui/TextInput.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let name = $state('');
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
	description="Text fields with a bold label: the launch page's name and table-code inputs, with an optional hint and a validation message, and the lobby's small gold read-only code.">
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
</Section>
