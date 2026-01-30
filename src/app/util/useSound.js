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
		stereo = 0,
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

						// Create sound instance with initial properties
						const newSound = new HowlConstructor.current({
							src: Array.isArray(src) ? src : [src],
							volume: preciseVolume,
							rate: playbackRate,
							onload: function () {
								if (isMounted.current) {
									setDuration(this.duration() * 1000);
								}
							},
							onunlock: () => {
								console.log("UNLOCKED", src);
							},
							onloaderror: (e) => {
								console.log("ERROR LOADING", src);
								console.log(e);
							},
							...delegated,
						})

						setSound(newSound);
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

	// When the `src` changes, we have to do a recreate the Howl instance
	useEffect(() => {
		if (HowlConstructor.current && sound) {
			console.log("Creating new sound instance");

			const newSound = new HowlConstructor.current({
				src: Array.isArray(src) ? src : [src],
				volume: preciseVolume,
				rate: playbackRate,
				onload: function () {
					if (isMounted.current) {
						setDuration(this.duration() * 1000);
					}
				},
				onunlock: () => {
					console.log("UNLOCKED", src);
				},
				onloaderror: (e) => {
					console.log("ERROR LOADING", src);
					console.log(e);
				},
				...delegated,
			})

			// Cleanup old sound
			sound.stop();
			sound.unload();

			setSound(newSound);
		}
		// The linter wants to run this effect whenever ANYTHING changes,
		// but very specifically I only want to recreate the Howl instance
		// when the `src` changes. Other changes should have no effect.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [src]);

	// Update volume property on sound instance
	useEffect(() => {
		if (sound) {
			sound.volume(preciseVolume);
		}
	}, [sound, preciseVolume]);
 
	// Update playback rate property on sound instance
	// Separate effect to not interfere with volume
	useEffect(() => {
		if (sound) {
			sound.rate(playbackRate);
		}
	}, [sound, playbackRate])

	useEffect(() => {
		if (sound && stereo !== undefined) {
			sound.stereo(stereo);
		}
	}, [sound, stereo]);

	// Cleanup: stop and unload sound on unmount
	useEffect(() => {
		return () => {
			if (sound) {
				sound.stop();
				sound.unload();
			}
		};
	}, [sound]);

	const play = useCallback(
		(options = {}) => {
			if (!sound || (!soundEnabled && !options.forceSoundEnabled)) {
				return;
			}

			if (interrupt) {
				console.log("interrupting");
				sound.stop();
			}

			try {
				const soundId = sound.play(options.id);

				// Set rate for this specific sound instance if provided
				// Must be called after play() to get the soundId
				if (options.playbackRate !== undefined) {
					console.log("setting playback rate", options.playbackRate, "for soundId", soundId);
					sound.rate(options.playbackRate, soundId);
				}

				return soundId;
			} catch (err) {
				console.log("ERROR playing sound", err);
			}
		},
		[src, sound, soundEnabled, interrupt, playbackRate]
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
