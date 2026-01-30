import { FENChar, Color } from "../models";
import { Piece } from "./piece";

export class King extends Piece {
	constructor(pieceColor) {
		super(pieceColor);
		this._hasMoved = false;
		this._directions = [
			{ x: 1, y: 0 },
			{ x: -1, y: 0 },
			{ x: 0, y: 1 },
			{ x: -1, y: 1 },
			{ x: 1, y: 1 },
			{ x: 0, y: -1 },
			{ x: 1, y: -1 },
			{ x: -1, y: -1 },
		];
		this._FENChar =
			pieceColor === Color.White ? FENChar.WhiteKing : FENChar.BlackKing;
		this._type = "king";
	}

	isValidMove(from, to, board, gameState = {}) {
		if (!super.isValidMove(from, to, board, gameState)) return false;
		const dx = Math.abs(to.col - from.col);
		const dy = Math.abs(to.row - from.row);
		// Normal king move (one square any direction)
		if (dx <= 1 && dy <= 1 && (dx !== 0 || dy !== 0)) return true;
		// Castling
		if (!this.hasMoved && dy === 0 && dx === 2) {
			return this.canCastle(from, to, board, gameState);
		}
		return false;
	}

	canCastle(from, to, board, gameState = {}) {
		const direction = to.col > from.col ? 1 : -1;
		const rookCol = direction === 1 ? 7 : 0;
		const rook = board[from.row][rookCol];
		// Check rook exists and hasn't moved
		if (!rook || rook.FENChar.toLowerCase() !== "r" || rook.hasMoved)
			return false;
		// Check path is clear between king and rook
		const rookSquare = { row: from.row, col: rookCol };
		if (!this.isPathClear(from, rookSquare, board)) return false;
		// The check for castling through check is handled in wouldMoveReusltInCheck
		return true;
	}

	getPossibleMoves(from, board, gameState = {}) {
		const moves = super.getPossibleMoves(from, board, gameState);
		// Add castling moves if king hasn't moved
		if (!this.hasMoved) {
			// Kingslide castling
			if (
				this.canCastle(
					from,
					{ row: from.row, col: 6 },
					board,
					gameState
				)
			) {
				moves.push({ row: from.row, col: 6 });
			}
			// Queenside castling
			if (
				this.canCastle(
					from,
					{ row: from.row, col: 2 },
					board,
					gameState
				)
			) {
				moves.push({ row: from.row, col: 2 });
			}
		}
		return moves;
	}

	get hasMoved() {
		return this._hasMoved;
	}

	set hasMoved(v) {
		this._hasMoved = v;
	}
}
