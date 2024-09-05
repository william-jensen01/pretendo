import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useEffect, useMemo, memo } from "react";
import { rows, columns } from "@/app/constants";
import * as shortcuts from "./shortcuts";
import {
	create2dArray,
	delay,
	continuouslyAnimate,
	copyToClipboard,
} from "@/app/util/helper";
import Cell from "@/app/Cell";
import * as presets from "@/app/presets";
import { useGameBoyStore } from "@/app/store/gameboy";
import { useShallow } from "zustand/react/shallow";
import useSound from "@/app/util/useSound";

const patterns = presets.patterns;

const initialPatternTypeIdx = 0;
const initialSpecificPatternIdx = 1;
const initialCursor = {
	row: Math.floor(
		rows / 2 -
			presets.patterns[initialPatternTypeIdx][initialSpecificPatternIdx]
				.length /
				2
	),
	col: Math.floor(
		columns / 2 -
			presets.patterns[initialPatternTypeIdx][initialSpecificPatternIdx][0]
				.length /
				2
	),
	cluster: 1,
	cells: presets[patterns[initialPatternTypeIdx][initialSpecificPatternIdx]],
	name: patterns[initialPatternTypeIdx][initialSpecificPatternIdx],
	display: false,
};

export function countNeighbors(gr, x, y) {
	let sum = 0;

	for (let i = -1; i < 2; i++) {
		for (let j = -1; j < 2; j++) {
			if (!(i === 0 && j === 0)) {
				let row = (x + i + rows) % rows;
				let col = (y + j + columns) % columns;
				sum += gr[row][col].vital_status;
			}
		}
	}
	return sum;
}

export default memo(function Life({
	changeRunning,
	powerStatusRef,
	runningRef,
	stopAnimationRef,
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const {
		setGrid,
		cursor,
		setCursor,
		running,
		setRunning,
		setGame,
		setGameState,
		setMessage,
		unlockEasterEgg,
	} = useGameBoyStore(
		useShallow((state) => ({
			setGrid: state.setGrid,
			cursor: state.cursor,
			setCursor: state.setCursor,
			running: state.running,
			setRunning: state.setRunning,
			setGame: state.setGame,
			setGameState: state.setGameState,
			setMessage: state.setMessage,
			unlockEasterEgg: state.unlockEasterEgg,
		}))
	);
	const [evolutions, setEvolutions] = useState(0);

	// patterns[0][0] = boat
	// patterns [2][1] = light-weight spaceship
	const [patternTypeIdx, setPatternTypeIdx] = useState(initialPatternTypeIdx);
	const [specificPatternIdx, setSpecificPatternIdx] = useState(
		initialSpecificPatternIdx
	);
	// const [cursor, setCursor] = useState(initialCursor);

	const [playSound] = useSound("/audio/games/life/sprite.m4a", {
		volume: 0.5,
		sprite: {
			start: [0, 360],
			distorted: [2000, 1487],
			"easter-egg": [5000, 5713],
		},
	});

	const runOnceRef = useRef(false);

	const createQueryString = useCallback(
		(name, value) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set(name, value);
			return params.toString();
		},
		[searchParams]
	);

	const copyScreenState = useCallback(
		async (e) => {
			const grid = useGameBoyStore.getState().grid;
			const breakdown = grid.reduce((acc, row, rowIdx) => {
				let columns = [];
				row.forEach((cell, colIdx) => {
					if (cell.color !== 0) {
						// columns.push((colIdx += cell.color));
						columns.push(
							parseInt(colIdx + `${cell.vital_status}` + `${cell.color}`)
						);
					}
				});

				if (columns.length > 0) {
					acc[rowIdx] = columns;
				}
				return acc;
			}, {});

			let queryString = Object.entries(breakdown)
				.map(([key, value]) => createQueryString(key, value.join(" ")))
				.join("&");

			let url = `${window.location.origin}?${queryString}`;

			copyToClipboard(url);

			return url;
		},
		[createQueryString]
	);

	useEffect(
		() => {
			setCursor({ ...initialCursor });
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	const getGridFromURL = useCallback(() => {
		let hasQuery = false;
		const newGrid = create2dArray();
		for (const key of searchParams.keys()) {
			if (key === "disable-zoom") continue;
			if (key) hasQuery = true;
			const row = parseInt(key);
			const cols = searchParams.get(key).split(" ");

			for (let c = 0; c < cols.length; c++) {
				const col = parseInt(cols[c].slice(0, -2));
				const vital = parseInt(cols[c].slice(-2, -1));
				const color = parseInt(cols[c].slice(-1));

				newGrid[row][col].vital_status = vital;
				newGrid[row][col].color = color;
			}
		}
		if (hasQuery) {
			// setGrid(newGrid);
			return newGrid;
		} else {
			return null;
		}
	}, [searchParams]);

	const loadGame = useCallback(() => {
		const urlGrid = getGridFromURL();
		if (urlGrid) {
			setGrid(urlGrid);
			router.push("/", { shallow: true });
		} else {
			setGrid(presets.createPretendo(false, true));
		}
		setCursor((prev) => ({ ...prev, display: true }));
	}, [router, getGridFromURL, setGrid, setCursor]);

	// Runs when console is turning off
	const resetGame = useCallback(() => {
		setGrid(create2dArray());
		setPatternTypeIdx(initialPatternTypeIdx);
		setSpecificPatternIdx(initialSpecificPatternIdx);
		setCursor(initialCursor);
	}, [setGrid, setCursor]);

	// const simulate = useCallback(() => {
	// 	setGrid((pg) => {
	// 		const ng = create2dArray();
	// 		const differences = {};
	// 		for (let i = 0; i < ng.length; i++) {
	// 			const mismatches = [];
	// 			for (let j = 0; j < ng[i].length; j++) {
	// 				let cell = pg[i][j];
	// 				let state = cell.vital_status;
	// 				let neighbors = countNeighbors(pg, i, j);

	// 				// RULES
	// 				if (state === 0 && neighbors === 3) {
	// 					ng[i][j] = new Cell({
	// 						vital_value: 1,
	// 						vital_changed: true,
	// 						color: 2,
	// 					});
	// 				} else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
	// 					ng[i][j] = new Cell({
	// 						vital_value: 0,
	// 						vital_changed: true,
	// 						color: 1,
	// 					});
	// 				} else {
	// 					let updatedGeneration = cell.generations_lived;
	// 					if (cell.vital_status && cell.generations_lived > 0) {
	// 						updatedGeneration++;
	// 					}
	// 					let updatedColor = 0;
	// 					if (cell.vital_status) updatedColor = pg[i][j].color;
	// 					if (cell.vital_status && updatedGeneration > 2) {
	// 						updatedColor = 3;
	// 					}

	// 					ng[i][j] = new Cell({
	// 						vital_value: cell.vital_status,
	// 						generations_lived: updatedGeneration,
	// 						vital_changed: false,
	// 						blinking: false,
	// 						color: updatedColor,
	// 					});
	// 				}
	// 				if (JSON.stringify(pg[i][j] !== JSON.stringify(ng[i][j]))) {
	// 					mismatches.push(j);
	// 				}
	// 			}
	// 			if (mismatches.length > 0) {
	// 				differences[i] = mismatches;
	// 			}
	// 		}
	// 		if (Object.keys(differences).length === 0) {
	// 			// setRunning(false);
	// 			// runningRef.current = false;
	// 			changeRunning(false);
	// 		}
	// 		setEvolutions((prev) => {
	// 			console.log("evolution:", prev++);
	// 			return prev++;
	// 		});
	// 		return ng;
	// 	});
	// 	return true;
	// }, [setGrid, setEvolutions, changeRunning]);

	const runGame = useCallback(
		(single = false) => {
			if (!runningRef.current) return;

			const simulate = () => {
				setGrid((pg) => {
					const ng = create2dArray();
					const differences = {};
					for (let i = 0; i < ng.length; i++) {
						const mismatches = [];
						for (let j = 0; j < ng[i].length; j++) {
							let cell = pg[i][j];
							let state = cell.vital_status;
							let neighbors = countNeighbors(pg, i, j);

							// RULES
							if (state === 0 && neighbors === 3) {
								ng[i][j] = new Cell({
									vital_value: 1,
									vital_changed: true,
									color: 2,
								});
							} else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
								ng[i][j] = new Cell({
									vital_value: 0,
									vital_changed: true,
									color: 1,
								});
							} else {
								let updatedGeneration = cell.generations_lived;
								if (cell.vital_status && cell.generations_lived > 0) {
									updatedGeneration++;
								}
								let updatedColor = 0;
								if (cell.vital_status) updatedColor = pg[i][j].color;
								if (cell.vital_status && updatedGeneration > 2) {
									updatedColor = 3;
								}

								ng[i][j] = new Cell({
									vital_value: cell.vital_status,
									generations_lived: updatedGeneration,
									vital_changed: false,
									blinking: false,
									color: updatedColor,
								});
							}
							if (JSON.stringify(pg[i][j] !== JSON.stringify(ng[i][j]))) {
								mismatches.push(j);
							}
						}
						if (mismatches.length > 0) {
							differences[i] = mismatches;
						}
					}
					if (Object.keys(differences).length === 0) {
						// setRunning(false);
						// runningRef.current = false;
						changeRunning(false);
					}
					setEvolutions((prev) => {
						console.log("evolution:", prev++);
						return prev++;
					});
					return ng;
				});
				return true;
			};

			if (single) {
				simulate();
				runOnceRef.current = false;
				// setRunning(false);
				changeRunning(false);
			} else {
				const { animate, stop } = continuouslyAnimate(
					// powerStatusRef,
					runningRef,
					simulate
				);
				stopAnimationRef.current = stop;
				animate();
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[setRunning, setGrid, changeRunning]
	);

	const cyclePattern = useCallback(
		(t = 0, s = 0) => {
			// t => type
			// s => specific

			const newValueT =
				(patternTypeIdx + t + patterns.length) % patterns.length;
			const newValueS =
				newValueT === patternTypeIdx
					? (specificPatternIdx + s + patterns[patternTypeIdx].length) %
					  patterns[patternTypeIdx].length
					: 0;

			setPatternTypeIdx(newValueT);
			setSpecificPatternIdx(newValueS);
			setCursor((prev) => ({
				...prev,
				cluster: 1,
				name: patterns[newValueT][newValueS],
				cells: presets[patterns[newValueT][newValueS]],
			}));
		},
		[patternTypeIdx, specificPatternIdx, setCursor]
	);

	const handleGameDpad = useCallback(
		(r, c) => {
			if (running) return;
			setCursor((prev) => {
				return {
					...prev,
					row: (prev.row + r + rows) % rows,
					col: (prev.col + c + columns) % columns,
					cells: prev.cells ? prev.cells : [[1]],
					display: true,
				};
			});
		},
		[setCursor, running]
	);

	const handleGameAction = useCallback(
		(e) => {
			if (running || !cursor.display) return;
			// retrieve row, col, value of every cell in cursor area
			// for each cell perform action based on DOM element id
			if (Number.isInteger(cursor.row) && Number.isInteger(cursor.col)) {
				setGrid((pg) => {
					const ng = pg.map((pRow) => [...pRow]);

					for (let r = 0; r < cursor.cells.length; r++) {
						for (let c = 0; c < cursor.cells[r].length; c++) {
							const row = (cursor.row + r) % rows;
							const col = (cursor.col + c) % columns;
							if (!cursor.cells[r][c]) continue;
							// if (!ng[row][col].blinking) continue;

							if (e.currentTarget.id === "b") {
								ng[row][col].dead();
							} else if (e.currentTarget.id === "a") {
								ng[row][col].alive(2);
							}
						}
					}
					return ng;
				});
			}
		},
		[running, cursor, setGrid]
	);

	const handleGameSelect = useCallback(
		(e) => {
			setCursor((prev) => {
				return { ...prev, display: !prev.display };
			});
		},
		[setCursor]
	);

	const handleGameStart = useCallback(
		(e) => {
			// runningRef.current = !running;
			// setRunning(!running);
			changeRunning();
			if (!running) {
				playSound({ id: "start" });
				setCursor((prev) => ({ ...prev, display: false }));

				runGame(runOnceRef.current);
			} else {
				setCursor((prev) => ({ ...prev, display: true }));
			}
		},
		[playSound, running, runGame, setCursor, setRunning]
	);

	const handleGameCellClick = useCallback(async (e, g, r, c) => {
		// const tlCell = g[r - 1][c - 1];
		// const tmCell = g[r - 1][c];
		// const trCell = g[r - 1][c + 1];
		// const mlCell = g[r][c - 1];
		// const mmCell = g[r][c];
		// const mrCell = g[r][c + 1];
		// const blCell = g[r + 1][c - 1];
		// const bmCell = g[r + 1][c];
		// const brCell = g[r + 1][c + 1];
		console.log(r, c, g[r][c]);
		console.log(g[r]);
	}, []);

	const handleGameEEShortcuts = useMemo(
		() => [
			[
				shortcuts.randomizeCells,
				() => {
					playSound({ id: "distorted" });
					setGrid(create2dArray(true));
					setCursor((prev) => ({ ...prev, display: false }));
				},
			],
			[
				shortcuts.konami,
				(resetClickOrder) => {
					console.log("KONAMI");
					playSound({ id: "easter-egg" });
					unlockEasterEgg();
					setCursor((prev) => ({ ...prev, display: false }));
					setGame("snake");
					resetClickOrder();
					// setCursor((prev) => ({ ...prev, display: false }));
					// setGame("snake");
					// resetClickOrder();
				},
			],
			[
				shortcuts.nextGeneration,
				() => {
					runOnceRef.current = true;
					changeRunning(true);
					runGame(true);
				},
			],
			[
				shortcuts.copyScreenState,
				(resetClickOrder) => {
					copyScreenState();
					setMessage("Copied screen to clipboard");
					resetClickOrder();
				},
			],
			[
				shortcuts.resetCells,
				(resetClickOrder, e) => {
					setGrid(create2dArray(false, 0));
					resetClickOrder();
				},
			],
			[
				shortcuts.fillCells,
				(resetClickOrder, e) => {
					setGrid(create2dArray(false, 1));
					resetClickOrder();
				},
			],
			[
				shortcuts.prevPattern,
				(resetClickOrder, e) => {
					cyclePattern(0, -1);
					resetClickOrder();
				},
			],
			[
				shortcuts.nextPattern,
				(resetClickOrder, e) => {
					cyclePattern(0, 1);
					resetClickOrder();
				},
			],
			[
				shortcuts.prevType,
				(resetClickOrder, e) => {
					cyclePattern(-1, 0);
					resetClickOrder();
				},
			],
			[
				shortcuts.nextType,
				(resetClickOrder, e) => {
					cyclePattern(1, 0);
					resetClickOrder();
				},
			],
			[
				shortcuts.increaseCursorSize,
				(resetClickOrder, e) => {
					setCursor((prev) => {
						return {
							...prev,
							cluster: prev.cluster + 1,
							cells: presets.expandCell(prev.cells, 1, prev.cluster),
						};
					});
					resetClickOrder();
				},
			],
			[
				shortcuts.decreaseCursorSize,
				(resetClickOrder, e) => {
					setCursor((prev) => {
						const idealNewClusterSize = prev.cluster - 1;
						const newClusterSize = Math.max(idealNewClusterSize, 1);
						return {
							...prev,
							cluster: newClusterSize,

							// we want n to actually be -1 so it actually decreases in size instead of getting bigger by new n
							cells: presets.expandCell(prev.cells, -1, prev.cluster),
						};
					});
					resetClickOrder();
				},
			],
		],
		[
			playSound,
			cyclePattern,
			copyScreenState,
			setCursor,
			setGame,
			setGrid,
			setMessage,
			handleGameStart,
			unlockEasterEgg,
		]
	);

	useEffect(() => {
		setGameState({
			name: "life",
			loadGame,
			resetGame,
			runGame,
			handleGameDpad,
			handleGameAction,
			handleGameSelect,
			handleGameStart,
			handleGameCellClick,
			handleGameEEShortcuts,
		});
	}, [
		setGameState,
		loadGame,
		resetGame,
		runGame,
		handleGameDpad,
		handleGameAction,
		handleGameSelect,
		handleGameStart,
		handleGameCellClick,
		handleGameEEShortcuts,
	]);
});
