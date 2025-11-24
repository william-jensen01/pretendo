import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
	BOARD_OFFSET,
	DEFAULT_BOARD,
	SQUARE_SIZE,
	NUM_FILES,
	NUM_RANKS,
	HORIZONTAL_AXIS,
} from "./constants";
import {
	createStaticChessGrid,
	renderBoardPieces,
	getHoveredSquare,
	deepCopyBoard,
} from "./util";
import * as presets from "./presets";
import { useGameBoyStore } from "@/app/store/gameboy";
import { rows, columns } from "@/app/constants";
import { Color } from "./logic/models";
import {
	wouldMoveResultInCheck,
	isCheckmate,
	isStalemate,
	isInCheck,
	isValidMove,
} from "./logic";

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
	const initializing = useGameBoyStore((state) => state.initializing);

	const staticGridRef = useRef(createStaticChessGrid());

	const [board, setBoard] = useState(DEFAULT_BOARD);
	const [selectedSquare, setSelectedSquare] = useState(null);
	const [possibleMoves, setPossibleMoves] = useState([]);
	const [currentPlayer, setCurrentPlayer] = useState(Color.White);

	// Compute grid based on board and state
	const boardGrid = useMemo(() => {
		const next = staticGridRef.current.map((row) => [...row]);
		renderBoardPieces(board, next, selectedSquare, possibleMoves);
		return next;
	}, [board, selectedSquare, possibleMoves]);

	const getPossibleMoves = useCallback(
		(square) => {
			const { row, col } = square;
			const piece = board[row][col];
			if (!piece || piece.color !== currentPlayer) return;
			const from = { row, col };
			const candidateMoves = piece.getPossibleMoves(from, board);
			// Filter out moves that would result in check
			return candidateMoves.filter(
				(to) => !wouldMoveResultInCheck(from, to, board, piece.color)
			);
		},
		[board, currentPlayer]
	);

	const loadGame = useCallback(() => {
		setBoard(DEFAULT_BOARD);
		setCursor((prev) => ({ ...prev, display: true }));
	}, [setCursor]);

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

	const makeMove = useCallback(
		(from, to) => {
			const newBoard = deepCopyBoard(board);
			const piece = newBoard[from.row][from.col];

			newBoard[to.row][to.col] = piece;
			newBoard[from.row][from.col] = null;

			// Update hasMoved flag if piece has it
			if (piece && piece.hasMoved !== undefined) {
				piece.hasMoved = true;
			}

			setBoard(newBoard);
			setSelectedSquare(null);
			setPossibleMoves([]);
			setCursor((prev) => ({
				...prev,
				cells: presets.cursor,
			}));

			// Switch players
			const nextPlayer =
				currentPlayer === Color.White ? Color.Black : Color.White;
			setCurrentPlayer(nextPlayer);

			// Check game status
			if (isCheckmate(nextPlayer, newBoard)) {
				window.alert(
					`${currentPlayer === Color.White ? "White" : "Black"} wins!`
				);
			} else if (isStalemate(nextPlayer, newBoard)) {
				window.alert("Draw by stalemate");
			} else if (isInCheck(nextPlayer, newBoard)) {
				window.alert(
					`${
						nextPlayer === Color.White ? "White" : "Black"
					} is in check`
				);
			}
		},
		[board, currentPlayer]
	);

	const handleGameAction = useCallback(
		(e) => {
			if (e.currentTarget.id === "a") {
				// find square closest to cursor
				const hoveredSquare = getHoveredSquare(board);
				if (!hoveredSquare) return;
				if (selectedSquare) {
					// MAKING A MOVE / PLACING PIECE
					const from = selectedSquare;
					const to = hoveredSquare;
					const piece = board[from.row][from.col];

					if (piece && isValidMove(piece, from, to, board)) {
						makeMove(from, to);
					} else {
						// Select new piece if clicking on own piece
						const piece = hoveredSquare.piece;
						if (piece && piece.color === currentPlayer) {
							setSelectedSquare(hoveredSquare);
							setPossibleMoves(getPossibleMoves(hoveredSquare));
							setCursor((prev) => ({
								...prev,
								cells: presets.getPiece(piece.FENChar),
							}));
						} else {
							setSelectedSquare(null);
							setPossibleMoves([]);
							setCursor((prev) => ({
								...prev,
								cells: presets.cursor,
							}));
						}
					}
				} else {
					// SELECT / PICKUP PIECE
					const piece = hoveredSquare.piece;
					if (piece) {
						setSelectedSquare(hoveredSquare);
						setPossibleMoves(getPossibleMoves(hoveredSquare));
						setCursor((prev) => ({
							...prev,
							cells: presets.getPiece(piece.FENChar),
						}));
					}
				}
			}

			if (e.currentTarget.id === "b") {
				// CANCEL - Just reset visual state
				if (!selectedSquare) return;
				setSelectedSquare(null);
				setPossibleMoves([]);
				setCursor((prev) => ({ ...prev, cells: presets.cursor }));
			}
		},
		[
			board,
			makeMove,
			selectedSquare,
			setCursor,
			getPossibleMoves,
			currentPlayer,
		]
	);

	const handleGameSelect = useCallback(() => {}, []);

	const handleGameStart = useCallback(() => {}, []);

	const handleGameCellClick = useCallback(() => {}, []);

	const handleGameEEShortcuts = useCallback(() => {}, []);

	useEffect(() => {
		setCursor(() => ({ ...initialCursor }));
	}, []);

	useEffect(() => {
		if (initializing) return;
		setGrid(boardGrid);
	}, [initializing, setGrid, boardGrid]);

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
