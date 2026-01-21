import {
	DEFAULT_BOARD,
	ACTION_MENU_OPTIONS,
	SETTINGS_MENU_OPTIONS,
	ALERT,
	SETUP_MENU_OPTIONS,
	BASIC_BOARD
} from "../constants";
import { Color } from "../logic/models";
import { Actions } from "./actions";
import { GAME_PHASE } from "./states";
import { createInitialState } from "./reducer";
import {
	getPieceAt,
	calculatePossibleMoves,
	applyMoveToBoard,
} from "../logic/gameUtils";
import { isCheckmate, isStalemate } from "../logic";
import { parseStockfishMove, simpleBoardToFEN } from "../logic/FENConverter";
import { parseFEN, replayMovesFromFEN, FEN_PIECE_MAP } from "../logic/FENParser";
import { getBorderPieceAt, getHoveredSquare, deepCopyBoard } from "../util";

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
				startingBoard: DEFAULT_BOARD,
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
			return openMenu(state, GAME_PHASE.WAITING_FOR_PLAYER);

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
				previousPhase: GAME_PHASE.REPLAY,
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
			return openMenu(state, GAME_PHASE.GAME_OVER);

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
				// Have ALERT redirect to GAME_OVER
				phase: GAME_PHASE.ALERT,
				alert: ALERT.MESSAGE.DRAW_ACCEPTED,
				previousPhase: GAME_PHASE.GAME_OVER,
				stockfishOperation: null,
			};

		case Actions.DRAW_REJECTED:
			return {
				...state,
				// Have ALERT redirect to WAITING_FOR_PLAYER
				phase: GAME_PHASE.ALERT,
				alert: ALERT.MESSAGE.DRAW_REJECTED,
				previousPhase: GAME_PHASE.WAITING_FOR_PLAYER,
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

export const handleAlertPhase = (state, action, _) => {
	switch (action) {
		case Actions.A_BUTTON:
			// Dismiss alert and return to previous phase
			return {
				...state,
				phase: state.previousPhase || GAME_PHASE.WAITING_FOR_PLAYER,
				previousPhase: null,
				alert: null,
			};
		default:
			// Block all other inputs while alert is displayed
			return state;
	}
};

export const handleSetupBoardPhase = (state, action, payload) => {
	switch (action) {
		case Actions.SELECT_BUTTON:
			// Open setup menu
			return {
				...state,
				phase:  GAME_PHASE.SETUP_MENU
			}
		case Actions.A_BUTTON:
			return handleSetupSelectPiece(state, action, payload);

		case Actions.B_BUTTON:
			// Cancel move
			return {
				...state,
				selectedSetupPiece: null
			}

		default:
			return state;
	}
}

export const handleSetupMenuPhase = (state, action, payload) => {
	switch (action) {
		case Actions.SELECT_BUTTON:
			return {
				...state,
				phase: GAME_PHASE.SETUP_BOARD,
			};

		case Actions.A_BUTTON:
			return handleSetupMenuAction(state, payload);

		case Actions.DPAD:
			// Navigate settings options
			return handleMenuNavigation(
				state,
				payload.r,
				SETUP_MENU_OPTIONS
			);

		default:
			return state;
	}
}

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

	if (possibleMoves.length === 0) {
		return {
			...state,
			phase: GAME_PHASE.ALERT,
			previousPhase: GAME_PHASE.WAITING_FOR_PLAYER,
			alert: ALERT.MESSAGE.CAN_NOT_MOVE,
		};
	}

	return {
		...state,
		phase: GAME_PHASE.PIECE_SELECTED,
		selectedSquare: cursorPosition,
		possibleMoves,
	};
};

export const handleMovePiece = (state, targetPosition) => {
	// Check if clicking on the same square (deselect)
	const isSameSquare =
		state.selectedSquare.row === targetPosition.row &&
		state.selectedSquare.col === targetPosition.col;

	if (isSameSquare) {
		// Clicking on selected piece deselects it
		return handleCancelMove(state);
	}

	const isValidMove = state.possibleMoves.some(
		(move) =>
			move.row === targetPosition.row && move.col === targetPosition.col
	);

	if (!isValidMove) {
		// Clicked on invalid square - show illegal move alert
		return {
			...state,
			phase: GAME_PHASE.ALERT,
			previousPhase: GAME_PHASE.WAITING_FOR_PLAYER,
			alert: ALERT.MESSAGE.ILLEGAL_MOVE,
			selectedSquare: null,
			possibleMoves: [],
		};
	}

	// Execute move
	const moveData = {
		from: state.selectedSquare,
		to: targetPosition,
		piece: getPieceAt(state.board, state.selectedSquare),
		captured: getPieceAt(state.board, targetPosition),
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
		const [alertMessage, reason] = getGameOverAlert(
			state.board,
			state.currentPlayer
		);

		if (alertMessage) {
			return {
				...state,
				phase: GAME_PHASE.ALERT,
				previousPhase: GAME_PHASE.GAME_OVER,
				alert: alertMessage,
				gameOverReason: reason,
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
		captured: getPieceAt(state.board, to),
	};

	return executeMoveAnimation(state, moveData);
};

export const handleRedoMove = (state) => {
	// Redo = replay the move forward
	// - Pop from redo stack
	// - Transition to ANIMATING (board update happens after animation)

	if (!state.redoMoveStack || state.redoMoveStack.length === 0) {
		return {
			...state,
			phase: GAME_PHASE.ALERT,
			previousPhase: GAME_PHASE.WAITING_FOR_PLAYER,
			alert: ALERT.MESSAGE.NO_MOVES_TO_REPLAY,
		};
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
		return {
			...state,
			phase: GAME_PHASE.ALERT,
			previousPhase: GAME_PHASE.WAITING_FOR_PLAYER,
			alert: ALERT.MESSAGE.NO_MOVES_TO_UNDO,
		};
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

		case Actions.MENU_SETUP_BOARD:
			return {
				...state,
				phase: GAME_PHASE.SETUP_BOARD,
				selectedOption: 0,
				selectedSetupPiece: null,
				possibleMoves: [],
				capturedPieces: [],
				moveHistory: [],
				lastMove: null,
				redoMoveStack: [],
				selectedSquare: null,
			}

		case Actions.MENU_OFFER_DRAW:
			return {
				...state,
				phase: GAME_PHASE.WAITING_FOR_STOCKFISH,
				previousPhase: GAME_PHASE.MENU_ACTIONS,
				stockfishOperation: { type: "offer_draw" },
			};

		case Actions.MENU_LOAD_GAME:
			return handleLoadGame(state);

		case Actions.MENU_SAVE_GAME:
			return handleSaveGame(state);

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

const handleSetupMenuAction = (state, payload) => {
	switch (payload.selectedAction) {
		case Actions.SETUP_CLEAR_BOARD:
			return {
				...state,
				board: BASIC_BOARD,
				phase: GAME_PHASE.SETUP_BOARD,
			}
		case Actions.SETUP_INITIAL_POSITION:
			return {
				...state,
				board: DEFAULT_BOARD,
				phase: GAME_PHASE.SETUP_BOARD,
			}
		case Actions.SETUP_FIRST_MOVE:
			const newColor = payload.color === "white" ? Color.White : Color.Black;
			return {
				...state,
				pendingFirstMove: newColor 
			}
		case Actions.SETUP_COMPLETE:
			return {
				...state,
				phase: GAME_PHASE.WAITING_FOR_PLAYER,
				// board is modified during setup, so we don't need to redeclare it
				startingBoard: state.board,
				currentPlayer: state.pendingFirstMove,
				firstMove: state.pendingFirstMove,
				pendingFirstMove: null,
			}
		case Actions.SETUP_ABANDON_CHANGES:
			return {
				...state,
				board: DEFAULT_BOARD,
				phase: GAME_PHASE.WAITING_FOR_PLAYER,
				pendingFirstMove: null,
			}
		default:
			return state;
	}
}

const handleSetupSelectPiece = (state, action, payload) => {
	// Check if we're over a border piece
	const borderPiece = getBorderPieceAt();

	// Check if we're over a board square
	const hoveredSquare = getHoveredSquare(state.board);

	// CASE 1: No piece selected - pick up a piece
	if (!state.selectedSetupPiece) {
		// Try to pick up from border
		if (borderPiece) {
			const piece = FEN_PIECE_MAP[borderPiece.FENChar](borderPiece.color);
			return {
				...state,
				selectedSetupPiece: piece
			};
		}

		// Try to pick up from board
		if (hoveredSquare && hoveredSquare.piece) {
			const newBoard = deepCopyBoard(state.board);

			// Remove piece from board, will become cursor
			newBoard[hoveredSquare.row][hoveredSquare.col] = null;

			return {
				...state,
				board: newBoard,
				selectedSetupPiece: hoveredSquare.piece
			};
		}

		return state;
	}

	// CASE 2: Piece is selected - place or remove it
	else {
		// Check if placing in border (removal)
		if (borderPiece) {
			// Don't allow removing kings - they're required
			if (state.selectedSetupPiece.FENChar.toUpperCase() === 'K') {
				return state;
			}

			// Remove the piece
			return {
				...state,
				selectedSetupPiece: null
			};
		}

		// Place piece on board square
		if (hoveredSquare) {
			const newBoard = deepCopyBoard(state.board);
			newBoard[hoveredSquare.row][hoveredSquare.col] = state.selectedSetupPiece;

			return {
				...state,
				board: newBoard,
				selectedSetupPiece: null
			};
		}

		return state;
	}
}

const handleSaveGame = (state) => {
	try {
		// Create save data - save the process (starting position + moves)
		const saveData = {
			fen: simpleBoardToFEN(state.startingBoard, Color.White), // Starting position
			moves: state.moveHistory.map((m) => m.notation), // All moves from start
			computerColor: state.computerColor,
			firstMove: state.firstMove, // Color of first move (for custom setups)
		};

		// Save to localStorage
		localStorage.setItem("chess_save", JSON.stringify(saveData));
		console.log("Game saved:", saveData);

		return showAlert(state, ALERT.MESSAGE.GAME_SAVED, GAME_PHASE.WAITING_FOR_PLAYER);
	} catch (error) {
		console.error("Failed to save game:", error);
		return showAlert(state, ALERT.MESSAGE.SAVE_FAILED, GAME_PHASE.WAITING_FOR_PLAYER);
	}
}

const handleLoadGame = (state) => {
	try {
		// Retrieve save data
		const savedData = localStorage.getItem("chess_save");
		if (!savedData) {
			return showAlert(state, ALERT.MESSAGE.NO_SAVED_GAME, GAME_PHASE.WAITING_FOR_PLAYER);
		}

		// Parse and validate
		const saveData = JSON.parse(savedData);
		if (!saveData.fen || !Array.isArray(saveData.moves)) {
			return showAlert(state, ALERT.MESSAGE.CORRUPTED_SAVE, GAME_PHASE.WAITING_FOR_PLAYER);
		}

		// Parse starting position
		const { board: startingBoard } = parseFEN(saveData.fen);

		// Reconstruct current state by replaying moves from starting position
		const reconstructed = replayMovesFromFEN(saveData.fen, saveData.moves);

		console.log("Game loaded:", saveData);
		console.log("Reconstructed state:", reconstructed);

		// Return new state
		return {
			...createInitialState(),
			phase: GAME_PHASE.WAITING_FOR_PLAYER,
			startingBoard: startingBoard, // Save starting position
			board: reconstructed.board, // Current position after replay
			moveHistory: reconstructed.moveHistory,
			capturedPieces: reconstructed.capturedPieces,
			currentPlayer: reconstructed.currentPlayer,
			lastMove:
				reconstructed.moveHistory[reconstructed.moveHistory.length - 1] ||
				null,
			computerColor: saveData.computerColor,
			firstMove: saveData.firstMove || Color.White, // Restore firstMove or default to White
			redoMoveStack: [],
		};
	} catch (error) {
		console.error("Failed to load game:", error);
		return showAlert(state, ALERT.MESSAGE.LOAD_FAILED, GAME_PHASE.WAITING_FOR_PLAYER);
	}
}

export const openMenu = (state, returnToPhase) => {
	return {
		...state,
		phase: GAME_PHASE.MENU_ACTIONS,
		previousPhase: returnToPhase,
		selectedSquare: null,
		possibleMoves: [],
		selectedOption: 0,
	};
};

/**
 * Show an alert message
 */
export const showAlert = (state, message, returnToPhase = null) => {
	return {
		...state,
		phase: GAME_PHASE.ALERT,
		previousPhase: returnToPhase || state.phase,
		alert: message,
	};
};

/**
 * Determine game over type and return appropriate alert message
 * Returns null if game is not over
 */
export const getGameOverAlert = (board, currentPlayer) => {
	if (isCheckmate(currentPlayer, board)) {
		// The player who just moved won (opposite of current player)
		const winningColor =
			currentPlayer === Color.White ? Color.Black : Color.White;
		return [ALERT.MESSAGE.CREATE_CHECKMATE(winningColor), "checkmate"];
	} else if (isStalemate(currentPlayer, board)) {
		return [ALERT.MESSAGE.STALEMATE, "stalemate"];
	}
	return [null, null];
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

	// Get lastMove convenience accessor
	const lastMove =
		newState.moveHistory.length > 0
			? newState.moveHistory[newState.moveHistory.length - 1]
			: null;

	// Check if we should return to REPLAY
	if (state.previousPhase === GAME_PHASE.REPLAY) {
		return {
			...newState,
			phase: GAME_PHASE.REPLAY,
			previousPhase: null,
			animatingMove: null,
			lastMove,
		};
	}

	// Check for game over
	const [alertMessage, reason] = getGameOverAlert(
		newState.board,
		newState.currentPlayer
	);

	// Update lastMove with checkmate status if applicable
	if (lastMove && reason === "checkmate") {
		lastMove.resultsInCheckmate = true;
	}

	if (alertMessage) {
		return {
			...newState,
			phase: GAME_PHASE.ALERT,
			previousPhase: GAME_PHASE.GAME_OVER,
			alert: alertMessage,
			gameOverReason: reason,
			animatingMove: null,
			lastMove,
		};
	}

	return {
		...newState,
		phase: GAME_PHASE.WAITING_FOR_PLAYER,
		previousPhase: null,
		animatingMove: null,
		lastMove,
	};
};
