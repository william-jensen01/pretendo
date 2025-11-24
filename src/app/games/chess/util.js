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
} from "./constants";
import * as presets from "./presets";
import { useGameBoyStore } from "@/app/store/gameboy";
import { Pawn } from "./logic/pieces";

export const createStaticChessGrid = () => {
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
			const charArr = presets[key];

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

	renderCoords(HORIZONTAL_AXIS, true);
	renderCoords(VERTICAL_AXIS, false);

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
	possibleMoves
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

	if (possibleMoves && possibleMoves.length > 0) {
		possibleMoves.forEach(({ row, col }) => {
			const gCol = col * SQUARE_SIZE + BOARD_OFFSET;
			const gRow = row * SQUARE_SIZE + BOARD_OFFSET;
			renderSquareHighlight(staticGrid, gRow, gCol, "possible");
		});
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
