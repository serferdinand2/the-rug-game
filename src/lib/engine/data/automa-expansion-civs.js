// Expansion Automa civilizations whose rules are available under the settled rulings.
import { AUTOMA_CIVS } from './automa-civs.js';
import { PP_AUTOMA_CIVS } from '../automa-expansion-pp.js';
import { artsTrackOn } from './tracks.js';

/** @param {readonly string[]} expansions @param {readonly string[]} [variants] */
export function automaCivilizationsFor(expansions, variants = []) {
	return [
		...AUTOMA_CIVS,
		...(expansions.includes('pp') ? PP_AUTOMA_CIVS : []),
		...(expansions.includes('aa')
			? [
					{
						id: 'influencers',
						name: 'Influencers',
						favouriteTrack: 'die',
						incomeAbilities: [],
					},
				]
			: []),
		...(artsTrackOn(expansions, variants)
			? [
					{
						id: 'muses',
						name: 'Muses',
						favouriteTrack: 'die',
						incomeAbilities: [],
					},
				]
			: []),
		...(expansions.includes('ff')
			? ['charmers', 'erratics', 'time-travelers'].map((id) => ({
					id,
					name:
						id === 'time-travelers'
							? 'Time Travelers'
							: id[0].toUpperCase() + id.slice(1),
					favouriteTrack: 'die',
					incomeAbilities: [],
				}))
			: []),
	];
}
