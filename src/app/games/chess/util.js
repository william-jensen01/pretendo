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
} from "./constants";
import * as presets from "./presets";

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

export const renderBoardPieces = (board, staticGrid) => {
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
		rankRow.forEach((pieceSymbol, fileIdx) => {
			const gCol = fileIdx * SQUARE_SIZE + BOARD_OFFSET;
			const gRow = rankIdx * SQUARE_SIZE + BOARD_OFFSET;
			// 4. Render Game Pieces
			const pieceArr = presets.getPiece(pieceSymbol);
			if (!pieceArr) return;
			loopPiece(pieceArr, [gRow, gCol]);
		});
	});
};
