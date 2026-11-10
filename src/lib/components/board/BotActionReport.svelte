<!-- BotActionReport: the green textured bot action surface and the exact public decision pair. -->
<script module>
	/** @typedef {import('../../engine/data/automa-cards.js').AutomaCard} AutomaCard */
	/**
	 * @typedef {Object} BotActionReportOwnProps
	 * @property {string} name - The actor's civilization-style seat name.
	 * @property {number} seat - The actor's player colour.
	 * @property {readonly AutomaCard[]} [cards] - Revealed track/income then hex/topple cards, copied from the public action.
	 * @property {import('../../engine/data/ids.js').BoardTrackId} [favouriteTrack='exploration']
	 * @property {import('svelte').Snippet} [children] - The description of the actual action.
	 */
	/**
	 * @typedef {BotActionReportOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} BotActionReportProps
	 * @example
	 * <BotActionReport name="Egypt" seat={2} cards={pair}>Egypt advances on Exploration.</BotActionReport>
	 */
</script>

<script>
	import AutomaDecisionCard from '../player/AutomaDecisionCard.svelte';
	import { playerColor } from '../../ui.js';
	/** @type {BotActionReportProps} */
	let {
		name,
		seat,
		cards = [],
		favouriteTrack = 'exploration',
		children,
		...attr
	} = $props();
</script>

<section
	{...attr}
	class="rg-bot-action-report {attr.class ?? ''}"
	aria-label={`${name} Automa action`}
	style:--rg-bot-actor-colour={playerColor(
		/** @type {import('../../ui.js').Seat} */ (seat)
	)}>
	<header class="rg-bot-action-report--header">
		<strong
			><span
				class="rg-bot-action-report--player"
				aria-hidden="true"></span
			>{name}
			<span class="rg-bot-action-report--kind">(Automa)</span></strong>
		<span class="rg-bot-action-report--label">Action report</span>
	</header>
	<div class="rg-bot-action-report--body">
		<div class="rg-bot-action-report--description">
			{@render children?.()}
		</div>
		{#if cards.length}
			<div class="rg-bot-action-report--cards">
				{#each cards as card, index (`${card.id}-${index}`)}
					<AutomaDecisionCard
						{card}
						role={index === 0 ? 'track' : 'hex'}
						{favouriteTrack} />
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.rg-bot-action-report {
		border: var(--border-thick) solid var(--science);
		background: var(--texture)
			color-mix(in srgb, var(--science) 18%, var(--surface));
		color: var(--text);
	}
	.rg-bot-action-report--header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-6);
		border-bottom: var(--border) solid var(--science);
	}
	.rg-bot-action-report--header strong {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.rg-bot-action-report--player {
		width: 12px;
		height: 12px;
		background: var(--rg-bot-actor-colour);
	}
	.rg-bot-action-report--kind {
		font-family: var(--font-title);
	}
	.rg-bot-action-report--label {
		color: var(--muted);
		font-size: var(--font-size-xs);
	}
	.rg-bot-action-report--body {
		padding: var(--space-6);
	}
	.rg-bot-action-report--description {
		margin-bottom: var(--space-6);
	}
	.rg-bot-action-report--cards {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-6);
		align-items: flex-start;
	}
</style>
