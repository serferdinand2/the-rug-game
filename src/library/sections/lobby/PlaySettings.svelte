<!-- Library section: PlaySettings for the host, in the lobby's column and in Table settings, and locked for a guest. -->
<script>
	import PlaySettings from '../../../lib/components/lobby/PlaySettings.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	// The server's timers (#24): off, 1, 2 and 5 minutes.
	const TIMERS = [0, 1, 2, 5];
	// The lobby's left column is about 556px wide; the stage adds 34px. Table settings' rows are 512px.
	const LOBBY_WIDTH = 590;
	const DIALOG_WIDTH = 546;

	let timer = $state(0);
	let undo = $state(true);
	let last = $state('nothing yet');

	/**
	 * @param {ComponentEvent} event
	 */
	const changeHandler = (event) => {
		last = JSON.stringify(event.value);
		if ('timer' in event.value) {
			timer = event.value.timer;
		} else {
			undo = event.value.undo;
		}
	};
</script>

<Section
	name="PlaySettings"
	area="lobby"
	description="The two settings a host may change while the table plays, drawn the same in the lobby and in Table settings: the turn timer and undo. Its rows join the parent's layout, so they take the lobby column's spacing there and the dialog's in Table settings. A guest sees them disabled, with a tooltip saying why.">
	<Example
		label={`timers={[0, 1, 2, 5]} timer={${timer}} undo={${undo}}  onPlaySettingsChange → ${last}  (the lobby's column)`}
		surface="chrome"
		width={LOBBY_WIDTH}>
		<div class="rg-library-play-settings">
			<PlaySettings
				timers={TIMERS}
				{timer}
				{undo}
				onPlaySettingsChange={changeHandler} />
		</div>
	</Example>
	<Example
		label={`timers={[0, 1, 2, 5]} timer={${timer}} undo={${undo}}  (Table settings)`}
		surface="chrome"
		width={DIALOG_WIDTH}>
		<div class="rg-library-play-settings rg-library-play-settings--dialog">
			<PlaySettings
				timers={TIMERS}
				{timer}
				{undo}
				onPlaySettingsChange={changeHandler} />
		</div>
	</Example>
	<Example
		label={'timers={[0, 1, 2, 5]} timer={2} undo={false} disabled title="Only the host changes the table."'}
		surface="chrome"
		width={LOBBY_WIDTH}>
		<div class="rg-library-play-settings">
			<PlaySettings
				timers={TIMERS}
				timer={2}
				undo={false}
				disabled
				title="Only the host changes the table." />
		</div>
	</Example>
</Section>

<style>
	/* As the lobby's settings column. */
	.rg-library-play-settings {
		display: grid;
		gap: var(--space-5);
	}

	/* As the Table settings dialog. */
	.rg-library-play-settings--dialog {
		gap: var(--space-6);
	}
</style>
