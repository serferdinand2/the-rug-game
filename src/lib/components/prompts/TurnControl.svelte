<!-- TurnControl: turn a tile back or forward, with the VP it would score on the chosen hex between the arrows. -->
<script module>
	/**
	 * Properties of the TurnControl component itself.
	 * @typedef {Object} TurnControlOwnProps
	 * @property {number | null} [vp=null] - What the tile scores on the chosen hex; null while no hex is chosen
	 * @property {Function} [onTurnControlTurn] - Callback fired with `{ step: -1 | 1 }` when a turn button is pressed
	 */

	/**
	 * Properties for the TurnControl component, including any attributes for its root element.
	 * @typedef {TurnControlOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TurnControlProps
	 *
	 * @example
	 * <TurnControl vp={3} onTurnControlTurn={turn} />
	 */
</script>

<script>
	import VpTag from './VpTag.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {TurnControlProps} */
	let { vp = null, onTurnControlTurn, ...attr } = $props();

	/**
	 * @param {-1 | 1} step
	 * @param {MouseEvent} event
	 */
	const turnHandler = (step, event) => {
		if (typeof onTurnControlTurn === 'function') {
			onTurnControlTurn(
				new ComponentEvent(
					{ step },
					/** @type {HTMLButtonElement} */ (event.currentTarget),
					event
				)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-turn-control {attr.class ? attr.class : ''}">
	<button
		type="button"
		class="rg-turn-control--button"
		aria-label="Turn the tile back"
		title="Turn back (,)"
		disabled={vp === null}
		onclick={(event) => turnHandler(-1, event)}>↺</button>
	{#if vp === null}
		<span class="rg-turn-control--no-hex">No hex yet</span>
	{:else}
		<VpTag
			value={vp}
			variant="inline" />
	{/if}
	<button
		type="button"
		class="rg-turn-control--button"
		aria-label="Turn the tile"
		title="Turn (.)"
		disabled={vp === null}
		onclick={(event) => turnHandler(1, event)}>↻</button>
	<span class="rg-turn-control--hint">. and , turn it</span>
</div>

<style>
	.rg-turn-control {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.rg-turn-control--button {
		min-width: 36px;
		min-height: 36px;
		border: var(--border) solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--choice-fill);
		color: var(--text);
		font-size: var(--font-size-xl);
		line-height: var(--leading-none);
	}

	.rg-turn-control--button:hover:not(:disabled),
	.rg-turn-control--button:focus-visible {
		border-color: var(--gold);
	}

	.rg-turn-control--button:disabled {
		color: var(--muted);
		opacity: var(--opacity-disabled);
		cursor: default;
	}

	.rg-turn-control--no-hex {
		color: var(--muted);
		font-size: var(--font-size-md);
	}

	.rg-turn-control--hint {
		color: var(--muted);
		font-size: var(--font-size-xs);
	}
</style>
