import { SQUARE_SIZE, BOARD_OFFSET, HORIZONTAL_AXIS, VERTICAL_AXIS } from "./constants";

/**
 * Transforms board coordinates (row, col) to visual grid coordinates based on whitePosition setting.
 * @param {number} row - Board row index (0-7, where 0 is Black's back rank, 7 is White's back rank)
 * @param {number} col - Board column index (0-7, where 0 is file 'a', 7 is file 'h')
 * @param {string} whitePosition - One of: "bottom", "top", "left", "right"
 * @returns {{row: number, col: number}} - Transformed coordinates for rendering
 */
export const transformBoardToGrid = (row, col, whitePosition = "bottom") => {
    let aRow, aCol;
    switch (whitePosition) {
        case "top": // 180° rotation
            aRow = 7 - row;
            aCol = 7 - col;
            break;
        case "left": // 90° CCW rotation
            aRow = col;
            aCol = 7 - row;
            break;
        case "right": // 90° CW rotation
            aRow = 7 - col;
            aCol = row;
            break;
        case "bottom": // Default, no transformation
        default:
            aRow = row;
            aCol = col;
            break;
    }
    const gRow = aRow * SQUARE_SIZE + BOARD_OFFSET;
    const gCol = aCol * SQUARE_SIZE + BOARD_OFFSET;
    return { row: gRow, col: gCol }
}

export function getCoordinateLabels(whitePosition) {
    let horizontalLabels = HORIZONTAL_AXIS;
	let verticalLabels = VERTICAL_AXIS;

	switch (whitePosition) {
		case "top": // 180° rotation - reverse both axes
            horizontalLabels = [...HORIZONTAL_AXIS].reverse();
            verticalLabels = [...VERTICAL_AXIS].reverse();
            break;
		case "left": // 90° CCW - ranks become horizontal (left to right), files become vertical (top to bottom)
            horizontalLabels = [...VERTICAL_AXIS].reverse(); // 1-8 left to right
            verticalLabels = HORIZONTAL_AXIS; // a-h top to bottom
            break;
        case "right": // 90° CW - ranks become horizontal (right to left), files become vertical (bottom to top)
            horizontalLabels = VERTICAL_AXIS; // 8-1 left to right
            verticalLabels = [...HORIZONTAL_AXIS].reverse(); // h-a top to bottom
            break;
		case "bottom":
		default:
			// Default orientation - no change
			break;
	}

    return [horizontalLabels, verticalLabels];
}