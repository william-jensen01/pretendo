import { memo } from "react";
import { useGameBoyStore } from "@/app/store/gameboy";
import { useInputStore } from "@/app/store/input";
import { NES } from "@/app/fonts";

export default memo(function Options() {
	const powerStatus = useGameBoyStore((state) => state.powerStatus);
	const running = useGameBoyStore((state) => state.running);
	const game = useGameBoyStore((state) => state.game);
	const bricked = useGameBoyStore((state) => state.bricked);
	const initializing = useGameBoyStore((state) => state.initializing);
	const handleGameStart = useGameBoyStore(
		(state) => state.gameState.handleGameStart
	);
	const handleGameSelect = useGameBoyStore(
		(state) => state.gameState.handleGameSelect
	);

	const addToSequence = useInputStore((state) => state.addToSequence);

	// We could combine handleSelect and handleStart into one function but doesn't matter

	const handleSelect = (e) => {
		if (!powerStatus || !game || bricked || initializing) return;

		addToSequence(e.currentTarget?.id || e.target.id || "select");
		handleGameSelect(e);
	};

	const handleStart = (e) => {
		if (!powerStatus || !game || bricked || initializing) return;

		addToSequence(e.currentTarget?.id || e.target.id || "start");
		handleGameStart(e);
	};

	return (
		<div id="options">
			<div className="container">
				<button id="select" onClick={handleSelect}></button>
				<div className={`label ${NES.className}`}>SELECT</div>
			</div>

			<div className="container">
				<button id="start" onClick={handleStart}></button>
				<div className={`label ${NES.className}`}>
					{running ? "STOP" : "START"}
				</div>
			</div>
		</div>
	);
});
