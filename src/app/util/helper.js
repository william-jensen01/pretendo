import { rows, columns } from "@/app/constants";
import Cell from "@/app/Cell";

export const checkClickOrder = (clickOrder, correctOrder) => {
	if (clickOrder.length !== correctOrder.length) return false;
	for (let i = 0; i < clickOrder.length; i++) {
		if (clickOrder[i] !== correctOrder[i]) return false;
	}
	return true;
};

export function delay(ms) {
	return new Promise((res) => setTimeout(res, ms));
}

export function adjustForZoom(v) {}

export function createPointerEvent(id, event) {
	if (!id) return;

	const el = document.getElementById(id);
	if (!el) {
		console.log("no element found with id:", id);
		return;
	}

	const pointerEvent = new PointerEvent(event, {
		bubbles: true,
		cancelable: true,
	});

	el.dispatchEvent(pointerEvent);
}

export function create2dArray(isRandom = false, vital = 0) {
	const gridRows = [];
	for (let i = 0; i < rows; i++) {
		gridRows.push(
			Array.from(Array(columns), (x, col) => {
				const randomVital = Math.floor(Math.random() * 2);
				const color = (isRandom && randomVital) || vital ? 2 : 0;
				return new Cell({
					vital_value: isRandom ? randomVital : vital,
					color: color,
				});
			})
		);
	}
	return gridRows;
}

export function breakdownColored(grid) {
	return grid.reduce((acc, row, rowIdx) => {
		let columns = [];
		row.forEach((cell, colIdx) => {
			if (cell.color !== 0) {
				columns.push(colIdx, cell.color);
			}
		});
		if (columns.length > 0) {
			acc[rowIdx] = columns;
		}
		return acc;
	}, {});
}

export function getAllCells(arr, row, column) {
	const cells = [];
	for (let r = 0; r < arr.length; r++) {
		for (let c = 0; c < arr[r].length; c++) {
			cells.push([row + r, column + c]);
		}
	}
	return cells;
}

export function compare2dArray(oldArr, newArr) {
	if (
		oldArr.length !== newArr.length ||
		oldArr[0].length !== newArr[0].length
	) {
		throw new Error("Both arrays must have the same dimensions");
	}

	let result = {};
	for (let i = 0; i < oldArr.length; i++) {
		let mismatches = [];
		for (let k = 0; k < oldArr[i].length; k++) {
			if (JSON.stringify(oldArr[i][k]) !== JSON.stringify(newArr[i][k])) {
				mismatches.push(k);
			}
		}
		if (mismatches.length > 0) {
			result[i] = mismatches;
		}
	}
	return result;
}

export function continuouslyAnimate(
	name,
	runningRef,
	callback,
	delayAmount,
	fps
) {
	console.log(name, ":: inside continuouslyAnimate creation");
	// Determine target delay
	// delayAmount overrides fps
	// If neither provided, go as fast as possible
	let targetDelay = 0;
	if (delayAmount) {
		targetDelay = delayAmount;
	} else if (fps) {
		targetDelay = 1000 / fps; // e.g., 60fps = 16.67ms per frame
	}
	// else targetDelay = 0 (go as fast as possible)

	let animationFrameId = null;
	let isStopped = false;

	const animate = async (prevCallbackTime = 0) => {
		if (isStopped || !runningRef.current) {
			cancelAnimationFrame(animationFrameId);
			isStopped = false;
			return;
		}

		// Only delay if target delay is set
		if (targetDelay > 0) {
			const delayTime = Math.max(0, targetDelay - prevCallbackTime);
			if (delayTime > 0) {
				await delay(delayTime);
			}
		}

		const start = performance.now();
		let shouldContinue = await callback();
		const executionTime = performance.now() - start;

		if (shouldContinue && !isStopped) {
			animationFrameId = requestAnimationFrame(() =>
				animate(executionTime)
			);
		} else {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	};

	const stop = () => {
		isStopped = true;
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	};

	return { animate, stop };
}

export async function copyToClipboard(text) {
	if (navigator?.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
	} else {
		// Unsecure method of copying to clipboard
		const textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.select();
		try {
			document.execCommand("copy");
		} catch (err) {
			console.log("unable to copy to clipboard", err);
		}
		document.body.removeChild(textArea);
	}
}
