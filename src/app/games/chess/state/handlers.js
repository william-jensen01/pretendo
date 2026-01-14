import {
	DEFAULT_BOARD,
	ACTION_MENU_OPTIONS,
	SETTINGS_MENU_OPTIONS,
} from "../constants";
import { Color } from "../logic/models";
import { Actions } from "./actions";
import { GAME_PHASE } from "./states";
import { createInitialState } from "./reducer";
import {
	getPieceAt,
	calculatePossibleMoves,
	applyMoveToBoard,
	isGameOver,
} from "../logic/gameUtils";
import { parseStockfishMove } from "../logic/FENConverter";

// ============================================================================
// PHASE HANDLERS
// ============================================================================

export const handleInitializingPhase = (state, action, _) => {
	switch (action) {
		case Actions.INITIALIZATION_COMPLETE:
			return { ...state, phase: GAME_PHASE.WELCOMING };
		default:
			return state;
	}
};

export const handleWelcomingPhase = (state, action, _) => {
	switch (action) {
		case Actions.TITLE_SCREEN_COMPLETE:
			return {
				...state,
				phase: GAME_PHASE.WAITING_FOR_PLAYER,
				board: DEFAULT_BOARD,
			};
		default:
			console.log("Unknown action in WELCOMING phase: ", action);
			return state;
	}
};

export const handleWaitingForPlayerPhase = (state, action, payload) => {
	switch (action) {
		case Actions.A_BUTTON:
			// Select piece at cursor position
			return handleSelectPiece(state, payload.cursorPosition);

		case Actions.B_BUTTON:
			// Takeback/replay
			return handleUndoMove(state);

		case Actions.START_BUTTON:
			// Open data screen
			return {
				...state,
				phase: GAME_PHASE.DATA_SCREEN,
				previousPhase: GAME_PHASE.WAITING_FOR_PLAYER,
			};

		case Actions.SELECT_BUTTON:
			// Open menu
			return {
				...state,
				phase: GAME_PHASE.MENU_ACTIONS,
				previousPhase: GAME_PHASE.WAITING_FOR_PLAYER,
			};

		case Actions.DPAD:
			// Move cursor
			return { ...state, cursorPosition: payload.newPosition };

		default:
			return state;
	}
};

export const handlePieceSelectedPhase = (state, action, payload) => {
	switch (action) {
		case Actions.A_BUTTON:
			// Attempt to move piece to cursor position
			return handleMovePiece(state, payload.cursorPosition);
		case Actions.B_BUTTON:
			// Cancel move
			return handleCancelMove(state);

		case Actions.SELECT_BUTTON:
			// Open menu (clears piece selection)
			return openMenu(state);

		case Actions.DPAD:
			// Move cursor
			return { ...state, cursorPosition: payload.newPosition };

		default:
			return state;
	}
};

export const handleAnimatingPhase = (state, action, _) => {
	switch (action) {
		case Actions.ANIMATION_COMPLETE:
			return onAnimationComplete(state);
		default:
			return state; // Already blocked at top, but explicit here
	}
};

export const handleMenuActionsPhase = (state, action, payload) => {
	switch (action) {
		case Actions.SELECT_BUTTON:
			// Cycle to settings submenu
			return {
				...state,
				phase: GAME_PHASE.MENU_SETTINGS,
				// keep previousPhase for transition back to original starting state
			};

		case Actions.A_BUTTON:
			// Execute selected menu action
			return handleMenuAction(state, payload.selectedAction);

		case Actions.DPAD:
			// Navigate menu options
			return handleMenuNavigation(state, payload.r, ACTION_MENU_OPTIONS);

		default:
			return state;
	}
};

export const handleMenuSettingsPhase = (state, action, payload) => {
	switch (action) {
		case Actions.SELECT_BUTTON:
			// Go back to main menu
			return {
				...state,
				phase: state.previousPhase,
				previousPhase: null,
			};

		case Actions.A_BUTTON:
			// Cycle setting value (settings changes remain outside state machine)
			return state; // Setting side effects handled externally

		case Actions.DPAD:
			// Navigate settings options
			return handleMenuNavigation(
				state,
				payload.r,
				SETTINGS_MENU_OPTIONS
			);

		default:
			return state;
	}
};

export const handleReplayPhase = (state, action, payload) => {
	switch (action) {
		case Actions.A_BUTTON:
			// Redo move
			return handleRedoMove(state);

		case Actions.B_BUTTON:
			// Undo move
			return handleUndoMove(state);

		case Actions.SELECT_BUTTON:
			// Exit replay mode
			return {
				...state,
				phase: GAME_PHASE.WAITING_FOR_PLAYER,
				// Clear redo stack when exiting replay
				redoMoveStack: [],
			};

		case Actions.DPAD:
			// Move cursor (visual only in replay)
			return { ...state, cursorPosition: payload.newPosition };

		default:
			return state;
	}
};

export const handleDataScreenPhase = (state, action, _) => {
	switch (action) {
		case Actions.START_BUTTON:
			// Return to previous phase
			return {
				...state,
				phase: state.previousPhase || GAME_PHASE.WAITING_FOR_PLAYER,
				previousPhase: null,
			};

		default:
			return state;
	}
};

export const handleGameOverPhase = (state, action, _) => {
	switch (action) {
		case Actions.SELECT_BUTTON:
			// Open menu
			return openMenu(state);

		case Actions.B_BUTTON:
			// Enter replay mode
			return { ...state, phase: GAME_PHASE.REPLAY };

		case Actions.START_BUTTON:
			// Open data screen
			return {
				...state,
				phase: GAME_PHASE.DATA_SCREEN,
				previousPhase: GAME_PHASE.GAME_OVER,
			};

		default:
			return state;
	}
};

/**
 * WAITING_FOR_STOCKFISH Phase Handler
 *
 * Handles menu-triggered async Stockfish operations (offer draw, force move).
 * This phase is for "interruptions" to gameplay, NOT regular computer moves.
 *
 * Note: Regular computer moves are handled in WAITING_FOR_PLAYER phase
 * because they're part of the core gameplay cycle, not interruptions.
 */
export const handleWaitingForStockfishPhase = (state, action, payload) => {
	switch (action) {
		case Actions.DRAW_ACCEPTED:
			return {
				...state,
				phase: GAME_PHASE.GAME_OVER,
				previousPhase: null,
				stockfishOperation: null,
			};

		case Actions.DRAW_REJECTED:
			return {
				...state,
				phase: GAME_PHASE.WAITING_FOR_PLAYER,
				previousPhase: null,
				stockfishOperation: null,
			};

		case Actions.SET_PENDING_COMPUTER_MOVE:
			// Universal handler only works on WAITING_FOR_PLAYER phase so we need to redirect
			return {
				...state,
				phase: GAME_PHASE.WAITING_FOR_PLAYER,
				previousPhase: null,
				pendingComputerMove: payload.uci,
				stockfishOperation: null,
			};
		default:
			return state;
	}
};

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Shared helper for menu navigation
 * Used by all menu phases (MENU_ACTIONS, MENU_SETTINGS, etc.)
 */
export const handleMenuNavigation = (state, direction, menuOptions) => {
	const newOptionIndex =
		(state.selectedOption + direction + menuOptions.length) %
		menuOptions.length;
	return { ...state, selectedOption: newOptionIndex };
};

export const handleSelectPiece = (state, cursorPosition) => {
	const piece = getPieceAt(state.board, cursorPosition);

	if (!piece || piece.color !== state.currentPlayer) {
		return state;
	}

	const gameState = {
		lastMove:
			state.moveHistory?.length > 0
				? state.moveHistory[state.moveHistory.length - 1]
				: null,
	};
	const possibleMoves = calculatePossibleMoves(
		state.board,
		cursorPosition,
		gameState
	);

	return {
		...state,
		phase: GAME_PHASE.PIECE_SELECTED,
		selectedSquare: cursorPosition,
		possibleMoves,
	};
};

export const handleMovePiece = (state, targetPosition) => {
	const isValidMove = state.possibleMoves.some(
		(move) =>
			move.row === targetPosition.row && move.col === targetPosition.col
	);

	if (!isValidMove) {
		// Clicked on invalid square - deselect
		return {
			...state,
			phase: GAME_PHASE.WAITING_FOR_PLAYER,
			selectedSquare: null,
			possibleMoves: [],
		};
	}

	// Execute move
	const moveData = {
		from: state.selectedSquare,
		to: targetPosition,
		piece: getPieceAt(state.board, state.selectedSquare),
	};

	return executeMoveAnimation(state, moveData);
};

export const handleCancelMove = (state) => {
	return {
		...state,
		phase: GAME_PHASE.WAITING_FOR_PLAYER,
		selectedSquare: null,
		possibleMoves: [],
	};
};

export const handleComputerMove = (state, move) => {
	// Handle no legal moves
	if (move === "none" || move === "(none)") {
		console.warn("Stockfish returned no move - checking game state");

		// Check for game over
		if (isGameOver(state.board, state.currentPlayer)) {
			return {
				...state,
				phase: GAME_PHASE.GAME_OVER,
				previousPhase: null,
				animatingMove: null,
			};
		} else {
			console.error(
				"Invalid game state - no moves but not checkmate/stalemate"
			);
		}
		return state;
	}

	// Parse and execute move
	const { from, to } = parseStockfishMove(move);

	const moveData = {
		from,
		to,
		piece: getPieceAt(state.board, from),
	};

	return executeMoveAnimation(state, moveData);
};

export const handleRedoMove = (state) => {
	// Redo = replay the move forward
	// - Pop from redo stack
	// - Transition to ANIMATING (board update happens after animation)

	if (!state.redoMoveStack || state.redoMoveStack.length === 0) {
		return state;
	}

	const moveToRedo = state.redoMoveStack[state.redoMoveStack.length - 1];
	const newRedoStack = state.redoMoveStack.slice(0, -1);

	return {
		...state,
		phase: GAME_PHASE.ANIMATING,
		previousPhase: GAME_PHASE.REPLAY,
		redoMoveStack: newRedoStack,
		// Redo uses normal from/to (forward animation)
		animatingMove: {
			...moveToRedo,
			isReverse: false,
		},
	};
};

export const handleUndoMove = (state) => {
	if (!state.moveHistory || state.moveHistory.length === 0) {
		return state;
	}

	const moveToUndo = state.moveHistory[state.moveHistory.length - 1];
	const newHistory = state.moveHistory.slice(0, -1);
	const newRedoStack = [...(state.redoMoveStack || []), moveToUndo];

	return {
		...state,
		phase: GAME_PHASE.ANIMATING,
		previousPhase: GAME_PHASE.REPLAY,
		moveHistory: newHistory,
		redoMoveStack: newRedoStack,
		animatingMove: {
			...moveToUndo,
			isReverse: true,
		},
	};
};

export const handleMenuAction = (state, action) => {
	switch (action) {
		case Actions.MENU_CHANGE_SIDES:
			return {
				...state,
				phase: GAME_PHASE.WAITING_FOR_PLAYER,
				computerColor:
					state.computerColor === Color.White
						? Color.Black
						: Color.White,
				// Clear pending move on side change
				pendingComputerMove: null,
			};

		case Actions.MENU_FORCE_MOVE:
			// Forcing a move is only allowed on computer's turn
			if (state.currentPlayer !== state.computerColor) return state;

			return {
				...state,
				phase: GAME_PHASE.WAITING_FOR_STOCKFISH,
				stockfishOperation: { type: "force_move" },
			};

		case Actions.MENU_TAKEBACK_REPLAY:
			return {
				...state,
				phase: GAME_PHASE.REPLAY,
			};

		case Actions.MENU_OFFER_DRAW:
			return {
				...state,
				phase: GAME_PHASE.WAITING_FOR_STOCKFISH,
				previousPhase: GAME_PHASE.MENU_ACTIONS,
				stockfishOperation: { type: "offer_draw" },
			};

		case Actions.MENU_BEGIN_NEW_GAME:
			return {
				...createInitialState(),
				phase: GAME_PHASE.WAITING_FOR_PLAYER,
			};

		default:
			console.warn(`Unknown menu action: ${action}`);
			return state;
	}
};

export const openMenu = (state) => {
	return {
		...state,
		phase: GAME_PHASE.MENU_ACTIONS,
		selectedSquare: null,
		possibleMoves: [],
		selectedOption: 0,
	};
};

// ============================================================================
// ANIMATION HANDLERS
// ============================================================================

export const executeMoveAnimation = (state, moveData) => {
	return {
		...state,
		phase: GAME_PHASE.ANIMATING,
		previousPhase: GAME_PHASE.WAITING_FOR_PLAYER,
		animatingMove: moveData,
		selectedSquare: null,
		possibleMoves: [],
		pendingComputerMove: null,
	};
};

export const onAnimationComplete = (state) => {
	// Apply the move to the board
	const newState = applyMoveToBoard(state, state.animatingMove);

	// Check if we should return to REPLAY
	if (state.previousPhase === GAME_PHASE.REPLAY) {
		return {
			...newState,
			phase: GAME_PHASE.REPLAY,
			previousPhase: null,
			animatingMove: null,
		};
	}

	// Check for game over (ONLY when not in replay)
	if (isGameOver(newState.board, newState.currentPlayer)) {
		return {
			...newState,
			phase: GAME_PHASE.GAME_OVER,
			previousPhase: null,
			animatingMove: null,
		};
	}

	return {
		...newState,
		phase: GAME_PHASE.WAITING_FOR_PLAYER,
		previousPhase: null,
		animatingMove: null,
	};
};
