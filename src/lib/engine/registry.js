// The decision kinds and automatic operation kinds, kept apart from the modules that define them so the engine core can look them up without importing them (#166). kinds.js fills both.

/** @type {Record<string, import('./state.js').DecisionKind>} */
export const DECISIONS = {};

/** @type {Record<string, import('./state.js').AutomaticKind>} */
export const AUTOMATIC = {};
