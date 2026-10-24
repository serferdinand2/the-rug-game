// Shared 8×8 style C sprites, enlarged to 24×24; income buildings are separate 32×32 drawings.
import { createCanvas } from './painter.js';
import { PALETTE } from './palette.js';

/** One reserved pixel channel is recolored by the gallery to show each player color. */
export const PLAYER_TOKEN_CHANNEL = PALETTE.stoneLight;
/** @type {Record<string, string>} */
const COLOUR_KEYS = {
	a: PALETTE.amber,
	b: PALETTE.brickRed,
	c: PALETTE.creamLight,
	d: PALETTE.timber,
	e: PALETTE.cream,
	g: PALETTE.grass,
	m: PALETTE.arcane,
	p: PALETTE.roofLight,
	r: PALETTE.brickRed,
	s: PALETTE.stone,
	t: PALETTE.timberLight,
	w: PALETTE.gold,
	y: PALETTE.gold,
	'~': PALETTE.daySea2,
	'^': PALETTE.dayWave,
	L: PALETTE.sandLight,
	D: PALETTE.sand,
	G: PALETTE.grassLight,
	K: PALETTE.stoneShade,
	M: PALETTE.stone,
	S: PALETTE.stoneLight,
};
/** @type {Record<string, string[]>} */
const SPRITES = {
	'resource/coin': [
		'..aaaa..',
		'.abbbba.',
		'abaccaab',
		'abaccaab',
		'abaccaab',
		'abaccaab',
		'.abbbba.',
		'..aaaa..',
	],
	'resource/worker': [
		'...ee...',
		'..eeee..',
		'...dd...',
		'..dddd..',
		'.dddddd.',
		'..d..d..',
		'..d..d..',
		'.dd..dd.',
	],
	'resource/food': [
		'...gg...',
		'..gggg..',
		'.gggggg.',
		'gggggggg',
		'..gggg..',
		'..gggg..',
		'..gggg..',
		'..gggg..',
	],
	'resource/culture': [
		'...pp...',
		'..pppp..',
		'.pppppp.',
		'pppppppp',
		'.pppppp.',
		'..pppp..',
		'...pp...',
		'...pp...',
	],
	'resource/any': [
		'..yyyy..',
		'.y....y.',
		'y..ww..y',
		'y.wwww.y',
		'y..ww..y',
		'.y....y.',
		'..yyyy..',
		'...yy...',
	],
	'piece/token': [
		'........',
		'...pp...',
		'..pppp..',
		'.pppppp.',
		'pppppppp',
		'pppppppp',
		'.pppppp.',
		'..pppp..',
	],
	'terrain/sea': [
		'........',
		'........',
		'..~~~...',
		'.~~^~~..',
		'~~...~~.',
		'........',
		'........',
		'........',
	],
	'terrain/desert': [
		'........',
		'......L.',
		'.....LLL',
		'...LLLDD',
		'..LLDDDD',
		'.LLDDDDD',
		'LLDDDDDD',
		'DDDDDDDD',
	],
	'terrain/forest': [
		'...gg...',
		'..gggg..',
		'.gggggg.',
		'...tt...',
		'..tttt..',
		'..tttt..',
		'.tttttt.',
		'tttttttt',
	],
	'terrain/grassland': [
		'........',
		'....G...',
		'...GG...',
		'..G.gG..',
		'..G.gG..',
		'.GG.gGG.',
		'...gg...',
		'..gggg..',
	],
	'terrain/mountain': [
		'....S...',
		'...SSS..',
		'..SSMSS.',
		'.SSMMMSS',
		'SSMMMMMS',
		'SMMMMMMS',
		'KMMMMMMK',
		'KKKKKKKK',
	],
	'track/exploration': [
		'...bb...',
		'..b.bb..',
		'.b...bb.',
		'bbbbbbbb',
		'...bb...',
		'...bb...',
		'...bb...',
		'...bb...',
	],
	'track/science': [
		'..tttt..',
		'.t....t.',
		'..t..t..',
		'...tt...',
		'...tt...',
		'..t..t..',
		'.t....t.',
		'..tttt..',
	],
	'track/technology': [
		'...gg...',
		'..g..g..',
		'..g..g..',
		'..gggg..',
		'..g..g..',
		'..g..g..',
		'..g..g..',
		'..g..g..',
	],
	'track/military': [
		'...rr...',
		'..rrrr..',
		'.rrrrrr.',
		'...rr...',
		'...rr...',
		'...rr...',
		'...rr...',
		'...rr...',
	],
	'track/arts': [
		'...pp...',
		'..pppp..',
		'.pp..pp.',
		'...pp...',
		'...pp...',
		'...pp...',
		'..pppp..',
		'.pp..pp.',
	],
	'symbol/victory-points': [
		'...yy...',
		'..yyyy..',
		'.yy..yy.',
		'....yy..',
		'...yy...',
		'..yy....',
		'..yyyy..',
		'.yyyyy..',
	],
	'symbol/territory-tile': [
		'..ssss..',
		'.s....s.',
		's.ssss.s',
		's.s..s.s',
		's.s..s.s',
		's.ssss.s',
		'.s....s.',
		'..ssss..',
	],
	'symbol/tapestry-card': [
		'.cccccc.',
		'c......c',
		'c..rr..c',
		'c......c',
		'c..gg..c',
		'c......c',
		'c......c',
		'.cccccc.',
	],
	'symbol/tech-card': [
		'.cccccc.',
		'c......c',
		'c..tt..c',
		'c..tt..c',
		'c..tt..c',
		'c......c',
		'c......c',
		'.cccccc.',
	],
	'symbol/space-tile': [
		'..mmmm..',
		'.m....m.',
		'm......m',
		'm......m',
		'm......m',
		'm......m',
		'.m....m.',
		'..mmmm..',
	],
};
/** @type {[string, string, string][]} */
const DICE = [
	['science-exploration', 'Science die: exploration', 'track/exploration'],
	['science-science', 'Science die: science', 'track/science'],
	['science-technology', 'Science die: technology', 'track/technology'],
	['science-military', 'Science die: military', 'track/military'],
	['red-4-vp', 'Red die: 4 VP', 'symbol/victory-points'],
	['red-5-vp', 'Red die: 5 VP', 'symbol/victory-points'],
	['red-6-vp', 'Red die: 6 VP', 'symbol/victory-points'],
	['red-7-vp', 'Red die: 7 VP', 'symbol/victory-points'],
	[
		'red-vp-per-territory',
		'Red die: 1 VP per territory',
		'symbol/territory-tile',
	],
	['black-coin', 'Black die: coin', 'resource/coin'],
	['black-worker', 'Black die: worker', 'resource/worker'],
	['black-food', 'Black die: food', 'resource/food'],
	['black-culture', 'Black die: culture', 'resource/culture'],
	['black-tile-benefit', 'Black die: tile benefit (?)', 'symbol/space-tile'],
	['science-arts', 'Science die: arts', 'track/arts'],
];

/** Draws any issue #5 symbol at the required 24×24 review size. @param {string} id */
export function drawIcon(id) {
	const rows = SPRITES[id] ?? drawDieRows(id);
	const c = createCanvas(24, 24);
	const colours =
		id === 'piece/token'
			? { ...COLOUR_KEYS, p: PLAYER_TOKEN_CHANNEL }
			: id.startsWith('die/')
				? dieColours(id)
				: id.startsWith('track/')
					? trackColours(id)
					: COLOUR_KEYS;
	rows.forEach((row, y) =>
		[...row].forEach((key, x) => {
			if (colours[key])
				for (let dy = 0; dy < 3; dy++)
					for (let dx = 0; dx < 3; dx++)
						c.p[(y * 3 + dy) * 24 + x * 3 + dx] = colours[key];
		})
	);
	return c;
}
/** @param {string} id @returns {Record<string, string>} */
function dieColours(id) {
	const slug = id.slice(4);
	return {
		i: slug.startsWith('red')
			? PALETTE.brickRed
			: slug.startsWith('black')
				? PALETTE.stoneShade
				: PALETTE.cream,
		s: slug.startsWith('science') ? PALETTE.teal : PALETTE.gold,
	};
}
/** @param {string} id @returns {Record<string, string>} */
function trackColours(id) {
	const track = id.slice(6);
	const colour =
		{
			exploration: PALETTE.teal,
			science: PALETTE.grass,
			technology: PALETTE.gold,
			military: PALETTE.brickRed,
			arts: PALETTE.arcane,
		}[track] || '';
	const key =
		{
			exploration: 'b',
			science: 't',
			technology: 'g',
			military: 'r',
			arts: 'p',
		}[track] || '';
	return { ...COLOUR_KEYS, [key]: colour };
}
/** @param {string} id @returns {string[]} */
function drawDieRows(id) {
	const entry = DICE.find(([slug]) => slug === id.slice(4));
	if (!entry) throw new Error('Unknown icon: ' + id);
	const symbol = entry[2];
	const stamp = SPRITES[symbol] ?? SPRITES['symbol/victory-points'];
	const base = [
		'..iiii..',
		'.iiiiii.',
		'iiiiiiii',
		'iii..iii',
		'iii..iii',
		'iiiiiiii',
		'.iiiiii.',
		'..iiii..',
	];
	return base.map((row, y) =>
		[...row]
			.map((ch, x) =>
				ch === 'i'
					? 'i'
					: x >= 2 &&
						  x < 6 &&
						  y >= 2 &&
						  y < 6 &&
						  stamp[y - 1]?.[x - 1] !== '.'
						? 's'
						: '.'
			)
			.join('')
	);
}
