import { rows, columns } from "@/app/constants";
import Cell from "@/app/Cell";

// adds 0 n times before and after arr to match column
function resizeColumns(arr) {
	for (let i = 0; i < arr.length; i++) {
		if (arr.length[i] !== columns) {
			let colRemainder = columns - arr[i].length;
			let colLower = Math.floor(colRemainder / 2);
			let colHigher = colRemainder - colLower;
			arr[i].unshift(...new Array(colLower).fill(0));
			arr[i].push(...new Array(colHigher).fill(0));
		}
	}
	return arr;
}

// adds rows of empty cells before and after arr to match row
function resizeRows(arr) {
	let rowRemainder = rows - arr.length;
	let rowLower = Math.floor(rowRemainder / 2);
	let rowHigher = rowRemainder - rowLower;

	arr.unshift(...new Array(rowLower).fill(0));
	arr.push(...new Array(rowHigher).fill(0));

	return arr;
}

function formatToCell(arr, cellColor = 0) {
	for (let i = 0; i < arr.length; i++) {
		for (let k = 0; k < arr[i].length; k++) {
			arr[i][k] = new Cell({
				vital_value: arr[i][k],
				color: cellColor,
			});
		}
	}
}

// formats preset array to screen grid
// achieve this by resizing columns to grid, and adding remaining rows on top (before) and below (after)
export function resizeFormatToGrid(preset, cellColor = 0) {
	let remainder = rows - preset.length;
	let lower = Math.floor(remainder / 2);
	let higher = remainder - lower;

	resizeColumns(preset);

	let topRows = new Array(lower)
		.fill()
		.map(() =>
			new Array(columns)
				.fill()
				.map(() => new Cell({ vital_value: 0, color: 0 }))
		);

	let bottomRows = new Array(higher)
		.fill()
		.map(() =>
			new Array(columns)
				.fill()
				.map(() => new Cell({ vital_value: 0, color: 0 }))
		);

	const tempPreset = [...preset];
	preset.forEach((row, rowIdx) => {
		row.forEach((cell, cellIdx) => {
			tempPreset[rowIdx][cellIdx] = new Cell({
				vital_value: cell,
				color: cell ? cellColor : 0,
			});
		});
	});

	// Add the new rows before and after the original array
	return topRows.concat(tempPreset, bottomRows);
}

// expands each cell in array by n
// achieves this by going row by row and adding cell n times, then duplicating row n times

// export function expandCell(arr, expansion, clusterSize) {
// 	const expandedArray = [];
// 	const rows = arr.length;
// 	const cols = arr[0].length;

// 	// Calculate the new size based on expansion and cluster size
// 	const newSize = clusterSize * Math.abs(expansion);

// 	for (let i = 0; i < rows; i += clusterSize) {
// 		for (let j = 0; j < expansion; j++) {
// 			const expandedRow = [];
// 			for (let k = 0; k < cols; k += clusterSize) {
// 				for (let l = 0; l < expansion; l++) {
// 					for (let m = 0; m < clusterSize; m++) {
// 						for (let n = 0; n < clusterSize; n++) {
// 							expandedRow.push(arr[i + m][k + n]);
// 						}
// 					}
// 				}
// 			}
// 			expandedArray.push(expandedRow);
// 		}
// 	}

// 	return expandedArray;
// }

/*
	----------------------
*/

// export function expandCell(arr, n, clusterSize = 1) {
// 	console.log("clusterSize", clusterSize);
// 	if (n === 0) return arr;
// 	const expandedArray = [];

// 	const originalClusterSize = clusterSize;
// 	if (n > 0) {
// 		// Expansion
// 		for (let i = 0; i < arr.length; i += originalClusterSize) {
// 			for (let ci = 0; ci < originalClusterSize; ci++) {
// 				const expandedRow = [];
// 				for (let j = 0; j < arr[i].length; j += originalClusterSize) {
// 					for (let cj = 0; cj < originalClusterSize; cj++) {
// 						const cell = arr[i + ci][j + cj];
// 						for (let k = 0; k < n; k++) {
// 							expandedRow.push(cell);
// 						}
// 					}
// 				}
// 				for (let k = 0; k < n; k++) {
// 					expandedArray.push(expandedRow.slice());
// 				}
// 			}
// 		}
// 	} else {
// 		// Contraction
// 		const newClusterSize = originalClusterSize * Math.abs(n);
// 		for (let i = 0; i < arr.length; i += newClusterSize) {
// 			const contractedRow = [];
// 			for (let j = 0; j < arr[i].length; j += newClusterSize) {
// 				const cluster = [];
// 				for (let ci = 0; ci < newClusterSize; ci += originalClusterSize) {
// 					for (let cj = 0; cj < newClusterSize; cj += originalClusterSize) {
// 						cluster.push(arr[i + ci][j + cj]);
// 					}
// 				}
// 				contractedRow.push(cluster[0]); // Assuming uniform contraction to the first cell of the cluster
// 				contractedRow.push(cluster[0]);
// 			}
// 			expandedArray.push(contractedRow);
// 			expandedArray.push(contractedRow.slice());
// 		}
// 	}

// 	console.log("Before:", arr.length, "After:", expandedArray.length);
// 	return expandedArray;
// }

/*
	----------------------
*/

export function expandCell(arr, n, clusterSize = 1) {
	if (
		n === 0 ||
		!arr ||
		arr.length % clusterSize !== 0 ||
		arr[0].length % clusterSize !== 0
	)
		return arr;
	const expandedArray = [];

	for (let i = 0; i < arr.length; i += clusterSize) {
		const expandedCols = [];
		for (let j = 0; j < arr[i].length; j += clusterSize) {
			const clusterCols = arr[i].slice(j, j + clusterSize);

			const topLeft = arr[i][j];
			for (let k = 0; k < Math.abs(n); k++) {
				if (n > 0) {
					clusterCols.push(topLeft);
				} else {
					clusterCols.pop();
				}
			}
			if (Math.abs(n) > 1) {
				clusterCols.pop();
			}

			expandedCols.push(...clusterCols);
		}

		// add the missing rows from arr in between clusters
		for (let k = 0; k < clusterSize; k++) {
			expandedArray.push(expandedCols);
		}
		for (let k = 0; k < Math.abs(n); k++) {
			if (n < 0) {
				expandedArray.pop();
			} else {
				expandedArray.push(expandedCols);
			}
		}

		if (Math.abs(n) > 1) {
			expandedArray.pop();
		}
	}
	return expandedArray;
}

/* 
	----------------------
	original
*/

// export function expandCell(arr, n, prevClusterSize = 1) {
// 	if (n === 0) return arr;
// 	const expandedArray = [];

// 	console.log("expanding by", n);

// 	for (let i = 0; i < arr.length; i += prevClusterSize) {
// 		const expandedRow = [];

// 		for (let j = 0; j < arr[i].length; j += prevClusterSize) {
// 			// Get the top-left cell of the cluster
// 			const cell = arr[i][j];

// 			const cluster = arr
// 				.slice(i, i + prevClusterSize)
// 				.map((row) => row.slice(j, j + prevClusterSize));

// 			if (prevClusterSize > 1) console.log(cluster);

// 			// Expand or substract each cell by n
// 			if (n > 0) {
// 				// Expand each cluster
// 				for (let k = 0; k < n; k++) {
// 					expandedRow.push(cell);
// 				}
// 			} else {
// 			}

// 			// Expand each cell by n
// 			// for (let k = 0; k < n; k++) {
// 			// 	expandedRow.push(cell);
// 			// }
// 		}

// 		if (n > 0) {
// 			for (let k = 0; k < n; k++) {
// 				expandedArray.push(expandedRow);
// 			}
// 		} else {
// 		}
// 		// Duplicate expanded rows by n
// 		// for (let k = 0; k < n; k++) {
// 		// 	expandedArray.push([...expandedRow]);
// 		// }
// 	}

// 	console.log("before:", arr.length, "after:", expandedArray.length);

// 	return expandedArray;
// }

//
// STABLE
//
export const cell = [[1]];
export const block = [
	[1, 1],
	[1, 1],
];
export const beehive = [
	[0, 1, 1, 0],
	[1, 0, 0, 1],
	[0, 1, 1, 0],
];
export const loaf = [
	[0, 1, 1, 0],
	[1, 0, 0, 1],
	[0, 1, 0, 1],
	[0, 0, 1, 0],
];
export const boat = [
	[1, 1, 0],
	[1, 0, 1],
	[0, 1, 0],
];
export const tub = [
	[0, 1, 0],
	[1, 0, 1],
	[0, 1, 0],
];

//
// OSCILLATORS
//
export const blinker = [[1, 1, 1]];
export const toad = [
	[0, 1, 1, 1],
	[1, 1, 1, 0],
];
export const beacon = [
	[1, 1, 0, 0],
	[1, 0, 0, 0],
	[0, 0, 0, 1],
	[0, 0, 1, 1],
];
export const pulsar = [
	[0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
	[],
	[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
	[0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
	[],
	[0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
	[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
	[1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
	[],
	[0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
];
export const pentadecathlon = [
	[0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
	[1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
	[0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
];

//
// SPACESHIPS
//
export const glider = [
	[0, 0, 1],
	[1, 0, 1],
	[0, 1, 1],
];
export const lightweightSpaceship = [
	[0, 1, 1, 1, 1],
	[1, 0, 0, 0, 1],
	[0, 0, 0, 0, 1],
	[1, 0, 0, 1, 0],
];

//
// NUMBERS
//
export const one = [
	[0, 1],
	[1, 1],
	[0, 1],
	[0, 1],
	[0, 1],
];
export const two = [
	[0, 1, 1, 0],
	[1, 0, 0, 1],
	[0, 0, 1, 0],
	[0, 1, 0, 0],
	[1, 1, 1, 1],
];
export const three = [
	[0, 1, 1, 0],
	[1, 0, 0, 1],
	[0, 0, 1, 0],
	[1, 0, 0, 1],
	[0, 1, 1, 0],
];
export const four = [
	[1, 0, 1],
	[1, 0, 1],
	[1, 1, 1],
	[0, 0, 1],
	[0, 0, 1],
];
export const five = [
	[1, 1, 1, 1],
	[1, 0, 0, 0],
	[1, 1, 1, 1],
	[0, 0, 0, 1],
	[1, 1, 1, 1],
];
export const six = [
	[0, 1, 1, 0],
	[1, 0, 0, 0],
	[1, 1, 1, 0],
	[1, 0, 0, 1],
	[0, 1, 1, 0],
];
export const seven = [
	[1, 1, 1, 1],
	[1, 0, 0, 1],
	[0, 0, 0, 1],
	[0, 0, 0, 1],
	[0, 0, 0, 1],
];
export const eight = [
	[1, 1, 1, 1],
	[1, 0, 0, 1],
	[1, 1, 1, 1],
	[1, 0, 0, 1],
	[1, 1, 1, 1],
];
export const nine = [
	[1, 1, 1, 1],
	[1, 0, 0, 1],
	[1, 1, 1, 1],
	[0, 0, 0, 1],
	[0, 0, 0, 1],
];
export const zero = [
	[1, 1, 1, 1],
	[1, 0, 0, 1],
	[1, 0, 0, 1],
	[1, 0, 0, 1],
	[1, 1, 1, 1],
];
const numberLookup = {
	1: one,
	2: two,
	3: three,
	4: four,
	5: five,
	6: six,
	7: seven,
	8: eight,
	9: nine,
	0: zero,
};

function combineWithGap(arr, gap, vertical = false) {
	const combinedArray = [];
	const rows = arr.length;
	// const cols = arr[0].length;
	const cols = Math.max(...arr.map((x) => x.length));
	if (!vertical) {
		// horizontal combine
		// combine columns with a gap
		for (let i = 0; i < cols; i++) {
			const column = [];

			arr.forEach((row, idx) => {
				// //
				// if (i >= row.length) {
				// 	column.push(...Array(row.length).fill(0), ...Array(gap).fill(0));
				// }
				// // add
				// else {
				// 	column.push(...row[i], ...Array(gap).fill(0));
				// }

				if (i < row.length) {
					column.push(...row[i], ...Array(gap).fill(0));
				} else {
					column.push(...Array(row.length).fill(0), ...Array(gap).fill(0));
				}
			});

			for (let j = 0; j < gap; j++) {
				column.pop();
			}

			// if (column.length < cols) {
			// 	column.push(...Array(cols - column.length).fill(0));
			// }
			combinedArray.push(column);
		}
	} else {
		// vertical combine
		// combine rows with a gap
		arr.forEach((line, lineIdx) => {
			line.forEach((row) => {
				combinedArray.push(row);
			});

			for (let j = 0; j < gap; j++) {
				combinedArray.push(Array(line.length).fill(0));
			}

			// Remove the extra gap from the last cell
			if (lineIdx === arr.length - 1) {
				for (let j = 0; j < gap; j++) {
					combinedArray.pop();
				}
			}
			// combinedArray.push(combinedRow);
		});
	}

	return combinedArray;
}

function combineNumbers(intNum, size) {
	const digits = ("" + intNum).split("").map(Number);
	const expandedDigits = [];

	// Expand each digit and store them in expandedDigits
	digits.forEach((digit) => {
		const expandedDigit = expandCell(
			// expandCell(numberLookup[digit], size),
			numberLookup[digit],
			size
		);
		expandedDigits.push(expandedDigit);
	});

	return combineWithGap(expandedDigits, size);
}
export const testGrid = resizeFormatToGrid(combineNumbers(123, 2));

export const a = [
	[0, 1, 1, 0],
	[1, 0, 0, 1],
	[1, 1, 1, 1],
	[1, 0, 0, 1],
	[1, 0, 0, 1],
];
export const b = [
	[1, 1, 0],
	[1, 0, 1],
	[1, 1, 0],
	[1, 0, 1],
	[1, 1, 0],
];
export const c = [
	[0, 1, 1],
	[1, 0, 0],
	[1, 0, 0],
	[1, 0, 0],
	[0, 1, 1],
];
export const d = [
	[1, 1, 0],
	[1, 0, 1],
	[1, 0, 1],
	[1, 0, 1],
	[1, 1, 0],
];
export const e = [
	[1, 1, 1],
	[1, 0, 0],
	[1, 1, 1],
	[1, 0, 0],
	[1, 1, 1],
];
export const f = [
	[1, 1, 1],
	[1, 0, 0],
	[1, 1, 1],
	[1, 0, 0],
	[1, 0, 0],
];
export const g = [
	[0, 1, 1, 0],
	[1, 0, 0, 0],
	[1, 0, 1, 1],
	[1, 0, 0, 1],
	[0, 1, 1, 0],
];
export const h = [
	[1, 0, 1],
	[1, 0, 1],
	[1, 1, 1],
	[1, 0, 1],
	[1, 0, 1],
];
export const i = [[1], [1], [1], [1], [1]];
export const j = [
	[0, 1, 1, 1],
	[0, 0, 1, 0],
	[0, 0, 1, 0],
	[1, 0, 1, 0],
	[0, 1, 1, 0],
];
export const k = [
	[1, 0, 0, 1],
	[1, 0, 1, 0],
	[1, 1, 0, 0],
	[1, 0, 1, 0],
	[1, 0, 0, 1],
];
export const l = [
	[1, 0, 0],
	[1, 0, 0],
	[1, 0, 0],
	[1, 0, 0],
	[1, 1, 1],
];
export const m = [
	[1, 0, 0, 0, 1],
	[1, 1, 0, 1, 1],
	[1, 0, 1, 0, 1],
	[1, 0, 0, 0, 1],
	[1, 0, 0, 0, 1],
];
export const n = [
	[1, 0, 0, 0, 1],
	[1, 1, 0, 0, 1],
	[1, 0, 1, 0, 1],
	[1, 0, 0, 1, 1],
	[1, 0, 0, 0, 1],
];
export const o = [
	[0, 1, 1, 0],
	[1, 0, 0, 1],
	[1, 0, 0, 1],
	[1, 0, 0, 1],
	[0, 1, 1, 0],
];
export const p = [
	[1, 1, 1, 0],
	[1, 0, 0, 1],
	[1, 1, 1, 0],
	[1, 0, 0, 0],
	[1, 0, 0, 0],
];
export const q = [
	[0, 1, 1, 0],
	[1, 0, 0, 1],
	[1, 0, 0, 1],
	[1, 0, 1, 1],
	[0, 1, 1, 1],
];
export const r = [
	[1, 1, 1, 0],
	[1, 0, 0, 1],
	[1, 1, 1, 0],
	[1, 0, 0, 1],
	[1, 0, 0, 1],
];
export const s = [
	[0, 1, 1, 1],
	[1, 0, 0, 0],
	[0, 1, 1, 0],
	[0, 0, 0, 1],
	[1, 1, 1, 0],
];
export const t = [
	[1, 1, 1],
	[0, 1, 0],
	[0, 1, 0],
	[0, 1, 0],
	[0, 1, 0],
];
export const u = [
	[1, 0, 0, 1],
	[1, 0, 0, 1],
	[1, 0, 0, 1],
	[1, 0, 0, 1],
	[1, 1, 1, 1],
];
export const v = [
	[1, 0, 0, 0, 1],
	[1, 0, 0, 0, 1],
	[1, 0, 0, 0, 1],
	[0, 1, 0, 1, 0],
	[0, 0, 1, 0, 0],
];
export const w = [
	[1, 0, 1, 0, 1],
	[1, 0, 1, 0, 1],
	[1, 0, 1, 0, 1],
	[1, 0, 1, 0, 1],
	[0, 1, 0, 1, 0],
];
export const x = [
	[1, 0, 0, 0, 1],
	[0, 1, 0, 1, 0],
	[0, 0, 1, 0, 0],
	[0, 1, 0, 1, 0],
	[1, 0, 0, 0, 1],
];
export const y = [
	[1, 0, 0, 0, 1],
	[0, 1, 0, 1, 0],
	[0, 0, 1, 0, 0],
	[0, 1, 0, 0, 0],
	[1, 0, 0, 0, 0],
];
export const z = [
	[1, 1, 1, 1, 1],
	[0, 0, 0, 1, 0],
	[0, 0, 1, 0, 0],
	[0, 1, 0, 0, 0],
	[1, 1, 1, 1, 1],
];

export const colon = [[0], [1], [0], [1], [0]];

export const smiley = [
	[0, 0, 1, 1, 1, 1, 0, 0],
	[0, 1, 0, 0, 0, 0, 1, 0],
	[1, 0, 1, 0, 0, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 0, 0, 1, 0, 1],
	[1, 0, 0, 1, 1, 0, 0, 1],
	[0, 1, 0, 0, 0, 0, 1, 0],
	[0, 0, 1, 1, 1, 1, 0, 0],
];

export const patterns = [
	["cell", "block", "beehive", "loaf", "boat", "tub"], // still
	["blinker", "toad", "beacon", "pulsar", "pentadecathlon"], // oscillator
	["glider", "lightweightSpaceship"], // spaceship
	[
		"one",
		"two",
		"three",
		"four",
		"five",
		"six",
		"seven",
		"eight",
		"nine",
		"zero",
		"a",
	], // numbers
	[
		"a",
		"b",
		"c",
		"d",
		"e",
		"f",
		"g",
		"h",
		"i",
		"j",
		"k",
		"l",
		"m",
		"n",
		"o",
		"p",
		"q",
		"r",
		"s",
		"t",
		"u",
		"v",
		"w",
		"x",
		"y",
		"z",
		"colon",
		"smiley",
	], // letters
];

const letterLookup = {
	a: a,
	b: b,
	c: c,
	d: d,
	e: e,
	f: f,
	g: g,
	h: h,
	i: i,
	j: j,
	k: k,
	l: l,
	m: m,
	n: n,
	o: o,
	p: p,
	q: q,
	r: r,
	s: s,
	t: t,
	u: u,
	v: v,
	w: w,
	x: x,
	y: y,
	z: z,
	colon: colon,
	smiley: smiley,
};

function characterGap(size) {
	return size * 1;
}
function wordGap(size) {
	return size * 3;
}
function lineGap(size) {
	return size * 1;
}

function isLetter(str) {
	return str.length === 1 && str.match(/[a-z]/i);
}

function combineLetters(str, size) {
	const segments = str.split(" ");
	const combinedSegments = [];
	segments.forEach((segment, segmentIdx) => {
		const chars = segment.split("");
		let expandedChars = [];

		chars.forEach((char, charIdx) => {
			let charArray;

			if (isLetter(char)) {
				charArray = letterLookup[char.toLowerCase()];
			} else if (char === ":") {
				charArray = letterLookup["colon"];
			} else if (/^\d+$/.test(char)) {
				charArray = numberLookup[char];
			} else if (char === "☺") {
				charArray = letterLookup["smiley"];
			} else {
				console.log(char);
				charArray = Array(size).fill(Array(size).fill(0));
			}

			const expandedChar = expandCell(charArray, size);
			expandedChars.push(expandedChar);
		});
		// combine letters horizontally with a character gap
		const combined = combineWithGap(expandedChars, characterGap(size));
		combinedSegments.push(combined);
	});

	// combine segments together leaving a gap of size multiplied by 3
	return combineWithGap(combinedSegments, wordGap(size));
}

function splitWords(str, size) {
	const lines = str.split("\n");
	const combinedLines = [];
	const combinedSegments = [];
	lines.forEach((line, lineIdx) => {
		const combined = combineLetters(line, size);
		combinedSegments.push(combined);
	});
	return combineWithGap(combinedSegments, lineGap(size), true);
}

export function endGame(score) {
	const gameOver = splitWords("game\nover", 3);
	// console.table(gameOver);
	const scored = combineLetters(`score: ${score}`, 2);
	// console.dir(scored, { maxArrayLength: null });
	return resizeFormatToGrid(combineWithGap([gameOver, scored], 3 * 5, true), 2);
}

// change combining to handle different row totals

// export const pretendo = resizeColumns(combineLetters("pretendo☺", 3));

export function createPretendo(blocked = false, grid = false) {
	const letterSize = 3;
	let text;
	let size;
	let final;
	if (blocked) {
		text = combineLetters("pretendo", letterSize).map((row) =>
			row.map((col) => 1)
		);
		size = 0;
	} else {
		text = combineLetters("pretendo", letterSize);
		size = 3;
	}

	const resizedWithSmiley = resizeColumns(combineWithGap([text, smiley], size));
	// center logo excluding smiley
	resizedWithSmiley.forEach((row) => {
		row.length = row.length - smiley.length;

		row.unshift(...Array(smiley[0].length).fill(0));
	});

	if (grid) {
		return resizeFormatToGrid(resizedWithSmiley, 2);
	}

	return resizedWithSmiley;
}

export const pretendo = createPretendo();
// export const pretendoGrid = resizeFormatToGrid(
// 	combineWithGap([combineLetters("pretendo", 3), smiley], 3),
// 	2
// );
export const unverified = createPretendo(true);
// export const createPretendoGrid = (verified) =>
// 	resizeFormatToGrid(createPretendo(verified), 2);

// export const pretendo = combineLetters("pretendo", 3);
