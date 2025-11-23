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
			{ x: 0, y: this._moveDirection },
			// Forward 2 (only from start)
			{ x: 0, y: 2 * this._moveDirection },
			// Diagonal capture left
			{ x: -1, y: this._moveDirection },
			// Diagonal capture right
			{ x: 1, y: this._moveDirection },
		];
		this._FENChar =
			pieceColor === Color.White ? FENChar.WhitePawn : FENChar.BlackPawn;
	}

	isValidMove(from, to, board) {
		if (!super.isValidMove(from, to, board)) return false;

		const dx = to.col - from.col;
		const dy = to.row - from.row;
		const targetPiece = board[to.row][to.col];

		// Forward move (1 square)
		if (dx === 0 && dy === this._moveDirection) {
			return dy === this._moveDirection && !targetPiece; // true if empty, false if occupied
		}

		// Forward move (2 sqaures) - only if pawn hasn't moved
		if (dx === 0 && dy === 2 * this._moveDirection) {
			if (!this._hasMoved) {
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
			return false;
		}
		return false;
	}

	get hasMoved() {
		return this._hasMoved;
	}

	set hasMoved(v) {
		this._hasMoved = v;
	}
}
