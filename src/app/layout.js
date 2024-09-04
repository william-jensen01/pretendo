import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "Pretendo Game Boy",
	description:
		"A browser-based recreation of the classic Game Boy experience, featuring Conway's Game of Life and another game unlocked with a sssecret button combination.",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body className={inter.className}>{children}</body>
		</html>
	);
}
