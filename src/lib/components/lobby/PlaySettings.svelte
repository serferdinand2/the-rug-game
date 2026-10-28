<!-- The settings a host may change while the table plays, in the lobby and in Table settings: the turn timer and undo. -->
<script module>
	/**
	 * Properties of the PlaySettings component itself.
	 * @typedef {Object} PlaySettingsOwnProps
	 * @property {readonly number[]} timers - The timer's choices in minutes, 0 for off, from the server's config
	 * @property {number} timer - The table's timer, in minutes
	 * @property {boolean} undo - Whether the table allows undo
	 * @property {boolean} [disabled=false] - Shown but not choosable, for a player who doesn't host
	 * @property {string} [title] - Each row's tooltip, saying why the settings are disabled
	 * @property {Function} [onPlaySettingsChange] - Callback fired with { timer } (minutes) or { undo } (a boolean) after a choice
	 */

	/**
	 * Properties for the PlaySettings component, including any attributes for its root element.
	 * @typedef {PlaySettingsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} PlaySettingsProps
	 *
	 * @example
	 * <PlaySettings
	 *   timers={config.timers}
	 *   timer={room.timer}
	 *   undo={room.undo}
	 *   disabled={!hosting}
	 *   title={settingsLock(room) ?? undefined}
	 *   onPlaySettingsChange={(event) => store.settings(event.value)} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { UNDO_CHOICES, timerChoices } from '../../lobby.js';
	import Segmented from '../ui/Segmented.svelte';
	import SettingRow from './SettingRow.svelte';

	/** @type {PlaySettingsProps} */
	let {
		timers,
		timer,
		undo,
		disabled = false,
		title,
		onPlaySettingsChange,
		...attr
	} = $props();

	/**
	 * @param {ComponentEvent} event
	 */
	const timerChangeHandler = (event) => {
		report({ timer: Number(event.value) }, event);
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const undoChangeHandler = (event) => {
		report({ undo: event.value === 'on' }, event);
	};

	/**
	 * Passes a row's change on as the setting the server takes.
	 * @param {{ timer: number } | { undo: boolean }} value
	 * @param {ComponentEvent} event - The row's Segmented change
	 */
	function report(value, event) {
		if (typeof onPlaySettingsChange === 'function') {
			onPlaySettingsChange(
				new ComponentEvent(value, event.target, event.originalEvent)
			);
		}
	}
</script>

<div
	{...attr}
	class="rg-play-settings {attr.class ? attr.class : ''}">
	<SettingRow
		label="Turn timer"
		{title}>
		<Segmented
			label="Turn timer"
			options={timerChoices(timers)}
			value={String(timer)}
			{disabled}
			onSegmentedChange={timerChangeHandler} />
	</SettingRow>
	<SettingRow
		label="Undo rules"
		{title}>
		<Segmented
			label="Undo rules"
			options={[...UNDO_CHOICES]}
			value={undo ? 'on' : 'off'}
			{disabled}
			onSegmentedChange={undoChangeHandler} />
	</SettingRow>
</div>

<style>
	/* The two rows join the parent's own layout, so the lobby's column and the Table settings dialog space them as
	   their other rows. */
	.rg-play-settings {
		display: contents;
	}
</style>
