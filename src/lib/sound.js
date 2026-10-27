// Sound cues (#29 design §7): the one cue a batch of fresh events earns, and a small Web Audio player for the five CC0 interface sounds Bird Table uses.

/** @typedef {'turn' | 'move' | 'place' | 'reward' | 'over'} Cue */

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
});

/** The events that earn each cue; the first cue in this list that a batch earns plays. */
const ORDER = /** @type {readonly Cue[]} */ ([
	'over',
	'reward',
	'turn',
	'place',
	'move',
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
		default:
			return event.type === 'tokenMoved';
	}
}

/**
 * The one cue a batch of fresh events earns: the most important, so a busy batch is not noisy.
 * @param {{ type: string, player?: number }[]} events
 * @param {number | null} seat
 * @returns {Cue | null}
 */
export function cueFor(events, seat) {
	return (
		ORDER.find((cue) => events.some((event) => earns(cue, event, seat))) ??
		null
	);
}

/**
 * A player for the cues. Audio needs a gesture before it may start, so `unlock` runs on the first click or key;
 * a missing or undecodable file is skipped, and nothing it does ever throws.
 * @param {{ base?: string }} [options] - Where the files are, '/audio/' by default
 * @returns {{ unlock: () => void, play: (cue: Cue) => void }}
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

	/** @param {Cue} cue */
	const play = (cue) => {
		const buffer = buffers.get(cue);
		if (!context || !buffer || context.state !== 'running') {
			return;
		}
		try {
			const source = context.createBufferSource();
			const gain = context.createGain();
			gain.gain.value = 0.25;
			source.buffer = buffer;
			source.connect(gain);
			gain.connect(context.destination);
			source.start();
		} catch {
			// Never interrupt the game for a sound.
		}
	};

	return { unlock, play };
}
