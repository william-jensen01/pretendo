import { useEffect, useState, useRef, memo } from "react";
import useSound from "@/app/util/useSound";
import { delay } from "@/app/util/helper";

import { NES } from "@/app/fonts";

export default memo(function ActionButtons({ handleAction }) {
	const buttonRef = useRef();

	const [playSound] = useSound("/audio/action/short.m4a", {
		volume: 1,
		ignoreConsoleVolume: true,
		sprite: {
			press: [0, 146.82539682539684], // old-volume: 0.5
			release: [246.82539682539684, 155.46485260770976], // old-volume: 1
		},
	});

	const handleHolding = async (e) => {
		buttonRef.current = e.currentTarget;
		playSound({ id: "press" });
		const event = { ...e };
		// await delay(146);
		handleAction(event);
	};

	const handleLifting = async (e) => {
		if (!buttonRef.current) return;
		playSound({ id: "release" });
		buttonRef.current = undefined;
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
