import React from "react";

import Page from "@/app/components/Manual/Page";

import styles from "@/app/components/Manual/manual.module.css";

export default function Thumb({
	selected,
	index,
	onClick,
	pagination,
	...props
}) {
	return (
		<div
			className={`${styles.thumbsSlide} ${
				selected ? styles.thumbsSlideSelected : ""
			}`}
		>
			<button
				onClick={onClick}
				type="button"
				className={styles.thumbsSlideNumber}
			>
				<Page
					altPrefix={"Thumbnail of Owner's Manual"}
					index={index}
					width={200}
					{...props}
				/>
			</button>
		</div>
	);
}
