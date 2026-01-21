import { create2dArray } from "@/app/util/helper";
import { rows, columns } from "@/app/constants";
import Cell from "@/app/Cell";
import {
	SQUARE_SIZE,
	BOARD_MARGIN,
	BOARD_OFFSET,
	COORDINATE_SIZE,
	HORIZONTAL_AXIS,
	VERTICAL_AXIS,
	NUM_RANKS,
	NUM_FILES,
	DATA_SCREEN_CONFIG,
	MENU_SCREEN_CONFIG,
	ALERT,
} from "./constants";
import * as presets from "./presets";
import { useGameBoyStore } from "@/app/store/gameboy";
import { Color } from "./logic/models";
import { Pawn } from "./logic/pieces";
import { GAME_PHASE } from "./state/states";

export const createStaticChessGrid = (showCoords = true) => {
	const grid = create2dArray();

	// 1. BORDER
	for (let r = BOARD_MARGIN; r < rows; r++) {
		for (let c = BOARD_MARGIN; c < columns - BOARD_MARGIN; c++) {
			grid[r][c] = new Cell({
				color: 3,
			});
		}
	}

	// 2. COORDINATES
	const renderCoords = (list, isAlpha) => {
		const offset = BOARD_MARGIN + COORDINATE_SIZE;

		list.forEach((key, idx) => {
			const normalizedKey =
				typeof key === "string" ? key.toUpperCase() : key;
			const charArr = presets.getChar(normalizedKey);

			if (!charArr) return;

			charArr.forEach((r, rIdx) => {
				r.forEach((c, cIdx) => {
					if (!c) return;

					const gCol = isAlpha
						? SQUARE_SIZE * idx + offset + cIdx + 4
						: cIdx + BOARD_MARGIN;
					const gRow = isAlpha
						? rIdx + BOARD_MARGIN
						: SQUARE_SIZE * idx + offset + rIdx + 4;

					grid[gRow][gCol] = new Cell({ color: 0 });
				});
			});
		});
	};

	if (showCoords) {
		renderCoords(HORIZONTAL_AXIS, true);
		renderCoords(VERTICAL_AXIS, false);
	}

	// 3. BOARD SQUARE COLORS
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const gRow = r * SQUARE_SIZE + BOARD_OFFSET;
			const gCol = c * SQUARE_SIZE + BOARD_OFFSET;
			const color = (r + c) % 2 === 0 ? 0 : 3;

			for (let sr = 0; sr < SQUARE_SIZE; sr++) {
				for (let sc = 0; sc < SQUARE_SIZE; sc++) {
					grid[gRow + sr][gCol + sc] = new Cell({ color });
				}
			}
		}
	}

	return grid;
};

export const renderSquareHighlight = (staticGrid, gRow, gCol, what) => {
	const highlightColor =
		what === "selected" ? 2 : what === "possible" ? 1 : 0;
	const thickness = 2;
	const padding = 2;
	const start = padding;
	const end = SQUARE_SIZE - padding;

	const set = (r, c) => {
		staticGrid[r][c] = new Cell({ color: highlightColor });
	};

	for (let offset = 0; offset < thickness; offset++) {
		// top border
		for (let x = start; x < end; x++) set(gRow + start + offset, gCol + x);

		// bottom border
		for (let x = start; x < end; x++)
			set(gRow + end - 1 - offset, gCol + x);

		// left border
		for (let y = start; y < end; y++) set(gRow + y, gCol + start + offset);

		// right border
		for (let y = start; y < end; y++)
			set(gRow + y, gCol + end - 1 - offset);
	}
};

export const renderBoardPieces = (
	board,
	staticGrid,
	selectedSquare,
	possibleMoves,
	animating = null,
	gameSettings = {},
) => {
	const loopPiece = (piece, [rOffset, cOffset] = [0, 0]) => {
		for (let r = 0; r < piece.length; r++) {
			for (let c = 0; c < piece[r].length; c++) {
				const color = piece[r][c];
				if (color === 0) continue; // ignore
				staticGrid[r + rOffset][c + cOffset] = new Cell({
					color: color - 1,
					vital_status: 1,
					vital_changed: false,
					blinking: false,
				});
			}
		}
	};

	board.forEach((rankRow, rankIdx) => {
		rankRow.forEach((piece, fileIdx) => {
			if (!piece) return;

			// Skip the piece being animated (it's rendered separately)
			if (
				animating &&
				rankIdx === animating.sourcePos.row &&
				fileIdx === animating.sourcePos.col
			) {
				return;
			}

			const gCol = fileIdx * SQUARE_SIZE + BOARD_OFFSET;
			const gRow = rankIdx * SQUARE_SIZE + BOARD_OFFSET;

			if (
				selectedSquare &&
				selectedSquare.row === rankIdx &&
				selectedSquare.col === fileIdx
			) {
				// Draw selection indicator
				renderSquareHighlight(staticGrid, gRow, gCol, "selected");
				return;
			}

			// Render piece if it exists and isn't selected
			const pieceArr = presets.getPiece(piece.FENChar);
			if (pieceArr) loopPiece(pieceArr, [gRow, gCol]);
		});
	});

	if (gameSettings?.teachingMode && possibleMoves && possibleMoves.length > 0) {
		possibleMoves.forEach(({ row, col }) => {
			const gCol = col * SQUARE_SIZE + BOARD_OFFSET;
			const gRow = row * SQUARE_SIZE + BOARD_OFFSET;
			renderSquareHighlight(staticGrid, gRow, gCol, "possible");
		});
	}
};

export const renderPieceAt = (grid, pieceArr, targetPos) => {
	const { row: rOffset, col: cOffset } = targetPos;
	for (let r = 0; r < pieceArr.length; r++) {
		for (let c = 0; c < pieceArr[r].length; c++) {
			const color = pieceArr[r][c];
			if (color === 0) continue; // ignore
			const gr = r + rOffset;
			const gc = c + cOffset;
			grid[gr][gc] = new Cell({ color: color - 1 });
		}
	}
};

export const deepCopyBoard = (board) => {
	return board.map((row) =>
		row.map((piece) => (piece ? piece.clone() : null))
	);
};

export const getHoveredSquare = (board) => {
	const cursor = useGameBoyStore.getState().cursor;
	const cursorRowStart = cursor.row;
	const cursorRowEnd = cursor.row + cursor.cells.length;
	const cursorColStart = cursor.col;
	const cursorColEnd = cursor.col + cursor.cells[0].length;

	let bestSquare = null;
	let bestArea = 0;
	board.forEach((rankRow, rIdx) => {
		rankRow.forEach((piece, fIdx) => {
			const sRowStart = rIdx * SQUARE_SIZE + BOARD_OFFSET;
			const sRowEnd = sRowStart + SQUARE_SIZE;
			const sColStart = fIdx * SQUARE_SIZE + BOARD_OFFSET;
			const sColEnd = sColStart + SQUARE_SIZE;

			// compute overlap rectangle
			const overlapRowStart = Math.max(cursorRowStart, sRowStart);
			const overlapRowEnd = Math.min(cursorRowEnd, sRowEnd);

			const overlapColStart = Math.max(cursorColStart, sColStart);
			const overlapColEnd = Math.min(cursorColEnd, sColEnd);

			const overlapWidth = overlapColEnd - overlapColStart;
			const overlapHeight = overlapRowEnd - overlapRowStart;

			if (overlapWidth > 0 && overlapHeight > 0) {
				const area = overlapWidth * overlapHeight;

				if (area > bestArea) {
					bestArea = area;

					// convert to chess notation
					const file = HORIZONTAL_AXIS[fIdx];
					const rank = NUM_RANKS - rIdx;
					bestSquare = {
						file,
						rank,
						row: rIdx,
						col: fIdx,
						piece,
					};
				}
			}
		});
	});

	return bestSquare;
};

export const getBorderPieceAt = () => {
	const cursor = useGameBoyStore.getState().cursor;
	const cursorRowStart = cursor.row;
	const cursorRowEnd = cursor.row + cursor.cells.length;
	const cursorColStart = cursor.col;
	const cursorColEnd = cursor.col + cursor.cells[0].length;

	// Define the static border pieces
	// Order: Q, R, B, N, P
	const pieces = ["Q", "R", "B", "N", "P"];
	const pROffset = 16;
	const pieceSize = 16;
	const pieceSpacing = 24; // 16 + 8 gap

	let bestPiece = null;
	let bestArea = 0;

	pieces.forEach((piece, idx) => {
		const pieceRowStart = pROffset + idx * pieceSpacing;
		const pieceRowEnd = pieceRowStart + pieceSize;

		// Check left side (white pieces)
		const leftColStart = 0;
		const leftColEnd = pieceSize;

		const leftOverlapRowStart = Math.max(cursorRowStart, pieceRowStart);
		const leftOverlapRowEnd = Math.min(cursorRowEnd, pieceRowEnd);
		const leftOverlapColStart = Math.max(cursorColStart, leftColStart);
		const leftOverlapColEnd = Math.min(cursorColEnd, leftColEnd);

		const leftOverlapWidth = leftOverlapColEnd - leftOverlapColStart;
		const leftOverlapHeight = leftOverlapRowEnd - leftOverlapRowStart;

		if (leftOverlapWidth > 0 && leftOverlapHeight > 0) {
			const area = leftOverlapWidth * leftOverlapHeight;
			if (area > bestArea) {
				bestArea = area;
				bestPiece = {
					FENChar: piece.toUpperCase(),
					color: Color.White,
					row: pieceRowStart,
					col: leftColStart,
				};
			}
		}

		// Check right side (black pieces)
		const rightColStart = columns - pieceSize - 1; // Match renderSetupScreen: columns - 16 - 1
		const rightColEnd = rightColStart + pieceSize;

		const rightOverlapRowStart = Math.max(cursorRowStart, pieceRowStart);
		const rightOverlapRowEnd = Math.min(cursorRowEnd, pieceRowEnd);
		const rightOverlapColStart = Math.max(cursorColStart, rightColStart);
		const rightOverlapColEnd = Math.min(cursorColEnd, rightColEnd);

		const rightOverlapWidth = rightOverlapColEnd - rightOverlapColStart;
		const rightOverlapHeight = rightOverlapRowEnd - rightOverlapRowStart;

		if (rightOverlapWidth > 0 && rightOverlapHeight > 0) {
			const area = rightOverlapWidth * rightOverlapHeight;
			if (area > bestArea) {
				bestArea = area;
				bestPiece = {
					FENChar: piece.toLowerCase(),
					color: Color.Black,
					row: pieceRowStart,
					col: rightColStart,
				};
			}
		}
	});

	return bestPiece;
};

// DATA SCREEN

export const renderText = (
	text,
	grid,
	rOffset,
	cOffset,
	color = DATA_SCREEN_CONFIG.COLOR.DEFAULT
) => {
	text.split("").forEach((c, idx) => {
		const charArr = presets.getChar(c);
		if (charArr) {
			const adjColorCharArr = charArr.map((r) =>
				r.map((c) => (c ? color : 0))
			);
			renderPieceAt(grid, adjColorCharArr, {
				row: rOffset,
				col: cOffset + idx * 8,
			});
		}
	});
};

const renderThinkingWindow = (bestMove, grid) => {
	renderText("BEST", grid, 32, 112, DATA_SCREEN_CONFIG.COLOR.GUIDE);
	if (bestMove && bestMove.length > 0) {
		renderText(bestMove, grid, 40, 112, DATA_SCREEN_CONFIG.COLOR.MOVE);
	}
};

const renderHint = (hintMove, grid) => {
	renderText("HINT", grid, 8, 112, DATA_SCREEN_CONFIG.COLOR.GUIDE);
	if (hintMove && hintMove.length > 0) {
		renderText(hintMove, grid, 16, 112, DATA_SCREEN_CONFIG.COLOR.MOVE);
	}
};

export const renderMoveHistory = (moveHistory, grid) => {
	if (!moveHistory || moveHistory.length === 0) return grid;

	// Can display up to 9 moves for each color

	const renderableRows = 9;
	const historySlice = moveHistory.slice(
		Math.max(moveHistory.length - renderableRows * 2, 0) // * 2 because we're rendering pairs
	);

	let currentRow = DATA_SCREEN_CONFIG.HISTORY.START_ROW;
	let currentCol = DATA_SCREEN_CONFIG.HISTORY.START_COL;

	// Format moves in pairs (White, Black)
	for (let i = 0; i < historySlice.length; i += 2) {
		const whiteMove = historySlice[i];
		const blackMove = historySlice[i + 1];

		// Render white's move
		if (whiteMove) {
			renderText(
				whiteMove.display,
				grid,
				currentRow,
				currentCol,
				DATA_SCREEN_CONFIG.COLOR.MOVE
			);
		}

		currentCol +=
			whiteMove.display.length * 8 +
			DATA_SCREEN_CONFIG.HISTORY.GAP_BETWEEN_MOVES; // spacing between moves

		// Render black's move
		if (blackMove) {
			renderText(
				blackMove.display,
				grid,
				currentRow,
				currentCol,
				DATA_SCREEN_CONFIG.COLOR.MOVE
			);
		}

		// Move to next line
		currentRow += DATA_SCREEN_CONFIG.HISTORY.LINE_HEIGHT;
		currentCol = DATA_SCREEN_CONFIG.HISTORY.START_COL;

		// Could add a break if currentRow exceeds screen space
		// But since we are rendering a set number of pairs, there's no need
		// if (currentRow > 96) break;
	}

	return grid;
};

const renderCapturedPieces = (captures, grid) => {
	if (!captures || captures.length === 0) return grid;

	const renderColorCaptures = (color, captures, grid) => {
		captures.forEach((piece, idx) => {
			const oRow = Math.floor(idx / 5);
			const oCol = idx % 5;
			const gRow = DATA_SCREEN_CONFIG.CAPTURES.START_ROW + oRow * 16;
			const gCol =
				DATA_SCREEN_CONFIG.CAPTURES.START_COL[color] + oCol * 16;
			renderPieceAt(grid, presets.getPiece(piece.FENChar), {
				row: gRow,
				col: gCol,
			});
		});
	};

	const whiteCaptures = captures.filter((p) => p.color === Color.Black);
	const blackCaptures = captures.filter((p) => p.color === Color.White);

	renderColorCaptures(Color.White, whiteCaptures, grid);
	renderColorCaptures(Color.Black, blackCaptures, grid);
};

export const renderDataScreen = (moveHistory, moveHelp, capturedPieces) => {
	const grid = create2dArray();
	const { TOP, RIGHT, BOTTOM, LEFT } = DATA_SCREEN_CONFIG.MARGIN;
	const boxHeight = 89; // height not index
	const boxWidth = columns - 1 - LEFT - RIGHT;

	const bottomY = TOP + boxHeight - 1;
	const rightX = LEFT + boxWidth;

	// set everything to be black
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < columns; c++) {
			grid[r][c] = new Cell({
				color: DATA_SCREEN_CONFIG.BACKGROUND_COLOR,
			});
		}
	}

	// Render Outlines

	// top border
	for (let x = LEFT; x <= boxWidth + LEFT; x++)
		grid[TOP][x] = new Cell({ color: DATA_SCREEN_CONFIG.GUIDES.COLOR });

	// bottom border
	for (let x = LEFT; x <= boxWidth + LEFT; x++)
		grid[bottomY][x] = new Cell({ color: DATA_SCREEN_CONFIG.GUIDES.COLOR });

	// left border
	for (let y = TOP; y <= bottomY; y++) {
		grid[y][LEFT] = new Cell({ color: DATA_SCREEN_CONFIG.GUIDES.COLOR });
	}

	// right border
	for (let y = TOP; y <= bottomY; y++) {
		grid[y][rightX] = new Cell({ color: DATA_SCREEN_CONFIG.GUIDES.COLOR });
	}

	// vertical separator line
	for (let y = TOP; y <= bottomY; y++) {
		grid[y][DATA_SCREEN_CONFIG.GUIDES.V_SEPARATOR.COL] = new Cell({
			color: DATA_SCREEN_CONFIG.GUIDES.COLOR,
		});
	}

	// horizontal separator line
	for (
		let x = DATA_SCREEN_CONFIG.GUIDES.H_SEPARATOR.START_COL;
		x <= rightX;
		x++
	) {
		grid[DATA_SCREEN_CONFIG.GUIDES.H_SEPARATOR.ROW][x] = new Cell({
			color: 0,
		});
	}

	renderText("WHITE", grid, 8, 8, DATA_SCREEN_CONFIG.COLOR.GUIDE);
	renderText("BLACK", grid, 8, 64, DATA_SCREEN_CONFIG.COLOR.GUIDE);
	renderMoveHistory(moveHistory, grid);

	// Render Help Values, ie. best and hint
	const [bestMove, hintMove] = moveHelp;
	// From manual: "Let's you know that the Chessmaster is thinking during the game."
	renderThinkingWindow(bestMove, grid);
	renderHint(hintMove, grid);

	renderCapturedPieces(capturedPieces, grid);

	return grid;
};

// MENU SCREEN

export const renderMenuScreen = (
	phase,
	options,
	gameSettings,
	selectedOption = 0
) => {
	const grid = create2dArray();

	// set everything to be black
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < columns; c++) {
			grid[r][c] = new Cell({
				color: DATA_SCREEN_CONFIG.BACKGROUND_COLOR,
			});
		}
	}

	const phaseMarginBottom =
		phase === 1
			? MENU_SCREEN_CONFIG.ACTIONS.MARGIN_BOTTOM
			: phase === 2
			? MENU_SCREEN_CONFIG.SETTINGS.MARGIN_BOTTOM
			: phase === GAME_PHASE.SETUP_MENU
			? 56 + 4
			: 0;

	// Outlines
	const width =
		columns -
		MENU_SCREEN_CONFIG.MARGIN.LEFT -
		MENU_SCREEN_CONFIG.MARGIN.RIGHT +
		1;

	// Left / Right Border
	for (
		let y = MENU_SCREEN_CONFIG.MARGIN.TOP;
		y <= rows - phaseMarginBottom - 1;
		y++
	) {
		grid[y][MENU_SCREEN_CONFIG.MARGIN.LEFT] = new Cell({
			color: MENU_SCREEN_CONFIG.GUIDES.COLOR,
		});
		grid[y][columns - MENU_SCREEN_CONFIG.MARGIN.RIGHT - 1] = new Cell({
			color: MENU_SCREEN_CONFIG.GUIDES.COLOR,
		});
	}

	// Top / Bottom Border
	for (let x = MENU_SCREEN_CONFIG.MARGIN.LEFT; x <= width; x++) {
		grid[MENU_SCREEN_CONFIG.MARGIN.TOP][x] = new Cell({
			color: MENU_SCREEN_CONFIG.GUIDES.COLOR,
		});
		grid[rows - phaseMarginBottom - 1][x] = new Cell({
			color: MENU_SCREEN_CONFIG.GUIDES.COLOR,
		});
	}

	// Separator
	for (let x = MENU_SCREEN_CONFIG.MARGIN.LEFT; x <= width; x++) {
		grid[MENU_SCREEN_CONFIG.GUIDES.H_SEPARATOR.ROW][x] = new Cell({
			color: MENU_SCREEN_CONFIG.GUIDES.COLOR,
		});
	}

	renderText("THE CHESSMASTER", grid, 8, 24, MENU_SCREEN_CONFIG.COLOR.TITLE);
	if (phase === 1) {
		renderText("Actions", grid, 24, 56, MENU_SCREEN_CONFIG.COLOR.SUBMENU);
	} else if (phase === 2) {
		renderText("Settings", grid, 24, 48, MENU_SCREEN_CONFIG.COLOR.SUBMENU);
	} else if (phase === GAME_PHASE.SETUP_MENU) {
		renderText("Setup Menu", grid, 24, 40, 1);
	}

	// Render the menu options and the arrow on selected option
	options &&
		options.length > 0 &&
		options.forEach((s, idx) => {
			const split = s.display.split(".");
			let name = s.display;
			if (split.length > 1 && s.values) {
				const currentValue = gameSettings[s.key];
				const valueIndex = s.values.indexOf(currentValue);
				// Use label if available, otherwise use the raw value
				const displayValue = s.labels
					? s.labels[valueIndex]
					: currentValue;
				name = split.join(displayValue ?? "");
			}

			const oRow = 40 + idx * 8;
			const oCol = 16;
			renderText(
				name,
				grid,
				oRow,
				oCol,
				MENU_SCREEN_CONFIG.COLOR.OPTIONS
			);

			// Render a strikethrough on disabled options
			if (s.disabled) {
				for (let i = oCol; i < name.length * 8 + oCol; i++) {
					grid[oRow + 3][i] = new Cell({
						color: 2,
					});
					grid[oRow + 4][i] = new Cell({ color: 2 });
				}
			}

			// Render arrow pointer at this row
			if (selectedOption === idx) {
				renderPieceAt(grid, presets["arrow"], {
					row: oRow,
					col: 8,
				});
			}
		});

	return grid;
};

export const renderAlertScreen = (alertText, board) => {
	// Create a chess grid with no coordinates
	const grid = createStaticChessGrid(false);
	renderBoardPieces(board, grid, null, null, null, false);

	// Constants
	const {
		LEFT_MARGIN: leftMargin,
		RIGHT_MARGIN: rightMargin,
		BORDER_THICKNESS: borderThickness,
		TEXT_PADDING: textPadding,
	} = ALERT.CONFIG.BOX;
	const charWidth = 8;
	const lineHeight = 8;
	const ALERT_COLOR = ALERT.getColor(alertText);

	// Calculate maximum available text area (within margins)
	const maxTextAreaWidth =
		columns -
		leftMargin -
		rightMargin -
		borderThickness * 2 -
		textPadding * 2;
	const maxCharsPerLine = Math.floor(maxTextAreaWidth / charWidth);

	// Capitalize and split text into lines
	const words = alertText.toUpperCase().split(" ");
	const lines = [];
	let currentLine = "";

	words.forEach((word) => {
		const testLine = currentLine ? `${currentLine} ${word}` : word;
		if (testLine.length <= maxCharsPerLine) {
			currentLine = testLine;
		} else {
			if (currentLine) lines.push(currentLine);
			currentLine = word;
		}
	});
	if (currentLine) lines.push(currentLine);

	// Calculate actual text dimensions
	const longestLineLength = Math.max(...lines.map((line) => line.length));
	const textWidth = longestLineLength * charWidth;
	const textHeight = lines.length * lineHeight;

	// Calculate box dimensions based on text
	const boxWidth = textWidth + textPadding * 2 + borderThickness * 2;
	const boxHeight = textHeight + textPadding * 2 + borderThickness * 2;

	// Center the box, respecting margins, rounded to nearest 8-pixel square
	// Favor left side having more gap when sides are asymmetric .... ceil()
	const idealStartCol = Math.ceil((columns - boxWidth) / 2 / 8) * 8;
	// Push the box down by one 8-pixel square
	const idealStartRow = Math.floor((rows - boxHeight + 8) / 2 / 8) * 8;

	// Ensure box stays within margins
	const startCol = Math.max(leftMargin, idealStartCol);
	const startRow = Math.max(0, idealStartRow);

	// Draw border box
	const boxEndRow = startRow + boxHeight;
	const boxEndCol = startCol + boxWidth;

	for (let r = startRow; r < boxEndRow; r++) {
		for (let c = startCol; c < boxEndCol; c++) {
			// Check if we're in the border area
			const isTopBorder = r < startRow + borderThickness;
			const isBottomBorder = r >= boxEndRow - borderThickness;
			const isLeftBorder = c < startCol + borderThickness;
			const isRightBorder = c >= boxEndCol - borderThickness;

			if (
				isTopBorder ||
				isBottomBorder ||
				isLeftBorder ||
				isRightBorder
			) {
				grid[r][c] = new Cell({
					color: ALERT_COLOR.BORDER,
				});
			} else {
				// Interior of the box (background)
				grid[r][c] = new Cell({
					color: ALERT_COLOR.INTERIOR,
				});
			}
		}
	}

	// Render text lines (centered horizontally within the box)
	const textStartRow = startRow + borderThickness + textPadding;
	const textStartCol = startCol + borderThickness + textPadding;

	lines.forEach((line, idx) => {
		const rowOffset = textStartRow + idx * lineHeight;
		// Center each line horizontally within the box, rounded to nearest 8-pixel square
		const lineWidth = line.length * charWidth;
		const horizontalOffset =
			Math.round((textWidth - lineWidth) / 2 / 8) * 8;
		const centeredCol = textStartCol + horizontalOffset;
		renderText(line, grid, rowOffset, centeredCol, ALERT_COLOR.TEXT);
	});

	return grid;
};



export const renderSetupScreen = (board) => {
	const grid = create2dArray();

	// BORDER
	for (let t = 0; t < 16; t++) {
		// Left and Right Vertical Borders
		for (let r = 0; r < rows; r++) {
			grid[r][t] = new Cell({ color: 1 });
			grid[r][columns - 1 - t] = new Cell({ color: 1 });
		}

		// Top Horizontal Border
		for (let c = 0; c < columns; c++) {
			grid[t][c] = new Cell({
				color: 1,
			});
		}
	}

	// BOARD SQUARE COLORS
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const gRow = r * SQUARE_SIZE + BOARD_OFFSET;
			const gCol = c * SQUARE_SIZE + BOARD_OFFSET;
			const color = (r + c) % 2 === 0 ? 0 : 3;

			for (let sr = 0; sr < SQUARE_SIZE; sr++) {
				for (let sc = 0; sc < SQUARE_SIZE; sc++) {
					grid[gRow + sr][gCol + sc] = new Cell({ color });
				}
			}
		}
	}

	// STATIC PIECES
	const pieces = ["Q", "R", "B", "N", "P"];
	const pROffset = 16;
	pieces.forEach((piece, idx) => {
		// Render white piece
		const wPieceArr = presets.getPiece(piece.toUpperCase());
		renderPieceAt(grid, wPieceArr, {
			row: pROffset + idx * (16 + 8),
			col: 0,
		});

		// Render black piece
		const bPieceArr = presets.getPiece(piece.toLowerCase());
		renderPieceAt(grid, bPieceArr, {
			row: pROffset + idx * (16 + 8),
			col: columns - 16 - 1,
		});
	});

	renderBoardPieces(board, grid, null, null, null);

	return grid;
};
