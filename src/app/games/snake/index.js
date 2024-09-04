import { useRef, useState, useCallback, useMemo, useEffect } from "react";
// import useSound from "use-sound";
import useSound from "@/app/util/useSound";
import { useShallow } from "zustand/react/shallow";

import { useGameBoyStore } from "@/app/store/gameboy";
import { create2dArray, delay, continuouslyAnimate } from "@/app/util/helper";
import { rows, columns, shKonami } from "@/app/constants";
import Cell from "@/app/Cell";
import * as presets from "@/app/presets";

export const credits = [
	[
		"The Snake Game (original GB music)",
		"Zuka",
		"8-bit Music",
		"https://www.youtube.com/@8-bitmusic494",
		"https://www.youtube.com/watch?v=FpDWpX9luCQ",
	],
];

export const SNAKE_SIZE = 4;
export const SNAKE_SEGMENTS = 4; // additional segments after the head
export const directions = {
	up: [-SNAKE_SIZE, 0], // decrease row
	down: [SNAKE_SIZE, 0], // increase row
	left: [0, -SNAKE_SIZE], // decrease column
	right: [0, SNAKE_SIZE], // increase column
};
export const initialDirection = directions.up;
export const initialSnake = createInitialSnake(SNAKE_SIZE, SNAKE_SEGMENTS);
export const initialApple = createApple();

export function determineSnakeEyes(head, directionArr) {
	if (!head) return;
	const [[topLeftRow, topLeftCol], [bottomRightRow, bottomRightCol]] = head;
	if (directionArr[0] < 0 && directionArr[1] == 0) {
		// up
		// -1, 0
		// [00, 01]
		// [00, 11]
		return [
			[topLeftRow, topLeftCol],
			[topLeftRow, bottomRightCol],
		];
	} else if (directionArr[0] > 0 && directionArr[1] == 0) {
		// down
		// 1, 0
		// [10, 01]
		// [10, 11]

		return [
			[bottomRightRow, topLeftCol],
			[bottomRightRow, bottomRightCol],
		];
	} else if (directionArr[0] == 0 && directionArr[1] < 0) {
		// left
		// 0, -1
		// [00, 01]
		// [10, 01]

		return [
			[topLeftRow, topLeftCol],
			[bottomRightRow, topLeftCol],
		];
	} else if (directionArr[0] == 0 && directionArr[1] > 0) {
		// right
		// 0, 1
		// [00, 11]
		// [10, 11]

		return [
			[topLeftRow, bottomRightCol],
			[bottomRightRow, bottomRightCol],
		];
	}
}

export function createApple(snake = initialSnake) {
	const randomInteger = (from, to, without = []) => {
		const allowedNumbers = Array(to - from)
			.fill()
			.map((empty, idx) => idx + from)
			.filter((number) => !without.includes(number));

		return allowedNumbers[Math.floor(Math.random() * allowedNumbers.length)];
	};

	const doesSegmentIntersectSnake = (topLeft, bottomRight) => {
		for (let row = topLeft[0]; row <= bottomRight[0]; row++) {
			for (let col = topLeft[1]; col <= bottomRight[1]; col++) {
				for (let segment of snake) {
					let [snakeTopLeft, snakeBottomRight] = segment;
					if (
						row >= snakeTopLeft[0] &&
						row <= snakeBottomRight[0] &&
						col >= snakeTopLeft[1] &&
						col <= snakeBottomRight[1]
					) {
						return true;
					}
				}
			}
		}
		return false;
	};

	while (true) {
		let topLeft = [
			randomInteger(0, rows - SNAKE_SIZE),
			randomInteger(0, columns - SNAKE_SIZE),
		];
		let bottomRight = [
			topLeft[0] + SNAKE_SIZE - 1,
			topLeft[1] + SNAKE_SIZE - 1,
		];

		if (!doesSegmentIntersectSnake(topLeft, bottomRight)) {
			return [topLeft, bottomRight];
		}
	}
}

// snake[i][0] is row, col of top left corner
// snake[i][1] is row, col of bottom right corner
export function createInitialSnake(size, segments) {
	const initialSnake = [];
	const centerCol = columns / 2; // 80
	const offsetCol = Math.floor(centerCol - size / 2);
	const centerRow = rows / 2; // 72
	const offsetRow = Math.floor(centerRow - (size * segments) / 2);

	for (let i = 0; i < segments + 1; i++) {
		initialSnake.push([]);
		// const beginningRow = offsetRow + size * i - size + 1;
		const beginningRow = offsetRow + size * i;
		// initialSnake[i].push(
		// 	[beginningRow, offsetCol],
		// 	[beginningRow, offsetCol + 1]
		// );
		const endRow = beginningRow + size - 1;
		const endCol = Math.floor(centerCol + size / 2 - 1);
		initialSnake[i].push([beginningRow, offsetCol], [endRow, endCol]);
	}
	return initialSnake;
}

export default function Snake({
	changeRunning,
	powerStatusRef,
	runningRef,
	stopAnimationRef,
}) {
	const { setGrid, running, setRunning, setGame, setGameState, volume } =
		useGameBoyStore(
			useShallow((state) => ({
				setGrid: state.setGrid,
				running: state.running,
				setRunning: state.setRunning,
				setGame: state.setGame,
				setGameState: state.setGameState,
				volume: state.volume,
			}))
		);
	const [apple, setApple] = useState(initialApple);
	const [snake, setSnake] = useState([...initialSnake]);
	// const [direction, setDirection] = useState(initialDirection);
	const [gameOver, setGameOver] = useState(false);

	const playRef = useRef();
	const exposedRef = useRef();
	const soundId = useRef();
	const [playSound, exposedSound] = useSound(
		"/audio/games/snake/snake_8k.wav",
		{
			volume: 0.5,
			loop: true,
			onplayerror: (e) => {
				console.log("ERROR playing sound", e);
			},
		}
	);

	playRef.current = playSound;
	exposedRef.current = exposedSound;

	const [playGameOver] = useSound("./audio/games/snake/game-over_8k.wav", {
		volume: 0.5,
	});

	const snakeRef = useRef(snake);
	const appleRef = useRef(apple);
	const appleCountRef = useRef(0);
	const directionRef = useRef(initialDirection);

	const togglePlaySnake = () => {
		console.log("togglePlaySnake");
		if (running) {
			// exposedSnake.pause();
			exposedRef.current.pause(soundId.current);
		} else {
			// playSnake();
			// soundId.current = playRef.current({ id: "snake" });
			soundId.current = playRef.current({ playbackRate: 2 });
		}
	};
	const stopSnake = () => {
		exposedRef.current.stop(soundId.current);
		// exposedSnake.stop();
	};

	const changeSnake = (value) => {
		setSnake(value);
		snakeRef.current = value;
	};
	const changeApple = (value) => {
		setApple(value);
		appleRef.current = value;
	};
	// const changeRunning = (value) => {
	// 	setRunning(value);
	// 	runningRef.current = value;
	// };
	const changeDirection = (value) => {
		// setDirection(value);
		directionRef.current = value;
	};

	const createSnakeGrid = (apple = initialApple, snake = initialSnake) => {
		const ng = create2dArray();

		for (let row = apple[0][0]; row <= apple[1][0]; row++) {
			for (let col = apple[0][1]; col <= apple[1][1]; col++) {
				ng[row][col] = new Cell({ vital_value: 1, color: 1 });
			}
		}

		const eyes = determineSnakeEyes(snake[0], directionRef.current);
		for (let i = 0; i < snake.length; i++) {
			for (let row = snake[i][0][0]; row <= snake[i][1][0]; row++) {
				for (let col = snake[i][0][1]; col <= snake[i][1][1]; col++) {
					ng[row][col] = new Cell({
						vital_value: 1,
						color: eyes.some(([r, c]) => r === row && c === col) ? 3 : 2,
					});
				}
			}
		}
		return ng;
	};

	const resetSnake = useCallback(
		(includeGrid = false) => {
			const newSnake = [...initialSnake];
			const randomApple = createApple(newSnake);
			changeApple(randomApple);
			appleCountRef.current = 0;
			changeSnake(newSnake);
			setGameOver(false);
			changeDirection(initialDirection);
			if (includeGrid) {
				setGrid(createSnakeGrid(randomApple, newSnake));
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	const handleGameOver = async () => {
		setGameOver(true);
		stopSnake();
		playGameOver();

		const gameOverGrid = presets.endGame(appleCountRef.current, 2);

		// TURN SNAKE & APPLE LIGHTER COLOR

		const lightenedColor = 1;

		const changeBlockColor = (arr) => {
			for (let row = arr[0][0]; row <= arr[1][0]; row++) {
				for (let col = arr[0][1]; col <= arr[1][1]; col++) {
					let cellColor = lightenedColor;
					const textColor = gameOverGrid[row][col]?.color;
					if (textColor >= 1) {
						cellColor = textColor;
					}
					gameOverGrid[row][col] = new Cell({
						vital_value: 1,
						color: cellColor,
					});
				}
			}
		};

		// apple
		changeBlockColor(appleRef.current);
		// snake
		for (let i = 0; i < snakeRef.current.length; i++) {
			changeBlockColor(snakeRef.current[i]);
		}

		setGrid(gameOverGrid);

		const snakeLength = snakeRef.current.length;

		// const {animate, stop} = continuouslyAnimate(
		// 	powerStatusRef,
		// 	runningRef,
		// 	() => {
		// 		const removedSegment = snakeRef.current.pop();
		// 		setGrid((pg) => {
		// 			const ng = pg.map((row) => [...row]);
		// 			for (
		// 				let row = removedSegment[0][0];
		// 				row <= removedSegment[1][0];
		// 				row++
		// 			) {
		// 				for (
		// 					let col = removedSegment[0][1];
		// 					col <= removedSegment[1][1];
		// 					col++
		// 				) {
		// 					const color = gameOverGrid[row][col]?.color;
		// 					ng[row][col] = new Cell({
		// 						vital_value: 0,
		// 						color: color === 2 ? color : 0,
		// 					});
		// 				}
		// 			}
		// 			return ng;
		// 		});

		// 		setSnake((prevSnake) => {
		// 			// snakeRef.current = prevSnake.slice(0, -1);
		// 			return snakeRef.current;
		// 			// return prevSnake.slice(0, -1);
		// 		});
		// 	},
		// 	100
		// );
		// stopAnimationRef.current = stop;
		// animate();

		// remove snake segments one by one by changing the color to be 0 (transparent)
		for (let i = 0; i < snakeLength; i++) {
			const removeSegmentFromGrid = () => {
				const removedSegment = snakeRef.current.pop();
				setGrid((pg) => {
					const ng = pg.map((row) => [...row]);
					for (
						let row = removedSegment[0][0];
						row <= removedSegment[1][0];
						row++
					) {
						for (
							let col = removedSegment[0][1];
							col <= removedSegment[1][1];
							col++
						) {
							const color = gameOverGrid[row][col]?.color;
							ng[row][col] = new Cell({
								vital_value: 0,
								color: color === 2 ? color : 0,
							});
						}
					}
					return ng;
				});

				// snakeRef.current = [...snakeRef.current].slice(0, -1);

				setSnake((prevSnake) => {
					// snakeRef.current = prevSnake.slice(0, -1);
					return snakeRef.current;
					// return prevSnake.slice(0, -1);
				});
			};

			await delay(100);
			removeSegmentFromGrid();
		}

		// remove/fade apple
		await delay(300);
		const currentApple = appleRef.current;
		setGrid((pg) => {
			const ng = pg.map((row) => [...row]);
			for (let row = currentApple[0][0]; row <= currentApple[1][0]; row++) {
				for (let col = currentApple[0][1]; col <= currentApple[1][1]; col++) {
					const color = gameOverGrid[row][col]?.color;
					ng[row][col] = new Cell({
						vital_value: 0,
						color: color === 2 ? color : 0,
					});
				}
			}
			return ng;
		});
		changeApple([]);
		changeRunning(false);
	};

	const loadGame = useCallback(() => {
		resetSnake(true);
	}, [resetSnake]);

	const resetGame = useCallback(() => {
		console.log("Resetting game state");
		stopSnake();
		resetSnake();
	}, [resetSnake]);

	const runGame = useCallback(
		() => {
			// playSnake();
			// exposedRef.current = exposedSnake;

			const snek = () => {
				if (gameOver) return;

				let newApple = [...appleRef.current];
				const newSnake = snake;

				const directionalTL = newSnake[0][0].map(
					(value, index) => value + directionRef.current[index]
				);

				const newHead = [
					directionalTL,
					[
						directionalTL[0] + SNAKE_SIZE - 1,
						directionalTL[1] + SNAKE_SIZE - 1,
					],
				];

				// CASES FOR GAME OVER

				if (
					// SCREEN EDGES

					// top wall -- look at top left corner row
					(newHead[0][0] < 0 && newHead[0][0] >= 0 - SNAKE_SIZE) ||
					// bottom wall -- look at bottom right corner row
					newHead[1][0] > rows - 1 ||
					// left wall -- look at top left corner column
					(newHead[0][1] < 0 && newHead[0][1] >= 0 - SNAKE_SIZE) ||
					// right wall -- look at bottom right corner column
					newHead[1][1] > columns - 1 ||
					// SNAKE ATE ITSELF

					// some segment of snake has values align with newHead top left corner
					// note: since snake moves in direction identical to it's grid size we don't have to check for in-between values
					newSnake.some(
						([
							[segmentTopLeftRow, segmentTopLeftColumn],
							[segmentBottomRightRow, segmentBottomRightColumn],
						]) =>
							segmentTopLeftRow === newHead[0][0] &&
							segmentTopLeftColumn === newHead[0][1]
					)
				) {
					handleGameOver();
					return false;
				}
				const appleRows = [
					Math.min(appleRef.current[0][0], appleRef.current[1][0]),
					Math.max(appleRef.current[0][0], appleRef.current[1][0]),
				];
				const appleCols = [
					Math.min(appleRef.current[1][1], appleRef.current[0][1]),
					Math.max(appleRef.current[1][1], appleRef.current[0][1]),
				];

				const eyes = determineSnakeEyes(newHead, directionRef.current);

				if (
					(eyes[0][0] >= appleRows[0] &&
						eyes[0][0] <= appleRows[1] &&
						eyes[0][1] >= appleCols[0] &&
						eyes[0][1] <= appleCols[1]) ||
					(eyes[1][0] >= appleRows[0] &&
						eyes[1][0] <= appleRows[1] &&
						eyes[1][1] >= appleCols[0] &&
						eyes[1][1] <= appleCols[1])
				) {
					appleCountRef.current++;
					newApple = createApple(newSnake);
					changeApple(newApple);
				} else {
					newSnake.pop();
				}
				newSnake.unshift(newHead);

				changeSnake(newSnake);
				setGrid(createSnakeGrid(newApple, newSnake));

				return true;
			};

			const { animate, stop } = continuouslyAnimate(
				// powerStatusRef,
				runningRef,
				snek,
				100
			);
			stopAnimationRef.current = stop;
			animate();
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[gameOver, playSound, snake, apple]
	);

	const handleGameEEShortcuts = useMemo(() => {
		return [];
	}, []);

	const handleGameDpad = useCallback(
		(r = 0, c = 0) => {
			if (!running) return;
			changeDirection([r * SNAKE_SIZE, c * SNAKE_SIZE]);
		},
		[running]
	);

	const handleGameAction = useCallback(() => {}, []);
	const handleGameSelect = useCallback(() => {}, []);

	const handleGameStart = useCallback(
		(e) => {
			// console.log("----within start----");
			// console.log("GAME OVER?", gameOver);
			// console.log("RUNNING?", running);
			if (gameOver && !running) {
				return resetSnake(true);
			} else if (gameOver && running) {
				return;
			}
			changeRunning(!running);
			togglePlaySnake();
			runGame();
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[gameOver, running, runGame]
	);

	const handleGameCellClick = useCallback((e, g, r, c) => {
		console.log(g[r][c]);
	}, []);

	useEffect(() => {
		setGameState({
			name: "snake",
			credits,
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

	return "";
}
