/**
 * Animation and easing utilities for smooth transitions and motion graphics.
 *
 * This module provides comprehensive animation tools including easing functions,
 * tweening systems, and animation loops commonly used in creative coding,
 * user interfaces, and interactive applications. All functions are optimized
 * for 60fps performance and smooth visual transitions.
 *
 * @remarks
 * The animation system is built around several key concepts:
 *
 * **Easing Functions:**
 * - Transform linear time progression (0-1) into non-linear motion curves
 * - Provide natural-feeling acceleration and deceleration
 * - Based on Robert Penner's easing equations and CSS timing functions
 * - Categories: Quadratic, Cubic, Sine, Exponential, Circular, Back, Elastic, Bounce
 *
 * **Easing Modes:**
 * - **In**: Starts slow, accelerates toward the end
 * - **Out**: Starts fast, decelerates toward the end
 * - **InOut**: Combines both - slow start and end, fast middle
 *
 * **Animation Systems:**
 * - **Tween**: Animate single values between start and end states
 * - **Spring**: Physics-based animation with damping and oscillation
 * - **AnimationLoop**: Manage multiple animations with delta time
 * - **Timeline**: Sequence and coordinate multiple animations
 *
 * @example
 * Basic easing function usage:
 * ```typescript
 * import { easeInOutCubic, easeOutBounce } from 'play.ts';
 *
 * // Smooth UI transition
 * const progress = elapsedTime / duration;  // 0 to 1
 * const easedProgress = easeInOutCubic(progress);
 * const currentValue = startValue + (endValue - startValue) * easedProgress;
 *
 * // Bouncy entrance effect
 * const bounceProgress = easeOutBounce(progress);
 * element.style.transform = `scale(${bounceProgress})`;
 * ```
 *
 * @example
 * Complete animation system:
 * ```typescript
 * import { tween, easeOutExpo, AnimationLoop } from 'play.ts';
 *
 * const loop = new AnimationLoop();
 *
 * // Animate object position
 * tween({
 *   from: 0,
 *   to: 100,
 *   duration: 1000,
 *   easing: easeOutExpo,
 *   onUpdate: (value) => {
 *     object.x = value;
 *   },
 *   onComplete: () => {
 *     console.log('Animation finished');
 *   }
 * });
 *
 * loop.start();
 * ```
 *
 * @example
 * Physics-based spring animation:
 * ```typescript
 * import { Spring } from 'play.ts';
 *
 * const spring = new Spring({
 *   stiffness: 200,    // How quickly it moves toward target
 *   damping: 10,       // How much it oscillates
 *   mass: 1           // Inertia of the system
 * });
 *
 * spring.setTarget(100);  // Animate to position 100
 *
 * // In animation loop
 * spring.update(deltaTime);
 * object.x = spring.getCurrentValue();
 * ```
 *
 * @see {@link https://easings.net/ | Easing Functions Visualized}
 * @see {@link https://cubic-bezier.com/ | Cubic Bezier Timing Function}
 * @see {@link https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame | RequestAnimationFrame}
 */

import type { AnimationFrame, EasingFunction } from "../types/index.ts";
import { clamp, cos, PI, pow, sin, sqrt } from "./math.ts";

// ============================================================================
// Browser Compatibility
// ============================================================================

/**
 * Cross-platform requestAnimationFrame with Node.js fallback.
 *
 * @remarks
 * Provides consistent 60fps animation timing across browser and server environments.
 * In browsers, uses the native requestAnimationFrame for optimal performance.
 * In Node.js, falls back to setTimeout with 16ms interval (~60fps).
 */
const requestAnimationFrame =
	(typeof window !== "undefined" && window.requestAnimationFrame) ||
	((callback: FrameRequestCallback) => setTimeout(callback, 16));

// ============================================================================
// Core Easing Functions
// ============================================================================

/**
 * Linear easing function - no acceleration or deceleration.
 *
 * @param t - Time progress from 0 to 1
 * @returns Linear interpolation value (same as input)
 *
 * @remarks
 * The simplest easing function that produces constant velocity motion.
 * Useful as a baseline and for mechanical or robotic movement where
 * smooth acceleration isn't desired.
 *
 * Mathematical formula: `f(t) = t`
 *
 * @example
 * ```typescript
 * const progress = linear(0.5);  // Returns 0.5
 *
 * // Constant speed animation
 * const position = startPos + (endPos - startPos) * linear(t);
 * ```
 *
 * @see {@link easeInOutCubic} for smooth acceleration/deceleration
 */
export const linear: EasingFunction = (t: number): number => t;

// ============================================================================
// Quadratic Easing Functions
// ============================================================================

/**
 * Quadratic ease-in - starts slow, accelerates quickly.
 *
 * @param t - Time progress from 0 to 1
 * @returns Eased progress value
 *
 * @remarks
 * Creates gentle acceleration from rest to full speed. Perfect for:
 * - Objects starting to move from stationary position
 * - UI elements appearing from offscreen
 * - Building momentum in sequences
 *
 * Mathematical formula: `f(t) = t²`
 *
 * @example
 * ```typescript
 * // Smooth object acceleration
 * const speed = maxSpeed * easeInQuad(accelerationProgress);
 *
 * // UI slide-in animation
 * const position = startX + distance * easeInQuad(t);
 * ```
 */
export const easeInQuad: EasingFunction = (t: number): number => t * t;

/**
 * Quadratic ease-out - starts fast, decelerates smoothly.
 *
 * @param t - Time progress from 0 to 1
 * @returns Eased progress value
 *
 * @remarks
 * Creates smooth deceleration to a gentle stop. Ideal for:
 * - Objects coming to rest naturally
 * - UI elements settling into position
 * - Comfortable stopping motion
 *
 * Mathematical formula: `f(t) = t(2-t)`
 *
 * @example
 * ```typescript
 * // Smooth deceleration to target
 * const progress = easeOutQuad(t);
 * const currentPos = lerp(startPos, targetPos, progress);
 *
 * // Natural settling animation
 * const scale = 0.8 + 0.2 * easeOutQuad(settleProgress);
 * ```
 */
export const easeOutQuad: EasingFunction = (t: number): number => t * (2 - t);

/**
 * Quadratic ease-in-out - slow start and end, fast middle.
 *
 * @param t - Time progress from 0 to 1
 * @returns Eased progress value
 *
 * @remarks
 * Combines the best of ease-in and ease-out for smooth, natural motion.
 * Most commonly used easing function for UI animations. Perfect for:
 * - Modal dialogs and overlays
 * - Page transitions
 * - General UI element animations
 * - Any motion that should feel natural and comfortable
 *
 * Mathematical formula: `f(t) = t < 0.5 ? 2t² : -1 + (4-2t)t`
 *
 * @example
 * ```typescript
 * // Standard UI animation
 * const progress = easeInOutQuad(t);
 * const opacity = progress;  // Fade in/out
 * const scale = 0.9 + 0.1 * progress;  // Slight scale effect
 *
 * // Page transition
 * const slideOffset = (1 - easeInOutQuad(t)) * windowWidth;
 * ```
 */
export const easeInOutQuad: EasingFunction = (t: number): number => {
	return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

// ============================================================================
// Cubic Easing Functions
// ============================================================================

/**
 * Cubic ease-in - gentle start with strong acceleration.
 *
 * @param t - Time progress from 0 to 1
 * @returns Eased progress value
 *
 * @remarks
 * More dramatic acceleration than quadratic, creating a stronger sense of
 * building momentum. Excellent for:
 * - Heavy objects starting to move
 * - Dramatic entrance effects
 * - Building anticipation in sequences
 *
 * Mathematical formula: `f(t) = t³`
 *
 * @example
 * ```typescript
 * // Dramatic zoom-in effect
 * const scale = 0.1 + 0.9 * easeInCubic(t);
 *
 * // Heavy object acceleration
 * const velocity = maxVelocity * easeInCubic(t);
 * ```
 */
export const easeInCubic: EasingFunction = (t: number): number => t * t * t;

/**
 * Cubic ease-out - strong start with gentle deceleration.
 *
 * @param t - Time progress from 0 to 1
 * @returns Eased progress value
 *
 * @remarks
 * Creates elegant deceleration with a satisfying settling motion.
 * Popular choice for:
 * - Objects coming to rest with weight
 * - Smooth UI transitions
 * - Natural-feeling stops
 *
 * Mathematical formula: `f(t) = 1 + (t-1)³`
 *
 * @example
 * ```typescript
 * // Smooth object settling
 * const progress = easeOutCubic(t);
 * const position = lerp(startPos, endPos, progress);
 *
 * // Elegant fade-in
 * const opacity = easeOutCubic(fadeProgress);
 * ```
 */
export const easeOutCubic: EasingFunction = (t: number): number => {
	return 1 + --t * t * t;
};

/**
 * Cubic ease-in-out - smooth acceleration and deceleration.
 *
 * @param t - Time progress from 0 to 1
 * @returns Eased progress value
 *
 * @remarks
 * Provides more dramatic easing than quadratic while maintaining smoothness.
 * The gold standard for many animation types:
 * - Modal and dialog animations
 * - Smooth page transitions
 * - Professional UI motion
 * - Object movement with weight
 *
 * Mathematical formula: `f(t) = t < 0.5 ? 4t³ : 1 - 4(1-t)³`
 *
 * @example
 * ```typescript
 * // Professional modal animation
 * const modalProgress = easeInOutCubic(t);
 * const scale = 0.8 + 0.2 * modalProgress;
 * const opacity = modalProgress;
 *
 * // Smooth camera movement
 * const cameraPos = vec2Lerp(startPos, endPos, easeInOutCubic(t));
 * ```
 */
export const easeInOutCubic: EasingFunction = (t: number): number => {
	return t < 0.5 ? 4 * t * t * t : 1 - 4 * (1 - t) * (1 - t) * (1 - t);
};

// Quartic easing functions
export const easeInQuart: EasingFunction = (t: number): number =>
	t * t * t * t;

export const easeOutQuart: EasingFunction = (t: number): number => {
	return 1 - --t * t * t * t;
};

export const easeInOutQuart: EasingFunction = (t: number): number => {
	return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
};

// Quintic easing functions
export const easeInQuint: EasingFunction = (t: number): number =>
	t * t * t * t * t;

export const easeOutQuint: EasingFunction = (t: number): number => {
	return 1 + --t * t * t * t * t;
};

export const easeInOutQuint: EasingFunction = (t: number): number => {
	return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
};

// ============================================================================
// Sinusoidal Easing Functions
// ============================================================================

/**
 * Sinusoidal ease-in - very gentle acceleration based on sine wave.
 *
 * @param t - Time progress from 0 to 1
 * @returns Eased progress value
 *
 * @remarks
 * Creates the gentlest possible acceleration using a quarter sine wave.
 * Perfect for:
 * - Subtle, organic motion
 * - Natural breathing or oscillating effects
 * - Delicate UI micro-interactions
 * - Smooth audio-visual synchronization
 *
 * Mathematical formula: `f(t) = 1 - cos(tπ/2)`
 *
 * @example
 * ```typescript
 * // Gentle breathing effect
 * const breathScale = 1 + 0.05 * easeInSine(breathProgress);
 *
 * // Subtle hover animation
 * const hoverOffset = 2 * easeInSine(hoverProgress);
 * ```
 */
export const easeInSine: EasingFunction = (t: number): number => {
	return 1 - cos((t * PI) / 2);
};

/**
 * Sinusoidal ease-out - very gentle deceleration based on sine wave.
 *
 * @param t - Time progress from 0 to 1
 * @returns Eased progress value
 *
 * @remarks
 * Provides the smoothest possible deceleration using a quarter sine wave.
 * Ideal for:
 * - Natural settling motions
 * - Organic fade effects
 * - Smooth audio transitions
 * - Gentle stopping animations
 *
 * Mathematical formula: `f(t) = sin(tπ/2)`
 *
 * @example
 * ```typescript
 * // Natural fade-out
 * const fadeOpacity = easeOutSine(fadeProgress);
 *
 * // Gentle settling motion
 * const settleProgress = easeOutSine(t);
 * const position = lerp(startPos, targetPos, settleProgress);
 * ```
 */
export const easeOutSine: EasingFunction = (t: number): number => {
	return sin((t * PI) / 2);
};

/**
 * Sinusoidal ease-in-out - gentle acceleration and deceleration.
 *
 * @param t - Time progress from 0 to 1
 * @returns Eased progress value
 *
 * @remarks
 * The most organic and natural-feeling easing function, following a
 * half sine wave. Excellent for:
 * - Natural, organic motion
 * - Breathing and pulsing effects
 * - Smooth cyclical animations
 * - Audio-synchronized motion
 *
 * Mathematical formula: `f(t) = 0.5(1 - cos(πt))`
 *
 * @example
 * ```typescript
 * // Natural pulsing effect
 * const pulseScale = 1 + 0.1 * easeInOutSine(pulseProgress);
 *
 * // Organic page transition
 * const slideProgress = easeInOutSine(t);
 * const offset = (1 - slideProgress) * pageWidth;
 * ```
 */
export const easeInOutSine: EasingFunction = (t: number): number => {
	return 0.5 * (1 - cos(PI * t));
};

// Exponential easing functions
export const easeInExpo: EasingFunction = (t: number): number => {
	return t === 0 ? 0 : pow(2, 10 * (t - 1));
};

export const easeOutExpo: EasingFunction = (t: number): number => {
	return t === 1 ? 1 : 1 - pow(2, -10 * t);
};

export const easeInOutExpo: EasingFunction = (t: number): number => {
	if (t === 0) return 0;
	if (t === 1) return 1;
	return t < 0.5
		? 0.5 * pow(2, 20 * t - 10)
		: 0.5 * (2 - pow(2, -20 * t + 10));
};

// Circular easing functions
export const easeInCirc: EasingFunction = (t: number): number => {
	return 1 - sqrt(1 - t * t);
};

export const easeOutCirc: EasingFunction = (t: number): number => {
	return sqrt(1 - --t * t);
};

export const easeInOutCirc: EasingFunction = (t: number): number => {
	return t < 0.5
		? 0.5 * (1 - sqrt(1 - 4 * t * t))
		: 0.5 * (sqrt(1 - (2 * t - 2) * (2 * t - 2)) + 1);
};

// Back easing functions
export const easeInBack: EasingFunction = (t: number): number => {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return c3 * t * t * t - c1 * t * t;
};

export const easeOutBack: EasingFunction = (t: number): number => {
	const c1 = 1.70158;
	const c3 = c1 + 1;
	return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2);
};

export const easeInOutBack: EasingFunction = (t: number): number => {
	const c1 = 1.70158;
	const c2 = c1 * 1.525;
	return t < 0.5
		? (pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
		: (pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
};

// Elastic easing functions
export const easeInElastic: EasingFunction = (t: number): number => {
	const c4 = (2 * PI) / 3;
	return t === 0
		? 0
		: t === 1
			? 1
			: -pow(2, 10 * t - 10) * sin((t * 10 - 10.75) * c4);
};

export const easeOutElastic: EasingFunction = (t: number): number => {
	const c4 = (2 * PI) / 3;
	return t === 0
		? 0
		: t === 1
			? 1
			: pow(2, -10 * t) * sin((t * 10 - 0.75) * c4) + 1;
};

export const easeInOutElastic: EasingFunction = (t: number): number => {
	const c5 = (2 * PI) / 4.5;
	return t === 0
		? 0
		: t === 1
			? 1
			: t < 0.5
				? -(pow(2, 20 * t - 10) * sin((20 * t - 11.125) * c5)) / 2
				: (pow(2, -20 * t + 10) * sin((20 * t - 11.125) * c5)) / 2 + 1;
};

// Bounce easing functions
export const easeInBounce: EasingFunction = (t: number): number => {
	return 1 - easeOutBounce(1 - t);
};

export const easeOutBounce: EasingFunction = (t: number): number => {
	const n1 = 7.5625;
	const d1 = 2.75;

	if (t < 1 / d1) {
		return n1 * t * t;
	} else if (t < 2 / d1) {
		return n1 * (t -= 1.5 / d1) * t + 0.75;
	} else if (t < 2.5 / d1) {
		return n1 * (t -= 2.25 / d1) * t + 0.9375;
	} else {
		return n1 * (t -= 2.625 / d1) * t + 0.984375;
	}
};

export const easeInOutBounce: EasingFunction = (t: number): number => {
	return t < 0.5
		? (1 - easeOutBounce(1 - 2 * t)) / 2
		: (1 + easeOutBounce(2 * t - 1)) / 2;
};

// Easing collection
export const easings = {
	linear,
	easeInQuad,
	easeOutQuad,
	easeInOutQuad,
	easeInCubic,
	easeOutCubic,
	easeInOutCubic,
	easeInQuart,
	easeOutQuart,
	easeInOutQuart,
	easeInQuint,
	easeOutQuint,
	easeInOutQuint,
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
} as const;

// Animation frame utilities
export const createAnimationFrame = (
	time: number,
	deltaTime: number,
	frame: number,
): AnimationFrame => ({
	time,
	deltaTime,
	frame,
});

// Animation loop utilities
export class AnimationLoop {
	private running = false;
	private startTime = 0;
	private lastTime = 0;
	private frameCount = 0;
	private callbacks: Array<(frame: AnimationFrame) => void> = [];

	start(): void {
		if (this.running) return;

		this.running = true;
		this.startTime = performance.now();
		this.lastTime = this.startTime;
		this.frameCount = 0;

		this.loop();
	}

	stop(): void {
		this.running = false;
	}

	onFrame(callback: (frame: AnimationFrame) => void): () => void {
		this.callbacks.push(callback);

		// Return unsubscribe function
		return () => {
			const index = this.callbacks.indexOf(callback);
			if (index > -1) {
				this.callbacks.splice(index, 1);
			}
		};
	}

	private loop(): void {
		if (!this.running) return;

		const currentTime = performance.now();
		const deltaTime = currentTime - this.lastTime;
		const totalTime = currentTime - this.startTime;

		const frame = createAnimationFrame(totalTime, deltaTime, this.frameCount);

		this.callbacks.forEach((callback) => callback(frame));

		this.lastTime = currentTime;
		this.frameCount++;

		requestAnimationFrame(() => this.loop());
	}
}

// Tween utilities
export class Tween {
	private startValue: number;
	private endValue: number;
	private duration: number;
	private easing: EasingFunction;
	private onUpdate: (value: number) => void;
	private onComplete?: () => void;
	private startTime = 0;
	private running = false;

	constructor(
		startValue: number,
		endValue: number,
		duration: number,
		easing: EasingFunction = linear,
		onUpdate: (value: number) => void,
		onComplete?: () => void,
	) {
		this.startValue = startValue;
		this.endValue = endValue;
		this.duration = duration;
		this.easing = easing;
		this.onUpdate = onUpdate;
		this.onComplete = onComplete;
	}

	start(): void {
		if (this.running) return;

		this.running = true;
		this.startTime = performance.now();
		this.update();
	}

	stop(): void {
		this.running = false;
	}

	private update(): void {
		if (!this.running) return;

		const currentTime = performance.now();
		const elapsed = currentTime - this.startTime;
		const progress = clamp(elapsed / this.duration, 0, 1);

		const easedProgress = this.easing(progress);
		const currentValue =
			this.startValue + (this.endValue - this.startValue) * easedProgress;

		this.onUpdate(currentValue);

		if (progress >= 1) {
			this.running = false;
			this.onComplete?.();
		} else {
			requestAnimationFrame(() => this.update());
		}
	}
}

// Utility functions for common animations
export const tween = (
	startValue: number,
	endValue: number,
	duration: number,
	easing: EasingFunction = linear,
	onUpdate: (value: number) => void,
	onComplete?: () => void,
): Tween => {
	const tweenInstance = new Tween(
		startValue,
		endValue,
		duration,
		easing,
		onUpdate,
		onComplete,
	);
	tweenInstance.start();
	return tweenInstance;
};

export const delay = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export const animate = (
	duration: number,
	easing: EasingFunction = linear,
	onUpdate: (progress: number) => void,
	onComplete?: () => void,
): Tween => {
	return tween(0, 1, duration, easing, onUpdate, onComplete);
};

// Spring animation utilities
export class Spring {
	private value: number;
	private target: number;
	private velocity = 0;
	private stiffness: number;
	private damping: number;
	private mass: number;
	private onUpdate: (value: number) => void;
	private running = false;

	constructor(
		initialValue: number,
		stiffness: number = 0.1,
		damping: number = 0.8,
		mass: number = 1,
		onUpdate: (value: number) => void,
	) {
		this.value = initialValue;
		this.target = initialValue;
		this.stiffness = stiffness;
		this.damping = damping;
		this.mass = mass;
		this.onUpdate = onUpdate;
	}

	setTarget(target: number): void {
		this.target = target;
		if (!this.running) {
			this.start();
		}
	}

	setValue(value: number): void {
		this.value = value;
		this.velocity = 0;
		this.onUpdate(this.value);
	}

	start(): void {
		if (this.running) return;
		this.running = true;
		this.update();
	}

	stop(): void {
		this.running = false;
	}

	private update(): void {
		if (!this.running) return;

		const force = -this.stiffness * (this.value - this.target);
		const acceleration = force / this.mass;

		this.velocity += acceleration;
		this.velocity *= this.damping;
		this.value += this.velocity;

		this.onUpdate(this.value);

		// Stop if close enough to target and velocity is low
		if (
			Math.abs(this.value - this.target) < 0.001 &&
			Math.abs(this.velocity) < 0.001
		) {
			this.value = this.target;
			this.velocity = 0;
			this.onUpdate(this.value);
			this.running = false;
		} else {
			requestAnimationFrame(() => this.update());
		}
	}
}

export const spring = (
	initialValue: number,
	stiffness: number = 0.1,
	damping: number = 0.8,
	mass: number = 1,
	onUpdate: (value: number) => void,
): Spring => {
	return new Spring(initialValue, stiffness, damping, mass, onUpdate);
};
