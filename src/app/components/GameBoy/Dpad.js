import { useRef, useEffect, useMemo, memo, useCallback } from "react";
import { useGameBoyStore } from "@/app/store/gameboy";
import { createPointerEvent, delay } from "@/app/util/helper";
import useSound from "@/app/util/useSound";

export default memo(function Dpad({
	// handleClickEE,
	handleDpad,
	// handleGameDpad,
	// initializingRef,
	powerStatus,
	running,
}) {
	const movingInterval = useRef(null);
	const holdTimeout = useRef(null);
	const holdStartTime = useRef(null);
	const isPointerDown = useRef(null);
	// const running = useGameBoyStore((state) => state.running);
	// const game = useGameBoyStore((state) => state.game);
	// const bricked = useGameBoyStore((state) => state.bricked);
	// const powerStatus = useGameBoyStore((state) => state.powerStatus);

	const [play] = useSound("/audio/dpad/short.m4a", {
		volume: 1,
		ignoreConsoleVolume: true,
		sprite: {
			press: [0, 114.33106575963718],
			release: [214.33106575963717, 105.87301587301585],
		},
	});

	const handleHold = async (e) => {
		const id = e.currentTarget?.id || e.target.id;

		if (!isPointerDown.current) {
			play({ id: "press" });
		}
		isPointerDown.current = true;
		holdStartTime.current = Date.now();

		const event = { ...e };
		handleDpad(event);

		// if (!id) return;
		// const directionLookup = {
		// 	up: [-1, 0],
		// 	down: [1, 0],
		// 	right: [0, 1],
		// 	left: [0, -1],
		// };
		// if (
		// 	!directionLookup.hasOwnProperty(id) ||
		// 	!powerStatus ||
		// 	!game ||
		// 	bricked ||
		// 	initializingRef.current
		// ) {
		// 	return;
		// }

		// const [r, c] = directionLookup[id];
		// handleClickEE(e, () => handleGameDpad(r, c));

		// don't allow interval presses if console is off or game is running
		if (!powerStatus || running) return;

		if (!holdTimeout.current && !movingInterval.current) {
			// const id = e.currentTarget.id;
			holdTimeout.current = setTimeout(() => {
				if (!movingInterval.current) {
					movingInterval.current = setInterval(() => {
						createPointerEvent(id, "pointerdown");
					}, 200);
				}
			}, 500);
		}
	};

	const handleRelease = async (e) => {
		if (!isPointerDown.current) return; // Only handle release if pointer was down
		isPointerDown.current = false;

		play({ id: "release" });

		// const holdDuration = Date.now() - holdStartTime.current;
		// const remainingDuration = Math.max(0, ms - holdDuration);
		// if (remainingDuration > 0) {
		// 	console.log("remaining duration of hold", remainingDuration);
		// 	await delay(remainingDuration);
		// }

		clearTimeout(holdTimeout.current);
		holdTimeout.current = null;

		clearInterval(movingInterval.current);
		movingInterval.current = null;
	};

	useEffect(() => {
		// const handleDown = (e) => {
		// 	console.log("useEffect :: pointerdown");
		// 	const id = e.currentTarget?.id || e.target.id;
		// 	console.log("id", id);
		// 	play({ id: "press" });
		// 	handleDpad({ currentTarget: { id: "up" } });
		// };
		// document.querySelector("#dpad").addEventListener("pointerdown", handleDown);

		return () => {
			// document
			// 	.querySelector("#dpad")
			// 	.removeEventListener("pointerdown", handleDown);

			clearInterval(movingInterval.current);
			movingInterval.current = null;
			clearTimeout(holdTimeout.current);
			holdTimeout.current = null;
		};
	}, []);

	const buttonProps = {
		onPointerDown: handleHold,
		onPointerUp: handleRelease,
		onMouseLeave: handleRelease,
	};
	// const buttonProps = useMemo(
	// 	() => ({
	// 		onPointerDown: handleHold,
	// 		onPointerUp: handleRelease,
	// 		onMouseLeave: handleRelease,
	// 	}),
	// 	[handleHold, handleRelease]
	// );

	return (
		<div id="dpad">
			<div id="bg" />
			<div id="x-arrow" />
			<div id="y-arrow" />
			<div id="cross">
				<div id="thumb" />
				<div id="up-down" className="axis y">
					<button
						id="up"
						{...buttonProps}
						// onPointerDown={handleHold}
						// onPointerUp={handleRelease}
						// onMouseLeave={handleRelease}
						data-directionr={-1}
						data-directionc={0}
					>
						<div className="stripe" />
						<div className="stripe" />
						<div className="stripe" />
					</button>
					<button
						id="down"
						{...buttonProps}
						// onPointerDown={handleHold}
						// onPointerUp={handleRelease}
						// onMouseLeave={handleRelease}
						data-directionr={1}
						data-directionc={0}
					>
						<div className="stripe" />
						<div className="stripe" />
						<div className="stripe" />
					</button>
				</div>

				<div id="left-right" className="axis x">
					<button
						id="left"
						{...buttonProps}
						// onPointerDown={handleHold}
						// onPointerUp={handleRelease}
						// onMouseLeave={handleRelease}
						data-directionr={0}
						data-directionc={-1}
					>
						<div className="stripe" />
						<div className="stripe" />
						<div className="stripe" />
					</button>
					<button
						id="right"
						{...buttonProps}
						// onPointerDown={handleHold}
						// onPointerUp={handleRelease}
						// onMouseLeave={handleRelease}
						data-directionr={0}
						data-directionc={1}
					>
						<div className="stripe" />
						<div className="stripe" />
						<div className="stripe" />
					</button>
				</div>
			</div>
		</div>
	);
});
