import { memo } from "react";
import useSound from "@/app/util/useSound";
import { useInputStore } from "@/app/store/input";

export default memo(function Dpad() {
	const {
		isNewPress,
		addPressedButton,
		removePressedButton,
		addToSequence,
		updatePreviousFrame,
	} = useInputStore();

	const [play] = useSound("/audio/dpad/short.m4a", {
		volume: 1,
		ignoreConsoleVolume: true,
		sprite: {
			press: [0, 114.33106575963718],
			release: [214.33106575963717, 105.87301587301585],
		},
	});

	const handleHold = (e) => {
		const id = e.currentTarget?.id || e.target.id;
		if (!id) return;
		console.log("handleHold", id);
		// Add to pressed buttons
		addPressedButton(id);
		// Register to click sequence only on new press
		if (isNewPress(id)) {
			addToSequence(id);
			play({ id: "press" });
		}
	};

	const handleRelease = (e) => {
		const id = e.currentTarget?.id || e.target.id;
		if (!id) return;
		// Remove from pressed buttons
		removePressedButton(id);
		play({ id: "release" });
		// Update previous frame for next press detection
		updatePreviousFrame();
	};

	const buttonProps = {
		onPointerDown: handleHold,
		onPointerUp: handleRelease,
		onMouseLeave: handleRelease,
	};

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
