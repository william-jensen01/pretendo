import { FENChar, Color } from "../models";
import { Piece } from "./piece";

export class Queen extends Piece {
	constructor(pieceColor) {
		super(pieceColor);
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
			pieceColor === Color.White
				? FENChar.WhiteQueen
				: FENChar.BlackQueen;
		this._type = "queen";
	}

	isValidMove(from, to, board, gameState = {}) {
		if (!super.isValidMove(from, to, board, gameState)) return false;
		const dx = Math.abs(to.col - from.col);
		const dy = Math.abs(to.row - from.row);
		// Must move in straight line or diagonal
		const isStraight = (dx === 0 && dy > 0) || (dy === 0 && dx > 0);
		const isDiagonal = dx === dy && dx !== 0;
		if (!isStraight && !isDiagonal) return false;
		// Path must be clear
		return this.isPathClear(from, to, board);
	}

	//
	getPossibleMoves(from, board, gameState = {}) {
		return this.getSlidingMoves(from, board, gameState);
	}
}
