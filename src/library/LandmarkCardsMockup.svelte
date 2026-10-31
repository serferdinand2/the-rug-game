<!-- The #32 mockup: Plans & Ploys' landmark cards in play, drawn with the production LandmarkCard and DecisionPanel over screenshots of the running game. -->
<script>
	import LandmarkCard from '../lib/components/player/LandmarkCard.svelte';
	import DecisionPanel from '../lib/components/prompts/DecisionPanel.svelte';
	import { FOOTPRINTS } from '../lib/art/footprints.js';
	import { artUrl } from '../lib/ui.js';

	/** Each P&P landmark card: its name and what completes "Gain this landmark when you …". */
	const CARDS = [
		{
			id: 'skyscraper',
			title: 'Skyscraper',
			condition:
				'have at least 1 complete row or column in your capital city.',
			goal: '1 complete row or column',
		},
		{
			id: 'tv-station',
			title: 'TV Station',
			condition:
				'have at least 3 income buildings of the same type in your capital city.',
			goal: '3 buildings of one type in your capital',
		},
		{
			id: 'urban-farm',
			title: 'Urban Farm',
			condition: 'have at least 6 territory tiles in your supply.',
			goal: '6 territory tiles in your supply',
		},
	];

	const BACKDROP = '/docs/ui/screens/issue-32';

	/** @type {number | null} */
	let kept = $state(null);
	/** @type {'a' | 'b'} */
	let place = $state('a');
	/** @type {'open' | 'met' | 'gained'} */
	let goal = $state('open');
	let shelfOnGoal = $state(true);
	let peek = $state(false);

	const STATUS = {
		open: 'Not met yet: no complete row or column so far',
		met: 'Met: you gain the Skyscraper at the end of this turn',
		gained: 'Gained: the Skyscraper is in your capital city',
	};
	const SHORT = {
		open: '0 of 1 so far',
		met: 'met: yours at the end of this turn',
		gained: 'gained',
	};
</script>

<main class="mk-page">
	<h1>
		Plans &amp; Ploys · <span>landmark cards in play</span> (#32)
	</h1>
	<p class="mk-lead">
		Three moments, over screenshots of the running game: the draft at the
		end of setup, where your kept card lives while you play, and the end of
		the turn its goal is met. The cards are the production <code
			>LandmarkCard</code
		>, with the goal written to finish its line "Gain this landmark when you
		…".
	</p>

	<section class="mk-step">
		<h2>1 · <span>The draft, as setup ends</span></h2>
		<p>
			At a 3-player table Cy goes first, so Ben, who goes last, draws 3
			landmark cards and keeps one; Ana keeps one of the other two, and Cy
			takes the last. The cards sit on the shelf above the panel, as every
			card choice does, and the panel says who gets the rest. Press a
			card, then Keep card. A player left with one card keeps it without
			being asked; the log says which.
		</p>
		<div class="mk-screen">
			<img
				src="{BACKDROP}/backdrop-civ.png"
				alt="" />
			<div class="mk-board">
				<DecisionPanel
					title="Keep a landmark card"
					status={kept === null
						? 'Press the card to keep. Ana keeps one of the other two, and Cy the last.'
						: `Keep ${CARDS[kept].title}: Ana and Cy share the other two.`}
					confirmLabel="Keep card"
					confirmDisabled={kept === null}>
					{#snippet shelf()}
						<div class="mk-shelf">
							{#each CARDS as card, index (card.id)}
								<button
									type="button"
									class="mk-shelf--card"
									class:mk-shelf--chosen={kept === index}
									aria-pressed={kept === index}
									onclick={() => (kept = index)}>
									<LandmarkCard
										title={card.title}
										artwork={artUrl(
											`landmark-card/${card.id}`
										)}
										footprint={FOOTPRINTS[card.id]}
										edition="pp"
										condition={card.condition} />
								</button>
							{/each}
						</div>
					{/snippet}
				</DecisionPanel>
			</div>
		</div>
	</section>

	<section class="mk-step">
		<h2>2 · <span>Your landmark card while you play</span></h2>
		<p>
			The card is public, as it lies face up beside the civilization mat,
			so the same place shows on another player's tabs. Pick where it
			lives:
		</p>
		<div class="mk-controls">
			<div class="mk-control">
				<b>Where</b>
				<button
					type="button"
					aria-pressed={place === 'a'}
					onclick={() => (place = 'a')}
					>A · Civ tab, under the civilization</button>
				<button
					type="button"
					aria-pressed={place === 'b'}
					onclick={() => (place = 'b')}
					>B · A line above your summary</button>
			</div>
			<div class="mk-control">
				<b>Goal</b>
				<button
					type="button"
					aria-pressed={goal === 'open'}
					onclick={() => (goal = 'open')}>Not met</button>
				<button
					type="button"
					aria-pressed={goal === 'met'}
					onclick={() => (goal = 'met')}>Met this turn</button>
				<button
					type="button"
					aria-pressed={goal === 'gained'}
					onclick={() => (goal = 'gained')}>Gained</button>
			</div>
		</div>
		<p class="mk-option-note">
			{#if place === 'a'}
				<b>A</b>: on the Civ tab, under the civilization card, as on the
				table: a line saying how far the goal is, then the card. Scroll
				the tab if a long civilization pushes it down.
			{:else}
				<b>B</b>: one line above your summary at the foot, always in
				sight whatever tab is open; point at it to see the whole card
				over the tracks.
			{/if}
		</p>
		<div class="mk-screen">
			<img
				src="{BACKDROP}/backdrop-civ.png"
				alt="" />
			{#if place === 'a'}
				<div class="mk-tab-body">
					<div class="mk-civ-extra">
						<h3>Landmark card</h3>
						<p
							class="mk-goal"
							class:mk-goal--met={goal !== 'open'}>
							{STATUS[goal]}
						</p>
						<div
							class="mk-card-wrap"
							class:mk-card-wrap--gained={goal === 'gained'}>
							<LandmarkCard
								title="Skyscraper"
								artwork={artUrl('landmark-card/skyscraper')}
								footprint={FOOTPRINTS.skyscraper}
								edition="pp"
								condition={CARDS[0].condition} />
							{#if goal === 'gained'}
								<span class="mk-stamp">Gained</span>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="mk-foot-line"
					class:mk-foot-line--met={goal !== 'open'}
					onmouseenter={() => (peek = true)}
					onmouseleave={() => (peek = false)}>
					<img
						src={artUrl('landmark/skyscraper')}
						alt="" />
					<span><b>Skyscraper</b> card · {CARDS[0].goal}</span>
					<em>{SHORT[goal]}</em>
				</div>
				{#if peek}
					<div class="mk-peek">
						<LandmarkCard
							title="Skyscraper"
							artwork={artUrl('landmark-card/skyscraper')}
							footprint={FOOTPRINTS.skyscraper}
							edition="pp"
							condition={CARDS[0].condition} />
					</div>
				{/if}
			{/if}
		</div>
	</section>

	<section class="mk-step">
		<h2>3 · <span>The goal met, at the end of your turn</span></h2>
		<p>
			With a complete row, the end of Cy's turn gives the Skyscraper: it
			waits in the tray on the Capital tab, as any gained landmark does,
			and the placing panel says why it came. Placing is mandatory; with
			no room it goes beside the mat (R14).
		</p>
		<div class="mk-controls">
			<div class="mk-control">
				<b>The card</b>
				<button
					type="button"
					aria-pressed={shelfOnGoal}
					onclick={() => (shelfOnGoal = true)}
					>Above the panel</button>
				<button
					type="button"
					aria-pressed={!shelfOnGoal}
					onclick={() => (shelfOnGoal = false)}>Words only</button>
			</div>
		</div>
		<div class="mk-screen">
			<img
				src="{BACKDROP}/backdrop-capital.png"
				alt="" />
			<div class="mk-board">
				{#snippet goalShelf()}
					<div class="mk-shelf">
						<div class="mk-shelf--card mk-shelf--chosen">
							<LandmarkCard
								title="Skyscraper"
								artwork={artUrl('landmark-card/skyscraper')}
								footprint={FOOTPRINTS.skyscraper}
								edition="pp"
								condition={CARDS[0].condition} />
						</div>
					</div>
				{/snippet}
				<DecisionPanel
					title="Where does the Skyscraper go?"
					status="Your Skyscraper card's goal is met: you have a complete row. Place the landmark in your capital: drag it, turn it with the , and . keys, then confirm."
					confirmLabel="Place"
					confirmDisabled
					shelf={shelfOnGoal ? goalShelf : undefined} />
			</div>
		</div>
	</section>
</main>

<style>
	.mk-page {
		display: grid;
		gap: var(--space-9);
		padding: var(--space-9) 40px 60px;
		background: var(--ink);
		color: var(--text);
	}

	h1 {
		margin: 0;
		font: var(--weight-bold) var(--font-size-3xl) / var(--leading-tight)
			var(--font-body);
	}

	h1 span,
	h2 span {
		color: var(--gold);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-xl);
	}

	.mk-lead,
	.mk-step > p,
	.mk-option-note {
		max-width: 1100px;
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-base);
		line-height: var(--leading-snug);
	}

	.mk-option-note b {
		color: var(--gold);
	}

	.mk-step {
		display: grid;
		gap: var(--space-6);
	}

	.mk-controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-9);
		padding: var(--space-6) var(--space-8);
		border: var(--border) solid var(--line-soft);
		background: var(--chrome);
	}

	.mk-control {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.mk-control b {
		margin-right: var(--space-2);
		color: var(--text);
	}

	.mk-control button {
		padding: var(--space-3) var(--space-6);
		border: var(--border) solid var(--line-strong);
		background: var(--control);
		color: var(--text);
		font: inherit;
		cursor: pointer;
	}

	.mk-control button[aria-pressed='true'] {
		border-color: var(--gold);
		background: var(--picked-fill);
		color: var(--gold);
	}

	/* One game screen at its real 1920 × 1080. */
	.mk-screen {
		position: relative;
		width: 1920px;
		height: 1080px;
		overflow: hidden;
	}

	.mk-screen > img {
		display: block;
		width: 1920px;
		height: 1080px;
	}

	/* The shared area, where the game puts a decision panel. */
	.mk-board {
		position: absolute;
		top: 58px;
		left: 0;
		width: 1440px;
		height: 964px;
	}

	.mk-shelf {
		display: flex;
		gap: var(--space-8);
		margin-bottom: var(--space-8);
	}

	.mk-shelf--card {
		padding: 0;
		border: 0;
		outline: 3px solid transparent;
		outline-offset: 3px;
		background: none;
		cursor: pointer;
	}

	.mk-shelf--chosen {
		outline-color: var(--gold);
	}

	/* The Civ tab's body, below the tab row and above the summary; it scrolls in the game. */
	.mk-tab-body {
		position: absolute;
		top: 96px;
		left: 1441px;
		width: 479px;
		height: 832px;
		overflow: hidden;
	}

	.mk-civ-extra {
		position: absolute;
		top: 566px;
		left: 22px;
		display: grid;
		gap: var(--space-4);
		width: 425px;
	}

	.mk-civ-extra h3 {
		margin: 0;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
	}

	.mk-goal {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.mk-goal--met {
		color: var(--ok);
	}

	.mk-card-wrap {
		position: relative;
		width: 319px;
	}

	.mk-card-wrap--gained {
		opacity: 0.75;
	}

	.mk-stamp {
		position: absolute;
		top: 60px;
		right: -20px;
		padding: var(--space-2) var(--space-6);
		border: var(--border-thick) solid var(--gold);
		background: var(--chrome);
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-sm) / 1 var(--font-body);
		transform: rotate(8deg);
	}

	.mk-foot-line {
		position: absolute;
		top: 892px;
		left: 1441px;
		display: flex;
		align-items: center;
		gap: var(--space-4);
		width: 479px;
		height: 36px;
		padding: 0 var(--space-8);
		border-top: var(--border) solid var(--line-soft);
		background: var(--chrome);
		color: var(--muted);
		font-size: var(--font-size-sm);
		cursor: default;
	}

	.mk-foot-line img {
		width: 24px;
		height: 24px;
		image-rendering: pixelated;
	}

	.mk-foot-line b {
		color: var(--gold);
		font-family: var(--font-title);
	}

	.mk-foot-line em {
		margin-left: auto;
		font-style: normal;
	}

	.mk-foot-line--met em {
		color: var(--ok);
	}

	.mk-peek {
		position: absolute;
		right: 500px;
		bottom: 60px;
		box-shadow: var(--shadow-float);
	}
</style>
