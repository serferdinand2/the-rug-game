// Synthesizes static/audio/dice_roll.ogg, the dice tray's roll (#61): a die clattering on a wooden tray, timed to Die's tumble. Needs ffmpeg; run `node tools/audio/dice-roll.mjs`.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TUMBLE_MS } from '../../src/lib/dice.js';

const RATE = 44100;
/** The sound runs past the tumble a little, so the last click rings out. */
const LENGTH = TUMBLE_MS / 1000 + 0.15;

/**
 * Each strike, at a share of the tumble (Die.svelte's rg-die-tumble keyframes: hits at 20%, 44% and 64%, then it
 * rocks still), with how hard it lands and how many quick clicks it makes (an edge, a corner, then a face).
 * @type {{ at: number, force: number, clicks: number }[]}
 */
const STRIKES = [
	{ at: 0.2, force: 1, clicks: 4 },
	{ at: 0.44, force: 0.7, clicks: 3 },
	{ at: 0.64, force: 0.45, clicks: 3 },
	// It tips over its edges as it rolls on, each tip slower and softer.
	{ at: 0.69, force: 0.22, clicks: 1 },
	{ at: 0.725, force: 0.2, clicks: 1 },
	{ at: 0.765, force: 0.17, clicks: 2 },
	{ at: 0.82, force: 0.12, clicks: 1 },
	{ at: 0.88, force: 0.08, clicks: 2 },
];

/** A small seeded generator, so the file comes out the same each time. */
function random(seed = 61) {
	let state = seed >>> 0;
	return () => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
		return state / 2 ** 32;
	};
}

const next = random();
/** @param {number} low @param {number} high */
const between = (low, high) => low + next() * (high - low);

const samples = new Float64Array(Math.ceil(LENGTH * RATE));

/**
 * Adds a damped sine, a resonance of the die or the tray.
 * @param {number} start - Seconds
 * @param {number} frequency - Hz
 * @param {number} decay - Seconds to fall to about a third
 * @param {number} gain
 */
function ring(start, frequency, decay, gain) {
	const first = Math.round(start * RATE);
	const phase = next() * Math.PI * 2;
	for (let i = 0; i < decay * 6 * RATE && first + i < samples.length; i++) {
		const t = i / RATE;
		samples[first + i] +=
			gain *
			Math.exp(-t / decay) *
			Math.sin(2 * Math.PI * frequency * t + phase);
	}
}

/**
 * Adds a short burst of high noise, the tick of hard plastic on wood.
 * @param {number} start - Seconds
 * @param {number} gain
 */
function tick(start, gain) {
	const first = Math.round(start * RATE);
	let low = 0;
	for (let i = 0; i < 0.006 * RATE && first + i < samples.length; i++) {
		const white = next() * 2 - 1;
		// The highs above a smoothed copy: a bright tick, without the top the encoder drops anyway.
		low += (white - low) * 0.35;
		samples[first + i] +=
			gain * Math.exp(-i / (0.0012 * RATE)) * (white - low);
	}
}

/**
 * One click of the die on the tray: the die's own ring, the tick and, for a hard landing, the tray's thump.
 * @param {number} start - Seconds
 * @param {number} force - 0 to 1
 */
function click(start, force) {
	for (const base of [2300, 3700, 5600, 8100]) {
		ring(
			start,
			base * between(0.9, 1.1),
			between(0.006, 0.018),
			force * between(0.12, 0.25)
		);
	}
	tick(start, force * 0.5);
	if (force > 0.3) {
		ring(start, between(170, 260), 0.03, force * 0.35);
	}
}

for (const strike of STRIKES) {
	let at = (strike.at * TUMBLE_MS) / 1000;
	for (let i = 0; i < strike.clicks; i++) {
		click(at, strike.force * (i === 0 ? 1 : between(0.35, 0.7)));
		at += between(0.012, 0.035);
	}
}

// A small room: two soft early echoes.
const dry = Float64Array.from(samples);
for (const [delay, gain] of [
	[0.011, 0.18],
	[0.019, 0.1],
]) {
	const offset = Math.round(delay * RATE);
	for (let i = offset; i < samples.length; i++) {
		samples[i] += dry[i - offset] * gain;
	}
}

// Peak at -1 dB, as the interface sounds are.
const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
const scale = 10 ** (-1 / 20) / peak;

const wav = Buffer.alloc(44 + samples.length * 2);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + samples.length * 2, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(RATE, 24);
wav.writeUInt32LE(RATE * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(samples.length * 2, 40);
samples.forEach((value, i) => {
	wav.writeInt16LE(
		Math.round(Math.max(-1, Math.min(1, value * scale)) * 32767),
		44 + i * 2
	);
});

const folder = mkdtempSync(join(tmpdir(), 'rg-dice-'));
const source = join(folder, 'dice_roll.wav');
const target = fileURLToPath(
	new URL('../../static/audio/dice_roll.ogg', import.meta.url)
);
writeFileSync(source, wav);
const result = spawnSync(
	'ffmpeg',
	[
		'-y',
		'-loglevel',
		'error',
		'-i',
		source,
		'-ac',
		'2',
		'-c:a',
		'vorbis',
		'-strict',
		'-2',
		target,
	],
	{ stdio: 'inherit' }
);
rmSync(folder, { recursive: true });
if (result.status !== 0) {
	throw new Error('ffmpeg could not encode dice_roll.ogg');
}
console.log(`Wrote ${target}`);
