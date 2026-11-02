// The civilization registry: every civilization built, base and Plans & Ploys (#33), by id, and the ones a player holds (design §4).
import { CIVS } from './registry.js';
import { advisors } from './advisors.js';
import { alchemists } from './alchemists.js';
import { aliens } from './aliens.js';
import { architects } from './architects.js';
import { craftsmen } from './craftsmen.js';
import { entertainers } from './entertainers.js';
import { futurists } from './futurists.js';
import { heralds } from './heralds.js';
import { historians } from './historians.js';
import { infiltrators } from './infiltrators.js';
import { inventors } from './inventors.js';
import { isolationists } from './isolationists.js';
import { leaders } from './leaders.js';
import { merrymakers } from './merrymakers.js';
import { militants } from './militants.js';
import { mystics } from './mystics.js';
import { nomads } from './nomads.js';
import { recyclers } from './recyclers.js';
import { riverfolk } from './riverfolk.js';
import { spies } from './spies.js';
import { theChosen } from './the-chosen.js';
import { tinkerers } from './tinkerers.js';
import { traders } from './traders.js';
import { treasureHunters } from './treasure-hunters.js';
import { utilitarians } from './utilitarians.js';

/** @typedef {import('./civ.js').Civ} Civ */

// For callers outside this folder. Civilization modules import `offer` from './civ.js', which keeps them out of a cycle with this module.
export { offer } from './civ.js';

// Every civilization built, by catalog id: the base 16, then Plans & Ploys' (decks.js's PP_CIVS).
Object.assign(CIVS, {
	alchemists,
	architects,
	craftsmen,
	entertainers,
	futurists,
	heralds,
	historians,
	inventors,
	isolationists,
	leaders,
	merrymakers,
	militants,
	mystics,
	nomads,
	'the-chosen': theChosen,
	traders,
	riverfolk,
	recyclers,
	aliens,
	'treasure-hunters': treasureHunters,
	tinkerers,
	spies,
	utilitarians,
	infiltrators,
	advisors,
});

export { CIVS, findCiv, civsOf } from './registry.js';
