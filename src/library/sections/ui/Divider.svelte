<!-- Library section: Divider with the launch page's "or join friends" label, and as a plain rule. -->
<script>
	import Divider from '../../../lib/components/ui/Divider.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="Divider"
	area="ui"
	description="A thin rule between two parts of a panel, optionally paused by a short italic label.">
	<Example
		label={'label="or join friends"'}
		surface="chrome"
		width={480}>
		<Divider label="or join friends" />
	</Example>
	<Example
		label="(no props)"
		surface="chrome"
		width={480}>
		<Divider />
	</Example>
</Section>
