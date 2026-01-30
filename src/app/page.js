"use client";
import {
	useState,
	Suspense,
	useMemo,
	useCallback,
	useEffect,
	useRef,
	useLayoutEffect,
} from "react";
// import oldGameBoy from "@/app/components/GameBoy/old";
import GameBoy from "@/app/components/GameBoy";
import Manual from "@/app/components/Manual";
import GamePak from "@/app/components/GamePak";
import Notification from "@/app/components/Notification";
import styles from "./page.module.css";
import { useGameBoyStore } from "./store/gameboy";
import {
	DndContext,
	useDndContext,
	useSensor,
	useSensors,
	PointerSensor,
	TouchSensor,
} from "@dnd-kit/core";
import { rectIntersection } from "@/app/util/rectIntersection";
import useSound from "@/app/util/useSound";
// import Life from "@/app/games/life";
// import Snake from "@/app/games/snake";

// const GamePakLookup = {
// 	life: Life,
// 	snake: Snake,
// };

const games = ["life", "snake", "chess"];

export default function Home() {
	const message = useGameBoyStore((state) => state.message);
	const game = useGameBoyStore((state) => state.game);
	const setGame = useGameBoyStore((state) => state.setGame);
	const zoom = useGameBoyStore((state) => state.zoom);
	const eeUnlocked = useGameBoyStore((state) => state.eeUnlocked);
	const setEEUnlocked = useGameBoyStore((state) => state.setEEUnlocked);
	const [isDragging, setIsDragging] = useState(false);
	const [showPaks, setShowPaks] = useState(false);
	const pageRef = useRef(null);
	const [playPakInsert] = useSound("/audio/pak_insert.m4a", {
		volume: 1,
		ignoreConsoleVolume: true,
	});

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				// distance: 0,
				// delay: 1000,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				// delay: 1000,
				// tolerance: 5,
				// tolerance: 50,
			},
		})
	);

	useLayoutEffect(() => {
		const unlocked = localStorage.getItem("eeUnlocked");
		setEEUnlocked(unlocked === "true");
		setShowPaks(true);
	}, [setEEUnlocked]);

	return (
		<Suspense>
			<DndContext
				sensors={sensors}
				onDragStart={(e) => {
					setIsDragging(true);
				}}
				onDragEnd={(e) => {
					const { active, over } = e;
					if (over && !game) {
						setGame(active.id);
						playPakInsert();
					}
					setIsDragging(false);
				}}
				collisionDetection={(e) => rectIntersection({ ...e, zoom })}
			>
				<main
					ref={pageRef}
					className={styles.main}
					style={{ "--zoom": zoom[0] }}
					// styles={{ touchAction: isDragging ? "none" : "manipulation" }}
				>
					<GameBoy dragging={isDragging} pageRef={pageRef} />
					<div className={styles.games}>
						{games.map((g) => {
							if (
								// don't show snake pak if easter egg is not unlocked
								(g === "snake" && !eeUnlocked) ||
								// don't show pak if it is not the current game
								g === game ||
								// don't show pak if they are not shown
								!showPaks
							)
								return <div key={g} className={styles.place} />;

							const src = `/games/${g}.png`;
							return <GamePak key={g} name={g} imageUrl={src} />;
						})}
					</div>
					<Manual zoom={zoom} />
				</main>
				<Notification message={message} />
			</DndContext>
		</Suspense>
	);
}
