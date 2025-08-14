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
import type { EasingFunction, AnimationFrame } from '../types/index.ts';
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
export declare const linear: EasingFunction;
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
export declare const easeInQuad: EasingFunction;
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
export declare const easeOutQuad: EasingFunction;
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
export declare const easeInOutQuad: EasingFunction;
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
export declare const easeInCubic: EasingFunction;
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
export declare const easeOutCubic: EasingFunction;
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
export declare const easeInOutCubic: EasingFunction;
export declare const easeInQuart: EasingFunction;
export declare const easeOutQuart: EasingFunction;
export declare const easeInOutQuart: EasingFunction;
export declare const easeInQuint: EasingFunction;
export declare const easeOutQuint: EasingFunction;
export declare const easeInOutQuint: EasingFunction;
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
export declare const easeInSine: EasingFunction;
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
export declare const easeOutSine: EasingFunction;
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
export declare const easeInOutSine: EasingFunction;
export declare const easeInExpo: EasingFunction;
export declare const easeOutExpo: EasingFunction;
export declare const easeInOutExpo: EasingFunction;
export declare const easeInCirc: EasingFunction;
export declare const easeOutCirc: EasingFunction;
export declare const easeInOutCirc: EasingFunction;
export declare const easeInBack: EasingFunction;
export declare const easeOutBack: EasingFunction;
export declare const easeInOutBack: EasingFunction;
export declare const easeInElastic: EasingFunction;
export declare const easeOutElastic: EasingFunction;
export declare const easeInOutElastic: EasingFunction;
export declare const easeInBounce: EasingFunction;
export declare const easeOutBounce: EasingFunction;
export declare const easeInOutBounce: EasingFunction;
export declare const easings: {
    readonly linear: EasingFunction;
    readonly easeInQuad: EasingFunction;
    readonly easeOutQuad: EasingFunction;
    readonly easeInOutQuad: EasingFunction;
    readonly easeInCubic: EasingFunction;
    readonly easeOutCubic: EasingFunction;
    readonly easeInOutCubic: EasingFunction;
    readonly easeInQuart: EasingFunction;
    readonly easeOutQuart: EasingFunction;
    readonly easeInOutQuart: EasingFunction;
    readonly easeInQuint: EasingFunction;
    readonly easeOutQuint: EasingFunction;
    readonly easeInOutQuint: EasingFunction;
    readonly easeInSine: EasingFunction;
    readonly easeOutSine: EasingFunction;
    readonly easeInOutSine: EasingFunction;
    readonly easeInExpo: EasingFunction;
    readonly easeOutExpo: EasingFunction;
    readonly easeInOutExpo: EasingFunction;
    readonly easeInCirc: EasingFunction;
    readonly easeOutCirc: EasingFunction;
    readonly easeInOutCirc: EasingFunction;
    readonly easeInBack: EasingFunction;
    readonly easeOutBack: EasingFunction;
    readonly easeInOutBack: EasingFunction;
    readonly easeInElastic: EasingFunction;
    readonly easeOutElastic: EasingFunction;
    readonly easeInOutElastic: EasingFunction;
    readonly easeInBounce: EasingFunction;
    readonly easeOutBounce: EasingFunction;
    readonly easeInOutBounce: EasingFunction;
};
export declare const createAnimationFrame: (time: number, deltaTime: number, frame: number) => AnimationFrame;
export declare class AnimationLoop {
    private running;
    private startTime;
    private lastTime;
    private frameCount;
    private callbacks;
    start(): void;
    stop(): void;
    onFrame(callback: (frame: AnimationFrame) => void): () => void;
    private loop;
}
export declare class Tween {
    private startValue;
    private endValue;
    private duration;
    private easing;
    private onUpdate;
    private onComplete?;
    private startTime;
    private running;
    constructor(startValue: number, endValue: number, duration: number, easing: EasingFunction | undefined, onUpdate: (value: number) => void, onComplete?: () => void);
    start(): void;
    stop(): void;
    private update;
}
export declare const tween: (startValue: number, endValue: number, duration: number, easing: EasingFunction | undefined, onUpdate: (value: number) => void, onComplete?: () => void) => Tween;
export declare const delay: (ms: number) => Promise<void>;
export declare const animate: (duration: number, easing: EasingFunction | undefined, onUpdate: (progress: number) => void, onComplete?: () => void) => Tween;
export declare class Spring {
    private value;
    private target;
    private velocity;
    private stiffness;
    private damping;
    private mass;
    private onUpdate;
    private running;
    constructor(initialValue: number, stiffness: number | undefined, damping: number | undefined, mass: number | undefined, onUpdate: (value: number) => void);
    setTarget(target: number): void;
    setValue(value: number): void;
    start(): void;
    stop(): void;
    private update;
}
export declare const spring: (initialValue: number, stiffness: number | undefined, damping: number | undefined, mass: number | undefined, onUpdate: (value: number) => void) => Spring;
//# sourceMappingURL=animation.d.ts.map