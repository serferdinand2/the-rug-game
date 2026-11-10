<!-- The host's bot settings beneath its fixed-height player seat. -->
<script module>
	/** @typedef {Object} BotSettingsOwnProps
	 * @property {'automa' | 'shadow'} kind
	 * @property {number} [level=2]
	 * @property {('automa' | 'shadow')[]} [unavailable=[]]
	 * @property {(event: import('../../component-event.js').ComponentEvent) => void} [onBotSettingsChange]
	 * @property {(event: import('../../component-event.js').ComponentEvent) => void} [onBotSettingsRemove]
	 */

	/** @typedef {BotSettingsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} BotSettingsProps
	 * @example
	 * <BotSettings kind="automa" level={2} />
	 */
</script>

<script>
	import AutomaLevel from './AutomaLevel.svelte';
	import Button from '../ui/Button.svelte';
	import { ComponentEvent } from '../../component-event.js';
	/** @type {BotSettingsProps} */
	let {
		kind,
		level = 2,
		unavailable = [],
		onBotSettingsChange,
		onBotSettingsRemove,
		...attr
	} = $props();
</script>

<div
	{...attr}
	class="rg-bot-settings {attr.class ?? ''}">
	<span class="rg-bot-settings--label">Bot type</span>
	<div
		class="rg-bot-settings--types"
		role="group"
		aria-label="Bot type">
		{#each [{ kind: 'automa', label: 'Automa' }, { kind: 'shadow', label: 'Shadow Empire' }] as option (option.kind)}
			<button
				type="button"
				class:rg-bot-settings--shadow={option.kind === 'shadow'}
				aria-pressed={kind === option.kind}
				disabled={unavailable.includes(
					/** @type {'automa' | 'shadow'} */ (option.kind)
				)}
				onclick={(event) => {
					if (typeof onBotSettingsChange === 'function') {
						onBotSettingsChange(
							new ComponentEvent(
								{
									kind: option.kind,
									...(option.kind === 'automa' && { level }),
								},
								event.currentTarget,
								event
							)
						);
					}
				}}>{option.label}</button>
		{/each}
	</div>
	{#if kind === 'automa'}
		<AutomaLevel
			value={level}
			onAutomaLevelChange={(event) => {
				if (typeof onBotSettingsChange === 'function') {
					onBotSettingsChange(
						new ComponentEvent(
							{ kind, level: event.value },
							event.target,
							event.originalEvent
						)
					);
				}
			}} />
	{/if}
	<Button
		mode="danger"
		size="small"
		block
		onButtonClick={(
			/** @type {import('../../component-event.js').ComponentEvent} */ event
		) => {
			if (typeof onBotSettingsRemove === 'function') {
				onBotSettingsRemove(
					new ComponentEvent(
						undefined,
						event.target,
						event.originalEvent
					)
				);
			}
		}}>Remove bot</Button>
</div>

<style>
	.rg-bot-settings {
		display: grid;
		gap: var(--space-4);
		padding: var(--space-4);
		border: var(--border) solid var(--science);
		border-top: 0;
		background: var(--texture)
			color-mix(in srgb, var(--science) 15%, var(--ink));
	}
	.rg-bot-settings--label {
		font-size: var(--font-size-xs);
		color: var(--muted);
	}
	.rg-bot-settings--types {
		display: grid;
		gap: var(--space-2);
	}
	.rg-bot-settings--types button {
		padding: var(--space-3) var(--space-2);
		font-size: var(--font-size-xs);
		color: var(--text);
		border: var(--border) solid var(--science);
		background: var(--science);
	}
	.rg-bot-settings--types button.rg-bot-settings--shadow {
		background: color-mix(in srgb, var(--science) 25%, var(--ink));
	}
	.rg-bot-settings--types button[aria-pressed='true'] {
		border-color: var(--gold);
		box-shadow: inset 0 0 0 1px var(--gold);
	}
	.rg-bot-settings--types button:disabled {
		opacity: var(--opacity-disabled, 0.5);
		cursor: not-allowed;
	}
</style>
