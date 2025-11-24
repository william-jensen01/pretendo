import { deepCopyBoard } from "../util";
import { Color } from "./models";

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
