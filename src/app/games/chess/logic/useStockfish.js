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

export const useStockfish = (skillLevel) => {
	const engineRef = useRef(null);
	const [isReady, setIsReady] = useState(false);
	const pendingRequestRef = useRef(false);
	const lastMovesRef = useRef(null);
	const searchingRef = useRef(false);
	const onMoveCallbackRef = useRef(null);

	const hintingRef = useRef(false);
	const onHintCallbackRef = useRef(null);
	const bestMoveHintRef = useRef(null);
	const hintMoveRef = useRef(null);

	const drawEvaluationRef = useRef(null);

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

			if (message.startsWith("info") && hintingRef.current) {
				// Collect multipv reuslts
				if (message.includes("multipv 1")) {
					// Store best move from pv
					const pvMatch = message.match(/\bpv\s+(\S+)/);
					if (pvMatch) {
						bestMoveHintRef.current = pvMatch[1];
					}
				}
				if (message.includes("multipv 2")) {
					// Store hint move from pv
					const pvMatch = message.match(/\bpv\s+(\S+)/);
					if (pvMatch) {
						hintMoveRef.current = pvMatch[1];
					}
				}
			}

			if (message.startsWith("bestmove")) {
				const move = message.split(" ")[1];

				// Handle hint callback
				if (hintingRef.current && onHintCallbackRef.current) {
					onHintCallbackRef.current([
						bestMoveHintRef.current || move,
						hintMoveRef.current || move,
					]);
					onHintCallbackRef.current = null;
					hintingRef.current = false;
					// Reset MultiPV
					engineRef.current.postMessage(
						"setoption name MultiPV value 1"
					);
				}
				// Handle move callback
				else if (onMoveCallbackRef.current) {
					onMoveCallbackRef.current(move);
					onMoveCallbackRef.current = null;
				}

				pendingRequestRef.current = false;
				searchingRef.current = false;
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

	const changeDifficulty = useCallback(
		(newSkillLevel) => {
			if (!engineRef.current || !isReady) return;

			// Update configuration
			pendingConfigRef.current = calculateStats(newSkillLevel);
			configuredRef.current = false;

			stopSearch();
			applyConfig();

			// Engine is now at new difficulty, ready for next move
			// Move history and board state are preserved
		},
		[isReady, stopSearch, applyConfig]
	);

	useEffect(() => {
		changeDifficulty(skillLevel);
	}, [skillLevel, changeDifficulty]);

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
		(moves, onMove) => {
			if (!engineRef.current || !isReady) {
				console.warn("Stockfish not ready");
				return;
			}

			const moveStr = moves
				? Array.isArray(moves)
					? moves.join(" ")
					: moves
				: "";

			// Prevent duplicate requests for the same position
			if (pendingRequestRef.current && lastMovesRef.current === moveStr) {
				console.log("Ignoring duplicate request for same position");
				return;
			}
			pendingRequestRef.current = true;
			lastMovesRef.current = moveStr;

			// Stop any in-progress search
			stopSearch();
			searchingRef.current = true;
			onMoveCallbackRef.current = onMove;

			// Set position and search
			engineRef.current.postMessage(`position startpos moves ${moveStr}`);
			engineRef.current.postMessage(
				`go depth ${pendingConfigRef.current.depth}`
			);
		},
		[isReady, stopSearch]
	);

	const getHint = useCallback(
		(moves, callback) => {
			if (!engineRef.current || !isReady) {
				console.warn("Stockfish not ready");
				return;
			}

			const moveStr = moves
				? Array.isArray(moves)
					? moves.join(" ")
					: moves
				: "";

			bestMoveHintRef.current = null;
			hintMoveRef.current = null;

			hintingRef.current = true;
			onHintCallbackRef.current = callback;

			engineRef.current.postMessage("setoption name MultiPV value 2");
			engineRef.current.postMessage(`position startpos moves ${moveStr}`);
			engineRef.current.postMessage("go depth 2");
		},
		[isReady, stopSearch]
	);

	const forceMove = useCallback(() => {
		if (!engineRef.current || !searchingRef.current) {
			console.warn("No search in progress to force");
			return;
		}

		// Stop the search - Stockfish will immediately return bestmove
		engineRef.current.postMessage("stop");

		// searchingRef will be set to false when bestmove is received
	}, []);

	// Draw acceptance logic
	const decideDrawAcceptance = useCallback((score) => {
		// score is in centipawns from computer's perspective
		// Negative = computer is losing
		// Positive = computer is winning

		// Always accept if losing badly (more than 3 pawns down)
		if (score < -300) return true;

		// Never accept if winning significantly (more than 2 pawns up)
		if (score > 200) return false;

		// In between: probability based on position
		// Even position (±50cp): 50% chance
		// Slightly losing (-200cp): ~80% chance
		// Slightly winning (100cp): ~20% chance

		const acceptanceThreshold = 50 - score / 4; // Maps score to 0-100 range
		const random = Math.random() * 100;

		return random < acceptanceThreshold;
	}, []);

	const offerDraw = useCallback(
		(moves, onResponse) => {
			if (!engineRef.current || !isReady) {
				console.warn("Stockfish not ready");
				return;
			}

			// Analyze current position to decide if computer accepts

			const originalOnMessage = engineRef.current.onmessage;

			engineRef.current.onmessage = (event) => {
				const message = event.data;

				// Look for score evaluation
				if (message.startsWith("info") && message.includes("score")) {
					// Extract score (cp = centipawns, mate = mate in X)
					const cpMatch = message.match(/score cp (-?\d+)/);
					const mateMatch = message.match(/score mate (-?\d+)/);

					if (cpMatch) {
						drawEvaluationRef.current = parseInt(cpMatch[1]);
					} else if (mateMatch) {
						// If mate is found, score is extremely high/low
						const mateIn = parseInt(mateMatch[1]);
						drawEvaluationRef.current = mateIn > 0 ? 10000 : -10000;
					}
				}

				if (message.startsWith("bestmove")) {
					// Restore original handler
					engineRef.current.onmessage = originalOnMessage;

					const score = drawEvaluationRef.current || 0;

					const shouldAccept = decideDrawAcceptance(score);

					onResponse(shouldAccept, score);
				}
			};

			// Run evaluation
			engineRef.current.postMessage(`position startpos moves ${moves}`);
			engineRef.current.postMessage("go depth 8");
		},
		[isReady, decideDrawAcceptance]
	);

	return useMemo(
		() => ({
			isReady,
			getBestMove,
			newGame,
			stopSearch,
			getHint,
			changeDifficulty,
			forceMove,
			offerDraw,
		}),
		[
			isReady,
			getBestMove,
			newGame,
			stopSearch,
			getHint,
			changeDifficulty,
			forceMove,
			offerDraw,
		]
	);
};
