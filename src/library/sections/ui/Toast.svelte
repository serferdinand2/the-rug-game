<!-- Library section: Toast shown in place, and fixed at the bottom of the viewport when a button shows it. -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
	import Toast from '../../../lib/components/ui/Toast.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let visible = $state(false);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;

	// The page that owns a toast hides it again; the launch mockup waits 2.4 seconds.
	const showButtonClickHandler = () => {
		visible = true;
		clearTimeout(timer);
		timer = setTimeout(() => (visible = false), 2400);
	};
</script>

<Section
	name="Toast"
	area="ui"
	description="A short status message in a gold-bordered box. It fades in at the bottom centre of the screen and is read out politely; the page hides it again.">
	<Example
		label={'placement="inline" visible message="Code copied."'}
		surface="surface">
		<Toast
			placement="inline"
			visible
			message="Code copied." />
	</Example>
	<Example
		label={`placement="fixed" visible={${visible}}  (press the button)`}
		surface="surface">
		<Button onButtonClick={showButtonClickHandler}>Show the toast</Button>
		<Toast
			{visible}
			message="Choose a name, then create or join a table." />
	</Example>
</Section>
