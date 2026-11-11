// The decision prompt's state (#79): what the viewer has chosen so far in the open decision, keyed to it, and what the board, the player area, the footer and the dice tray show of it.
import { matchingSides } from './engine/game.js';
import { RESOURCE_CAP } from './engine/effects/gain.js';
import {
	panelControls,
	paymentControls,
	promptFor,
	shelfCards as shelfCardsOf,
	shelfFace,
	jointPick,
	jointAnswer,
	jointBlocked as jointBlockedOf,
} from './prompts.js';
import {
	advanceModel,
	canPickItem,
	emptySelection,
	matchIndex,
	offerModel,
	pendingCounts,
	pickModel,
	pickStatus,
	rowView,
	toggleItem,
	togglePick,
} from './picks.js';
import {
	exploreIndex,
	exploreLine,
	exploreTiles,
	hexScores,
	tilePreview,
	tileScores,
	tileWords,
} from './area/explore.js';
import { tapestryName, techName } from './game-names.js';
import { myDecision } from './turn.js';
import { RESOURCE_ORDER } from './ui.js';
import { cardCivOf, civCardView } from './civ-card.js';

/** The places chosen in the Capital tab: its plots, and A&A's cards and mats under it (#184). */
const CAPITAL_TAB_PLACES = ['capital', 'plot', 'held'];

/** @typedef {import('./picks.js').Selection} Selection */
/** @typedef {import('./picks.js').ResourceId} ResourceId */
/** @typedef {Record<ResourceId, number>} Counts */

/**
 * What the prompt state reads from the screen. Each field is read when it is needed, so getters keep it current.
 * @typedef {Object} PromptSource
 * @property {any} game - The game as view() gives it to the viewer
 * @property {number | null} seat - The viewer's seat
 * @property {Record<string, any> | null} decision - The viewer's open decision that a panel answers: any but the turn's own choice
 * @property {'tracks' | 'map'} board - The shared board on show
 * @property {import('./turn.js').AdvanceOption | null} advance - The selected space's advance, when the viewer can take it now
 * @property {Counts} held - The viewer's resources
 * @property {boolean} busy - The screen is sending a move of its own, such as the turn's
 * @property {(action: Record<string, unknown>) => Promise<boolean>} move - Sends one move; true when it was accepted
 */

/**
 * The choices made in one decision.
 * @typedef {Object} Chosen
 * @property {string} key - The decision they belong to
 * @property {number | null} picked - The answer chosen, by index
 * @property {string | null} hex - The hex chosen on the map
 * @property {string | null} spot - The spot chosen on the civilization card (#78)
 * @property {number | null} tile - The explore's tile (#74)
 * @property {number} orient - The explore's turn on the hex, 0–5 (#74)
 * @property {Selection} selection - A pick's choices so far (#75)
 * @property {number | null} offer - A trade's chosen offer, its second step (#75)
 * @property {number | null} jointMat - The joint pick's mat, by number (#36)
 * @property {number | null} jointCiv - The joint pick's civilization, by its place among the two dealt (#36)
 */

/**
 * A card shown in full over the shared area by CardPreview (#96): its kind and its id, or the face a shelf already drew
 * (#118); beside the shelf, without a scrim, for a shelf card.
 * @typedef {{ kind: 'tech' | 'tapestry' | 'masterpiece', id?: string, data?: any, side?: boolean }} Inspected
 */

/** @returns {Selection} */
const nothing = () => ({ rows: [], items: [] });

/**
 * An option the panel lists: a prompt option, keyed, with its VP badge, or one greyed out with its reason (R117).
 * @typedef {import('./prompts.js').PromptOption & { key: string, vp: number | null, reason: string | null }} PanelOption
 */

/**
 * The panel's options with the ones that can't be picked (R117) in their place: each before the first option listed
 * from its answer on, or last. Index -1 marks them, as no answer picks them.
 * @param {PanelOption[]} options
 * @param {import('./prompts.js').UnavailableOption[]} unavailable
 * @returns {PanelOption[]}
 */
function withUnavailable(options, unavailable) {
	if (unavailable.length === 0) {
		return options;
	}
	/** @param {import('./prompts.js').UnavailableOption} out @returns {PanelOption} */
	const greyed = (out) => ({
		index: -1,
		place: 'panel',
		key: out.key,
		label: out.label,
		art: out.art,
		vp: null,
		reason: out.reason,
	});
	/** @type {PanelOption[]} */
	const listed = [];
	let next = 0;
	for (const option of options) {
		while (
			next < unavailable.length &&
			unavailable[next].before <= option.index
		) {
			listed.push(greyed(unavailable[next++]));
		}
		listed.push(option);
	}
	return [...listed, ...unavailable.slice(next).map(greyed)];
}

/** The prompt's selection and what the rest of the screen reads from it. */
export class PromptState {
	/** @type {PromptSource} */
	#source;
	/** @type {Chosen} */
	#chosen = $state.raw({
		key: '',
		picked: null,
		hex: null,
		spot: null,
		tile: null,
		orient: 0,
		selection: nothing(),
		offer: null,
		jointMat: null,
		jointCiv: null,
	});
	/** @type {Selection} The advance's payment picked so far (#75) */
	#payment = $state.raw(nothing());
	/** A move of the prompt's own is being sent. */
	#sending = $state(false);
	/** The decision whose panel is minimized (#149), by its key, so a new decision's panel opens by itself. */
	#minimizedKey = $state('');

	/** @param {PromptSource} source */
	constructor(source) {
		this.#source = source;
	}

	/** The decision a panel answers, or null. */
	get decision() {
		return this.#source.decision ?? null;
	}

	/** Nothing changes, and nothing is sent, while a move is being sent. */
	get sending() {
		return this.#sending || this.#source.busy;
	}

	// The source's fields, read through accessors: a field's initializer may not read #source itself.
	get #game() {
		return this.#source.game;
	}

	get #seat() {
		return this.#source.seat;
	}

	get #board() {
		return this.#source.board;
	}

	/** The selected space's advance, which the payment's panel is for. */
	get advance() {
		return this.#source.advance ?? null;
	}

	get #held() {
		return this.#source.held;
	}

	/** The designed prompt for the decision (#28): its words, art, layout and one option per answer. */
	prompt = $derived(promptFor(this.decision, this.#game, this.#seat));

	/** The choices so far, or a fresh start for a decision they don't belong to. */
	#now = $derived.by(() => {
		const key = this.decision ? String(this.decision.id) : '';
		if (this.#chosen.key === key) {
			return this.#chosen;
		}
		// An explore offering one tile (Coal Baron's, or the last in hand) starts with it picked (#74).
		const tiles = this.offeredTiles;
		return {
			key,
			picked: null,
			hex: null,
			spot: null,
			tile: tiles.length === 1 ? tiles[0] : null,
			orient: 0,
			selection: nothing(),
			offer: null,
			jointMat: null,
			jointCiv: null,
		};
	});

	/** @param {Partial<Chosen>} changes */
	#set(changes) {
		this.#chosen = { ...this.#now, ...changes };
	}

	get picked() {
		return this.#now.picked;
	}

	/** The joint pick's mat so far, by number (#36). */
	get jointMat() {
		return this.#now.jointMat;
	}

	/** The joint pick's civilization so far, by its place among the two dealt (#36). */
	get jointCiv() {
		return this.#now.jointCiv;
	}

	/** The joint pick's two shelves, the mats over the civilizations, or null for any other decision (#36). */
	joint = $derived(jointPick(this.decision));

	/** The joint pick's mats shelf as drawn, which DecisionPrompt measures, so the civilization cards take only the room
	 * it leaves (#36). */
	jointMatsHeight = $state(0);

	/** The joint pick's cards greyed out by what is picked (R120). */
	jointBlocked = $derived(
		this.joint && this.decision
			? jointBlockedOf(this.decision, {
					mat: this.#now.jointMat,
					civ: this.#now.jointCiv,
				})
			: { mats: [], civs: [] }
	);

	/**
	 * The joint pick's mat pressed: the answer it makes with the civilization picked, if any.
	 * @param {number} mat - Its number
	 */
	pickJointMat(mat) {
		if (!this.sending && this.decision) {
			this.#set({
				jointMat: mat,
				picked: jointAnswer(this.decision, mat, this.#now.jointCiv),
			});
		}
	}

	/**
	 * The joint pick's civilization pressed: the answer it makes with the mat picked, if any.
	 * @param {number} civ - Its place among the two dealt
	 */
	pickJointCiv(civ) {
		if (!this.sending && this.decision) {
			this.#set({
				jointCiv: civ,
				picked: jointAnswer(this.decision, this.#now.jointMat, civ),
			});
		}
	}

	get hex() {
		return this.#now.hex;
	}

	get spot() {
		return this.#now.spot;
	}

	get tile() {
		return this.#now.tile;
	}

	get orient() {
		return this.#now.orient;
	}

	get offer() {
		return this.#now.offer;
	}

	/** A choice on the map, even one the capital leads (a Nomads placement): the board should show it (#180). */
	isMap = $derived((this.prompt?.mapHexes.length ?? 0) > 0);
	/** A choice on the tracks (#172): the board should show them. */
	isTrack = $derived(this.prompt?.layout === 'track');
	/**
	 * The board around the panel takes the click (#172): a choice on the tracks keeps the panel at their centre with no
	 * scrim, so the lit spaces around it can be clicked (owner, 2026-11-06), rather than docking as a map choice does.
	 */
	clickThrough = $derived(this.isTrack);
	/** The spaces lit on the tracks, and the one chosen. */
	trackTargets = $derived(this.prompt?.trackSpaces ?? []);
	trackSelected = $derived.by(() => {
		const [track, space] = (this.spot ?? '').split(':');
		const found = this.trackTargets.find(
			(at) => at.track === track && String(at.space) === space
		);
		return this.isTrack && found ? found : null;
	});
	/** The hexes lit on the map, whatever leads: a Nomads placement lights hexes beside the capital (#28 review). */
	targets = $derived(this.prompt?.mapHexes ?? []);

	/** A trade's offers while none is chosen, its first step (#75). */
	offering = $derived(
		this.prompt?.trade && this.offer === null ? this.prompt.trade : null
	);
	/** The pick on show (#75): a trade's chosen offer, or the prompt's own resources, cards or tiles. */
	pick = $derived(
		!this.prompt || !this.decision
			? null
			: this.prompt.trade
				? this.offer === null
					? null
					: offerModel(
							this.decision,
							this.offer,
							this.#game,
							this.#seat
						)
				: this.prompt.picks
	);
	/** A chosen trade offer with nothing to pick: its one answer, or -1 (#75). */
	tradeAnswer = $derived(
		this.decision && this.prompt?.trade && this.offer !== null && !this.pick
			? this.decision.answers.findIndex(
					(/** @type {any} */ a) => a.offer === this.offer
				)
			: -1
	);

	/** The panel docks beside the map while the map shows hexes to choose, so they stay clickable (#26, #74). */
	docked = $derived(
		this.targets.length > 0 &&
			this.#board === 'map' &&
			!this.pick &&
			!this.offering &&
			this.tradeAnswer === -1
	);

	/** The choices so far, fitted to the pick on show. */
	picks = $derived(
		this.pick
			? this.#now.selection.rows.length === this.pick.rows.length
				? this.#now.selection
				: emptySelection(this.pick)
			: null
	);
	pickIndex = $derived(
		this.pick && this.picks ? matchIndex(this.pick, this.picks) : -1
	);
	pickStatus = $derived(
		this.pick && this.picks
			? pickStatus(this.pick, this.picks, this.#held)
			: null
	);
	pickRows = $derived(
		this.pick && this.picks
			? rowView(this.pick, this.picks, this.#held)
			: []
	);
	/** Cards to pay, chosen on the shelf above the panel (#75). */
	cardPick = $derived(
		this.pick?.items && this.pick.items.kind !== 'territory'
			? this.pick.items
			: null
	);
	/** Those cards as the shelf draws them, indexed by their place among the cards to pay (#118). */
	pickCards = $derived(
		this.cardPick
			? this.cardPick.ids.map((id, index) =>
					this.cardPick?.kind === 'tech'
						? {
								index,
								label: techName(String(id)),
								face: shelfFace('tech', String(id)),
							}
						: {
								index,
								label: tapestryName(String(id)),
								face: shelfFace('tapestry', String(id)),
							}
				)
			: []
	);
	/** The cards or tiles that can't be pressed now: none while a move is sent. */
	pickBlocked = $derived(
		this.pick?.items && this.picks
			? this.pick.items.ids.filter(
					(id) =>
						this.sending ||
						!canPickItem(
							/** @type {any} */ (this.pick),
							/** @type {any} */ (this.picks),
							id
						)
				)
			: []
	);
	/** The tiles of a tile payment, as TilePicker draws them. */
	pickTiles = $derived(
		this.pick?.items?.kind === 'territory'
			? this.pick.items.ids.map((id) => ({
					id: Number(id),
					label: tileWords(Number(id)),
					...tilePreview(Number(id), 0),
				}))
			: []
	);
	/** The answer that declines the pick or the trade, or -1. */
	decline = $derived(
		this.pick && this.pick.decline !== null
			? this.pick.decline
			: this.offering && this.decision
				? this.decision.answers.findIndex(
						(/** @type {any} */ a) => a.offer === null
					)
				: -1
	);

	/** The viewer's explore (#74): a tile, a lit hex and a turn, and Confirm sends that one answer. */
	exploring = $derived(
		this.prompt?.kind === 'chooseExplore'
			? /** @type {any} */ (this.decision)
			: null
	);
	/** The tiles the explore offers, lowest first: under Coal Baron only its tile, not the whole hand. */
	offeredTiles = $derived(this.exploring ? exploreTiles(this.exploring) : []);
	/** Each offered tile's best VP and turn on the chosen hex. */
	tileBest = $derived(
		this.exploring && this.hex
			? tileScores(this.#game, this.exploring, this.hex)
			: {}
	);
	/** The chosen tile's best VP and turn on every lit hex. */
	#hexBest = $derived(
		this.exploring && this.tile !== null
			? hexScores(this.#game, this.exploring, this.tile)
			: {}
	);
	/** The panel's tile row, each tile with its best VP on the chosen hex once there is one. */
	exploreRow = $derived(
		this.offeredTiles.map((id) => {
			const best = this.tileBest[id];
			return {
				id,
				label: tileWords(id),
				...tilePreview(id, 0),
				vp: best && best.vp >= 0 ? best.vp : null,
			};
		})
	);
	/** What the chosen tile scores on the chosen hex in the chosen turn. */
	exploreVp = $derived(
		this.exploring && this.tile !== null && this.hex
			? matchingSides(this.#game, this.hex, this.tile, this.orient)
			: null
	);
	/** The VP tags on the lit hexes: the chosen tile's best on each, and the current turn's on the chosen hex. */
	scores = $derived.by(() => {
		/** @type {Record<string, number>} */
		const scores = {};
		for (const [hex, best] of Object.entries(this.#hexBest)) {
			scores[hex] = best.vp;
		}
		if (this.hex && this.exploreVp !== null) {
			scores[this.hex] = this.exploreVp;
		}
		return scores;
	});
	/** What is chosen so far: the panel's one line naming the hex and turn (the status line stays empty). */
	exploreChosen = $derived(
		this.hex && this.tile !== null
			? exploreLine(this.hex, this.orient)
			: this.tile !== null
				? 'Now pick a lit hex: each shows the best this tile scores there.'
				: 'Pick a tile, or a lit hex on the map.'
	);
	/** The chosen tile in the chosen turn, drawn on the chosen hex. */
	preview = $derived(
		this.exploring && this.tile !== null && this.hex
			? { hex: this.hex, ...tilePreview(this.tile, this.orient) }
			: null
	);
	/** An explore's tile can be turned: a tile and a hex are chosen. */
	canTurn = $derived(
		Boolean(this.exploring) && this.tile !== null && Boolean(this.hex)
	);

	/** The viewer's civilization card while its own decision is made on it (#78): the card's state, and the spot chosen. */
	civPick = $derived.by(() => {
		const civ = cardCivOf(this.decision);
		if (!civ || this.prompt?.layout !== 'card') {
			return null;
		}
		return {
			civ,
			view: civCardView(this.#game, this.#seat, civ, this.decision),
			selected: this.spot,
		};
	});
	/** The income row an inspire has picked (#35), whose improved spaces the Income tab's mat previews. */
	inspirePreview = $derived.by(() => {
		if (this.decision?.kind !== 'chooseInspire' || this.picked === null) {
			return null;
		}
		const row = this.decision.answers[this.picked]?.row;
		return typeof row === 'string'
			? /** @type {import('./engine/data/ids.js').BuildingId} */ (row)
			: null;
	});
	/** The Islanders' mat while an explore offers its hexes (#165): what it lights, scores, has chosen and previews. */
	islandPick = $derived(
		this.exploring && this.targets.some((hex) => hex.startsWith('mat:'))
			? {
					targets: this.targets,
					scores: this.scores,
					selected: this.hex,
					preview: this.preview,
				}
			: null
	);
	/** The options a spot several answers share, such as the Historians' opponents for one square (#78). */
	#spotOptions = $derived(
		(this.prompt?.options ?? []).filter(
			(o) =>
				(o.place === 'card' || o.place === 'track') &&
				o.spot === this.spot
		)
	);

	/** What the panel lists: its own options, on the map those of the chosen hex, and those a chosen spot shares. An explore lists none. */
	panelOptions = $derived(
		!this.prompt ||
			this.exploring ||
			this.pick ||
			this.offering ||
			this.tradeAnswer !== -1
			? []
			: withUnavailable(
					this.prompt.options
						.filter(
							(o) =>
								o.place === 'panel' ||
								(o.place === 'map' && o.hex === this.hex) ||
								((o.place === 'card' || o.place === 'track') &&
									this.#spotOptions.length > 1 &&
									o.spot === this.spot)
						)
						.map((o) => ({
							...o,
							key: `a${o.index}`,
							vp: null,
							reason: null,
						})),
					this.prompt.unavailable
				)
	);
	/** The cards on the shelf above the panel, for a card decision. */
	shelfCards = $derived(shelfCardsOf(this.prompt, this.decision, this.#game));
	/** A building, landmark or Architects cube to place on the capital, from the Capital tab; or Cloud City's building to
	 * move, then the building moved, previewed where it may go (#36). A&A's cards that may take the piece light under the
	 * capital, with the pieces already on them (#184). */
	placement = $derived(
		this.prompt &&
			this.decision &&
			this.prompt.options.some((o) =>
				CAPITAL_TAB_PLACES.includes(o.place)
			)
			? {
					piece: this.decision.landmark
						? { landmark: this.decision.landmark }
						: this.decision.kind === 'chooseCube'
							? { cube: true }
							: this.decision.kind === 'choosePlot'
								? // Dream Monitors' own token, or the Weefolk's (#40).
									{
										token:
											this.decision.token ??
											this.decision.player,
									}
								: this.decision.kind === 'chooseCloudMove'
									? { move: true }
									: { building: this.decision.building },
					options: this.prompt.options.filter((o) =>
						CAPITAL_TAB_PLACES.includes(o.place)
					),
					picked: this.picked,
					onCards:
						this.#game?.seats?.[this.decision.player - 1]
							?.onCards ?? {},
				}
			: null
	);
	/** The Terrain tab's tiles to press: an explore's, or a tile payment's (#74, #75). */
	tilePick = $derived(
		this.exploring
			? { tiles: this.offeredTiles, selected: this.tile }
			: this.pick?.items?.kind === 'territory' && this.picks
				? {
						tiles: this.pick.items.ids.map(Number),
						selected: this.picks.items.map(Number),
						disabled: this.pickBlocked.map(Number),
					}
				: null
	);
	/** The income turn's step running now, for the footer. */
	incomeStep = $derived(
		this.prompt?.income?.steps.find(
			(step) => step.id === this.prompt?.income?.current
		)?.label ?? null
	);

	/** The panel's words and buttons. */
	controls = $derived(
		this.prompt
			? panelControls(this.prompt, {
					picked: this.picked,
					pick: this.pick,
					pickStatus: this.pickStatus,
					pickIndex: this.pickIndex,
					offering: Boolean(this.offering),
					offered: Boolean(this.prompt.trade) && this.offer !== null,
					tradeAnswer: this.tradeAnswer,
					decline: this.decline,
					exploring: Boolean(this.exploring),
					docked: this.docked,
					hex: this.hex,
					options: this.panelOptions.length > 0,
					sending: this.sending,
				})
			: null
	);

	/** The selected advance's payment as rows, when it has a choice (#75). */
	payModel = $derived(advanceModel(this.advance ?? null, this.#game));
	/** The payment's panel is open: the selected space can be paid more than one way. */
	paying = $derived(this.payModel !== null);
	/** The payment picked so far, fitted to its rows. */
	payment = $derived(
		this.payModel
			? this.#payment.rows.length === this.payModel.rows.length
				? this.#payment
				: emptySelection(this.payModel)
			: null
	);
	/** The payment the rows match, by index in the advance's payments, or -1. */
	payIndex = $derived(
		this.payModel && this.payment
			? matchIndex(this.payModel, this.payment)
			: -1
	);
	payRows = $derived(
		this.payModel && this.payment
			? rowView(this.payModel, this.payment, this.#held)
			: []
	);
	payControls = $derived(
		this.payModel && this.payment
			? paymentControls(
					this.payModel,
					this.payment,
					this.#held,
					this.sending
				)
			: null
	);

	/** The counts the overview shows while resources are being picked: after the choices so far, within the cap. */
	resources = $derived.by(() => {
		const held = this.#held;
		const model = this.paying ? this.payModel : this.pick;
		const chosen = this.paying ? this.payment : this.picks;
		if (!model || !chosen) {
			return held;
		}
		const after = pendingCounts(model, chosen, held);
		/** @type {Counts} */
		const shown = { coin: 0, food: 0, worker: 0, culture: 0 };
		for (const id of RESOURCE_ORDER) {
			shown[id] = Math.max(0, Math.min(after[id], RESOURCE_CAP));
		}
		return shown;
	});
	/** The resources the choices so far change. */
	changed = $derived(
		RESOURCE_ORDER.filter((id) => this.resources[id] !== this.#held[id])
	);

	/** The decision's panel can be minimized to look at the board (#149); an advance's payment has its Cancel instead. */
	canMinimize = $derived(this.prompt !== null && !this.paying);
	/** The decision's panel is minimized, its choices kept, its question in the footer (#149). */
	minimized = $derived(
		this.canMinimize &&
			this.#minimizedKey !== '' &&
			this.#minimizedKey === this.#now.key
	);
	/** The board leaves room for a docked panel, unless it is minimized (#149). */
	boardDocked = $derived(this.docked && !this.minimized);

	/**
	 * What is open over the board, for the dice tray (#61): a stack with a card shelf, a panel, or nothing, as when the
	 * panel is minimized (#149).
	 * @type {'none' | 'panel' | 'shelf'}
	 */
	panel = $derived(
		this.paying
			? 'panel'
			: !this.prompt || this.minimized
				? 'none'
				: this.cardPick || this.shelfCards.length
					? 'shelf'
					: 'panel'
	);

	/** Minimizes the decision's panel, keeping what is chosen (#149). */
	minimize() {
		if (this.canMinimize) {
			this.#minimizedKey = this.#now.key;
		}
	}

	/** Brings the minimized panel back (#149). */
	restore() {
		this.#minimizedKey = '';
	}

	/** Minimizes the panel, or brings it back, as V does (#149). */
	toggleMinimized() {
		if (this.minimized) {
			this.restore();
		} else {
			this.minimize();
		}
	}

	/**
	 * An answer chosen in the panel or on the shelf.
	 * @param {number} index
	 */
	choose(index) {
		if (!this.sending) {
			this.#set({ picked: index });
		}
	}

	/**
	 * A lit hex chosen. An explore keeps its tile, or takes the first one offered, at its best turn there (#74).
	 * @param {string} hex
	 */
	selectHex(hex) {
		if (this.sending || hex === this.hex) {
			return;
		}
		if (this.exploring) {
			const tile = this.tile ?? this.offeredTiles[0] ?? null;
			const best =
				tile === null
					? null
					: tileScores(this.#game, this.exploring, hex)[tile];
			this.#explore(tile, hex, best?.orient ?? 0);
			return;
		}
		const here = (this.prompt?.options ?? []).filter((o) => o.hex === hex);
		this.#set({ hex, picked: here.length === 1 ? here[0].index : null });
	}

	/**
	 * A spot chosen on the civilization card (#78): its answer, or, when several share it, a choice among them in the
	 * panel.
	 * @param {string} spot
	 */
	selectSpot(spot) {
		if (this.sending || spot === this.spot) {
			return;
		}
		const here = (this.prompt?.options ?? []).filter(
			(o) =>
				(o.place === 'card' || o.place === 'track') && o.spot === spot
		);
		if (here.length === 0) {
			return;
		}
		this.#set({ spot, picked: here.length === 1 ? here[0].index : null });
	}

	/**
	 * A lit space chosen on the tracks (#172): its answer, or, when several share it, a choice among them in the panel.
	 * @param {{ track: string, space: number }} space
	 */
	selectTrackSpace({ track, space }) {
		if (this.isTrack) {
			this.selectSpot(`${track}:${space}`);
		}
	}

	/**
	 * A territory tile pressed, in the panel or on the Terrain tab: a tile payment's (#75), or the explore's tile,
	 * which goes to its best turn on a chosen hex. The picked tile again does nothing.
	 * @param {number} tile
	 */
	pickTile(tile) {
		if (this.pick?.items?.kind === 'territory') {
			this.pickItem(tile);
			return;
		}
		if (
			this.sending ||
			tile === this.tile ||
			!this.offeredTiles.includes(tile)
		) {
			return;
		}
		this.#explore(
			tile,
			this.hex,
			this.hex ? (this.tileBest[tile]?.orient ?? 0) : this.orient
		);
	}

	/**
	 * Turns the explore's tile one step through its 6 turns: 1 forward, -1 back.
	 * @param {number} step
	 */
	turnTile(step) {
		if (this.sending || !this.canTurn) {
			return;
		}
		this.#explore(this.tile, this.hex, (this.orient + step + 6) % 6);
	}

	/**
	 * Sets the explore's tile, hex and turn, and points the answer at them.
	 * @param {number | null} tile
	 * @param {string | null} hex
	 * @param {number} orient
	 */
	#explore(tile, hex, orient) {
		const index =
			this.exploring && tile !== null && hex
				? exploreIndex(this.exploring, { tile, hex, orient })
				: -1;
		this.#set({ tile, hex, orient, picked: index === -1 ? null : index });
	}

	/**
	 * A place chosen on the Capital tab, or none when a landmark goes back to the tray; the piece's own confirm sends it.
	 * @param {number | null} index
	 * @param {boolean} confirm
	 */
	async place(index, confirm) {
		this.#set({ picked: index });
		if (confirm && index !== null) {
			await this.#answer();
		}
	}

	/**
	 * A resource pressed in a pick's row (#75).
	 * @param {number} row
	 * @param {ResourceId} resource
	 */
	pickRow(row, resource) {
		if (this.sending || !this.pick || !this.picks) {
			return;
		}
		this.#set({
			selection: togglePick(this.pick, this.picks, row, resource),
		});
	}

	/**
	 * A card or tile pressed for a payment (#75).
	 * @param {number | string} id
	 */
	pickItem(id) {
		if (this.sending || !this.pick || !this.picks) {
			return;
		}
		this.#set({ selection: toggleItem(this.pick, this.picks, id) });
	}

	/**
	 * A card to pay pressed on the shelf, by its place there.
	 * @param {number} index
	 */
	pickCard(index) {
		const id = this.cardPick?.ids[index];
		if (id !== undefined) {
			this.pickItem(id);
		}
	}

	/**
	 * A trade's offer chosen, its second step (#75).
	 * @param {number} offer
	 */
	chooseOffer(offer) {
		if (!this.sending) {
			this.#set({ offer, selection: nothing() });
		}
	}

	/** The panel's cancel button: back to a trade's offers, decline, or another territory. */
	async cancel() {
		const cancel = this.controls?.cancel;
		if (cancel === 'back') {
			this.#set({ offer: null, selection: nothing() });
		} else if (cancel === 'decline') {
			await this.#send(this.decline);
		} else if (cancel === 'clear') {
			this.#set({ hex: null, picked: null });
		}
	}

	/** The panel's Confirm, when it can be pressed: the answer the picks match, or the answer picked. */
	async confirm() {
		const controls = this.controls;
		if (!controls || controls.confirmDisabled || this.sending) {
			return;
		}
		if (controls.confirm === 'pick') {
			await this.#confirmPick();
		} else {
			await this.#answer();
		}
	}

	/** Sends the answer picked. */
	async #answer() {
		const picked = this.picked;
		if (picked !== null) {
			await this.#send(picked);
		}
	}

	/**
	 * Sends one of the decision's answers.
	 * @param {number} index
	 * @returns {Promise<boolean>}
	 */
	async #send(index) {
		const decision = this.decision;
		if (!decision || index < 0 || this.sending) {
			return false;
		}
		this.#sending = true;
		const ok = await this.#source.move({
			decision: decision.id,
			...decision.answers[index],
		});
		this.#sending = false;
		return ok;
	}

	/** Sends the pick's matched answer (#75); a VP trade then answers the chooseResource it opens with the same rows. */
	async #confirmPick() {
		const decision = this.decision;
		const index = this.pick ? this.pickIndex : this.tradeAnswer;
		if (!decision || index === -1 || this.sending) {
			return;
		}
		const rows = this.picks;
		const then = this.pick?.then ?? null;
		this.#sending = true;
		const ok = await this.#source.move({
			decision: decision.id,
			...decision.answers[index],
		});
		if (ok && then === 'chooseResource' && rows) {
			const next = myDecision(this.#game, this.#seat);
			const model =
				next?.kind === 'chooseResource'
					? pickModel(next, this.#game, this.#seat)
					: null;
			const answer = model ? matchIndex(model, rows) : -1;
			if (next && answer !== -1) {
				await this.#source.move({
					decision: next.id,
					...next.answers[answer],
				});
			}
		}
		this.#sending = false;
	}

	/**
	 * A resource pressed in the advance's payment (#75).
	 * @param {number} row
	 * @param {ResourceId} resource
	 */
	payRow(row, resource) {
		if (this.sending || !this.payModel || !this.payment) {
			return;
		}
		this.#payment = togglePick(this.payModel, this.payment, row, resource);
	}

	/** Forgets the payment picked, for a new space or a cancelled one. */
	clearPayment() {
		this.#payment = nothing();
	}

	/**
	 * A shelf card to show in full while hovered or focused; a civilization or a mat is already whole.
	 * @param {number | null} index - The card's answer index, or null when the hover ends
	 * @returns {Inspected | null}
	 */
	inspectShelf(index) {
		const card = this.shelfCards.find((c) => c.index === index);
		const kind = this.prompt?.shelf;
		if (
			!card ||
			(kind !== 'tapestry' && kind !== 'tech') ||
			typeof card.face === 'string' ||
			'deck' in card.face
		) {
			return null;
		}
		return { kind, data: card.face, side: true };
	}

	/**
	 * A card to pay shown in full while hovered or focused on the shelf (#75).
	 * @param {number | null} index - The card's place on the shelf, or null when the hover ends
	 * @returns {Inspected | null}
	 */
	inspectPick(index) {
		const card = this.pickCards.find((c) => c.index === index);
		if (!card) {
			return null;
		}
		return {
			kind: this.cardPick?.kind === 'tech' ? 'tech' : 'tapestry',
			data: card.face,
			side: true,
		};
	}
}
