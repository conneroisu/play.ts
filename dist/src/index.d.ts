/**
 * **play.ts** - Professional TypeScript library for creative coding and interactive graphics.
 *
 * A comprehensive toolkit providing mathematical utilities, animation systems, physics simulation,
 * and procedural generation tools optimized for creative coding, generative art, game development,
 * and interactive visualizations. Built with TypeScript-first design and 60fps performance.
 *
 * @remarks
 * play.ts is designed around the principle of **"Code as Canvas"** - providing powerful,
 * composable utilities that make complex creative programming accessible while maintaining
 * professional-grade performance and type safety.
 *
 * **🎯 Core Philosophy:**
 * - **Performance First**: All functions optimized for 60fps real-time applications
 * - **Type Safety**: Full TypeScript support with comprehensive type definitions
 * - **Composability**: Functions designed to work seamlessly together
 * - **Creative Focus**: APIs designed for artistic expression and experimentation
 * - **Production Ready**: Robust error handling and edge case management
 *
 * **📦 Module Overview:**
 *
 * **{@link math | 🧮 Mathematics}** - Vector operations, interpolation, trigonometry
 * - 2D/3D vector mathematics with full geometric operations
 * - Interpolation functions (linear, smoothstep, bezier curves)
 * - Angle conversions, clamping, mapping, and normalization
 * - Matrix transformations and mathematical constants
 *
 * **{@link color | 🎨 Color Systems}** - RGB/HSL color manipulation and harmony
 * - Comprehensive color space conversions (RGB ↔ HSL ↔ Hex)
 * - Color manipulation (brighten, saturate, hue shift)
 * - Color harmony generation (complementary, triadic, analogous)
 * - CSS-compatible color string output
 *
 * **{@link geometry | 📐 Geometry}** - 2D shapes, collision detection, spatial analysis
 * - Point, rectangle, circle, and polygon operations
 * - Efficient collision detection and intersection testing
 * - Size utilities and aspect ratio management
 * - Curve generation (bezier, quadratic) and path operations
 *
 * **{@link animation | ⚡ Animation}** - Easing functions, tweening, spring physics
 * - Professional easing functions (Robert Penner equations)
 * - Tween and timeline systems for complex animations
 * - Physics-based spring animations with damping
 * - 60fps animation loops with delta time management
 *
 * **{@link random | 🎲 Random & Noise}** - Seeded generation, noise functions, distributions
 * - Deterministic seeded random number generation
 * - Perlin and simplex noise for natural patterns
 * - Specialized distributions (Gaussian, uniform, circular)
 * - Fractal noise for complex textures and terrain
 *
 * **{@link physics | ⚛️ Physics}** - Real-time simulation, forces, particle systems
 * - Newtonian mechanics with realistic force application
 * - Particle systems with mass, velocity, and acceleration
 * - Constraint solving for cloth and rope simulation
 * - Verlet integration for stable physics simulation
 *
 * **{@link fractals | 🌿 Fractals & L-Systems}** - Procedural patterns, organic growth
 * - L-Systems (Lindenmayer Systems) for plant-like growth
 * - Classic fractals (Mandelbrot, Julia, Sierpinski)
 * - Turtle graphics for pattern visualization
 * - Recursive algorithms for infinite detail generation
 *
 * @example
 * **🚀 Quick Start - Animated Particle System:**
 * ```typescript
 * import {
 *   vec2, random, easeOutCubic, hsl, hslToRgb,
 *   Particle, gravity, friction, colorLerp
 * } from 'play.ts';
 *
 * // Create particle system
 * const particles = Array.from({ length: 50 }, () =>
 *   new Particle(
 *     random() * canvas.width,
 *     random() * canvas.height,
 *     (random() - 0.5) * 100,  // Random velocity
 *     (random() - 0.5) * 100,
 *     1,  // Mass
 *     3000  // Lifetime
 *   )
 * );
 *
 * // Animation loop
 * function animate(deltaTime: number) {
 *   particles.forEach(particle => {
 *     // Apply physics
 *     particle.applyForce(gravity(particle.mass, 0.2));
 *     particle.applyForce(friction(particle.velocity, 0.01));
 *     particle.update(deltaTime);
 *
 *     // Animate color based on lifetime
 *     const life = particle.lifetime / particle.maxLifetime;
 *     const easedLife = easeOutCubic(life);
 *     const startColor = hsl(240, 80, 60);  // Blue
 *     const endColor = hsl(0, 80, 60);      // Red
 *     const currentColor = colorLerpHsl(startColor, endColor, 1 - easedLife);
 *
 *     // Render particle
 *     const rgb = hslToRgb(currentColor);
 *     drawCircle(particle.position.x, particle.position.y, 3, rgb);
 *   });
 * }
 * ```
 *
 * @example
 * **🎨 Generative Art - Fractal Tree:**
 * ```typescript
 * import {
 *   vec2, vec2FromAngle, easeInOutSine,
 *   hsl, hslToRgb, randomFloat, degrees
 * } from 'play.ts';
 *
 * function drawFractalTree(
 *   position: Vector2,
 *   angle: number,
 *   length: number,
 *   depth: number
 * ) {
 *   if (depth === 0) return;
 *
 *   // Calculate end point
 *   const direction = vec2FromAngle(angle, length);
 *   const endPoint = vec2Add(position, direction);
 *
 *   // Color based on depth (green to brown)
 *   const depthRatio = depth / maxDepth;
 *   const color = hsl(
 *     120 * depthRatio,     // Green to red
 *     60 + 40 * depthRatio, // More saturated at tips
 *     30 + 40 * depthRatio  // Lighter at tips
 *   );
 *
 *   // Draw branch with thickness based on depth
 *   const thickness = depth * 0.8;
 *   drawLine(position, endPoint, hslToRgb(color), thickness);
 *
 *   // Recursive branches with natural variation
 *   const branchAngle = 25 + randomFloat(-5, 5);  // Natural variation
 *   const lengthReduction = 0.7 + randomFloat(-0.1, 0.1);
 *
 *   drawFractalTree(endPoint, angle - branchAngle, length * lengthReduction, depth - 1);
 *   drawFractalTree(endPoint, angle + branchAngle, length * lengthReduction, depth - 1);
 * }
 * ```
 *
 * @example
 * **🎮 Interactive Physics - Spring System:**
 * ```typescript
 * import {
 *   Particle, springForce, gravity,
 *   vec2Distance, easeOutBounce, lerp
 * } from 'play.ts';
 *
 * class SpringSystem {
 *   particles: Particle[] = [];
 *   springs: Array<{ p1: Particle; p2: Particle; restLength: number }> = [];
 *
 *   constructor() {
 *     // Create connected particles
 *     for (let i = 0; i < 10; i++) {
 *       const particle = new Particle(100 + i * 30, 100, 0, 0, 1);
 *       this.particles.push(particle);
 *
 *       if (i > 0) {
 *         this.springs.push({
 *           p1: this.particles[i - 1],
 *           p2: particle,
 *           restLength: 30
 *         });
 *       }
 *     }
 *   }
 *
 *   update(deltaTime: number, mousePos: Vector2) {
 *     // Pin first particle to mouse
 *     this.particles[0].position = { ...mousePos };
 *
 *     // Apply spring forces
 *     this.springs.forEach(({ p1, p2, restLength }) => {
 *       const force = springForce(p2.position, p1.position, restLength, 0.2, 0.98);
 *       p2.applyForce(force);
 *     });
 *
 *     // Apply gravity and update
 *     this.particles.slice(1).forEach(particle => {
 *       particle.applyForce(gravity(particle.mass, 0.3));
 *       particle.update(deltaTime);
 *     });
 *   }
 * }
 * ```
 *
 * **🛠️ Development Patterns:**
 *
 * **Modular Imports** - Import only what you need:
 * ```typescript
 * import { vec2, lerp, easeInOutCubic } from 'play.ts';           // Specific functions
 * import * as Math from 'play.ts/math';                          // Entire module
 * import { ParticleSystem } from 'play.ts/physics';              // Specific classes
 * ```
 *
 * **Performance Optimization** - Use efficient patterns:
 * ```typescript
 * // ✅ Use squared distance for comparisons
 * if (pointDistanceSq(a, b) < radius * radius) { // collision }
 *
 * // ✅ Batch vector operations
 * const forces = [gravity(mass), friction(velocity), wind];
 * const totalForce = forces.reduce(vec2Add);
 *
 * // ✅ Reuse objects when possible
 * const tempVector = vec2(0, 0);  // Reuse for calculations
 * ```
 *
 * **Type Safety** - Leverage TypeScript features:
 * ```typescript
 * import type { Vector2, RGB, EasingFunction } from 'play.ts';
 *
 * interface AnimatedObject {
 *   position: Vector2;
 *   color: RGB;
 *   easing: EasingFunction;
 * }
 * ```
 *
 * @author play.ts Team
 * @version 1.0.0
 * @license MIT
 *
 * @see {@link https://github.com/play.ts/play.ts | GitHub Repository}
 * @see {@link https://play.ts.dev/docs | Documentation}
 * @see {@link https://play.ts.dev/examples | Interactive Examples}
 */
export * from '../types/index.ts';
export * from './math.ts';
export * from './color.ts';
export * from './animation.ts';
export * from './random.ts';
export * from './geometry.ts';
export * from './physics.ts';
export * from './fractals.ts';
import { AnimationLoop } from './animation.ts';
import type { Point } from '../types/index.ts';
import { Tween, Spring } from './animation.ts';
import { SeededRandom, SimpleNoise, FractalNoise, PerlinNoise } from './random.ts';
import { Particle, ParticleSystem, VerletParticle, VerletConstraint, Cloth } from './physics.ts';
import { LSystem, Turtle, LSystemInterpreter } from './fractals.ts';
export { clamp, lerp, map, normalize, vec2, vec2Add, vec2Sub, vec2Mul, vec2Div, vec2Length, vec2Normalize, vec2Distance, vec2Angle, vec2FromAngle, vec2Lerp, vec2Rotate, vec3, vec3Add, vec3Sub, vec3Mul, vec3Div, vec3Length, vec3Normalize, vec3Distance, vec3Lerp, vec3Cross, vec3Dot, PI, TWO_PI, HALF_PI, TAU, degrees, radians } from './math.ts';
export { rgb, rgba, hsl, hsla, rgbToHsl, hslToRgb, rgbToHex, hexToRgb, colorLerp, colorLerpHsl, brighten, darken, saturate, desaturate, hueShift, grayscale, invert, complementary, triadic, analogous, colors, toCssRgb, toCssRgba, toCssHsl, toCssHsla } from './color.ts';
export { linear, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic, easeInSine, easeOutSine, easeInOutSine, easeInExpo, easeOutExpo, easeInOutExpo, easeInCirc, easeOutCirc, easeInOutCirc, easeInBack, easeOutBack, easeInOutBack, easeInElastic, easeOutElastic, easeInOutElastic, easeInBounce, easeOutBounce, easeInOutBounce, easings, AnimationLoop, Tween, tween, animate, Spring, spring, delay } from './animation.ts';
export { SeededRandom, SimpleNoise, FractalNoise, PerlinNoise, random, noise, fractalNoise, randomInt, randomFloat, randomBool, randomChoice, randomSign, randomAngle, randomInCircle, randomOnCircle, randomGaussian, setSeed, weightedChoice, shuffle, randomColor, randomColorHSL, randomDistribution, randomWalk, sample, sampleWeighted } from './random.ts';
export { point, pointDistance, pointDistanceSq, pointLerp, pointAngle, size, sizeArea, sizePerimeter, sizeAspectRatio, sizeScale, sizeFit, sizeFill, rect, rectFromPoints, rectFromCenter, rectCenter, rectArea, rectPerimeter, rectExpand, rectScale, rectUnion, rectIntersection, circle, circleCenter, circleArea, circleCircumference, circlePointAt, pointInRect, pointInCircle, rectIntersects, circleIntersects, circleRectIntersects, line, lineLength, lineAngle, linePointAt, lineNormal, lineDirection, lineDistanceToPoint, lineIntersection, polygon, polygonArea, polygonCentroid, polygonPerimeter, pointInPolygon, polygonBoundingBox, regularPolygon, quadraticBezier, cubicBezier, gridPoints, hexGrid, triangle, square, pentagon, hexagon, octagon, star } from './geometry.ts';
export { Particle, ParticleSystem, VerletParticle, VerletConstraint, Cloth, gravity, friction, drag, attraction, repulsion, springForce, createOrbit, createExplosion } from './physics.ts';
export { LSystem, Turtle, LSystemInterpreter, lSystems, mandelbrot, mandelbrotSet, julia, juliaSet, sierpinskiTriangle, barnsleyFern, kochSnowflake, createKochSnowflake, fractalTree } from './fractals.ts';
export declare class Play {
    private static instance;
    private animationLoop;
    private canvas?;
    private context?;
    private constructor();
    get width(): number;
    get height(): number;
    static getInstance(): Play;
    setCanvas(canvas: HTMLCanvasElement): void;
    getCanvas(): HTMLCanvasElement | undefined;
    getContext(): CanvasRenderingContext2D | undefined;
    start(callback: (frame: {
        time: number;
        deltaTime: number;
        frame: number;
    }) => void): () => void;
    play(): void;
    pause(): void;
    clear(color?: string | any): void;
    background(color: string | any): void;
    setStroke(color: string | any, width?: number): void;
    fill(color: string | any): void;
    private convertColor;
    noStroke(): void;
    noFill(): void;
    drawCircle(x: number, y: number, radius: number, filled?: boolean): void;
    drawRect(x: number, y: number, width: number, height: number, filled?: boolean): void;
    drawLine(x1: number, y1: number, x2: number, y2: number): void;
    drawPolygon(points: Point[], filled?: boolean): void;
    drawText(text: string, x: number, y: number, font?: string): void;
    translate(x: number, y: number): void;
    rotate(angle: number): void;
    scale(x: number, y?: number): void;
    pushMatrix(): void;
    popMatrix(): void;
    rect(x: number, y: number, width: number, height: number): void;
    circle(x: number, y: number, radius: number): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    polygon(points: Point[]): void;
    text(text: string, x: number, y: number, options?: {
        align?: 'left' | 'center' | 'right';
        size?: number;
        weight?: 'normal' | 'bold';
        family?: string;
    }): void;
    strokeWeight(weight: number): void;
    beginPath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    stroke(): void;
}
export declare const play: Play;
export declare const setup: (canvas: HTMLCanvasElement) => Play;
export declare const version = "1.0.0";
export declare const info: {
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
    modules: {
        math: string;
        color: string;
        animation: string;
        random: string;
        geometry: string;
        physics: string;
        fractals: string;
    };
};
declare const _default: {
    math: {
        clamp: (value: number, min: number, max: number) => number;
        lerp: (a: number, b: number, t: number) => number;
        map: (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
        normalize: (value: number, min: number, max: number) => number;
        vec2: (x: number, y: number) => import("./index.ts").Vector2;
        vec2Add: (a: import("./index.ts").Vector2, b: import("./index.ts").Vector2) => import("./index.ts").Vector2;
        vec2Sub: (a: import("./index.ts").Vector2, b: import("./index.ts").Vector2) => import("./index.ts").Vector2;
        vec2Mul: (a: import("./index.ts").Vector2, scalar: number) => import("./index.ts").Vector2;
        vec2Div: (a: import("./index.ts").Vector2, scalar: number) => import("./index.ts").Vector2;
        vec2Length: (v: import("./index.ts").Vector2) => number;
        vec2Normalize: (v: import("./index.ts").Vector2) => import("./index.ts").Vector2;
        vec2Distance: (a: import("./index.ts").Vector2, b: import("./index.ts").Vector2) => number;
        vec2Angle: (v: import("./index.ts").Vector2) => number;
        vec2FromAngle: (angle: number, length?: number) => import("./index.ts").Vector2;
        vec2Lerp: (a: import("./index.ts").Vector2, b: import("./index.ts").Vector2, t: number) => import("./index.ts").Vector2;
        vec2Rotate: (v: import("./index.ts").Vector2, angle: number) => import("./index.ts").Vector2;
        vec3: (x: number, y: number, z: number) => import("./index.ts").Vector3;
        vec3Add: (a: import("./index.ts").Vector3, b: import("./index.ts").Vector3) => import("./index.ts").Vector3;
        vec3Sub: (a: import("./index.ts").Vector3, b: import("./index.ts").Vector3) => import("./index.ts").Vector3;
        vec3Mul: (a: import("./index.ts").Vector3, scalar: number) => import("./index.ts").Vector3;
        vec3Div: (a: import("./index.ts").Vector3, scalar: number) => import("./index.ts").Vector3;
        vec3Length: (v: import("./index.ts").Vector3) => number;
        vec3Normalize: (v: import("./index.ts").Vector3) => import("./index.ts").Vector3;
        vec3Distance: (a: import("./index.ts").Vector3, b: import("./index.ts").Vector3) => number;
        vec3Lerp: (a: import("./index.ts").Vector3, b: import("./index.ts").Vector3, t: number) => import("./index.ts").Vector3;
        vec3Cross: (a: import("./index.ts").Vector3, b: import("./index.ts").Vector3) => import("./index.ts").Vector3;
        vec3Dot: (a: import("./index.ts").Vector3, b: import("./index.ts").Vector3) => number;
        PI: number;
        TWO_PI: number;
        HALF_PI: number;
        TAU: number;
        degrees: (radians: number) => number;
        radians: (degrees: number) => number;
    };
    color: {
        rgb: (r: number, g: number, b: number) => import("./index.ts").RGB;
        rgba: (r: number, g: number, b: number, a: number) => import("./index.ts").RGBA;
        hsl: (h: number, s: number, l: number) => import("./index.ts").HSL;
        hsla: (h: number, s: number, l: number, a: number) => import("./index.ts").HSLA;
        rgbToHsl: (color: import("./index.ts").RGB) => import("./index.ts").HSL;
        hslToRgb: (color: import("./index.ts").HSL) => import("./index.ts").RGB;
        rgbToHex: (color: import("./index.ts").RGB) => string;
        hexToRgb: (hex: string) => import("./index.ts").RGB;
        colorLerp: (a: import("./index.ts").RGB, b: import("./index.ts").RGB, t: number) => import("./index.ts").RGB;
        colorLerpHsl: (a: import("./index.ts").HSL, b: import("./index.ts").HSL, t: number) => import("./index.ts").HSL;
        brighten: (color: import("./index.ts").RGB, amount: number) => import("./index.ts").RGB;
        darken: (color: import("./index.ts").RGB, amount: number) => import("./index.ts").RGB;
        saturate: (color: import("./index.ts").RGB, amount: number) => import("./index.ts").RGB;
        desaturate: (color: import("./index.ts").RGB, amount: number) => import("./index.ts").RGB;
        hueShift: (color: import("./index.ts").RGB, degrees: number) => import("./index.ts").RGB;
        grayscale: (color: import("./index.ts").RGB) => import("./index.ts").RGB;
        invert: (color: import("./index.ts").RGB) => import("./index.ts").RGB;
        complementary: (color: import("./index.ts").RGB) => import("./index.ts").RGB;
        triadic: (color: import("./index.ts").RGB) => [import("./index.ts").RGB, import("./index.ts").RGB];
        analogous: (color: import("./index.ts").RGB, angle?: number) => [import("./index.ts").RGB, import("./index.ts").RGB];
        colors: {
            readonly white: import("./index.ts").RGB;
            readonly black: import("./index.ts").RGB;
            readonly red: import("./index.ts").RGB;
            readonly green: import("./index.ts").RGB;
            readonly blue: import("./index.ts").RGB;
            readonly yellow: import("./index.ts").RGB;
            readonly cyan: import("./index.ts").RGB;
            readonly magenta: import("./index.ts").RGB;
            readonly gray: import("./index.ts").RGB;
            readonly lightGray: import("./index.ts").RGB;
            readonly darkGray: import("./index.ts").RGB;
            readonly orange: import("./index.ts").RGB;
            readonly purple: import("./index.ts").RGB;
            readonly pink: import("./index.ts").RGB;
            readonly brown: import("./index.ts").RGB;
            readonly transparent: import("./index.ts").RGBA;
        };
        toCssRgb: (color: import("./index.ts").RGB) => string;
        toCssRgba: (color: import("./index.ts").RGBA) => string;
        toCssHsl: (color: import("./index.ts").HSL) => string;
        toCssHsla: (color: import("./index.ts").HSLA) => string;
    };
    animation: {
        linear: import("./index.ts").EasingFunction;
        easeInQuad: import("./index.ts").EasingFunction;
        easeOutQuad: import("./index.ts").EasingFunction;
        easeInOutQuad: import("./index.ts").EasingFunction;
        easeInCubic: import("./index.ts").EasingFunction;
        easeOutCubic: import("./index.ts").EasingFunction;
        easeInOutCubic: import("./index.ts").EasingFunction;
        easeInSine: import("./index.ts").EasingFunction;
        easeOutSine: import("./index.ts").EasingFunction;
        easeInOutSine: import("./index.ts").EasingFunction;
        easeInExpo: import("./index.ts").EasingFunction;
        easeOutExpo: import("./index.ts").EasingFunction;
        easeInOutExpo: import("./index.ts").EasingFunction;
        easeInCirc: import("./index.ts").EasingFunction;
        easeOutCirc: import("./index.ts").EasingFunction;
        easeInOutCirc: import("./index.ts").EasingFunction;
        easeInBack: import("./index.ts").EasingFunction;
        easeOutBack: import("./index.ts").EasingFunction;
        easeInOutBack: import("./index.ts").EasingFunction;
        easeInElastic: import("./index.ts").EasingFunction;
        easeOutElastic: import("./index.ts").EasingFunction;
        easeInOutElastic: import("./index.ts").EasingFunction;
        easeInBounce: import("./index.ts").EasingFunction;
        easeOutBounce: import("./index.ts").EasingFunction;
        easeInOutBounce: import("./index.ts").EasingFunction;
        easings: {
            readonly linear: import("./index.ts").EasingFunction;
            readonly easeInQuad: import("./index.ts").EasingFunction;
            readonly easeOutQuad: import("./index.ts").EasingFunction;
            readonly easeInOutQuad: import("./index.ts").EasingFunction;
            readonly easeInCubic: import("./index.ts").EasingFunction;
            readonly easeOutCubic: import("./index.ts").EasingFunction;
            readonly easeInOutCubic: import("./index.ts").EasingFunction;
            readonly easeInQuart: import("./index.ts").EasingFunction;
            readonly easeOutQuart: import("./index.ts").EasingFunction;
            readonly easeInOutQuart: import("./index.ts").EasingFunction;
            readonly easeInQuint: import("./index.ts").EasingFunction;
            readonly easeOutQuint: import("./index.ts").EasingFunction;
            readonly easeInOutQuint: import("./index.ts").EasingFunction;
            readonly easeInSine: import("./index.ts").EasingFunction;
            readonly easeOutSine: import("./index.ts").EasingFunction;
            readonly easeInOutSine: import("./index.ts").EasingFunction;
            readonly easeInExpo: import("./index.ts").EasingFunction;
            readonly easeOutExpo: import("./index.ts").EasingFunction;
            readonly easeInOutExpo: import("./index.ts").EasingFunction;
            readonly easeInCirc: import("./index.ts").EasingFunction;
            readonly easeOutCirc: import("./index.ts").EasingFunction;
            readonly easeInOutCirc: import("./index.ts").EasingFunction;
            readonly easeInBack: import("./index.ts").EasingFunction;
            readonly easeOutBack: import("./index.ts").EasingFunction;
            readonly easeInOutBack: import("./index.ts").EasingFunction;
            readonly easeInElastic: import("./index.ts").EasingFunction;
            readonly easeOutElastic: import("./index.ts").EasingFunction;
            readonly easeInOutElastic: import("./index.ts").EasingFunction;
            readonly easeInBounce: import("./index.ts").EasingFunction;
            readonly easeOutBounce: import("./index.ts").EasingFunction;
            readonly easeInOutBounce: import("./index.ts").EasingFunction;
        };
        AnimationLoop: typeof AnimationLoop;
        Tween: typeof Tween;
        tween: (startValue: number, endValue: number, duration: number, easing: import("./index.ts").EasingFunction | undefined, onUpdate: (value: number) => void, onComplete?: () => void) => Tween;
        animate: (duration: number, easing: import("./index.ts").EasingFunction | undefined, onUpdate: (progress: number) => void, onComplete?: () => void) => Tween;
        Spring: typeof Spring;
        spring: (initialValue: number, stiffness: number | undefined, damping: number | undefined, mass: number | undefined, onUpdate: (value: number) => void) => Spring;
        delay: (ms: number) => Promise<void>;
    };
    random: {
        SeededRandom: typeof SeededRandom;
        SimpleNoise: typeof SimpleNoise;
        FractalNoise: typeof FractalNoise;
        PerlinNoise: typeof PerlinNoise;
        random: SeededRandom;
        noise: PerlinNoise;
        fractalNoise: FractalNoise;
        randomInt: (min: number, max: number) => number;
        randomFloat: (min: number, max: number) => number;
        randomBool: () => boolean;
        randomChoice: <T>(array: T[]) => T;
        randomSign: () => number;
        randomAngle: () => number;
        randomInCircle: () => import("./index.ts").Vector2;
        randomOnCircle: () => import("./index.ts").Vector2;
        randomGaussian: (mean?: number, standardDeviation?: number) => number;
        setSeed: (seed: number) => void;
        weightedChoice: <T>(choices: T[], weights: number[]) => T;
        shuffle: <T>(array: T[]) => T[];
        randomColor: () => {
            r: number;
            g: number;
            b: number;
        };
        randomColorHSL: (hueMin?: number, hueMax?: number, saturationMin?: number, saturationMax?: number, lightnessMin?: number, lightnessMax?: number) => {
            h: number;
            s: number;
            l: number;
        };
        randomDistribution: (count: number, min: number, max: number) => number[];
        randomWalk: (steps: number, stepSize?: number, dimensions?: number) => number[][];
        sample: <T>(array: T[], count: number) => T[];
        sampleWeighted: <T>(array: T[], weights: number[], count: number) => T[];
    };
    geometry: {
        point: (x: number, y: number) => Point;
        pointDistance: (a: Point, b: Point) => number;
        pointDistanceSq: (a: Point, b: Point) => number;
        pointLerp: (a: Point, b: Point, t: number) => Point;
        pointAngle: (a: Point, b: Point) => number;
        size: (width: number, height: number) => import("./index.ts").Size;
        sizeArea: (s: import("./index.ts").Size) => number;
        sizePerimeter: (s: import("./index.ts").Size) => number;
        sizeAspectRatio: (s: import("./index.ts").Size) => number;
        sizeScale: (s: import("./index.ts").Size, factor: number) => import("./index.ts").Size;
        sizeFit: (s: import("./index.ts").Size, container: import("./index.ts").Size) => import("./index.ts").Size;
        sizeFill: (s: import("./index.ts").Size, container: import("./index.ts").Size) => import("./index.ts").Size;
        rect: (x: number, y: number, width: number, height: number) => import("./index.ts").Rectangle;
        rectFromPoints: (p1: Point, p2: Point) => import("./index.ts").Rectangle;
        rectFromCenter: (center: Point, size: import("./index.ts").Size) => import("./index.ts").Rectangle;
        rectCenter: (r: import("./index.ts").Rectangle) => Point;
        rectArea: (r: import("./index.ts").Rectangle) => number;
        rectPerimeter: (r: import("./index.ts").Rectangle) => number;
        rectExpand: (r: import("./index.ts").Rectangle, amount: number) => import("./index.ts").Rectangle;
        rectScale: (r: import("./index.ts").Rectangle, factor: number) => import("./index.ts").Rectangle;
        rectUnion: (a: import("./index.ts").Rectangle, b: import("./index.ts").Rectangle) => import("./index.ts").Rectangle;
        rectIntersection: (a: import("./index.ts").Rectangle, b: import("./index.ts").Rectangle) => import("./index.ts").Rectangle | null;
        circle: (x: number, y: number, radius: number) => import("./index.ts").Circle;
        circleCenter: (c: import("./index.ts").Circle) => Point;
        circleArea: (c: import("./index.ts").Circle) => number;
        circleCircumference: (c: import("./index.ts").Circle) => number;
        circlePointAt: (c: import("./index.ts").Circle, angle: number) => Point;
        pointInRect: (p: Point, r: import("./index.ts").Rectangle) => boolean;
        pointInCircle: (p: Point, c: import("./index.ts").Circle) => boolean;
        rectIntersects: (a: import("./index.ts").Rectangle, b: import("./index.ts").Rectangle) => boolean;
        circleIntersects: (a: import("./index.ts").Circle, b: import("./index.ts").Circle) => boolean;
        circleRectIntersects: (c: import("./index.ts").Circle, r: import("./index.ts").Rectangle) => boolean;
        line: (start: Point, end: Point) => import("./geometry.ts").Line;
        lineLength: (l: import("./geometry.ts").Line) => number;
        lineAngle: (l: import("./geometry.ts").Line) => number;
        linePointAt: (l: import("./geometry.ts").Line, t: number) => Point;
        lineNormal: (l: import("./geometry.ts").Line) => import("./index.ts").Vector2;
        lineDirection: (l: import("./geometry.ts").Line) => import("./index.ts").Vector2;
        lineDistanceToPoint: (l: import("./geometry.ts").Line, p: Point) => number;
        lineIntersection: (l1: import("./geometry.ts").Line, l2: import("./geometry.ts").Line) => Point | null;
        polygon: (...points: Point[]) => import("./geometry.ts").Polygon;
        polygonArea: (poly: import("./geometry.ts").Polygon) => number;
        polygonCentroid: (poly: import("./geometry.ts").Polygon) => Point;
        polygonPerimeter: (poly: import("./geometry.ts").Polygon) => number;
        pointInPolygon: (p: Point, poly: import("./geometry.ts").Polygon) => boolean;
        polygonBoundingBox: (poly: import("./geometry.ts").Polygon) => import("./index.ts").Rectangle;
        regularPolygon: (center: Point, radius: number, sides: number, rotation?: number) => import("./geometry.ts").Polygon;
        quadraticBezier: (t: number, p0: Point, p1: Point, p2: Point) => Point;
        cubicBezier: (t: number, p0: Point, p1: Point, p2: Point, p3: Point) => Point;
        gridPoints: (bounds: import("./index.ts").Rectangle, cellSize: number) => Point[];
        hexGrid: (center: Point, radius: number, rings: number) => Point[];
        triangle: (p1: Point, p2: Point, p3: Point) => import("./geometry.ts").Polygon;
        square: (center: Point, size: number) => import("./geometry.ts").Polygon;
        pentagon: (center: Point, radius: number) => import("./geometry.ts").Polygon;
        hexagon: (center: Point, radius: number) => import("./geometry.ts").Polygon;
        octagon: (center: Point, radius: number) => import("./geometry.ts").Polygon;
        star: (center: Point, outerRadius: number, innerRadius: number, points: number) => import("./geometry.ts").Polygon;
    };
    physics: {
        Particle: typeof Particle;
        ParticleSystem: typeof ParticleSystem;
        VerletParticle: typeof VerletParticle;
        VerletConstraint: typeof VerletConstraint;
        Cloth: typeof Cloth;
        gravity: (mass?: number, strength?: number) => import("./index.ts").Vector2;
        friction: (velocity: import("./index.ts").Vector2, coefficient?: number) => import("./index.ts").Vector2;
        drag: (velocity: import("./index.ts").Vector2, coefficient?: number) => import("./index.ts").Vector2;
        attraction: (pos1: import("./index.ts").Vector2, pos2: import("./index.ts").Vector2, mass1?: number, mass2?: number, strength?: number) => import("./index.ts").Vector2;
        repulsion: (pos1: import("./index.ts").Vector2, pos2: import("./index.ts").Vector2, mass1?: number, mass2?: number, strength?: number) => import("./index.ts").Vector2;
        springForce: (pos1: import("./index.ts").Vector2, pos2: import("./index.ts").Vector2, restLength: number, stiffness?: number, damping?: number) => import("./index.ts").Vector2;
        createOrbit: (center: import("./index.ts").Vector2, radius: number, speed: number, angle?: number) => {
            position: import("./index.ts").Vector2;
            velocity: import("./index.ts").Vector2;
        };
        createExplosion: (center: import("./index.ts").Vector2, count: number, minSpeed?: number, maxSpeed?: number, lifetime?: number) => Particle[];
    };
    fractals: {
        LSystem: typeof LSystem;
        Turtle: typeof Turtle;
        LSystemInterpreter: typeof LSystemInterpreter;
        lSystems: {
            koch: LSystem;
            sierpinski: LSystem;
            dragon: LSystem;
            plant: LSystem;
            tree: LSystem;
            cantor: LSystem;
        };
        mandelbrot: (c: {
            real: number;
            imag: number;
        }, maxIterations?: number) => number;
        mandelbrotSet: (width: number, height: number, xMin?: number, xMax?: number, yMin?: number, yMax?: number, maxIterations?: number) => number[][];
        julia: (z: {
            real: number;
            imag: number;
        }, c: {
            real: number;
            imag: number;
        }, maxIterations?: number) => number;
        juliaSet: (width: number, height: number, c: {
            real: number;
            imag: number;
        }, xMin?: number, xMax?: number, yMin?: number, yMax?: number, maxIterations?: number) => number[][];
        sierpinskiTriangle: (points: Point[], iterations: number, startPoint?: Point) => Point[];
        barnsleyFern: (iterations: number) => Point[];
        kochSnowflake: (start: Point, end: Point, depth: number) => Point[];
        createKochSnowflake: (center: Point, radius: number, depth: number) => Point[];
        fractalTree: (start: Point, angle: number, length: number, depth: number, branchAngle?: number, lengthRatio?: number) => Point[][];
    };
    Play: typeof Play;
    play: Play;
    setup: (canvas: HTMLCanvasElement) => Play;
    version: string;
    info: {
        name: string;
        version: string;
        description: string;
        author: string;
        license: string;
        modules: {
            math: string;
            color: string;
            animation: string;
            random: string;
            geometry: string;
            physics: string;
            fractals: string;
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map