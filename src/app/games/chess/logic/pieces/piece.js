import { Color } from "../models";

export class Piece {
	constructor(color) {
		this._color = color;
		this._FENChar = undefined;
		this._directions = undefined;
		this._type = undefined;
	}

	clone() {
		const PieceClass = this.constructor;
		const cloned = new PieceClass(this.color);
		if (this.hasMoved !== undefined) {
			cloned.hasMoved = this.hasMoved;
		}
		return cloned;
	}

	// Each piece implements its own movement validation
	isValidMove(from, to, board) {
		// Base validation all pieces share
		const targetPiece = board[to.row][to.col];
		if (targetPiece && this.isSameColor(targetPiece)) {
			return false; // Can't capture own pieces
		}
		return true;
	}

	isSameColor(otherPiece) {
		const isWhite = (piece) => piece.color === Color.White;
		return isWhite(this) === isWhite(otherPiece);
	}

	// Helper for sliding pieces (rook, bishop, queen)
	isPathClear(from, to, board) {
		const dx = Math.sign(to.col - from.col);
		const dy = Math.sign(to.row - from.row);

		let currentRow = from.row + dy;
		let currentCol = from.col + dx;

		while (currentRow !== to.row || currentCol !== to.col) {
			if (board[currentRow][currentCol]) return false;
			currentRow += dy;
			currentCol += dx;
		}

		return true;
	}

	getSlidingMoves(from, board) {
		const attacks = [];
		for (const dir of this._directions) {
			let currentRow = from.row + dir.y;
			let currentCol = from.col + dir.x;
			// Continue in this direction until we hit the edge or a piece
			while (this.areCoordsValid(currentCol, currentRow)) {
				attacks.push({ row: currentRow, col: currentCol });
				// Stop if we hit a piece (but still include that square as attacked)
				if (board[currentRow][currentCol]) break;
				currentRow += dir.y;
				currentCol += dir.x;
			}
		}
		return attacks.filter((sq) => this.isValidMove(from, sq, board));
	}

	// Get all possible moves - base implementation
	getPossibleMoves(from, board) {
		return this._directions
			.map((dir) => ({
				row: from.row + dir.y,
				col: from.col + dir.x,
			}))
			.filter(
				(sq) =>
					this.areCoordsValid(sq.col, sq.row) &&
					this.isValidMove(from, sq, board)
			);
	}

	areCoordsValid(x, y) {
		return x >= 0 && y >= 0 && x < 8 && y < 8;
	}

	get getType() {
		return this._type;
	}

	get FENChar() {
		return this._FENChar;
	}

	get directions() {
		return this._directions;
	}

	get color() {
		return this._color;
	}
}
