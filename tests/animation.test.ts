import { beforeEach, describe, expect, jest, test } from "bun:test";
import {
	AnimationLoop,
	animate,
	delay,
	easeInBack,
	easeInBounce,
	easeInCirc,
	easeInCubic,
	easeInElastic,
	easeInExpo,
	easeInOutBack,
	easeInOutBounce,
	easeInOutCirc,
	easeInOutCubic,
	easeInOutElastic,
	easeInOutExpo,
	easeInOutQuad,
	easeInOutSine,
	easeInQuad,
	easeInSine,
	easeOutBack,
	easeOutBounce,
	easeOutCirc,
	easeOutCubic,
	easeOutElastic,
	easeOutExpo,
	easeOutQuad,
	easeOutSine,
	easings,
	linear,
	Spring,
	spring,
	Tween,
	tween,
} from "../src/animation.ts";

describe("Animation utilities", () => {
	describe("Easing functions", () => {
		test("linear easing", () => {
			expect(linear(0)).toBe(0);
			expect(linear(0.5)).toBe(0.5);
			expect(linear(1)).toBe(1);
		});

		test("quadratic easing", () => {
			expect(easeInQuad(0)).toBe(0);
			expect(easeInQuad(1)).toBe(1);
			expect(easeInQuad(0.5)).toBe(0.25);

			expect(easeOutQuad(0)).toBe(0);
			expect(easeOutQuad(1)).toBe(1);
			expect(easeOutQuad(0.5)).toBe(0.75);

			expect(easeInOutQuad(0)).toBe(0);
			expect(easeInOutQuad(1)).toBe(1);
			expect(easeInOutQuad(0.5)).toBe(0.5);
		});

		test("cubic easing", () => {
			expect(easeInCubic(0)).toBe(0);
			expect(easeInCubic(1)).toBe(1);
			expect(easeInCubic(0.5)).toBe(0.125);

			expect(easeOutCubic(0)).toBe(0);
			expect(easeOutCubic(1)).toBe(1);

			expect(easeInOutCubic(0)).toBe(0);
			expect(easeInOutCubic(1)).toBe(1);
		});

		test("sine easing", () => {
			expect(easeInSine(0)).toBe(0);
			expect(easeInSine(1)).toBeCloseTo(1, 10);

			expect(easeOutSine(0)).toBe(0);
			expect(easeOutSine(1)).toBeCloseTo(1, 10);

			expect(easeInOutSine(0)).toBe(0);
			expect(easeInOutSine(1)).toBeCloseTo(1, 10);
			expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 10);
		});

		test("exponential easing", () => {
			expect(easeInExpo(0)).toBe(0);
			expect(easeInExpo(1)).toBe(1);

			expect(easeOutExpo(0)).toBe(0);
			expect(easeOutExpo(1)).toBe(1);

			expect(easeInOutExpo(0)).toBe(0);
			expect(easeInOutExpo(1)).toBe(1);
		});

		test("circular easing", () => {
			expect(easeInCirc(0)).toBe(0);
			expect(easeInCirc(1)).toBe(1);

			expect(easeOutCirc(0)).toBe(0);
			expect(easeOutCirc(1)).toBe(1);

			expect(easeInOutCirc(0)).toBe(0);
			expect(easeInOutCirc(1)).toBe(1);
		});

		test("back easing", () => {
			expect(easeInBack(0)).toBeCloseTo(0, 10);
			expect(easeInBack(1)).toBeCloseTo(1, 10);

			expect(easeOutBack(0)).toBeCloseTo(0, 10);
			expect(easeOutBack(1)).toBeCloseTo(1, 10);

			expect(easeInOutBack(0)).toBeCloseTo(0, 10);
			expect(easeInOutBack(1)).toBeCloseTo(1, 10);
		});

		test("elastic easing", () => {
			expect(easeInElastic(0)).toBe(0);
			expect(easeInElastic(1)).toBe(1);

			expect(easeOutElastic(0)).toBe(0);
			expect(easeOutElastic(1)).toBe(1);

			expect(easeInOutElastic(0)).toBe(0);
			expect(easeInOutElastic(1)).toBe(1);
		});

		test("bounce easing", () => {
			expect(easeInBounce(0)).toBe(0);
			expect(easeInBounce(1)).toBe(1);

			expect(easeOutBounce(0)).toBe(0);
			expect(easeOutBounce(1)).toBe(1);

			expect(easeInOutBounce(0)).toBe(0);
			expect(easeInOutBounce(1)).toBe(1);
		});

		test("easings collection", () => {
			expect(easings.linear).toBe(linear);
			expect(easings.easeInQuad).toBe(easeInQuad);
			expect(easings.easeOutQuad).toBe(easeOutQuad);
			expect(easings.easeInOutQuad).toBe(easeInOutQuad);
		});

		test("easing functions are continuous", () => {
			const easingFunctions = [
				easeInQuad,
				easeOutQuad,
				easeInOutQuad,
				easeInCubic,
				easeOutCubic,
				easeInOutCubic,
				easeInSine,
				easeOutSine,
				easeInOutSine,
				easeInCirc,
				easeOutCirc,
				easeInOutCirc,
			];

			for (const easingFn of easingFunctions) {
				// Test continuity at several points
				for (let t = 0.1; t < 1; t += 0.1) {
					const value = easingFn(t);
					expect(typeof value).toBe("number");
					expect(isNaN(value)).toBe(false);
					expect(isFinite(value)).toBe(true);
				}
			}
		});
	});

	describe("AnimationLoop", () => {
		let animationLoop: AnimationLoop;

		beforeEach(() => {
			animationLoop = new AnimationLoop();
		});

		test("creates animation loop", () => {
			expect(animationLoop).toBeInstanceOf(AnimationLoop);
		});

		test("onFrame returns unsubscribe function", () => {
			const callback = jest.fn();
			const unsubscribe = animationLoop.onFrame(callback);

			expect(typeof unsubscribe).toBe("function");
		});

		test("start and stop methods exist", () => {
			expect(typeof animationLoop.start).toBe("function");
			expect(typeof animationLoop.stop).toBe("function");
		});
	});

	describe("Tween", () => {
		test("creates tween", () => {
			const onUpdate = jest.fn();
			const tweenInstance = new Tween(0, 100, 1000, linear, onUpdate);

			expect(tweenInstance).toBeInstanceOf(Tween);
		});

		test("tween utility function", () => {
			const onUpdate = jest.fn();
			const tweenInstance = tween(0, 100, 1000, linear, onUpdate);

			expect(tweenInstance).toBeInstanceOf(Tween);
		});

		test("animate utility function", () => {
			const onUpdate = jest.fn();
			const tweenInstance = animate(1000, linear, onUpdate);

			expect(tweenInstance).toBeInstanceOf(Tween);
		});
	});

	describe("Spring", () => {
		test("creates spring", () => {
			const onUpdate = jest.fn();
			const springInstance = new Spring(0, 0.1, 0.8, 1, onUpdate);

			expect(springInstance).toBeInstanceOf(Spring);
		});

		test("spring utility function", () => {
			const onUpdate = jest.fn();
			const springInstance = spring(0, 0.1, 0.8, 1, onUpdate);

			expect(springInstance).toBeInstanceOf(Spring);
		});

		test("setTarget method", () => {
			const onUpdate = jest.fn();
			const springInstance = spring(0, 0.1, 0.8, 1, onUpdate);

			expect(typeof springInstance.setTarget).toBe("function");
			springInstance.setTarget(100);
		});

		test("setValue method", () => {
			const onUpdate = jest.fn();
			const springInstance = spring(0, 0.1, 0.8, 1, onUpdate);

			expect(typeof springInstance.setValue).toBe("function");
			springInstance.setValue(50);
		});
	});

	describe("Utility functions", () => {
		test("delay function", async () => {
			const start = Date.now();
			await delay(100);
			const end = Date.now();

			// Allow some tolerance for timing
			expect(end - start).toBeGreaterThanOrEqual(90);
			expect(end - start).toBeLessThanOrEqual(150);
		});

		test("delay returns promise", () => {
			const result = delay(10);
			expect(result).toBeInstanceOf(Promise);
		});
	});

	describe("Easing function properties", () => {
		test("all easing functions start at 0", () => {
			const easingFunctions = [
				linear,
				easeInQuad,
				easeOutQuad,
				easeInOutQuad,
				easeInCubic,
				easeOutCubic,
				easeInOutCubic,
				easeInSine,
				easeOutSine,
				easeInOutSine,
				easeInExpo,
				easeOutExpo,
				easeInOutExpo,
				easeInCirc,
				easeOutCirc,
				easeInOutCirc,
				easeInBack,
				easeOutBack,
				easeInOutBack,
				easeInElastic,
				easeOutElastic,
				easeInOutElastic,
				easeInBounce,
				easeOutBounce,
				easeInOutBounce,
			];

			for (const easingFn of easingFunctions) {
				expect(easingFn(0)).toBeCloseTo(0, 5);
			}
		});

		test("all easing functions end at 1", () => {
			const easingFunctions = [
				linear,
				easeInQuad,
				easeOutQuad,
				easeInOutQuad,
				easeInCubic,
				easeOutCubic,
				easeInOutCubic,
				easeInSine,
				easeOutSine,
				easeInOutSine,
				easeInExpo,
				easeOutExpo,
				easeInOutExpo,
				easeInCirc,
				easeOutCirc,
				easeInOutCirc,
				easeInBack,
				easeOutBack,
				easeInOutBack,
				easeInElastic,
				easeOutElastic,
				easeInOutElastic,
				easeInBounce,
				easeOutBounce,
				easeInOutBounce,
			];

			for (const easingFn of easingFunctions) {
				expect(easingFn(1)).toBeCloseTo(1, 5);
			}
		});

		test("easeIn functions are slower at start", () => {
			const easeInFunctions = [
				easeInQuad,
				easeInCubic,
				easeInSine,
				easeInExpo,
				easeInCirc,
			];

			for (const easingFn of easeInFunctions) {
				// At t=0.5, easeIn should be less than linear
				expect(easingFn(0.5)).toBeLessThan(linear(0.5));
			}
		});

		test("easeOut functions are faster at start", () => {
			const easeOutFunctions = [
				easeOutQuad,
				easeOutCubic,
				easeOutSine,
				easeOutExpo,
				easeOutCirc,
			];

			for (const easingFn of easeOutFunctions) {
				// At t=0.5, easeOut should be greater than linear
				expect(easingFn(0.5)).toBeGreaterThan(linear(0.5));
			}
		});

		test("easeInOut functions cross linear at midpoint", () => {
			const easeInOutFunctions = [
				easeInOutQuad,
				easeInOutCubic,
				easeInOutSine,
				easeInOutCirc,
			];

			for (const easingFn of easeInOutFunctions) {
				// At t=0.5, easeInOut should equal linear (0.5)
				expect(easingFn(0.5)).toBeCloseTo(0.5, 10);
			}
		});
	});
});
