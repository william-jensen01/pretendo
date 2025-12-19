import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { SKILL_LEVEL } from "../constants";
import { useGameBoyStore } from "@/app/store/gameboy";

const calculateStats = (skillLevel) => {
	return {
		skill: skillLevel,
		depth: Math.min(10, Math.max(1, Math.ceil(skillLevel / 4))),
		elo: Math.round(1350 + (skillLevel / 20) * 1500), // Elo ranges roughly 1350-2850 based on skill level
	};
};

export const useStockfish = () => {
	const engineRef = useRef(null);
	const [isReady, setIsReady] = useState(false);
	const pendingRequestRef = useRef(false);
	const lastFENRef = useRef(null);
	const searchingRef = useRef(false);
	const onMoveCallbackRef = useRef(null);

	// Pending configuration
	const pendingConfigRef = useRef(calculateStats(SKILL_LEVEL));
	const configuredRef = useRef(false);

	const initializing = useGameBoyStore((state) => state.initializing);

	const applyConfig = useCallback(() => {
		if (!engineRef.current) return;

		console.log("Applying pending configuration", pendingConfigRef.current);
		const { skill, depth, elo } = pendingConfigRef.current;

		engineRef.current.postMessage("ucinewgame");
		engineRef.current.postMessage(
			`setoption name Skill Level value ${skill}`
		);
		engineRef.current.postMessage(
			"setoption name UCI_LimitStrength value true"
		);
		engineRef.current.postMessage(`setoption name UCI_ELO value ${elo}`);

		configuredRef.current = true;
	}, []);

	useEffect(() => {
		if (typeof window === "undefined" || initializing) return;
		console.log("Initializing Stockfish");

		const stockfishWorker = new Worker(
			"/stockfish/stockfish-17.1-lite-single-03e3232.js"
		);

		engineRef.current = stockfishWorker;

		stockfishWorker.onerror = (error) => {
			console.error("Stockfish worker error:", error);
			setIsReady(false);
		};

		stockfishWorker.onmessage = (event) => {
			const message = event.data;
			console.log("Stockfish:", message);

			if (message === "uciok") {
				stockfishWorker.postMessage("isready");
			}

			if (message === "readyok") {
				setIsReady(true);
				// Apply any pending configuration
				if (!configuredRef.current) {
					applyConfig();
				}
			}

			if (message.startsWith("bestmove")) {
				const move = message.split(" ")[1];

				// Execute callback with the move
				if (onMoveCallbackRef.current) {
					onMoveCallbackRef.current(move);
					onMoveCallbackRef.current = null;
				}
				pendingRequestRef.current = false;
			}
		};

		stockfishWorker.postMessage("uci");

		return () => {
			console.log("Cleaning up Stockfish");
			if (engineRef.current) {
				engineRef.current.postMessage("quit");
				engineRef.current.terminate();
			}
		};
	}, [initializing]);

	const stopSearch = useCallback(() => {
		if (engineRef.current && searchingRef.current) {
			engineRef.current.postMessage("stop");
			searchingRef.current = false;
		}
	}, []);

	const newGame = useCallback(
		(skillLevel = SKILL_LEVEL) => {
			pendingConfigRef.current = calculateStats(skillLevel);
			configuredRef.current = false;

			// Apply immediately if ready, otherwise will apply on readyok
			if (engineRef.current && isReady) {
				stopSearch();
				applyConfig();
			}
		},
		[isReady, stopSearch, applyConfig]
	);

	// Memoize getBestMove to prevent recreating on every render
	const getBestMove = useCallback(
		(fen, onMove) => {
			if (!engineRef.current || !isReady) {
				console.warn("Stockfish not ready");
				return;
			}

			// Prevent duplicate requests for the same position
			if (pendingRequestRef.current && lastFENRef.current === fen) {
				console.log("Ignoring duplicate request for same position");
				return;
			}
			pendingRequestRef.current = true;
			lastFENRef.current = fen;

			// Validate FEN format (basic check)
			const fenParts = fen.split(" ");
			if (fenParts.length !== 6) {
				console.error("Invalid FEN format:", fen);
				return;
			}

			// Stop any in-progress search
			stopSearch();
			searchingRef.current = true;
			onMoveCallbackRef.current = onMove;

			// Set position and search
			engineRef.current.postMessage(`position fen ${fen}`);
			engineRef.current.postMessage(
				`go depth ${pendingConfigRef.current.depth}`
			);
		},
		[isReady, stopSearch]
	);

	return useMemo(
		() => ({
			isReady,
			getBestMove,
			newGame,
			stopSearch,
		}),
		[isReady, getBestMove, newGame, stopSearch]
	);
};
