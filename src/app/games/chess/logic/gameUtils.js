import { Color } from "./models";
import {
	wouldMoveResultInCheck,
	isCheckmate,
	isStalemate,
	determineSpecialMove,
	applyMoveToBoard as applyMoveLogic,
	reverseMoveOnBoard,
	isInCheck,
} from "./index";
import { deepCopyBoard } from "../util";
import { Queen } from "./pieces";
import { GAME_PHASE } from "../state/states";

// ============================================================================
// CHESS LOGIC HELPER FUNCTIONS
// ============================================================================

/**
 * Get the piece at a specific board position
 */
export const getPieceAt = (board, position) => {
	if (!board || !position) return null;
	return board[position.row]?.[position.col] || null;
};

/**
 * Calculate all valid moves for a piece at a given position
 * Filters out moves that would result in check
 */
export const calculatePossibleMoves = (board, position, gameState) => {
	const piece = getPieceAt(board, position);
	if (!piece) return [];

	const candidateMoves = piece.getPossibleMoves(position, board, gameState);

	// Filter out moves that would result in check
	return candidateMoves.filter(
		(to) => !wouldMoveResultInCheck(position, to, board, piece.color)
	);
};

/**
 * Apply a move to the board and return updated state
 * Handles both forward moves and reverse (undo) moves
 */
export const applyMoveToBoard = (state, moveData) => {
	const { from, to, isReverse } = moveData;
	const newBoard = deepCopyBoard(state.board);
	const piece = newBoard[from.row][from.col];

	if (isReverse) {
		// Undo logic - reverse the move
		reverseMoveOnBoard(newBoard, moveData);

		// Remove captured piece from capturedPieces if this move captured a piece
		let newCapturedPieces = state.capturedPieces;
		if (moveData.captured) {
			// Find and remove the last occurrence of this piece
			const lastIndex = state.capturedPieces.length - 1;
			for (let i = lastIndex; i >= 0; i--) {
				const capturedPiece = state.capturedPieces[i];
				if (
					capturedPiece.FENChar === moveData.captured.FENChar &&
					capturedPiece.color === moveData.captured.color
				) {
					newCapturedPieces = [
						...state.capturedPieces.slice(0, i),
						...state.capturedPieces.slice(i + 1),
					];
					break;
				}
			}
		}

		return {
			...state,
			board: newBoard,
			currentPlayer:
				state.currentPlayer === Color.White ? Color.Black : Color.White,
			capturedPieces: newCapturedPieces,
		};
	}

	// Normal move logic
	const capturedPiece = newBoard[to.row][to.col];
	const originalHasMoved =
		piece.hasMoved !== undefined ? piece.hasMoved : null;

	const specialMove = determineSpecialMove(piece, from, to, capturedPiece);

	// Store original rook hasMoved state for castling
	let originalRookHasMoved = null;
	if (specialMove === "castle") {
		const direction = to.col > from.col ? 1 : -1;
		const rookCol = direction === 1 ? 7 : 0;
		const rook = newBoard[from.row][rookCol];
		originalRookHasMoved =
			rook?.hasMoved !== undefined ? rook.hasMoved : null;
	}

	// Handle promotion
	const PromotionClass = Queen; // TODO: add piece selection
	let promotionPiece = null;
	let promotionFENChar = "";
	if (specialMove === "promotion") {
		promotionPiece = new PromotionClass(piece.color);
		promotionFENChar = promotionPiece.FENChar;
	}

	// Apply the move
	applyMoveLogic(newBoard, {
		from,
		to,
		piece,
		special: specialMove,
		promotionPiece,
	});

	const nextPlayer =
		state.currentPlayer === Color.White ? Color.Black : Color.White;

	const moveEntry = {
		from,
		to,
		piece,
		captured: capturedPiece,
		notation: `${from.file || ""}${from.rank || ""}${to.file || ""}${
			to.rank || ""
		}${promotionFENChar}`,
		display: `${from.file || "?"}${from.rank || "?"}-${to.file || "?"}${
			to.rank || "?"
		}`,
		special: specialMove,
		originalHasMoved,
		originalRookHasMoved,
		resultsInCheck: isInCheck(nextPlayer, newBoard),
		resultsInCheckmate: false, // Set by onAnimationComplete
	};

	// Build updated state
	const newState = {
		...state,
		board: newBoard,
		currentPlayer: nextPlayer,
		moveHistory: [...state.moveHistory, moveEntry],
		capturedPieces: capturedPiece
			? [...state.capturedPieces, capturedPiece]
			: state.capturedPieces,
		// Clear redo stack when making a new move (not in replay)
		redoMoveStack:
			state.previousPhase === GAME_PHASE.REPLAY
				? state.redoMoveStack
				: [],
	};

	return newState;
};

/**
 * Check if the game is over (checkmate or stalemate)
 */
export const isGameOver = (board, currentPlayer) => {
	return (
		isCheckmate(currentPlayer, board) || isStalemate(currentPlayer, board)
	);
};
