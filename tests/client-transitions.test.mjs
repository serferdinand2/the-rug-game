// The game's transitions (#175): their timing from the motion tokens, none under reduced motion, the stagger's cap and the track token's hop.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	DURATIONS,
	EASE_OUT,
	HOP_MS,
	enter,
	hopFrames,
	hopPlan,
	motionMs,
	rise,
	staggerDelay,
	tokenHop,
} from '../src/lib/transitions.js';

/**
 * A window whose matchMedia answers the reduced-motion query and whose root declares the given tokens.
 * @param {{ reduce?: boolean, tokens?: Record<string, string> }} [options]
 */
function view({ reduce = false, tokens = {} } = {}) {
	return {
		matchMedia: (/** @type {string} */ query) => ({
			matches: reduce && query === '(prefers-reduced-motion: reduce)',
		}),
		document: { documentElement: {} },
		getComputedStyle: () => ({
			getPropertyValue: (/** @type {string} */ name) =>
				tokens[name] ?? '',
			transform: 'none',
		}),
	};
}

test('the fallback durations are the motion tokens in tokens.css', () => {
	const css = readFileSync(
		new URL('../src/styles/tokens.css', import.meta.url),
		'utf8'
	);
	const root = css.slice(0, css.indexOf('@media'));
	for (const [name, ms] of Object.entries(DURATIONS)) {
		const value = root.match(new RegExp(`--duration-${name}:\\s*([^;]+);`));
		assert.ok(value, `tokens.css declares --duration-${name}`);
		assert.equal(value[1].trim(), `${ms}ms`, name);
	}
});

test('a duration is read from the page, and is 0 under reduced motion', () => {
	assert.equal(
		motionMs('medium', view({ tokens: { '--duration-medium': '0.3s' } })),
		300
	);
	assert.equal(motionMs('fast', view()), DURATIONS.fast);
	assert.equal(motionMs('focal', view({ reduce: true })), 0);
	assert.equal(motionMs('medium', undefined), DURATIONS.medium);
});

test('a stagger steps through a list and stops at its cap', () => {
	assert.equal(staggerDelay(0), 0);
	assert.equal(staggerDelay(2), 80);
	assert.equal(staggerDelay(40), 240);
	assert.equal(staggerDelay(3, { step: 100, cap: 250 }), 250);
	assert.equal(staggerDelay(-1), 0);
});

test('a token hops once a space, in no more than the focal time', () => {
	assert.deepEqual(hopPlan(4, 4, 600), { hops: 0, hopMs: 0, totalMs: 0 });
	assert.deepEqual(hopPlan(4, 7, 600), {
		hops: 3,
		hopMs: HOP_MS,
		totalMs: 3 * HOP_MS,
	});
	const far = hopPlan(0, 12, 600);
	assert.equal(far.hops, 12);
	assert.equal(far.totalMs, 600);
	assert.equal(far.hopMs, 50);
	assert.equal(hopPlan(6, 4, 600).hops, 2, 'a step back hops too');
	assert.equal(hopPlan(2, 5, 0).totalMs, 0, 'no time, no hop');
});

test("a hop's frames rise to the lift and land at every space", () => {
	const frames = hopFrames(2, 10);
	assert.deepEqual(
		frames.map((frame) => frame.offset),
		[0, 0.25, 0.5, 0.75, 1]
	);
	assert.deepEqual(
		frames.map((frame) => frame.transform),
		[
			'translateY(0px)',
			'translateY(-10px)',
			'translateY(0px)',
			'translateY(-10px)',
			'translateY(0px)',
		]
	);
	assert.equal(frames[0].easing, 'ease-out', 'it slows as it rises');
	assert.equal(frames[1].easing, 'ease-in', 'and speeds as it falls');
	assert.deepEqual(hopFrames(0, 10), []);
});

test('rise keeps what the element already has and ends where it rests', () => {
	const element = /** @type {Element} */ ({});
	const motion = rise(element, { y: 12, scale: 0.9, view: view() });
	assert.equal(motion.duration, DURATIONS.medium);
	assert.equal(motion.delay, 0);
	assert.match(motion.css(1, 0), /opacity: 1;/);
	assert.match(motion.css(1, 0), /translate\(0px, 0px\) scale\(1\)/);
	assert.match(motion.css(0, 1), /opacity: 0;/);
	assert.match(motion.css(0, 1), /translate\(0px, 12px\) scale\(0.9\)/);
	assert.equal(rise(element, { view: view({ reduce: true }) }).duration, 0);
	const turned = rise(element, {
		view: {
			...view(),
			getComputedStyle: () => ({
				getPropertyValue: () => '',
				transform: 'rotate(4deg)',
			}),
		},
	});
	assert.match(
		turned.css(0.5, 0.5),
		/^opacity: 0.5; transform: rotate\(4deg\) translate/
	);
});

/**
 * A track marker holding its token, both recording what they animate.
 * @returns {{ marker: any, played: { on: string, frames: any[], options: any }[] }}
 */
function markerWithToken() {
	/** @type {{ on: string, frames: any[], options: any, cancelled: boolean }[]} */
	const played = [];
	/** @param {string} on */
	const animating =
		(on) => (/** @type {any[]} */ frames, /** @type {any} */ options) => {
			const one = { on, frames, options, cancelled: false };
			played.push(one);
			return {
				cancel() {
					one.cancelled = true;
				},
			};
		};
	const token = { offsetHeight: 20, animate: animating('token') };
	const marker = {
		style: { transitionDuration: '', transitionTimingFunction: '' },
		firstElementChild: token,
		animate: animating('marker'),
	};
	return { marker, played };
}

test('a token hops only when its position changes, not when it first shows', () => {
	const { marker, played } = markerWithToken();
	tokenHop(4, view())(marker);
	assert.equal(played.length, 0, 'no hop on the first look');
	tokenHop(4, view())(marker);
	assert.equal(played.length, 0, 'no hop for the same space');
	tokenHop(7, view())(marker);
	const hops = played.find(
		(one) => one.on === 'token' && one.frames.length > 2
	);
	assert.ok(hops, 'the token hops');
	assert.deepEqual(hops.frames, hopFrames(3, 9));
	assert.equal(hops.options.duration, 3 * HOP_MS);
	assert.equal(
		marker.style.transitionDuration,
		`${3 * HOP_MS}ms`,
		'and slides as long'
	);
	assert.equal(marker.style.transitionTimingFunction, 'linear');
	assert.ok(
		played.some(
			(one) =>
				one.on === 'marker' && one.options.pseudoElement === '::after'
		),
		'a ring spreads where it lands'
	);
	// The board redraws for other reasons while the token hops: the hop plays on.
	tokenHop(7, view())(marker);
	assert.equal(hops.cancelled, false, 'a redraw leaves the hop playing');
	assert.equal(played.length, 3);
	// A new position before the hop ends starts a new one in its place.
	tokenHop(8, view())(marker);
	assert.equal(hops.cancelled, true, 'a new hop replaces it');
	assert.equal(played.length, 6);
});

test('a token moves without a hop under reduced motion', () => {
	const { marker, played } = markerWithToken();
	tokenHop(1, view({ reduce: true }))(marker);
	tokenHop(5, view({ reduce: true }))(marker);
	assert.equal(played.length, 0);
	assert.equal(marker.style.transitionDuration, '');
});

test('the ease-out the Web Animations use is the --ease-out token', () => {
	const css = readFileSync(
		new URL('../src/styles/tokens.css', import.meta.url),
		'utf8'
	);
	assert.equal(css.match(/--ease-out:\s*([^;]+);/)?.[1].trim(), EASE_OUT);
});

test('enter plays an entrance from an offset to where the element rests, unless motion is reduced', () => {
	/** @type {{ frames: any[], options: any }[]} */
	const played = [];
	const element = {
		animate: (/** @type {any[]} */ frames, /** @type {any} */ options) => {
			played.push({ frames, options });
			return { cancel() {} };
		},
	};
	enter(element, { x: 16, opacity: 0 }, { view: view() });
	assert.deepEqual(played[0].frames, [
		{ opacity: 0, transform: 'translate(16px, 0px) scale(1)' },
		{ opacity: 1, transform: 'none' },
	]);
	assert.equal(played[0].options.duration, DURATIONS.medium);
	assert.equal(played[0].options.easing, EASE_OUT);
	enter(
		element,
		{ y: 8, scale: 0.9 },
		{ speed: 'fast', delay: 40, view: view() }
	);
	assert.deepEqual(played[1].frames[0], {
		opacity: 0,
		transform: 'translate(0px, 8px) scale(0.9)',
	});
	assert.equal(played[1].options.duration, DURATIONS.fast);
	assert.equal(played[1].options.delay, 40);
	assert.equal(
		enter(element, { x: 4 }, { view: view({ reduce: true }) }),
		null
	);
	assert.equal(played.length, 2, 'nothing plays under reduced motion');
	assert.equal(
		enter({}, { x: 4 }, { view: view() }),
		null,
		'nor without the Web Animations API'
	);
});
