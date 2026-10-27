// The style C palette: every named colour the scene parts and drawings share.

/** @typedef {import('./painter.js').Colour} Colour */

const COLOURS = {
	// Outlines and darks
	ink: '#120c1e',
	night: '#1a1326',

	// Whitewash and cream walls
	white: '#ffffff',
	creamLight: '#fffaf0',
	cream: '#efe6d2',
	creamShade: '#c4b79f',

	// Brick red
	brickRedLight: '#e8675b',
	brickRed: '#c43c3c',
	brickRedShade: '#8a2534',

	// Lamp light and metal
	lampGlow: '#fff4bf',
	beamLight: '#fff1a8',
	gold: '#ffd25e',
	amber: '#e09a2b',
	brass: '#c9a24a',
	lampFrame: '#7a5a2a',

	// Roofs and dusk purples
	roofLight: '#6a5a92',
	roof: '#3b2d55',
	roofShade: '#271d3b',
	railLight: '#8a7bb5',

	// Stone
	stoneLight: '#b3afc2',
	stone: '#8a8797',
	stoneMid: '#7c7990',
	stoneShade: '#5c596c',

	// Wood and timber shingles
	wood: '#3a2a22',
	timberLight: '#9a6a40',
	timber: '#74492b',
	timberShade: '#4f301d',

	// Night sky, from the top down
	nightSky1: '#120d24',
	nightSky2: '#1a1434',
	nightSky3: '#241d47',
	nightSky4: '#30275a',
	nightSky5: '#3f336c',
	nightSky6: '#52427c',
	starDim: '#bdb4e6',
	moon: '#f8eecb',
	moonRim: '#e8d7a6',
	gull: '#d9d4f0',

	// Distant land at night
	headlandRidge: '#3a2f57',
	headland: '#241c3b',

	// Night sea, from the horizon down
	nightSeaLine: '#4a7fbf',
	nightSea1: '#24508e',
	nightSea2: '#1b3f74',
	nightSea3: '#132f5b',
	nightWave: '#5f97d4',
	nightWaveDeep: '#3a6aa8',
	foam: '#a9dcec',

	// Day sky, from the top down, and clouds
	daySky1: '#3b78c4',
	daySky2: '#4c8bd0',
	daySky3: '#5f9edb',
	daySky4: '#78b3e4',
	daySky5: '#94c7ec',
	daySky6: '#b6dbf2',
	cloudShade: '#d6e6f3',

	// Dusk sky, from the top down
	duskSky1: '#2a1f4f',
	duskSky2: '#47306b',
	duskSky3: '#6e3d78',
	duskSky4: '#a04c7a',
	duskSky5: '#d06872',
	duskSky6: '#f0965f',

	// Day sea, from the horizon down
	daySeaLine: '#a6dcf0',
	daySea1: '#4a9bd6',
	daySea2: '#3784c2',
	daySea3: '#286aa6',
	dayWave: '#bfe6f6',
	dayWaveDeep: '#6aaee0',

	// Grassland
	grassLight: '#9ccf5f',
	grass: '#6cae48',
	grassShade: '#4a8a3a',

	// Forest floor and pines
	forestFloorLight: '#5f9a45',
	forestFloor: '#3f7536',
	forestFloorShade: '#2b5530',
	pineLight: '#4f9a55',
	pine: '#2f7445',
	pineShade: '#1f5237',

	// Desert sand
	sandLight: '#f3dca2',
	sand: '#e2c07a',
	sandShade: '#c79d5a',

	// Mountain snow
	snow: '#f4f7fb',
	snowShade: '#c9d3e3',

	// People: three skin tones, from light to deep, each lit and shaded
	skin: '#e9b48a',
	skinShade: '#c58c66',
	skinTan: '#c68a5c',
	skinTanShade: '#9a6340',
	skinDeep: '#7d4b31',
	skinDeepShade: '#56311f',

	// Magic and the future: arcane violet, ghostly green and science-fiction teal, each lit, mid and shaded
	arcaneLight: '#e2b8ff',
	arcane: '#a86bf0',
	arcaneShade: '#5f3a9e',
	ghostLight: '#e6fff4',
	ghost: '#9ff0d0',
	ghostShade: '#4f9e8c',
	tealLight: '#8ff7ef',
	teal: '#2fb9b3',
	tealShade: '#1a6a74',

	// Interiors: warm plaster walls and dark floorboards
	plasterLight: '#e3cfa8',
	plaster: '#c9b088',
	plasterShade: '#9c8463',
	floorLight: '#7d5a44',
	floor: '#5e4232',
	floorShade: '#3f2b22',

	// Mesa capital terrain (#6): red desert soil and banded rock
	mesaSoilLight: '#e8bd84',
	mesaSoil: '#d9a066',
	mesaSoilShade: '#bd7c4c',
	mesaSoilDark: '#9c5f3c',
	mesaRockLight: '#e0814f',
	mesaRock: '#b9552f',
	mesaRockShade: '#8c3d27',
	mesaRockDark: '#5c2a22',
	mesaStrata: '#ee9f66',
	mesaSage: '#8e9c63',

	// Swamp capital terrain (#6): murky mud, black water and lily pads
	swampMudLight: '#707046',
	swampMud: '#5a5a3a',
	swampMudShade: '#434330',
	swampMoss: '#86a03f',
	swampWaterLight: '#4f8068',
	swampWater: '#2f5a4e',
	swampWaterDeep: '#1d3b38',
	swampReed: '#b8ad55',
	lilyPad: '#62b44f',
	lilyPadShade: '#3f8a3e',
	lilyFlower: '#f6a9c8',
};

/**
 * Named style C colours, as lowercase `#rrggbb`. Scene parts paint only these;
 * a drawing may also blend them with `mix()` for glows and highlights.
 * Typed as plain colours so variables can hold any of them, while unknown names still fail the type check.
 */
export const PALETTE =
	/** @type {Readonly<Record<keyof typeof COLOURS, Colour>>} */ (
		Object.freeze(COLOURS)
	);
