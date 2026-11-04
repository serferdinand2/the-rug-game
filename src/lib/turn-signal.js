// The browser tab's word for the viewer's turn (#174): online, its title and icon say so, for a player in another tab.

/** The page's own title, as index.html sets it. */
export const PAGE_TITLE = 'The Rug Game';

/**
 * The tab's title and icon.
 * @param {{ yours: boolean, online: boolean }} state - Whether the viewer has a decision to make, and whether the table
 *   is online; a hot-seat table shares one screen, so its title never changes
 * @returns {{ title: string, icon: string }}
 */
export function turnSignal({ yours, online }) {
	return yours && online
		? { title: `● Your turn · ${PAGE_TITLE}`, icon: '/favicon-turn.svg' }
		: { title: PAGE_TITLE, icon: '/favicon.svg' };
}
