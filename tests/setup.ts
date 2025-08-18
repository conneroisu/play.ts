/**
 * Global test setup and configuration
 * Common setup, teardown, and fixtures for all test suites
 */

import { afterAll, afterEach, beforeAll, beforeEach } from "bun:test";

// Global test state
let testStartTime: number;
const testState: {
	canvasInstances: HTMLCanvasElement[];
	playInstances: any[];
	mockContexts: any[];
} = {
	canvasInstances: [],
	playInstances: [],
	mockContexts: [],
};

// Test environment setup
beforeAll(() => {
	console.log("🚀 Starting play.ts test suite...");

	// Set up global test environment
	globalThis.performance = globalThis.performance || {
		now: () => Date.now(),
	};

	// Mock requestAnimationFrame for Node.js environment
	if (typeof globalThis.requestAnimationFrame === "undefined") {
		globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
			return setTimeout(() => callback(performance.now()), 16);
		};
	}

	if (typeof globalThis.cancelAnimationFrame === "undefined") {
		globalThis.cancelAnimationFrame = (id: number) => {
			clearTimeout(id);
		};
	}

	// Set deterministic seed for consistent test results
	Math.random = (() => {
		let seed = 12345;
		return () => {
			seed = (seed * 9301 + 49297) % 233280;
			return seed / 233280;
		};
	})();
});

// Individual test setup
beforeEach(() => {
	testStartTime = performance.now();

	// Reset test state
	testState.canvasInstances = [];
	testState.playInstances = [];
	testState.mockContexts = [];
});

// Individual test cleanup
afterEach(() => {
	const testDuration = performance.now() - testStartTime;

	// Log slow tests
	if (testDuration > 100) {
		console.warn(`⚠️  Slow test detected: ${testDuration.toFixed(2)}ms`);
	}

	// Cleanup test state
	testState.canvasInstances.forEach((canvas) => {
		// Cleanup canvas if needed
	});

	testState.playInstances.forEach((play) => {
		// Cleanup play instances if needed
	});

	testState.mockContexts.forEach((context) => {
		if (context.clearCalls) {
			context.clearCalls();
		}
	});

	// Reset arrays
	testState.canvasInstances = [];
	testState.playInstances = [];
	testState.mockContexts = [];
});

// Global test cleanup
afterAll(() => {
	console.log("✅ Test suite completed successfully");
});

// Test utilities and fixtures
export const TestFixtures = {
	// Common test data
	colors: {
		red: {
			r: 255,
			g: 0,
			b: 0,
		},
		green: {
			r: 0,
			g: 255,
			b: 0,
		},
		blue: {
			r: 0,
			g: 0,
			b: 255,
		},
		white: {
			r: 255,
			g: 255,
			b: 255,
		},
		black: {
			r: 0,
			g: 0,
			b: 0,
		},
		gray: {
			r: 128,
			g: 128,
			b: 128,
		},
		transparent: {
			r: 0,
			g: 0,
			b: 0,
			a: 0,
		},
	},

	points: {
		origin: {
			x: 0,
			y: 0,
		},
		center: {
			x: 400,
			y: 300,
		},
		topLeft: {
			x: 0,
			y: 0,
		},
		topRight: {
			x: 800,
			y: 0,
		},
		bottomLeft: {
			x: 0,
			y: 600,
		},
		bottomRight: {
			x: 800,
			y: 600,
		},
	},

	shapes: {
		unitCircle: {
			x: 0,
			y: 0,
			radius: 1,
		},
		centeredCircle: {
			x: 400,
			y: 300,
			radius: 50,
		},
		unitSquare: {
			x: 0,
			y: 0,
			width: 1,
			height: 1,
		},
		centeredSquare: {
			x: 375,
			y: 275,
			width: 50,
			height: 50,
		},
	},

	vectors: {
		zero: {
			x: 0,
			y: 0,
		},
		unitX: {
			x: 1,
			y: 0,
		},
		unitY: {
			x: 0,
			y: 1,
		},
		diagonal: {
			x: 1,
			y: 1,
		},
		negative: {
			x: -1,
			y: -1,
		},
	},

	angles: {
		zero: 0,
		quarter: Math.PI / 2,
		half: Math.PI,
		threeQuarter: (3 * Math.PI) / 2,
		full: Math.PI * 2,
	},

	// Common polygons
	polygons: {
		triangle: [
			{
				x: 0,
				y: 0,
			},
			{
				x: 10,
				y: 0,
			},
			{
				x: 5,
				y: 10,
			},
		],

		square: [
			{
				x: 0,
				y: 0,
			},
			{
				x: 10,
				y: 0,
			},
			{
				x: 10,
				y: 10,
			},
			{
				x: 0,
				y: 10,
			},
		],

		pentagon: [
			{
				x: 5,
				y: 0,
			},
			{
				x: 9.51,
				y: 3.09,
			},
			{
				x: 7.94,
				y: 8.09,
			},
			{
				x: 2.06,
				y: 8.09,
			},
			{
				x: 0.49,
				y: 3.09,
			},
		],
	},
};

// Test environment helpers
export const TestHelpers = {
	// Create test canvas with consistent dimensions
	createTestCanvas: (
		width: number = 800,
		height: number = 600,
	): HTMLCanvasElement => {
		const canvas = {
			width,
			height,
			getContext: (type: string) => {
				if (type === "2d") {
					const context = TestHelpers.createTestContext();
					testState.mockContexts.push(context);
					return context;
				}
				return null;
			},
		} as unknown as HTMLCanvasElement;

		testState.canvasInstances.push(canvas);
		return canvas;
	},

	// Create test context with call tracking
	createTestContext: (): CanvasRenderingContext2D => {
		const calls: Array<{
			method: string;
			args: any[];
			timestamp: number;
		}> = [];

		const context = {
			// Drawing state
			fillStyle: "#000000",
			strokeStyle: "#000000",
			lineWidth: 1,
			font: "10px sans-serif",
			globalAlpha: 1,

			// Path methods
			beginPath: (...args: any[]) =>
				calls.push({
					method: "beginPath",
					args,
					timestamp: performance.now(),
				}),
			closePath: (...args: any[]) =>
				calls.push({
					method: "closePath",
					args,
					timestamp: performance.now(),
				}),
			moveTo: (...args: any[]) =>
				calls.push({
					method: "moveTo",
					args,
					timestamp: performance.now(),
				}),
			lineTo: (...args: any[]) =>
				calls.push({
					method: "lineTo",
					args,
					timestamp: performance.now(),
				}),
			arc: (...args: any[]) =>
				calls.push({
					method: "arc",
					args,
					timestamp: performance.now(),
				}),
			arcTo: (...args: any[]) =>
				calls.push({
					method: "arcTo",
					args,
					timestamp: performance.now(),
				}),
			quadraticCurveTo: (...args: any[]) =>
				calls.push({
					method: "quadraticCurveTo",
					args,
					timestamp: performance.now(),
				}),
			bezierCurveTo: (...args: any[]) =>
				calls.push({
					method: "bezierCurveTo",
					args,
					timestamp: performance.now(),
				}),
			rect: (...args: any[]) =>
				calls.push({
					method: "rect",
					args,
					timestamp: performance.now(),
				}),

			// Drawing methods
			fill: (...args: any[]) =>
				calls.push({
					method: "fill",
					args,
					timestamp: performance.now(),
				}),
			stroke: (...args: any[]) =>
				calls.push({
					method: "stroke",
					args,
					timestamp: performance.now(),
				}),
			fillRect: (...args: any[]) =>
				calls.push({
					method: "fillRect",
					args,
					timestamp: performance.now(),
				}),
			strokeRect: (...args: any[]) =>
				calls.push({
					method: "strokeRect",
					args,
					timestamp: performance.now(),
				}),
			clearRect: (...args: any[]) =>
				calls.push({
					method: "clearRect",
					args,
					timestamp: performance.now(),
				}),
			fillText: (...args: any[]) =>
				calls.push({
					method: "fillText",
					args,
					timestamp: performance.now(),
				}),
			strokeText: (...args: any[]) =>
				calls.push({
					method: "strokeText",
					args,
					timestamp: performance.now(),
				}),

			// Transform methods
			save: (...args: any[]) =>
				calls.push({
					method: "save",
					args,
					timestamp: performance.now(),
				}),
			restore: (...args: any[]) =>
				calls.push({
					method: "restore",
					args,
					timestamp: performance.now(),
				}),
			translate: (...args: any[]) =>
				calls.push({
					method: "translate",
					args,
					timestamp: performance.now(),
				}),
			rotate: (...args: any[]) =>
				calls.push({
					method: "rotate",
					args,
					timestamp: performance.now(),
				}),
			scale: (...args: any[]) =>
				calls.push({
					method: "scale",
					args,
					timestamp: performance.now(),
				}),
			transform: (...args: any[]) =>
				calls.push({
					method: "transform",
					args,
					timestamp: performance.now(),
				}),
			setTransform: (...args: any[]) =>
				calls.push({
					method: "setTransform",
					args,
					timestamp: performance.now(),
				}),

			// Image methods
			drawImage: (...args: any[]) =>
				calls.push({
					method: "drawImage",
					args,
					timestamp: performance.now(),
				}),

			// Test helpers
			getCalls: () => calls,
			clearCalls: () => (calls.length = 0),
			getCallsOfType: (method: string) =>
				calls.filter((call) => call.method === method),
			getLastCall: () => calls[calls.length - 1],
			getCallCount: () => calls.length,
		};

		return context as unknown as CanvasRenderingContext2D;
	},

	// Performance measurement helper
	measurePerformance: <T>(
		fn: () => T,
		label?: string,
	): {
		result: T;
		duration: number;
	} => {
		const start = performance.now();
		const result = fn();
		const end = performance.now();
		const duration = end - start;

		if (label && duration > 10) {
			console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
		}

		return {
			result,
			duration,
		};
	},

	// Memory usage tracker (simplified)
	trackMemory: <T>(
		fn: () => T,
	): {
		result: T;
		memoryInfo?: any;
	} => {
		// In real browser environment, could use performance.memory
		const result = fn();
		return {
			result,
		};
	},

	// Random data generators with consistent seed
	generateTestData: {
		numbers: (count: number, min: number = 0, max: number = 1): number[] => {
			const numbers = [];
			for (let i = 0; i < count; i++) {
				numbers.push(min + Math.random() * (max - min));
			}
			return numbers;
		},

		points: (
			count: number,
			bounds: {
				minX: number;
				maxX: number;
				minY: number;
				maxY: number;
			},
		): Array<{
			x: number;
			y: number;
		}> => {
			const points = [];
			for (let i = 0; i < count; i++) {
				points.push({
					x: bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
					y: bounds.minY + Math.random() * (bounds.maxY - bounds.minY),
				});
			}
			return points;
		},

		colors: (
			count: number,
		): Array<{
			r: number;
			g: number;
			b: number;
		}> => {
			const colors = [];
			for (let i = 0; i < count; i++) {
				colors.push({
					r: Math.floor(Math.random() * 256),
					g: Math.floor(Math.random() * 256),
					b: Math.floor(Math.random() * 256),
				});
			}
			return colors;
		},
	},

	// Animation frame simulation
	simulateAnimationFrames: (
		callback: (time: number, frame: number) => void,
		frames: number = 60,
	): void => {
		for (let frame = 0; frame < frames; frame++) {
			const time = frame * (1000 / 60); // 60 FPS
			callback(time, frame);
		}
	},
};

// Export test state for advanced testing scenarios
export const getTestState = () => testState;
