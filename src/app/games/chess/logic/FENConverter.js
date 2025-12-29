import { HORIZONTAL_AXIS, NUM_FILES, NUM_RANKS } from "../constants";
import { Color } from "./models";

export const boardToFEN = (board, currentPlayer, lastMove) => {
	let fen = "";

	// 1. Piece placement
	for (let rank = 0; rank < 8; rank++) {
		let emptySquares = 0;
		for (let file = 0; file < 8; file++) {
			const piece = board[rank][file];
			if (!piece) {
				emptySquares++;
			} else {
				if (emptySquares > 0) {
					fen += emptySquares;
					emptySquares = 0;
				}
				fen += piece.FENChar;
			}
		}
		if (emptySquares > 0) fen += emptySquares;
		if (rank < 7) fen += "/";
	}

	// 2. Active color
	fen += currentPlayer === Color.White ? " w" : " b";

	// 3. Castling availability
	const castlingRights = getCastlingRights(board);
	fen += " " + (castlingRights || "-");

	// 4. En passant target square
	const enPassantSquare = getEnPassantSquare(lastMove);
	fen += " " + (enPassantSquare || "-");

	// 5. Halfmove clock and fullmove number (simplified)
	fen += " 0 1";

	return fen;
};

export const getEnPassantSquare = (lastMove) => {
	if (!lastMove || lastMove.piece.FENChar.toLowerCase() !== "p") return null;

	const movedTwoSquares = Math.abs(lastMove.to.row - lastMove.from.row) === 2;
	if (movedTwoSquares) {
		const enPassantRow = (lastMove.from.row + lastMove.to.row) / 2;
		const file = HORIZONTAL_AXIS[lastMove.to.col];
		const rank = NUM_RANKS - enPassantRow;
		return `${file}${rank}`;
	}

	return null;
};

export const getCastlingRights = (board) => {
	let rights = "";

	// White king on e1
	const whiteKing = board[7][4];
	if (whiteKing && whiteKing.FENChar === "K" && !whiteKing.hasMoved) {
		// Check kingside rook
		const whiteKingsideRook = board[7][7];
		if (
			whiteKingsideRook &&
			whiteKingsideRook.FENChar === "R" &&
			!whiteKingsideRook.hasMoved
		) {
			rights += "K";
		}
		// Check queenside rook
		const whiteQueensideRook = board[7][0];
		if (
			whiteQueensideRook &&
			whiteQueensideRook.FENChar === "R" &&
			!whiteQueensideRook.hasMoved
		) {
			rights += "Q";
		}
	}

	// Black king on e8
	const blackKing = board[0][4];
	if (blackKing && blackKing.FENChar === "k" && !blackKing.hasMoved) {
		// Check kingside rook
		const whiteKingsideRook = board[0][7];
		if (
			whiteKingsideRook &&
			whiteKingsideRook.FENChar === "r" &&
			!whiteKingsideRook.hasMoved
		) {
			rights += "k";
		}
		// Check queenside rook
		const whiteQueensideRook = board[0][0];
		if (
			whiteQueensideRook &&
			whiteQueensideRook.FENChar === "r" &&
			!whiteQueensideRook.hasMoved
		) {
			rights += "q";
		}
	}

	return rights;
};

export const historyToUCI = (moveHistory) => {
	const uci = moveHistory.reduce((acc, move, idx) => {
		acc += move.notation;
		if (idx < moveHistory.length - 1) acc += " ";
		return acc;
	}, "");
	return uci;
};

export const parseStockfishMove = (moveStr) => {
	console.log("Parsing move:", moveStr);
	if (!moveStr || moveStr.length < 4) return null;

	const fromFile = HORIZONTAL_AXIS.indexOf(moveStr[0]);
	const fromRank = 8 - parseInt(moveStr[1]);
	const toFile = HORIZONTAL_AXIS.indexOf(moveStr[2]);
	const toRank = 8 - parseInt(moveStr[3]);

	// Handle promotion (e.g., "e7e8q")
	const promotion = moveStr.length === 5 ? moveStr[4] : null;

	return {
		from: {
			row: fromRank,
			col: fromFile,
			rank: moveStr[1],
			file: moveStr[0],
		},
		to: { row: toRank, col: toFile, rank: moveStr[3], file: moveStr[2] },
		promotion,
		notation: moveStr,
		display: `${moveStr[0]}${moveStr[1]}-${moveStr[2]}${moveStr[3]}`,
	};
};
