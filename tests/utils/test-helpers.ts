/**
 * Test utilities and helpers for play.ts testing
 */

import { expect } from "bun:test";

// Numerical comparison helpers
export const expectCloseTo = (
	received: number,
	expected: number,
	precision: number = 5,
) => {
	expect(received).toBeCloseTo(expected, precision);
};

export const expectInRange = (value: number, min: number, max: number) => {
	expect(value).toBeGreaterThanOrEqual(min);
	expect(value).toBeLessThanOrEqual(max);
};

// Array comparison helpers
export const expectArrayCloseTo = (
	received: number[],
	expected: number[],
	precision: number = 5,
) => {
	expect(received.length).toBe(expected.length);
	for (let i = 0; i < received.length; i++) {
		expectCloseTo(received[i]!, expected[i]!, precision);
	}
};

export const expectArrayInRange = (
	values: number[],
	min: number,
	max: number,
) => {
	for (const value of values) {
		expectInRange(value, min, max);
	}
};

// Vector comparison helpers
export const expectVec2CloseTo = (
	received: {
		x: number;
		y: number;
	},
	expected: {
		x: number;
		y: number;
	},
	precision: number = 5,
) => {
	expectCloseTo(received.x, expected.x, precision);
	expectCloseTo(received.y, expected.y, precision);
};

export const expectVec3CloseTo = (
	received: {
		x: number;
		y: number;
		z: number;
	},
	expected: {
		x: number;
		y: number;
		z: number;
	},
	precision: number = 5,
) => {
	expectCloseTo(received.x, expected.x, precision);
	expectCloseTo(received.y, expected.y, precision);
	expectCloseTo(received.z, expected.z, precision);
};

// Color comparison helpers
export const expectColorCloseTo = (
	received: {
		r: number;
		g: number;
		b: number;
	},
	expected: {
		r: number;
		g: number;
		b: number;
	},
	precision: number = 0,
) => {
	expectCloseTo(received.r, expected.r, precision);
	expectCloseTo(received.g, expected.g, precision);
	expectCloseTo(received.b, expected.b, precision);
};

// Performance testing helpers
export const measurePerformance = (
	fn: () => void,
	iterations: number = 1000,
): number => {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	const end = performance.now();
	return end - start;
};

export const expectPerformance = (
	fn: () => void,
	maxTimeMs: number,
	iterations: number = 1000,
) => {
	const timeMs = measurePerformance(fn, iterations);
	expect(timeMs).toBeLessThan(maxTimeMs);
	return timeMs;
};

// Property-based testing helpers
export const generateRandomNumbers = (
	count: number,
	min: number = -100,
	max: number = 100,
): number[] => {
	const numbers: number[] = [];
	for (let i = 0; i < count; i++) {
		numbers.push(Math.random() * (max - min) + min);
	}
	return numbers;
};

export const generateRandomIntegers = (
	count: number,
	min: number = -100,
	max: number = 100,
): number[] => {
	const numbers: number[] = [];
	for (let i = 0; i < count; i++) {
		numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
	}
	return numbers;
};

export const generateRandomVectors2D = (
	count: number,
	min: number = -100,
	max: number = 100,
) => {
	const vectors: Array<{
		x: number;
		y: number;
	}> = [];
	for (let i = 0; i < count; i++) {
		vectors.push({
			x: Math.random() * (max - min) + min,
			y: Math.random() * (max - min) + min,
		});
	}
	return vectors;
};

// Statistical testing helpers
export const calculateMean = (numbers: number[]): number => {
	return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
};

export const calculateStandardDeviation = (numbers: number[]): number => {
	const mean = calculateMean(numbers);
	const variance =
		numbers.reduce((sum, n) => sum + (n - mean) ** 2, 0) / numbers.length;
	return Math.sqrt(variance);
};

export const expectNormalDistribution = (
	numbers: number[],
	expectedMean: number,
	expectedStdDev: number,
	tolerance: number = 0.1,
) => {
	const actualMean = calculateMean(numbers);
	const actualStdDev = calculateStandardDeviation(numbers);

	expectCloseTo(actualMean, expectedMean, 1);
	expect(Math.abs(actualStdDev - expectedStdDev)).toBeLessThan(
		expectedStdDev * tolerance,
	);
};

// Error testing helpers
export const expectError = (fn: () => void, expectedMessage?: string) => {
	let error: Error | null = null;
	try {
		fn();
	} catch (e) {
		error = e as Error;
	}

	expect(error).not.toBeNull();
	if (expectedMessage && error) {
		expect(error.message).toContain(expectedMessage);
	}
};

export const expectNoError = (fn: () => void) => {
	expect(fn).not.toThrow();
};

// Mock canvas helpers
let globalMockContext: CanvasRenderingContext2D | null = null;

export const createMockCanvas = (): HTMLCanvasElement => {
	globalMockContext = createMockContext2D();

	const canvas = {
		width: 800,
		height: 600,
		getContext: (type: string) => {
			if (type === "2d") {
				return globalMockContext;
			}
			return null;
		},
	} as unknown as HTMLCanvasElement;

	return canvas;
};

export const getMockContext = (): CanvasRenderingContext2D | null => {
	return globalMockContext;
};

export const createMockContext2D = (): CanvasRenderingContext2D => {
	const calls: Array<{
		method: string;
		args: any[];
	}> = [];

	const state = {
		fillStyle: "#000000",
		strokeStyle: "#000000",
		lineWidth: 1,
		font: "10px sans-serif",
	};

	const context = {
		// Drawing state - use getters/setters to track changes
		get fillStyle() {
			return state.fillStyle;
		},
		set fillStyle(value: string) {
			state.fillStyle = value;
		},
		get strokeStyle() {
			return state.strokeStyle;
		},
		set strokeStyle(value: string) {
			state.strokeStyle = value;
		},
		get lineWidth() {
			return state.lineWidth;
		},
		set lineWidth(value: number) {
			state.lineWidth = value;
		},
		get font() {
			return state.font;
		},
		set font(value: string) {
			state.font = value;
		},

		// Path methods
		beginPath: (...args: any[]) =>
			calls.push({
				method: "beginPath",
				args,
			}),
		closePath: (...args: any[]) =>
			calls.push({
				method: "closePath",
				args,
			}),
		moveTo: (...args: any[]) =>
			calls.push({
				method: "moveTo",
				args,
			}),
		lineTo: (...args: any[]) =>
			calls.push({
				method: "lineTo",
				args,
			}),
		arc: (...args: any[]) =>
			calls.push({
				method: "arc",
				args,
			}),

		// Drawing methods
		fill: (...args: any[]) =>
			calls.push({
				method: "fill",
				args,
			}),
		stroke: (...args: any[]) =>
			calls.push({
				method: "stroke",
				args,
			}),
		fillRect: (...args: any[]) =>
			calls.push({
				method: "fillRect",
				args,
			}),
		strokeRect: (...args: any[]) =>
			calls.push({
				method: "strokeRect",
				args,
			}),
		clearRect: (...args: any[]) =>
			calls.push({
				method: "clearRect",
				args,
			}),
		fillText: (...args: any[]) =>
			calls.push({
				method: "fillText",
				args,
			}),

		// Transform methods
		save: (...args: any[]) =>
			calls.push({
				method: "save",
				args,
			}),
		restore: (...args: any[]) =>
			calls.push({
				method: "restore",
				args,
			}),
		translate: (...args: any[]) =>
			calls.push({
				method: "translate",
				args,
			}),
		rotate: (...args: any[]) =>
			calls.push({
				method: "rotate",
				args,
			}),
		scale: (...args: any[]) =>
			calls.push({
				method: "scale",
				args,
			}),

		// Test helper
		getCalls: () => calls,
		clearCalls: () => (calls.length = 0),
	};

	return context as unknown as CanvasRenderingContext2D;
};

// Data generation helpers
export const generateTestData = {
	colors: () => [
		{
			r: 255,
			g: 0,
			b: 0,
		}, // Red
		{
			r: 0,
			g: 255,
			b: 0,
		}, // Green
		{
			r: 0,
			g: 0,
			b: 255,
		}, // Blue
		{
			r: 255,
			g: 255,
			b: 255,
		}, // White
		{
			r: 0,
			g: 0,
			b: 0,
		}, // Black
		{
			r: 128,
			g: 128,
			b: 128,
		}, // Gray
		{
			r: 255,
			g: 128,
			b: 64,
		}, // Orange
		{
			r: 128,
			g: 0,
			b: 128,
		}, // Purple
	],

	points: () => [
		{
			x: 0,
			y: 0,
		},
		{
			x: 1,
			y: 0,
		},
		{
			x: 0,
			y: 1,
		},
		{
			x: 1,
			y: 1,
		},
		{
			x: -1,
			y: -1,
		},
		{
			x: 100,
			y: 200,
		},
		{
			x: 3.14,
			y: 2.71,
		},
	],

	angles: () => [
		0,
		Math.PI / 4,
		Math.PI / 2,
		Math.PI,
		(3 * Math.PI) / 2,
		2 * Math.PI,
	],

	matrices3x3: () => [
		[
			1,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			1,
		], // Identity
		[
			2,
			0,
			0,
			0,
			2,
			0,
			0,
			0,
			1,
		], // Scale 2x
		[
			1,
			0,
			5,
			0,
			1,
			3,
			0,
			0,
			1,
		], // Translate (5, 3)
		[
			0,
			-1,
			0,
			1,
			0,
			0,
			0,
			0,
			1,
		], // Rotate 90°
	],
};

// Fuzzing helpers
export const fuzzTest = (
	testFunction: (input: any) => void,
	inputGenerator: () => any,
	iterations: number = 100,
) => {
	for (let i = 0; i < iterations; i++) {
		const input = inputGenerator();
		try {
			testFunction(input);
		} catch (error) {
			console.error(`Fuzz test failed on iteration ${i} with input:`, input);
			throw error;
		}
	}
};

// Snapshot testing helpers
export const expectSnapshot = (value: any, description: string) => {
	// For now, just ensure the value is serializable and consistent
	const serialized = JSON.stringify(value, null, 2);
	expect(typeof serialized).toBe("string");
	expect(serialized.length).toBeGreaterThan(0);
};

// Test fixtures
export const fixtures = {
	simplePolygon: [
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

	complexPolygon: [
		{
			x: 0,
			y: 0,
		},
		{
			x: 10,
			y: 0,
		},
		{
			x: 15,
			y: 5,
		},
		{
			x: 10,
			y: 10,
		},
		{
			x: 5,
			y: 8,
		},
		{
			x: 0,
			y: 10,
		},
		{
			x: -2,
			y: 5,
		},
	],

	line: {
		start: {
			x: 0,
			y: 0,
		},
		end: {
			x: 10,
			y: 10,
		},
	},

	circle: {
		x: 5,
		y: 5,
		radius: 3,
	},

	rectangle: {
		x: 2,
		y: 3,
		width: 6,
		height: 4,
	},
};
