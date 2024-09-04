import React, { useCallback, useState, useRef, useEffect } from "react";
import Cell, { colorLookup } from "@/app/Cell";
import * as presets from "@/app/presets";
import { rows, columns } from "@/app/constants";
import { Pretendo, Lato, NES, Futura, Gill } from "@/app/fonts";
import VolumeWheel from "@/app/components/GameBoy/VolumeWheel";
import Screen from "@/app/components/GameBoy/Screen";
import ActionButtons from "@/app/components/GameBoy/ActionButtons";
import Dpad from "@/app/components/GameBoy/Dpad";
import {
	create2dArray,
	createPointerEvent,
	delay,
	continuouslyAnimate,
} from "@/app/util/helper";
import { useGameBoyStore } from "@/app/store/gameboy";
import { useShallow } from "zustand/react/shallow";
import { flushSync } from "react-dom";
import GamePak from "@/app/components/GamePak";
import { useDroppable } from "@dnd-kit/core";
import EmptyPak from "@/app/games/empty";
import useSound from "@/app/util/useSound";

export default function GameBoy({ dragging, pageRef }) {
	const {
		powerStatus,
		setPowerStatus,
		volume,
		setVolume,
		game,
		setGame,
		grid,
		setGrid,
		running,
		setRunning,
		gameState,
		setGameState,
		setMessage,
		pak,
		setPak,
		bricked,
		setBricked,
		setZoom,
		resetGameBoy,
	} = useGameBoyStore(
		useShallow((state) => ({
			powerStatus: state.powerStatus,
			setPowerStatus: state.setPowerStatus,
			volume: state.volume,
			setVolume: state.setVolume,
			game: state.game,
			setGame: state.setGame,
			grid: state.grid,
			setGrid: state.setGrid,
			running: state.running,
			setRunning: state.setRunning,
			gameState: state.gameState,
			setGameState: state.setGameState,
			setMessage: state.setMessage,
			pak: state.pak,
			setPak: state.setPak,
			bricked: state.bricked,
			setBricked: state.setBricked,
			setZoom: state.setZoom,
			resetGameBoy: state.reset,
		}))
	);

	// const [powerStatus, setPowerStatus] = useState(0);
	const [clickOrder, setClickOrder] = useState([]);
	const [clickTimer, setClickTimer] = useState(null);
	const [showCredits, setShowCredits] = useState(false);

	const [playStartup] = useSound("/audio/startup.wav", {
		volume: 0.5,
	});

	const [playPowerSwitch] = useSound("/audio/power-button.m4a", {
		volume: 1,
		ignoreConsoleVolume: true,
		// interrupt: true,
	});

	const [playPakPull] = useSound("/audio/pak_pull.m4a", {
		volume: 1,
		ignoreConsoleVolume: true,
	});

	const powerButtonRef = useRef(null);
	const runningRef = useRef(running);
	const clickTimerRef = useRef(clickTimer);
	const powerStatusRef = useRef(powerStatus);
	const stopAnimationRef = useRef();
	const initializingRef = useRef();
	const gameStateRef = useRef(gameState);
	gameStateRef.current = gameState;

	const { setNodeRef, isOver } = useDroppable({
		id: "pak-slot",
	});

	// const test = usePak(game, pak, powerStatusRef, runningRef, stopAnimationRef);

	clickTimerRef.current = !!clickTimer;

	// directionRef.current = direction;
	// appleRef.current = apple;
	// gameOverRef.current = gameOver

	const changePowerStatus = (value) => {
		const v = value;
		playPowerSwitch();
		// await delay(174);
		setPowerStatus(v);
		powerStatusRef.current = v;
	};

	const changeRunning = useCallback(
		(value) => {
			if (value !== undefined) {
				setRunning(value);
				runningRef.current = value;
			} else {
				let v;
				setRunning((prev) => {
					v = !prev;
					return v;
				});
				runningRef.current = v;
				return;
			}
		},
		[setRunning]
	);

	const loadGamePak = async (g) => {
		try {
			const gameModule = await import(`@/app/games/${g}`);
			const hello = await gameModule;
			return hello;
		} catch (err) {
			console.log("could not load game:", g);
			return null;
		}
	};

	const removeGamePak = async (e) => {
		return new Promise(async (resolve, reject) => {
			const pak = e?.currenTarget ?? document.querySelector("#pak-game");
			if (pak) {
				pak.classList.toggle("insert");
				pak.classList.toggle("pull");
				playPakPull();
				await delay(250);
				setGame("");
				changeRunning(false);
				if (stopAnimationRef.current) {
					stopAnimationRef.current();
				}
				resolve();
			}
			reject();
		});
	};

	const fallDownToCenter = (subArr) => {
		return new Promise((resolve, reject) => {
			let iteration = 0;
			runningRef.current = true;
			// Determine how many iterations to run by finding the center of grid/screen and offsetting by center of subArr
			const totalIterations =
				Math.floor(rows / 2) + Math.floor(subArr.length / 2);

			const operation = () => {
				let tempGrid = Array(rows)
					.fill()
					.map(() => Array(columns).fill(0));

				// Determine how many rows to process in this iteration
				// It's either the current iteration number or the total rows in subArr, whichever is smaller
				const limit = Math.min(iteration, subArr.length);
				const adjustedTotalRows = subArr.length - 1;
				// process each row up to the calculated limit
				for (let i = 0; i < limit; i++) {
					// Calculate the target row in tempGrid where we'll repalce the new data
					// As iteration increases, this moves downward in tempGrid
					const targetRow = i + Math.max(0, iteration - adjustedTotalRows);

					// Calculate which row from subArr to copy
					// In early iterations, this starts from the bottom of subArr
					// As iteration increases, this moves upward in subArr
					const sourceRow = Math.max(i, adjustedTotalRows - iteration + i);

					// Copy the calculated row from subArr to the appropriate row in tempGrid
					tempGrid[targetRow] = [...subArr[sourceRow]];
				}

				// loop through every cell in tempGrid and create a new Cell object
				tempGrid.forEach((row, rowIndex) => {
					row.forEach((cell, cellIndex) => {
						tempGrid[rowIndex][cellIndex] = new Cell({
							vital_value: cell,
							color: cell ? 2 : 0,
						});
					});
				});

				setGrid(tempGrid);

				if (++iteration <= totalIterations) {
					return true;
				} else {
					resolve();
					return false;
				}
			};

			const { animate, stop } = continuouslyAnimate(runningRef, operation);

			stopAnimationRef.current = stop;

			animate();
		});
	};

	async function powerOn() {
		changePowerStatus(1);

		// Not setting "running" state as this will result in "START" to display "STOP"
		// we still want to prevent other actions from running while console is turning on
		initializingRef.current = true;
		// runningRef.current = true;

		// if fallDownToCenter is finished before game pak is initialized, wait for it to finish, then reset grid and load game

		let loaded = false;

		loadGamePak(game).then((gamepak) => {
			loaded = true;
			setPak(gamepak);
		});

		if (!game) {
			return await fallDownToCenter(presets.createPretendo(true));
		}
		await fallDownToCenter(presets.createPretendo());

		// wait for game pak to load
		if (!loaded) {
			while (!loaded) {
				console.log("waiting for game pak to load");
				await delay(100);
			}
		}

		playStartup();

		await delay(1250);

		changeRunning(false);

		setGrid(create2dArray());

		await delay(200);

		initializingRef.current = false;
		gameStateRef.current.loadGame();
	}

	function powerOff() {
		if (stopAnimationRef.current) {
			stopAnimationRef.current();
		}
		gameState.resetGame();
		resetGameBoy();
		changePowerStatus(0);

		stopAnimationRef.current = undefined;
	}

	async function phasePower(e) {
		const button = e.currentTarget ?? document.querySelector("#power-button");
		button.classList.toggle("on");
		if (powerStatus) {
			powerOff();
		} else {
			powerOn();
		}
	}

	async function restartGameBoy(newGame) {
		changeRunning(false);
		powerOff();
		setGame(newGame);
		await delay(500);
		powerOn();
	}

	async function changeGameWhilePowered(newGame) {
		await removeGamePak();
		setGrid(create2dArray());
		await delay(500);
		setGame(newGame);
		loadGamePak(newGame).then(async (gamepak) => {
			setPak(gamepak);

			// wait for game pak to initialize
			// do so by checking gameState.name every 100ms
			if (!gameStateRef.current.name) {
				while (!gameStateRef.current.name) {
					console.log("waiting for game pak to initialize");
					await delay(100);
				}
			}
			gameStateRef.current.loadGame();
		});
	}

	useEffect(
		() => {
			// Calculate required zoom level to fit console in viewport
			// Uses the minimum zoom factor from width and height
			let elementHeight = document.querySelector("#container").offsetHeight;
			let elementWidth = document.querySelector("#container").offsetWidth;
			// let elementHeight = document.body.offsetHeight;
			let vpHeight = window.innerHeight;
			let vpWidth = window.innerWidth;
			let zoomLevelH = (vpHeight / elementHeight) * 95;
			let originalLevelH = (vpHeight / elementHeight) * 100;
			let zoomLevelW = (vpWidth / elementWidth) * 95;
			let originalLevelW = (vpWidth / elementWidth) * 100;

			const zoomLevel = Math.min(zoomLevelH, zoomLevelW);
			setZoom([
				zoomLevel,
				zoomLevel === zoomLevelH ? originalLevelH : originalLevelW,
			]);

			// using transform: scale instead of zoom because of issues with dnd-kit
			pageRef.current.style.transform = `scale(${zoomLevel / 100})`;
			pageRef.current.style.transformOrigin = "top left";

			const handleKeyDown = (e) => {
				e.preventDefault();
				if (e.repeat) return;
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

			// Subscribe to changes in the 'game' state
			const unsubscribe = useGameBoyStore.subscribe(
				(state) => state.game,
				async (game, previousGame) => {
					// const lbricked = useGameBoyStore.getState().bricked;

					// Brick the console when switching game to game
					// This currently isn't possible due to how drag and drop works
					if (previousGame && game && previousGame !== game) {
						// this is where you would normally brick the console
						// functionality is disabled for now as drag and drop prevents changing game to game
						// changeRunning(false);
						// setBricked(true);
						// setGameState(EmptyPak);

						// instead, we'll change the game by removing the pak, inserting the new one, and loading the new game state
						changeGameWhilePowered(game);
					}
					// Empty the pak when there is no game
					else if (!game) {
						setGameState(EmptyPak);
					}
					// Load the game pak when switching to a new game and console isn't bricked
				}
				// { fireImmediately: true }
			);

			return () => {
				document.removeEventListener("keydown", handleKeyDown);
				document.removeEventListener("keyup", handleKeyUp);

				// Cleanup subscription on component unmount
				unsubscribe();
			};
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	const resetClickOrder = useCallback(() => {
		setClickOrder([]);
		if (clickTimer) {
			clearTimeout(clickTimer);
			setClickTimer(null);
		}
	}, [clickTimer]);

	const checkClickOrder = useCallback((currentOrder, correctOrder) => {
		if (currentOrder.length !== correctOrder.length) return false;
		for (let i = 0; i < currentOrder.length; i++) {
			if (currentOrder[i] !== correctOrder[i]) return false;
		}
		return true;
	}, []);

	const handleClickEE = useCallback(
		(e, callback = () => null) => {
			// e.preventDefault();

			const id = e.currentTarget?.id || e.target?.id;
			const updatedClickOrder = [...clickOrder, id];
			setClickOrder(updatedClickOrder);
			if (clickTimer) {
				clearTimeout(clickTimer);
				setClickTimer(null);
			}

			if (
				updatedClickOrder.length === 2 &&
				updatedClickOrder[0] === "select" &&
				updatedClickOrder[1] === "start"
			) {
			} else {
				callback();
			}

			// if (
			// 	updatedClickOrder.length > 1 &&
			// 	updatedClickOrder[updatedClickOrder.length - 1] !== "start"
			// ) {
			// 	callback();
			// }

			// const recentId = updatedClickOrder[updatedClickOrder.length - 1];
			// if (recentId !== "select" && recentId !== "start") {
			// 	callback();
			// } else {
			// 	if (!clickTimer) {
			// 		callback();
			// 	}
			// }

			setClickTimer(
				setTimeout(() => {
					// Handle game ee/shortcuts
					const shortcuts = gameStateRef.current.handleGameEEShortcuts;
					if (shortcuts.length > 0) {
						shortcuts.forEach(([sequence, callback]) => {
							if (checkClickOrder(updatedClickOrder, sequence)) {
								callback(resetClickOrder, e);
							}
						});
					}

					// if (checkClickOrder(updatedClickOrder, shCopyScreenState)) {
					// 	copyScreenState();
					// 	setMessage("Copied screen to clipboard");

					// 	resetClickOrder();
					// }

					resetClickOrder();
					setClickTimer(null);
				}, 500)
			);
		},
		[clickOrder, clickTimer, resetClickOrder, checkClickOrder]
	);

	useEffect(() => {
		return () => {
			if (clickTimer) clearTimeout(clickTimer);
		};
	}, [clickTimer]);

	const changeVolume = useCallback(
		(value) => {
			setVolume(Number(value));
			setMessage(`Volume: ${value}`);
		},
		[setVolume, setMessage]
	);

	const handleDpad = useCallback(
		(e) => {
			const id = e.currentTarget?.id ?? e.target?.id;
			if (!id) return;
			const directionLookup = {
				up: [-1, 0],
				down: [1, 0],
				right: [0, 1],
				left: [0, -1],
			};
			if (
				!directionLookup.hasOwnProperty(id) ||
				!powerStatus ||
				!game ||
				bricked ||
				initializingRef.current
			) {
				return;
			}

			const [r, c] = directionLookup[id];
			handleClickEE(e, () => gameStateRef.current.handleGameDpad(r, c));
		},
		[powerStatus, game, bricked, handleClickEE]
	);

	// const handleDpad = (e) => {
	// 	const id = e.currentTarget?.id ?? e.target?.id;
	// 	if (!id) return;
	// 	const directionLookup = {
	// 		up: [-1, 0],
	// 		down: [1, 0],
	// 		right: [0, 1],
	// 		left: [0, -1],
	// 	};
	// 	if (
	// 		!directionLookup.hasOwnProperty(id) ||
	// 		!powerStatus ||
	// 		!game ||
	// 		bricked ||
	// 		initializingRef.current
	// 	) {
	// 		return;
	// 	}

	// 	const [r, c] = directionLookup[id];
	// 	handleClickEE(e, () => gameStateRef.current.handleGameDpad(r, c));
	// };

	const handleAction = (e) => {
		if (!powerStatus || !game || bricked || initializingRef.current) return;
		handleClickEE(e, () => {
			gameStateRef.current.handleGameAction(e);
		});
	};
	const handleSelect = (e) => {
		if (!powerStatus || !game || bricked || initializingRef.current) return;
		// playClick();
		handleClickEE(e, () => {
			gameStateRef.current.handleGameSelect(e);
		});
	};
	const handleStart = (e) => {
		if (!powerStatus || !game || bricked || initializingRef.current) return;

		handleClickEE(e, () => {
			// playStart();

			gameStateRef.current.handleGameStart();

			// changeRunning(!running);
			// gameState.runGame(runOnceRef.current);
		});
	};

	return (
		<div id="container">
			<div id="droppable">
				{dragging && (
					<div
						ref={setNodeRef}
						id="pak-drop"
						style={{
							boxShadow: isOver
								? "inset 0 0 0 5px #201d4b"
								: dragging
								? "inset 0 0 0 2.5px #e5e9ed"
								: "inset 0 0 0 5px transparent",
						}}
					>
						Insert Game Pak
					</div>
				)}
			</div>
			<div id="pak-slot">
				{game && (
					<div id="pak-game" className="insert" onClick={removeGamePak}>
						<GamePak
							name={game}
							imageUrl={`/games/${game}.png`}
							disableDraggable={true}
						/>
					</div>
				)}
				{pak && (
					<pak.default
						changeRunning={changeRunning}
						powerStatusRef={powerStatusRef}
						runningRef={runningRef}
						stopAnimationRef={stopAnimationRef}
					/>
				)}
			</div>
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
					<Screen
						grid={grid}
						powerStatus={powerStatus}
						handleCellClick={gameState.handleGameCellClick}
					/>
				</div>
				<div id="logo">
					<span className={Pretendo.className}>Pretendo</span>
					<span className={Gill.className}>GAME BOY</span>
					<sub className={Gill.className}>TM</sub>
				</div>
				<Dpad
					handleDpad={handleDpad}
					powerStatus={powerStatus}
					running={running}
				/>
				<ActionButtons handleAction={handleAction} />
				<div id="options">
					<div className="container">
						<button id="select" onClick={handleSelect}></button>
						<div className={`label ${NES.className}`}>SELECT</div>
					</div>

					<div className="container">
						<button id="start" onClick={handleStart}></button>
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
