import React, {
	useRef,
	useState,
	useEffect,
	useCallback,
	useMemo,
	memo,
} from "react";
import { useGameBoyStore } from "@/app/store/gameboy";

export default function useSound(
	src,
	{
		volume = 1,
		playbackRate = 1,
		soundEnabled = true,
		interrupt = false,
		ignoreConsoleVolume = false,
		...delegated
	}
) {
	const HowlConstructor = useRef();
	const isMounted = useRef(false);

	const [duration, setDuration] = useState(null);

	const [sound, setSound] = useState(null);
	const consoleVolume = useGameBoyStore((state) => state.volume);

	const preciseVolume = useMemo(
		() => (ignoreConsoleVolume ? volume : consoleVolume * volume),
		[volume, consoleVolume, ignoreConsoleVolume]
	);

	const handleLoad = function () {
		if (typeof onload === "function") {
			onload.call(this);
		}

		if (isMounted.current) {
			setDuration(this.duration() * 1000);
		}

		// console.log("useSound ::", src, ":: THIS ::", this);
		setSound(this);
	};

	// useEffect(() => {
	// 	HowlConstructor.current = new Howl({
	// 		src: Array.isArray(src) ? src : [src],
	// 		volume: preciseVolume,
	// 		rate: playbackRate,
	// 		onload: handleLoad,
	// 		onplay: handlePlay,
	// 		onpause: handlePause,
	// 		...delegated,
	// 	});
	// }, []);

	// We want to lazy-load Howler, since sounds can't play on load anyway
	useEffect(
		() => {
			import("howler")
				.then((mod) => {
					if (!isMounted.current) {
						// Depending on the module system used, 'mod' might hold
						// the export directly, or it might be under 'default'.
						HowlConstructor.current = mod.Howl || mod.default.Howl;
						isMounted.current = true;
						new HowlConstructor.current({
							src: Array.isArray(src) ? src : [src],
							volume: preciseVolume,
							rate: playbackRate,
							onload: handleLoad,
							//
							onunlock: () => {
								console.log("UNLOCKED", src);
							},
							onloaderror: (e) => {
								console.log("ERROR LOADING", src);
								console.log(e);
							},
							...delegated,
						});
					}
				})
				.catch((err) => {
					console.log("error loading howler", err);
				});
			return () => {
				isMounted.current = false;
			};
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	// When the `src` changes, we have to do a whole thing where we recreate
	// the Howl instance. This is because Howler doesn't expose a way to
	// tweak the sound
	useEffect(() => {
		if (HowlConstructor.current && sound) {
			setSound(
				new HowlConstructor.current({
					src: Array.isArray(src) ? src : [src],
					volume: preciseVolume,
					rate: playbackRate,
					onload: handleLoad,
					onunlock: () => {
						console.log("UNLOCKED", src);
					},
					onloaderror: (e) => {
						console.log("ERROR LOADING", src);
						console.log(e);
					},
					...delegated,
				})
			);
		}
		// The linter wants to run this effect whenever ANYTHING changes,
		// but very specifically I only want to recreate the Howl instance
		// when the `src` changes. Other changes should have no effect.
		// Passing array to the useEffect dependencies list will result in
		// ifinite loop so we need to stringify it, for more details check
		// https://github.com/facebook/react/issues/14476#issuecomment-471199055
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(src)]);

	// Whenever volume/playbackRate are changed, change those properties
	// on the sound instance.
	useEffect(() => {
		if (sound) {
			console.log(sound);
			sound.volume(preciseVolume);

			// try {
			// 	sound.rate(playbackRate);
			// } catch (err) {
			// 	console.log("Error setting playback rate:", err);
			// }

			// sound.rate(playbackRate);
		}
		// A weird bug means that including the `sound` here can trigger an
		// error on unmount, where the state loses track of the sprites??
		// No idea, but anyway I don't need to re-run this if only the `sound`
		// changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [preciseVolume]);

	const play = useCallback(
		(options = {}) => {
			console.log("WITHIN PLAY", src, options.id);

			if (!sound || (!soundEnabled && !options.forceSoundEnabled)) {
				return;
			}

			if (interrupt) {
				console.log("interrupting");
				sound.stop();
			}

			// sound.rate(options.playbackRate || playbackRate, options.id);

			try {
				const soundId = sound.play(options.id);
				return soundId;
			} catch (err) {
				console.log("ERROR playing sound", err);
			}
		},
		[src, sound, soundEnabled, interrupt]
	);

	const stop = useCallback(
		(id) => {
			if (!sound) {
				return;
			}
			sound.stop(id);
		},
		[sound]
	);

	const pause = useCallback(
		(id) => {
			if (!sound) {
				return;
			}
			sound.pause(id);
		},
		[sound]
	);

	return useMemo(() => {
		return [
			play,
			{
				sound,
				stop,
				pause,
				duration,
			},
		];
	}, [play, sound, stop, pause, duration]);
}
