// The THIS ERA cards' triggers: what a card's ability does when something happens to a player (design §6).

/**
 * A trigger handler. It changes nothing itself: whatever it does happens in the operations it returns.
 * @typedef {(state: import('./state.js').State, owner: number, payload: Record<string, any>) => import('./state.js').NewOperation[]} Hook
 */

/**
 * The trigger handlers of each THIS ERA card, by card id and then by hook, such as `invented` or `advanced`.
 * @type {Record<string, Record<string, Hook>>}
 */
export const ERA_HOOKS = {};
