<!-- Six official Automa levels, selected as squares filled from left to right. -->
<script module>
	/** @typedef {Object} AutomaLevelOwnProps
	 * @property {number} [value=2]
	 * @property {boolean} [disabled=false]
	 * @property {readonly number[]} [unavailableLevels=[]]
	 * @property {string} [unavailableLevelReason]
	 * @property {(event: import('../../component-event.js').ComponentEvent) => void} [onAutomaLevelChange]
	 */

	/** @typedef {AutomaLevelOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} AutomaLevelProps
	 * @example
	 * <AutomaLevel value={2} />
	 */
</script>

<script>
	import { AUTOMA_LEVELS } from '../../engine/data/automa-levels.js';
	import { ComponentEvent } from '../../component-event.js';
	/** @type {AutomaLevelProps} */
	let {
		value = 2,
		disabled = false,
		unavailableLevels = [],
		unavailableLevelReason,
		onAutomaLevelChange,
		...attr
	} = $props();
</script>

<div
	{...attr}
	class="rg-automa-level {attr.class ?? ''}">
	<div class="rg-automa-level--label">
		<span>Automa level</span><strong>{value}</strong>
	</div>
	<div
		class="rg-automa-level--squares"
		role="group"
		aria-label="Automa level">
		{#each AUTOMA_LEVELS as level (level.level)}
			<button
				type="button"
				disabled={disabled || unavailableLevels.includes(level.level)}
				aria-label={unavailableLevels.includes(level.level)
					? `${level.name} unavailable`
					: level.name}
				aria-pressed={value === level.level}
				title={unavailableLevels.includes(level.level)
					? unavailableLevelReason ?? 'This level is unavailable for this expansion.'
					: level.name}
				class:rg-automa-level--filled={level.level <= value}
				onclick={(event) => {
					if (typeof onAutomaLevelChange === 'function') {
						onAutomaLevelChange(
							new ComponentEvent(
								level.level,
								event.currentTarget,
								event
							)
						);
					}
				}}>{level.level}</button>
		{/each}
	</div>
	{#if unavailableLevels.includes(value)}
		<span class="rg-automa-level--unavailable" role="alert"
			>{unavailableLevelReason ?? 'This level is unavailable for this expansion.'} Choose another level before starting.</span
		>
	{/if}
	<span class="rg-automa-level--name"
		>{AUTOMA_LEVELS.find((level) => level.level === value)?.name}</span>
</div>

<style>
	.rg-automa-level {
		display: grid;
		gap: var(--space-3);
	}
	.rg-automa-level--label {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-size-xs);
	}
	.rg-automa-level--label strong {
		color: var(--gold);
	}
	.rg-automa-level--squares {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: var(--space-2);
	}
	.rg-automa-level--squares button {
		aspect-ratio: 1;
		min-width: 0;
		padding: 0;
		border: var(--border) solid var(--line);
		background: var(--control);
		color: var(--muted);
		font-size: var(--font-size-xs);
	}
	.rg-automa-level--squares button.rg-automa-level--filled {
		background: var(--science);
		border-color: var(--science);
		color: var(--text);
	}
	.rg-automa-level--squares button[aria-pressed='true'] {
		outline: var(--border) solid var(--gold);
		outline-offset: 1px;
	}
	.rg-automa-level--squares button:disabled {
		opacity: var(--opacity-disabled, 0.5);
		cursor: not-allowed;
	}
	.rg-automa-level--unavailable {
		color: var(--gold);
		font-size: var(--font-size-2xs);
	}
	.rg-automa-level--name {
		color: var(--muted);
		font-size: var(--font-size-2xs);
	}
</style>
