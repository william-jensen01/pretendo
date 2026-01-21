import { DEFAULT_BOARD } from "../constants";
import { Color } from "../logic/models";
import {
	handleInitializingPhase,
	handleWelcomingPhase,
	handleWaitingForPlayerPhase,
	handlePieceSelectedPhase,
	handleAnimatingPhase,
	handleMenuActionsPhase,
	handleMenuSettingsPhase,
	handleReplayPhase,
	handleDataScreenPhase,
	handleGameOverPhase,
	handleWaitingForStockfishPhase,
	handleComputerMove,
	handleAlertPhase,
	handleSetupBoardPhase,
	handleSetupMenuPhase,
} from "./handlers";
import { Actions } from "./actions";
import { GAME_PHASE } from "./states";

/**
 * Initial state for the chess game state machine
 */
export const initialState = {
	// State machine
	phase: GAME_PHASE.INITIALIZING,
	previousPhase: null,

	// Game data
	startingBoard: DEFAULT_BOARD, // Initial position (standard or custom)
	board: DEFAULT_BOARD, // Current position (will be set in loadGame)
	currentPlayer: Color.White,
	computerColor: Color.Black,

	// Move state
	selectedSquare: null,
	possibleMoves: [],
	moveHistory: [],
	capturedPieces: [],
	lastMove: null, // Convenience accessor for last moveHistory entry

	// Animation
	animatingMove: null,
	pendingComputerMove: null,

	// UI state
	cursorPosition: { row: 0, col: 0 },
	selectedOption: 0,

	// Replay mode
	redoMoveStack: [],

	// Stockfish
	stockfishOperation: null,

	// Alert message
	alert: null,

	// Setup mode
	selectedSetupPiece: null, // Piece being carried during setup
	firstMove: Color.White, // Color of first move turn
	pendingFirstMove: null, // Pending value that will be set when setup completes
};

// ============================================================================
// TRANSITION FUNCTION
// ============================================================================

/**
 * Main state transition function
 * Takes current state and action, returns new state
 *
 * @param {Object} state - Current game state
 * @param {string} action - Action type (e.g., 'A_BUTTON', 'SELECT_BUTTON')
 * @param {Object} payload - Optional action payload (e.g., cursor position, move data)
 * @returns {Object} New game state
 */
function transition(state, action, payload = {}) {
	// CRITICAL: Block ALL inputs during animation
	if (
		state.phase === GAME_PHASE.ANIMATING &&
		action !== "ANIMATION_COMPLETE"
	) {
		return state;
	}

	let nextState = state;

	// Route to appropriate handler based on current phase and action
	switch (state.phase) {
		case GAME_PHASE.INITIALIZING:
			nextState = handleInitializingPhase(state, action, payload);
			break;

		case GAME_PHASE.WELCOMING:
			nextState = handleWelcomingPhase(state, action, payload);
			break;

		case GAME_PHASE.WAITING_FOR_PLAYER:
			nextState = handleWaitingForPlayerPhase(state, action, payload);
			break;

		case GAME_PHASE.PIECE_SELECTED:
			nextState = handlePieceSelectedPhase(state, action, payload);
			break;

		case GAME_PHASE.ANIMATING:
			nextState = handleAnimatingPhase(state, action, payload);
			break;

		case GAME_PHASE.MENU_ACTIONS:
			nextState = handleMenuActionsPhase(state, action, payload);
			break;

		case GAME_PHASE.MENU_SETTINGS:
			nextState = handleMenuSettingsPhase(state, action, payload);
			break;

		case GAME_PHASE.REPLAY:
			nextState = handleReplayPhase(state, action, payload);
			break;

		case GAME_PHASE.DATA_SCREEN:
			nextState = handleDataScreenPhase(state, action, payload);
			break;

		case GAME_PHASE.GAME_OVER:
			nextState = handleGameOverPhase(state, action, payload);
			break;

		case GAME_PHASE.WAITING_FOR_STOCKFISH:
			nextState = handleWaitingForStockfishPhase(state, action, payload);
			break;

		case GAME_PHASE.ALERT:
			nextState = handleAlertPhase(state, action, payload);
			break;

		case GAME_PHASE.SETUP_BOARD:
			nextState = handleSetupBoardPhase(state, action, payload);
			break;
		
		case GAME_PHASE.SETUP_MENU:
			nextState = handleSetupMenuPhase(state, action, payload);
			break;

		default:
			console.warn(`Unknown phase: ${state.phase}`);
			return state;
	}

	// UNIVERSAL PENDING MOVE CHECK
	// After all phase-specific transitions

	// Check if there's a pending computer move
	if (action === Actions.SET_PENDING_COMPUTER_MOVE) {
		nextState.pendingComputerMove = payload.uci;
	}
	// Check if we should execute a pending computer move
	// Only works on WAITING_FOR_PLAYER phase
	if (
		nextState.phase === GAME_PHASE.WAITING_FOR_PLAYER &&
		nextState.pendingComputerMove &&
		nextState.currentPlayer === nextState.computerColor
	) {
		return handleComputerMove(nextState, nextState.pendingComputerMove);
	}

	// FAILSAFE: Ensure alert is handled by overriding phase to ALERT
	if (nextState.alert && nextState.phase !== GAME_PHASE.ALERT) {
		return { ...nextState, phase: GAME_PHASE.ALERT };
	}

	return nextState;
}

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Main reducer for the chess game state machine
 *
 * @param {Object} state - Current state
 * @param {Object} action - Action object with { type, payload }
 * @returns {Object} Next state
 */
export function gameReducer(state, action) {
	const { type, payload = {} } = action;

	// Development logging
	if (process.env.NODE_ENV !== "production") {
		console.log(`[State Machine] ${state.phase} + ${type}`, payload);
	}

	// Call your transition function
	const nextState = transition(state, type, payload);

	// Log phase transitions
	if (
		process.env.NODE_ENV !== "production" &&
		nextState.phase !== state.phase
	) {
		console.log(`[State Machine] 🔄 ${state.phase} → ${nextState.phase}`);
	}

	return nextState;
}

/**
 * Helper to create initial state with custom values
 * Useful for testing or resetting the game
 */
export function createInitialState(overrides = {}) {
	return {
		...initialState,
		...overrides,
	};
}
