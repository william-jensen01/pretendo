import { create } from "zustand";

export const useInputStore = create((set, get) => ({
	// Mapping of button ids to group
	lookup: {
		up: "dpad",
		down: "dpad",
		left: "dpad",
		right: "dpad",
		a: "action",
		b: "action",
		select: "option",
		start: "option",
	},

	// Current buttons being pressed
	pressedButtons: new Set(),

	// Previous frame's pressed buttons
	previousPressedButtons: new Set(),

	// Click sequence for easter eggs
	clickSequence: [],

	// Click timer ID
	clickTimer: null,

	// Add a button to pressed state
	addPressedButton: (id) => {
		set((state) => {
			const newPressed = new Set(state.pressedButtons);
			newPressed.add(id);
			return { pressedButtons: newPressed };
		});
	},

	// Remove a button from pressed state
	removePressedButton: (id) => {
		set((state) => {
			const newPressed = new Set(state.pressedButtons);
			newPressed.delete(id);
			return { pressedButtons: newPressed };
		});
	},

	// Check if a button is newly pressed (wasn't pressed last frame)
	// When using alongside addPressedButton, make sure this is called after
	isNewPress: (id) => {
		const { pressedButtons, previousPressedButtons } = get();
		return !previousPressedButtons.has(id) && pressedButtons.has(id);
	},

	// Check if any of these buttons are newly pressed
	areNewPresses: (ids) => {
		return ids.every((id) => get().isNewPress(id));
	},

	// Get all newly pressed buttons from this frame
	getNewPresses: () => {
		const { pressedButtons, previousPressedButtons } = get();
		return Array.from(pressedButtons).filter(
			(id) => !previousPressedButtons.has(id)
		);
	},

	// Update previous pressed state (call after logic runs)
	updatePreviousFrame: () => {
		set((state) => ({
			previousPressedButtons: new Set(state.pressedButtons),
		}));
	},

	// Add button to click sequence
	addToSequence: (id) => {
		console.log("addToSequence", id);
		set((state) => {
			const newSequence = [...state.clickSequence, id];

			// Clear existing timer
			if (state.clickTimer) {
				clearTimeout(state.clickTimer);
			}

			// Set new timer
			const timer = setTimeout(() => {
				get().processSequence();
			}, 500);

			return { clickSequence: newSequence, clickTimer: timer };
		});
	},

	// Process the sequence and check for matches
	processSequence: () => {
		const { clickSequence } = get();

		// Your easter egg shortcuts would be in gameState
		// We just store the sequence and let the game handle it
		console.log("Click sequence completed:", clickSequence);

		get().resetSequence();
	},

	// Reset sequence
	resetSequence: () => {
		set({
			clickSequence: [],
			clickTimer: null,
		});
	},

	// Get current pressed buttons as array
	getPressedArray: (filter) => {
		const { lookup, pressedButtons } = get();
		// return Array.from(pressedButtons).filter((id) => lookup[id] === filter);
		return Array.from(pressedButtons);
	},
}));
