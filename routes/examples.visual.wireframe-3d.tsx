import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/examples/visual/wireframe-3d")({
	component: () => <Navigate to="/examples/visual/3d-wireframe" replace />,
});
