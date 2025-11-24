import { FENChar, Color } from "../models";
import { Piece } from "./piece";

export class Rook extends Piece {
	constructor(pieceColor) {
		super(pieceColor);
		this._hasMoved = false;
		this._directions = [
			{ x: 0, y: 1 },
			{ x: 0, y: -1 },
			{ x: 1, y: 0 },
			{ x: -1, y: 0 },
		];
		this._FENChar =
			pieceColor === Color.White ? FENChar.WhiteRook : FENChar.BlackRook;
		this._type = "rook";
	}

	isValidMove(from, to, board, gameState = {}) {
		if (!super.isValidMove(from, to, board, gameState)) return false;
		// Must move in a straight line
		if (from.row !== to.row && from.col !== to.col) return false;
		// Can't stay in place
		if (from.row === to.row && from.col === to.col) return false;
		// Path must be clear
		return this.isPathClear(from, to, board);
	}

	getPossibleMoves(from, board, gameState = {}) {
		return this.getSlidingMoves(from, board, gameState);
	}

	get hasMoved() {
		return this._hasMoved;
	}

	set hasMoved(_) {
		this._hasMoved = true;
	}
}
