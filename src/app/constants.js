export const rows = 144;
export const columns = 160;

// Animation durations (in ms)
export const DURATIONS = {
	PAK_MOVE: 250, // insert or pull pak
	PAK_LOAD: 100, // wait for pak to load
	WELCOME_PAUSE: 1250, // pause after welcome screen but before updating game
	WELCOME_LOAD_GAME: 200, // after welcome pause but before loading game screen
	BETWEEN_GAMES: 500, // between removing game pak and and inserting new one
	BLINKING: 1000, // blinking cells, ie. cursor
};
