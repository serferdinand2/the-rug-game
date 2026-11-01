// The asset catalog: every picture the game needs, with the stable id the game refers to it by.
// Plain data with no imports, so the browser client can load it too. Content the README's
// rules conventions leave out (R43, R44 and the left-out Automa content) has no entry.

/** @typedef {'base' | 'pp' | 'aa' | 'ff'} ExpansionCode */
/** @typedef {'illustration' | 'icon' | 'board'} AssetKind */

/**
 * One asset. Its art lives at `art/<id>.svg` once it is drawn.
 * @typedef {Object} Asset
 * @property {string} id - Stable id, `<group>/<slug>`, e.g. 'landmark/lighthouse'
 * @property {string} name - Display name, e.g. 'Lighthouse'
 * @property {AssetKind} kind - Illustration, icon or board
 * @property {string} group - The group id, e.g. 'landmark'
 * @property {ExpansionCode} expansion - Where it comes from
 * @property {number} issue - The art issue that draws it: its group's, or the one COSMETIC_BOARDS or EXPANSION_ISSUES gives
 * @property {boolean} [example] - A reference composition; actual game mats are assembled from tiles per game
 */

/**
 * A group of assets, as the gallery shows them.
 * @typedef {Object} AssetGroup
 * @property {string} id - e.g. 'tapestry'
 * @property {string} label - e.g. 'Tapestry cards'
 * @property {AssetKind} kind
 * @property {number} issue - The art issue that draws the group
 */

/** @type {readonly { code: ExpansionCode, name: string }[]} */
export const EXPANSIONS = Object.freeze(
	/** @type {{ code: ExpansionCode, name: string }[]} */ ([
		{ code: 'base', name: 'Base game' },
		{ code: 'pp', name: 'Plans & Ploys' },
		{ code: 'aa', name: 'Arts & Architecture' },
		{ code: 'ff', name: 'Fantasies & Futures' },
	]).map((expansion) => Object.freeze(expansion))
);

/** @type {readonly AssetGroup[]} */
export const GROUPS = Object.freeze(
	/** @type {AssetGroup[]} */ ([
		{ id: 'civ', label: 'Civilizations', kind: 'illustration', issue: 8 },
		{
			id: 'tapestry',
			label: 'Tapestry cards',
			kind: 'illustration',
			issue: 9,
		},
		{ id: 'tech', label: 'Tech cards', kind: 'illustration', issue: 10 },
		{ id: 'landmark', label: 'Landmarks', kind: 'illustration', issue: 7 },
		{
			id: 'landmark-card',
			label: 'Landmark cards',
			kind: 'illustration',
			issue: 11,
		},
		{
			id: 'space-tile',
			label: 'Space tiles',
			kind: 'illustration',
			issue: 11,
		},
		{
			id: 'masterpiece',
			label: 'Masterpieces',
			kind: 'illustration',
			issue: 11,
		},
		{
			id: 'resource-24',
			label: 'Resources · native 24 px',
			kind: 'icon',
			issue: 5,
		},
		{
			id: 'resource-48',
			label: 'Resources · native 48 px',
			kind: 'icon',
			issue: 5,
		},
		{ id: 'building', label: 'Income buildings', kind: 'icon', issue: 5 },
		{ id: 'piece', label: 'Player pieces', kind: 'icon', issue: 5 },
		{ id: 'die', label: 'Dice faces', kind: 'icon', issue: 5 },
		{ id: 'terrain', label: 'Terrain hex markers', kind: 'icon', issue: 5 },
		{ id: 'track', label: 'Track symbols', kind: 'icon', issue: 5 },
		{ id: 'symbol', label: 'Game symbols', kind: 'icon', issue: 5 },
		{ id: 'card-back', label: 'Card backs', kind: 'icon', issue: 156 },
		{ id: 'board', label: 'Boards', kind: 'board', issue: 6 },
		{ id: 'hex', label: 'Map hexes', kind: 'board', issue: 6 },
		{
			id: 'territory-tile',
			label: 'Territory tiles',
			kind: 'board',
			issue: 6,
		},
		{ id: 'capital-mat', label: 'Capital mats', kind: 'board', issue: 6 },
		{
			id: 'capital-terrain',
			label: 'Capital terrain tiles',
			kind: 'icon',
			issue: 6,
		},
		{
			id: 'capital-relief',
			label: 'Capital relief',
			kind: 'board',
			issue: 82,
		},
		{
			id: 'capital-feature',
			label: 'Capital features',
			kind: 'board',
			issue: 132,
		},
		{
			id: 'inspiration-tile',
			label: 'Inspiration tiles',
			kind: 'board',
			issue: 11,
		},
	]).map((group) => Object.freeze(group))
);

/**
 * Boards that only dress the screen. The owner moved them out of #6 into #51 on 2026-10-23,
 * to be drawn after the core features.
 * @type {readonly string[]}
 */
export const COSMETIC_BOARDS = Object.freeze([
	'board/tracks',
	'board/income-mat',
	'board/table',
	'board/income-overlay',
]);

/** The issue that draws the cosmetic boards. */
const COSMETIC_ISSUE = 51;

/**
 * The issue that draws one expansion's assets in a group, where it isn't the group's own issue.
 * The owner moved the expansion mats' reliefs out of #82 on 2026-10-28: Arts & Architecture's
 * into #132, Fantasies & Futures' into #133.
 * @type {Readonly<Record<string, Readonly<Partial<Record<ExpansionCode, number>>>>>}
 */
export const EXPANSION_ISSUES = Object.freeze({
	'capital-relief': Object.freeze({ aa: 132, ff: 133 }),
});

/** @typedef {[slug: string, name: string][]} Entries */

/**
 * Numbered tiles: the slug is the printed tile number, which never changes.
 * @param {number} count
 * @param {string} label - e.g. 'Territory tile'
 * @returns {Entries}
 */
function numbered(count, label) {
	return Array.from({ length: count }, (_, i) => [
		String(i + 1),
		`${label} ${i + 1}`,
	]);
}

/**
 * A Fantasies & Futures biome's 14 terrain tiles: 8 buildable and 6 impassable variants (#6), until #133 draws their
 * reliefs. The base and Arts & Architecture biomes keep only their buildable tiles, as each mat's relief draws its
 * impassable plots (#82, #132).
 * @param {string} slug - Such as 'polar'
 * @param {string} name - Such as 'Polar'
 * @returns {Entries}
 */
function biomeTiles(slug, name) {
	const two = (/** @type {number} */ n) => String(n).padStart(2, '0');
	return [
		...Array.from(
			{ length: 8 },
			(_, i) =>
				/** @type {[string, string]} */ ([
					`${slug}-open-${two(i + 1)}`,
					`${name} buildable ${i + 1}`,
				])
		),
		...Array.from(
			{ length: 6 },
			(_, i) =>
				/** @type {[string, string]} */ ([
					`${slug}-blocked-${two(i + 1)}`,
					`${name} impassable ${i + 1}`,
				])
		),
	];
}

/**
 * An Arts & Architecture biome's 8 buildable tiles of natural ground (#132); Cloud City's 8 in each of its four
 * cloud tints. Their impassable plots are each mat's relief.
 * @param {string} slug - Such as 'cloud-city'
 * @param {string} name - Such as 'Cloud City'
 * @returns {Entries}
 */
function groundTiles(slug, name) {
	const two = (/** @type {number} */ n) => String(n).padStart(2, '0');
	const grounds =
		slug === 'cloud-city'
			? ['white', 'grey', 'tan', 'cream'].map((tint) => [
					`${slug}-${tint}`,
					`${name} ${tint}`,
				])
			: [[slug, name]];
	return grounds.flatMap(([ground, label]) =>
		Array.from(
			{ length: 8 },
			(_, i) =>
				/** @type {[string, string]} */ ([
					`${ground}-open-${two(i + 1)}`,
					`${label} buildable ${i + 1}`,
				])
		)
	);
}

/**
 * The advanced capital mats, as [slug, name], by expansion.
 * @type {{ aa: Entries, ff: Entries }}
 */
const ADVANCED_MATS = {
	aa: [
		['archipelago', 'Archipelago'],
		['canyon', 'Canyon'],
		['cavern', 'Cavern'],
		['cloud-city', 'Cloud City'],
		['mesa', 'Mesa'],
		['swamp', 'Swamp'],
	],
	ff: [
		['quagmire', 'Quagmire'],
		['city-in-a-bottle', 'City in a Bottle'],
		['veil', 'Veil'],
		['savanna', 'Savanna'],
		['polar', 'Polar'],
		['netherworld', 'Netherworld'],
	],
};

/** Compositions shown as examples only: the game assembles its own from the tiles (#5, #6). */
const EXAMPLES = ['capital-mat', 'board/map-small', 'board/map-large'];

/** @type {Partial<Record<ExpansionCode, Entries>>} */
const LANDMARKS = {
	base: [
		['lighthouse', 'Lighthouse'],
		['train-station', 'Train Station'],
		['launch-pad', 'Launch Pad'],
		['apothecary', 'Apothecary'],
		['academy', 'Academy'],
		['laboratory', 'Laboratory'],
		['forge', 'Forge'],
		['rubber-works', 'Rubber Works'],
		['tech-hub', 'Tech Hub'],
		['barracks', 'Barracks'],
		['tank-factory', 'Tank Factory'],
		['fusion-reactor', 'Fusion Reactor'],
		['bakery', 'Bakery'],
		['barn', 'Barn'],
		['com-tower', 'Com Tower'],
		['library', 'Library'],
		['stock-market', 'Stock Market'],
		['treasury', 'Treasury'],
	],
	pp: [
		['digital-studio', 'Digital Studio'],
		['game-store', 'Game Store'],
		['skyscraper', 'Skyscraper'],
		['tv-station', 'TV Station'],
		['urban-farm', 'Urban Farm'],
		['stadium', 'Stadium'],
		['monolith', 'Monolith'],
	],
	aa: [
		['villa', 'Villa'],
		['birdwatching-perch', 'Birdwatching Perch'],
		['castle', 'Castle'],
		['windmill', 'Windmill'],
		['bridge', 'Bridge'],
		['clock-tower', 'Clock Tower'],
		['opera-house', 'Opera House'],
		['holocenter', 'Holocenter'],
	],
};

/**
 * Each group's assets per expansion, in the design's Appendix A order.
 * @type {Record<string, Partial<Record<ExpansionCode, Entries>>>}
 */
const LISTS = {
	civ: {
		base: [
			['alchemists', 'Alchemists'],
			['architects', 'Architects'],
			['craftsmen', 'Craftsmen'],
			['entertainers', 'Entertainers'],
			['futurists', 'Futurists'],
			['heralds', 'Heralds'],
			['historians', 'Historians'],
			['inventors', 'Inventors'],
			['isolationists', 'Isolationists'],
			['leaders', 'Leaders'],
			['merrymakers', 'Merrymakers'],
			['militants', 'Militants'],
			['mystics', 'Mystics'],
			['nomads', 'Nomads'],
			['the-chosen', 'The Chosen'],
			['traders', 'Traders'],
		],
		pp: [
			['advisors', 'Advisors'],
			['aliens', 'Aliens'],
			['infiltrators', 'Infiltrators'],
			['islanders', 'Islanders'],
			['recyclers', 'Recyclers'],
			['riverfolk', 'Riverfolk'],
			['spies', 'Spies'],
			['tinkerers', 'Tinkerers'],
			['treasure-hunters', 'Treasure Hunters'],
			['utilitarians', 'Utilitarians'],
		],
		aa: [
			['collectors', 'Collectors'],
			['gamblers', 'Gamblers'],
			['relentless', 'Relentless'],
			['renegades', 'Renegades'],
			['urban-planners', 'Urban Planners'],
		],
		ff: [
			['artificers', 'Artificers'],
			['celestials', 'Celestials'],
			['elder-ones', 'Elder Ones'],
			['faefolk', 'Faefolk'],
			['genies', 'Genies'],
			['illuminati', 'Illuminati'],
			['merfolk', 'Merfolk'],
			['psionics', 'Psionics'],
			['weefolk', 'Weefolk'],
			['werefolk', 'Werefolk'],
		],
	},
	tapestry: {
		base: [
			['academia', 'Academia'],
			['age-of-discovery', 'Age of Discovery'],
			['age-of-sail', 'Age of Sail'],
			['age-of-wonders', 'Age of Wonders'],
			['alliance', 'Alliance'],
			['boast-of-superiority', 'Boast of Superiority'],
			['broker-of-peace', 'Broker of Peace'],
			['capitalism', 'Capitalism'],
			['coal-baron', 'Coal Baron'],
			['colonialism', 'Colonialism'],
			['dark-ages', 'Dark Ages'],
			['democracy', 'Democracy'],
			['dictatorship', 'Dictatorship'],
			['diplomacy', 'Diplomacy'],
			['dystopia', 'Dystopia'],
			['empiricism', 'Empiricism'],
			['espionage', 'Espionage'],
			['exploitation', 'Exploitation'],
			['feudalism', 'Feudalism'],
			['golden-age', 'Golden Age'],
			['guilds', 'Guilds'],
			['industrialism', 'Industrialism'],
			['marriage-of-state', 'Marriage of State'],
			['mercantilism', 'Mercantilism'],
			['meritocracy', 'Meritocracy'],
			['militarism', 'Militarism'],
			['monarchy', 'Monarchy'],
			['oil-magnate', 'Oil Magnate'],
			['olympic-host', 'Olympic Host'],
			['pillage-and-plunder', 'Pillage and Plunder'],
			['pirate-rule', 'Pirate Rule'],
			['plea-for-aid', 'Plea for Aid'],
			['renaissance', 'Renaissance'],
			['revisionism', 'Revisionism'],
			['revolution', 'Revolution'],
			['socialism', 'Socialism'],
			['steam-tycoon', 'Steam Tycoon'],
			['technocracy', 'Technocracy'],
			['terraforming', 'Terraforming'],
			['theocracy', 'Theocracy'],
			['trade-economy', 'Trade Economy'],
			['tyranny', 'Tyranny'],
			['wartime-economy', 'Wartime Economy'],
			// One picture for all seven trap copies.
			['trap', 'Trap'],
		],
		pp: [
			['astronomy', 'Astronomy'],
			['cartography', 'Cartography'],
			['double-cross', 'Double Cross'],
			['engineering', 'Engineering'],
			['entertain-the-masses', 'Entertain the Masses'],
			['manifest-destiny', 'Manifest Destiny'],
			['public-works', 'Public Works'],
			['retreat', 'Retreat'],
			['status-quo', 'Status Quo'],
			['stolen-plans', 'Stolen Plans'],
			['surprise-party', 'Surprise Party'],
			['surrender', 'Surrender'],
			['worlds-fair', "World's Fair"],
		],
		aa: [
			['age-of-enlightenment', 'Age of Enlightenment'],
			['artistic-inspiration', 'Artistic Inspiration'],
			['commercial-center', 'Commercial Center'],
			['found-art', 'Found Art'],
			['government-grants', 'Government Grants'],
			['granges', 'Granges'],
			['information-age', 'Information Age'],
			['infrastructure-upgrade', 'Infrastructure Upgrade'],
			['migration', 'Migration'],
			['monuments', 'Monuments'],
			['moon-landing', 'Moon Landing'],
			['national-parks', 'National Parks'],
			['plague', 'Plague'],
			['political-posturing', 'Political Posturing'],
			['silk-road', 'Silk Road'],
			['space-race', 'Space Race'],
			['spymaster', 'Spymaster'],
			['star-chamber', 'Star Chamber'],
			['steam', 'S.T.E.A.M.'],
			['trade-routes', 'Trade Routes'],
		],
		ff: [
			['alien-disclosure', 'Alien Disclosure'],
			['astral-expeditions', 'Astral Expeditions'],
			['chimera-citizen-rights', 'Chimera-Citizen Rights'],
			['citadel-of-power', 'Citadel of Power'],
			['cloud-colonies', 'Cloud Colonies'],
			['deja-vu', 'Déjà Vu'],
			['doppelgangers', 'Doppelgangers'],
			['dream-monitors', 'Dream Monitors'],
			['ecstatic-visions', 'Ecstatic Visions'],
			['generation-ships', 'Generation Ships'],
			['ghost-ship', 'Ghost Ship'],
			['ghost-towns', 'Ghost Towns'],
			['good-omens', 'Good Omens'],
			['great-library-of-potions', 'Great Library of Potions'],
			['gremlins', 'Gremlins'],
			['haunted-houses', 'Haunted Houses'],
			['high-council', 'High Council'],
			['hive-mind', 'Hive Mind'],
			['interdimensional-trade', 'Interdimensional Trade'],
			['the-kraken', 'The Kraken'],
			['league-of-the-charmed', 'League of the Charmed'],
			['living-cities', 'Living Cities'],
			['lost-artifacts', 'Lost Artifacts'],
			['microbial-magic', 'Microbial Magic'],
			['muses', 'Muses'],
			['phantasmal-paladins', 'Phantasmal Paladins'],
			['quest-culture', 'Quest Culture'],
			['robotic-decoys', 'Robotic Decoys'],
			['secret-societies', 'Secret Societies'],
			['seer-sight', 'Seer Sight'],
			['soothsaying', 'Soothsaying'],
			['superpower-regulators', 'Superpower Regulators'],
			['suspended-animation', 'Suspended Animation'],
			['technomancy', 'Technomancy'],
			['temporal-nomadism', 'Temporal Nomadism'],
			['uploaded-consciousness', 'Uploaded Consciousness'],
			['wizards-guild', "Wizards' Guild"],
			['zombie-army', 'Zombie Army'],
		],
	},
	tech: {
		base: [
			['air-conditioning', 'Air Conditioning'],
			['ammonia', 'Ammonia'],
			['anesthesia', 'Anesthesia'],
			['assembly-line', 'Assembly Line'],
			['bakery', 'Bakery'],
			['barn', 'Barn'],
			['calendar', 'Calendar'],
			['canned-food', 'Canned Food'],
			['clocks', 'Clocks'],
			['com-tower', 'Com Tower'],
			['compass', 'Compass'],
			['concrete', 'Concrete'],
			['dynamite', 'Dynamite'],
			['eyeglasses', 'Eyeglasses'],
			['irrigation', 'Irrigation'],
			['library', 'Library'],
			['light-bulb', 'Light Bulb'],
			['lithium-ion-battery', 'Lithium-Ion Battery'],
			['paper', 'Paper'],
			['penicillin', 'Penicillin'],
			['printing-press', 'Printing Press'],
			['radio', 'Radio'],
			['sewage-plumbing', 'Sewage & Plumbing'],
			['siegecraft', 'Siegecraft'],
			['stock-market', 'Stock Market'],
			['telescope', 'Telescope'],
			['the-nail', 'The Nail'],
			['time-travel', 'Time Travel'],
			['transistors', 'Transistors'],
			['treasury', 'Treasury'],
			['vaccines', 'Vaccines'],
			['warships', 'Warships'],
			['zeppelins', 'Zeppelins'],
		],
		aa: [
			['astrolabe', 'Astrolabe'],
			['automation', 'Automation'],
			['calculus', 'Calculus'],
			['duct-tape', 'Duct Tape'],
			['jet-fuel', 'Jet Fuel'],
			['microphone', 'Microphone'],
			['oil-paint', 'Oil Paint'],
			['opera', 'Opera'],
			['public-art', 'Public Art'],
			['suburbs', 'Suburbs'],
			['war-college', 'War College'],
		],
		ff: [
			['golem-minions', 'Golem Minions'],
			['levitation', 'Levitation'],
			['mind-control', 'Mind Control'],
			['object-cloning', 'Object Cloning'],
			['perfect-memory', 'Perfect Memory'],
			['pyrokinesis', 'Pyrokinesis'],
			['remote-viewing', 'Remote Viewing'],
			['superhuman-strength', 'Superhuman Strength'],
			['super-speed', 'Super Speed'],
			['teleportation', 'Teleportation'],
			['transmogrification', 'Transmogrification'],
			['weather-control', 'Weather Control'],
		],
	},
	landmark: LANDMARKS,
	'landmark-card': {
		pp: [
			['game-store', 'Game Store'],
			['tv-station', 'TV Station'],
			['digital-studio', 'Digital Studio'],
			['skyscraper', 'Skyscraper'],
			['urban-farm', 'Urban Farm'],
		],
		aa: [
			['villa', 'Villa'],
			['birdwatching-perch', 'Birdwatching Perch'],
			['castle', 'Castle'],
			['windmill', 'Windmill'],
			['bridge', 'Bridge'],
		],
	},
	'space-tile': {
		base: numbered(15, 'Space tile'),
		pp: [
			['technology-5-vp', 'Technology 5 VP'],
			['science-5-vp', 'Science 5 VP'],
			['military-5-vp', 'Military 5 VP'],
			['monolith', 'Monolith'],
		],
	},
	masterpiece: {
		aa: [
			['animation', 'Animation'],
			['art-deco', 'Art Deco'],
			['ballet', 'Ballet'],
			['baroque', 'Baroque'],
			['calligraphy', 'Calligraphy'],
			['ceramics', 'Ceramics'],
			['costuming', 'Costuming'],
			['fresco', 'Fresco'],
			['graffiti', 'Graffiti'],
			['haute-cuisine', 'Haute Cuisine'],
			['krav-maga', 'Krav Maga'],
			['mapmaking', 'Mapmaking'],
			['mime', 'Mime'],
			['modern-dance', 'Modern Dance'],
			['motion-picture', 'Motion Picture'],
			['painting', 'Painting'],
			['stained-glass', 'Stained Glass'],
			['tapestry', 'Tapestry'],
			['theater', 'Theater'],
			['topiary', 'Topiary'],
		],
	},
	'resource-24': {
		base: [
			['coin', 'Coin · 24 px'],
			['worker', 'Worker · 24 px'],
			['food', 'Food · 24 px'],
			['culture', 'Culture · 24 px'],
			['any', 'Any resource · 24 px'],
		],
	},
	'resource-48': {
		base: [
			['coin', 'Coin · 48 px'],
			['worker', 'Worker · 48 px'],
			['food', 'Food · 48 px'],
			['culture', 'Culture · 48 px'],
			['any', 'Any resource · 48 px'],
		],
	},
	building: {
		base: [
			['market', 'Market'],
			['house', 'House'],
			['farm', 'Farm'],
			['armory', 'Armory'],
		],
	},
	piece: {
		base: [
			['outpost', 'Outpost'],
			['outpost-toppled', 'Toppled outpost'],
			['token', 'Unassigned token (legacy neutral)'],
			['outpost-blue', 'Outpost (blue)'],
			['outpost-red', 'Outpost (red)'],
			['outpost-green', 'Outpost (green)'],
			['outpost-yellow', 'Outpost (yellow)'],
			['outpost-purple', 'Outpost (purple)'],
			['outpost-toppled-blue', 'Toppled outpost (blue)'],
			['outpost-toppled-red', 'Toppled outpost (red)'],
			['outpost-toppled-green', 'Toppled outpost (green)'],
			['outpost-toppled-yellow', 'Toppled outpost (yellow)'],
			['outpost-toppled-purple', 'Toppled outpost (purple)'],
			['capital-fortress-blue', 'Capital fortress (blue)'],
			['capital-fortress-red', 'Capital fortress (red)'],
			['capital-fortress-green', 'Capital fortress (green)'],
			['capital-fortress-yellow', 'Capital fortress (yellow)'],
			['capital-fortress-purple', 'Capital fortress (purple)'],
			['token-blue', 'Player token (blue) · shaded 32 px'],
			['token-red', 'Player token (red) · shaded 32 px'],
			['token-green', 'Player token (green) · shaded 32 px'],
			['token-yellow', 'Player token (yellow) · shaded 32 px'],
			['token-purple', 'Player token (purple) · shaded 32 px'],
			['architects-cube', "Architects' cube"],
		],
	},
	die: {
		base: [
			['science-exploration', 'Science die: exploration'],
			['science-science', 'Science die: science'],
			['science-technology', 'Science die: technology'],
			['science-military', 'Science die: military'],
			['red-4-vp', 'Red die: 4 VP'],
			['red-5-vp', 'Red die: 5 VP'],
			['red-6-vp', 'Red die: 6 VP'],
			['red-7-vp', 'Red die: 7 VP'],
			['red-vp-per-territory', 'Red die: 1 VP per territory'],
			['black-coin', 'Black die: coin'],
			['black-worker', 'Black die: worker'],
			['black-food', 'Black die: food'],
			['black-culture', 'Black die: culture'],
			// The "?" face gives the conquered territory tile's benefit (R8).
			['black-tile-benefit', 'Black die: tile benefit (?)'],
			// The die bodies the dice tray rolls; it draws each face on them (#61).
			['science-body', 'Science die'],
			['red-body', 'Red die'],
			['black-body', 'Black die'],
		],
		aa: [['science-arts', 'Science die: arts']],
	},
	terrain: {
		base: [
			['sea', 'Sea'],
			['desert', 'Desert'],
			['forest', 'Forest'],
			['grassland', 'Grassland'],
			['mountain', 'Mountain'],
		],
	},
	track: {
		base: [
			['exploration', 'Exploration'],
			['science', 'Science'],
			['technology', 'Technology'],
			['military', 'Military'],
		],
		aa: [['arts', 'Arts']],
	},
	symbol: {
		base: [
			['victory-points', 'Victory points'],
			['territory-tile', 'Territory tile'],
			['tapestry-card', 'Tapestry card'],
			['tech-card', 'Tech card'],
			['civilization-card', 'Civilization card'],
			['capital-city', 'Capital city'],
			['restart', 'Restart arrow'],
			['space-tile', 'Space tile'],
			['explore', 'Explore'],
			['explore-anywhere', 'Explore anywhere'],
			['explore-space', 'Explore space'],
			['invent', 'Invent'],
			['science-die', 'Science die'],
		],
	},
	'card-back': {
		base: [
			['tapestry', 'Tapestry card back'],
			['tech', 'Tech card back'],
		],
	},
	board: {
		base: [
			['map-large', 'Large map (4–5 players)'],
			['map-small', 'Small map (1–3 players)'],
			['tracks', 'Tracks backdrop'],
			['income-mat', 'Income mat'],
			['table', 'Table background'],
		],
		ff: [['income-overlay', 'Income-mat overlay [5]']],
	},
	hex: {
		base: [
			['sea', 'Sea hex'],
			['desert', 'Desert hex'],
			['forest', 'Forest hex'],
			['grassland', 'Grassland hex'],
			['mountain', 'Mountain hex'],
			['unexplored', 'Unexplored hex'],
			['cloud', 'Cloud over a hex'],
			['volcano', 'Volcano on a hex'],
		],
	},
	// Numbered as in 01 Appendix B (R4).
	'territory-tile': { base: numbered(48, 'Territory tile') },
	// The Fantasies & Futures mats only, until #133: a base or Arts & Architecture mat's one picture is its relief
	// preview, so it has no example (owner, 2026-10-29; #132).
	'capital-mat': {
		ff: ADVANCED_MATS.ff,
	},
	// The base and Arts & Architecture biomes' buildable ground; their impassable plots are each mat's relief (#82, #132).
	'capital-terrain': {
		base: [
			['mountain-open-01', 'Mountain buildable 1'],
			['mountain-open-02', 'Mountain buildable 2'],
			['mountain-open-03', 'Mountain buildable 3'],
			['mountain-open-04', 'Mountain buildable 4'],
			['mountain-open-05', 'Mountain buildable 5'],
			['mountain-open-06', 'Mountain buildable 6'],
			['mountain-open-07', 'Mountain buildable 7'],
			['mountain-open-08', 'Mountain buildable 8'],
			['wetland-open-01', 'Wetland buildable 1'],
			['wetland-open-02', 'Wetland buildable 2'],
			['wetland-open-03', 'Wetland buildable 3'],
			['wetland-open-04', 'Wetland buildable 4'],
			['wetland-open-05', 'Wetland buildable 5'],
			['wetland-open-06', 'Wetland buildable 6'],
			['wetland-open-07', 'Wetland buildable 7'],
			['wetland-open-08', 'Wetland buildable 8'],
			['tropical-open-01', 'Tropical buildable 1'],
			['tropical-open-02', 'Tropical buildable 2'],
			['tropical-open-03', 'Tropical buildable 3'],
			['tropical-open-04', 'Tropical buildable 4'],
			['tropical-open-05', 'Tropical buildable 5'],
			['tropical-open-06', 'Tropical buildable 6'],
			['tropical-open-07', 'Tropical buildable 7'],
			['tropical-open-08', 'Tropical buildable 8'],
			['desert-open-01', 'Desert buildable 1'],
			['desert-open-02', 'Desert buildable 2'],
			['desert-open-03', 'Desert buildable 3'],
			['desert-open-04', 'Desert buildable 4'],
			['desert-open-05', 'Desert buildable 5'],
			['desert-open-06', 'Desert buildable 6'],
			['desert-open-07', 'Desert buildable 7'],
			['desert-open-08', 'Desert buildable 8'],
			['grassland-open-01', 'Grassland buildable 1'],
			['grassland-open-02', 'Grassland buildable 2'],
			['grassland-open-03', 'Grassland buildable 3'],
			['grassland-open-04', 'Grassland buildable 4'],
			['grassland-open-05', 'Grassland buildable 5'],
			['grassland-open-06', 'Grassland buildable 6'],
			['grassland-open-07', 'Grassland buildable 7'],
			['grassland-open-08', 'Grassland buildable 8'],
			['forest-open-01', 'Forest buildable 1'],
			['forest-open-02', 'Forest buildable 2'],
			['forest-open-03', 'Forest buildable 3'],
			['forest-open-04', 'Forest buildable 4'],
			['forest-open-05', 'Forest buildable 5'],
			['forest-open-06', 'Forest buildable 6'],
			['forest-open-07', 'Forest buildable 7'],
			['forest-open-08', 'Forest buildable 8'],
		],
		aa: ADVANCED_MATS.aa.flatMap(([slug, name]) => groundTiles(slug, name)),
		ff: ADVANCED_MATS.ff.flatMap(([slug, name]) => biomeTiles(slug, name)),
	},
	// One relief per mat: its impassable plots drawn as one picture (#82; the expansion mats' in #132 and #133).
	'capital-relief': {
		base: [
			['mountain', 'Mountain relief'],
			['wetland', 'Wetland relief'],
			['tropical', 'Tropical relief'],
			['desert', 'Desert relief'],
			['grassland', 'Grassland relief'],
			['forest', 'Forest relief'],
		],
		aa: ADVANCED_MATS.aa.map(
			([slug, name]) =>
				/** @type {[string, string]} */ ([slug, `${name} relief`])
		),
		ff: ADVANCED_MATS.ff.map(
			([slug, name]) =>
				/** @type {[string, string]} */ ([slug, `${name} relief`])
		),
	},
	// What a mat prints on its buildable plots, drawn between its ground and its relief (#132).
	'capital-feature': {
		aa: [
			['archipelago', 'Archipelago features'],
			['canyon', 'Canyon features'],
			['cloud-city', 'Cloud City features'],
			['swamp', 'Swamp features'],
		],
	},
	'inspiration-tile': {
		aa: [
			['markets', 'Markets'],
			['houses', 'Houses'],
			['farms', 'Farms'],
			['armories', 'Armories'],
		],
	},
};

/**
 * Every asset, in group order, then expansion order, then the design's order.
 * @type {readonly Asset[]}
 */
export const ASSETS = Object.freeze(
	GROUPS.flatMap((group) =>
		EXPANSIONS.flatMap(({ code }) =>
			(LISTS[group.id][code] ?? []).map(([slug, name]) =>
				Object.freeze({
					id: `${group.id}/${slug}`,
					name,
					kind: group.kind,
					group: group.id,
					expansion: code,
					issue: COSMETIC_BOARDS.includes(`${group.id}/${slug}`)
						? COSMETIC_ISSUE
						: (EXPANSION_ISSUES[group.id]?.[code] ?? group.issue),
					...(EXAMPLES.includes(group.id) ||
					EXAMPLES.includes(`${group.id}/${slug}`)
						? { example: true }
						: {}),
				})
			)
		)
	)
);
