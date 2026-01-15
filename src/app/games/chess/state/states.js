// Chess Game State Machine - State Constants

export const GAME_PHASE = {
	INITIALIZING: "INITIALIZING",
	WELCOMING: "WELCOMING",

	/**
	 * Core gameplay phase - handles human input AND computer move execution.
	 * Computer moves are part of the normal game flow, not interruptions
	 */
	WAITING_FOR_PLAYER: "WAITING_FOR_PLAYER",

	/**
	 * Menu-triggered async Stockfish operations (offer draw, foce move).
	 * NOT used for regular computer moves - those are handled in WAITING_FOR_PLAYER.
	 * This phase represents "interruptions" to normal gameplay flow.
	 */
	WAITING_FOR_STOCKFISH: "WAITING_FOR_STOCKFISH",

	PIECE_SELECTED: "PIECE_SELECTED",
	ANIMATING: "ANIMATING",
	MENU_ACTIONS: "MENU_ACTIONS",
	MENU_SETTINGS: "MENU_SETTINGS",
	REPLAY: "REPLAY",
	DATA_SCREEN: "DATA_SCREEN",
	GAME_OVER: "GAME_OVER",

	ALERT: "ALERT",
};
