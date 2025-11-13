import { useRef, useEffect, useCallback, useMemo, memo } from "react";
import { rows, columns } from "@/app/constants";
import { useGameBoyStore } from "@/app/store/gameboy";

// Internal canvas resolution (for crisp rendering keep whole integers)
const INTERNAL_CELL_SIZE = 8; // 8x8 pixels per Game Boy pixel
const GRID_LINE_WIDTH = 1; // 1px grid lines (1/8 of cell size);
const INTERNAL_WIDTH =
	columns * (INTERNAL_CELL_SIZE + GRID_LINE_WIDTH) - GRID_LINE_WIDTH; // 1280PX (160 * (8 + 1) - 1)
const INTERNAL_HEIGHT =
	rows * (INTERNAL_CELL_SIZE + GRID_LINE_WIDTH) - GRID_LINE_WIDTH; // 1152PX (144 * (8 + 1) - 1)

// Base display size (Game Boy screen's "natural" size before zoom)
const BASE_DISPLAY_WIDTH = 320;
const BASE_DISPLAY_HEIGHT = 288;

export default memo(function Screen() {
	const canvasRef = useRef(null);
	const requestIdRef = useRef(null);
	const grid = useGameBoyStore((state) => state.grid);
	const cursor = useGameBoyStore((state) => state.cursor);
	const powerStatus = useGameBoyStore((state) => state.powerStatus);
	const handleCellClick = useGameBoyStore(
		(state) => state.gameState.handleGameCellClick
	);

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

			// Convert from display coordinates to grid coordinates
			const cellX = Math.floor((x / BASE_DISPLAY_WIDTH) * columns);
			const cellY = Math.floor((y / BASE_DISPLAY_HEIGHT) * rows);

			handleCellClick(e, grid, cellY, cellX);
		},
		[handleCellClick, grid]
	);

	const drawCell = useCallback(
		(context, col, row, color) => {
			context.fillStyle = colorLookupDefined[color];
			const x =
				col * (INTERNAL_CELL_SIZE + GRID_LINE_WIDTH) + GRID_LINE_WIDTH;
			const y =
				row * (INTERNAL_CELL_SIZE + GRID_LINE_WIDTH) + GRID_LINE_WIDTH;
			context.fillRect(x, y, INTERNAL_CELL_SIZE, INTERNAL_CELL_SIZE);
		},
		[colorLookupDefined]
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const context = canvas.getContext("2d");
		if (!context) return;

		// Set internal resolution (high-res for crisp rendering)
		canvas.width = INTERNAL_WIDTH;
		canvas.height = INTERNAL_HEIGHT;

		// Set display size (base size, no zoom)
		canvas.style.width = `${BASE_DISPLAY_WIDTH}px`;
		canvas.style.height = `${BASE_DISPLAY_HEIGHT}px`;
		canvas.style.imageRendering = "pixelated";

		// Disable smoothing
		context.imageSmoothingEnabled = false;

		// Clear the entire canvas
		context.fillStyle = "rgba(0,0,0,0.1)";
		context.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

		// Draw cells with gaps between them
		for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
			for (let colIdx = 0; colIdx < columns; colIdx++) {
				const cell = grid[rowIdx]?.[colIdx];
				if (!cell || cell.color === undefined || cell.color === null)
					continue;

				drawCell(context, colIdx, rowIdx, cell.color);
			}
		}

		// Handle cursor animation
		let startTime;

		const animate = (timestamp) => {
			if (!startTime) startTime = timestamp;
			const elapsedTime = timestamp - startTime;
			const blinkState = Math.floor(elapsedTime / 500) % 2 === 0;

			cursor?.cells?.forEach((row, rowIdx) => {
				row.forEach((cell, colIdx) => {
					if (!cell) return;

					const gRow = (cursor.row + rowIdx) % rows;
					const gCol = (cursor.col + colIdx) % columns;
					const gridCell = grid[gRow]?.[gCol];

					if (!gridCell) return;

					drawCell(
						context,
						gCol,
						gRow,
						blinkState ? 1 : gridCell.color
					);
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
				width: `${BASE_DISPLAY_WIDTH}px`,
				height: `${BASE_DISPLAY_HEIGHT}px`,
				backgroundColor: powerStatus
					? "var(--lightest-green-on)"
					: "var(--lightest-green-off)",
			}}
		>
			<canvas ref={canvasRef} onClick={handleCanvasClick} />
		</div>
	);
});
