// Sound cues (#29 design §7): the one cue a batch of fresh events earns, a small Web Audio player for the five CC0 interface sounds Bird Table uses, and the shared player a component sounds a cue through (#176).

/** @typedef {'turn' | 'move' | 'place' | 'reward' | 'over' | 'dice' | 'deal'} Cue */

/**
 * The file each cue plays, in static/audio/ as .ogg (Kenney's Interface Sounds 1.0, CC0).
 * @type {Readonly<Record<Cue, string>>}
 */
export const CUES = Object.freeze({
	turn: 'select_001',
	move: 'click_001',
	place: 'drop_001',
	reward: 'confirmation_001',
	over: 'confirmation_004',
	// A roll (#61): our own clatter, synthesized by tools/audio/dice-roll.mjs in time with Die's tumble.
	dice: 'dice_roll',
	// A card or tile dealt in (#176): our own whoosh, synthesized by tools/audio/card-whoosh.mjs. No event earns it; the
	// card sounds it as it leaves the deck, through soundCue().
	deal: 'card_whoosh',
});

/** The events that earn each cue; the first cue in this list that a batch earns plays. */
const ORDER = /** @type {readonly Cue[]} */ ([
	'over',
	'reward',
	'dice',
	'turn',
	'place',
	'move',
]);

/** The events that roll dice (#61). */
const ROLLS = new Set([
	'scienceDieRolled',
	'conquerDiceRolled',
	'surrenderRolled',
	'treasureRolled',
	'alchemistsRolled',
	'alchemistsBust',
]);
const PLACE = new Set([
	'buildingPlaced',
	'landmarkPlaced',
	'outpostPlaced',
	'explored',
	'conquered',
	'spaceExplored',
	'tokenPlaced',
	'piecePlacedOnMap',
]);

/**
 * Whether an event earns a cue, for the viewer.
 * @param {Cue} cue
 * @param {{ type: string, player?: number }} event
 * @param {number | null} seat - The viewer's seat; null at a hot-seat table, where every turn is someone's at the screen
 * @returns {boolean}
 */
function earns(cue, event, seat) {
	switch (cue) {
		case 'over':
			return event.type === 'gameEnded';
		case 'reward':
			return (
				event.type === 'achievementClaimed' ||
				event.type === 'landmarkGained'
			);
		case 'turn':
			return (
				event.type === 'turnStarted' &&
				(seat === null || event.player === seat)
			);
		case 'place':
			return PLACE.has(event.type);
		case 'dice':
			return ROLLS.has(event.type);
		default:
			return event.type === 'tokenMoved';
	}
}

/**
 * The one cue a batch of fresh events earns: the most important, so a busy batch is not noisy. Only the batch's last
 * `turnStarted` can earn the turn cue: the turns before it started and ended inside the batch, such as each seat's
 * income turn 1 as setup ends (#77).
 * @param {{ type: string, player?: number }[]} events
 * @param {number | null} seat
 * @returns {Cue | null}
 */
export function cueFor(events, seat) {
	const last = events.findLast((event) => event.type === 'turnStarted');
	const heard = events.filter(
		(event) => event.type !== 'turnStarted' || event === last
	);
	return (
		ORDER.find((cue) => heard.some((event) => earns(cue, event, seat))) ??
		null
	);
}

/**
 * A player for the cues. Audio needs a gesture before it may start, so `unlock` runs on the first click or key;
 * a missing or undecodable file is skipped, and nothing it does ever throws.
 * @param {{ base?: string }} [options] - Where the files are, '/audio/' by default
 * @returns {{ unlock: () => void, play: (cue: Cue, options?: { rate?: number }) => void }}
 */
export function createSoundPlayer({ base = '/audio/' } = {}) {
	/** @type {AudioContext | null} */
	let context = null;
	/** @type {Promise<void> | null} */
	let loading = null;
	/** @type {Map<Cue, AudioBuffer>} */
	const buffers = new Map();

	const unlock = () => {
		try {
			if (!context) {
				const Audio = window.AudioContext;
				if (!Audio) {
					return;
				}
				context = new Audio();
			}
			if (context.state !== 'running') {
				context.resume().catch(() => {});
			}
			const audio = context;
			loading ??= Promise.all(
				/** @type {[Cue, string][]} */ (Object.entries(CUES)).map(
					async ([cue, file]) => {
						try {
							const response = await fetch(`${base}${file}.ogg`);
							if (response.ok) {
								buffers.set(
									cue,
									await audio.decodeAudioData(
										await response.arrayBuffer()
									)
								);
							}
						} catch {
							// A cue that can't load stays silent.
						}
					}
				)
			).then(() => {});
		} catch {
			// Audio is optional: the next gesture tries again.
		}
	};

	/**
	 * @param {Cue} cue
	 * @param {{ rate?: number }} [options] - The playback rate, so a row of the same cue doesn't sound like one sample
	 */
	const play = (cue, { rate = 1 } = {}) => {
		const buffer = buffers.get(cue);
		if (!context || !buffer || context.state !== 'running') {
			return;
		}
		try {
			const source = context.createBufferSource();
			const gain = context.createGain();
			gain.gain.value = 0.25;
			source.buffer = buffer;
			source.playbackRate.value = rate;
			source.connect(gain);
			gain.connect(context.destination);
			source.start();
		} catch {
			// Never interrupt the game for a sound.
		}
	};

	return { unlock, play };
}

/**
 * The shared player and whether sound is on, which App hands over (#176); none in Node and the component library.
 * @type {{ play: (cue: Cue, options?: { rate?: number }) => void, enabled: () => boolean } | null}
 */
let shared = null;

/**
 * Shares the game's player, so a component can sound a cue that no event carries, such as a card dealt (#176).
 * @param {{ play: (cue: Cue, options?: { rate?: number }) => void, enabled: () => boolean } | null} player - App's player and its sound switch; null to stop
 */
export function shareSounds(player) {
	shared = player;
}

/**
 * Sounds a cue through the shared player, while sound is on; otherwise nothing.
 * @param {Cue} cue
 * @param {{ rate?: number }} [options]
 */
export function soundCue(cue, options) {
	if (shared?.enabled()) {
		shared.play(cue, options);
	}
}
