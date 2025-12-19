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
import { King, Pawn, Queen } from "./logic/pieces";
import Cell from "@/app/Cell";
import { delay } from "@/app/util/helper";
import { useStockfish } from "./logic/useStockfish";
import { boardToFEN, parseStockfishMove } from "./logic/FENConverter";

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

	const [hasTitled, setHasTitled] = useState(false);
	const [board, setBoard] = useState(DEFAULT_BOARD);
	const [selectedSquare, setSelectedSquare] = useState(null);
	const [possibleMoves, setPossibleMoves] = useState([]);
	const [currentPlayer, setCurrentPlayer] = useState(Color.White);
	const [lastMove, setLastMove] = useState(null);
	const [computerColor, setComputerColor] = useState(Color.Black);
	const FENRef = useRef(null);

	const { isReady, bestMove, getBestMove, newGame } = useStockfish();

	const updateBoardCursor = useCallback(
		(thinking) => {
			if (!hasTitled) return;
			setCursor((prev) => ({
				...prev,
				cells: thinking ? presets.thinking : presets.cursor,
			}));
		},
		[hasTitled]
	);

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
			if (!piece || piece.color !== currentPlayer) return [];
			const gameState = { lastMove };
			const from = { row, col };
			const candidateMoves = piece.getPossibleMoves(
				from,
				board,
				gameState
			);
			// Filter out moves that would result in check
			return candidateMoves.filter(
				(to) => !wouldMoveResultInCheck(from, to, board, piece.color)
			);
		},
		[board, currentPlayer, lastMove]
	);

	const loadGame = useCallback(async () => {
		setHasTitled(false);
		// setBoard(DEFAULT_BOARD);
		setGrid(() =>
			presets.titleScreen.map((row) =>
				row.map((c) => new Cell({ color: c }))
			)
		);
		// Initialize new game with desired difficulty
		newGame(0); // 0 = weakest, 20 = strongest
		await delay(1000);
		await delay(1500);
		setHasTitled(true);
		setCursor((prev) => ({ ...prev, display: true }));
	}, [setCursor, setGrid, newGame]);

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
		(from, to, promotionPiece = null) => {
			const newBoard = deepCopyBoard(board);
			const piece = newBoard[from.row][from.col];
			const capturedPiece = newBoard[to.row][to.col];

			// Handle en passant
			if (
				piece._type === "pawn" &&
				from.col !== to.col &&
				!capturedPiece
			) {
				newBoard[from.row][to.col] = null;
			}

			// Handle castling
			if (piece._type === "king" && Math.abs(to.col - from.col) === 2) {
				const direction = to.col > from.col ? 1 : -1;
				const rookCol = direction === 1 ? 7 : 0;
				const newRookCol = from.col + direction;

				const rook = newBoard[to.row][rookCol];
				newBoard[from.row][newRookCol] = rook;
				newBoard[from.row][rookCol] = null;
				if (rook && rook.hasMoved !== undefined) {
					rook.hasMoved = true;
				}
			}

			// Handle promotion
			// Todo: add piece selection (queen, rook, bishop, or knight)
			if (promotionPiece) {
				newBoard[to.row][to.col] = new Queen(piece.color); // default to queen
			} else {
				// Move piece
				newBoard[to.row][to.col] = piece;
			}

			newBoard[from.row][from.col] = null;

			// Update hasMoved flag if piece has it
			if (piece && piece.hasMoved !== undefined) {
				piece.hasMoved = true;
			}

			// Update game state
			setBoard(newBoard);
			setSelectedSquare(null);
			setPossibleMoves([]);
			setLastMove({ from, to, piece });

			// Switch players
			const nextPlayer =
				currentPlayer === Color.White ? Color.Black : Color.White;
			setCurrentPlayer(nextPlayer);
			updateBoardCursor(false);

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
			// Prevent interaction during computer's turn
			if (currentPlayer === computerColor) return;

			if (e.currentTarget.id === "a") {
				// find square closest to cursor
				const hoveredSquare = getHoveredSquare(board);
				if (!hoveredSquare) return;
				if (selectedSquare) {
					// MAKING A MOVE / PLACING PIECE
					const from = selectedSquare;
					const to = hoveredSquare;
					const piece = board[from.row][from.col];
					const gameState = { lastMove };

					if (
						piece &&
						isValidMove(piece, from, to, board, gameState) &&
						piece.color === currentPlayer
					) {
						// Check for pawn promotion
						if (piece instanceof Pawn && piece.isPromotion(to)) {
							return makeMove(from, to, true);
						}
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
			lastMove,
			computerColor,
		]
	);

	const handleGameSelect = useCallback(() => {}, []);

	const handleGameStart = useCallback(() => {}, []);

	const handleGameCellClick = useCallback(() => {}, []);

	const handleGameEEShortcuts = useCallback(() => {}, []);

	// Request and execute computer move in one place
	useEffect(() => {
		if (!hasTitled || currentPlayer !== computerColor || !isReady) return;

		updateBoardCursor(true);

		const fen = boardToFEN(board, currentPlayer, lastMove);

		getBestMove(fen, (move) => {
			// Handle no legal moves
			if (bestMove === "(none)" || bestMove === "none") {
				console.warn(
					"Stockfish returned no move - checking game state"
				);

				// Determine if it's checkmate or stalemate
				if (isCheckmate(computerColor, board)) {
					const winner =
						computerColor === Color.White ? "Black" : "White";
					window.alert(`${winner} wins by checkmate!`);
				} else if (isStalemate(computerColor, board)) {
					window.alert("Draw by stalemate");
				} else {
					// This shouldn't happen - likely invalid position
					console.error(
						"Invalid game state - no moves but not checkmate/stalemate"
					);
					console.error("Current FEN:", FENRef.current);
				}

				setCurrentPlayer(
					currentPlayer === Color.White ? Color.Black : Color.White
				);
				updateBoardCursor(false);
				return;
			}

			const parsedMove = parseStockfishMove(move);
			if (!parsedMove) return;

			const { from, to, promotion } = parsedMove;
			const piece = board[from.row][from.col];
			if (!piece) return;

			const isPromotion = piece instanceof Pawn && piece.isPromotion(to);
			makeMove(from, to, isPromotion || promotion);
		});
	}, [
		hasTitled,
		currentPlayer,
		computerColor,
		isReady,
		updateBoardCursor,
		board,
		getBestMove,
		lastMove,
		makeMove,
	]);

	useEffect(() => {
		// Set cursor to initial state, will update display status when game is loaded
		setCursor(() => ({ ...initialCursor }));
	}, []);

	useEffect(() => {
		if (initializing || !hasTitled) return; // don't run if console is initializing or game hasn't loaded yet
		setGrid(boardGrid);
	}, [initializing, hasTitled, setGrid, boardGrid]);

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
