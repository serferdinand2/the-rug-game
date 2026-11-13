<!-- A decision's public cause, shared by the prompt and the turn footer. -->
<script>
	import { ComponentEvent } from '../../component-event.js';
	import { artUrl, trackColor } from '../../ui.js';
	/** @type {{ source: any, onDecisionSourceInspect?: Function }} */
	let { source, onDecisionSourceInspect } = $props();
	/** @param {Event} event @param {boolean} show */
	function inspect(event, show) {
		if (typeof onDecisionSourceInspect === 'function')
			onDecisionSourceInspect(
				new ComponentEvent(
					show ? source.inspect : null,
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
	}
</script>

<span
	class="rg-decision-source"
	style:--rg-decision-source-track={source.kind === 'track'
		? trackColor(source.track)
		: undefined}>
	{#if source.kind === 'track'}From {source.bonus ? 'the bonus of ' : ''}<span
			class="rg-decision-source--name">{source.name}</span
		>, <span class="rg-decision-source--track">{source.trackName}</span>
		<span class="rg-decision-source--number">{source.space}</span>
	{:else if source.kind === 'named'}{source.prefix}{#if source.art}<img
				class="rg-decision-source--art"
				src={artUrl(source.art)}
				alt="" />{/if}{#if source.inspect && typeof onDecisionSourceInspect === 'function'}<button
				type="button"
				class="rg-decision-source--name rg-decision-source--button"
				onpointerenter={(event) => inspect(event, true)}
				onpointerleave={(event) => inspect(event, false)}
				onfocus={(event) => inspect(event, true)}
				onblur={(event) => inspect(event, false)}>{source.name}</button
			>{:else}<span class="rg-decision-source--name">{source.name}</span
			>{/if}{source.suffix}
	{:else if source.kind === 'territory'}{source.prefix}<span
			class="rg-decision-source--number">{source.name}</span>
	{:else}{source.text}{/if}
</span>

<style>
	.rg-decision-source--art {
		width: 28px;
		height: 28px;
		object-fit: contain;
		vertical-align: middle;
		image-rendering: pixelated;
		margin-inline-end: var(--space-2);
	}
	.rg-decision-source--button {
		background: transparent;
		border: 0;
		padding: 0;
		cursor: pointer;
		font-size: inherit;
	}
	.rg-decision-source--name,
	.rg-decision-source--track {
		font-family: var(--font-title);
	}
	.rg-decision-source--name,
	.rg-decision-source--number {
		color: var(--gold);
	}
	.rg-decision-source--track {
		color: var(--rg-decision-source-track);
	}
</style>
