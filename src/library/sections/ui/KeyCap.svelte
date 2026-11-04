<!-- Library section: KeyCap alone and inside the buttons that show their key. -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
	import KeyCap from '../../../lib/components/ui/KeyCap.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="KeyCap"
	area="ui"
	description="The key that does the same as a button, small and in the button's colour beside its word (#174): the footer's actions, a decision's confirm, Minimize and the landmark tray's turn keys.">
	<Example
		label={'key="Enter"'}
		surface="chrome">
		<KeyCap key="Enter" />
	</Example>
	<Example
		label={'<Button mode="primary">Advance<KeyCap key="Enter" /></Button>'}
		surface="chrome">
		<Button mode="primary">Advance<KeyCap key="Enter" /></Button>
	</Example>
	<Example
		label={'<Button>Take income<KeyCap key="I" /></Button>'}
		surface="chrome">
		<Button>Take income<KeyCap key="I" /></Button>
	</Example>
	<Example
		label={'<Button mode="confirm">Confirm choice<KeyCap key="Enter" /></Button>'}
		surface="chrome">
		<Button mode="confirm">Confirm choice<KeyCap key="Enter" /></Button>
	</Example>
	<Example
		label={'<Button>Cancel<KeyCap key="Esc" /></Button>'}
		surface="chrome">
		<Button>Cancel<KeyCap key="Esc" /></Button>
	</Example>
</Section>
