export default class Cell {
	constructor({
		vital_value,
		generations_lived = 0,
		vital_changed = false,
		blinking = false,
		color = 0,
		game = "life",
	}) {
		if (game === "life") {
			this.vital_status = vital_value;
			this.generations_lived = generations_lived;
			this.vital_changed = vital_changed;
			this.blinking = blinking;
		}
		this.color = color;
	}

	update(newStatus, genLived, changed, blinking, color) {
		this.vital_status = newStatus;
		this.generations_lived = genLived;
		this.vital_changed = changed;
		this.blinking = blinking;
		this.color = color;
	}

	incrementGeneration() {
		this.generations_lived += 1;
	}

	getVital() {
		return this.vital_status;
	}

	changeVitalStatus(newStatus, force = false) {
		this.vital_stats = newStatus;
		this.vital_changed = this.vital_status !== newStatus;
		if (force) {
			this.vital_changed = true;
		}
	}

	blink(state) {
		this.blinking = state;
	}

	alive(color) {
		// this.vital_changed = this.vital_status !== 1;
		this.vital_status = 1;
		this.color = color;
	}

	changeColor(newColor) {
		this.color = newColor;
	}

	dead() {
		// this.vital_changed = this.vital_status !== 0;
		this.vital_status = 0;
		this.color = 0;
	}
}

export const colorLookup = {
	0: "transparent",
	1: "var(--light-green)",
	2: "var(--dark-green)",
	3: "var(--darkest-green)",
};
