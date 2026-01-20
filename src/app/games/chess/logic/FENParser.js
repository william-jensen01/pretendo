import { Color } from "./models";
import { Pawn, Rook, Knight, Bishop, Queen, King } from "./pieces";
import { parseStockfishMove } from "./FENConverter";
import { applyMoveToBoard, determineSpecialMove, isInCheck } from "./index";

/**
 * Map FEN characters to piece classes
 */
const FEN_PIECE_MAP = {
	P: (color) => new Pawn(color),
	N: (color) => new Knight(color),
	B: (color) => new Bishop(color),
	R: (color) => new Rook(color),
	Q: (color) => new Queen(color),
	K: (color) => new King(color),
	p: (color) => new Pawn(color),
	n: (color) => new Knight(color),
	b: (color) => new Bishop(color),
	r: (color) => new Rook(color),
	q: (color) => new Queen(color),
	k: (color) => new King(color),
};

/**
 * Create a piece instance from a FEN character
 */
export const pieceFromFENChar = (fenChar) => {
	if (!fenChar || !/[pnbrqkPNBRQK]/.test(fenChar)) return null;

	const color = fenChar === fenChar.toUpperCase() ? Color.White : Color.Black;
	const factory = FEN_PIECE_MAP[fenChar];

	return factory ? factory(color) : null;
};

/**
 * Parse FEN string to create a chess board
 * @param {string} fen - FEN string (can be full or just position + active color)
 * @returns {Object} { board, currentPlayer }
 */
export const parseFEN = (fen) => {
	if (!fen) throw new Error("FEN string is required");

	const parts = fen.split(" ");
	console.log("FEN parts:", parts);
	const piecePlacement = parts[0];
	const activeColor = parts[1] || "w";

	// Create empty 8x8 board
	const board = Array(8)
		.fill(null)
		.map(() => Array(8).fill(null));

	// Parse piece placement
	const ranks = piecePlacement.split("/");
	if (ranks.length !== 8) {
		throw new Error("Invalid FEN: must have 8 ranks");
	}

	for (let rank = 0; rank < 8; rank++) {
		const rankStr = ranks[rank];
		let file = 0;

		for (let i = 0; i < rankStr.length; i++) {
			const char = rankStr[i];

			// Check if it's a number (empty squares)
			if (/[1-8]/.test(char)) {
				file += parseInt(char);
			} else {
				// It's a piece
				const piece = pieceFromFENChar(char);
				if (!piece) {
					throw new Error(`Invalid FEN piece character: ${char}`);
				}
				board[rank][file] = piece;
				file++;
			}
		}

		if (file !== 8) {
			throw new Error(`Invalid FEN: rank ${rank} has ${file} files instead of 8`);
		}
	}

	// Determine current player
	const currentPlayer = activeColor === "w" ? Color.White : Color.Black;

	return { board, currentPlayer };
};

/**
 * Replay moves from a FEN starting position to reconstruct full game state
 * @param {string} fen - Starting position FEN
 * @param {Array<string>} uciMoves - Array of UCI move strings (e.g., ["e2e4", "e7e5"])
 * @returns {Object} { board, moveHistory, capturedPieces, currentPlayer }
 */
export const replayMovesFromFEN = (fen, uciMoves) => {
	// Parse starting position
	let { board, currentPlayer } = parseFEN(fen);
	const moveHistory = [];
	const capturedPieces = [];

	// Replay each move
	for (const uciMove of uciMoves) {
		// Parse UCI notation
		const parsed = parseStockfishMove(uciMove);
		if (!parsed) {
			throw new Error(`Invalid UCI move: ${uciMove}`);
		}

		const { from, to } = parsed;

		// Get piece and captured piece
		const piece = board[from.row][from.col];
		if (!piece) {
			throw new Error(
				`No piece at ${from.file}${from.rank} for move ${uciMove}`
			);
		}

		const capturedPiece = board[to.row][to.col];

		// Store original hasMoved state
		const originalHasMoved =
			piece.hasMoved !== undefined ? piece.hasMoved : null;

		// Determine special move type
		const special = determineSpecialMove(piece, from, to, capturedPiece);

		// Store original rook hasMoved for castling
		let originalRookHasMoved = null;
		if (special === "castle") {
			const direction = to.col > from.col ? 1 : -1;
			const rookCol = direction === 1 ? 7 : 0;
			const rook = board[from.row][rookCol];
			originalRookHasMoved =
				rook?.hasMoved !== undefined ? rook.hasMoved : null;
		}

		piece.hasMoved = originalHasMoved;

		// Apply the move to the board (mutates board)
		applyMoveToBoard(board, {
			from,
			to,
			piece,
			special,
			notation: uciMove,
		});

		// Handle en passant capture
		let actualCapturedPiece = capturedPiece;
		if (special === "enPassant") {
			actualCapturedPiece = board[from.row][to.col];
			// The captured pawn was already removed by applyMoveToBoard
		}

		// Track captured piece
		if (actualCapturedPiece) {
			capturedPieces.push(actualCapturedPiece);
		}

		// Switch player
		const nextPlayer =
			currentPlayer === Color.White ? Color.Black : Color.White;

		// Build move entry
		const moveEntry = {
			from,
			to,
			piece,
			captured: actualCapturedPiece,
			notation: uciMove,
			display: parsed.display,
			special,
			originalHasMoved,
			originalRookHasMoved,
			resultsInCheck: isInCheck(nextPlayer, board),
			resultsInCheckmate: false, // Set during live game, not needed for replay
		};

		moveHistory.push(moveEntry);
		currentPlayer = nextPlayer;
	}

	return { board, moveHistory, capturedPieces, currentPlayer };
};
