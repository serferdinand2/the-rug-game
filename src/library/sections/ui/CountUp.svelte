<!-- Library section: CountUp counting up with its +n, down, and still. -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
	import CountUp from '../../../lib/components/ui/CountUp.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let coins = $state(2);
	let still = $state(3);
</script>

<Section
	name="CountUp"
	area="ui"
	description="A number that counts to its new value in half a second, easing out, with a green +n that rises and fades when it grows (#174). ResourceChip's count and PlayerChip's VP use it. still changes at once, as a prompt's preview does; with reduced motion every change is at once.">
	<Example
		label={`value={${coins}}  (press to gain or pay)`}
		surface="chrome">
		<span class="rg-library-count-up">
			<b class="rg-library-count-up--number"><CountUp value={coins} /></b>
			<Button
				size="small"
				onButtonClick={() => (coins += 3)}>Gain 3</Button>
			<Button
				size="small"
				onButtonClick={() => (coins = Math.max(0, coins - 2))}
				>Pay 2</Button>
		</span>
	</Example>
	<Example
		label={`value={${still}} still`}
		surface="chrome">
		<span class="rg-library-count-up">
			<b class="rg-library-count-up--number"
				><CountUp
					value={still}
					still /></b>
			<Button
				size="small"
				onButtonClick={() => (still += 1)}>Add 1</Button>
		</span>
	</Example>
</Section>

<style>
	.rg-library-count-up {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
	}

	.rg-library-count-up--number {
		min-width: 40px;
		color: var(--text);
		font-size: var(--font-size-xl);
	}
</style>
