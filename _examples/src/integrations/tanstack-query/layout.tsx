import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function LayoutAddition() {
	// Only show DevTools in development mode
	if (import.meta.env.PROD) {
		return null;
	}

	return (
		<ReactQueryDevtools
			buttonPosition="bottom-right"
			initialIsOpen={false}
			position="bottom"
			panelProps={{
				style: {
					height: "40vh", // Limit height to 40% of viewport
					minHeight: "300px",
					maxHeight: "500px",
				},
			}}
		/>
	);
}
