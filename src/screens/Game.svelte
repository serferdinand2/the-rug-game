<!-- The play screen (#26 design): the header with the players, the shared board (tracks or map), the player area with Your overview, the footer turn and the decision panel. -->
<script module>
	/**
	 * Properties of the Game screen itself.
	 * @typedef {Object} GameOwnProps
	 * @property {import('../lib/game.svelte.js').GameStore} store - Its room holds the game on show
	 * @property {Function} [onGameHelp] - Callback fired when How to play is chosen
	 * @property {Function} [onGameResults] - Callback fired when Results is chosen, once the game is over (#29)
	 */

	/**
	 * Properties for Game, including any attributes for its root element.
	 * @typedef {GameOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} GameProps
	 *
	 * @example
	 * <Game {store} onGameHelp={() => (helpOpen = true)} />
	 */
</script>

<script>
	import { untrack } from 'svelte';
	import BoardSwitcher from '../lib/components/board/BoardSwitcher.svelte';
	import AchievementStrip from '../lib/components/board/AchievementStrip.svelte';
	import TrackBoard from '../lib/components/board/TrackBoard.svelte';
	import WorldMap from '../lib/components/board/WorldMap.svelte';
	import PlayerChip from '../lib/components/player/PlayerChip.svelte';
	import SelfSummary from '../lib/components/player/SelfSummary.svelte';
	import DecisionOption from '../lib/components/prompts/DecisionOption.svelte';
	import DecisionPanel from '../lib/components/prompts/DecisionPanel.svelte';
	import CardShelf from '../lib/components/prompts/CardShelf.svelte';
	import CostBox from '../lib/components/prompts/CostBox.svelte';
	import IncomeSteps from '../lib/components/prompts/IncomeSteps.svelte';
	import TilePicker from '../lib/components/prompts/TilePicker.svelte';
	import TurnBar from '../lib/components/prompts/TurnBar.svelte';
	import TurnControl from '../lib/components/prompts/TurnControl.svelte';
	import Button from '../lib/components/ui/Button.svelte';
	import IconButton from '../lib/components/ui/IconButton.svelte';
	import TurnClock from '../lib/components/ui/TurnClock.svelte';
	import PageHeader from './PageHeader.svelte';
	import PlayerTabs from './game/PlayerTabs.svelte';
	import PlayersOverview from './game/PlayersOverview.svelte';
	import LogPanel from './game/LogPanel.svelte';
	import TableSettings from './game/TableSettings.svelte';
	import { eventText } from '../lib/log.js';
	import { highlights } from '../lib/motion.js';
	import { isHost } from '../lib/lobby.js';
	import OverviewCloseBar from '../lib/components/prompts/OverviewCloseBar.svelte';
	import TapestryCard from '../lib/components/player/TapestryCard.svelte';
	import TechnologyCard from '../lib/components/player/TechnologyCard.svelte';
	import { tabFor } from '../lib/area/tabs.js';
	import { achievements, trackBoard } from '../lib/board.js';
	import { formatClock, timeLeft } from '../lib/clock.js';
	import {
		civilizationName,
		describeBonus,
		describeEffects,
		describePayment,
	} from '../lib/describe.js';
	import { mapHexes } from '../lib/hexmap.js';
	import { promptFor } from '../lib/prompts.js';
	import {
		exploreIndex,
		exploreLine,
		exploreTiles,
		hexScores,
		tilePreview,
		tileScores,
		tileWords,
	} from '../lib/area/explore.js';
	import { terrainSeed } from '../lib/area/capital.js';
	import { tapestryCardData, techCardData } from '../lib/cards/game-cards.js';
	import { selfSummary } from '../lib/overview.js';
	import {
		advanceOptions,
		decisionTurnHeading,
		myDecision,
	} from '../lib/turn.js';
	import { askedSeats, bonusOf, matchingSides } from '../lib/engine/game.js';
	import { TRACKS } from '../lib/engine/data/tracks.js';
	import { playerColor } from '../lib/ui.js';

	/** @typedef {import('../lib/component-event.js').ComponentEvent} ComponentEvent */
	/** @typedef {import('../lib/ui.js').TrackId} TrackId */

	/** @type {GameProps} */
	let { store, onGameHelp, onGameResults, ...attr } = $props();

	let room = $derived(store.room);
	let game = $derived(room.game);
	let seat = $derived(store.seat);
	let mine = $derived(myDecision(game, seat));
	let options = $derived(advanceOptions(game, seat));
	let available = $derived(
		options.map((o) => ({ track: o.track, space: o.to }))
	);
	let summary = $derived(selfSummary(game, seat));
	let players = $derived(
		game.seats.filter((/** @type {any} */ s) => s.kind === 'player')
	);

	let board = $state(/** @type {'tracks' | 'map'} */ ('tracks'));
	/** @type {{ track: TrackId, space: number } | null} */
	let selected = $state(null);
	/** Whether the payment choice for the selected advance is open. */
	let paying = $state(false);
	/** @type {number | null} */
	let payIndex = $state(null);
	/** @type {number | null} The plain prompt's chosen answer, by index */
	let picked = $state(null);
	/** @type {string | null} The hex chosen for a map decision */
	let mapPick = $state(null);
	/** @type {number | null} The tile chosen for an explore (#74) */
	let exploreTile = $state(null);
	/** The explore's turn on the chosen hex, 0-5 (#74). */
	let exploreOrient = $state(0);
	let sending = $state(false);
	/** The player tab on show (#27). */
	let tab = $state('capital');
	/** @type {{ kind: 'tech' | 'tapestry', data: any, side?: boolean } | null} A card shown in full over the shared area; beside the shelf, without a scrim, for a shelf card */
	let inspected = $state(null);
	/** Whether the players overview is open (#27). */
	let overviewOpen = $state(false);
	/** The log and scores panel (#29): open, its tab, and a dot for entries it hasn't shown yet. */
	let logOpen = $state(false);
	let logTab = $state(/** @type {'log' | 'scores'} */ ('log'));
	let logUnread = $state(false);
	/** The host's table settings during a game (#29 design §9). */
	let settingsOpen = $state(false);

	/** @type {import('../lib/motion.js').Highlights} */
	const STILL = { hexes: [], plots: [], landmarks: [], vp: [] };
	/** What moves for the latest fresh events (#29 design §8), for a moment. */
	let moved = $state(STILL);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let movedTimer;
	let movedFrame = 0;
	/** The batch of fresh events handled last: one that arrived before this screen opened is not played again. */
	let handled = untrack(() => store.freshCount);

	$effect(() => {
		const count = store.freshCount;
		if (count === handled) {
			return;
		}
		handled = count;
		untrack(() => {
			const events = store.fresh;
			if (!logOpen && events.some((e) => eventText(e, game) !== null)) {
				logUnread = true;
			}
			if (
				window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
			) {
				return;
			}
			const next = highlights(events, seat);
			// The last highlights go first, for a frame, so a hex or chip that changes again moves again.
			moved = STILL;
			clearTimeout(movedTimer);
			cancelAnimationFrame(movedFrame);
			movedFrame = requestAnimationFrame(() => {
				movedFrame = requestAnimationFrame(() => {
					moved = next;
					movedTimer = setTimeout(() => (moved = STILL), 2000);
				});
			});
		});
	});
	$effect(() => () => {
		clearTimeout(movedTimer);
		cancelAnimationFrame(movedFrame);
	});

	/** The selected space's advance, if the viewer can take it now. */
	let chosenAdvance = $derived(
		selected
			? (options.find(
					(o) =>
						o.track === selected?.track && o.to === selected?.space
				) ?? null)
			: null
	);
	let turnDecision = $derived(
		mine && (mine.kind === 'chooseTurn' || mine.kind === 'chooseAdvance')
			? mine
			: null
	);
	let promptDecision = $derived(mine && !turnDecision ? mine : null);
	/** The designed prompt for the decision (#28): its words, art, layout and one option per answer. */
	let prompt = $derived(promptFor(promptDecision, game, seat));
	let isMapDecision = $derived(prompt?.layout === 'map');
	/** The hexes lit on the map, whatever leads: a Nomads placement lights hexes beside the capital (#28 review). */
	let mapTargets = $derived(prompt?.mapHexes ?? []);
	/** The panel docks beside the map while the map shows hexes to choose, so they stay clickable. */
	let docked = $derived(mapTargets.length > 0 && board === 'map');
	/** The viewer's explore (#74): they choose a tile, a lit hex and a turn, and Confirm sends that one answer. */
	let exploring = $derived(
		prompt?.kind === 'chooseExplore' ? promptDecision : null
	);
	/** The tiles the explore offers, lowest first: under Coal Baron only its tile, not the whole hand. */
	let offeredTiles = $derived(exploring ? exploreTiles(exploring) : []);
	/** Each offered tile's best VP and turn on the chosen hex. */
	let tileBest = $derived(
		exploring && mapPick ? tileScores(game, exploring, mapPick) : {}
	);
	/** The chosen tile's best VP and turn on every lit hex. */
	let hexBest = $derived(
		exploring && exploreTile !== null
			? hexScores(game, exploring, exploreTile)
			: {}
	);
	/** The panel's tile row, each tile with its best VP on the chosen hex once there is one. */
	let exploreRow = $derived(
		offeredTiles.map((id) => {
			const best = tileBest[id];
			return {
				id,
				label: tileWords(id),
				...tilePreview(id, 0),
				vp: best && best.vp >= 0 ? best.vp : null,
			};
		})
	);
	/** What the chosen tile scores on the chosen hex in the chosen turn. */
	let exploreCurrent = $derived(
		exploring && exploreTile !== null && mapPick
			? matchingSides(game, mapPick, exploreTile, exploreOrient)
			: null
	);
	/** The VP tags on the lit hexes: the chosen tile's best on each, and the current turn's on the chosen hex. */
	let mapScores = $derived.by(() => {
		/** @type {Record<string, number>} */
		const scores = {};
		for (const [hex, best] of Object.entries(hexBest)) {
			scores[hex] = best.vp;
		}
		if (mapPick && exploreCurrent !== null) {
			scores[mapPick] = exploreCurrent;
		}
		return scores;
	});
	/** What is chosen so far: the panel's one line naming the hex and turn (the status line stays empty). */
	let exploreChosen = $derived(
		mapPick && exploreTile !== null
			? exploreLine(mapPick, exploreOrient)
			: exploreTile !== null
				? 'Now pick a lit hex: each shows the best this tile scores there.'
				: 'Pick a tile, or a lit hex on the map.'
	);
	/** What the panel lists: its own options, and on the map those of the chosen hex. An explore lists none. */
	let panelOptions = $derived(
		!prompt || exploring
			? []
			: prompt.options
					.filter(
						(o) =>
							o.place === 'panel' ||
							(o.place === 'map' && o.hex === mapPick)
					)
					.map((o) => ({ ...o, vp: null }))
	);
	/** The cards on the shelf above the panel, for a card decision. */
	let shelfCards = $derived(
		prompt?.shelf && promptDecision
			? prompt.options
					.filter((o) => o.place === 'shelf')
					.map((o) => {
						const answer = promptDecision.answers[o.index];
						const art = o.art[0];
						return {
							index: o.index,
							id: String(
								answer.card ?? answer.civ ?? answer.capital
							),
							label: o.label,
							deck: art?.kind === 'deck' ? art.count : undefined,
						};
					})
			: []
	);
	/** The chosen tile in the chosen turn, drawn on the chosen hex. */
	let preview = $derived(
		exploring && exploreTile !== null && mapPick
			? { hex: mapPick, ...tilePreview(exploreTile, exploreOrient) }
			: null
	);
	/** A building or landmark to place on the capital, from the Capital tab. */
	let placement = $derived(
		prompt &&
			promptDecision &&
			prompt.options.some((o) => o.place === 'capital')
			? {
					piece: promptDecision.landmark
						? { landmark: promptDecision.landmark }
						: { building: promptDecision.building },
					options: prompt.options.filter(
						(o) => o.place === 'capital'
					),
					picked,
				}
			: null
	);
	let incomeStepLabel = $derived(
		prompt?.income?.steps.find(
			(step) => step.id === prompt?.income?.current
		)?.label ?? null
	);
	/** The chosen payment, while it is still one of the selected advance's. */
	let validPay = $derived(
		chosenAdvance &&
			payIndex !== null &&
			payIndex < chosenAdvance.payments.length
			? payIndex
			: null
	);

	// The turn's own choices end with it, however it ends: a timeout, an undo, a refused move (#26 review).
	let turnKey = $derived(turnDecision ? turnDecision.id : null);
	$effect(() => {
		turnKey;
		if (!untrack(() => sending)) {
			selected = null;
			paying = false;
			payIndex = null;
		}
	});

	// A card shown in full goes when what it was shown from may have gone: another tab, seat or decision (#27 review).
	$effect(() => {
		tab;
		seat;
		decisionKey;
		inspected = null;
	});

	// A decision about a tab's things opens that tab (#27 design §5).
	$effect(() => {
		decisionKey;
		const wanted = untrack(() => tabFor(mine));
		if (wanted) {
			tab = wanted;
		}
	});

	// A new decision starts with nothing chosen, and a map decision opens the map. An explore offering one tile
	// (Coal Baron's, or the last in hand) starts with it picked, so the player sees what they place (#74).
	let decisionKey = $derived(mine ? `${mine.id}` : '');
	$effect(() => {
		decisionKey;
		picked = null;
		mapPick = null;
		exploreOrient = 0;
		const tiles = untrack(() => offeredTiles);
		exploreTile = tiles.length === 1 ? tiles[0] : null;
		if (isMapDecision) {
			board = 'map';
		}
	});

	// The turn clock: the running one, the viewer's own first; a paused one only when none runs (spec §4).
	let now = $state(Date.now());
	$effect(() => {
		const timer = setInterval(() => {
			now = Date.now();
		}, 250);
		return () => clearInterval(timer);
	});
	let clock = $derived(
		room.clocks.find(
			(/** @type {any} */ c) => c.seat === seat && c.ends !== undefined
		) ??
			room.clocks.find((/** @type {any} */ c) => c.ends !== undefined) ??
			room.clocks.find((/** @type {any} */ c) => c.seat === seat) ??
			room.clocks[0] ??
			null
	);
	let clockMs = $derived(
		clock ? timeLeft(clock, room.now, store.receivedAt, now) : 0
	);

	let currentSeat = $derived(
		game.current === null ? null : game.seats[game.current - 1]
	);

	/**
	 * The words for the selected space: its benefit, and its bonus when it has one.
	 * @param {TrackId} track
	 * @param {number} space
	 */
	function spaceWords(track, space) {
		const benefit = describeEffects(TRACKS[track][space].benefit, {
			state: game,
		});
		const bonus = bonusOf(game, track, space);
		return bonus
			? `${benefit}. Bonus: ${describeBonus(bonus, { state: game })}.`
			: `${benefit}.`;
	}

	/**
	 * The tier price as symbols, for the footer.
	 * @param {TrackId} track
	 * @param {number} space
	 * @returns {import('../lib/ui.js').CostSymbol[]}
	 */
	function priceSymbols(track, space) {
		const tier = trackBoard(game).find((t) => t.id === track)?.tiers[
			Math.ceil(space / 3) - 1
		];
		return tier ?? [];
	}

	/**
	 * A payment's resources as symbols, one per unit.
	 * @param {Record<string, any>} pay
	 * @returns {import('../lib/ui.js').CostSymbol[]}
	 */
	function paySymbols(pay) {
		return /** @type {import('../lib/ui.js').CostSymbol[]} */ (
			['coin', 'worker', 'food', 'culture'].flatMap((r) =>
				Array(typeof pay[r] === 'number' ? pay[r] : 0).fill(r)
			)
		);
	}

	/**
	 * @param {ComponentEvent} event
	 */
	const trackSelectHandler = (event) => {
		selected = event.value;
		paying = false;
		payIndex = null;
	};

	/** Takes an income turn. */
	const incomeHandler = async () => {
		if (!turnDecision || turnDecision.kind !== 'chooseTurn' || sending) {
			return;
		}
		sending = true;
		await store.move({ decision: turnDecision.id, turn: 'income' });
		selected = null;
		sending = false;
	};

	/** Advances on the selected space, asking for the payment first when there is a choice. */
	const advanceHandler = async () => {
		const option = chosenAdvance;
		if (!option || !turnDecision || sending) {
			return;
		}
		if (option.payments.length > 1 && validPay === null) {
			paying = true;
			return;
		}
		const pay = option.payments[validPay ?? 0];
		sending = true;
		if (turnDecision.kind === 'chooseTurn') {
			const ok = await store.move({
				decision: turnDecision.id,
				turn: 'advance',
			});
			if (!ok) {
				sending = false;
				return;
			}
		}
		const next = myDecision(store.room.game, store.seat);
		if (next?.kind === 'chooseAdvance') {
			await store.move({
				decision: next.id,
				track: option.track,
				from: option.from,
				pay,
			});
		}
		selected = null;
		paying = false;
		payIndex = null;
		sending = false;
	};

	/** Sends the prompt's chosen answer. */
	const promptConfirmHandler = async () => {
		if (!promptDecision || picked === null || sending) {
			return;
		}
		sending = true;
		await store.move({
			decision: promptDecision.id,
			...promptDecision.answers[picked],
		});
		sending = false;
	};

	/** Points the pick at the explore's tile, hex and turn, so Confirm sends that answer. */
	function pickExplore() {
		const index =
			exploring && exploreTile !== null && mapPick
				? exploreIndex(exploring, {
						tile: exploreTile,
						hex: mapPick,
						orient: exploreOrient,
					})
				: -1;
		picked = index === -1 ? null : index;
	}

	/**
	 * A lit hex chosen. An explore keeps its tile, or takes the first one offered, at its best turn there (#74).
	 * Nothing changes while a move is being sent.
	 * @param {ComponentEvent} event
	 */
	const mapSelectHandler = (event) => {
		if (sending || event.value.hex === mapPick) {
			return;
		}
		mapPick = event.value.hex;
		if (exploring) {
			if (exploreTile === null) {
				exploreTile = offeredTiles[0] ?? null;
			}
			exploreOrient =
				exploreTile === null ? 0 : (tileBest[exploreTile]?.orient ?? 0);
			pickExplore();
			return;
		}
		const here = (prompt?.options ?? []).filter((o) => o.hex === mapPick);
		picked = here.length === 1 ? here[0].index : null;
	};

	/**
	 * A tile chosen for the explore: on a chosen hex it goes to its best turn there. The picked tile again does nothing,
	 * and nothing changes while the explore is being sent.
	 * @param {ComponentEvent} event
	 */
	const tilePickHandler = (event) => {
		const tile = event.value.tile;
		if (sending || tile === exploreTile || !offeredTiles.includes(tile)) {
			return;
		}
		exploreTile = tile;
		if (mapPick) {
			exploreOrient = tileBest[tile]?.orient ?? 0;
		}
		pickExplore();
	};

	/**
	 * Turns the explore's tile one step: 1 forward, -1 back, through all 6 turns; not while the explore is being sent.
	 * @param {number} step
	 */
	function turnTile(step) {
		if (sending || !exploring || exploreTile === null || !mapPick) {
			return;
		}
		exploreOrient = (exploreOrient + step + 6) % 6;
		pickExplore();
	}

	/**
	 * @param {ComponentEvent} event
	 */
	const turnHandler = (event) => {
		turnTile(event.value.step);
	};

	/**
	 * A shelf card hovered or focused shows in full over the shared area; a civilization or a mat is already whole.
	 * @param {ComponentEvent} event
	 */
	const shelfInspectHandler = (event) => {
		const card = shelfCards.find((c) => c.index === event.value);
		if (!card || card.id === 'deck') {
			inspected = null;
		} else if (prompt?.shelf === 'tapestry') {
			inspected = {
				kind: 'tapestry',
				data: tapestryCardData(card.id),
				side: true,
			};
		} else if (prompt?.shelf === 'tech') {
			inspected = {
				kind: 'tech',
				data: techCardData(card.id),
				side: true,
			};
		} else {
			inspected = null;
		}
	};

	/**
	 * A place chosen on the Capital tab, or none when a landmark goes back to the tray; the piece's own confirm sends it.
	 * @param {ComponentEvent} event
	 */
	const placeHandler = (event) => {
		picked = event.value.index;
		if (event.value.confirm && picked !== null) {
			promptConfirmHandler();
		}
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const menuHandler = (event) => {
		if (event.value === 'leave') {
			store.leaveTable();
		} else if (event.value === 'settings') {
			// One Escape closes one thing, so the settings open alone.
			logOpen = false;
			overviewOpen = false;
			settingsOpen = true;
		} else if (typeof onGameHelp === 'function') {
			onGameHelp(event);
		}
	};

	const logToggleHandler = () => {
		logOpen = !logOpen;
		logUnread = false;
	};

	/**
	 * Escape closes the players overview (#27 review). R turns the explore's tile, Shift+R back (#74), unless the
	 * player is typing, holds a browser shortcut's key, or has something else open over the board.
	 * @param {KeyboardEvent} event
	 */
	const keyHandler = (event) => {
		if (event.key === 'Escape' && overviewOpen) {
			overviewOpen = false;
			return;
		}
		const target = /** @type {HTMLElement | null} */ (event.target);
		if (
			(event.key !== 'r' && event.key !== 'R') ||
			event.ctrlKey ||
			event.altKey ||
			event.metaKey ||
			target?.matches?.('input, textarea, select') ||
			target?.isContentEditable ||
			overviewOpen ||
			settingsOpen ||
			// How to play, opened over the whole screen by App.
			document.querySelector('[aria-modal="true"]') ||
			!exploring ||
			exploreTile === null ||
			!mapPick
		) {
			return;
		}
		event.preventDefault();
		turnTile(event.shiftKey ? -1 : 1);
	};

	/** @param {number} seatNumber */
	function nameOf(seatNumber) {
		return game.seats[seatNumber - 1]?.name ?? `Seat ${seatNumber}`;
	}

	let asked = $derived(askedSeats(game));
</script>

<svelte:window onkeydown={keyHandler} />

{#snippet incomeSteps()}
	{#if prompt?.income}
		<IncomeSteps
			steps={prompt.income.steps}
			current={prompt.income.current} />
	{/if}
{/snippet}

<!-- The prompt's cost and its own options; a prompt without them (cards on the shelf, plots, hexes) has no content
     area, and its status line gives the instruction, so the shelf has more room (#57). -->
{#snippet promptContent()}
	{#if exploring}
		<div class="rg-game--explore">
			<p class="rg-game--lead">
				Pick one of your tiles and a lit hex, then turn the tile until
				you like it.
			</p>
			<p class="rg-game--label">Your tiles · {offeredTiles.length}</p>
			<TilePicker
				tiles={exploreRow}
				selected={exploreTile}
				onTilePickerSelect={tilePickHandler} />
		</div>
	{/if}
	{#if prompt?.cost}
		<CostBox
			class="rg-game--cost"
			symbols={prompt.cost}
			track={prompt.track ?? undefined} />
	{/if}
	{#if panelOptions.length}
		<div class="rg-game--options">
			{#each panelOptions as option (option.index)}
				<DecisionOption
					label={option.label}
					art={option.art}
					vp={option.vp}
					pressed={picked === option.index}
					onDecisionOptionClick={() => (picked = option.index)} />
			{/each}
		</div>
	{/if}
{/snippet}

<!-- An explore's chosen hex and turn, and the control that turns the tile, kept in sight while the tiles scroll
     (#74). The line is the one place that names them; it is announced with the VP the turn scores. -->
{#snippet explorePinned()}
	<div class="rg-game--explore">
		<p
			class="rg-game--chosen"
			role="status">
			{exploreChosen}{#if exploreCurrent !== null}<span
					class="rg-game--spoken">, {exploreCurrent} VP</span
				>{/if}
		</p>
		<TurnControl
			vp={exploreCurrent}
			onTurnControlTurn={turnHandler} />
	</div>
{/snippet}

{#snippet cardShelf()}
	{#if prompt?.shelf}
		<CardShelf
			kind={prompt.shelf}
			cards={shelfCards}
			selected={picked}
			terrainSeed={terrainSeed(room.code)}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				(picked = event.value)}
			onCardShelfInspect={shelfInspectHandler} />
	{/if}
{/snippet}

<div
	{...attr}
	class="rg-game {attr.class ? attr.class : ''}">
	<PageHeader
		sound={store.sound}
		items={[
			{ id: 'help', label: 'How to play' },
			...(isHost(room)
				? [{ id: 'settings', label: 'Table settings' }]
				: []),
			{ id: 'leave', label: 'Leave table' },
		]}
		onPageHeaderSound={(/** @type {any} */ event) =>
			store.setSound(event.value)}
		onPageHeaderMenu={menuHandler}>
		{#snippet center()}
			{#each players as player (player.seat)}
				<PlayerChip
					name={player.name}
					civilization={player.civs.length
						? civilizationName(player.civs[0])
						: 'Setting up'}
					vp={player.vp}
					seat={player.seat}
					current={game.current === player.seat}
					filled={overviewOpen}
					bump={moved.vp.includes(player.seat)}
					onPlayerChipClick={() => (overviewOpen = !overviewOpen)} />
			{/each}
		{/snippet}
		{#snippet before()}
			{#if clock}
				<TurnClock
					seat={clock.seat}
					ms={clockMs}
					running={clock.ends !== undefined && !clock.expired}
					warn={clock.seat === seat &&
						clock.ends !== undefined &&
						clockMs <= 5000}
					title="{nameOf(clock.seat)}: {formatClock(clockMs)}" />
			{/if}
			<IconButton
				icon="history"
				label="Undo"
				disabled={!room.canUndo}
				onIconButtonClick={() => store.undo()} />
			<span class="rg-game--log-button">
				<IconButton
					icon="log"
					label="Log and scores"
					expanded={logOpen}
					onIconButtonClick={logToggleHandler} />
				{#if logUnread}
					<i
						class="rg-game--unread"
						title="New entries"></i>
				{/if}
			</span>
		{/snippet}
	</PageHeader>

	<div class="rg-game--middle">
		<section
			class="rg-game--shared"
			aria-label="Shared board"
			inert={overviewOpen}>
			<div class="rg-game--head">
				<BoardSwitcher bind:value={board} />
				<AchievementStrip achievements={achievements(game)} />
			</div>
			<div
				class="rg-game--board"
				class:rg-game--board-docked={docked}>
				{#if board === 'tracks'}
					<TrackBoard
						tracks={trackBoard(game)}
						{available}
						{selected}
						onTrackBoardSelect={trackSelectHandler} />
				{:else}
					<WorldMap
						hexes={mapHexes(game)}
						targets={mapTargets}
						selected={mapPick}
						scores={mapScores}
						{preview}
						fresh={moved.hexes}
						onWorldMapSelect={mapSelectHandler} />
				{/if}
			</div>
			{#if paying && chosenAdvance && selected}
				<DecisionPanel
					title="How do you pay for {TRACKS[selected.track][
						selected.space
					].name}?"
					status={validPay === null
						? 'Choose a payment to continue.'
						: describePayment(chosenAdvance.payments[validPay])}
					track={selected.track}
					confirmLabel="Advance"
					confirmDisabled={validPay === null || sending}
					cancelLabel="Cancel"
					onDecisionPanelConfirm={advanceHandler}
					onDecisionPanelCancel={() => {
						paying = false;
						payIndex = null;
					}}>
					<CostBox
						class="rg-game--cost"
						symbols={priceSymbols(selected.track, selected.space)}
						track={selected.track} />
					<div class="rg-game--options">
						{#each chosenAdvance.payments as pay, index (index)}
							<DecisionOption
								label={describePayment(pay)}
								symbols={paySymbols(pay)}
								pressed={validPay === index}
								onDecisionOptionClick={() =>
									(payIndex = index)} />
						{/each}
					</div>
				</DecisionPanel>
			{:else if prompt}
				<DecisionPanel
					{docked}
					title={prompt.title}
					track={prompt.track}
					tone={prompt.income ? 'income' : 'default'}
					steps={prompt.income ? incomeSteps : undefined}
					shelf={shelfCards.length ? cardShelf : undefined}
					status={exploring
						? ''
						: picked !== null
							? (prompt.options[picked]?.label ?? '')
							: prompt.instruction}
					children={exploring || prompt.cost || panelOptions.length
						? promptContent
						: undefined}
					pinned={exploring ? explorePinned : undefined}
					confirmLabel={prompt.confirmLabel}
					confirmDisabled={picked === null || sending}
					cancelLabel={docked && mapPick && !exploring
						? 'Choose another territory'
						: undefined}
					onDecisionPanelConfirm={promptConfirmHandler}
					onDecisionPanelCancel={() => {
						mapPick = null;
						picked = null;
					}} />
			{/if}
			{#if inspected}
				<div
					class="rg-game--inspect"
					class:rg-game--inspect-side={inspected.side}
					aria-hidden="true">
					{#if inspected.kind === 'tech'}
						<TechnologyCard data={inspected.data} />
					{:else}
						<TapestryCard data={inspected.data} />
					{/if}
				</div>
			{/if}
		</section>

		<aside
			class="rg-game--private"
			aria-label="Your player area"
			inert={overviewOpen}>
			{#if seat !== null && summary}
				<PlayerTabs
					{game}
					{seat}
					code={room.code}
					bind:tab
					{placement}
					fresh={{ plots: moved.plots, landmarks: moved.landmarks }}
					onPlayerTabsPlace={placeHandler}
					tilePick={exploring
						? { tiles: offeredTiles, selected: exploreTile }
						: null}
					onPlayerTabsPick={tilePickHandler}
					onPlayerTabsInspect={(
						/** @type {ComponentEvent} */ event
					) => (inspected = event.value)} />
			{:else}
				<p class="rg-game--soon">
					Hands stay hidden at a shared screen. Open a player's chip
					to see their capital, civilization and tech.
				</p>
			{/if}
			{#if summary}
				<SelfSummary {...summary} />
			{/if}
		</aside>
		{#if overviewOpen}
			<PlayersOverview
				{game}
				{seat}
				host={room.host}
				code={room.code} />
		{/if}
		{#if logOpen && !overviewOpen}
			<LogPanel
				{game}
				{seat}
				bind:tab={logTab}
				onLogPanelClose={() => (logOpen = false)} />
		{/if}
		{#if settingsOpen}
			<TableSettings
				{store}
				onTableSettingsClose={() => (settingsOpen = false)} />
		{/if}
	</div>

	{#if overviewOpen}
		<OverviewCloseBar
			onOverviewCloseBarClick={() => (overviewOpen = false)} />
	{:else if game.phase === 'over'}
		<TurnBar
			tone="neutral"
			label="Game complete"
			heading="The game is complete."
			detail="The board as the game ended.">
			{#snippet actions()}
				<Button
					mode="gold"
					onButtonClick={(/** @type {ComponentEvent} */ event) =>
						onGameResults?.(event)}>Results</Button>
			{/snippet}
		</TurnBar>
	{:else if turnDecision && selected}
		<TurnBar
			tone="selected"
			heading="Advance to"
			properName={TRACKS[selected.track][selected.space].name}
			track={selected.track}
			detail={spaceWords(selected.track, selected.space)}
			cost={priceSymbols(selected.track, selected.space)}
			income={turnDecision.kind === 'chooseTurn'
				? {
						description:
							'End this era, gain income and begin your next era.',
						label: 'Take income',
					}
				: null}
			onTurnBarIncome={incomeHandler}>
			{#snippet actions()}
				<Button
					mode="primary"
					disabled={!chosenAdvance || sending}
					title={chosenAdvance
						? undefined
						: "You can't advance there now."}
					onButtonClick={advanceHandler}>Advance</Button>
			{/snippet}
		</TurnBar>
	{:else if turnDecision}
		<TurnBar
			tone="neutral"
			heading={available.length
				? 'Choose a space to advance to, or take income.'
				: 'Take an income turn.'}
			detail={available.length
				? 'The spaces you can pay for are outlined in green.'
				: undefined}
			income={turnDecision.kind === 'chooseTurn'
				? {
						description:
							'End this era, gain income and begin your next era.',
						label: 'Take income',
					}
				: null}
			onTurnBarIncome={incomeHandler} />
	{:else if prompt?.income}
		<TurnBar
			tone="income"
			label="Your income turn"
			heading="Income turn {prompt.income.turn}{incomeStepLabel
				? ` · ${incomeStepLabel}`
				: ''}" />
	{:else if promptDecision}
		<TurnBar
			tone="neutral"
			label="Your decision"
			heading={decisionTurnHeading(game, seat)} />
	{:else if game.phase === 'setup'}
		<TurnBar
			tone="waiting"
			label="Setting up"
			heading="Waiting for the others to choose." />
	{:else if currentSeat}
		<TurnBar
			tone="waiting"
			label={asked.length && !asked.includes(currentSeat.seat)
				? `Waiting for ${nameOf(asked[0])}`
				: `${currentSeat.name}’s turn`}
			labelColor={playerColor(
				asked.length && !asked.includes(currentSeat.seat)
					? asked[0]
					: currentSeat.seat
			)}
			heading={asked.length && !asked.includes(currentSeat.seat)
				? `${nameOf(asked[0])} is deciding.`
				: `${currentSeat.name} is taking their turn.`} />
	{/if}
</div>

<style>
	.rg-game {
		display: grid;
		grid-template-rows: var(--bar-height) minmax(0, 1fr) var(--bar-height);
		height: 100vh;
		min-height: 0;
		overflow: hidden;
	}

	.rg-game--middle {
		position: relative;
		display: grid;
		grid-template-columns: var(--play-columns);
		gap: var(--play-gap);
		min-height: 0;
		background: var(--ink);
	}

	.rg-game--shared,
	.rg-game--private {
		min-width: 0;
		min-height: 0;
		background: var(--texture) var(--surface);
	}

	.rg-game--shared {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 14px var(--space-9) var(--space-6) var(--space-10);
		overflow: hidden;
	}

	.rg-game--head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-9);
		margin-bottom: var(--space-5);
	}

	.rg-game--board {
		flex: 1;
		min-height: 0;
	}

	/* While a panel is docked at the right, the board leaves the panel's width and inset free, so the map lays itself
	   out beside the panel, this area's right padding apart, and no hex lies under it (#74). */
	.rg-game--board-docked {
		margin-right: calc(
			var(--docked-panel-width) + var(--docked-panel-inset)
		);
	}

	/* The column, not its widest content, sets the width, so the tabs, capital and counters fit inside it (#64). */
	.rg-game--private {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr) auto;
		overflow: hidden;
	}

	/* A card shown in full over the shared area, as the mockup's card overview: a scrim, the card, no pointer. */
	.rg-game--inspect {
		position: absolute;
		z-index: var(--layer-popover);
		inset: 0;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, var(--ink) 52%, transparent);
		pointer-events: none;
	}

	/* The log button carries a gold dot while the log has entries the viewer hasn't seen. */
	.rg-game--log-button {
		position: relative;
		display: inline-flex;
	}

	.rg-game--unread {
		position: absolute;
		top: 5px;
		right: 5px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--gold);
		box-shadow: 0 0 0 var(--border) var(--chrome);
		pointer-events: none;
	}

	.rg-game--soon {
		margin: 0;
		padding: var(--space-9) 22px;
		color: var(--muted);
	}

	.rg-game--options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		max-height: 340px;
		overflow: auto;
	}

	/* The explore's content (#74): the lead and the tile row, then (pinned) what is chosen and the turn control. */
	.rg-game--explore {
		display: grid;
		gap: var(--space-6);
	}

	.rg-game--lead,
	.rg-game--label,
	.rg-game--chosen {
		margin: 0;
	}

	.rg-game--lead {
		color: var(--muted);
		font-size: var(--font-size-md);
	}

	.rg-game--label {
		color: var(--muted);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-bold);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}

	.rg-game--chosen {
		color: var(--text);
		font-size: var(--font-size-md);
	}

	/* Words for screen readers only. */
	.rg-game--spoken {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	.rg-game--shared :global(.rg-game--cost) {
		margin-bottom: var(--space-6);
	}

	/* A shelf card shown in full beside the shelf, at the left, so the shelf and its focus stay in sight (#28 review). */
	.rg-game--inspect-side {
		justify-items: start;
		padding-left: var(--space-10);
		background: transparent;
	}
</style>
