import { memo, useEffect, useRef } from "react";
import { Pretendo, Lato, Futura } from "@/app/fonts";
import { useGameBoyStore } from "../store/gameboy";

export default memo(function Notification({ message1 }) {
	console.log("rendering notification");
	const message = useGameBoyStore((state) => state.message);
	const setMessage = useGameBoyStore((state) => state.setMessage);
	const timeoutRef = useRef();

	useEffect(() => {
		if (!timeoutRef.current) {
			timeoutRef.current = setTimeout(() => {
				setMessage("");
			}, 2000);
		}

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, [message, setMessage]);

	return message ? (
		<div id="message" className={Futura.className}>
			<p>{message}</p>
			<span id="stripe" />
		</div>
	) : null;
});
