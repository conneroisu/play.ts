import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect boids to flocking since that's the correct URL
export const Route = createFileRoute("/examples/visual/boids")({
	beforeLoad: () => {
		throw redirect({
			to: "/examples/visual/flocking",
			replace: true,
		});
	},
});
