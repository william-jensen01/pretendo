import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { countNeighbors } from "@/app/games/life";
import {
	SNAKE_SIZE,
	SNAKE_SEGMENTS,
	initialSnake,
	initialApple,
	directions,
	initialDirection,
	determineSnakeEyes,
	createApple,
} from "@/app/games/snake";
import Cell, { colorLookup } from "@/app/Cell";
import * as presets from "@/app/presets";
import {
	rows,
	columns,
	shKonami,
	shRandomizeCells,
	shCopyScreenState,
	shNextGeneration,
} from "@/app/constants";
import useSound from "use-sound";
import { Pretendo, Lato, NES, Futura, Gill } from "@/app/fonts";
import VolumeWheel from "@/app/components/GameBoy/VolumeWheel";
import ActionButtons from "@/app/components/GameBoy/ActionButtons";
import Dpad from "@/app/components/GameBoy/Dpad";
import { create2dArray, createPointerEvent } from "@/app/util/helper";

const width = 352;
const gap = 0.01;
const resolutionX = (width - columns * gap) / columns;
const resolutionY = ((width / 10) * 9 - rows * gap) / rows;

const patterns = presets.patterns;

export default function GameBoy({ setMessage }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [powerStatus, setPowerStatus] = useState(0);
	const [pageLoaded, setPageLoaded] = useState(false);
	const [isWelcoming, setIsWelcoming] = useState(false);
	const [clickOrder, setClickOrder] = useState([]);
	const [clickTimer, setClickTimer] = useState(null);
	const [game, setGame] = useState("life");
	const [evolutions, setEvolutions] = useState(0);

	const [running, setRunning] = useState(false);
	const [grid, setGrid] = useState(create2dArray());

	const [volume, setVolume] = useState(1);
	const [playTest] = useSound("./audio/start.wav", { volume: 0.1 });
	const [playStartup] = useSound("./audio/startup.wav", {
		volume: volume * 0.25,
	});
	const [playStart] = useSound("./audio/start.wav", { volume: volume * 0.1 });
	const [playEE] = useSound("./audio/easter-egg.wav", { volume: volume * 1 });
	const [playDistorted] = useSound("./audio/distorted.wav", {
		volume: volume * 1,
	});
	const [playSnake, exposedSnake] = useSound("./audio/snake.wav", {
		volume: volume * 0.1,
		loop: true,
		interrupt: true,
	});
	const [playGameOver] = useSound("./audio/game-over.wav", {
		volume: volume * 0.1,
	});

	// patterns[0][0] = boat
	// patterns [2][1] = light-weight spaceship
	const [patternTypeIdx, setPatternTypeIdx] = useState(0);
	const [specificPatternIdx, setSpecificPatternIdx] = useState(1);
	const [cursor, setCursor] = useState({
		row: Math.floor(
			rows / 2 -
				presets[patterns[patternTypeIdx][specificPatternIdx]].length / 2
		),
		col: Math.floor(
			columns / 2 -
				presets[patterns[patternTypeIdx][specificPatternIdx]][0].length / 2
		),
		cells: presets[patterns[patternTypeIdx][specificPatternIdx]],
		display: false,
	});

	const [apple, setApple] = useState(initialApple);
	const [snake, setSnake] = useState([...initialSnake]);
	const [direction, setDirection] = useState(initialDirection);
	const [gameOver, setGameOver] = useState(false);

	const powerButtonRef = useRef(null);
	const volumeSliderRef = useRef(null);
	const runningRef = useRef(running);
	const runOnceRef = useRef(false);
	const clickTimerRef = useRef(clickTimer);
	const powerStatusRef = useRef(powerStatus);
	const animationRef = useRef();
	const snakeRef = useRef(snake);
	const appleRef = useRef(apple);
	const appleCountRef = useRef(0);

	const directionRef = useRef(direction);

	clickTimerRef.current = !!clickTimer;
	// directionRef.current = direction;
	// appleRef.current = apple;
	// gameOverRef.current = gameOver

	const delay = (ms) => new Promise((res) => setTimeout(res, ms));

	const createQueryString = useCallback(
		(name, value) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set(name, value);
			return params.toString();
		},
		[searchParams]
	);

	const unsecureCopyToClipboard = (text) => {
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
	};

	const copyScreenState = async (e) => {
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

		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(url);
		} else {
			unsecureCopyToClipboard(url);
		}
		return url;
	};

	const getGridFromURL = useCallback(() => {
		let hasQuery = false;
		const newGrid = create2dArray();
		for (const key of searchParams.keys()) {
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
			setGrid(newGrid);
			router.push("/", { shallow: true });
		}
	}, [searchParams, router]);

	// const continuouslyAnimate = (callback, delayAmount = 0) => {
	// 	let animationFrameId = null;
	// 	const animate = async () => {
	// 		if (!runningRef.current || !powerStatusRef.current) {
	// 			cancelAnimationFrame(animationFrameId);
	// 			return;
	// 		}

	// 		if (delayAmount) await delay(delayAmount);
	// 		let shouldContinue = callback();
	// 		if (shouldContinue) {
	// 			animationFrameId = requestAnimationFrame(animate);
	// 		} else {
	// 			cancelAnimationFrame(animationFrameId);
	// 			animationFrameId = null;
	// 		}
	// 	};

	// 	return animate;
	// };

	const continuouslyAnimate = useCallback((callback, delayAmount = 0) => {
		let animationFrameId = null;
		const animate = async () => {
			if (!runningRef.current || !powerStatusRef.current) {
				cancelAnimationFrame(animationFrameId);
				return;
			}

			if (delayAmount) await delay(delayAmount);
			let shouldContinue = callback();
			if (shouldContinue) {
				animationFrameId = requestAnimationFrame(animate);
			} else {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		};

		return animate;
	}, []);

	const fallDownToCenter = useCallback(
		(subArr) => {
			return new Promise((resolve, reject) => {
				let iteration = 0;
				runningRef.current = true;

				const operation = () => {
					let tempGrid = Array(rows)
						.fill()
						.map(() => Array(columns).fill(0));
					const limit = Math.min(iteration, subArr.length);
					const adjustedTotalRows = subArr.length - 1;
					for (let i = 0; i < limit; i++) {
						if (!powerStatusRef.current) return false;
						tempGrid[i + Math.max(0, iteration - adjustedTotalRows)] = [
							...subArr[Math.max(i, adjustedTotalRows - iteration + i)],
						];
					}

					const newGrid = create2dArray();
					for (let i = 0; i < tempGrid.length; i++) {
						for (let k = 0; k < tempGrid[i].length; k++) {
							if (!powerStatusRef.current) return false;
							newGrid[i][k] = new Cell({
								vital_value: tempGrid[i][k],
								color: tempGrid[i][k] ? 2 : 0,
							});
						}
					}

					setGrid(newGrid);

					if (++iteration < 72) {
						return true;
					} else {
						resolve();
						return false;

						return false;
					}
				};

				const animate = continuouslyAnimate(operation);

				animate();
			});
		},
		[continuouslyAnimate]
	);

	const changeSnake = (value) => {
		setSnake(value);
		snakeRef.current = value;
	};

	const changeApple = (value) => {
		setApple(value);
		appleRef.current = value;
	};

	const changeRunning = (value) => {
		setRunning(value);
		runningRef.current = value;
	};
	const changeDirection = (value) => {
		setDirection(value);
		directionRef.current = value;
	};

	const phasePower = async (e) => {
		console.log("phasing");
		e.currentTarget.classList.toggle("on");
		if (powerStatus) {
			setGrid(create2dArray());
			if (cursor.display) {
				setCursor((prev) => ({ ...prev, display: false }));
			}

			setGame("life");
			resetSnake();
			changeRunning(false);
			exposedSnake.stop();

			setPowerStatus(0);
			powerStatusRef.current = false;
		} else {
			setPowerStatus(1);
			powerStatusRef.current = true;

			// const centeredPretendo = presets.resizeFormatToGrid(presets.pretendo, 3);
			// setGrid(centeredPretendo);

			await fallDownToCenter(presets.pretendo);

			playStartup();
			await delay(750);

			runningRef.current = false;
			setCursor((prev) => ({ ...prev, display: true }));
			getGridFromURL();
		}
	};

	const createSnakeGrid = (apple = initialApple, snake = initialSnake) => {
		const ng = create2dArray();
		for (let row = apple[0][0]; row <= apple[1][0]; row++) {
			for (let col = apple[0][1]; col <= apple[1][1]; col++) {
				ng[row][col] = new Cell({ vital_value: 1, color: 1 });
				// cells.push([row, col, 1]);
			}
		}
		// color snake dark green
		for (let i = 0; i < snake.length; i++) {
			for (let row = snake[i][0][0]; row <= snake[i][1][0]; row++) {
				for (let col = snake[i][0][1]; col <= snake[i][1][1]; col++) {
					ng[row][col] = new Cell({ vital_value: 1, color: 2 });
					// cells.push([row, col, 2]);
				}
			}
		}
		return ng;
	};

	const resetSnake = (includeGrid = false) => {
		const newSnake = [...initialSnake];
		const randomApple = createApple(newSnake);
		changeApple(randomApple);
		// setAppleCount(0);
		appleCountRef.current = 0;
		changeSnake(newSnake);
		setGameOver(false);
		changeDirection(initialDirection);
		if (includeGrid) {
			setGrid(createSnakeGrid(randomApple, newSnake));
		}
	};

	const handleGameOver = async () => {
		setGameOver(true);
		// changeRunning(false);
		exposedSnake.stop();
		playGameOver();

		const gameOverGrid = presets.endGame(appleCountRef.current, 2);

		// TURN SNAKE & APPLE LIGHTER COLOR

		const lightenedColor = 1;

		// apple
		for (
			let arow = appleRef.current[0][0];
			arow <= appleRef.current[1][0];
			arow++
		) {
			for (
				let acol = appleRef.current[0][1];
				acol <= appleRef.current[1][1];
				acol++
			) {
				let cellColor = lightenedColor;
				const textColor = gameOverGrid[arow][acol]?.color;
				if (textColor >= 1) {
					cellColor = textColor;
				}
				gameOverGrid[arow][acol] = new Cell({
					vital_value: 1,
					color: cellColor,
				});
			}
		}

		// snake
		for (let i = 0; i < snakeRef.current.length; i++) {
			for (
				let srow = snakeRef.current[i][0][0];
				srow <= snakeRef.current[i][1][0];
				srow++
			) {
				for (
					let scol = snakeRef.current[i][0][1];
					scol <= snakeRef.current[i][1][1];
					scol++
				) {
					let cellColor = lightenedColor;
					const textColor = gameOverGrid[srow][scol]?.color;
					if (textColor >= 1) {
						cellColor = textColor;
					}
					gameOverGrid[srow][scol] = new Cell({
						vital_value: 1,
						color: cellColor,
					});
				}
			}
		}

		setGrid(gameOverGrid);

		const snakeLength = snakeRef.current.length;

		for (let i = 0; i < snakeLength; i++) {
			const removeSegmentFromGrid = () => {
				const removedSegment = [...snakeRef.current].pop();
				setGrid((pg) => {
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
							pg[row][col] = new Cell({
								vital_value: 0,
								color: color === 2 ? color : 0,
							});
						}
					}
					return pg;
				});

				// snakeRef.current = [...snakeRef.current].slice(0, -1);

				setSnake((prevSnake) => {
					snakeRef.current = prevSnake.slice(0, -1);
					return prevSnake.slice(0, -1);
				});
			};

			await delay(100);
			removeSegmentFromGrid();

			if (i === snakeLength - 1) {
				await delay(300);
				const currentApple = [...appleRef.current];
				setGrid((pg) => {
					for (let row = currentApple[0][0]; row <= currentApple[1][0]; row++) {
						for (
							let col = currentApple[0][1];
							col <= currentApple[1][1];
							col++
						) {
							const color = gameOverGrid[row][col]?.color;
							pg[row][col] = new Cell({
								vital_value: 0,
								color: color === 2 ? color : 0,
							});
						}
					}
					return pg;
				});
				changeApple([]);
				changeRunning(false);
			}
		}
	};

	// const handleKeyDown = useCallback((e) => {
	// 	if (e.repeat) return;
	// 		e.preventDefault();
	// 		switch (e.key) {
	// 			case "Tab": {
	// 				const button = powerButtonRef.current;
	// 				if (button) {
	// 					button.click();
	// 				}
	// 				break;
	// 			}
	// 			case "ArrowUp": {
	// 				if (clickOrder.length == 0) {
	// 					createPointerEvent("up", "pointerdown", true);
	// 				}
	// 				break;
	// 			}
	// 			case "ArrowDown": {
	// 				createPointerEvent("down", "pointerdown", true);
	// 				break;
	// 			}
	// 			case "ArrowLeft": {
	// 				createPointerEvent("left", "pointerdown", true);
	// 				break;
	// 			}
	// 			case "ArrowRight": {
	// 				createPointerEvent("right", "pointerdown", true);
	// 				break;
	// 			}
	// 			case "b":
	// 				createPointerEvent("b", "pointerdown", true);
	// 				break;
	// 			case "a":
	// 				createPointerEvent("a", "pointerdown", true);
	// 				break;
	// 			case " ":
	// 				document.querySelector("#select").click();
	// 				break;
	// 			case "Enter":
	// 				document.querySelector("#start").click();
	// 				break;
	// 		}
	// }, [clickOrder])

	useEffect(() => {
		document.body.style.zoom = "100%";

		setPageLoaded(true);

		let elementHeight = document.querySelector("#container").offsetHeight;
		let elementWidth = document.querySelector("#container").offsetWidth;
		// let elementHeight = document.body.offsetHeight;
		let vpHeight = window.innerHeight;
		let vpWidth = window.innerWidth;
		let zoomLevelH = (vpHeight / elementHeight) * 95;
		let zoomLevelW = (vpWidth / elementWidth) * 95;

		const zoomLevel = Math.min(zoomLevelH, zoomLevelW);

		const scale = zoomLevel / 100;
		// pageRef.current.style.transform = `scale(${scale})`;
		document.body.style.zoom = zoomLevel + "%";

		const handleKeyDown = (e) => {
			if (e.repeat) return;
			e.preventDefault();
			switch (e.key) {
				case "Tab": {
					const button = powerButtonRef.current;
					if (button) {
						button.click();
					}
					break;
				}
				case "ArrowUp": {
					// if (clickOrder.length == 0) {
					createPointerEvent("up", "pointerdown", true);
					// }
					break;
				}
				case "ArrowDown": {
					createPointerEvent("down", "pointerdown", true);
					break;
				}
				case "ArrowLeft": {
					createPointerEvent("left", "pointerdown", true);
					break;
				}
				case "ArrowRight": {
					createPointerEvent("right", "pointerdown", true);
					break;
				}
				case "b":
					createPointerEvent("b", "pointerdown", true);
					break;
				case "a":
					createPointerEvent("a", "pointerdown", true);
					break;
				case " ":
					document.querySelector("#select").click();
					break;
				case "Enter":
					document.querySelector("#start").click();
					break;
			}
		};

		const handleKeyUp = (e) => {
			if (e.repeat) return;
			e.preventDefault();
			switch (e.key) {
				case "ArrowUp": {
					createPointerEvent("up", "pointerup");
					break;
				}
				case "ArrowDown": {
					createPointerEvent("down", "pointerup");
					break;
				}
				case "ArrowLeft": {
					createPointerEvent("left", "pointerup");
					break;
				}
				case "ArrowRight": {
					createPointerEvent("right", "pointerup");
					break;
				}
				case "b": {
					createPointerEvent("b", "pointerup");
					break;
				}
				case "a": {
					createPointerEvent("a", "pointerup");
					break;
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	useEffect(() => {
		if (!running) {
			cancelAnimationFrame(animationRef.current);
			animationRef.current = null;
		}

		switch (game) {
			case "life": {
				if (running) {
					runSimulation(runOnceRef.current);
				}
				break;
			}
			case "snake": {
				if (running) {
					sneking();
				} else {
					exposedSnake.pause();
				}
				break;
			}
		}
	}, [running]);

	const sneking = useCallback(() => {
		playSnake();

		const animate = continuouslyAnimate(() => {
			if (gameOver || game !== "snake") return;

			console.table(directionRef.current);

			let newApple = [...appleRef.current];
			const newSnake = snake;
			// const newSnake = snake.map(([topLeft, bottomRight]) => [
			// 	[...topLeft],
			// 	[...bottomRight],
			// ]);

			const directionalTL = newSnake[0][0].map(
				(value, index) => value + directionRef.current[index]
			);

			const newHead = [
				directionalTL,
				[directionalTL[0] + SNAKE_SIZE - 1, directionalTL[1] + SNAKE_SIZE - 1],
			];

			if (
				// top wall -- look at top left corner row
				(newHead[0][0] < 0 && newHead[0][0] >= 0 - SNAKE_SIZE) ||
				// bottom wall -- look at bottom right corner row
				newHead[1][0] >= rows - 1 ||
				// left wall -- look at top left corner column
				(newHead[0][1] < 0 && newHead[0][1] >= 0 - SNAKE_SIZE) ||
				// right wall -- look at bottom right corner column
				newHead[1][1] >= columns - 1 ||
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
		}, 100);

		animate();
	}, [continuouslyAnimate, game, direction, snake, apple]);

	// const sneking = useCallback(() => {
	// 	playSnake();

	// 	console.log("appleRef", appleRef);
	// 	console.log("snakeRef", snakeRef);

	// 	const animate = continuouslyAnimate(snekOperation, 500);

	// 	requestAnimationFrame(animate);
	// }, [game, running, powerStatus, apple, snake, direction]);

	// const sneking = continuouslyAnimate(() => {
	// 	if (gameOver || game !== "snake") return;

	// 	let newApple = [...appleRef.current];

	// 	console.log("-------------------");
	// 	console.log("snake", snake);
	// 	const newSnake = snakeRef.current.map(([topLeft, bottomRight]) => [
	// 		[...topLeft],
	// 		[...bottomRight],
	// 	]);

	// 	const directionalTL = newSnake[0][0].map(
	// 		(value, index) => value + directionRef.current[index]
	// 	);

	// 	const newHead = [
	// 		directionalTL,
	// 		[directionalTL[0] + SNAKE_SIZE - 1, directionalTL[1] + SNAKE_SIZE - 1],
	// 	];

	// 	if (
	// 		newHead[0][0] <= 0 - SNAKE_SIZE ||
	// 		newHead[0][1] <= 0 - SNAKE_SIZE ||
	// 		newHead[0][0] >= rows ||
	// 		newHead[0][1] >= columns ||
	// 		newSnake.some(
	// 			([
	// 				[snakeTopLeftX, snakeTopLeftY],
	// 				[snakeBottomRightX, snakeBottomRightY],
	// 			]) => snakeTopLeftX === newHead[0][0] && snakeTopLeftY === newHead[0][1]
	// 		)
	// 	) {
	// 		console.log("DEAD!!");
	// 		handleGameOver();
	// 		return false;
	// 	}

	// 	const appleRows = [
	// 		Math.min(appleRef.current[0][0], appleRef.current[1][0]),
	// 		Math.max(appleRef.current[0][0], appleRef.current[1][0]),
	// 	];
	// 	const appleCols = [
	// 		Math.min(appleRef.current[1][1], appleRef.current[0][1]),
	// 		Math.max(appleRef.current[1][1], appleRef.current[0][1]),
	// 	];

	// 	const eyes = determineSnakeEyes(newHead, directionRef.current);

	// 	if (
	// 		(eyes[0][0] >= appleRows[0] &&
	// 			eyes[0][0] <= appleRows[1] &&
	// 			eyes[0][1] >= appleCols[0] &&
	// 			eyes[0][1] <= appleCols[1]) ||
	// 		(eyes[1][0] >= appleRows[0] &&
	// 			eyes[1][0] <= appleRows[1] &&
	// 			eyes[1][1] >= appleCols[0] &&
	// 			eyes[1][1] <= appleCols[1])
	// 	) {
	// 		setAppleCount((prev) => prev + 1);
	// 		newApple = createApple();
	// 		setApple(newApple);
	// 		appleRef.current = newApple;
	// 	} else {
	// 		newSnake.pop();
	// 	}
	// 	newSnake.unshift(newHead);

	// 	setSnake(newSnake);
	// 	snakeRef.current = newSnake;
	// 	setGrid(createSnakeGrid(newApple, newSnake));

	// 	return true;
	// });

	const runSimulation = useCallback(
		(single = false) => {
			if (!runningRef.current) return;
			setCursor((prev) => ({ ...prev, display: false }));
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
								if (cell.vital_status && cell.generations_lived > 0)
									updatedGeneration++;

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
					// stop running when grid becomes static to prevent unnecessary renders
					if (Object.keys(differences).length === 0) {
						changeRunning(false);
					}

					setEvolutions((prev) => prev++);
					return ng;
				});
				return true;
			};

			if (single) {
				simulate();
				runOnceRef.current = false;
				changeRunning(false);
			} else {
				const animate = continuouslyAnimate(simulate);
				animate();
			}
		},
		[continuouslyAnimate]
	);

	const resetClickOrder = () => {
		setClickOrder([]);
		if (clickTimer) {
			clearTimeout(clickTimer);
			setClickTimer(null);
		}
	};

	const checkClickOrder = (currentOrder, correctOrder) => {
		if (currentOrder.length !== correctOrder.length) return false;
		for (let i = 0; i < currentOrder.length; i++) {
			if (currentOrder[i] !== correctOrder[i]) return false;
		}
		return true;
	};

	const handleClickEE = (e, callback = () => null) => {
		e.preventDefault();

		if (isWelcoming) return;

		const updatedClickOrder = [...clickOrder, e.currentTarget.id];
		setClickOrder(updatedClickOrder);
		if (clickTimer) {
			clearTimeout(clickTimer);
			setClickTimer(null);
		}

		if (
			updatedClickOrder[updatedClickOrder.length - 1] !== "select" &&
			updatedClickOrder[updatedClickOrder.length - 1] !== "start"
		) {
			callback();
		} else {
			if (!clickTimer) {
				callback();
			}
		}

		setClickTimer(
			setTimeout(() => {
				if (checkClickOrder(updatedClickOrder, shRandomizeCells)) {
					playDistorted();

					setGrid(create2dArray(true));
					setCursor((prev) => ({ ...prev, display: false }));
					resetClickOrder();
				}

				if (checkClickOrder(updatedClickOrder, shKonami)) {
					playEE();
					setCursor((prev) => ({ ...prev, display: false }));
					setGame("snake");
					setGrid(createSnakeGrid(apple, snake));

					resetClickOrder();
				}
				if (checkClickOrder(updatedClickOrder, shCopyScreenState)) {
					copyScreenState();
					setMessage("Copied screen to clipboard");

					resetClickOrder();
				}

				if (checkClickOrder(updatedClickOrder, shNextGeneration)) {
					runOnceRef.current = true;
					changeRunning(true);
				}

				if (
					updatedClickOrder.length === 2 &&
					updatedClickOrder[0] === "select"
				) {
					let specificButton = updatedClickOrder[1];
					switch (specificButton) {
						case "b":
							setGrid(create2dArray(false, 0));
							resetClickOrder();
							break;
						case "a":
							setGrid(create2dArray(false, 1));
							resetClickOrder();
							break;
						case "up":
							cyclePattern(0, -1);
							resetClickOrder();
							break;
						case "down":
							cyclePattern(0, 1);
							resetClickOrder();
							break;
						case "left":
							cyclePattern(-1, 0);
							resetClickOrder();
							break;
						case "right":
							cyclePattern(1, 0);
							resetClickOrder();
							break;
						default:
							resetClickOrder();
							break;
					}
				}

				resetClickOrder();
				setClickTimer(null);
			}, 500)
		);
	};

	useEffect(() => {
		if (clickTimer) {
			return () => {
				clearTimeout(clickTimer);
			};
		}
	}, [clickTimer]);

	const cyclePattern = (t = 0, s = 0) => {
		// t => type
		// s => specific
		if (t) {
			const newValue = (patternTypeIdx + t + patterns.length) % patterns.length;

			setPatternTypeIdx(newValue);
			setSpecificPatternIdx(0);
			setCursor((prev) => ({
				...prev,
				cells: presets[patterns[newValue][specificPatternIdx]],
				display: true,
			}));
		}

		if (s) {
			const newValue =
				(specificPatternIdx + s + patterns[patternTypeIdx].length) %
				patterns[patternTypeIdx].length;

			setSpecificPatternIdx(newValue);

			setCursor((prev) => ({
				...prev,
				cells: presets[patterns[patternTypeIdx][newValue]],
				display: true,
			}));
		}
	};

	const moveAround = (r = 0, c = 0) => {
		if (game === "life") {
			setCursor((prev) => {
				return {
					...prev,
					row: (prev.row + r + rows) % rows,
					col: (prev.col + c + columns) % columns,
					cells: prev.cells ? prev.cells : [[1]],
				};
			});
		} else if (game === "snake") {
			console.log("--CHANGING DIRECTION--");
			changeDirection([r * SNAKE_SIZE, c * SNAKE_SIZE]);
		}
	};

	const calculateBackgroundColor = (cell, r, c) => {
		if (!powerStatus) return;

		return colorLookup[cell.color];
	};

	if (game === "life") {
		// Reset blinking for all cells
		for (let i = 0; i < grid?.length; i++) {
			for (let k = 0; k < grid[i]?.length; k++) {
				grid[i][k].blink(false);
			}
		}
		// Then, set the blinking state for the cursor cells
		for (let i = 0; i < cursor.cells?.length; i++) {
			for (let k = 0; k < cursor.cells[i]?.length; k++) {
				let row = (cursor.row + i + rows) % rows;
				let col = (cursor.col + k + columns) % columns;

				if (cursor.display) {
					if (cursor.cells[i][k]) grid[row][col].blink(true);
				}
			}
		}

		// on every rerender cancel and replay the blink animation
		if (typeof window !== "undefined") {
			document?.getAnimations()?.forEach((anim) => {
				if (anim.animationName === "blink") {
					anim.cancel();
					anim.play();
				}
			});
		}
	}

	const changeVolume = useCallback((value) => {
		setVolume(value);
		setMessage(`Volume: ${value}`);
	}, []);

	const handleDpad = (e) => {
		const directionLookup = {
			up: [-1, 0],
			down: [1, 0],
			right: [0, 1],
			left: [0, -1],
		};
		if (!directionLookup.hasOwnProperty(e.currentTarget.id) || !powerStatus)
			return;

		const [r, c] = directionLookup[e.currentTarget.id];
		handleClickEE(e, () => moveAround(r, c));
	};

	// retrieve row, col, value of every cell in cursor area
	// for each cell perform callback that manipulates new grid
	const handleCursorCells = (callback) => {
		if (Number.isInteger(cursor.row) && Number.isInteger(cursor.col)) {
			const ng = [...grid];
			const activeCells = [];
			for (let r = 0; r < cursor.cells.length; r++) {
				for (let c = 0; c < cursor.cells[r].length; c++) {
					activeCells.push([
						cursor.row + r,
						cursor.col + c,
						cursor.cells[r][c],
					]);
				}
			}

			activeCells.forEach(([r, c, v]) => {
				callback(ng, r, c, v);
			});
			return ng;
		}
	};

	const handleAction = (e) => {
		if (!powerStatus) return;
		handleClickEE(e);

		const ng = handleCursorCells((g, r, c, v) => {
			if (e.currentTarget.id === "b") {
				if (g[r][c].blinking) {
					g[r][c].dead();
				}
			} else if (e.currentTarget.id === "a") {
				if (g[r][c].blinking) {
					g[r][c].blinking = false;
					g[r][c].alive(2);
				}
			}
		});
		setGrid(ng);
	};
	const handleSelect = (e) => {
		if (!powerStatus) return;
		// playClick();
		handleClickEE(e, () => {
			if (game === "snake") return;
			setCursor((prev) => {
				return { ...prev, display: !prev.display };
			});
		});
	};
	const handleStart = (e) => {
		if (!powerStatus) return;

		handleClickEE(e, () => {
			playStart();

			if (game === "snake") {
				if (gameOver && !running) {
					return resetSnake(true);
				}
				if (gameOver && running) {
					return;
				}
			}

			changeRunning(!running);
		});
	};

	const handleCellClick = (e, r, c) => {
		console.log(r, c, grid[r][c]);
	};

	return (
		<div id="container">
			<button
				ref={powerButtonRef}
				className={`power-button`}
				onClick={phasePower}
			></button>
			<VolumeWheel changeVolume={changeVolume} />
			<div id="gameboy">
				<div id="head">
					<div className="gouge" />
					<div className="gouge" />
				</div>
				<div id="on-off">
					◁ OFF·ON ▷
					<div id="lines">
						<div className="line" />
						<div className="line" />
						<div className="line" />
					</div>
				</div>
				<div id="screen-container">
					<div id="screen-headline">
						<span className={Futura.className}>
							DOT MATRIX WITH STEREO SOUND
						</span>
					</div>
					<div
						className={`battery-light ${
							powerStatus ? "powered" : "discharged"
						}`}
					>
						<span className={Futura.className}>BATTERY</span>
					</div>
					<div
						id="screen"
						style={{
							width: `${width}px`,
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
												key={`${r}.${c}`}
												data-row={r}
												data-column={c}
												className={`cell ${grid[r][c].blinking ? "blink" : ""}`}
												// className={`cell ${
												// 	r === active.row && c === active.col ? "blink" : undefined
												// }`}
												onClick={(e) => handleCellClick(e, r, c)}
												style={{
													width: `${resolutionX}px`,
													height: `${resolutionX}px`,
													backgroundColor: calculateBackgroundColor(
														grid[r][c],
														r,
														c
													),
												}}
											/>
										);
									})
							  )
							: ""}
					</div>
				</div>
				<div id="logo">
					<span className={Pretendo.className}>Pretendo</span>
					<span className={Gill.className}>GAME BOY</span>
					<sub className={Gill.className}>TM</sub>
				</div>
				<Dpad
					handleDpad={handleDpad}
					createPointerEvent={createPointerEvent}
					running={running}
				/>
				<ActionButtons handleAction={handleAction} />
				<div id="options">
					<div>
						<div className="container">
							<button id="select" onClick={handleSelect}></button>
						</div>
						<div className={`label ${NES.className}`}>SELECT</div>
					</div>
					<div>
						<div className="container">
							<button id="start" onClick={handleStart}></button>
						</div>
						<div className={`label ${NES.className}`}>
							{running ? "STOP" : "START"}
						</div>
					</div>
				</div>
				<div id="speaker">
					<div>
						<div className="inner-shadow"></div>
					</div>
					<div>
						<div className="inner-shadow"></div>
					</div>
					<div>
						<div className="inner-shadow"></div>
					</div>
					<div>
						<div className="inner-shadow"></div>
					</div>
					<div>
						<div className="inner-shadow"></div>
					</div>
					<div>
						<div className="inner-shadow"></div>
					</div>
				</div>
				<div id="phones">
					<div className="vertical-stripe" />
					<div className="vertical-stripe" />
					<div className="vertical-stripe" />

					<span>🎧PHONES</span>
				</div>
			</div>
		</div>
	);
}
