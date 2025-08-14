import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/examples/visual/ascii-matrix-rain")({
	component: () => <Navigate to="/examples/visual/ascii-matrix" replace />,
});
