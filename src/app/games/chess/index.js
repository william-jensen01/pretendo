import {
	useState,
	useCallback,
	useEffect,
	useRef,
	useMemo,
	useReducer,
} from "react";
import {
	BOARD_OFFSET,
	DEFAULT_BOARD,
	SQUARE_SIZE,
	NUM_FILES,
	NUM_RANKS,
	HORIZONTAL_AXIS,
	ANIMATION_SPEED,
	ACTION_MENU_OPTIONS,
	SETTINGS_MENU_OPTIONS,
} from "./constants";
import {
	createStaticChessGrid,
	renderBoardPieces,
	getHoveredSquare,
	renderPieceAt,
	renderDataScreen,
	renderMenuScreen,
	renderAlertScreen,
} from "./util";
import * as presets from "./presets";
import { useGameBoyStore } from "@/app/store/gameboy";
import { rows, columns } from "@/app/constants";
import Cell from "@/app/Cell";
import { delay, continuouslyAnimate } from "@/app/util/helper";
import { useStockfish } from "./logic/useStockfish";
import { historyToUCI } from "./logic/FENConverter";
import { gameReducer, createInitialState } from "./state/reducer";
import {
	Actions,
	createButtonAction,
	createMenuAction,
	createCursorAction,
	createPieceSelectAction,
	createComputerMoveAction,
	createStockfishAction,
} from "./state/actions";
import { GAME_PHASE } from "./state/states";

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

	const [state, dispatch] = useReducer(gameReducer, createInitialState());

	const [moveHelp, setMoveHelp] = useState([]); // [best, hint] moves
	const [gameSettings, setGameSettings] = useState({
		// From actions menu
		humanPlayers: 2,
		// From settings menu
		mateInMoves: 1,
		level: 1,
		deepThinking: "Off",
		sound: "On",
	});
	const animatingPieceRef = useRef(null);
	const animationRef = useRef({ running: false });

	const isGameReady = useMemo(
		() =>
			state.phase !== GAME_PHASE.INITIALIZING &&
			state.phase !== GAME_PHASE.WELCOMING,
		[state.phase]
	);

	const { isReady, getBestMove, newGame, getHint, offerDraw, forceMove } =
		useStockfish(1);

	// Compute grid based on board and state
	const boardGrid = useMemo(() => {
		const next = staticGridRef.current.map((row) => [...row]);
		renderBoardPieces(
			state.board,
			next,
			state.selectedSquare,
			state.possibleMoves
		);
		return next;
	}, [state.board, state.selectedSquare, state.possibleMoves]);

	const loadGame = useCallback(async () => {
		dispatch({ type: Actions.INITIALIZATION_COMPLETE });
		setGrid(() =>
			presets.titleScreen.map((row) =>
				row.map((c) => new Cell({ color: c }))
			)
		);
		// Initialize new game with desired difficulty
		newGame(0); // 0 = weakest, 20 = strongest
		await delay(1000);
		await delay(1500);
		dispatch({ type: Actions.TITLE_SCREEN_COMPLETE });
		setCursor((prev) => ({ ...prev, display: true }));
	}, [setCursor, setGrid, newGame]);

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
			// Move visual cursor
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

			dispatch(createCursorAction({ r, c }));
		},
		[setCursor]
	);

	const handleMenuGameAction = useCallback(
		(e) => {
			// Handle menu option selection (both ACTIONS and SETTINGS)
			if (
				state.phase !== GAME_PHASE.MENU_ACTIONS &&
				state.phase !== GAME_PHASE.MENU_SETTINGS
			)
				return;

			const menuOptions =
				state.phase === GAME_PHASE.MENU_ACTIONS
					? ACTION_MENU_OPTIONS
					: SETTINGS_MENU_OPTIONS;

			const option = menuOptions[state.selectedOption];
			if (!option || option?.disabled) return;

			// If option has values, it's a setting - cycle the value
			if (option.hasOwnProperty("values") && option.values) {
				setGameSettings((prev) => {
					const currentIndex = option.values.indexOf(
						prev[option.key]
					);
					const nextIndex = (currentIndex + 1) % option.values.length;
					return {
						...prev,
						[option.key]: option.values[nextIndex],
					};
				});
				return;
			}

			// Otherwise, it's an action - dispatch to state machine
			dispatch(createMenuAction(option.key));
		},
		[state.phase, state.selectedOption]
	);

	const handleGameAction = useCallback(
		(e) => {
			const buttonId = e.currentTarget.id;

			// A button
			if (buttonId === "a") {
				// Handle menu option selection (both ACTIONS and SETTINGS)
				if (
					state.phase === GAME_PHASE.MENU_ACTIONS ||
					state.phase === GAME_PHASE.MENU_SETTINGS
				) {
					return handleMenuGameAction(e);
				}

				// Handle board actions
				const hoveredSquare = getHoveredSquare(state.board);

				dispatch(createPieceSelectAction(hoveredSquare));
			}

			// B button
			if (buttonId === "b") {
				dispatch(createButtonAction(Actions.B_BUTTON));
			}
		},
		[state.board, state.phase, handleMenuGameAction]
	);

	const handleGameSelect = useCallback(() => {
		dispatch(createButtonAction(Actions.SELECT_BUTTON));
	}, []);

	const handleGameStart = useCallback(() => {
		dispatch(createButtonAction(Actions.START_BUTTON));
	}, []);

	useEffect(() => {
		// Set cursor to initial state, will update display status when game is loaded
		setCursor(() => ({ ...initialCursor }));
	}, []);

	// Request and execute computer move in one place
	useEffect(() => {
		if (
			!isGameReady ||
			!isReady ||
			state.phase !== GAME_PHASE.WAITING_FOR_PLAYER ||
			state.currentPlayer !== state.computerColor
		)
			return;

		const moves = historyToUCI(state.moveHistory);

		getBestMove(moves, (move) => {
			if (move !== "none" && move !== "(none)") {
				// get hint with new move
				getHint(moves + " " + move, (info) => setMoveHelp(info));
			}

			dispatch(createComputerMoveAction(move));
		});
	}, [
		isGameReady,
		state.phase,
		state.currentPlayer,
		state.computerColor,
		state.moveHistory,
		isReady,
		getBestMove,
		getHint,
	]);

	// Force computer move
	useEffect(() => {
		if (
			!isGameReady ||
			state.phase !== GAME_PHASE.WAITING_FOR_STOCKFISH ||
			state.stockfishOperation?.type !== "force_move" ||
			!isReady
		)
			return;

		forceMove();

		// No need to dispatch action here - it's handled by the initial request computer move callback
	}, [
		isGameReady,
		state.phase,
		state.stockfishOperation,
		isReady,
		forceMove,
	]);

	// Offer draw evaluation
	useEffect(() => {
		if (
			!isGameReady ||
			state.phase !== GAME_PHASE.WAITING_FOR_STOCKFISH ||
			state.stockfishOperation?.type !== "offer_draw" ||
			!isReady
		)
			return;

		const moves = historyToUCI(state.moveHistory);

		offerDraw(moves, (shouldAccept, _) => {
			dispatch(
				createStockfishAction(
					shouldAccept ? Actions.DRAW_ACCEPTED : Actions.DRAW_REJECTED
				)
			);
		});
	}, [
		isGameReady,
		state.phase,
		state.stockfishOperation,
		state.moveHistory,
		isReady,
		offerDraw,
	]);

	useEffect(() => {
		if (!isGameReady) return;

		switch (state.phase) {
			case GAME_PHASE.DATA_SCREEN:
				setGrid(renderDataScreen(state.moveHistory, moveHelp));
				break;
			case GAME_PHASE.MENU_ACTIONS:
				setGrid(
					renderMenuScreen(
						1,
						ACTION_MENU_OPTIONS,
						gameSettings,
						state.selectedOption
					)
				);
				break;
			case GAME_PHASE.MENU_SETTINGS:
				setGrid(
					renderMenuScreen(
						2,
						SETTINGS_MENU_OPTIONS,
						gameSettings,
						state.selectedOption
					)
				);
				break;
			case GAME_PHASE.ALERT:
				setGrid(renderAlertScreen(state.alert, state.board));
				break;
			default:
				setGrid(boardGrid);
		}
	}, [
		isGameReady,
		state.phase,
		state.moveHistory,
		state.selectedOption,
		state.board,
		state.alert,
		moveHelp,
		boardGrid,
		setGrid,
		gameSettings,
	]);

	// Animate piece selection when transitioning to ANIMATING
	useEffect(() => {
		if (state.phase !== GAME_PHASE.ANIMATING || !state.animatingMove)
			return;

		const { from, to, isReverse } = state.animatingMove;
		const finalFrom = isReverse ? to : from;
		const finalTo = isReverse ? from : to;
		const piece = state.board[finalFrom.row][finalFrom.col];

		if (!piece) {
			dispatch({ type: Actions.ANIMATION_COMPLETE });
			return;
		}

		// Don't animate player turns unless in replay mode
		if (
			state.previousPhase !== GAME_PHASE.REPLAY &&
			state.currentPlayer !== state.computerColor
		) {
			dispatch({ type: Actions.ANIMATION_COMPLETE });
			return;
		}

		const buildAnimatedGrid = () => {
			const next = staticGridRef.current.map((row) => [...row]);
			const animating = animatingPieceRef.current;

			renderBoardPieces(state.board, next, null, null, animating);

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
		};

		const animatePieceMove = (piece, from, to, onComplete) => {
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
		};

		// Start animation - when complete, dispatch ANIMATION_COMPLETE
		animatePieceMove(piece, finalFrom, finalTo, () => {
			dispatch({ type: Actions.ANIMATION_COMPLETE });
		});
	}, [
		state.phase,
		state.previousPhase,
		state.animatingMove,
		state.board,
		state.currentPlayer,
		state.computerColor,
		setGrid,
	]);

	// Unified cursor management: display and cells
	useEffect(() => {
		if (!isGameReady) return;

		let display = true;
		let cells = presets.cursor;

		switch (state.phase) {
			case GAME_PHASE.WAITING_FOR_PLAYER:
				if (state.computerColor === state.currentPlayer) {
					cells = presets.thinking;
				}
				break;
			case GAME_PHASE.WAITING_FOR_STOCKFISH:
				cells = presets.thinking;
				break;
			case GAME_PHASE.DATA_SCREEN:
				display = false;
				break;
			case GAME_PHASE.MENU_ACTIONS:
				display = false;
				break;
			case GAME_PHASE.MENU_SETTINGS:
				display = false;
				break;
			case GAME_PHASE.REPLAY:
				cells = presets.takebackReplay;
				break;
			case GAME_PHASE.ANIMATING:
				if (state.previousPhase === GAME_PHASE.REPLAY) {
					cells = presets.takebackReplay;
				}
				break;
			case GAME_PHASE.PIECE_SELECTED:
				display = true;
				if (state.selectedSquare) {
					const piece =
						state.board[state.selectedSquare.row][
							state.selectedSquare.col
						];
					const pieceArr = presets.getPiece(piece?.FENChar);
					cells = pieceArr || presets.cursor;
				}
				break;
			case GAME_PHASE.ALERT:
				display = false;
				break;
			default:
				display = true;
				break;
		}

		setCursor((prev) => ({ ...prev, display, cells }));
	}, [
		isGameReady,
		state.phase,
		state.previousPhase,
		state.selectedSquare,
		state.board,
		state.currentPlayer,
		state.computerColor,
		setCursor,
	]);

	useEffect(() => {
		setGameState({
			name: "chess",
			loadGame,
			resetGame: () => {},
			handleGameCursor,
			handleGameDpad,
			handleGameAction,
			handleGameSelect,
			handleGameStart,
			handleGameCellClick: () => {},
		});
	}, [
		setGameState,
		loadGame,
		handleGameCursor,
		handleGameDpad,
		handleGameAction,
		handleGameSelect,
		handleGameStart,
	]);
}
