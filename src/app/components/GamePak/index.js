import { memo, useMemo } from "react";
import { Pretendo, Gill } from "@/app/fonts";
import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import styles from "@/app/components/GamePak/gamepak.module.css";
import { useGameBoyStore } from "@/app/store/gameboy";

export default memo(function GamePak({
	name,
	imageUrl,
	disableDraggable = false,
}) {
	const { attributes, listeners, transform, setNodeRef } = useDraggable({
		id: name,
		disabled: disableDraggable,
	});
	const zoom = useGameBoyStore((state) => state.zoom);

	// Initially, the values within useDraggable transform are from the original size
	// We want to use the zoomed factor calculated by the page and adjust the transform values
	// Otherwise, the drag area will use the original values while the size of the gamepak will be adjusted...leading to drag not moving with cursor
	const scale = zoom[0] / 100;
	const zoomedTransform = transform
		? {
				...transform,
				x: transform.x / scale,
				y: transform.y / scale,
		  }
		: null;
	const style = transform
		? {
				transform: CSS.Translate.toString(zoomedTransform),
		  }
		: {};

	return (
		<div style={transform ? { zIndex: 2 } : {}}>
			<div
				ref={setNodeRef}
				style={style}
				{...listeners}
				{...attributes}
				// styles={{ touchAction: "manipulation" }}
			>
				<div className={styles.pak}>
					<div className={styles.block}>
						<div className="back" />
					</div>
					<div
						className={styles.square}
						style={{
							boxShadow: transform
								? "-1px 0 15px 0 rgba(34, 33, 81, 0.01), 0px 15px 15px 0 rgba(34, 33, 81, 0.25)"
								: "",
						}}
					>
						<div className={styles.header}>
							<div className={styles.pill}>
								<p className={styles.logo}>
									<span className={Pretendo.className}>Pretendo</span>
									<span className={Gill.className}>GAME&nbsp;BOY</span>
									<sub className={Gill.className}>TM</sub>
								</p>
							</div>
							<span className={styles.stripe} />
							<span className={styles.stripe} />
							<span className={styles.stripe} />
							<span className={styles.stripe} />
							<span className={styles.stripe} />
						</div>
						{/* <div className={styles.bottom}> */}
						<div className={styles}></div>
						<div className={styles.left} />

						<div className={styles.coverContainer}>
							<Image
								className={styles.cover}
								src={imageUrl}
								alt={`${name} Game Pak`}
								width={0}
								height={0}
								sizes={"100vw"}
								draggable={false}
								fill={true}
								quality={50}
							/>
						</div>
						<div className={styles.right} />
						<div className={styles.arrow} />
						<div className="back" />
					</div>
				</div>
			</div>
		</div>
	);
});
