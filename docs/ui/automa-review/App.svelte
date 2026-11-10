<script>
	import SeatCard from '../../../src/lib/components/lobby/SeatCard.svelte';
	import BotSettings from '../../../src/lib/components/lobby/BotSettings.svelte';
	import BotActionReport from '../../../src/lib/components/board/BotActionReport.svelte';
	import AutomaDecisionCard from '../../../src/lib/components/player/AutomaDecisionCard.svelte';
	import { AUTOMA_CARDS } from '../../../src/lib/engine/data/automa-cards.js';
	import { nextBotKind, nextBotName } from '../../../src/lib/lobby-bots.js';
	import Tooltip from '../../../src/lib/components/ui/Tooltip.svelte';
	let host = $state(true);
	let adding = $state(null);
	let seats = $state([
		{ name: 'Lazar', kind: 'player', level: 2 },
		null,
		null,
		null,
		null,
	]);
	let status = $state('Add a bot to an available player seat.');
	let reportBot = $derived(seats.find((entry) => entry && entry.kind !== 'player'));
	let reportSeat = $derived(seats.findIndex((entry) => entry && entry.kind !== 'player') + 1 || 2);
	function declarations() {
		return seats.filter(Boolean).map((s) => ({
			name: s.name,
			...(s.kind !== 'player' ? { kind: s.kind } : {}),
		}));
	}
	function addBot(index) {
		const used = declarations();
		seats[index] = {
			name: nextBotName(used),
			kind: nextBotKind(used),
			level: 2,
		};
	}
</script>

<Tooltip />
<main class="review">
	<header>
		<h1>Automa lobby</h1>
		<div class="role">
			<button
				onclick={() => (host = true)}
				aria-pressed={host}>Host</button
			><button
				onclick={() => (host = false)}
				aria-pressed={!host}>Guest</button>
		</div>
	</header>
	<section
		class="lobby"
		aria-label="Lobby preview">
		<h2>Players</h2>
		<div class="seats">
			{#each seats as seat, index}
				<div class="seat-wrap">
					<SeatCard
						seat={index + 1}
						state={seat
							? 'player'
							: adding === index
								? 'add'
								: host && index === seats.findIndex((s) => !s)
									? 'empty'
									: 'closed'}
						name={seat?.name ?? ''}
						host={index === 0}
						you={index === 0}
						ready={seat ? true : undefined}
						showCivilization={false}
						botKind={seat && seat.kind !== 'player'
							? seat.kind
							: null}
						canAddBot={host &&
							!!nextBotKind(declarations()) &&
							!seat &&
							index === seats.findIndex((s) => !s)}
						onSeatCardOpen={() => {
							if (seats.some((s) => s?.kind === 'automa')) {
								status =
									'Remove Automa to add a second human; two humans can play with Shadow Empire.';
								return;
							}
							adding = index;
						}}
						onSeatCardCancel={() => (adding = null)}
						onSeatCardAdd={(event) => {
							seats[index] = {
								name:
									event.value.name || 'Player ' + (index + 1),
								kind: 'player',
								level: 2,
							};
							adding = null;
						}}
						removable={host &&
							!!seat &&
							index > 0 &&
							seat.kind === 'player'}
						onSeatCardRemove={() => {
							seats.splice(index, 1);
							seats.push(null);
						}}
						onSeatCardAddBot={() => addBot(index)} />
					{#if host && seat && seat.kind !== 'player'}
						<BotSettings
							kind={seat.kind}
							level={seat.level}
							unavailable={seats
								.filter(
									(s, i) =>
										s && i !== index && s.kind !== 'player'
								)
								.map((s) => s.kind)}
							onBotSettingsChange={(event) => {
								seat.kind = event.value.kind;
								seat.level = event.value.level ?? seat.level;
							}}
							onBotSettingsRemove={() => {
								seats.splice(index, 1);
								seats.push(null);
							}} />
					{/if}
				</div>
			{/each}
		</div>
		<footer>
			<span>{status}</span><button
				onclick={() =>
					(status =
						seats.some((s) => s?.kind === 'automa') &&
						seats.some((s) => s?.kind === 'shadow')
							? 'Solo table ready.'
							: 'Add Automa and Shadow Empire for a solo table.')}
				>Start game</button>
		</footer>
	</section>
	<BotActionReport
		class="review-report"
		name={reportBot?.name ?? 'Automa'}
		seat={reportSeat}
		cards={[AUTOMA_CARDS[3], AUTOMA_CARDS[2]]}
		>{reportBot?.name ?? 'Automa'} advances on <span class="track-name">Exploration</span
		>.</BotActionReport>
	<section class="deck">
		<h2>All 22 decision cards</h2>
		<p>
			Generated from the canonical card data through the same
			decision-card component.
		</p>
		<div class="card-grid">
			{#each AUTOMA_CARDS as card (card.id)}<AutomaDecisionCard
					{card} />{/each}
		</div>
	</section>
</main>

<style>
	.track-name {
		font-family: var(--font-title);
		color: var(--exploration);
	}
	.review {
		max-width: 1600px;
		margin: auto;
		padding: var(--space-6);
		color: var(--text);
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	h1,
	h2 {
		font-family: var(--font-title);
		color: var(--gold);
	}
	h1 {
		font-size: var(--font-size-5xl);
	}
	h2 {
		font-size: var(--font-size-2xl);
	}
	button {
		font: inherit;
		padding: var(--space-3) var(--space-4);
		background: var(--control);
		color: var(--text);
		border: 1px solid var(--line);
		cursor: pointer;
	}
	.role {
		display: flex;
		gap: var(--space-2);
	}
	button[aria-pressed='true'] {
		border-color: var(--gold);
	}
	.lobby,
	.deck {
		background: var(--surface) url('../../../src/styles/pixel-noise.svg');
		padding: var(--space-6);
		border: 1px solid var(--line);
		margin-bottom: var(--space-6);
	}
	.seats {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: var(--space-4);
		align-items: start;
	}
	.seat-wrap {
		min-width: 0;
	}
	footer {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4);
		align-items: center;
		border-top: 1px solid var(--line);
		padding-top: var(--space-4);
		margin-top: var(--space-6);
	}
	:global(.review-report) {
		margin-bottom: var(--space-6);
	}
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(290px, 290px));
		gap: var(--space-6);
		align-items: start;
	}
	@media (max-width: 900px) {
		.seats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
