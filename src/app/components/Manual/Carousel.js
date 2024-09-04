import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
	PrevButton,
	NextButton,
	usePrevNextButtons,
} from "@/app/components/Manual/ArrowButton";
import Page from "@/app/components/Manual/Page";
import Thumb from "@/app/components/Manual/ThumbsButton";
import { NES } from "@/app/fonts";

import styles from "@/app/components/Manual/manual.module.css";

export default function Carousel({
	slides,
	options,
	dialogRef,
	isManualModal,
	setIsManualModal,
}) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [emblaMainRef, emblaMainApi] = useEmblaCarousel(options);
	const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
		containScroll: "keepSnaps",
		dragFree: true,
	});

	const {
		prevBtnDisabled,
		nextBtnDisabled,
		onPrevButtonClick,
		onNextButtonClick,
	} = usePrevNextButtons(emblaMainApi);

	const onThumbClick = useCallback(
		(index) => {
			if (!emblaMainApi || !emblaThumbsApi) return;
			emblaMainApi.scrollTo(index);
		},
		[emblaMainApi, emblaThumbsApi]
	);

	const onSelect = useCallback(() => {
		if (!emblaMainApi || !emblaThumbsApi) return;

		setSelectedIndex(emblaMainApi.selectedScrollSnap());
		emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
	}, [emblaMainApi, emblaThumbsApi, setSelectedIndex]);

	useEffect(() => {
		if (!emblaMainApi) return;
		onSelect();
		emblaMainApi.on("select", onSelect).on("reInit", onSelect);
	}, [emblaMainApi, onSelect]);

	return (
		<div className={styles.embla}>
			<div className={styles.emblaViewport} ref={emblaMainRef}>
				<div className={styles.emblaContainer}>
					{slides.map((index, idx) => (
						<div className={styles.emblaSlide} key={idx}>
							<Page
								altPrefix="Owner's Manual"
								index={index}
								className={styles.emblaSlideNumber}
								quality={100}
								// priority={true}
								priority
							/>
						</div>
					))}
				</div>
			</div>

			<div className={styles.controls}>
				<div className={styles.buttons}>
					<PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
					<NextButton
						autoFocus
						onClick={onNextButtonClick}
						disabled={nextBtnDisabled}
					/>
				</div>

				<div className={styles.thumbs}>
					<div className={styles.thumbsViewport} ref={emblaThumbsRef}>
						<div className={styles.thumbsContainer}>
							{slides.map((index, idx) => (
								<Thumb
									key={idx}
									onClick={() => onThumbClick(idx)}
									selected={idx === selectedIndex}
									pagination={[idx, slides.length]}
									index={index}
									quality={50}
								/>
							))}
						</div>
					</div>
				</div>

				{/* show close button if dialog is modal */}
				<form
					method="dialog"
					onSubmit={(e) => {
						e.preventDefault();
						if (dialogRef.current.matches(":modal")) {
							setIsManualModal(false);
							setSelectedIndex(0);
							emblaMainApi.scrollTo(0);
						} else {
							setIsManualModal(true);
						}
					}}
				>
					<button
						type="submit"
						name="close"
						className={`${styles.close} ${NES.className}`}
					>
						Close
					</button>
				</form>
				<p className={styles.pagination}>
					<sup>{selectedIndex + 1}</sup>&frasl;<sub>{slides.length}</sub>
					{/* {selectedIndex + 1}&frasl;{slides.length} */}
				</p>
			</div>
		</div>
	);
}
