// The asset catalog: every picture the game needs, with the stable id the game refers to it by.
// Plain data with no imports, so the browser client can load it too. Content the README's
// rules conventions leave out (R43, R44, R77 and the left-out Automa content) has no entry.

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
 * @property {number} issue - The art issue (#5–#11) that draws it
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
		{ id: 'resource', label: 'Resources', kind: 'icon', issue: 5 },
		{ id: 'building', label: 'Income buildings', kind: 'icon', issue: 5 },
		{ id: 'piece', label: 'Player pieces', kind: 'icon', issue: 5 },
		{ id: 'die', label: 'Dice faces', kind: 'icon', issue: 5 },
		{ id: 'terrain', label: 'Terrain', kind: 'icon', issue: 5 },
		{ id: 'track', label: 'Track symbols', kind: 'icon', issue: 5 },
		{
			id: 'landmark-marker',
			label: 'Landmark grid markers',
			kind: 'icon',
			issue: 5,
		},
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
			id: 'inspiration-tile',
			label: 'Inspiration tiles',
			kind: 'board',
			issue: 11,
		},
	]).map((group) => Object.freeze(group))
);

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
	resource: {
		base: [
			['coin', 'Coin'],
			['worker', 'Worker'],
			['food', 'Food'],
			['culture', 'Culture'],
			['any', 'Any resource'],
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
			['token', 'Player token'],
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
	'landmark-marker': LANDMARKS,
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
		],
	},
	// Numbered as in 01 Appendix B (R4).
	'territory-tile': { base: numbered(48, 'Territory tile') },
	'capital-mat': {
		base: [
			['mountain', 'Mountain'],
			['wetland', 'Wetland'],
			['tropical', 'Tropical'],
			['desert', 'Desert'],
			['grassland', 'Grassland'],
			['forest', 'Forest'],
		],
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
					issue: group.issue,
				})
			)
		)
	)
);
