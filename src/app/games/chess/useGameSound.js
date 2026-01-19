import { useRef, useEffect } from "react";
import useSound from "@/app/util/useSound";
import { GAME_PHASE } from "./state/states";
import { Color } from "./logic/models";
import { ALERT } from "./constants";

export function useGameSound({state, delayStockfishRef, prevSelectedOptionRef}) {
    const soundPlayingRef = useRef(false);
	const prevPhaseRef = useRef(state.phase);

    const [playWelcome] = useSound(
		"/audio/games/chess/welcome_to_chessmaster.m4a",
		{
			volume: 0.5,
			stereo: 1,
		}
	);
	const [playWhiteMove, { duration: moveWhiteDuration }] = useSound(
		"/audio/games/chess/move_white.m4a",
		{
			volume: 0.5,
			stereo: 1,
		}
	);
	const [playBlackMove, { duration: moveBlackDuration }] = useSound(
		"/audio/games/chess/move_black.m4a",
		{
			volume: 0.5,
			stereo: 1,
		}
	);
	const [playInvalid] = useSound("/audio/games/chess/invalid.m4a", {
		volume: 0.5,
		stereo: 1,
		interrupt: true,
	});
	const [playMenuStart] = useSound("/audio/games/chess/menu_start.m4a", {
		volume: 0.5,
		stereo: 1,
	});
	const [playMenuNavigate, { stop: stopMenuNavigate }] = useSound(
		"/audio/games/chess/menu_nav.m4a",
		{
			volume: 0.5,
			stereo: 1,
			interrupt: true,
		}
	);
	const [playCapture, { duration: captureDuration }] = useSound(
		"/audio/games/chess/capture.m4a",
		{
			volume: 0.5,
			stereo: 1,
		}
	);
	const [playCastle, { duration: castleDuration }] = useSound("/audio/games/chess/castle.m4a", {
		volume: 0.5,
		stereo: 1,
	});
	const [playDraw] = useSound("/audio/games/chess/draw.m4a", {
		volume: 0.5,
		stereo: 1,
	});
	const [playCheck] = useSound("/audio/games/chess/check.m4a", {
		volume: 0.5,
		stereo: 1,
	});
	const [playCheckmate] = useSound("/audio/games/chess/checkmate.m4a", {
		volume: 0.5,
		stereo: 1,
	});
	const [playStalemate] = useSound("/audio/games/chess/stalemate.m4a", {
		volume: 0.5,
		stereo: 1,
	});

    	// Consolidated sound effect using lastMove
	useEffect(() => {
		const justExitedAnimating =
			prevPhaseRef.current === GAME_PHASE.ANIMATING &&
			state.phase !== GAME_PHASE.ANIMATING;

		if (
			justExitedAnimating &&
			state.phase !== GAME_PHASE.REPLAY &&
			state.lastMove
		) {
			const { captured, special, resultsInCheck, resultsInCheckmate } =
				state.lastMove;

			// Block input while sounds play
			soundPlayingRef.current = true;

			let delay = 0;

			// 1. Move sound
			let moveSoundDuration = moveWhiteDuration;
			// Note: currentPlayer is AFTER the move, so we play opposite color
			if (state.currentPlayer === Color.White) {
				playBlackMove();
				moveSoundDuration = moveBlackDuration;
			} else if (state.currentPlayer === Color.Black) {
				playWhiteMove();
				moveSoundDuration = moveWhiteDuration;
			}

			// Store for animation synchronization
			// animationDurationRef.current = moveSoundDuration;
			delay += moveSoundDuration;

			// 2. Capture sound (if applicable)
			if (captured) {
				setTimeout(() => playCapture(), delay);
				delay += captureDuration;
			}

			// 3. Castle sound (if applicable)
			if (special === "castle") {
				setTimeout(() => playCastle(), delay);
				delay += castleDuration;
			}

			// 4. Check sound (if applicable and not checkmate)
			if (resultsInCheck && !resultsInCheckmate) {
				setTimeout(() => playCheck(), delay);
				// Don't add to delay since it's the last sound
			}
			// 5. Checkmate sound (if applicable)
			if (resultsInCheckmate) {
				setTimeout(() => playCheckmate(), delay);
				// Don't add to delay since it's the last sound
			}

			// Store total duration for Stockfish delay
			delayStockfishRef.current = delay;

			// Unlock input after all sounds finish
			setTimeout(() => {
				soundPlayingRef.current = false;
			}, delay);
		}

		prevPhaseRef.current = state.phase;
	}, [
		state.phase,
		state.lastMove,
		state.previousPhase,
		state.currentPlayer,
		playWhiteMove,
		playBlackMove,
		playCapture,
		playCastle,
		playCheck,
		moveWhiteDuration,
		moveBlackDuration,
		captureDuration,
		castleDuration,
	]);

    // Welcome
	useEffect(() => {
		if (state.phase === GAME_PHASE.WELCOMING) {
			playWelcome();
		}
	}, [state.phase, playWelcome]);

	// Menu
	useEffect(() => {
		if (
			state.phase === GAME_PHASE.MENU_ACTIONS ||
			state.phase === GAME_PHASE.MENU_SETTINGS
		) {
			playMenuStart();
		}
	}, [state.phase, playMenuStart]);

	// Navigate menu
	useEffect(() => {
		const isInMenu =
			state.phase === GAME_PHASE.MENU_ACTIONS ||
			state.phase === GAME_PHASE.MENU_SETTINGS;
		const optionChanged =
			state.selectedOption !== prevSelectedOptionRef.current;
		if (isInMenu && optionChanged) {
			playMenuNavigate();
		}
		prevSelectedOptionRef.current = state.selectedOption;
	}, [state.phase, state.selectedOption, playMenuNavigate, stopMenuNavigate]);

	// Checkmate/Stalemate
	useEffect(() => {
		if (
			(state.phase === GAME_PHASE.ALERT &&
				state.previousPhase === GAME_PHASE.GAME_OVER) && state.gameOverReason
		) {
			if (state.gameOverReason === "checkmate") {
				setTimeout(() => playCheckmate(), delayStockfishRef.current)
			} else if (state.gameOverReason === "stalemate") {
				setTimeout(() => playStalemate(), delayStockfishRef.current);
			}
		}
	}, [state.phase, state.gameOverReason, playCheckmate, playStalemate]);

	// Draw
	useEffect(() => {
		if (
			state.phase === GAME_PHASE.ALERT &&
			state.previousPhase === GAME_PHASE.GAME_OVER
		) {
			if (state.alert === ALERT.MESSAGE.DRAW_ACCEPTED) {
				playDraw();
			}
		}
	}, [state.phase, state.previousPhase, state.alert, playDraw]);

	// Invalid operation
	useEffect(() => {
		// illegal move
		if (state.phase === GAME_PHASE.ALERT) {
			if (state.alert === ALERT.MESSAGE.ILLEGAL_MOVE || state.alert === ALERT.MESSAGE.CAN_NOT_MOVE || state.alert === ALERT.MESSAGE.NO_MOVES_TO_UNDO || state.alert === ALERT.MESSAGE.NO_MOVES_TO_REPLAY) {
				playInvalid();
			}
		}
	}, [state.phase, state.alert, playInvalid]);

    return soundPlayingRef;
}