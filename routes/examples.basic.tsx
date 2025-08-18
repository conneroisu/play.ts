import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/examples/basic")({
	component: BasicLayout,
	notFoundComponent: () => (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
			<h1 className="text-6xl font-bold text-red-400 mb-4">404</h1>
			<h2 className="text-2xl font-semibold mb-4">Basic Example Not Found</h2>
			<p className="text-gray-300 mb-8 text-center max-w-md">
				The basic example you're looking for doesn't exist. Check out our
				available basic examples instead.
			</p>
			<a
				href="/examples/basic"
				className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
			>
				Browse Basic Examples
			</a>
		</div>
	),
});

function BasicLayout() {
	return <Outlet />;
}
