<!-- Library section: Dialog, narrow and wide, modal and over its parent only, with Close or its own actions. -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
	import Dialog from '../../../lib/components/ui/Dialog.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let reported = $state('');
	let modalOpen = $state(false);
	let wideOpen = $state(false);
</script>

<Section
	name="Dialog"
	area="ui"
	description="How to play, the game's How to play and Table settings: a title, the content and Close, over a scrim. Escape, Close and a click on the backdrop close it; it takes the focus as it opens and gives it back as it closes. A modal one covers the screen and keeps Tab inside; one that isn't covers its positioned parent only, on a lighter scrim.">
	<Example
		label={`modal={false}  (here over its stage, as Table settings over the board; ${reported || 'press Close, Escape or the backdrop'})`}
		surface="surface"
		wide>
		<div
			style:position="relative"
			style:height="300px">
			<Dialog
				title="How to play"
				modal={false}
				onDialogClose={() =>
					(reported = `onDialogClose at ${new Date().toLocaleTimeString()}`)}>
				<p
					style:margin="0"
					style:color="var(--muted)">
					Enter your name, or leave it empty for a generated one.
				</p>
			</Dialog>
		</div>
	</Example>
	<Example
		label={'modal={false} actions  (a Done button in place of Close)'}
		surface="surface"
		wide>
		<div
			style:position="relative"
			style:height="300px">
			<Dialog
				title="Table settings"
				modal={false}>
				<p
					style:margin="0"
					style:color="var(--muted)">
					Changes apply at once. A timer change restarts every clock.
				</p>
				{#snippet actions()}
					<Button mode="primary">Done</Button>
				{/snippet}
			</Dialog>
		</div>
	</Example>
	<Example
		label={'modal  size="narrow"  (press Open: the dialog covers the page; the focus comes back here)'}
		surface="surface">
		<Button
			size="small"
			onButtonClick={() => (modalOpen = true)}>Open</Button>
		{#if modalOpen}
			<Dialog
				title="How to play"
				onDialogClose={() => (modalOpen = false)}>
				<p
					style:margin="0"
					style:color="var(--muted)">
					Tab stays inside; Escape, Close or the backdrop close it.
				</p>
			</Dialog>
		{/if}
	</Example>
	<Example
		label={'modal  size="wide"  (press Open: up to 1000px, the content scrolling when the screen is short)'}
		surface="surface">
		<Button
			size="small"
			onButtonClick={() => (wideOpen = true)}>Open</Button>
		{#if wideOpen}
			<Dialog
				title="How to play"
				size="wide"
				onDialogClose={() => (wideOpen = false)}>
				<p
					style:margin="0"
					style:color="var(--muted)">
					The game's rules, one tab per part of the game.
				</p>
			</Dialog>
		{/if}
	</Example>
</Section>
