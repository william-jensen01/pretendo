import {
	useCallback,
	useRef,
	useState,
	useEffect,
	useLayoutEffect,
} from "react";

import Carousel from "@/app/components/Manual/Carousel";
import Page from "@/app/components/Manual/Page";
import styles from "@/app/components/Manual/manual.module.css";

// Array of specific image file names
const imageFiles = [
	["cover", "cover.png"],
	["table of contents", "2.png"],
	["game boy features", "3.png"],
	["description of features", "4.png"],
	["description of features --continued", "5.png"],
	["how to use", "6.png"],
	["console keybindings", "7.png"],
	["games", "8.png"],
	["conway's game of life", "9.png"],
	["rules - conway's game of life", "10.png"],
	["controls - conway's game of life", "11.png"],
	["shortcuts - conway's game of life", "12.png"],
	["cursor type - conway's game of life", "13.png"],
	["locked", "14.png"],
	["credits", "15.png"],
];
const OPTIONS = { loop: false };

export default function Manual({ zoom }) {
	const [isManualModal, setIsManualModal] = useState(true);
	const dialogRef = useRef();
	const openRef = useRef();
	useLayoutEffect(() => {
		if (dialogRef.current) {
			if (dialogRef.current.matches(":modal")) {
				dialogRef.current.close();
			} else {
				dialogRef.current.showModal();
			}
		}
	}, [isManualModal]);

	useEffect(() => {
		const handleKeyPress = (e) => {
			if (e.key === "Escape") {
				if (dialogRef.current.matches(":modal")) {
					document.querySelector(`.${styles.close}`).click();
				}
			}
		};
		// keypress event listener
		window.addEventListener("keydown", handleKeyPress);
		return () => {
			window.removeEventListener("keydown", handleKeyPress);
		};
	}, []);

	return (
		<>
			<dialog ref={dialogRef} className={styles.dialog}>
				<div
					className={styles.manual}
					style={{
						// transform: `scale(${zoom / 100})`,
						// transformOrigin: "center center",
						"--scale": `${zoom[0] / 100}`,
						// zoom is set to be 95% of the original size, missing accounts for the 5% not included
						"--missing": `${zoom[1]}px`,
					}}
				>
					<Carousel
						slides={imageFiles}
						options={OPTIONS}
						dialogRef={dialogRef}
						isManualModal={isManualModal}
						setIsManualModal={setIsManualModal}
					/>
				</div>
			</dialog>

			<button
				className={styles.cover}
				onClick={() => {
					if (!isManualModal) {
						setIsManualModal(true);
					}
				}}
			>
				<Page
					altPrefix="Owner's Manual"
					index={imageFiles[0]}
					className={styles.emblaSlideNumber}
					quality={100}
				/>
				<div className={styles.open} ref={openRef}>
					<svg
						viewBox="0 0 416 416"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M336 176V360C336 365.253 334.965 370.454 332.955 375.307C330.945 380.16 327.999 384.57 324.284 388.284C320.57 391.999 316.16 394.945 311.307 396.955C306.454 398.965 301.253 400 296 400H56C45.3913 400 35.2172 395.786 27.7157 388.284C20.2143 380.783 16 370.609 16 360V120C16 109.391 20.2143 99.2172 27.7157 91.7157C35.2172 84.2143 45.3913 80 56 80H223.48M288 16H400V128M176 240L392 24"
							stroke="currentColor"
							strokeWidth="32"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
			</button>
		</>
	);

	// return isManualModal ? (
	// 	<dialog
	// 		ref={dialogRef}
	// 		className={styles.dialog}
	// 		style={{
	// 			"--dialog-padding": "1rem",
	// 			padding: `var(--dialog-padding) var(--dailog-padding) / 2`,
	// 			// padding: `calc(1rem + (1rem + 20px / 2)) calc(0.5rem + (1rem + 20px / 2))`,
	// 			paddingTop: !isManualModal
	// 				? `calc(var(--dialog-padding) + ((1rem + 20px) / 2))`
	// 				: "inherit",
	// 			paddingRight: !isManualModal
	// 				? `calc(var(--dialog-padding) + ((1rem + 20px) / 2))`
	// 				: "inherit",
	// 		}}
	// 	>
	// 		<div className={styles.manual}>
	// 			<Carousel
	// 				slides={imageFiles}
	// 				options={OPTIONS}
	// 				dialogRef={dialogRef}
	// 				isManualModal={isManualModal}
	// 				setIsManualModal={setIsManualModal}
	// 			/>
	// 		</div>
	// 	</dialog>
	// ) : (
	// 	<button
	// 		className={styles.cover}
	// 		onClick={() => {
	// 			if (!isManualModal) {
	// 				setIsManualModal(true);
	// 			}
	// 		}}
	// 	>
	// 		<Page
	// 			altPrefix="Owner's Manual"
	// 			index={imageFiles[0]}
	// 			className={styles.emblaSlideNumber}
	// 		/>
	// 		<div className={styles.open} ref={openRef}>
	// 			<svg
	// 				viewBox="0 0 416 416"
	// 				fill="none"
	// 				xmlns="http://www.w3.org/2000/svg"
	// 			>
	// 				<path
	// 					d="M336 176V360C336 365.253 334.965 370.454 332.955 375.307C330.945 380.16 327.999 384.57 324.284 388.284C320.57 391.999 316.16 394.945 311.307 396.955C306.454 398.965 301.253 400 296 400H56C45.3913 400 35.2172 395.786 27.7157 388.284C20.2143 380.783 16 370.609 16 360V120C16 109.391 20.2143 99.2172 27.7157 91.7157C35.2172 84.2143 45.3913 80 56 80H223.48M288 16H400V128M176 240L392 24"
	// 					stroke="currentColor"
	// 					strokeWidth="32"
	// 					strokeLinecap="round"
	// 					strokeLinejoin="round"
	// 				/>
	// 			</svg>
	// 		</div>
	// 	</button>
	// );
}
