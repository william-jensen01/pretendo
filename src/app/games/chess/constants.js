import { Rook, Knight, Bishop, Queen, King, Pawn } from "./logic/pieces";
import { Color } from "./logic/models";
import { rows } from "@/app/constants";

export const SQUARE_SIZE = 16;
export const SQUARE_PADDING = 1;
export const SQUARE_RENDER_SIZE = SQUARE_SIZE - SQUARE_PADDING * 2;

export const HORIZONTAL_AXIS = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const VERTICAL_AXIS = [8, 7, 6, 5, 4, 3, 2, 1];
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

export const SKILL_LEVEL = 0; // 0 = weakest, 20 = strongest

export const ANIMATION_SPEED = 1; // grid cells per animation frame

export const DATA_SCREEN_CONFIG = {
	BACKGROUND_COLOR: 3, // actual color value
	MARGIN: {
		TOP: 3,
		RIGHT: 4,
		BOTTOM: 3,
		LEFT: 3,
	},
	// Not actual color values but adjustments
	COLOR: {
		DEFAULT: 1,
		MOVE: 2,
		GUIDE: 1,
	},
	CAPTURES: {
		START_ROW: rows - 6 * 8,
		START_COL: {
			// Has to be retrievable using Color model
			// 0 = White, 1 = Black
			0: 0,
			1: 80,
		},
	},
	HISTORY: {
		START_ROW: 16,
		START_COL: 8,
		LINE_HEIGHT: 8,
		GAP_BETWEEN_MOVES: 16,
	},
	GUIDES: {
		COLOR: 0, // actual color value
		V_SEPARATOR: {
			COL: 8 * 13 + 3,
		},
		H_SEPARATOR: {
			ROW: 8 * 3 + 3,
			START_COL: 8 * 13 + 3,
		},
	},
};
