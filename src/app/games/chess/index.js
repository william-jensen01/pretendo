import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
	BOARD_OFFSET,
	DEFAULT_BOARD,
	SQUARE_SIZE,
	NUM_FILES,
	NUM_RANKS,
	HORIZONTAL_AXIS,
	ANIMATION_SPEED,
	SETTINGS_MENU_OPTIONS,
	ACTION_MENU_OPTIONS,
} from "./constants";
import {
	createStaticChessGrid,
	renderBoardPieces,
	getHoveredSquare,
	deepCopyBoard,
	renderPieceAt,
	renderDataScreen,
	renderMenuScreen,
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
import { Pawn, Queen } from "./logic/pieces";
import Cell from "@/app/Cell";
import { delay, continuouslyAnimate } from "@/app/util/helper";
import { useStockfish } from "./logic/useStockfish";
import { parseStockfishMove, historyToUCI } from "./logic/FENConverter";
import { useClickSequenceDetection } from "@/app/util/useClickSequenceDetection";

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
	const [computerColor, setComputerColor] = useState(Color.Black);
	const [moveHistory, setMoveHistory] = useState([]);
	const [capturedPieces, setCapturedPieces] = useState([]);
	const [moveHelp, setMoveHelp] = useState([]); // [best, hint] moves
	const [gameSettings, setGameSettings] = useState({
		// From actions menu
		humanPlayers: 1,
		// From settings menu
		mateInMoves: 1,
		level: 1,
		deepThinking: true,
		openingBook: true,
		teachingMode: false,
		coordinates: true,
		chessClock: false,
		touchingRule: false,
		whiteVisible: true,
		blackVisible: true,
		whitePosition: "bottom",
	});
	const [menuOptions, setMenuOptions] = useState(null);
	const [selectedOption, setSelectedOption] = useState(0);
	const [menuPhase, setMenuPhase] = useState(0);
	const animatingPieceRef = useRef(null);
	const animationRef = useRef({ running: false });
	const dataScreenRef = useRef(false);

	const { isReady, bestMove, getBestMove, newGame, getHint } = useStockfish(
		gameSettings.level
	);

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

	const getLastMove = useCallback(() => {
		return moveHistory?.length > 0
			? moveHistory[moveHistory.length - 1]
			: null;
	}, [moveHistory]);

	const getPossibleMoves = useCallback(
		(square) => {
			const { row, col } = square;
			const piece = board[row][col];
			if (!piece || piece.color !== currentPlayer) return [];
			const gameState = { lastMove: getLastMove() };
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
		[board, currentPlayer, getLastMove]
	);

	const menuActions = useMemo(
		() => ({
			changeSides: () => {
				setMenuPhase(0);
				setCursor((prev) => ({ ...prev, display: true }));

				setTimeout(() => {
					setComputerColor((prev) =>
						prev === Color.White ? Color.Black : Color.White
					);
				}, 0);
			},
			forceMove: () => {},
			takebackReplay: () => {},
			setupBoard: () => {},
			solveForMate: () => {},
			offerDraw: () => {},
			loadGame: () => {},
			saveGame: () => {},
			beginNewGame: () => {
				setMenuPhase(0);
				setBoard(DEFAULT_BOARD);
				setSelectedSquare(null);
				setPossibleMoves([]);
				setCurrentPlayer(Color.White);
				setComputerColor(Color.Black);
				setMoveHistory([]);
				setCapturedPieces([]);
				setMoveHelp([]);
				setCursor(() => ({ ...initialCursor, display: true }));

				newGame(gameSettings.level);
			},
		}),
		[newGame, gameSettings.level]
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

			// If in menu screen, change selected setting and update screen
			if (menuPhase === 1 || menuPhase === 2) {
				setSelectedOption(
					(selectedOption + r + menuOptions.length) %
						menuOptions.length
				);
			}
		},
		[setCursor, menuOptions, selectedOption, menuPhase]
	);

	// Build grid with current animation state
	const buildAnimatedGrid = useCallback(() => {
		const next = staticGridRef.current.map((row) => [...row]);
		const animating = animatingPieceRef.current;

		renderBoardPieces(
			board,
			next,
			selectedSquare,
			possibleMoves,
			animating
		);

		if (animating) {
			const pieceArr = presets.getPiece(animating.piece.FENChar);
			if (pieceArr) {
				renderPieceAt(next, pieceArr, {
					row: Math.round(animating.currentPos.row),
					col: Math.round(animating.currentPos.col),
				});
			}
		}

		return next;
	}, [board, selectedSquare, possibleMoves]);

	const animatePieceMove = useCallback(
		(piece, from, to, onComplete) => {
			if (from.row === to.row && from.col === to.col) {
				// No movement needed
				onComplete();
				return;
			}

			const fromGRow = from.row * SQUARE_SIZE + BOARD_OFFSET;
			const fromGCol = from.col * SQUARE_SIZE + BOARD_OFFSET;
			const toGRow = to.row * SQUARE_SIZE + BOARD_OFFSET;
			const toGCol = to.col * SQUARE_SIZE + BOARD_OFFSET;

			const dx = toGCol - fromGCol;
			const dy = toGRow - fromGRow;
			const distance = Math.sqrt(dx * dx + dy * dy);

			// Normalize to get unit vector, then scale by speed
			const velocity = {
				row: (dy / distance) * ANIMATION_SPEED,
				col: (dx / distance) * ANIMATION_SPEED,
			};

			animatingPieceRef.current = {
				piece,
				sourcePos: { row: from.row, col: from.col },
				currentPos: { row: fromGRow, col: fromGCol },
				targetPos: { row: toGRow, col: toGCol },
				velocity,
			};

			animationRef.current.running = true;

			const { animate } = continuouslyAnimate(
				"pieceMove",
				animationRef,
				() => {
					const anim = animatingPieceRef.current;
					if (!anim) return false;

					anim.currentPos.row += anim.velocity.row;
					anim.currentPos.col += anim.velocity.col;

					const remainingX = anim.targetPos.col - anim.currentPos.col;
					const remainingY = anim.targetPos.row - anim.currentPos.row;
					const remainingDist = Math.sqrt(
						remainingX * remainingX + remainingY * remainingY
					);

					const grid = buildAnimatedGrid();
					setGrid(grid);

					if (remainingDist < ANIMATION_SPEED) {
						console.log("piece animation complete...stopping");
						animatingPieceRef.current = null;
						animationRef.current.running = false;
						onComplete();
						return false;
					}

					return true;
				},
				0,
				60
			);

			animate();
		},
		[setGrid, buildAnimatedGrid]
	);

	const applyBoardUpdate = useCallback(
		(newBoard, nextPlayer, lastMove) => {
			setMoveHistory((prev) => [...prev, lastMove]);
			setBoard(newBoard);
			setCurrentPlayer(nextPlayer);
			setSelectedSquare(null);
			setPossibleMoves([]);
			updateBoardCursor(false);
			if (lastMove.captured)
				setCapturedPieces((prev) => [...prev, lastMove.captured]);

			// Check game status
			if (isCheckmate(nextPlayer, newBoard)) {
				window.alert(
					`${nextPlayer === Color.White ? "Black" : "White"} wins!`
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
		[updateBoardCursor]
	);

	const makeMove = useCallback(
		(from, to, promotionPiece = null) => {
			console.log("makeMove", { from, to, promotionPiece });
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
			const PromotionClass = Queen;
			let promotionFENChar;
			if (promotionPiece) {
				const PromotionPiece = new PromotionClass(piece.color);
				newBoard[to.row][to.col] = PromotionPiece;
				promotionFENChar = PromotionPiece.FENChar;
			} else {
				// Move piece
				newBoard[to.row][to.col] = piece;
			}

			newBoard[from.row][from.col] = null;

			// Update hasMoved flag if piece has it
			if (piece && piece.hasMoved !== undefined) {
				piece.hasMoved = true;
			}

			const nextPlayer =
				currentPlayer === Color.White ? Color.Black : Color.White;

			const moveEntry = {
				from,
				to,
				piece,
				captured: capturedPiece,
				notation: `${from.file}${from.rank}${to.file}${to.rank}${
					promotionFENChar ? promotionFENChar : ""
				}`,
				display: `${from.file}${from.rank}-${to.file}${to.rank}`,
			};

			// Only animate the computer's turn'
			if (currentPlayer === computerColor) {
				// Animate, then apply board update
				animatePieceMove(piece, from, to, () =>
					applyBoardUpdate(newBoard, nextPlayer, moveEntry)
				);
			} else {
				applyBoardUpdate(newBoard, nextPlayer, moveEntry);
			}
		},
		[
			board,
			currentPlayer,
			animatePieceMove,
			computerColor,
			applyBoardUpdate,
		]
	);

	const handleMenuAction = useCallback(
		(e) => {
			if (
				(menuPhase !== 1 && menuPhase !== 2) ||
				e.currentTarget.id !== "a"
			)
				return;

			const option = menuOptions[selectedOption];
			if (!option || option?.disabled) return;

			// Value-cycling option
			if (option.hasOwnProperty("values") && option.values) {
				setGameSettings((prev) => {
					const currentIndex = option.values.indexOf(
						prev[option.key]
					);
					const nextIndex = (currentIndex + 1) % option.values.length;
					return { ...prev, [option.key]: option.values[nextIndex] };
				});
			}
			// Action option
			else if (menuActions[option.key]) {
				menuActions[option.key]();
			}
		},
		[menuOptions, selectedOption, menuActions, menuPhase]
	);

	const handleGameAction = useCallback(
		(e) => {
			handleMenuAction(e);

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
					const gameState = { lastMove: getLastMove() };

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
			getLastMove,
			computerColor,
			handleMenuAction,
		]
	);

	const handleGameSelect = useCallback(() => {
		// Don't run if animation is ongoing or data screen is open
		if (animationRef.current.running || dataScreenRef.current) return;

		if (menuPhase === 0) {
			// Render action menu
			setMenuOptions(ACTION_MENU_OPTIONS);
			setMenuPhase(1);
			setCursor((prev) => ({ ...prev, display: false }));
		} else if (menuPhase === 1) {
			// Render settings menu
			setMenuOptions(SETTINGS_MENU_OPTIONS);
			setMenuPhase(2);
			setCursor((prev) => ({ ...prev, display: false }));
		} else if (menuPhase === 2) {
			// Close menu
			setMenuOptions(null);
			setMenuPhase(0);
			setCursor((prev) => ({ ...prev, display: true }));
			setBoard(board.map((row) => [...row]));
		}

		setSelectedOption(0);
	}, [board, menuActions, menuPhase]);

	const handleGameStart = useCallback(() => {}, []);

	const handleGameCellClick = useCallback(() => {}, []);

	const handleGameEEShortcuts = useMemo(
		() => [
			[
				["start"],
				() => {
					// Don't run if animation is ongoing
					if (animationRef.current.running) return;

					// Show Data Screen, cursor is hidden
					if (!dataScreenRef.current) {
						setCursor((prev) => ({ ...prev, display: false }));
						const parsedMoveHelp =
							moveHelp.length == 2
								? [
										parseStockfishMove(moveHelp[0]).display,
										parseStockfishMove(moveHelp[1]).display,
								  ]
								: [];
						setGrid(
							renderDataScreen(
								moveHistory,
								parsedMoveHelp,
								capturedPieces
							)
						);
					}

					// Go back to board view, cursor is visible
					if (dataScreenRef.current) {
						setBoard(board.map((row) => [...row]));
						setCursor((prev) => ({ ...prev, display: true }));
					}

					dataScreenRef.current = !dataScreenRef.current;
				},
			],
		],
		[board, moveHistory, currentPlayer, moveHelp, capturedPieces]
	);

	useClickSequenceDetection(handleGameEEShortcuts);

	// Request and execute computer move in one place
	useEffect(() => {
		if (!hasTitled || currentPlayer !== computerColor || !isReady) return;

		updateBoardCursor(true);

		const moves = historyToUCI(moveHistory);

		getBestMove(moves, (move) => {
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
				}

				setCurrentPlayer(
					currentPlayer === Color.White ? Color.Black : Color.White
				);
				updateBoardCursor(false);
				return;
			}

			const parsedMove = parseStockfishMove(move);
			if (!parsedMove) return;

			const { from, to, promotion, notation } = parsedMove;
			const piece = board[from.row][from.col];
			if (!piece) return;

			// get hint with new move
			getHint(moves + " " + notation, (info) => setMoveHelp(info));

			const isPromotion = piece instanceof Pawn && piece.isPromotion(to);
			makeMove(from, to, isPromotion || promotion);
		});
	}, [
		hasTitled,
		currentPlayer,
		computerColor,
		isReady,
		moveHistory,
		updateBoardCursor,
		getBestMove,
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
		if (initializing || !hasTitled || (menuPhase !== 1 && menuPhase !== 2))
			return;

		const menuGrid = renderMenuScreen(
			menuPhase,
			menuOptions,
			gameSettings,
			selectedOption
		);
		setGrid(menuGrid);
	}, [
		initializing,
		hasTitled,
		menuPhase,
		menuOptions,
		gameSettings,
		selectedOption,
	]);

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
	]);
}
