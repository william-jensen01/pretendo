import localFont from "next/font/local";
import { Lato as LatoGoogle } from "next/font/google";

export const Pretendo = localFont({
	src: [
		{
			path: "./pretendo/pretendo.ttf",
			weight: "400",
			style: "normal",
		},
		{
			path: "./pretendo/pretendo.woff",
			weight: "400",
			style: "normal",
		},
		{
			path: "./pretendo/pretendo.woff2",
			weight: "400",
			style: "normal",
		},
	],
});

export const NES = localFont({
	src: [
		{
			path: "./nes/nes_controller_mrshrike.ttf",
			style: "normal",
		},
	],
});

export const Futura = localFont({
	src: [
		{
			path: "./futura/FuturaPTMedium.otf",
			style: "normal",
			weight: "500",
		},
		{
			path: "./futura/FuturaPTBook.otf",
			style: "normal",
			weight: "400",
		},
		{
			path: "./futura/FuturaPTLight.otf",
			style: "normal",
			weight: "300",
		},
	],
});

export const Gill = localFont({
	src: [
		{
			path: "./gill/GillSansMTPro-MediumItalic.otf",
			style: "italic",
			weight: "400",
		},
		{
			path: "./gill/GillSansMTPro-Medium.otf",
			style: "normal",
			weight: "400",
		},
	],
});

// export const Lato = localFont({
// 	src: [
// 		{
// 			path: "./lato/lato.ttf",
// 			weight: "400",
// 			style: "normal",
// 		},
// 		{
// 			path: "./lato/lato.woff",
// 			weight: "400",
// 			style: "normal",
// 		},
// 		{
// 			path: "./lato/lato.woff2",
// 			weight: "400",
// 			style: "normal",
// 		},
// 	],
// });

export const Lato = LatoGoogle({
	weight: ["400", "700", "900"],
	subsets: ["latin"],
	display: "swap",
});
