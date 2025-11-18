import { useState, useCallback, useEffect, useRef } from "react";
import { DEFAULT_BOARD } from "./constants";
import { createStaticChessGrid, renderBoardPieces } from "./util";
import { useGameBoyStore } from "@/app/store/gameboy";

export default function Chess() {
	const setGameState = useGameBoyStore((state) => state.setGameState);
	const setGrid = useGameBoyStore((state) => state.setGrid);

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
	}, [applyBoardUpdate]);

	const resetGame = useCallback(() => {}, []);

	const runGame = useCallback(() => {}, []);

	const handleGameDpad = useCallback(() => {}, []);

	const handleGameAction = useCallback(() => {}, []);

	const handleGameSelect = useCallback(() => {}, []);

	const handleGameStart = useCallback(() => {}, []);

	const handleGameCellClick = useCallback(() => {}, []);

	const handleGameEEShortcuts = useCallback(() => {}, []);

	useEffect(() => {
		setGameState({
			name: "chess",
			loadGame,
			resetGame,
			runGame,
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
		handleGameDpad,
		handleGameAction,
		handleGameSelect,
		handleGameStart,
		handleGameCellClick,
		handleGameEEShortcuts,
	]);
}
