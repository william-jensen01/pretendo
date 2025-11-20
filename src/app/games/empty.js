const EmptyPak = {
	name: "",
	loadGame: () => {},
	resetGame: () => {},
	runGame: () => {
		// setRunning((prev) => !prev);
	},
	handleGameCursor: () => {},
	isCursorAnimated: false,
	handleGameDpad: () => {},
	handleGameAction: () => {},
	handleGameSelect: () => {},
	handleGameStart: () => {},
	handleGameCellClick: (e, g, r, c) => {
		console.log(g[r][c], "\nrow", r, ":", g[r]);
	},
	handleGameEEDpad: () => {},
	handleGameEEAction: () => {},
	credits: [],
};

export default EmptyPak;
