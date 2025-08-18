import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/examples/visual/particles")({
	component: () => <Navigate to="/examples/visual/particle-system" replace />,
});
