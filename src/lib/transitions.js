// The game's transitions (#175): Svelte transitions, the track token's hop and the deal of cards and tiles (#176), each timed by the motion tokens and still under reduced motion.
import { flip } from 'svelte/animate';
import { msOf, prefersReducedMotion } from './motion.js';
import { soundCue } from './sound.js';

/**
 * The page's window, or none in Node: what motion.js reads reduced motion from, and the page's styles.
 * @typedef {NonNullable<Parameters<typeof prefersReducedMotion>[0]> & {
 *   document?: { documentElement: any },
 *   getComputedStyle?: (element: any) => { getPropertyValue: (name: string) => string, transform: string },
 * }} MotionView
 */

/** tokens.css's motion durations, in milliseconds: what a transition takes where the page can't be read. */
export const DURATIONS = Object.freeze({
	fast: 150,
	medium: 220,
	slow: 380,
	exit: 140,
	focal: 600,
});

/** How long one hop of a track token takes, from one space to the next, until the focal time caps the whole run. */
export const HOP_MS = 170;

/** @returns {MotionView | undefined} */
function pageView() {
	return typeof window === 'undefined'
		? undefined
		: /** @type {MotionView} */ (/** @type {unknown} */ (window));
}

/**
 * A motion token's duration in milliseconds, as the page declares it: 0 under reduced motion.
 * @param {keyof typeof DURATIONS} name - Such as 'medium' for --duration-medium
 * @param {MotionView} [view] - The page's window; none in Node
 * @returns {number}
 */
export function motionMs(name, view = pageView()) {
	if (prefersReducedMotion(view)) {
		return 0;
	}
	const root = view?.document?.documentElement;
	const value = root
		? view?.getComputedStyle?.(root).getPropertyValue(`--duration-${name}`)
		: '';
	return value?.trim() ? msOf(value) : DURATIONS[name];
}

/** The --ease-out token, for the Web Animations API, which can't read a custom property. */
export const EASE_OUT = 'cubic-bezier(0.2, 0.75, 0.25, 1)';

/** An ease-out that slows like the --ease-out token, for Svelte's JavaScript-timed transitions. */
export const easeOut = (/** @type {number} */ t) => 1 - (1 - t) ** 4;

/**
 * The element's own transform, so a transition adds to it rather than replacing it.
 * @param {Element} node
 * @param {MotionView | undefined} view
 * @returns {string}
 */
function baseTransform(node, view) {
	const transform = view?.getComputedStyle?.(node).transform ?? 'none';
	return transform === 'none' ? '' : `${transform} `;
}

/**
 * A Svelte transition: the element fades in while it moves from an offset and grows from a scale to where it rests;
 * as an out transition, the same in reverse.
 * @param {Element} node
 * @param {{ x?: number, y?: number, scale?: number, delay?: number, speed?: keyof typeof DURATIONS, view?: MotionView }} [options]
 * @returns {import('svelte/transition').TransitionConfig}
 */
export function rise(
	node,
	{
		x = 0,
		y = 8,
		scale = 1,
		delay = 0,
		speed = 'medium',
		view = pageView(),
	} = {}
) {
	const base = baseTransform(node, view);
	return {
		delay,
		duration: motionMs(speed, view),
		easing: easeOut,
		css: (t, u) =>
			`opacity: ${t}; transform: ${base}translate(${x * u}px, ${y * u}px) scale(${1 - (1 - scale) * u})`,
	};
}

/**
 * Plays an entrance on an element already in place, with the Web Animations API: from an offset, a scale and an
 * opacity to where it rests. For content that changes inside an element that stays, such as a tab's panel. It ends on
 * no transform, so it suits an element without a transform of its own; rise keeps one.
 * @param {any} element - The element, which needs animate()
 * @param {{ x?: number, y?: number, scale?: number, opacity?: number }} from
 * @param {{ speed?: keyof typeof DURATIONS, delay?: number, view?: MotionView }} [options]
 * @returns {Animation | null} The entrance, or null when nothing plays (reduced motion, no API)
 */
export function enter(
	element,
	{ x = 0, y = 0, scale = 1, opacity = 0 },
	{ speed = 'medium', delay = 0, view = pageView() } = {}
) {
	const duration = motionMs(speed, view);
	if (duration === 0 || typeof element?.animate !== 'function') {
		return null;
	}
	return element.animate(
		[
			{ opacity, transform: `translate(${x}px, ${y}px) scale(${scale})` },
			{ opacity: 1, transform: 'none' },
		],
		{ duration, delay, easing: EASE_OUT }
	);
}

/**
 * A Svelte animation for a keyed list's items moving to their new places, such as cards closing a gap: Svelte's flip,
 * timed by the motion tokens.
 * @param {Element} node
 * @param {{ from: DOMRect, to: DOMRect }} rects
 * @returns {import('svelte/animate').AnimationConfig}
 */
export function glide(node, rects) {
	return flip(node, rects, { duration: motionMs('medium'), easing: easeOut });
}

/**
 * One key per item of a list, for a keyed each block whose items may repeat, such as a hand holding two traps: an
 * item's own text, then a count of its copies before it. A card played from the middle keeps the others' keys, so
 * they glide into place rather than change faces.
 * @param {readonly (string | number)[]} items
 * @returns {string[]}
 */
export function listKeys(items) {
	/** @type {Map<string, number>} */
	const seen = new Map();
	return items.map((item) => {
		const text = String(item);
		const copies = (seen.get(text) ?? 0) + 1;
		seen.set(text, copies);
		return copies === 1 ? text : `${text} ${copies}`;
	});
}

/**
 * How a track token travels from one position to another: one hop a space, each HOP_MS long, until the whole run
 * would take longer than the time given, which then shares out among the hops.
 * @param {number} from - The position it left
 * @param {number} to - The position it reached
 * @param {number} limit - The longest the run may take, in milliseconds (the focal duration)
 * @returns {{ hops: number, hopMs: number, totalMs: number }}
 */
export function hopPlan(from, to, limit) {
	const hops = Math.abs(to - from);
	if (hops === 0 || limit <= 0) {
		return { hops: 0, hopMs: 0, totalMs: 0 };
	}
	const hopMs = Math.min(HOP_MS, limit / hops);
	return { hops, hopMs, totalMs: hops * hopMs };
}

/**
 * The keyframes of a token's hops, for the Web Animations API: it rises to the lift halfway to each space, slowing,
 * and falls onto the space, speeding up.
 * @param {number} hops
 * @param {number} lift - How high it rises, in pixels
 * @returns {Keyframe[]}
 */
export function hopFrames(hops, lift) {
	if (hops <= 0) {
		return [];
	}
	/** @type {Keyframe[]} */
	const frames = [];
	for (let step = 0; step <= hops * 2; step += 1) {
		const up = step % 2 === 1;
		frames.push({
			offset: step / (hops * 2),
			transform: `translateY(${up ? -lift : 0}px)`,
			easing: up ? 'ease-in' : 'ease-out',
		});
	}
	return frames;
}

/** A token's squash as it lands and springs back, from its bottom edge. */
const LANDING = [{ transform: 'scale(1.14, 0.84)' }, { transform: 'scale(1)' }];

/** The ring that spreads from the space a token reached, and fades. */
const RING = [
	{ opacity: 0.9, transform: 'scale(0.6)' },
	{ opacity: 0, transform: 'scale(1.9)' },
];

/**
 * Each track marker's last position, so a new one hops from it, and what its last hop left playing, so a new hop
 * replaces it while a mere redraw leaves it be.
 * @type {WeakMap<object, { position: number, playing: { cancel(): void }[], timer?: ReturnType<typeof setTimeout> }>}
 */
const markers = new WeakMap();

/**
 * A Svelte attachment for a track marker (#175), the focal moment: when its player's position changes, the token hops
 * space by space as the marker slides, squashes as it lands, and a ring in the player's colour spreads from the
 * space. Nothing hops the first time a marker shows, nor under reduced motion, where the marker moves at once. The
 * board redraws often (each room update makes the attachment run again), so a run at the same position changes
 * nothing; only a new position stops the last hop and starts its own.
 * The marker's first child is the token; its ::after draws the ring.
 * @param {number} position - The player's position on the track
 * @param {MotionView} [view] - The page's window; none in Node
 * @returns {(marker: any) => void}
 */
export function tokenHop(position, view = pageView()) {
	return (marker) => {
		const last = markers.get(marker);
		if (!last) {
			markers.set(marker, { position, playing: [] });
			return;
		}
		if (last.position === position) {
			return;
		}
		const from = last.position;
		last.position = position;
		for (const animation of last.playing) {
			animation.cancel();
		}
		last.playing = [];
		clearTimeout(last.timer);
		marker.style.transitionDuration = '';
		marker.style.transitionTimingFunction = '';
		const plan = hopPlan(from, position, motionMs('focal', view));
		const token = marker.firstElementChild;
		if (plan.hops === 0 || typeof token?.animate !== 'function') {
			return;
		}
		marker.style.transitionDuration = `${plan.totalMs}ms`;
		marker.style.transitionTimingFunction = 'linear';
		last.playing = [
			token.animate(hopFrames(plan.hops, token.offsetHeight * 0.45), {
				duration: plan.totalMs,
			}),
			token.animate(LANDING, {
				duration: motionMs('medium', view),
				delay: plan.totalMs,
				easing: 'ease-out',
			}),
			marker.animate(RING, {
				duration: motionMs('slow', view),
				delay: plan.totalMs,
				easing: 'ease-out',
				pseudoElement: '::after',
			}),
		];
		// Once the slide has started, the marker's own timing comes back, so a later shuffle among tokens is quick.
		last.timer = setTimeout(() => {
			marker.style.transitionDuration = '';
			marker.style.transitionTimingFunction = '';
		}, plan.totalMs);
	};
}

/** The deal's own ease (#176): fast off the deck, settling softly into place. */
const DEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** How far a card turns as it leaves the deck, in degrees. */
const DEAL_TURN = -14;

/**
 * The offset a dealt card flies in from (#176): every card of a row leaves the same deck point, `reach` px left of the
 * row's start and `drop` px below its top, so a card further along the row travels further.
 * @param {{ left: number, top: number }} card - The card's box on the page
 * @param {{ left: number, top: number }} row - Its row's box
 * @param {{ reach?: number, drop?: number }} [options]
 * @returns {{ dx: number, dy: number }}
 */
export function deckOffset(card, row, { reach = 320, drop = 60 } = {}) {
	return { dx: row.left - reach - card.left, dy: row.top + drop - card.top };
}

/**
 * A dealt card's flight, for the Web Animations API: from the deck, turned and unseen, showing within its first fifth,
 * to where it rests.
 * @param {{ dx: number, dy: number }} from
 * @returns {Keyframe[]}
 */
export function dealFrames({ dx, dy }) {
	return [
		{
			transform: `translate(${dx}px, ${dy}px) rotate(${DEAL_TURN}deg)`,
			opacity: 0,
		},
		{ opacity: 1, offset: 0.2 },
		{ transform: 'none', opacity: 1 },
	];
}

/**
 * When the nth card of a deal leaves the deck (#176): 130 ms apart for the first five, 60 ms apart after them, and
 * none later than 900 ms, so a long shelf doesn't keep anyone waiting.
 * @param {number} index - The card's place in the deal, from 0
 * @returns {number} Milliseconds
 */
export function dealDelay(index) {
	const at = index <= 4 ? index * 130 : 520 + (index - 4) * 60;
	return Math.min(Math.max(at, 0), 900);
}

/**
 * A deal: the cards and tiles that appear within 120 ms of one another, wherever they are, are dealt in turn.
 * @returns {{ next: (now: number) => number, place: () => number }} next gives a card's delay; place, the last card's place in its deal
 */
export function createDealQueue() {
	let last = -Infinity;
	let count = 0;
	return {
		next(now) {
			if (now - last > 120) {
				count = 0;
			}
			last = now;
			const delay = dealDelay(count);
			count += 1;
			return delay;
		},
		place: () => count - 1,
	};
}

/** The page's one deal queue, which every row shares. */
const DEALS = createDealQueue();

/** Each whoosh's rate in turn, so a deal doesn't sound like one sample repeated. */
const RATES = [1, 1.07, 0.94, 1.12];

/**
 * @typedef {Object} DealOptions
 * @property {MotionView} [view] - The page's window; none in Node
 * @property {ReturnType<typeof createDealQueue>} [queue] - The deal the card joins; the page's by default
 * @property {() => number} [now] - The time, performance.now() by default
 * @property {(cue: 'deal', options: { rate: number }) => void} [sound] - Sounds the whoosh; soundCue by default
 * @property {() => boolean} [when] - Whether the list now deals what appears: false while it first shows, for a list
 *   such as the hand that deals only what is drawn later; left out, everything is dealt as it shows, as on a shelf
 */

/**
 * Where the card flies from, when, and its whoosh, or null when nothing moves (reduced motion).
 * @param {any} node
 * @param {DealOptions} options
 */
function dealOf(
	node,
	{ view = pageView(), queue = DEALS, now, sound = soundCue }
) {
	const duration = motionMs('slow', view);
	if (duration === 0) {
		return null;
	}
	const delay = queue.next(
		now ? now() : typeof performance === 'undefined' ? 0 : performance.now()
	);
	const rate = RATES[queue.place() % RATES.length];
	const box = node.getBoundingClientRect();
	const row = node.parentElement?.getBoundingClientRect?.() ?? box;
	const timer = setTimeout(() => sound('deal', { rate }), delay);
	return { duration, delay, from: deckOffset(box, row), timer };
}

/** The cards already dealt, so a redraw deals none of them again. */
const dealtCards = new WeakSet();

/**
 * A Svelte attachment for a card or tile (#176): it is dealt in once, flying from the deck point of its row (its parent)
 * after the cards before it in the deal, with a whoosh as it leaves. A shelf deals what it shows; a list given `when`,
 * such as the hand, deals only what is drawn while it is on show. Nothing moves or sounds under reduced motion.
 * @param {DealOptions} [options]
 * @returns {(node: any) => void}
 */
export function dealIn(options = {}) {
	return (node) => {
		if (dealtCards.has(node)) {
			return;
		}
		dealtCards.add(node);
		if (options.when && !options.when()) {
			return;
		}
		const deal =
			typeof node.animate === 'function' ? dealOf(node, options) : null;
		if (!deal) {
			return;
		}
		node.animate(dealFrames(deal.from), {
			duration: deal.duration,
			delay: deal.delay,
			easing: DEAL_EASE,
			fill: 'backwards',
		});
	};
}
