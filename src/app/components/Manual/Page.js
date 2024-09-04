import { useCallback } from "react";
import Image from "next/image";

export default function Page({ altPrefix, index, width = 650, ...props }) {
	const dimension = useCallback((value, isValueWidth = true) => {
		const aspectRatio = 1.4619883041;
		if (isValueWidth) {
			return value / aspectRatio;
		}
		return value * aspectRatio;
	}, []);
	return (
		<Image
			alt={`${altPrefix} - ${index[0]}`}
			src={`/manual/${index[1]}`}
			width={width}
			height={dimension(width, true)}
			onError={(e) => {
				console.log(e);
			}}
			{...props}
		/>
	);
}
