import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/examples/visual/conway")({
	component: () => <Navigate to="/examples/visual/game-of-life" replace />,
});
