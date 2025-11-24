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
		return false;
	}

	get hasMoved() {
		return this._hasMoved;
	}

	set hasMoved(_) {
		this._hasMoved = true;
	}
}
