import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Get the base path for the application
 * Returns "/play.ts" for GitHub Pages deployment, "/" for local development
 */
export function getBasePath(): string {
	// Check if we're in a browser environment
	if (typeof window !== "undefined") {
		// If the current pathname starts with /play.ts, we're on GitHub Pages
		return window.location.pathname.startsWith("/play.ts") ? "/play.ts" : "";
	}
	// Fallback for SSR - this should match the astro.config.mjs base setting
	return process.env.NODE_ENV === "production" ? "/play.ts" : "";
}

/**
 * Create a URL with the appropriate base path
 */
export function createUrl(path: string): string {
	const basePath = getBasePath();
	return `${basePath}${path}`;
}
