import { FENChar, Color } from "../models";
import { Piece } from "./piece";

export class Bishop extends Piece {
	constructor(pieceColor) {
		super(pieceColor);
		this._directions = [
			{ x: 1, y: 1 },
			{ x: -1, y: 1 },
			{ x: 1, y: -1 },
			{ x: -1, y: -1 },
		];
		this._FENChar =
			pieceColor === Color.White
				? FENChar.WhiteBishop
				: FENChar.BlackBishop;
		this._type = "bishop";
	}

	isValidMove(from, to, board, gameState = {}) {
		if (!super.isValidMove(from, to, board, gameState)) return false;
		const dx = Math.abs(to.col - from.col);
		const dy = Math.abs(to.row - from.row);
		// Must move diagonally
		if (dx !== dy || dx === 0) return false;
		// Path must be clear
		return this.isPathClear(from, to, board);
	}

	getPossibleMoves(from, board, gameState = {}) {
		return this.getSlidingMoves(from, board, gameState);
	}
}
