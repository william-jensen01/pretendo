// import React, { useState, useEffect } from "react";

// export default function usePak(
// 	game,
// 	pak,
// 	powerStatusRef,
// 	runningRef,
// 	stopAnimationRef
// ) {
// 	const [state, setState] = useState(null);

// 	console.log("inside usePak", game, pak);

// 	useEffect(() => {
// 		let isMounted = true;
// 		const tempElement = document.createElement("div");

// 		const TestComponent = () => {
// 			const result = pak.default();

// 			useEffect(() => {
// 				if (isMounted) {
// 					setState(result);
// 				}
// 			}, [result]);

// 			return null;
// 		};

// 		React.DOM.render(<TestComponent />, tempElement);

// 		return () => {
// 			isMounted = false;
// 			React.unmountComponentAtNode(tempElement);
// 		};
// 	}, [game, pak]);

// 	return state;
// }
