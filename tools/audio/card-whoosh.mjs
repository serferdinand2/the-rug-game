// Synthesizes static/audio/card_whoosh.ogg, a card or tile dealt in (#176): air rushing past a card as it leaves the deck, then a soft slap of card on felt as it lands. Needs ffmpeg; run `node tools/audio/card-whoosh.mjs`.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44100;
/** About as long as a card's flight (the slow motion token, 380 ms), with the slap's tail. */
const LENGTH = 0.36;
/** When the card lands: its ease puts it nearly in place a little after half its flight. */
const LANDING = 0.2;

/** A small seeded generator, so the file comes out the same each time. */
function random(seed = 176) {
	let state = seed >>> 0;
	return () => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
		return state / 2 ** 32;
	};
}

const next = random();
const samples = new Float64Array(Math.ceil(LENGTH * RATE));

/**
 * A band-pass filter whose centre moves, as air does past a card that speeds by (the RBJ cookbook's constant-gain
 * band-pass, its coefficients worked out again for every sample).
 * @param {(t: number) => number} centre - Hz at each second
 * @param {number} q
 * @returns {(input: number, t: number) => number}
 */
function sweep(centre, q) {
	let x1 = 0;
	let x2 = 0;
	let y1 = 0;
	let y2 = 0;
	return (input, t) => {
		const w = (2 * Math.PI * centre(t)) / RATE;
		const alpha = Math.sin(w) / (2 * q);
		const a0 = 1 + alpha;
		const b0 = alpha / a0;
		const b2 = -alpha / a0;
		const a1 = (-2 * Math.cos(w)) / a0;
		const a2 = (1 - alpha) / a0;
		const output = b0 * input + b2 * x2 - a1 * y1 - a2 * y2;
		x2 = x1;
		x1 = input;
		y2 = y1;
		y1 = output;
		return output;
	};
}

// The whoosh: noise through a band that rises as the card speeds off the deck and falls as it slows into place,
// swelling quickly and fading by the landing.
const air = sweep((t) => {
	const peak = 0.07;
	return t < peak
		? 700 + (2600 - 700) * (t / peak)
		: 2600 - (2600 - 900) * Math.min(1, (t - peak) / 0.18);
}, 1.4);
const body = sweep(() => 420, 0.9);
for (let i = 0; i < samples.length; i++) {
	const t = i / RATE;
	const swell = t < 0.06 ? (t / 0.06) ** 2 : Math.exp(-(t - 0.06) / 0.055);
	const white = next() * 2 - 1;
	samples[i] += swell * (air(white, t) * 0.9 + body(white, t) * 0.35);
}

// The slap: a short burst of mid noise and the felt's low thud, as the card lands.
let low = 0;
const first = Math.round(LANDING * RATE);
for (let i = 0; first + i < samples.length; i++) {
	const t = i / RATE;
	const white = next() * 2 - 1;
	low += (white - low) * 0.25;
	samples[first + i] +=
		Math.exp(-t / 0.006) * low * 0.55 +
		Math.exp(-t / 0.02) * Math.sin(2 * Math.PI * 150 * t) * 0.12;
}

// Fade the last few milliseconds, so nothing clicks at the end.
const tail = Math.round(0.02 * RATE);
for (let i = 0; i < tail; i++) {
	samples[samples.length - 1 - i] *= i / tail;
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

const folder = mkdtempSync(join(tmpdir(), 'rg-whoosh-'));
const source = join(folder, 'card_whoosh.wav');
const target = fileURLToPath(
	new URL('../../static/audio/card_whoosh.ogg', import.meta.url)
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
	throw new Error('ffmpeg could not encode card_whoosh.ogg');
}
console.log(`Wrote ${target}`);
