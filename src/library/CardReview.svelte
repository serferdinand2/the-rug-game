<!-- The shared card components in the same single-page review gallery. -->
<script>
	import CivilizationCard from '../lib/components/player/CivilizationCard.svelte';
	import { REVIEWED_CIVILIZATIONS } from '../lib/cards/reviewed-civilizations.js';
	import { civilizationName } from '../lib/game-names.js';
	let state = $state(/** @type {'empty'|'play'} */ ('empty'));
	const embeddedCard = new URLSearchParams(window.location.search).get(
		'embed'
	);
	const cards = embeddedCard
		? REVIEWED_CIVILIZATIONS.filter((card) => card.id === embeddedCard)
		: REVIEWED_CIVILIZATIONS;
</script>

{#if !embeddedCard}
	<header class="rg-card-review--header">
		<h1>Civilization cards</h1>
		<nav aria-label="Example state">
			<button
				aria-pressed={state === 'empty'}
				onclick={() => (state = 'empty')}>Unmarked</button
			><button
				aria-pressed={state === 'play'}
				onclick={() => (state = 'play')}>In play example</button
			><a href="/components.html#civilization-card">Components</a>
		</nav>
	</header>
{/if}
<main class={`rg-card-review ${embeddedCard ? 'rg-card-review--embed' : ''}`}>
	{#each cards as card}<section
			aria-labelledby={embeddedCard ? undefined : `${card.id}-heading`}
			aria-label={embeddedCard
				? `${civilizationName(card.id)} civilization card`
				: undefined}>
			{#if !embeddedCard}
				<h2 id={`${card.id}-heading`}>{civilizationName(card.id)}</h2>
				<p>
					{card.edition === 'original'
						? 'Original mat · layout example'
						: card.edition === 'awaiting review'
							? 'New card · awaiting review'
							: 'Reviewed card layout'}
				</p>
			{/if}
			<CivilizationCard
				id={card.id}
				{state} />
		</section>{/each}
</main>

<style>
	.rg-card-review {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 32px 22px;
		padding: 26px 18px;
	}
	.rg-card-review section {
		width: 425px;
	}
	.rg-card-review--embed {
		gap: 0;
		padding: 0;
	}
	:global(body:has(.rg-card-review--embed)) {
		margin: 0;
		background: transparent;
	}
	.rg-card-review h2 {
		color: var(--gold);
		font: 600 22px/1.2 var(--font-title);
		scroll-margin-top: 80px;
	}
	.rg-card-review p {
		color: var(--muted);
		font: 13px/1.4 var(--font-body);
		margin-bottom: 20px;
	}
	.rg-card-review--header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 18px;
		background: var(--chrome);
		border-bottom: 1px solid var(--line);
	}
	.rg-card-review--header h1 {
		margin: 0;
		font: 600 20px/1.2 var(--font-title);
		color: var(--gold);
	}
	.rg-card-review--header nav {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.rg-card-review--header button,
	.rg-card-review--header a {
		padding: 7px 10px;
		background: var(--control);
		border: 1px solid var(--line);
		color: var(--text);
		font: 13px/1.2 var(--font-body);
		text-decoration: none;
		cursor: pointer;
	}
	.rg-card-review--header button[aria-pressed='true'] {
		border-color: var(--gold);
		color: var(--gold);
	}
</style>
