// Action creators and constants for the chess state machine

export const Actions = {
	// Button actions
	A_BUTTON: "A_BUTTON",
	B_BUTTON: "B_BUTTON",
	SELECT_BUTTON: "SELECT_BUTTON",
	START_BUTTON: "START_BUTTON",
	DPAD: "DPAD",

	// Initialization
	INITIALIZATION_COMPLETE: "INITIALIZATION_COMPLETE",
	TITLE_SCREEN_COMPLETE: "TITLE_SCREEN_COMPLETE",

	// Animation
	ANIMATION_COMPLETE: "ANIMATION_COMPLETE",

	// Computer move
	COMPUTER_MOVE: "COMPUTER_MOVE",
	SET_PENDING_COMPUTER_MOVE: "SET_PENDING_COMPUTER_MOVE",

	// Offer draw
	DRAW_ACCEPTED: "DRAW_ACCEPTED",
	DRAW_REJECTED: "DRAW_REJECTED",

	// Menu actions (payloads for A_BUTTON in menu phases)
	MENU_CHANGE_SIDES: "changeSides",
	MENU_FORCE_MOVE: "forceMove",
	MENU_TAKEBACK_REPLAY: "takebackReplay",
	MENU_SETUP_BOARD: "setupBoard",
	MENU_OFFER_DRAW: "offerDraw",
	MENU_LOAD_GAME: "loadGame",
	MENU_SAVE_GAME: "saveGame",
	MENU_BEGIN_NEW_GAME: "beginNewGame",
	MENU_CLOSE: "closeMenu",

	SETUP_CLEAR_BOARD: "clearBoard",
	SETUP_INITIAL_POSITION: "initialPosition",
	SETUP_FIRST_MOVE: "firstMove",
	SETUP_COMPLETE: "setupComplete",
	SETUP_ABANDON_CHANGES: "abandonChanges",
};

/**
 * Create a button action
 */
export const createButtonAction = (button, payload = {}) => {
	return { type: Actions[button], payload };
};

/**
 * Create a menu action (for when A is pressed in menu)
 */
export const createMenuAction = (menuAction) => {
	return {
		type: Actions.A_BUTTON,
		payload: { selectedAction: menuAction },
	};
};

/**
 * Create a cursor movement action
 */
export const createCursorAction = (newPosition) => {
	return {
		type: Actions.DPAD,
		payload: { ...newPosition },
	};
};

/**
 * Create a piece selection action
 */
export const createPieceSelectAction = (cursorPosition) => {
	return {
		type: Actions.A_BUTTON,
		payload: { cursorPosition },
	};
};

/**
 * Create a computer move action
 */
export const createComputerMoveAction = (uci) => {
	return {
		type: Actions.SET_PENDING_COMPUTER_MOVE,
		payload: { uci },
	};
};

/**
 * Create a stockfish action
 */
export const createStockfishAction = (type, payload = {}) => {
	return { type: Actions[type], payload };
};