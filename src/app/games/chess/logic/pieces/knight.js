import { FENChar, Color } from "../models";
import { Piece } from "./piece";

export class Knight extends Piece {
	constructor(pieceColor) {
		super(pieceColor);
		this._directions = [
			{ x: 2, y: 1 },
			{ x: -2, y: 1 },
			{ x: 2, y: -1 },
			{ x: -2, y: -1 },
			{ x: 1, y: 2 },
			{ x: -1, y: 2 },
			{ x: 1, y: -2 },
			{ x: -1, y: -2 },
		];
		this._FENChar =
			pieceColor === Color.White
				? FENChar.WhiteKnight
				: FENChar.BlackKnight;
		this._type = "knight";
	}

	isValidMove(from, to, board, gameState = {}) {
		if (!super.isValidMove(from, to, board, gameState)) return false;
		const dx = to.col - from.col;
		const dy = to.row - from.row;
		// Check if the move matches any of the knight's L-shaped patterns
		for (const dir of this._directions) {
			if (dx === dir.x && dy === dir.y) {
				return true;
			}
		}
		return false;
	}
}
