import Image from "next/image";
import { useRef, useState, useCallback, memo } from "react";
import wheelPic from "@public/volume-wheel.png";

export default memo(function VolumeWheel({ changeVolume }) {
	const [rotation, setRotation] = useState(-90); // default volume is 0.5 so rotation is -90
	const wheelRef = useRef(null);
	const draggingRef = useRef(null);
	const lastPositionRef = useRef({ x: 0, y: 0 });

	const handlePointerDown = useCallback((e) => {
		draggingRef.current = true;
		lastPositionRef.current = { x: e.clientX, y: e.clientY };
		e.target.setPointerCapture(e.pointerId);
	}, []);

	const handlePointerUp = useCallback((e) => {
		draggingRef.current = false;
		e.target.releasePointerCapture(e.pointerId);
	}, []);

	const handlePointerMove = useCallback(
		(e) => {
			if (!draggingRef.current) return;

			const deltaY = e.clientY - lastPositionRef.current.y;
			let newRotation = rotation + deltaY;

			// apply constraints
			if (newRotation <= -180) {
				newRotation = -180;
			} else if (newRotation >= 0) {
				newRotation = 0;
			}

			lastPositionRef.current = {
				x: e.clientX,
				y: e.clientY,
			};

			const newVolume = -1 * (newRotation / 180);
			setRotation(newRotation);
			changeVolume(newVolume.toFixed(2));
		},
		[rotation, changeVolume]
	);

	return (
		<div
			id="volume-container"
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			onPointerMove={handlePointerMove}
		>
			<Image
				ref={wheelRef}
				id="volume"
				src={wheelPic}
				alt="volume wheel"
				draggable={false}
				style={{ transform: `rotate(${rotation}deg)` }}
			/>
		</div>
	);
});
