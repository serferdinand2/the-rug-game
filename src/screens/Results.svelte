<!-- The results screen (#29 design §6), as Lazar's end screen: the final standings with where each player's VP came from, the viewer's result, how each tie was decided, the table's facts, and review, deal again or leave. -->
<script module>
	/**
	 * Properties of the Results screen itself.
	 * @typedef {Object} ResultsOwnProps
	 * @property {import('../lib/game.svelte.js').GameStore} store - Its room holds the finished game
	 * @property {Function} [onResultsReview] - Callback fired when Review game board is chosen
	 * @property {Function} [onResultsHelp] - Callback fired when How to play is chosen
	 */

	/**
	 * Properties for Results, including any attributes for its root element.
	 * @typedef {ResultsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} ResultsProps
	 *
	 * @example
	 * <Results {store} onResultsReview={() => (reviewing = true)} />
	 */
</script>

<script>
	import Badge from '../lib/components/ui/Badge.svelte';
	import Button from '../lib/components/ui/Button.svelte';
	import StandingRow from '../lib/components/results/StandingRow.svelte';
	import TieSteps from '../lib/components/results/TieSteps.svelte';
	import PageHeader from './PageHeader.svelte';
	import { isHost } from '../lib/lobby.js';
	import { playerColor } from '../lib/ui.js';
	import {
		ruleNote,
		standings,
		tableFacts,
		tieExplanations,
		yourResult,
	} from '../lib/results.js';

	/** @typedef {import('../lib/component-event.js').ComponentEvent} ComponentEvent */

	/** @type {ResultsProps} */
	let { store, onResultsReview, onResultsHelp, ...attr } = $props();

	let room = $derived(store.room);
	let game = $derived(room.game);
	let rows = $derived(standings(game));
	let ties = $derived(tieExplanations(game));
	/** The viewer's seat online; at a hot-seat table the results belong to everyone, so the winners show instead. */
	let you = $derived(room.mode === 'hotseat' ? null : store.seat);
	let result = $derived(yourResult(game, you));
	/** The result box takes the viewer's colour, or the (first) winner's. */
	let resultColor = $derived(
		playerColor(/** @type {any} */ (you ?? rows[0]?.seat ?? 1))
	);
	let facts = $derived(tableFacts(room));
	let hosting = $derived(isHost(room));
	/** The seats whose VP sources are open; several may be, for comparing. @type {number[]} */
	let open = $state([]);

	/**
	 * @param {number} seat
	 * @param {boolean} expanded
	 */
	function toggle(seat, expanded) {
		open = expanded
			? [...open, seat]
			: open.filter((other) => other !== seat);
	}

	/**
	 * @param {ComponentEvent} event
	 */
	const menuHandler = (event) => {
		if (event.value === 'leave') {
			store.leaveTable();
		} else if (typeof onResultsHelp === 'function') {
			onResultsHelp(event);
		}
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const reviewHandler = (event) => {
		if (typeof onResultsReview === 'function') {
			onResultsReview(event);
		}
	};
</script>

<div
	{...attr}
	class="rg-results {attr.class ? attr.class : ''}">
	<PageHeader
		sound={store.sound}
		items={[
			{ id: 'help', label: 'How to play' },
			{ id: 'leave', label: 'Leave table' },
		]}
		onPageHeaderSound={(/** @type {any} */ event) =>
			store.setSound(event.value)}
		onPageHeaderMenu={menuHandler}>
		{#snippet center()}
			<strong class="rg-results--state">Game complete</strong>
		{/snippet}
		{#snippet before()}
			<span class="rg-results--table"
				>Table {room.code} · {rows.length} players</span>
		{/snippet}
	</PageHeader>

	<div class="rg-results--middle">
		<main class="rg-results--standings">
			<div class="rg-results--head">
				<h1>Final standings</h1>
				<p>
					The last income turn is complete. The table has its final
					result.
				</p>
			</div>
			<div
				class="rg-results--columns"
				aria-hidden="true">
				<span>Place</span><span>Player</span><span>Final score</span>
			</div>
			<div
				class="rg-results--leaderboard"
				role="group"
				aria-label="Final standings">
				{#each rows as row (row.seat)}
					<StandingRow
						{row}
						you={row.seat === you}
						expanded={open.includes(row.seat)}
						onStandingRowToggle={(
							/** @type {ComponentEvent} */ event
						) => toggle(row.seat, event.value)} />
				{/each}
			</div>
			<p class="rg-results--note">{ruleNote(game)}</p>
		</main>

		<aside
			class="rg-results--details"
			aria-label="Result details">
			<section
				class="rg-results--yours"
				style:--rg-results-color={resultColor}>
				<h2>{result.title}</h2>
				<strong>{result.place}</strong>
				<span>{result.vp} VP</span>
				<p>{result.outcome}</p>
			</section>
			<section
				class="rg-results--ties"
				aria-labelledby="rg-results-ties">
				<h2 id="rg-results-ties">How the tie was decided</h2>
				{#each ties as tie (tie.vp)}
					<TieSteps {tie} />
				{:else}
					<p class="rg-results--quiet">
						No tie to decide: places follow final VP.
					</p>
				{/each}
			</section>
			<section
				class="rg-results--facts"
				aria-labelledby="rg-results-facts">
				<h2 id="rg-results-facts">This table</h2>
				<dl>
					<dt>Rules</dt>
					<dd>{facts.rules}</dd>
					<dt>Mode</dt>
					<dd>{facts.mode}</dd>
					<dt>Expansions</dt>
					<dd class="rg-results--badges">
						{#each facts.expansions as name (name)}
							<Badge label={name} />
						{:else}
							Base game
						{/each}
					</dd>
					<dt>Variants</dt>
					<dd>
						{facts.variants.length
							? facts.variants.join(', ')
							: 'None'}
					</dd>
				</dl>
			</section>
		</aside>
	</div>

	<footer class="rg-results--footer">
		<span class="rg-results--state">Game complete</span>
		<div class="rg-results--actions">
			<Button onButtonClick={reviewHandler}>Review game board</Button>
			<Button
				mode={hosting ? 'secondary' : 'gold'}
				onButtonClick={() => store.leaveTable()}
				>Return to tables</Button>
			{#if hosting}
				<Button
					mode="gold"
					title="A new game at this table, with the players here"
					onButtonClick={() => store.startGame()}>Deal again</Button>
			{/if}
		</div>
	</footer>
</div>

<style>
	.rg-results {
		display: grid;
		grid-template-rows: var(--bar-height) minmax(0, 1fr) var(--bar-height);
		height: 100vh;
		min-height: 0;
		overflow: hidden;
	}

	.rg-results--state {
		color: var(--gold);
		font: var(--weight-title) var(--font-size-xl) / var(--leading-none)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
	}

	.rg-results--table {
		color: var(--muted);
		font-size: var(--font-size-sm);
		white-space: nowrap;
	}

	.rg-results--middle {
		display: grid;
		grid-template-columns: var(--play-columns);
		gap: var(--play-gap);
		min-height: 0;
		background: var(--ink);
	}

	.rg-results--standings,
	.rg-results--details {
		min-width: 0;
		min-height: 0;
		overflow-y: auto;
		background: var(--texture) var(--surface);
	}

	.rg-results--standings {
		padding: clamp(28px, 4vw, 64px) clamp(24px, 5vw, 88px) 42px;
	}

	.rg-results--head {
		margin-bottom: 29px;
	}

	.rg-results--head h1 {
		margin: 0;
		color: var(--gold);
		font: var(--weight-bold) clamp(32px, 3vw, 48px) / var(--leading-tight)
			var(--font-body);
	}

	.rg-results--head p {
		margin: 9px 0 0;
		color: var(--muted);
	}

	.rg-results--columns {
		display: grid;
		grid-template-columns: 63px minmax(0, 1fr) auto;
		gap: 18px;
		padding: 0 18px 9px;
		color: var(--muted);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}

	.rg-results--leaderboard {
		display: grid;
		gap: var(--space-4);
	}

	.rg-results--note {
		margin: 22px 0 0;
		padding-top: 15px;
		border-top: var(--border) solid var(--line);
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-results--details {
		display: flex;
		flex-direction: column;
		gap: 26px;
		padding: clamp(28px, 4vw, 64px) 30px 40px;
	}

	.rg-results--details h2 {
		margin: 0 0 9px;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
	}

	.rg-results--yours {
		padding: 19px 18px 21px;
		background: color-mix(
			in srgb,
			var(--rg-results-color) 16%,
			var(--raised)
		);
		box-shadow: inset 4px 0 var(--rg-results-color);
	}

	.rg-results--yours strong {
		display: block;
		margin-top: 10px;
		color: var(--gold);
		font: var(--weight-title) 42px / var(--leading-none) var(--font-title);
	}

	.rg-results--yours span {
		display: block;
		margin-top: var(--space-4);
		font-size: var(--font-size-xl);
		font-weight: var(--weight-bold);
	}

	.rg-results--yours p,
	.rg-results--quiet {
		margin: 9px 0 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-results--ties {
		display: grid;
		gap: var(--space-6);
	}

	.rg-results--facts {
		margin-top: auto;
		padding-top: 17px;
		border-top: var(--border) solid var(--line);
	}

	.rg-results--facts dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 7px var(--space-6);
		margin: 0;
		font-size: var(--font-size-sm);
	}

	.rg-results--facts dt {
		color: var(--muted);
	}

	.rg-results--facts dd {
		margin: 0;
		text-align: right;
	}

	.rg-results--badges {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--space-3);
	}

	.rg-results--footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 0 24px;
		border-top: var(--border) solid var(--line);
		background: var(--chrome);
	}

	.rg-results--actions {
		display: flex;
		gap: 9px;
	}
</style>
