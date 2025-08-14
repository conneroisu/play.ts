import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect easing to animation since easing functions are part of the animation example
export const Route = createFileRoute("/examples/basic/easing")({
	beforeLoad: () => {
		throw redirect({
			to: "/examples/basic/animation",
			replace: true,
		});
	},
});
