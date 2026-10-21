// The style C palette: every named colour the scene parts and drawings share.

/**
 * Named style C colours, as lowercase `#rrggbb`. Scene parts paint only these;
 * a drawing may also blend them with `mix()` for glows and highlights.
 */
export const PALETTE = Object.freeze({
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

	// Wood
	wood: '#3a2a22',

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
});
