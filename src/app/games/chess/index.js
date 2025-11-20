import { useState, useCallback, useEffect, useRef } from "react";
import {
	BOARD_OFFSET,
	DEFAULT_BOARD,
	SQUARE_SIZE,
	NUM_FILES,
	NUM_RANKS,
} from "./constants";
import { createStaticChessGrid, renderBoardPieces } from "./util";
import * as presets from "./presets";
import { useGameBoyStore } from "@/app/store/gameboy";
import { rows, columns } from "@/app/constants";

const initialCursor = {
	row: Math.floor(
		BOARD_OFFSET + (NUM_RANKS * SQUARE_SIZE) / 2 - presets.cursor.length / 2
	),
	col: Math.floor(
		BOARD_OFFSET + (NUM_FILES * SQUARE_SIZE) / 2 - presets.cursor.length / 2
	),
	cells: presets.cursor,
	display: false,
};

export default function Chess() {
	const setGameState = useGameBoyStore((state) => state.setGameState);
	const setGrid = useGameBoyStore((state) => state.setGrid);
	const setCursor = useGameBoyStore((state) => state.setCursor);

	const staticGridRef = useRef(createStaticChessGrid());

	const [board, setBoard] = useState(DEFAULT_BOARD);

	const applyBoardUpdate = useCallback(
		(newBoard) => {
			setBoard(newBoard);

			setGrid(() => {
				const next = staticGridRef.current.map((row) => [...row]);
				renderBoardPieces(newBoard, next);
				return next;
			});
		},
		[setGrid]
	);

	const loadGame = useCallback(() => {
		applyBoardUpdate(DEFAULT_BOARD);
		setCursor((prev) => ({ ...prev, display: true }));
	}, [applyBoardUpdate, setCursor]);

	const resetGame = useCallback(() => {}, []);

	const runGame = useCallback(() => {}, []);

	const handleGameCursor = useCallback(
		({ context, cursor, drawCell, rows, columns }) => {
			cursor?.cells?.forEach((row, rowIdx) => {
				row.forEach((cell, colIdx) => {
					if (!cell) return;
					const gRow = (cursor.row + rowIdx) % rows;
					const gCol = (cursor.col + colIdx) % columns;

					drawCell(context, gCol, gRow, cell - 1);
				});
			});
		},
		[]
	);

	const handleGameDpad = useCallback(
		(r, c) => {
			setCursor((prev) => {
				// restrict movement to within screen grid (prevent out of bounds)
				const nRow = Math.max(
					0,
					Math.min(prev.row + r, rows - prev.cells.length)
				);
				const nCol = Math.max(
					0,
					Math.min(prev.col + c, columns - prev.cells[0].length)
				);

				return {
					...prev,
					row: nRow,
					col: nCol,
				};
			});
		},
		[setCursor]
	);

	const handleGameAction = useCallback(() => {}, []);

	const handleGameSelect = useCallback(() => {}, []);

	const handleGameStart = useCallback(() => {}, []);

	const handleGameCellClick = useCallback(() => {}, []);

	const handleGameEEShortcuts = useCallback(() => {}, []);

	useEffect(() => {
		setCursor(() => ({ ...initialCursor }));
	}, []);

	useEffect(() => {
		setGameState({
			name: "chess",
			loadGame,
			resetGame,
			runGame,
			handleGameCursor,
			handleGameDpad,
			handleGameAction,
			handleGameSelect,
			handleGameStart,
			handleGameCellClick,
			handleGameEEShortcuts,
		});
	}, [
		setGameState,
		loadGame,
		resetGame,
		runGame,
		handleGameCursor,
		handleGameDpad,
		handleGameAction,
		handleGameSelect,
		handleGameStart,
		handleGameCellClick,
		handleGameEEShortcuts,
	]);
}
