import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { create2dArray } from "@/app/util/helper";
import EmptyPak from "@/app/games/empty";

// Allows for same usage as React's setState where you can pass a function  (with access to the previous state) or a value to set the new state
const createStateUpdater = (key) => (set) => (updater) =>
	set((state) => {
		const currentValue = state[key];
		const newValue =
			typeof updater === "function" ? updater(currentValue) : updater;

		return { [key]: newValue };
	});

const initialState = {
	powerStatus: 0,
	grid: create2dArray(),
	cursor: null,
	running: false,
	pak: null,
	// bricked: false,
	gameState: EmptyPak,
};
export const useGameBoyStore = create(
	devtools(
		subscribeWithSelector((set, get) => ({
			...initialState,
			setPowerStatus: createStateUpdater("powerStatus")(set),
			game: "",
			setGame: createStateUpdater("game")(set),
			setGrid: createStateUpdater("grid")(set),
			setCursor: createStateUpdater("cursor")(set),
			setRunning: createStateUpdater("running")(set),
			volume: 0.5,
			setVolume: createStateUpdater("volume")(set),
			message: "",
			setMessage: createStateUpdater("message")(set),
			setGameState: (newGameState) => {
				set((state) => ({
					pak: newGameState.name ? state.pak : null,
					gameState: newGameState,
				}));
			},

			setPak: createStateUpdater("pak")(set),
			setBricked: createStateUpdater("bricked")(set),
			// zoom: 100,
			zoom: [100, 0], // [0] is zoom factor, [1] is missing amount from zoom

			eeUnlocked: false,
			setZoom: createStateUpdater("zoom")(set),

			// eeUnlocked: localStorage?.getItem("eeUnlocked") ?? false,
			unlockEasterEgg: () => {
				// localStorage.setItem("eeUnlocked", true);
				set({ eeUnlocked: true });
			},

			reset: () =>
				set((state) => ({
					...initialState,
					game: state.game,
					volume: state.volume,
					message: state.message,
					zoom: state.zoom,
				})),
		}))
	)
);
