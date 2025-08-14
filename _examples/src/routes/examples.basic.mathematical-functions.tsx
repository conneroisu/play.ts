import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect mathematical-functions to math since that's the correct URL
export const Route = createFileRoute("/examples/basic/mathematical-functions")({
	beforeLoad: () => {
		throw redirect({
			to: "/examples/basic/math",
			replace: true,
		});
	},
});
