import { useEffect } from "react";
import { useInputStore } from "@/app/store/input";
import { checkClickOrder } from "./helper";

export const useClickSequenceDetection = (shortcuts) => {
	const clickSequence = useInputStore((state) => state.clickSequence);
	const resetSequence = useInputStore((state) => state.resetSequence);

	useEffect(() => {
		if (clickSequence.length === 0) return;

		// When sequences completes (after 500ms in store), check it
		if (shortcuts && shortcuts.length > 0) {
			shortcuts.forEach(([sequence, callback]) => {
				if (checkClickOrder(clickSequence, sequence)) {
					console.log("Easter egg triggered:", sequence);
					callback(() => resetSequence());
				}
			});
		}
	}, [clickSequence, resetSequence]);
};
