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
	["r", "n", "b", "q", "k", "b", "n", "r"], // Black back rank
	["p", "p", "p", "p", "p", "p", "p", "p"], // Black pawns
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	["P", "P", "P", "P", "P", "P", "P", "P"], // White pawns
	["R", "N", "B", "Q", "K", "B", "N", "R"], // White back rank
];
