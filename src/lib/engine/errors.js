// The error the engine throws for a player's mistake, with a message a player can read.

/** An action the rules refuse. Its message is meant for the player; any other Error is a bug. */
export class PlayerError extends Error {
	/** @param {string} message */
	constructor(message) {
		super(message);
		this.name = 'PlayerError';
	}
}
