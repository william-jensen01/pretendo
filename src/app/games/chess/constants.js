import { Rook, Knight, Bishop, Queen, King, Pawn } from "./logic/pieces";
import { Color } from "./logic/models";

export const SQUARE_SIZE = 16;
export const SQUARE_PADDING = 1;
export const SQUARE_RENDER_SIZE = SQUARE_SIZE - SQUARE_PADDING * 2;

export const HORIZONTAL_AXIS = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const VERTICAL_AXIS = [
	"eight",
	"seven",
	"six",
	"five",
	"four",
	"three",
	"two",
	"one",
];
export const COORDINATE_CHAR_SIZE = 7;
export const COORDINATE_SIZE = COORDINATE_CHAR_SIZE + 1;

export const BOARD_MARGIN = 8; // except bottom
export const BOARD_OFFSET = BOARD_MARGIN + COORDINATE_SIZE;

export const NUM_FILES = 8;
export const NUM_RANKS = 8;
export const DEFAULT_BOARD = [
	[
		new Rook(Color.Black),
		new Knight(Color.Black),
		new Bishop(Color.Black),
		new Queen(Color.Black),
		new King(Color.Black),
		new Bishop(Color.Black),
		new Knight(Color.Black),
		new Rook(Color.Black),
	], // Black back rank
	[
		new Pawn(Color.Black),
		new Pawn(Color.Black),
		new Pawn(Color.Black),
		new Pawn(Color.Black),
		new Pawn(Color.Black),
		new Pawn(Color.Black),
		new Pawn(Color.Black),
		new Pawn(Color.Black),
	], // Black pawns
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[
		new Pawn(Color.White),
		new Pawn(Color.White),
		new Pawn(Color.White),
		new Pawn(Color.White),
		new Pawn(Color.White),
		new Pawn(Color.White),
		new Pawn(Color.White),
		new Pawn(Color.White),
	], // White pawns
	[
		new Rook(Color.White),
		new Knight(Color.White),
		new Bishop(Color.White),
		new Queen(Color.White),
		new King(Color.White),
		new Bishop(Color.White),
		new Knight(Color.White),
		new Rook(Color.White),
	], // Black back rank
];
