import { FENChar, Color } from "../models";
import { Piece } from "./piece";

export class Pawn extends Piece {
	constructor(pieceColor) {
		super(pieceColor);
		this._type = "pawn";
		this._hasMoved = false;
		this._moveDirection = pieceColor === Color.White ? -1 : 1;
		// Unified directions (relative to board coordinates)
		this._directions = [
			// Forward 1
			{ x: 0, y: this._moveDirection, type: "move" },
			// Forward 2 (only from start)
			{ x: 0, y: 2 * this._moveDirection, type: "move" },
			// Diagonal capture left
			{ x: -1, y: this._moveDirection, type: "attack" },
			// Diagonal capture right
			{ x: 1, y: this._moveDirection, type: "attack" },
		];
		this._FENChar =
			pieceColor === Color.White ? FENChar.WhitePawn : FENChar.BlackPawn;
	}

	isValidMove(from, to, board, gameState = {}) {
		if (!super.isValidMove(from, to, board, gameState)) return false;

		const dx = to.col - from.col;
		const dy = to.row - from.row;
		const targetPiece = board[to.row][to.col];

		// Forward move (1 square)
		if (dx === 0 && dy === this._moveDirection) {
			return dy === this._moveDirection && !targetPiece; // true if empty, false if occupied
		}

		// Forward move (2 sqaures) - only if pawn hasn't moved
		if (dx === 0 && dy === 2 * this._moveDirection) {
			if (!this.hasMoved) {
				// Check if both squares are empty
				const intermediateRow = from.row + this._moveDirection;
				if (!board[intermediateRow][from.col] && !targetPiece) {
					return true;
				}
			}
			return false;
		}

		// Diagonal capture
		if (Math.abs(dx) === 1 && dy === this._moveDirection) {
			if (targetPiece && !this.isSameColor(targetPiece)) {
				return true;
			}

			// En passant
			const lastMove = gameState.lastMove;
			if (lastMove && lastMove.piece.FENChar.toLowerCase() === "p") {
				const movedTwoSquares =
					Math.abs(lastMove.to.row - lastMove.from.row) === 2;
				const isAdjacent =
					lastMove.to.row === from.row &&
					Math.abs(lastMove.to.col - from.col) === 1;
				const captureSquare =
					to.col === lastMove.to.col &&
					to.row === from.row + this._moveDirection;
				if (movedTwoSquares && isAdjacent && captureSquare) return true;
			}
		}
		return false;
	}

	// Pawns attack differently from their move direction
	getAttackingSquares(from, board) {
		return this._directions
			.filter((d) => d.type === "attack")
			.map((dir) => ({ row: from.row + dir.y, col: from.col + dir.x }))
			.filter((sq) => this.areCoordsValid(sq.col, sq.row));
	}

	get hasMoved() {
		return this._hasMoved;
	}

	set hasMoved(v) {
		this._hasMoved = v;
	}
}
