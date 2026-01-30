import { deepCopyBoard } from "../util";
import { Color } from "./models";
import { Pawn, Queen, Rook, Bishop, Knight } from "./pieces";

const PROMOTION_PIECES = {
	Q: Queen,
	q: Queen,
	R: Rook,
	r: Rook,
	B: Bishop,
	b: Bishop,
	N: Knight,
	n: Knight,
};

export const findKing = (board, color) => {
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const piece = board[r][c];
			if (
				piece &&
				piece.FENChar.toLowerCase() === "k" &&
				piece.color === color
			) {
				return { row: r, col: c };
			}
		}
	}
	return null;
};

export const isSquareUnderAttack = (square, byColor, board) => {
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const piece = board[r][c];
			if (!piece || piece.color !== byColor) continue;

			const attackingSquares = piece.getAttackingSquares(
				{ row: r, col: c },
				board
			);
			if (
				attackingSquares.some(
					(sq) => sq.row === square.row && sq.col === square.col
				)
			) {
				return true;
			}
		}
	}
	return false;
};

export const isInCheck = (color, board) => {
	const kingPos = findKing(board, color);
	if (!kingPos) return false;
	return isSquareUnderAttack(
		kingPos,
		color === Color.White ? Color.Black : Color.White,
		board
	);
};

export const wouldMoveResultInCheck = (from, to, board, color) => {
	const testBoard = deepCopyBoard(board);
	const piece = testBoard[from.row][from.col];

	// Handle en passant capture
	if (
		piece._type === "pawn" &&
		from.col !== to.col &&
		!testBoard[to.row][to.col]
	) {
		testBoard[from.row][to.col] = null;
	}

	// Handle castling
	if (piece._type === "king" && Math.abs(to.col - from.col) === 2) {
		const direction = to.col > from.col ? 1 : -1;
		const rookCol = direction === 1 ? 7 : 0;
		const newRookCol = from.col + direction;
		const passThroughCol = from.col + direction;
		const enemyColor = color === Color.White ? Color.Black : Color.White;
		// Check starting square BEFORE moving the king
		if (isSquareUnderAttack(from, enemyColor, testBoard)) {
			return true;
		}
		// Now simulate the castling move
		testBoard[to.row][to.col] = piece;
		testBoard[from.row][from.col] = null;
		testBoard[from.row][newRookCol] = testBoard[from.row][rookCol];
		testBoard[from.row][rookCol] = null;
		// Check pass-through and destination squares
		if (
			isSquareUnderAttack(
				{ row: from.row, col: passThroughCol },
				enemyColor,
				testBoard
			) ||
			isSquareUnderAttack(
				{ row: from.row, col: to.col },
				enemyColor,
				testBoard
			)
		) {
			return true;
		}

		return false;
	}

	// Normal move
	testBoard[to.row][to.col] = piece;
	testBoard[from.row][from.col] = null;

	return isInCheck(color, testBoard);
};

export const isValidMove = (piece, from, to, board, gameState) => {
	// First check piece-specific rules
	if (!piece.isValidMove(from, to, board, gameState)) return false;

	// Then check game-level rules (can't move into check)
	if (wouldMoveResultInCheck(from, to, board, piece.color)) return false;

	return true;
};

export const getAllValidMoves = (color, board, gameState) => {
	const moves = [];

	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const piece = board[r][c];
			if (piece && piece.color === color) {
				const from = { row: r, col: c };
				const candidateMoves = piece.getPossibleMoves(
					from,
					board,
					gameState
				);
				// Add moves that don't result in check
				candidateMoves.forEach((to) => {
					if (!wouldMoveResultInCheck(from, to, board, color)) {
						moves.push({ from, to });
					}
				});
			}
		}
	}
	return moves;
};

export const isCheckmate = (color, board) => {
	if (!isInCheck(color, board)) return false;
	return getAllValidMoves(color, board).length === 0;
};

export const isStalemate = (color, board) => {
	if (isInCheck(color, board)) return false;
	return getAllValidMoves(color, board).length === 0;
};

export const determineSpecialMove = (piece, from, to, capturedPiece) => {
	// Castling
	if (piece._type === "king" && Math.abs(to.col - from.col) === 2) {
		return "castle";
	}

	// En passant
	if (piece._type === "pawn" && from.col !== to.col && !capturedPiece) {
		return "enPassant";
	}

	// Promotion (will be handled separately)
	if (piece instanceof Pawn && piece.isPromotion(to)) {
		return "promotion";
	}
};

/**
 * Apply a move forward to the board (mutates board in place)
 * @param {Array} board - The chess board
 * @param {Object} moveData - Move data containing from, to, piece, special, and optionally promotionPiece or notation
 * @returns {Object|null} The promoted piece if promotion occurred, otherwise null
 */
export const applyMoveToBoard = (board, moveData) => {
	const { from, to, piece, special } = moveData;
	let { promotionPiece } = moveData;

	// If promotion but no promotionPiece provided, try to extract from notation
	if (special === "promotion" && !promotionPiece && moveData.notation) {
		const promotionChar = moveData.notation.slice(-1);
		const PromotionClass = PROMOTION_PIECES[promotionChar] || Queen;
		promotionPiece = new PromotionClass(piece.color);
	}

	// Handle en passant - remove captured pawn
	if (special === "enPassant") {
		board[from.row][to.col] = null;
	}

	// Handle castling - move rook
	if (special === "castle") {
		const direction = to.col > from.col ? 1 : -1;
		const rookCol = direction === 1 ? 7 : 0;
		const newRookCol = from.col + direction;

		const rook = board[from.row][rookCol];
		board[from.row][newRookCol] = rook;
		board[from.row][rookCol] = null;

		if (rook?.hasMoved !== undefined) {
			rook.hasMoved = true;
		}
	}

	// Move piece (use promoted piece if available)
	const pieceToPlace = promotionPiece || piece;
	board[to.row][to.col] = pieceToPlace;
	board[from.row][from.col] = null;

	// Set hasMoved flag
	if (piece?.hasMoved !== undefined) {
		piece.hasMoved = true;
	}

	return promotionPiece;
};

/**
 * Reverse a move on the board (mutates board in place)
 * @param {Array} board - The chess board
 * @param {Object} moveEntry - Move entry containing from, to, piece, captured, special, originalHasMoved, originalRookHasMoved
 */
export const reverseMoveOnBoard = (board, moveEntry) => {
	const {
		from,
		to,
		piece,
		captured,
		special,
		originalHasMoved,
		originalRookHasMoved,
	} = moveEntry;

	// Move piece back
	board[from.row][from.col] = piece;
	board[to.row][to.col] = captured;

	// Handle castling reversal - move rook back
	if (special === "castle") {
		const direction = to.col > from.col ? 1 : -1;
		const rookCol = direction === 1 ? 7 : 0;
		const newRookCol = from.col + direction;

		const rook = board[from.row][newRookCol];
		board[from.row][rookCol] = rook;
		board[from.row][newRookCol] = null;

		if (rook && originalRookHasMoved !== null) {
			rook.hasMoved = originalRookHasMoved;
		}
	}

	// Handle en passant reversal - restore captured pawn
	if (special === "enPassant") {
		board[from.row][to.col] = captured;
	}

	// Restore hasMoved flag
	if (piece && originalHasMoved !== null) {
		piece.hasMoved = originalHasMoved;
	}
};
