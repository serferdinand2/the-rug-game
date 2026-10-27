<!-- Library section: Button in each mode and size, selected and disabled. -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let ready = $state(true);
</script>

<Section
	name="Button"
	area="ui"
	description="Every button in the game. The mode names the job: primary commits a move, gold creates, joins and marks ready, confirm answers a decision, success starts the game and danger leaves.">
	<Example
		label={'mode="primary"'}
		surface="chrome">
		<Button mode="primary">Advance · +4 VP</Button>
	</Example>
	<Example
		label={'mode="secondary"'}
		surface="chrome">
		<Button>Skip</Button>
	</Example>
	<Example
		label={'mode="gold" size="large" block'}
		surface="chrome"
		width={530}>
		<Button
			mode="gold"
			size="large"
			block>Create a table</Button>
	</Example>
	<Example
		label={`mode="gold" selected={${ready}}  (click it)`}
		surface="chrome">
		<Button
			mode="gold"
			selected={ready}
			onButtonClick={() => (ready = !ready)}
			>I’m ready {ready ? '✓' : ''}</Button>
	</Example>
	<Example
		label={'mode="confirm"  (a decision panel’s Confirm)'}
		surface="chrome">
		<Button mode="confirm">Keep civilization</Button>
	</Example>
	<Example
		label={'mode="success"'}
		surface="chrome">
		<Button mode="success">Start game</Button>
	</Example>
	<Example
		label={'mode="danger"'}
		surface="chrome">
		<Button mode="danger">Leave table</Button>
	</Example>
	<Example
		label={'size="small"'}
		surface="chrome">
		<Button size="small">COPY</Button>
	</Example>
	<Example
		label={'mode="primary" disabled'}
		surface="chrome">
		<Button
			mode="primary"
			disabled>Not reachable</Button>
	</Example>
</Section>
