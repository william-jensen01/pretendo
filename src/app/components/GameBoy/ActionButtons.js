import { useRef, memo } from "react";
import { useInputStore } from "@/app/store/input";
import { useGameBoyStore } from "@/app/store/gameboy";
import useSound from "@/app/util/useSound";
import { NES } from "@/app/fonts";

export default memo(function ActionButtons() {
	const {
		isNewPress,
		addPressedButton,
		removePressedButton,
		addToSequence,
		updatePreviousFrame,
		getPressedArray,
	} = useInputStore();

	const powerStatus = useGameBoyStore((state) => state.powerStatus);
	const game = useGameBoyStore((state) => state.game);
	const bricked = useGameBoyStore((state) => state.bricekd);
	const initializing = useGameBoyStore((state) => state.initializing);
	const handleGameAction = useGameBoyStore(
		(state) => state.gameState.handleGameAction
	);

	const buttonRef = useRef();

	const [playSound] = useSound("/audio/action/short.m4a", {
		volume: 1,
		ignoreConsoleVolume: true,
		sprite: {
			press: [0, 146.82539682539684], // old-volume: 0.5
			release: [246.82539682539684, 155.46485260770976], // old-volume: 1
		},
	});

	const isWorking = powerStatus && game && !bricked && !initializing;

	const handleHolding = async (e) => {
		e.preventDefault();
		const currentTarget = e.currentTarget || e.target;
		buttonRef.current = currentTarget;
		playSound({ id: "press" });

		console.log("currentTarget", currentTarget);
		const id = currentTarget?.id;
		if (!id) return;
		// Add to pressed buttons
		addPressedButton(id);
		// Register to click sequence only on new press
		if (isNewPress(id)) {
			addToSequence(id);
		}

		// Get current pressed buttons
		const allPressed = getPressedArray();
		// Create event with all pressed buttons
		const event = {
			...e,
			pressedButtons: allPressed,
			currentTarget,
		};
		// Only call game action if console is working properly
		if (isWorking) handleGameAction(event);
	};

	const handleLifting = async (e) => {
		// Only play sound if button is pressed
		if (buttonRef.current) {
			playSound({ id: "release" });
		}
		buttonRef.current = undefined;

		const id = e.currentTarget?.id || e.target.id;
		if (!id) return;
		// Remove from pressed buttons
		removePressedButton(id);
		// Update previous frame tracking
		updatePreviousFrame();
	};

	return (
		<div id="buttons">
			<button
				id="b"
				onPointerDown={handleHolding}
				onPointerUp={handleLifting}
				onMouseLeave={handleLifting}
			>
				<div className={`label ${NES.className}`}>B</div>
			</button>
			<button
				id="a"
				onPointerDown={handleHolding}
				onPointerUp={handleLifting}
				onMouseLeave={handleLifting}
			>
				<div className={`label ${NES.className}`}>A</div>
			</button>
		</div>
	);
});
