import { useRef, useEffect, useCallback, useMemo, memo } from "react";
import { colorLookup } from "@/app/Cell";
import { rows, columns } from "@/app/constants";
import { useGameBoyStore } from "@/app/store/gameboy";
import { continuouslyAnimate } from "@/app/util/helper";

const width = 352;
const height = 316.8;
const gap = 0;
const resolutionX = (width - columns * gap) / columns;
const resolutionY = (height - rows * gap) / rows;
// const width = 320;
// const height = 288;
// const resolutionX = 2;
// const resolutionY = 2;
// const width = 480;
// const height = 432;
// const resolutionX = 3;
// const resolutionY = 3
const gapX = (width - columns * resolutionX) / columns;
const gapY = (height - rows * resolutionY) / rows;
console.log("gapX", gapX);
console.log("gapY", gapY);

console.log("cell width", resolutionX);
console.log("cell height", resolutionY);

/*
	resolution of 2px
		width: 320px
		height: 288px
	3px:
		width: 480px
		height: 432px

		scale down to 352x316.8 = 
*/

export default memo(function Screen({ powerStatus, grid, handleCellClick }) {
	const canvasRef = useRef(null);
	const requestIdRef = useRef(null);
	const cursor = useGameBoyStore((state) => state.cursor);

	const colorLookupDefined = useMemo(
		() => ({
			0: powerStatus ? "rgb(106, 162, 81)" : "rgb(123, 130, 13)",
			1: "rgb(93, 121, 65)",
			2: "rgb(61, 89, 74)",
			3: "rgb(44, 65, 57)",
		}),
		[powerStatus]
	);

	const handleCanvasClick = useCallback(
		(e) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const cellX = Math.floor(x / resolutionX);
			const cellY = Math.floor(y / resolutionY);

			handleCellClick(e, grid, cellY, cellX);
		},
		[handleCellClick, grid]
	);

	const drawCell = useCallback(
		(context, x, y, color) => {
			context.fillStyle = colorLookupDefined[color];
			context.fillRect(x, y, resolutionX, resolutionY);
		},
		[colorLookupDefined]
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext("2d");

		// canvas.style.zoom = "0.733";
		// canvas.style.transform = "scale(0.733)";
		// canvas.style.width = `${width * 0.733}px`;
		// canvas.style.height = `${height * 0.733}px`;
		// canvas.style.width = `${width}px`;
		// canvas.style.height = `${height}px`;

		// Enable crisp edges for pixel art
		context.imageSmoothingEnabled = false;

		// context.clearRect(0, 0, canvas.width, canvas.height);

		grid.forEach((row, rowIdx) => {
			row.forEach((cell, colIdx) => {
				if (cell.color === 0) return;
				const x = colIdx * resolutionX;
				const y = rowIdx * resolutionY;

				drawCell(context, x, y, cell.color);
			});
		});

		let startTime;

		// Animate the cursor to create a blinking effect
		const animate = (timestamp) => {
			if (!startTime) startTime = timestamp;
			const elapsedTime = timestamp - startTime;

			// context.clearRect(0, 0, canvas.width, canvas.height);

			cursor?.cells?.forEach((row, rowIdx) => {
				row.forEach((cell, colIdx) => {
					const gRow = (cursor.row + rowIdx) % rows;
					const gCol = (cursor.col + colIdx) % columns;

					if (!cell || !gRow || !gCol) return;

					const x = gCol * resolutionX;
					const y = gRow * resolutionY;
					let gridCell;
					try {
						gridCell = grid[gRow][gCol];
					} catch (e) {
						console.log(e);
						console.log(gRow, gCol);
						return;
					}

					const blinkState = Math.floor(elapsedTime / 500) % 2 === 0;

					drawCell(context, x, y, blinkState ? 1 : gridCell.color);
				});
			});

			requestIdRef.current = requestAnimationFrame(animate);
		};

		if (cursor?.display) {
			requestIdRef.current = requestAnimationFrame(animate);
		}

		return () => {
			if (requestIdRef.current) {
				cancelAnimationFrame(requestIdRef.current);
			}
		};
	}, [grid, cursor, drawCell]);

	return (
		<div
			id="screen"
			style={{
				width: `${width}px`,
				aspectRatio: `10/9`,
				// height: "auto",
				// display: "grid",
				// gridTemplateColumns: `repeat(${columns}, ${resolutionX}px)`,
				// gridTemplateRows: `repeat(${rows}, ${resolutionY}px)`,
				// gridGap: `${gap}px`,
				backgroundColor: powerStatus
					? "var(--lightest-green-on)"
					: "var(--lightest-green-off)",
			}}
		>
			<canvas
				ref={canvasRef}
				onClick={handleCanvasClick}
				style={{ imageRendering: "pixelated" }}
			/>
		</div>
	);

	return (
		<div
			id="screen"
			style={{
				// width: `${width}px`,
				aspectRatio: `10/9`,
				height: "auto",
				display: "grid",
				gridTemplateColumns: `repeat(${columns}, ${resolutionX}px)`,
				// gridTemplateRows: `repeat(${rows}, ${resolutionY}px)`,
				gridGap: `${gap}px`,
				backgroundColor: powerStatus
					? "var(--lightest-green-on)"
					: "var(--lightest-green-off)",
			}}
		>
			{powerStatus
				? grid?.map((row, r) =>
						row?.map((col, c) => {
							return (
								<div
									key={`${r}${c}`}
									data-row={r}
									data-column={c}
									className={`cell ${grid[r][c].blinking ? "blink" : ""}`}
									// className={`cell ${
									// 	r === active.row && c === active.col ? "blink" : undefined
									// }`}
									onClick={(e) => handleCellClick(e, grid, r, c)}
									style={{
										width: `${resolutionX}px`,
										height: `${resolutionX}px`,
										backgroundColor: colorLookup[grid[r][c].color],
									}}
								/>
							);
						})
				  )
				: ""}
		</div>
	);
});
