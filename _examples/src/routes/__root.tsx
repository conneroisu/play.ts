import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import Header from "../components/Header";

import TanStackQueryLayout from "../integrations/tanstack-query/layout.tsx";

import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => (
		<>
			<Header />

			<Outlet />

			<TanStackQueryLayout />
		</>
	),
	notFoundComponent: () => (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
			<h1 className="text-6xl font-bold text-red-400 mb-4">404</h1>
			<h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
			<p className="text-gray-300 mb-8 text-center max-w-md">
				The page you're looking for doesn't exist. It might have been moved,
				deleted, or you entered the wrong URL.
			</p>
			<a
				href="/examples"
				className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
			>
				Go to Examples
			</a>
		</div>
	),
});
