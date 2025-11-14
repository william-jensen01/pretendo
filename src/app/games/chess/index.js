import { useCallback, useEffect } from "react";
import { rows, columns } from "@/app/constants";
import { useGameBoyStore } from "@/app/store/gameboy";

export default function Chess() {
	const setGameState = useGameBoyStore((state) => state.setGameState);
	const loadGame = useCallback(() => {}, []);

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
