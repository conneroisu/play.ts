import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import * as TanStackQueryProvider from "./integrations/tanstack-query/root-provider.tsx";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {
		...TanStackQueryProvider.getContext(),
	},
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById("app");
console.log("Root element:", rootElement);

if (rootElement) {
	console.log("Creating React root...");
	const root = ReactDOM.createRoot(rootElement);
	console.log("React root created:", root);

	console.log("Router instance:", router);
	console.log("Route tree:", routeTree);

	console.log("Rendering RouterProvider...");
	root.render(
		<StrictMode>
			<TanStackQueryProvider.Provider>
				<RouterProvider router={router} />
			</TanStackQueryProvider.Provider>
		</StrictMode>,
	);
	console.log("RouterProvider rendered");
} else {
	console.error("Root element not found!");
}
