<!-- The #35 part 4 mockup: Arts & Architecture in play, drawn with the production components over screenshots of the running game. -->
<script>
	import { tick } from 'svelte';
	import TrackBoard from '../lib/components/board/TrackBoard.svelte';
	import BoardSwitcher from '../lib/components/board/BoardSwitcher.svelte';
	import AchievementStrip from '../lib/components/board/AchievementStrip.svelte';
	import MasterpieceCard from '../lib/components/player/MasterpieceCard.svelte';
	import LandmarkCard from '../lib/components/player/LandmarkCard.svelte';
	import IncomeMat from '../lib/components/player/IncomeMat.svelte';
	import DecisionPanel from '../lib/components/prompts/DecisionPanel.svelte';
	import DecisionOption from '../lib/components/prompts/DecisionOption.svelte';
	import { achievements, spaceWords, trackBoard } from '../lib/board.js';
	import { bonusGlyphs, spaceGlyphs } from '../lib/glyphs.js';
	import { describeEffects } from '../lib/describe.js';
	import { masterpieceName } from '../lib/game-names.js';
	import { landmarkCardData } from '../lib/cards/game-cards.js';
	import { bonusOf } from '../lib/engine/game.js';
	import { TRACKS } from '../lib/engine/data/tracks.js';
	import { landmarksFor } from '../lib/engine/data/landmarks.js';
	import { masterpiece } from '../lib/engine/data/masterpieces.js';
	import { INCOME_MAT, INSPIRED_MAT } from '../lib/engine/data/income-mat.js';
	import { BUILDING_IDS } from '../lib/engine/data/ids.js';
	import { artUrl } from '../lib/ui.js';

	/** @typedef {import('../lib/glyphs.js').Glyph} Glyph */
	/** @typedef {import('../lib/engine/data/ids.js').BuildingId} BuildingId */

	const BACKDROP = '/docs/ui/screens/issue-35';

	// The table: Ana (the viewer), Ben and Cy, in era III, as the backdrops show.
	const SEATS = [
		{
			seat: 1,
			kind: 'player',
			name: 'Ana',
			tracks: {
				exploration: [2],
				science: [2],
				technology: [4],
				military: [3],
				arts: [5],
			},
			restartedTracks: [],
		},
		{
			seat: 2,
			kind: 'player',
			name: 'Ben',
			tracks: {
				exploration: [5],
				science: [1],
				technology: [6],
				military: [1],
				arts: [2],
			},
			restartedTracks: [],
		},
		{
			seat: 3,
			kind: 'player',
			name: 'Cy',
			tracks: {
				exploration: [3],
				science: [3],
				technology: [1],
				military: [5],
				arts: [8],
			},
			restartedTracks: [],
		},
	];
	const TAKEN = ['lighthouse', 'forge', 'clock-tower', 'opera-house'];
	const VIEW = {
		seats: SEATS,
		landmarks: landmarksFor(['aa'])
			.map((l) => l.id)
			.filter((id) => !TAKEN.includes(id)),
		achievements: {},
		map: /** @type {'small'} */ ('small'),
		variants: [],
	};

	/**
	 * A word on a track space, as the board draws the effects it has no symbol for.
	 * @param {string} text
	 * @returns {Glyph}
	 */
	const word = (text) => ({ kind: 'word', text, count: 1 });

	/** The arts spaces' benefits the board has no symbol for yet, in words (the mockup's proposal). */
	/** @type {Record<number, Glyph[]>} */
	const ARTS_BENEFITS = {
		3: [word('Create')],
		5: [word('Inspire')],
		6: [
			word('Broadcast'),
			{ kind: 'or' },
			...spaceGlyphs([{ anyBuilding: {} }]),
		],
		7: [word('May refresh'), { kind: 'plus' }, word('Create')],
		8: [word('Inspire')],
		// The counter "income building" has no symbol yet: the board falls back to "Thing".
		10: [
			...spaceGlyphs([{ anyBuilding: {} }]),
			{ kind: 'plus' },
			{ kind: 'vp', count: 1 },
			{ kind: 'per' },
			word('Building'),
		],
		12: [word('Fire 3')],
	};

	/** The bonuses that create. */
	const CREATE_BONUS = [5, 11];

	/** The unowned arts landmarks, by space. */
	const unowned = new Set(VIEW.landmarks);

	/** The arts track as TrackBoard takes it. */
	const ARTS = {
		id: /** @type {import('../lib/ui.js').TrackId} */ ('arts'),
		name: 'Arts',
		spaces: TRACKS.arts.slice(1).map((space) => {
			const bonus = bonusGlyphs(
				bonusOf(/** @type {any} */ (VIEW), 'arts', space.space)
			);
			/** @type {import('../lib/components/board/Track.svelte').TrackSpaceEntry} */
			const entry = {
				name: space.name,
				benefit:
					ARTS_BENEFITS[space.space] ?? spaceGlyphs(space.benefit),
				bonus:
					bonus && CREATE_BONUS.includes(space.space)
						? { ...bonus, gain: [word('Create')] }
						: bonus,
				words: spaceWords(VIEW, 'arts', space.space),
			};
			if (space.landmark && unowned.has(space.landmark)) {
				entry.landmark =
					{
						'clock-tower': 'Clock Tower',
						'opera-house': 'Opera House',
						holocenter: 'Holocenter',
					}[space.landmark] ?? space.landmark;
			}
			return entry;
		}),
		tiers: /** @type {import('../lib/ui.js').CostSymbol[][]} */ ([
			['any'],
			['any', 'any'],
			['any', 'any', 'any'],
			['any', 'any'],
		]),
		players: SEATS.map((s) => ({
			seat: /** @type {import('../lib/ui.js').Seat} */ (s.seat),
			name: s.name,
			position: s.tracks.arts[0],
		})),
	};

	const TRACK_LIST = [...trackBoard(/** @type {any} */ (VIEW)), ARTS];
	const BANDS = /** @type {import('../lib/ui.js').TrackId[]} */ ([
		'exploration',
		'science',
		'technology',
		'military',
		'arts',
	]);
	const ACHIEVEMENTS = achievements(/** @type {any} */ (VIEW));

	/** The two colours offered for the arts track. */
	const COLOURS = {
		a: { label: 'A · Violet, as its symbol', value: '#7b5aa6' },
		b: { label: 'B · Plum, apart from player 5', value: '#9a4d7c' },
	};

	// The masterpieces on show: the face-up row, the deck, and what Ana holds.
	const FACE_UP = ['painting', 'ballet', 'topiary'];
	const DECK = 14;
	const HELD = [
		{ card: 'fresco', used: false },
		{ card: 'krav-maga', used: false },
		{ card: 'graffiti', used: false },
		{ card: 'mime', used: true },
	];
	const BEN = ['theater', 'calligraphy'];
	const CY = ['stained-glass', 'art-deco'];

	/**
	 * A masterpiece's effects in words, as its card prints them.
	 * @param {string} id
	 * @returns {string}
	 */
	const effectsOf = (id) =>
		// The words miss "on Arts" for Theater's arts-track count; the build fixes describe.js (part 4).
		id === 'theater'
			? 'Gain 1 VP for each space you have advanced on Arts.'
			: `${describeEffects(masterpiece(id).effects)}.`;

	// Controls.
	/** @type {'a' | 'b'} */
	let colour = $state('a');
	/** @type {'a' | 'b'} */
	let prices = $state('a');
	/** @type {'a' | 'b'} */
	let row = $state('a');
	/** @type {'a' | 'b'} */
	let where = $state('a');
	/** @type {'income' | 'broadcast' | 'implants'} */
	let firing = $state('income');
	/** @type {string | null} */
	let peek = $state(null);
	/** @type {string | null} */
	let tilePeek = $state(null);
	/** @type {'choice' | 'roll'} */
	let diceView = $state('choice');
	/** @type {number | null} */
	let created = $state(null);
	/** @type {string | null} */
	let fired = $state(null);
	/** @type {BuildingId | null} */
	let inspiring = $state(null);
	/** @type {'d12' | 'd20' | null} */
	let die = $state(null);

	/**
	 * The seat's income rows, with `inspired` rows reading the improved spaces, as incomeRows() would.
	 * @param {Record<BuildingId, number>} left - Buildings left on each row
	 * @param {BuildingId[]} inspired
	 * @returns {import('../lib/area/income.js').IncomeRowView[]}
	 */
	function rowsFor(left, inspired) {
		return BUILDING_IDS.map((building) => {
			const mat = inspired.includes(building) ? INSPIRED_MAT : INCOME_MAT;
			const exposed = 6 - left[building];
			return {
				building,
				name: ROW_NAMES[building],
				left: left[building],
				spaces: mat[building].map((space, index) => {
					const covered = index >= exposed;
					const reward = [
						space.income.length
							? `Income: ${describeEffects(space.income)}`
							: '',
						space.score.length
							? `Score: ${describeEffects(space.score)}`
							: '',
					]
						.filter(Boolean)
						.join('. ');
					return {
						name: space.name,
						reward,
						incomeGlyphs: spaceGlyphs(space.income),
						scoreGlyphs: spaceGlyphs(space.score),
						covered,
						label: covered
							? `${space.name}, covered`
							: `${space.name}. ${reward}`,
					};
				}),
			};
		});
	}

	const LEFT = { market: 3, house: 5, farm: 5, armory: 5 };

	/** The rows' names, as the income mat heads them. */
	/** @type {Record<BuildingId, string>} */
	const ROW_NAMES = {
		market: 'Markets',
		house: 'Houses',
		farm: 'Farms',
		armory: 'Armories',
	};

	/** The options of each control, and the rows without a tile yet. */
	const AB = /** @type {('a' | 'b')[]} */ (['a', 'b']);
	const SPARE = /** @type {BuildingId[]} */ (['house', 'farm', 'armory']);
	/** @type {Record<BuildingId, string>} */
	const TILE = {
		market: 'markets',
		house: 'houses',
		farm: 'farms',
		armory: 'armories',
	};
	let incomeRowsShown = $derived(
		rowsFor(LEFT, inspiring ? ['market', inspiring] : ['market'])
	);

	// Measured overlays on the production components: the arts prices' marks, the masterpiece row in the arts heading,
	// and the inspired spaces.
	/** @type {HTMLElement | undefined} */
	let trackScreen = $state();
	/** @type {HTMLElement | undefined} */
	let areaScreen = $state();
	/** @type {HTMLElement | undefined} */
	let inspireScreen = $state();
	/** @type {{ x: number, y: number, text: string }[]} */
	let marks = $state([]);
	/** @type {{ x: number, y: number, w: number } | null} */
	let heading = $state(null);
	/** @type {{ x: number, y: number, w: number, h: number, plus: boolean }[]} */
	let spaceBoxes = $state([]);
	/** @type {{ x: number, y: number, w: number, h: number, plus: boolean, preview?: boolean }[]} */
	let inspireBoxes = $state([]);

	/**
	 * An element's box inside a screen.
	 * @param {Element} element
	 * @param {HTMLElement} screen
	 */
	function boxIn(element, screen) {
		const a = element.getBoundingClientRect();
		const s = screen.getBoundingClientRect();
		return {
			x: a.left - s.left,
			y: a.top - s.top,
			w: a.width,
			h: a.height,
		};
	}

	/**
	 * The inspired spaces of the income mat inside a screen: spaces 2, 4 and 6 of each inspired row.
	 * @param {HTMLElement} screen
	 * @param {BuildingId[]} inspired
	 */
	function inspiredBoxes(screen, inspired) {
		return inspired.flatMap((building) =>
			[
				...screen.querySelectorAll(
					`.rg-income-mat--row-${building} .rg-income-mat--space`
				),
			].map((space, index) => ({
				...boxIn(space, screen),
				plus: index % 2 === 1,
			}))
		);
	}

	$effect(() => {
		void prices;
		void row;
		void colour;
		tick().then(() => {
			if (!trackScreen) {
				return;
			}
			const arts = trackScreen.querySelectorAll('.rg-track')[4];
			if (!arts) {
				return;
			}
			const costs = arts.querySelectorAll('.rg-tier-price');
			marks = [1, 3].map((tier) => {
				const price = costs[tier];
				const icons = price.querySelectorAll('.rg-resource-icon');
				const last = icons[icons.length - 1] ?? price;
				const box = boxIn(
					last,
					/** @type {HTMLElement} */ (trackScreen)
				);
				const text =
					prices === 'a'
						? tier === 1
							? '≠'
							: '='
						: tier === 1
							? 'different'
							: 'same';
				return { x: box.x + box.w + 4, y: box.y + box.h / 2, text };
			});
			const head = arts.querySelector('.rg-track--heading');
			heading = head
				? boxIn(head, /** @type {HTMLElement} */ (trackScreen))
				: null;
		});
	});

	$effect(() => {
		void where;
		tick().then(() => {
			spaceBoxes = areaScreen
				? inspiredBoxes(areaScreen, ['market'])
				: [];
		});
	});

	$effect(() => {
		void inspiring;
		tick().then(() => {
			inspireBoxes = inspireScreen
				? [
						...inspiredBoxes(inspireScreen, ['market']),
						...(inspiring
							? inspiredBoxes(inspireScreen, [inspiring]).map(
									(b) => ({ ...b, preview: true })
								)
							: []),
					]
				: [];
		});
	});

	/** The fire panel's cards, by purpose: your own, and for Streaming Implants your neighbours' too. */
	let fireCards = $derived.by(() =>
		[
			...HELD.filter((h) => !h.used).map((h) => ({
				card: h.card,
				owner: 'Ana',
				seat: 1,
			})),
			...(firing === 'implants'
				? [
						...BEN.map((card) => ({ card, owner: 'Ben', seat: 2 })),
						...CY.filter((c) => c !== 'art-deco').map((card) => ({
							card,
							owner: 'Cy',
							seat: 3,
						})),
					]
				: []),
		].filter((c) => firing !== 'income' || c.card !== 'fresco')
	);

	const FIRE_TITLE = {
		income: 'Your masterpieces fire: choose the next',
		broadcast: 'Broadcast: choose a masterpiece to fire',
		implants: 'Streaming Implants: choose a masterpiece to fire (1 of 3)',
	};
</script>

{#snippet back(/** @type {string} */ label)}
	<div
		class="mk-back"
		aria-label={label}>
		<img
			src={artUrl('track/arts')}
			alt="" />
		<span>Masterpiece</span>
	</div>
{/snippet}

{#snippet chip(
	/** @type {string} */ id,
	/** @type {boolean} */ used,
	/** @type {string} */ size
)}
	<button
		type="button"
		class="mk-chip mk-chip--{size}"
		class:mk-chip--used={used}
		onmouseenter={() => (peek = used ? null : id)}
		onmouseleave={() => (peek = null)}
		onfocus={() => (peek = used ? null : id)}
		onblur={() => (peek = null)}>
		{#if used}
			<span class="mk-chip--down"
				><img
					src={artUrl('track/arts')}
					alt="" /></span>
			<span class="mk-chip--name"
				>{masterpieceName(id)} <em>used</em></span>
		{:else}
			<img
				src={artUrl(`masterpiece/${id}`)}
				alt="" />
			<span class="mk-chip--name">{masterpieceName(id)}</span>
		{/if}
	</button>
{/snippet}

{#snippet card(/** @type {string} */ id)}
	<MasterpieceCard
		title={masterpieceName(id)}
		artwork={artUrl(`masterpiece/${id}`)}>
		{#snippet effects()}<p class="mk-effects">{effectsOf(id)}</p>{/snippet}
	</MasterpieceCard>
{/snippet}

<main
	class="mk-page"
	style:--arts={COLOURS[colour].value}>
	<h1>Arts &amp; Architecture · <span>in play</span> (#35)</h1>
	<p class="mk-lead">
		Six moments over screenshots of the running game, with the production
		components: the fifth track on the board, where the masterpieces and
		inspiration tiles live, and the new choices. Point at a masterpiece to
		see its card. Pick an option wherever there are two; nothing is built
		until you choose.
	</p>

	<!-- 1 · The board -->
	<section class="mk-step">
		<h2>
			1 · <span
				>The arts track on the board, and the masterpiece row</span>
		</h2>
		<p>
			The arts track is the fifth row, with its brush symbol and its own
			colour; the board already shares its height between five tracks. Its
			new spaces say what they do in words (Create, Inspire, Broadcast),
			as "Both dice" does today. Tiers II and IV cost 2 resources of your
			choice: 2 different ones, then 2 of the same type. Key
			<b>5</b> picks the arts track, as 1–4 pick the others.
		</p>
		<div class="mk-controls">
			<div class="mk-control">
				<b>Colour</b>
				{#each AB as id (id)}
					<button
						type="button"
						aria-pressed={colour === id}
						onclick={() => (colour = id)}
						>{COLOURS[id].label}</button>
				{/each}
			</div>
			<div class="mk-control">
				<b>Prices II and IV</b>
				<button
					type="button"
					aria-pressed={prices === 'a'}
					onclick={() => (prices = 'a')}>A · ≠ and =</button>
				<button
					type="button"
					aria-pressed={prices === 'b'}
					onclick={() => (prices = 'b')}
					>B · "different" and "same"</button>
			</div>
			<div class="mk-control">
				<b>Masterpiece row</b>
				<button
					type="button"
					aria-pressed={row === 'a'}
					onclick={() => (row = 'a')}
					>A · On the arts track's line</button>
				<button
					type="button"
					aria-pressed={row === 'b'}
					onclick={() => (row = 'b')}
					>B · In the board's top row</button>
			</div>
		</div>
		<p class="mk-option-note">
			{#if row === 'a'}
				<b>A</b>: the 3 face-up masterpieces and the deck sit on the
				arts track's own line, beside its name: the track that creates
				them.
			{:else}
				<b>B</b>: they sit in the board's top row, between the board
				switch and the achievements, on show over the World Map too.
			{/if}
			Point at one to see its card over the board.
		</p>
		<div
			class="mk-screen"
			bind:this={trackScreen}>
			<img
				src="{BACKDROP}/backdrop-income.png"
				alt="" />
			<div class="mk-shared">
				<div class="mk-head">
					<BoardSwitcher
						value="tracks"
						tracks={BANDS} />
					{#if row === 'b'}
						<div class="mk-row mk-row--head">
							<span class="mk-row--label">Masterpieces</span>
							{#each FACE_UP as id (id)}
								{@render chip(id, false, 'small')}
							{/each}
							<span class="mk-deck">Deck · {DECK}</span>
						</div>
					{/if}
					<AchievementStrip achievements={ACHIEVEMENTS} />
				</div>
				<div class="mk-board-area">
					<TrackBoard
						tracks={TRACK_LIST}
						viewerSeat={1} />
				</div>
			</div>
			{#each marks as mark, index (index)}
				<span
					class="mk-mark"
					class:mk-mark--word={prices === 'b'}
					style:left="{mark.x}px"
					style:top="{mark.y}px">{mark.text}</span>
			{/each}
			{#if row === 'a' && heading}
				<div
					class="mk-row mk-row--line"
					style:left="{heading.x + 150}px"
					style:top="{heading.y - 6}px">
					<span class="mk-row--label">Masterpieces</span>
					{#each FACE_UP as id (id)}
						{@render chip(id, false, 'tiny')}
					{/each}
					<span class="mk-deck">Deck · {DECK}</span>
				</div>
			{/if}
			{#if peek}
				<div class="mk-peek">{@render card(peek)}</div>
			{/if}
		</div>
	</section>

	<!-- 2 · Your area -->
	<section class="mk-step">
		<h2>2 · <span>Your masterpieces and inspiration tiles</span></h2>
		<p>
			Masterpieces are public, as they lie face up beside your mat, so the
			same place shows on another player's tabs. A used Art Deco or Mime
			turns face down. Ana has inspired her Markets row: its spaces 2, 4
			and 6 are improved, and her other 3 tiles wait beside the mat.
		</p>
		<div class="mk-controls">
			<div class="mk-control">
				<b>Masterpieces</b>
				<button
					type="button"
					aria-pressed={where === 'a'}
					onclick={() => (where = 'a')}
					>A · Income tab, under the mat</button>
				<button
					type="button"
					aria-pressed={where === 'b'}
					onclick={() => (where = 'b')}
					>B · Civ tab, under the landmark card</button>
			</div>
		</div>
		<p class="mk-option-note">
			{#if where === 'a'}
				<b>A</b>: on the Income tab, under the mat, beside the tiles:
				they fire at the start of your income turns 2–5.
			{:else}
				<b>B</b>: on the Civ tab, under the landmark card, as cards kept
				beside the mat. The tab scrolls.
			{/if}
			An inspired row keeps the mat's look; its improved spaces get the tile's
			gold frame and +. Point at an unused tile to see its picture.
		</p>
		<div
			class="mk-screen"
			bind:this={areaScreen}>
			<img
				src="{BACKDROP}/backdrop-{where === 'a' ? 'income' : 'civ'}.png"
				alt="" />
			<div class="mk-tab">
				{#if where === 'a'}
					<IncomeMat
						rows={rowsFor(LEFT, ['market'])}
						era={3} />
				{:else}
					<div class="mk-civ">
						<h3>Landmark card</h3>
						<p class="mk-line">
							Not met yet: 2 of 3 territories controlled next to
							the starting territory
						</p>
						<LandmarkCard {...landmarkCardData('bridge')} />
					</div>
				{/if}
				<div class="mk-extra">
					{#if where === 'a'}
						<h3>Inspiration tiles <em>3 to place</em></h3>
						<div class="mk-tiles">
							{#each SPARE as building (building)}
								<button
									type="button"
									class="mk-tile-chip"
									onmouseenter={() =>
										(tilePeek = TILE[building])}
									onmouseleave={() => (tilePeek = null)}
									onfocus={() => (tilePeek = TILE[building])}
									onblur={() => (tilePeek = null)}>
									<img
										src={artUrl(`building/${building}`)}
										alt="" />
									{ROW_NAMES[building]}
								</button>
							{/each}
						</div>
					{/if}
					<h3>
						Masterpieces <em
							>fire at the start of income turns 2–5</em>
					</h3>
					<div class="mk-held">
						{#each HELD as held (held.card)}
							{@render chip(held.card, held.used, 'small')}
						{/each}
					</div>
				</div>
			</div>
			{#if where === 'a'}
				{#each spaceBoxes as box, index (index)}
					{#if box.plus}
						<span
							class="mk-frame"
							style:left="{box.x}px"
							style:top="{box.y}px"
							style:width="{box.w}px"
							style:height="{box.h}px"><i>+</i></span>
					{/if}
				{/each}
			{/if}
			{#if peek}
				<div class="mk-peek">{@render card(peek)}</div>
			{/if}
			{#if tilePeek}
				<div class="mk-peek mk-peek--tile">
					<img
						src={artUrl(`inspiration-tile/${tilePeek}`)}
						alt="" />
					<span>Spaces 2, 4 and 6 improved, framed in gold</span>
				</div>
			{/if}
		</div>
	</section>

	<!-- 3 · Create -->
	<section class="mk-step">
		<h2>3 · <span>Create a masterpiece</span></h2>
		<p>
			Dance, Rock Opera and the bonuses of Symphony and Infinite Spectrum
			Photography create: take one of the 3 face-up masterpieces, or the
			deck's top card unseen. The shelf shows them over the tracks, as
			every card choice does; the row refills at once. Rock Opera asks
			first whether to refresh the row.
		</p>
		<div class="mk-screen">
			<img
				src="{BACKDROP}/backdrop-income.png"
				alt="" />
			<div class="mk-board">
				<DecisionPanel
					title="Create a masterpiece"
					status={created === null
						? 'Press a face-up masterpiece, or the deck for its top card.'
						: created === 3
							? "Take the deck's top card, unseen."
							: `Take ${masterpieceName(FACE_UP[created])}.`}
					confirmLabel="Take card"
					confirmDisabled={created === null}
					track="arts">
					{#snippet shelf()}
						<div class="mk-shelf">
							{#each FACE_UP as id, index (id)}
								<button
									type="button"
									class="mk-shelf--card"
									class:mk-shelf--chosen={created === index}
									aria-pressed={created === index}
									onclick={() => (created = index)}
									>{@render card(id)}</button>
							{/each}
							<button
								type="button"
								class="mk-shelf--card"
								class:mk-shelf--chosen={created === 3}
								aria-pressed={created === 3}
								onclick={() => (created = 3)}>
								{@render back("The deck's top card")}
								<span class="mk-deck-count">Deck · {DECK}</span>
							</button>
						</div>
					{/snippet}
				</DecisionPanel>
			</div>
		</div>
	</section>

	<!-- 4 · Firing -->
	<section class="mk-step">
		<h2>4 · <span>Masterpieces fire</span></h2>
		<p>
			At the start of income turns 2–5 every masterpiece you hold fires,
			in the order you pick: the panel asks for the next until one is
			left, which fires by itself. Broadcast fires one of yours. Streaming
			Implants fires up to 3, yours and your neighbours', each marked with
			its owner, and may stop early.
		</p>
		<div class="mk-controls">
			<div class="mk-control">
				<b>Why</b>
				<button
					type="button"
					aria-pressed={firing === 'income'}
					onclick={() => ((firing = 'income'), (fired = null))}
					>Income turn</button>
				<button
					type="button"
					aria-pressed={firing === 'broadcast'}
					onclick={() => ((firing = 'broadcast'), (fired = null))}
					>Broadcast</button>
				<button
					type="button"
					aria-pressed={firing === 'implants'}
					onclick={() => ((firing = 'implants'), (fired = null))}
					>Streaming Implants</button>
			</div>
		</div>
		<div class="mk-screen">
			<img
				src="{BACKDROP}/backdrop-income.png"
				alt="" />
			<div class="mk-board">
				<DecisionPanel
					title={FIRE_TITLE[firing]}
					status={fired
						? `Fire ${masterpieceName(fired)}.`
						: firing === 'income'
							? 'Fresco fired first. Press the next to fire; the last fires by itself.'
							: 'Press a masterpiece to fire it.'}
					confirmLabel="Fire"
					confirmDisabled={fired === null}
					cancelLabel={firing === 'implants' ? 'Stop' : undefined}
					tone={firing === 'income' ? 'income' : 'default'}
					track={firing === 'income' ? null : 'arts'}>
					{#snippet shelf()}
						<div
							class="mk-shelf"
							class:mk-shelf--many={fireCards.length > 4}>
							{#each fireCards as option (option.card)}
								<button
									type="button"
									class="mk-shelf--card"
									class:mk-shelf--chosen={fired ===
										option.card}
									aria-pressed={fired === option.card}
									onclick={() => (fired = option.card)}>
									{#if option.seat !== 1}
										<span
											class="mk-owner"
											style:--owner="var(--player-{option.seat})"
											>{option.owner}'s</span>
									{/if}
									{@render card(option.card)}
								</button>
							{/each}
						</div>
					{/snippet}
				</DecisionPanel>
			</div>
		</div>
	</section>

	<!-- 5 · Inspire -->
	<section class="mk-step">
		<h2>5 · <span>Inspire</span></h2>
		<p>
			Symphony and CGI Animation place an inspiration tile on a row of
			your choice. The Income tab opens; pointing at a row on the panel
			shows its improved spaces on the mat. The last tile goes without
			asking.
		</p>
		<div
			class="mk-screen"
			bind:this={inspireScreen}>
			<img
				src="{BACKDROP}/backdrop-income.png"
				alt="" />
			<div class="mk-tab">
				<IncomeMat
					rows={incomeRowsShown}
					era={3} />
			</div>
			{#each inspireBoxes as box, index (index)}
				{#if box.plus}
					<span
						class="mk-frame"
						class:mk-frame--preview={box.preview}
						style:left="{box.x}px"
						style:top="{box.y}px"
						style:width="{box.w}px"
						style:height="{box.h}px"><i>+</i></span>
				{/if}
			{/each}
			<div class="mk-board">
				<DecisionPanel
					title="Inspire: choose an income row for an inspiration tile"
					status={inspiring
						? `Inspire the ${ROW_NAMES[inspiring]} row.`
						: 'Choose a row; Markets already has its tile.'}
					confirmLabel="Place tile"
					confirmDisabled={inspiring === null}
					track="arts">
					<div class="mk-options">
						{#each SPARE as building (building)}
							<DecisionOption
								label="The {ROW_NAMES[building]} row"
								art={[{ kind: 'building', id: building }]}
								pressed={inspiring === building}
								onDecisionOptionClick={() =>
									(inspiring = building)} />
						{/each}
					</div>
				</DecisionPanel>
			</div>
		</div>
	</section>

	<!-- 6 · The d20 -->
	<section class="mk-step">
		<h2>6 · <span>The d20 science die</span></h2>
		<p>
			With the arts track the science die is a d20: the five tracks on 4
			faces each, so research can land on the arts track. Its body is a
			first drawing in the art style, for the Art area once you like it.
			With the variant "Either science die", research first asks which die
			to roll.
		</p>
		<div class="mk-controls">
			<div class="mk-control">
				<b>Show</b>
				<button
					type="button"
					aria-pressed={diceView === 'choice'}
					onclick={() => (diceView = 'choice')}
					>The die to roll (variant)</button>
				<button
					type="button"
					aria-pressed={diceView === 'roll'}
					onclick={() => (diceView = 'roll')}>The roll</button>
			</div>
		</div>
		<div class="mk-screen">
			<img
				src="{BACKDROP}/backdrop-income.png"
				alt="" />
			<div class="mk-board">
				{#if diceView === 'roll'}
					<figure class="mk-tray">
						<span class="mk-die--body mk-die--big">
							<img
								src="{BACKDROP}/d20-body.svg"
								alt="" />
							<img
								class="mk-die--face"
								src={artUrl('track/arts')}
								alt="" />
						</span>
						<figcaption>
							<b>Ana</b> researched: the d20 landed on <b>Arts</b>
						</figcaption>
					</figure>
				{:else}
					<DecisionPanel
						title="Research: which science die?"
						status={die
							? `Roll the ${die}.`
							: 'Choose the die to roll.'}
						confirmLabel="Roll"
						confirmDisabled={die === null}
						track="science">
						<div class="mk-options mk-options--dice">
							<button
								type="button"
								class="mk-die-option"
								aria-pressed={die === 'd12'}
								onclick={() => (die = 'd12')}>
								<span class="mk-die--body"
									><img
										src={artUrl('die/science-body')}
										alt="" /></span>
								<span><b>d12</b> · the 4 tracks</span>
							</button>
							<button
								type="button"
								class="mk-die-option"
								aria-pressed={die === 'd20'}
								onclick={() => (die = 'd20')}>
								<span class="mk-die--body"
									><img
										src="{BACKDROP}/d20-body.svg"
										alt="" /></span>
								<span><b>d20</b> · the 5 tracks, arts too</span>
							</button>
						</div>
					</DecisionPanel>
				{/if}
			</div>
		</div>
	</section>

	<section class="mk-step">
		<h2>And with no mockup: <span>the existing patterns</span></h2>
		<ul class="mk-list">
			<li>
				The lobby already offers Arts &amp; Architecture and its two
				variants (no arts track; either science die) under its expansion
				switch.
			</li>
			<li>
				Costuming and Mime ask "Pay 1 resource to …?" with Pay and
				Decline, as every trade does; Dark Ages asks for its track as
				any track choice does.
			</li>
			<li>
				The log, How to play (an Arts &amp; Architecture section with
				A&amp;A's landmark cards and the players + 1 draft) and the card
				reference (the 20 masterpieces with their rules) in our own
				words.
			</li>
			<li>
				Other players' masterpieces and tiles show on their tabs in the
				same place as yours.
			</li>
		</ul>
	</section>
</main>

<style>
	.mk-page {
		display: grid;
		gap: var(--space-12);
		width: 1920px;
		padding: var(--space-10) 0 var(--space-16);
	}

	.mk-page > *:not(.mk-step),
	.mk-step > *:not(.mk-screen) {
		margin-inline: var(--space-10);
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

	h3 {
		margin: 0;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-lg) / var(--leading-tight)
			var(--font-body);
	}

	h3 em {
		margin-left: var(--space-3);
		color: var(--muted);
		font-size: var(--font-size-sm);
		font-style: normal;
		font-weight: var(--weight-regular);
	}

	.mk-lead,
	.mk-step > p,
	.mk-option-note,
	.mk-list {
		max-width: 1100px;
		margin-block: 0;
		color: var(--muted);
		font-size: var(--font-size-base);
		line-height: var(--leading-snug);
	}

	.mk-option-note b,
	.mk-step > p b {
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

	/* The shared area, redrawn with five tracks. */
	.mk-shared {
		position: absolute;
		top: 58px;
		left: 0;
		display: flex;
		flex-direction: column;
		width: 1440px;
		height: 964px;
		padding: 14px var(--space-9) var(--space-6) var(--space-10);
		background: var(--texture) var(--surface);
	}

	.mk-shared :global(.rg-track--heading .rg-track--name) {
		font-weight: var(--weight-bold);
	}

	.mk-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		margin-bottom: var(--space-5);
	}

	.mk-board-area {
		flex: 1;
		min-height: 0;
	}

	/* The shared area, where the game puts a decision panel. */
	.mk-board {
		position: absolute;
		top: 58px;
		left: 0;
		width: 1440px;
		height: 964px;
	}

	.mk-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.mk-row--line {
		position: absolute;
		padding: 0 var(--space-4);
		background: var(--surface);
	}

	.mk-row--label {
		color: var(--muted);
		font-size: var(--font-size-xs);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.mk-deck {
		padding: var(--space-1) var(--space-4);
		border: var(--border) dashed var(--line-strong);
		color: var(--muted);
		font-size: var(--font-size-xs);
		white-space: nowrap;
	}

	.mk-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-1) var(--space-4) var(--space-1) var(--space-1);
		border: var(--border) solid #94764c;
		background: #e8d6ad;
		color: #3c3021;
		font: var(--weight-bold) var(--font-size-xs) / 1 var(--font-body);
		cursor: default;
	}

	.mk-chip img {
		image-rendering: pixelated;
	}

	.mk-chip--tiny img {
		width: 20px;
		height: 20px;
	}

	.mk-chip--small img {
		width: 32px;
		height: 32px;
	}

	.mk-chip:hover,
	.mk-chip:focus-visible {
		outline: 2px solid var(--gold);
	}

	.mk-chip--used {
		border-color: var(--line-strong);
		background: #4b3a5e;
		color: #d9cbe8;
	}

	.mk-chip--down {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		background: #5f3a9e;
	}

	.mk-chip--down img {
		width: 22px;
		height: 22px;
	}

	.mk-chip--name em {
		color: #b9a7cf;
		font-style: normal;
		font-weight: var(--weight-regular);
	}

	.mk-mark {
		position: absolute;
		padding: 0 3px;
		background: var(--surface);
		transform: translateY(-50%);
		color: var(--text);
		font: var(--weight-bold) 18px / 1 var(--font-body);
	}

	.mk-mark--word {
		color: var(--muted);
		font-size: var(--font-size-2xs);
		font-weight: var(--weight-regular);
		text-transform: lowercase;
	}

	.mk-peek {
		position: absolute;
		right: 520px;
		bottom: 90px;
		z-index: 3;
		box-shadow: var(--shadow-float);
	}

	.mk-effects {
		margin: 0;
	}

	/* The right panel's tab body, below the tab row and above the summary. */
	.mk-tab {
		position: absolute;
		top: 96px;
		left: 1441px;
		display: grid;
		align-content: start;
		gap: var(--space-6);
		width: 479px;
		height: 832px;
		padding: 18px 21px;
		overflow: hidden;
		background: var(--chrome);
	}

	.mk-civ {
		display: grid;
		gap: var(--space-4);
	}

	.mk-line {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.mk-extra {
		display: grid;
		gap: var(--space-4);
	}

	.mk-tiles {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.mk-tile-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-1) var(--space-4) var(--space-1) var(--space-2);
		border: 2px solid var(--gold);
		background: #4b2f7c;
		color: #f3e6c4;
		font: var(--weight-bold) var(--font-size-xs) / 1 var(--font-body);
		cursor: default;
	}

	.mk-tile-chip img {
		width: 24px;
		height: 24px;
		image-rendering: pixelated;
	}

	.mk-peek--tile {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-6);
		background: var(--chrome);
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.mk-peek--tile img {
		width: 576px;
		height: 96px;
		image-rendering: pixelated;
	}

	.mk-held {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	/* The inspired row: the improved spaces framed in gold with the tile's +. */
	.mk-frame {
		position: absolute;
		border: 3px solid var(--gold);
		pointer-events: none;
	}

	.mk-frame i {
		position: absolute;
		top: 1px;
		right: 4px;
		color: var(--gold);
		font: var(--weight-bold) 16px / 1 var(--font-body);
		font-style: normal;
	}

	.mk-frame--preview {
		border-style: dashed;
	}

	.mk-shelf {
		display: flex;
		gap: var(--space-8);
		margin-bottom: var(--space-8);
	}

	/* Six cards fit the board as the game's shelf fits them: smaller. */
	.mk-shelf--many {
		zoom: 0.72;
	}

	.mk-shelf--card {
		position: relative;
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

	.mk-back {
		display: grid;
		place-items: center;
		align-content: center;
		gap: var(--space-4);
		width: 200px;
		height: 100%;
		min-height: 200px;
		border: 2px solid #735934;
		background: linear-gradient(160deg, #5f3a9e, #3a2463);
		box-shadow: inset 0 0 0 4px #e2b857;
		color: #e2b857;
		font: var(--weight-bold) var(--font-size-lg) / 1 var(--font-title);
	}

	.mk-back img {
		width: 64px;
		height: 64px;
		image-rendering: pixelated;
	}

	.mk-deck-count {
		position: absolute;
		bottom: var(--space-4);
		left: 50%;
		transform: translateX(-50%);
		color: #e8ddc4;
		font-size: var(--font-size-xs);
	}

	.mk-owner {
		position: absolute;
		top: -22px;
		left: 0;
		padding: 2px var(--space-4);
		background: var(--owner);
		color: var(--ink);
		font: var(--weight-bold) var(--font-size-xs) / 1.3 var(--font-body);
	}

	.mk-options {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-4);
		padding: var(--space-6);
	}

	.mk-options--dice {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.mk-die-option {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-4) var(--space-6);
		border: var(--border) solid var(--line-strong);
		background: var(--control);
		color: var(--text);
		font: inherit;
		cursor: pointer;
	}

	.mk-die-option[aria-pressed='true'] {
		border-color: var(--gold);
		background: var(--picked-fill);
	}

	.mk-die--body {
		position: relative;
		display: inline-grid;
		place-items: center;
		width: 72px;
		height: 72px;
	}

	.mk-die--body img {
		width: 72px;
		height: 72px;
		image-rendering: pixelated;
	}

	.mk-die--body .mk-die--face {
		position: absolute;
		top: 24px;
		width: 26px;
		height: 26px;
	}

	.mk-tray {
		position: absolute;
		top: 50%;
		left: 50%;
		display: grid;
		justify-items: center;
		gap: var(--space-6);
		margin: 0;
		padding: var(--space-10) var(--space-16);
		border: var(--border) solid var(--line-soft);
		background: rgb(23 26 29 / 92%);
		box-shadow: var(--shadow-float);
		color: var(--text);
		font-size: var(--font-size-lg);
		transform: translate(-50%, -50%);
	}

	.mk-tray b {
		color: var(--gold);
	}

	.mk-die--big,
	.mk-die--big img {
		width: 128px;
		height: 128px;
	}

	.mk-die--big .mk-die--face {
		top: 44px;
		width: 44px;
		height: 44px;
	}

	.mk-list {
		display: grid;
		gap: var(--space-3);
		padding-left: var(--space-10);
	}
</style>
