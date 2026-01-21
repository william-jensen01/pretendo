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

export const MENU_SCREEN_CONFIG = {
	BACKGROUND_COLOR: 3,
	MARGIN: {
		TOP: 16 + 3,
		RIGHT: 4,
		LEFT: 3,
	},
	ACTIONS: {
		MARGIN_BOTTOM: 16 + 4,
	},
	SETTINGS: {
		MARGIN_BOTTOM: 8 + 4,
	},
	COLOR: {
		TITLE: 1,
		SUBMENU: 2,
		OPTIONS: 2,
	},
	GUIDES: {
		COLOR: 0, // actual color value
		H_SEPARATOR: {
			ROW: 32 + 3,
		},
	},
};

export const ACTION_MENU_OPTIONS = [
	{
		key: "humanPlayers",
		display: "Human Players: .",
		values: [0, 1, 2],
		disabled: true,
	},
	{ key: "changeSides", display: "Change Sides", disabled: false },
	{ key: "forceMove", display: "Force Move", disabled: false },
	{ key: "takebackReplay", display: "Takeback/Replay", disabled: false },
	{ key: "setupBoard", display: "Set Up Board", disabled: false },
	{ key: "solveForMate", display: "Solve For Mate", disabled: true },
	{ key: "offerDraw", display: "Offer Draw", disabled: false },
	{ key: "loadGame", display: "Load Game", disabled: false },
	{ key: "saveGame", display: "Save Game", disabled: false },
	{ key: "beginNewGame", display: "Begin New Game", disabled: false },
];

export const SETTINGS_MENU_OPTIONS = [
	{
		key: "mateInMoves",
		display: "Mate In . Moves",
		values: [1, 2, 3, 4, 5],
		disabled: true,
	},
	{
		key: "level",
		display: "Level: .",
		values: Array.from({ length: 20 }, (_, i) => i + 1),
		disabled: false,
	},
	{
		key: "deepThinking",
		display: "Deep Thinking .",
		values: [true, false],
		labels: ["On", "Off"],
		disabled: true,
	},
	{
		key: "openingBook",
		display: "Opening Book .",
		values: [true, false],
		labels: ["On", "Off"],
		disabled: true,
	},
	{
		key: "teachingMode",
		display: "Teaching Mode .",
		values: [true, false],
		labels: ["On", "Off"],
		disabled: false,
	},
	{
		key: "coordinates",
		display: "Coordinates .",
		values: [true, false],
		labels: ["On", "Off"],
		disabled: false,
	},
	{
		key: "chessClock",
		display: "Chess Clock .",
		values: [true, false],
		labels: ["On", "Off"],
		disabled: true,
	},
	{
		key: "touchingRule",
		display: "Touching Rule .",
		values: [true, false],
		labels: ["On", "Off"],
		disabled: false,
	},
	{
		key: "whiteVisible",
		display: "White .",
		values: [true, false],
		labels: ["Visible", "Hidden"],
		disabled: true,
	},
	{
		key: "blackVisible",
		display: "Black .",
		values: [true, false],
		labels: ["Visible", "Hidden"],
		disabled: true,
	},
	{
		key: "whitePosition",
		display: "White On .",
		values: ["bottom", "left", "top", "right"],
		labels: ["Bottom", "Left", "Top", "Right"],
		disabled: true,
	},
];

export const ALERT = {
	MESSAGE: {
		ILLEGAL_MOVE: "THAT IS NOT A LEGAL MOVE",
		DRAW_REJECTED: "DRAW DECLINED",
		DRAW_ACCEPTED: "DRAW ACCEPTED",
		CREATE_CHECKMATE: (color) =>
			`${color === Color.White ? "WHITE" : "BLACK"} WINS BY CHECKMATE!`,
		CAN_NOT_MOVE: "THAT PIECE CAN NOT MOVE",
		NO_MOVES_TO_REPLAY: "NO MORE MOVES TO REPLAY",
		NO_MOVES_TO_UNDO: "NO MORE MOVES TO TAKE BACK",
		STALEMATE: "DRAW BY STALEMATE",
		GAME_SAVED: "GAME SAVED!",
		SAVE_FAILED: "FAILED TO SAVE GAME",
		NO_SAVED_GAME: "NO SAVED GAME FOUND",
		CORRUPTED_SAVE: "CORRUPTED SAVE DATA",
		LOAD_FAILED: "FAILED TO LOAD GAME",
	},
	CONFIG: {
		BOX: {
			LEFT_MARGIN: 8,
			RIGHT_MARGIN: 8,
			BORDER_THICKNESS: 8,
			TEXT_PADDING: 8,
		},
		COLOR: {
			SOFT: {
				BORDER: 1,
				INTERIOR: 3,
				TEXT: 1, // adjusted
			},
			HARSH: {
				BORDER: 2,
				INTERIOR: 3,
				TEXT: 1, // adjusted
			},
		},
	},
	getColor: (message) => {
		const softMessages = [
			ALERT.MESSAGE.ILLEGAL_MOVE,
			ALERT.MESSAGE.CAN_NOT_MOVE,
			ALERT.MESSAGE.NO_MOVES_TO_REPLAY,
			ALERT.MESSAGE.NO_MOVES_TO_UNDO,
		];
		if (softMessages.includes(message)) {
			return ALERT.CONFIG.COLOR.SOFT;
		}
		return ALERT.CONFIG.COLOR.HARSH;
	},
};

/**
 * Draw Declined
 * 	Border: 2
 * 	Interior: 3
 * 	Text: 1
 *
 * Draw Accepted
 */

export const SETUP_MENU_OPTIONS = [
	{
		key: "clearBoard",
		display: "Clear the Board",
		disabled: false,
	},
	{
		key: "initialPosition",
		display: "Initial Position",
		disabled: false,
	},
	{
		key: "firstMove",
		display: "First Move .",
		values: ["white", "black"],
		labels: ["White", "Black"],
		disabled: false,
	},
	{
		key: "setupComplete",
		display: "Setup Complete",
		disabled: false,
	},
	{
		key: "abandonChanges",
		display: "Abandon Changes",
		disabled: false,
	},
];

// Empty but has both kings
export const BASIC_BOARD = [
	[null, null, null, null, new King(Color.Black), null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, new King(Color.White), null, null, null],
];
