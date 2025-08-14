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

// Type definitions
export * from '../types/index.ts';

// Core modules
export * from './math.ts';
export * from './color.ts';
export * from './animation.ts';
export * from './random.ts';
export * from './geometry.ts';

// Advanced modules
export * from './physics.ts';
export * from './fractals.ts';

// Import needed types and functions for internal use
import { AnimationLoop } from './animation.ts';
import { TWO_PI } from './math.ts';
import type { Point } from '../types/index.ts';
import {
  clamp,
  lerp,
  map,
  normalize,
  vec2,
  vec2Add,
  vec2Sub,
  vec2Mul,
  vec2Div,
  vec2Length,
  vec2Normalize,
  vec2Distance,
  vec2Angle,
  vec2FromAngle,
  vec2Lerp,
  vec2Rotate,
  vec3,
  vec3Add,
  vec3Sub,
  vec3Mul,
  vec3Div,
  vec3Length,
  vec3Normalize,
  vec3Distance,
  vec3Lerp,
  vec3Cross,
  vec3Dot,
  PI,
  HALF_PI,
  TAU,
  degrees,
  radians
} from './math.ts';

import {
  rgb,
  rgba,
  hsl,
  hsla,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  hexToRgb,
  colorLerp,
  colorLerpHsl,
  brighten,
  darken,
  saturate,
  desaturate,
  hueShift,
  grayscale,
  invert,
  complementary,
  triadic,
  analogous,
  colors,
  toCssRgb,
  toCssRgba,
  toCssHsl,
  toCssHsla
} from './color.ts';

import {
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
  easings,
  Tween,
  tween,
  animate,
  Spring,
  spring,
  delay
} from './animation.ts';

import {
  SeededRandom,
  SimpleNoise,
  FractalNoise,
  PerlinNoise,
  random,
  noise,
  fractalNoise,
  randomInt,
  randomFloat,
  randomBool,
  randomChoice,
  randomSign,
  randomAngle,
  randomInCircle,
  randomOnCircle,
  randomGaussian,
  setSeed,
  weightedChoice,
  shuffle,
  randomColor,
  randomColorHSL,
  randomDistribution,
  randomWalk,
  sample,
  sampleWeighted
} from './random.ts';

import {
  point,
  pointDistance,
  pointDistanceSq,
  pointLerp,
  pointAngle,
  size,
  sizeArea,
  sizePerimeter,
  sizeAspectRatio,
  sizeScale,
  sizeFit,
  sizeFill,
  rect,
  rectFromPoints,
  rectFromCenter,
  rectCenter,
  rectArea,
  rectPerimeter,
  rectExpand,
  rectScale,
  rectUnion,
  rectIntersection,
  circle,
  circleCenter,
  circleArea,
  circleCircumference,
  circlePointAt,
  pointInRect,
  pointInCircle,
  rectIntersects,
  circleIntersects,
  circleRectIntersects,
  line,
  lineLength,
  lineAngle,
  linePointAt,
  lineNormal,
  lineDirection,
  lineDistanceToPoint,
  lineIntersection,
  polygon,
  polygonArea,
  polygonCentroid,
  polygonPerimeter,
  pointInPolygon,
  polygonBoundingBox,
  regularPolygon,
  quadraticBezier,
  cubicBezier,
  gridPoints,
  hexGrid,
  triangle,
  square,
  pentagon,
  hexagon,
  octagon,
  star
} from './geometry.ts';

import {
  // Physics classes and forces
  Particle,
  ParticleSystem,
  VerletParticle,
  VerletConstraint,
  Cloth,
  gravity,
  friction,
  drag,
  attraction,
  repulsion,
  springForce,
  createOrbit,
  createExplosion
} from './physics.ts';

import {
  // Fractals and L-Systems
  LSystem,
  Turtle,
  LSystemInterpreter,
  lSystems,
  mandelbrot,
  mandelbrotSet,
  julia,
  juliaSet,
  sierpinskiTriangle,
  barnsleyFern,
  kochSnowflake,
  createKochSnowflake,
  fractalTree
} from './fractals.ts';

// Re-export commonly used utilities with shorter names
export {
  // Math utilities
  clamp,
  lerp,
  map,
  normalize,
  vec2,
  vec2Add,
  vec2Sub,
  vec2Mul,
  vec2Div,
  vec2Length,
  vec2Normalize,
  vec2Distance,
  vec2Angle,
  vec2FromAngle,
  vec2Lerp,
  vec2Rotate,
  vec3,
  vec3Add,
  vec3Sub,
  vec3Mul,
  vec3Div,
  vec3Length,
  vec3Normalize,
  vec3Distance,
  vec3Lerp,
  vec3Cross,
  vec3Dot,
  PI,
  TWO_PI,
  HALF_PI,
  TAU,
  degrees,
  radians
} from './math.ts';

export {
  // Color utilities
  rgb,
  rgba,
  hsl,
  hsla,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  hexToRgb,
  colorLerp,
  colorLerpHsl,
  brighten,
  darken,
  saturate,
  desaturate,
  hueShift,
  grayscale,
  invert,
  complementary,
  triadic,
  analogous,
  colors,
  toCssRgb,
  toCssRgba,
  toCssHsl,
  toCssHsla
} from './color.ts';

export {
  // Animation utilities
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
  easings,
  AnimationLoop,
  Tween,
  tween,
  animate,
  Spring,
  spring,
  delay
} from './animation.ts';

export {
  // Random utilities
  SeededRandom,
  SimpleNoise,
  FractalNoise,
  PerlinNoise,
  random,
  noise,
  fractalNoise,
  randomInt,
  randomFloat,
  randomBool,
  randomChoice,
  randomSign,
  randomAngle,
  randomInCircle,
  randomOnCircle,
  randomGaussian,
  setSeed,
  weightedChoice,
  shuffle,
  randomColor,
  randomColorHSL,
  randomDistribution,
  randomWalk,
  sample,
  sampleWeighted
} from './random.ts';

export {
  // Geometry utilities
  point,
  pointDistance,
  pointDistanceSq,
  pointLerp,
  pointAngle,
  size,
  sizeArea,
  sizePerimeter,
  sizeAspectRatio,
  sizeScale,
  sizeFit,
  sizeFill,
  rect,
  rectFromPoints,
  rectFromCenter,
  rectCenter,
  rectArea,
  rectPerimeter,
  rectExpand,
  rectScale,
  rectUnion,
  rectIntersection,
  circle,
  circleCenter,
  circleArea,
  circleCircumference,
  circlePointAt,
  pointInRect,
  pointInCircle,
  rectIntersects,
  circleIntersects,
  circleRectIntersects,
  line,
  lineLength,
  lineAngle,
  linePointAt,
  lineNormal,
  lineDirection,
  lineDistanceToPoint,
  lineIntersection,
  polygon,
  polygonArea,
  polygonCentroid,
  polygonPerimeter,
  pointInPolygon,
  polygonBoundingBox,
  regularPolygon,
  quadraticBezier,
  cubicBezier,
  gridPoints,
  hexGrid,
  triangle,
  square,
  pentagon,
  hexagon,
  octagon,
  star
} from './geometry.ts';

export {
  // Physics utilities
  Particle,
  ParticleSystem,
  VerletParticle,
  VerletConstraint,
  Cloth,
  gravity,
  friction,
  drag,
  attraction,
  repulsion,
  springForce,
  createOrbit,
  createExplosion
} from './physics.ts';

export {
  // Fractals and L-Systems
  LSystem,
  Turtle,
  LSystemInterpreter,
  lSystems,
  mandelbrot,
  mandelbrotSet,
  julia,
  juliaSet,
  sierpinskiTriangle,
  barnsleyFern,
  kochSnowflake,
  createKochSnowflake,
  fractalTree
} from './fractals.ts';

// Utility classes and functions
export class Play {
  private static instance: Play;
  private animationLoop: AnimationLoop;
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D;

  private constructor() {
    this.animationLoop = new AnimationLoop();
  }

  // Canvas dimension properties
  get width(): number {
    return this.canvas?.width ?? 0;
  }

  get height(): number {
    return this.canvas?.height ?? 0;
  }

  static getInstance(): Play {
    if (!Play.instance) {
      Play.instance = new Play();
    }
    return Play.instance;
  }

  // Canvas setup
  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    this.context = ctx ?? undefined;
  }

  getCanvas(): HTMLCanvasElement | undefined {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D | undefined {
    return this.context;
  }

  // Animation loop
  start(callback: (frame: { time: number; deltaTime: number; frame: number }) => void): () => void {
    return this.animationLoop.onFrame(callback);
  }

  play(): void {
    this.animationLoop.start();
  }

  pause(): void {
    this.animationLoop.stop();
  }

  // Utilities
  clear(color?: string | any): void {
    if (!this.context || !this.canvas) return;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (color) {
      const prevFillStyle = this.context.fillStyle;
      this.context.fillStyle = this.convertColor(color);
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.fillStyle = prevFillStyle;
    }
  }

  background(color: string | any): void {
    this.clear(color);
  }

  // Drawing utilities
  setStroke(color: string | any, width: number = 1): void {
    if (!this.context) return;
    this.context.strokeStyle = this.convertColor(color);
    this.context.lineWidth = width;
  }

  fill(color: string | any): void {
    if (!this.context) return;
    this.context.fillStyle = this.convertColor(color);
  }

  private convertColor(color: string | any): string {
    if (typeof color === 'string') return color;

    // Handle RGB color objects
    if (color && typeof color.r === 'number' && typeof color.g === 'number' && typeof color.b === 'number') {
      if (typeof color.a === 'number') {
        return toCssRgba(color);
      }
      return toCssRgb(color);
    }

    // Handle HSL color objects
    if (color && typeof color.h === 'number' && typeof color.s === 'number' && typeof color.l === 'number') {
      if (typeof color.a === 'number') {
        return toCssHsla(color);
      }
      return toCssHsl(color);
    }

    return '#000000'; // fallback
  }

  noStroke(): void {
    if (!this.context) return;
    this.context.strokeStyle = 'transparent';
  }

  noFill(): void {
    if (!this.context) return;
    this.context.fillStyle = 'transparent';
  }

  // Shape drawing
  drawCircle(x: number, y: number, radius: number, filled: boolean = true): void {
    if (!this.context) return;

    this.context.beginPath();
    this.context.arc(x, y, radius, 0, TWO_PI);

    if (filled) {
      this.context.fill();
    } else {
      this.context.stroke();
    }
  }

  drawRect(x: number, y: number, width: number, height: number, filled: boolean = true): void {
    if (!this.context) return;

    if (filled) {
      this.context.fillRect(x, y, width, height);
    } else {
      this.context.strokeRect(x, y, width, height);
    }
  }

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    if (!this.context) return;

    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.stroke();
  }

  drawPolygon(points: Point[], filled: boolean = true): void {
    if (!this.context || points.length < 3) return;

    this.context.beginPath();
    this.context.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.context.lineTo(points[i].x, points[i].y);
    }

    this.context.closePath();

    if (filled) {
      this.context.fill();
    } else {
      this.context.stroke();
    }
  }

  // Text drawing
  drawText(text: string, x: number, y: number, font?: string): void {
    if (!this.context) return;

    if (font) {
      this.context.font = font;
    }

    this.context.fillText(text, x, y);
  }

  // Transformations
  translate(x: number, y: number): void {
    if (!this.context) return;
    this.context.translate(x, y);
  }

  rotate(angle: number): void {
    if (!this.context) return;
    this.context.rotate(angle);
  }

  scale(x: number, y: number = x): void {
    if (!this.context) return;
    this.context.scale(x, y);
  }

  pushMatrix(): void {
    if (!this.context) return;
    this.context.save();
  }

  popMatrix(): void {
    if (!this.context) return;
    this.context.restore();
  }

  // Convenience drawing methods
  rect(x: number, y: number, width: number, height: number): void {
    this.drawRect(x, y, width, height, true);
  }

  circle(x: number, y: number, radius: number): void {
    this.drawCircle(x, y, radius, true);
  }

  line(x1: number, y1: number, x2: number, y2: number): void {
    this.drawLine(x1, y1, x2, y2);
  }

  polygon(points: Point[]): void {
    this.drawPolygon(points, true);
  }

  text(
    text: string,
    x: number,
    y: number,
    options?: {
      align?: 'left' | 'center' | 'right';
      size?: number;
      weight?: 'normal' | 'bold';
      family?: string;
    }
  ): void {
    if (!this.context) return;

    let font = '';

    if (options?.weight) {
      font += options.weight + ' ';
    }

    if (options?.size) {
      font += options.size + 'px ';
    }

    if (options?.family) {
      font += options.family;
    } else {
      font += 'Arial, sans-serif';
    }

    this.context.font = font.trim();

    if (options?.align) {
      this.context.textAlign = options.align;
    }

    this.context.fillText(text, x, y);
  }

  strokeWeight(weight: number): void {
    if (!this.context) return;
    this.context.lineWidth = weight;
  }

  // Path drawing methods
  beginPath(): void {
    if (!this.context) return;
    this.context.beginPath();
  }

  moveTo(x: number, y: number): void {
    if (!this.context) return;
    this.context.moveTo(x, y);
  }

  lineTo(x: number, y: number): void {
    if (!this.context) return;
    this.context.lineTo(x, y);
  }

  stroke(): void {
    if (!this.context) return;
    this.context.stroke();
  }
}

// Global Play instance
export const play = Play.getInstance();

// Quick setup function
export const setup = (canvas: HTMLCanvasElement): Play => {
  play.setCanvas(canvas);
  return play;
};

// Version information
export const version = '1.0.0';

// Library information
export const info = {
  name: 'play.ts',
  version,
  description: 'A TypeScript library for creative coding',
  author: 'play.ts team',
  license: 'MIT',
  modules: {
    math: 'Mathematical utilities including vectors, matrices, and interpolation',
    color: 'Color manipulation and conversion utilities',
    animation: 'Easing functions and animation utilities',
    random: 'Random number generation and noise functions',
    geometry: 'Geometric shapes and collision detection',
    physics: 'Physics simulation with forces, particles, and constraints',
    fractals: 'Fractal generation, L-Systems, and procedural patterns'
  }
};

// Default export
export default {
  // Core modules
  math: {
    clamp,
    lerp,
    map,
    normalize,
    vec2,
    vec2Add,
    vec2Sub,
    vec2Mul,
    vec2Div,
    vec2Length,
    vec2Normalize,
    vec2Distance,
    vec2Angle,
    vec2FromAngle,
    vec2Lerp,
    vec2Rotate,
    vec3,
    vec3Add,
    vec3Sub,
    vec3Mul,
    vec3Div,
    vec3Length,
    vec3Normalize,
    vec3Distance,
    vec3Lerp,
    vec3Cross,
    vec3Dot,
    PI,
    TWO_PI,
    HALF_PI,
    TAU,
    degrees,
    radians
  },

  color: {
    rgb,
    rgba,
    hsl,
    hsla,
    rgbToHsl,
    hslToRgb,
    rgbToHex,
    hexToRgb,
    colorLerp,
    colorLerpHsl,
    brighten,
    darken,
    saturate,
    desaturate,
    hueShift,
    grayscale,
    invert,
    complementary,
    triadic,
    analogous,
    colors,
    toCssRgb,
    toCssRgba,
    toCssHsl,
    toCssHsla
  },

  animation: {
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
    easings,
    AnimationLoop,
    Tween,
    tween,
    animate,
    Spring,
    spring,
    delay
  },

  random: {
    SeededRandom,
    SimpleNoise,
    FractalNoise,
    PerlinNoise,
    random,
    noise,
    fractalNoise,
    randomInt,
    randomFloat,
    randomBool,
    randomChoice,
    randomSign,
    randomAngle,
    randomInCircle,
    randomOnCircle,
    randomGaussian,
    setSeed,
    weightedChoice,
    shuffle,
    randomColor,
    randomColorHSL,
    randomDistribution,
    randomWalk,
    sample,
    sampleWeighted
  },

  geometry: {
    point,
    pointDistance,
    pointDistanceSq,
    pointLerp,
    pointAngle,
    size,
    sizeArea,
    sizePerimeter,
    sizeAspectRatio,
    sizeScale,
    sizeFit,
    sizeFill,
    rect,
    rectFromPoints,
    rectFromCenter,
    rectCenter,
    rectArea,
    rectPerimeter,
    rectExpand,
    rectScale,
    rectUnion,
    rectIntersection,
    circle,
    circleCenter,
    circleArea,
    circleCircumference,
    circlePointAt,
    pointInRect,
    pointInCircle,
    rectIntersects,
    circleIntersects,
    circleRectIntersects,
    line,
    lineLength,
    lineAngle,
    linePointAt,
    lineNormal,
    lineDirection,
    lineDistanceToPoint,
    lineIntersection,
    polygon,
    polygonArea,
    polygonCentroid,
    polygonPerimeter,
    pointInPolygon,
    polygonBoundingBox,
    regularPolygon,
    quadraticBezier,
    cubicBezier,
    gridPoints,
    hexGrid,
    triangle,
    square,
    pentagon,
    hexagon,
    octagon,
    star
  },

  physics: {
    Particle,
    ParticleSystem,
    VerletParticle,
    VerletConstraint,
    Cloth,
    gravity,
    friction,
    drag,
    attraction,
    repulsion,
    springForce,
    createOrbit,
    createExplosion
  },

  fractals: {
    LSystem,
    Turtle,
    LSystemInterpreter,
    lSystems,
    mandelbrot,
    mandelbrotSet,
    julia,
    juliaSet,
    sierpinskiTriangle,
    barnsleyFern,
    kochSnowflake,
    createKochSnowflake,
    fractalTree
  },

  // Utility classes
  Play,
  play,
  setup,

  // Info
  version,
  info
};
