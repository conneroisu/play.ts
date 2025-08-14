/**
 * Mathematical utilities for creative coding and interactive graphics.
 * 
 * This module provides comprehensive mathematical functions for creative coding applications,
 * including vector operations, interpolation, geometric transformations, and common math utilities.
 * All functions are optimized for real-time graphics and interactive applications.
 * 
 * @remarks
 * The math utilities in this module follow established computer graphics conventions:
 * - Vectors use right-handed coordinate systems
 * - Angles are measured in radians unless otherwise specified
 * - Matrix operations follow column-major ordering
 * - All interpolation functions use normalized time values (0-1)
 * 
 * @example
 * Basic vector operations:
 * ```typescript
 * import { vec2, vec2Add, vec2Length } from 'play.ts';
 * 
 * const a = vec2(3, 4);
 * const b = vec2(1, 2);
 * const sum = vec2Add(a, b);  // { x: 4, y: 6 }
 * const length = vec2Length(a);  // 5
 * ```
 * 
 * @example
 * Interpolation and smoothing:
 * ```typescript
 * import { lerp, smoothstep, clamp } from 'play.ts';
 * 
 * const interpolated = lerp(0, 100, 0.5);  // 50
 * const smooth = smoothstep(0, 1, 0.5);    // 0.5
 * const clamped = clamp(150, 0, 100);      // 100
 * ```
 * 
 * @see {@link https://developer.mozilla.org/docs/Web/API/Math | MDN Math Reference}
 * @see {@link https://registry.khronos.org/OpenGL-Refpages/gl4/ | OpenGL Reference}
 */

import type { Vector2, Vector3, Matrix3x3 } from '../types/index.ts';

// ============================================================================
// Mathematical Constants
// ============================================================================

/**
 * The mathematical constant π (pi), approximately 3.14159.
 * Represents the ratio of a circle's circumference to its diameter.
 * 
 * @remarks
 * This is equivalent to {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Math/PI | Math.PI}
 * but provided as a named export for convenience in creative coding contexts.
 * 
 * @example
 * ```typescript
 * const circleArea = PI * radius * radius;
 * const radians = degrees * PI / 180;
 * ```
 */
export const PI = Math.PI;

/**
 * Two times π (2π), approximately 6.28318.
 * Represents a full rotation in radians or the circumference of a unit circle.
 * 
 * @remarks
 * Commonly used in graphics programming for full rotations and periodic functions.
 * Also known as τ (tau) in some mathematical contexts.
 * 
 * @example
 * ```typescript
 * const fullRotation = TWO_PI;
 * const frequency = TWO_PI / period;
 * ```
 */
export const TWO_PI = Math.PI * 2;

/**
 * Half of π (π/2), approximately 1.5708.
 * Represents a quarter turn or 90 degrees in radians.
 * 
 * @example
 * ```typescript
 * const rightAngle = HALF_PI;
 * const quarterTurn = HALF_PI;
 * ```
 */
export const HALF_PI = Math.PI / 2;

/**
 * Quarter of π (π/4), approximately 0.7854.
 * Represents an eighth turn or 45 degrees in radians.
 * 
 * @example
 * ```typescript
 * const fortyFiveDegrees = QUARTER_PI;
 * const octantAngle = QUARTER_PI;
 * ```
 */
export const QUARTER_PI = Math.PI / 4;

/**
 * The mathematical constant τ (tau), equal to 2π.
 * An alternative to π that represents a full circle in radians.
 * 
 * @remarks
 * Tau is increasingly popular in mathematics education as it simplifies many formulas.
 * See {@link https://tauday.com/ | The Tau Manifesto} for more information.
 * 
 * @example
 * ```typescript
 * const fullCircle = TAU;  // More intuitive than TWO_PI
 * const halfCircle = TAU / 2;  // Clearer than PI
 * ```
 */
export const TAU = TWO_PI;

/**
 * Euler's number (e), approximately 2.71828.
 * The base of natural logarithms and fundamental constant in calculus.
 * 
 * @remarks
 * Used in exponential functions, growth/decay models, and advanced easing functions.
 * 
 * @example
 * ```typescript
 * const exponentialDecay = Math.pow(E, -time);
 * const naturalLog = Math.log(E);  // equals 1
 * ```
 */
export const E = Math.E;

/**
 * The golden ratio (φ), approximately 1.618.
 * A mathematical constant that appears frequently in nature and art.
 * 
 * @remarks
 * The golden ratio is defined as (1 + √5) / 2. It has the unique property that
 * φ² = φ + 1, and appears in Fibonacci sequences, spirals, and aesthetic proportions.
 * 
 * @example
 * ```typescript
 * const goldenRectangle = { width: PHI, height: 1 };
 * const fibonacciRatio = fibonacci(n+1) / fibonacci(n);  // approaches PHI
 * ```
 * 
 * @see {@link https://en.wikipedia.org/wiki/Golden_ratio | Golden Ratio - Wikipedia}
 */
export const PHI = (1 + Math.sqrt(5)) / 2;

// ============================================================================
// Basic Mathematical Utilities
// ============================================================================

/**
 * Constrains a value between minimum and maximum bounds.
 * 
 * @param value - The value to clamp
 * @param min - The minimum allowed value  
 * @param max - The maximum allowed value
 * @returns The clamped value, guaranteed to be between min and max (inclusive)
 * 
 * @remarks
 * If min > max, the parameters are automatically swapped to ensure valid bounds.
 * This function is essential for preventing values from exceeding safe ranges
 * in graphics programming, UI constraints, and numerical stability.
 * 
 * @example
 * Basic clamping:
 * ```typescript
 * clamp(150, 0, 100);    // Returns 100
 * clamp(-10, 0, 100);    // Returns 0  
 * clamp(50, 0, 100);     // Returns 50
 * ```
 * 
 * @example
 * Color channel clamping:
 * ```typescript
 * const red = clamp(colorValue, 0, 255);
 * const alpha = clamp(transparency, 0, 1);
 * ```
 * 
 * @see {@link normalize} for converting values to 0-1 range
 * @see {@link map} for remapping between different ranges
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (min > max) {
    [min, max] = [max, min];
  }
  return Math.min(Math.max(value, min), max);
};

/**
 * Performs linear interpolation between two values.
 * 
 * @param a - The start value (returned when t = 0)
 * @param b - The end value (returned when t = 1)
 * @param t - The interpolation factor, typically between 0 and 1
 * @returns The interpolated value along the line from a to b
 * 
 * @remarks
 * Linear interpolation (lerp) is fundamental to computer graphics and animation.
 * While t is typically in the range [0, 1], values outside this range will
 * extrapolate beyond the a-b segment. The function includes robust handling
 * for edge cases involving NaN and infinite values.
 * 
 * Mathematical formula: `result = a + (b - a) * t`
 * 
 * @example
 * Basic interpolation:
 * ```typescript
 * lerp(0, 100, 0.5);    // Returns 50 (midpoint)
 * lerp(10, 20, 0.25);   // Returns 12.5
 * lerp(0, 1, 0.8);      // Returns 0.8
 * ```
 * 
 * @example
 * Animation over time:
 * ```typescript
 * const startPos = 0;
 * const endPos = 200;
 * const animationProgress = elapsedTime / totalDuration;
 * const currentPos = lerp(startPos, endPos, animationProgress);
 * ```
 * 
 * @example
 * Color interpolation:
 * ```typescript
 * const startColor = 0;
 * const endColor = 255;
 * const redChannel = lerp(startColor, endColor, colorProgress);
 * ```
 * 
 * @see {@link smoothstep} for smooth interpolation with easing
 * @see {@link vec2Lerp} for vector interpolation
 * @see {@link colorLerp} for color interpolation
 */
export const lerp = (a: number, b: number, t: number): number => {
  // Handle extreme values
  if (isNaN(a) || isNaN(b) || isNaN(t)) return NaN;
  if (t === 0) return a;
  if (t === 1) return b;
  if (a === Infinity && b === -Infinity) return NaN;
  if (a === -Infinity && b === Infinity) return NaN;
  if (a === Infinity) return Infinity;
  if (b === Infinity) return Infinity;
  if (a === -Infinity) return -Infinity;
  if (b === -Infinity) return -Infinity;
  return a + (b - a) * t;
};

/**
 * Maps a value from one range to another range.
 * 
 * @param value - The input value to map
 * @param inMin - The minimum of the input range
 * @param inMax - The maximum of the input range  
 * @param outMin - The minimum of the output range
 * @param outMax - The maximum of the output range
 * @returns The mapped value in the output range
 * 
 * @remarks
 * This function is essential for converting values between different coordinate systems,
 * scales, or units. It performs a linear transformation that preserves the relative
 * position of the value within its range.
 * 
 * The mapping is performed using the formula:
 * `result = outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin)`
 * 
 * If inMin equals inMax (zero input range), the function returns Infinity to indicate
 * an undefined mapping.
 * 
 * @example
 * Converting between ranges:
 * ```typescript
 * map(50, 0, 100, 0, 1);        // Returns 0.5 (50% to normalized)
 * map(128, 0, 255, -1, 1);      // Returns 0.004 (8-bit to signed normalized)
 * map(0.5, 0, 1, 20, 80);       // Returns 50 (normalized to custom range)
 * ```
 * 
 * @example
 * Screen coordinate conversion:
 * ```typescript
 * const screenX = map(worldX, -worldWidth/2, worldWidth/2, 0, canvasWidth);
 * const screenY = map(worldY, -worldHeight/2, worldHeight/2, 0, canvasHeight);
 * ```
 * 
 * @example
 * Sensor data scaling:
 * ```typescript
 * const temperature = map(sensorReading, 0, 1023, -40, 125);  // ADC to Celsius
 * const brightness = map(lightSensor, 0, 4095, 0, 100);       // Raw to percentage
 * ```
 * 
 * @see {@link normalize} for mapping to 0-1 range specifically
 * @see {@link lerp} for the inverse operation (value from normalized t)
 * @see {@link clamp} for constraining the result to bounds
 */
export const map = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
  // Handle zero input range
  if (inMax === inMin) return Infinity;
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
};

/**
 * Normalizes a value from a given range to the 0-1 range.
 * 
 * @param value - The value to normalize
 * @param min - The minimum of the input range
 * @param max - The maximum of the input range
 * @returns The normalized value between 0 and 1
 * 
 * @remarks
 * Normalization is a special case of mapping where the output range is always [0, 1].
 * This is fundamental in computer graphics for creating unit values that can be
 * used with interpolation functions, color operations, and mathematical transformations.
 * 
 * When min equals max (zero range), the function returns NaN if value equals min,
 * or Infinity if value differs from the bounds, indicating undefined normalization.
 * 
 * @example
 * Basic normalization:
 * ```typescript
 * normalize(50, 0, 100);     // Returns 0.5
 * normalize(25, 0, 100);     // Returns 0.25
 * normalize(200, 100, 300);  // Returns 0.5
 * ```
 * 
 * @example
 * Time-based animations:
 * ```typescript
 * const progress = normalize(currentTime, startTime, endTime);
 * const animationValue = lerp(startValue, endValue, progress);
 * ```
 * 
 * @example
 * Color channel normalization:
 * ```typescript
 * const normalizedRed = normalize(redValue, 0, 255);   // 8-bit to normalized
 * const normalizedHue = normalize(hueValue, 0, 360);   // Degrees to normalized
 * ```
 * 
 * @see {@link map} for mapping to arbitrary ranges
 * @see {@link clamp} for constraining normalized values to [0, 1]
 * @see {@link lerp} for converting normalized values back to ranges
 */
export const normalize = (value: number, min: number, max: number): number => {
  // Handle zero range
  if (max === min) {
    if (value === min) return NaN;
    return Infinity;
  }
  return (value - min) / (max - min);
};

/**
 * Performs smooth Hermite interpolation between two edges.
 * 
 * @param edge0 - Lower edge of the transition
 * @param edge1 - Upper edge of the transition  
 * @param x - Input value to smooth
 * @returns Smoothly interpolated value between 0 and 1
 * 
 * @remarks
 * Smoothstep creates a smooth transition from 0 to 1 as x moves from edge0 to edge1.
 * Unlike linear interpolation, smoothstep has zero derivatives at the boundaries,
 * creating natural-looking ease-in and ease-out behavior. This is the classic
 * 3x² - 2x³ Hermite interpolation polynomial.
 * 
 * The function automatically clamps the result to [0, 1], making it safe for
 * any input values. When x ≤ edge0, returns 0; when x ≥ edge1, returns 1.
 * 
 * @example
 * Smooth transitions:
 * ```typescript
 * const fadeIn = smoothstep(0, 1, time);        // Smooth 0 to 1 transition
 * const threshold = smoothstep(0.3, 0.7, value); // Smooth step function
 * ```
 * 
 * @example
 * Edge detection and masking:
 * ```typescript
 * const edgeMask = smoothstep(0.1, 0.2, distance); // Soft edge falloff
 * const visibility = smoothstep(fogStart, fogEnd, depth); // Fog effect
 * ```
 * 
 * @see {@link smootherstep} for even smoother transitions
 * @see {@link lerp} for linear interpolation
 * @see {@link clamp} for hard clamping
 */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Performs an even smoother interpolation than smoothstep with zero first and second derivatives.
 * 
 * @param edge0 - Lower edge of the transition
 * @param edge1 - Upper edge of the transition
 * @param x - Input value to smooth
 * @returns Smoothly interpolated value between 0 and 1
 * 
 * @remarks
 * Smootherstep uses a 6x⁵ - 15x⁴ + 10x³ polynomial that has zero first AND second
 * derivatives at the boundaries, creating an even more natural transition than smoothstep.
 * This results in extremely smooth animation curves with no visible acceleration artifacts.
 * 
 * Use smootherstep when you need the highest quality smooth transitions, especially
 * for camera movements, UI animations, or any situation where smoothstep still appears
 * too abrupt. The trade-off is slightly higher computational cost.
 * 
 * @example
 * Ultra-smooth animations:
 * ```typescript
 * const cameraEasing = smootherstep(0, 1, t);     // Ultra-smooth camera movement
 * const premiumFade = smootherstep(0, 1, alpha);  // High-quality fade effect
 * ```
 * 
 * @example
 * Professional motion graphics:
 * ```typescript
 * const logoScale = smootherstep(0, 1, progress);    // Smooth logo entrance
 * const particleAlpha = smootherstep(0.8, 1, life); // Soft particle fade-out
 * ```
 * 
 * @see {@link smoothstep} for the standard smooth transition
 * @see {@link lerp} for linear interpolation
 * @see {@link easeInOutCubic} for animation easing functions
 */
export const smootherstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/**
 * Converts radians to degrees.
 * 
 * @param radians - Angle in radians
 * @returns Angle in degrees
 * 
 * @remarks
 * This is a utility function for converting between the mathematical standard (radians)
 * and the more human-readable degree system. Useful when working with user input,
 * display values, or interfacing with systems that expect degree measurements.
 * 
 * @example
 * Convert common radian values:
 * ```typescript
 * degrees(Math.PI);     // 180
 * degrees(Math.PI / 2); // 90
 * degrees(Math.PI / 4); // 45
 * degrees(TWO_PI);      // 360
 * ```
 * 
 * @see {@link radians} for the inverse conversion
 * @see {@link PI} and {@link TWO_PI} for common radian constants
 */
export const degrees = (radians: number): number => {
  return (radians * 180) / PI;
};

/**
 * Converts degrees to radians.
 * 
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 * 
 * @remarks
 * This converts from the human-readable degree system to the mathematical
 * standard of radians used by trigonometric functions. Essential for
 * converting user input or configuration values to usable math operations.
 * 
 * @example
 * Convert common degree values:
 * ```typescript
 * radians(180); // Math.PI
 * radians(90);  // Math.PI / 2
 * radians(45);  // Math.PI / 4
 * radians(360); // TWO_PI
 * ```
 * 
 * @see {@link degrees} for the inverse conversion
 * @see {@link sin}, {@link cos}, {@link tan} for trigonometric functions that expect radians
 */
export const radians = (degrees: number): number => {
  return (degrees * PI) / 180;
};

/**
 * Returns the sign of a number (-1, 0, or 1).
 * 
 * @param x - Input number
 * @returns -1 if negative, 1 if positive, 0 if zero
 * 
 * @remarks
 * The sign function is useful for determining direction, polarity, or for
 * creating step functions in mathematical operations. Unlike Math.sign(),
 * this implementation clearly handles the zero case and follows standard
 * mathematical conventions.
 * 
 * @example
 * Basic sign detection:
 * ```typescript
 * sign(5);    // 1
 * sign(-3);   // -1
 * sign(0);    // 0
 * sign(0.1);  // 1
 * ```
 * 
 * @example
 * Direction and movement:
 * ```typescript
 * const direction = sign(targetX - currentX); // -1 = left, 1 = right
 * const velocity = speed * direction;
 * ```
 */
export const sign = (x: number): number => {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
};

/**
 * Returns the fractional part of a number (always positive).
 * 
 * @param x - Input number
 * @returns Fractional part in range [0, 1)
 * 
 * @remarks
 * The fract function extracts the fractional part of a number, effectively
 * "wrapping" values to the [0, 1) range. This is extremely useful for creating
 * repeating patterns, texture coordinates, and periodic functions in graphics.
 * 
 * Unlike simple modulo operations, fract always returns a positive result,
 * making it ideal for array indexing and coordinate mapping.
 * 
 * @example
 * Basic fractional extraction:
 * ```typescript
 * fract(3.14);   // 0.14
 * fract(-2.7);   // 0.3
 * fract(5.0);    // 0.0
 * fract(0.123);  // 0.123
 * ```
 * 
 * @example
 * Repeating patterns and textures:
 * ```typescript
 * const tileX = fract(worldX / tileSize);  // Wrap coordinates to tile
 * const wavePattern = sin(fract(time) * TWO_PI); // Repeating wave
 * ```
 * 
 * @see {@link wrap} for custom range wrapping
 * @see {@link floor} for the integer part
 */
export const fract = (x: number): number => {
  return x - Math.floor(x);
};

/**
 * Wraps a value to stay within a specified range.
 * 
 * @param value - Value to wrap
 * @param min - Minimum bound (inclusive)
 * @param max - Maximum bound (exclusive)
 * @returns Wrapped value in range [min, max)
 * 
 * @remarks
 * Wrap creates a "toroidal" or "circular" range where values that exceed
 * the maximum bound wrap around to the minimum, and vice versa. This is
 * essential for creating seamless periodic behaviors, circular arrays,
 * and bounded coordinate systems.
 * 
 * The implementation handles negative values correctly, ensuring the result
 * is always within the specified range regardless of input magnitude.
 * 
 * @example
 * Circular coordinate wrapping:
 * ```typescript
 * wrap(370, 0, 360);   // 10 (degrees)
 * wrap(-30, 0, 360);   // 330 (degrees)
 * wrap(5, 0, 3);       // 2 (array index)
 * wrap(-1, 0, 5);      // 4 (negative wrap)
 * ```
 * 
 * @example
 * Game world boundaries:
 * ```typescript
 * const worldWidth = 1000;
 * const wrappedX = wrap(player.x, 0, worldWidth); // Wrap around world
 * 
 * const arrayIndex = wrap(currentIndex + offset, 0, array.length);
 * ```
 * 
 * @see {@link fract} for 0-1 range wrapping
 * @see {@link clamp} for hard boundary clamping
 * @see {@link map} for range remapping
 */
export const wrap = (value: number, min: number, max: number): number => {
  const range = max - min;
  return range === 0 ? min : min + ((((value - min) % range) + range) % range);
};

// ============================================================================
// Vector2 Utilities
// ============================================================================

/**
 * Creates a 2D vector with x and y components.
 * 
 * @param x - X component
 * @param y - Y component
 * @returns Vector2 object
 * 
 * @remarks
 * Vectors are fundamental building blocks for 2D graphics, physics, and mathematics.
 * They represent positions, velocities, forces, directions, and any other 2D quantity.
 * This function provides a clean, type-safe way to create vector objects.
 * 
 * @example
 * Basic vector creation:
 * ```typescript
 * const position = vec2(100, 150);
 * const velocity = vec2(-5, 10);
 * const zero = vec2(0, 0);
 * ```
 * 
 * @see {@link vec2Add}, {@link vec2Sub} for vector arithmetic
 * @see {@link vec2Length} for magnitude calculations
 * @see {@link vec2Normalize} for unit vectors
 */
export const vec2 = (x: number, y: number): Vector2 => ({ x, y });

/**
 * Adds two 2D vectors component-wise.
 * 
 * @param a - First vector
 * @param b - Second vector
 * @returns Sum of the two vectors
 * 
 * @remarks
 * Vector addition is commutative and associative, making it safe to chain
 * multiple additions. This operation is fundamental for combining forces,
 * velocities, displacements, and other vector quantities.
 * 
 * @example
 * Combine position and velocity:
 * ```typescript
 * const position = vec2(100, 200);
 * const velocity = vec2(5, -3);
 * const newPosition = vec2Add(position, velocity);
 * ```
 * 
 * @example
 * Force accumulation:
 * ```typescript
 * const gravity = vec2(0, -9.8);
 * const wind = vec2(2, 0);
 * const totalForce = vec2Add(gravity, wind);
 * ```
 * 
 * @see {@link vec2Sub} for vector subtraction
 * @see {@link vec2Mul}, {@link vec2Div} for scalar operations
 */
export const vec2Add = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y
});

/**
 * Subtracts the second vector from the first component-wise.
 * 
 * @param a - Vector to subtract from
 * @param b - Vector to subtract
 * @returns Difference vector (a - b)
 * 
 * @remarks
 * Vector subtraction is used to find relative positions, distances,
 * and directions between points. The result represents the vector
 * that points from b to a.
 * 
 * @example
 * Calculate direction between points:
 * ```typescript
 * const player = vec2(100, 100);
 * const target = vec2(150, 80);
 * const direction = vec2Sub(target, player); // Points toward target
 * ```
 * 
 * @example
 * Relative movement:
 * ```typescript
 * const oldPos = vec2(50, 75);
 * const newPos = vec2(55, 70);
 * const movement = vec2Sub(newPos, oldPos); // (5, -5)
 * ```
 * 
 * @see {@link vec2Add} for vector addition
 * @see {@link vec2Distance} for distance between points
 * @see {@link vec2Normalize} for unit direction vectors
 */
export const vec2Sub = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x - b.x,
  y: a.y - b.y
});

/**
 * Multiplies a vector by a scalar value.
 * 
 * @param a - Vector to scale
 * @param scalar - Scale factor
 * @returns Scaled vector
 * 
 * @remarks
 * Scalar multiplication scales the magnitude of a vector while preserving
 * its direction (for positive scalars) or reversing it (for negative scalars).
 * This is fundamental for scaling velocities, forces, and other vector quantities.
 * 
 * The function includes handling for negative zero to ensure clean output.
 * 
 * @example
 * Scale velocity:
 * ```typescript
 * const velocity = vec2(10, 5);
 * const fastVelocity = vec2Mul(velocity, 2);    // (20, 10)
 * const slowVelocity = vec2Mul(velocity, 0.5);  // (5, 2.5)
 * const reversed = vec2Mul(velocity, -1);       // (-10, -5)
 * ```
 * 
 * @example
 * Apply time delta:
 * ```typescript
 * const velocity = vec2(100, 50);  // pixels per second
 * const deltaTime = 0.016;         // 60 FPS
 * const movement = vec2Mul(velocity, deltaTime); // pixels this frame
 * ```
 * 
 * @see {@link vec2Div} for scalar division
 * @see {@link vec2Normalize} for unit vectors
 * @see {@link vec2Length} for magnitude calculation
 */
export const vec2Mul = (a: Vector2, scalar: number): Vector2 => ({
  x: a.x * scalar === -0 ? 0 : a.x * scalar,
  y: a.y * scalar === -0 ? 0 : a.y * scalar
});

/**
 * Divides a vector by a scalar value.
 * 
 * @param a - Vector to divide
 * @param scalar - Divisor (should not be zero)
 * @returns Divided vector
 * 
 * @remarks
 * Scalar division is equivalent to multiplying by the reciprocal. It's commonly
 * used for normalizing vectors when you know the length, or for averaging
 * vector quantities.
 * 
 * **Warning:** Division by zero will result in Infinity components.
 * 
 * @example
 * Average multiple vectors:
 * ```typescript
 * const vectors = [vec2(10, 20), vec2(30, 40), vec2(50, 60)];
 * const sum = vectors.reduce(vec2Add);
 * const average = vec2Div(sum, vectors.length); // (30, 40)
 * ```
 * 
 * @example
 * Manual normalization:
 * ```typescript
 * const vector = vec2(6, 8);
 * const length = vec2Length(vector); // 10
 * const normalized = vec2Div(vector, length); // (0.6, 0.8)
 * ```
 * 
 * @see {@link vec2Mul} for scalar multiplication
 * @see {@link vec2Normalize} for proper normalization
 * @see {@link vec2Length} for magnitude calculation
 */
export const vec2Div = (a: Vector2, scalar: number): Vector2 => ({
  x: a.x / scalar,
  y: a.y / scalar
});

/**
 * Calculates the dot product of two vectors.
 * 
 * @param a - First vector
 * @param b - Second vector
 * @returns Dot product (scalar value)
 * 
 * @remarks
 * The dot product measures how much two vectors point in the same direction.
 * It returns:
 * - Positive value: vectors point in similar directions (< 90° angle)
 * - Zero: vectors are perpendicular (90° angle)
 * - Negative value: vectors point in opposite directions (> 90° angle)
 * 
 * The magnitude equals |a| × |b| × cos(θ) where θ is the angle between vectors.
 * 
 * @example
 * Direction analysis:
 * ```typescript
 * const forward = vec2(1, 0);
 * const movement = vec2(0.8, 0.6);
 * const similarity = vec2Dot(forward, movement); // 0.8 (pointing forward)
 * ```
 * 
 * @example
 * Collision detection (separating axis):
 * ```typescript
 * const normal = vec2(0, 1);  // Up direction
 * const velocity = vec2(5, -3);
 * const projection = vec2Dot(velocity, normal); // -3 (moving down)
 * ```
 * 
 * @see {@link vec2Angle} for angle calculation
 * @see {@link vec2Length} for magnitude
 * @see {@link vec2Normalize} for unit vectors
 */
export const vec2Dot = (a: Vector2, b: Vector2): number => {
  return a.x * b.x + a.y * b.y;
};

export const vec2Length = (v: Vector2): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};

export const vec2LengthSq = (v: Vector2): number => {
  return v.x * v.x + v.y * v.y;
};

export const vec2Normalize = (v: Vector2): Vector2 => {
  const lengthSq = v.x * v.x + v.y * v.y;
  if (lengthSq === 0) return vec2(0, 0);
  if (!isFinite(lengthSq)) return vec2(NaN, NaN);
  const length = Math.sqrt(lengthSq);
  return {
    x: v.x / length,
    y: v.y / length
  };
};

export const vec2Distance = (a: Vector2, b: Vector2): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const vec2Angle = (v: Vector2): number => {
  return Math.atan2(v.y, v.x);
};

export const vec2FromAngle = (angle: number, length: number = 1): Vector2 => ({
  x: Math.cos(angle) * length,
  y: Math.sin(angle) * length
});

export const vec2Lerp = (a: Vector2, b: Vector2, t: number): Vector2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t)
});

export const vec2Rotate = (v: Vector2, angle: number): Vector2 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos
  };
};

// Vector3 utilities
export const vec3 = (x: number, y: number, z: number): Vector3 => ({ x, y, z });

export const vec3Add = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z
});

export const vec3Sub = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z
});

export const vec3Mul = (a: Vector3, scalar: number): Vector3 => ({
  x: a.x * scalar,
  y: a.y * scalar,
  z: a.z * scalar
});

export const vec3Div = (a: Vector3, scalar: number): Vector3 => ({
  x: a.x / scalar,
  y: a.y / scalar,
  z: a.z / scalar
});

export const vec3Dot = (a: Vector3, b: Vector3): number => {
  return a.x * b.x + a.y * b.y + a.z * b.z;
};

export const vec3Cross = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x
});

export const vec3Length = (v: Vector3): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
};

export const vec3LengthSq = (v: Vector3): number => {
  return v.x * v.x + v.y * v.y + v.z * v.z;
};

export const vec3Normalize = (v: Vector3): Vector3 => {
  const length = vec3Length(v);
  return length > 0 ? vec3Div(v, length) : vec3(0, 0, 0);
};

export const vec3Distance = (a: Vector3, b: Vector3): number => {
  return vec3Length(vec3Sub(a, b));
};

export const vec3Lerp = (a: Vector3, b: Vector3, t: number): Vector3 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t)
});

// Matrix utilities
export const mat3Identity = (): Matrix3x3 => ({
  elements: [1, 0, 0, 0, 1, 0, 0, 0, 1]
});

export const mat3FromValues = (
  m00: number,
  m01: number,
  m02: number,
  m10: number,
  m11: number,
  m12: number,
  m20: number,
  m21: number,
  m22: number
): Matrix3x3 => ({
  elements: [m00, m01, m02, m10, m11, m12, m20, m21, m22]
});

export const mat3Multiply = (a: Matrix3x3, b: Matrix3x3): Matrix3x3 => {
  const ae = a.elements;
  const be = b.elements;

  return {
    elements: [
      ae[0] * be[0] + ae[1] * be[3] + ae[2] * be[6],
      ae[0] * be[1] + ae[1] * be[4] + ae[2] * be[7],
      ae[0] * be[2] + ae[1] * be[5] + ae[2] * be[8],
      ae[3] * be[0] + ae[4] * be[3] + ae[5] * be[6],
      ae[3] * be[1] + ae[4] * be[4] + ae[5] * be[7],
      ae[3] * be[2] + ae[4] * be[5] + ae[5] * be[8],
      ae[6] * be[0] + ae[7] * be[3] + ae[8] * be[6],
      ae[6] * be[1] + ae[7] * be[4] + ae[8] * be[7],
      ae[6] * be[2] + ae[7] * be[5] + ae[8] * be[8]
    ]
  };
};

export const mat3TransformVec2 = (m: Matrix3x3, v: Vector2): Vector2 => {
  const e = m.elements;
  return {
    x: e[0] * v.x + e[1] * v.y + e[2],
    y: e[3] * v.x + e[4] * v.y + e[5]
  };
};

// Trigonometry utilities
export const sin = Math.sin;
export const cos = Math.cos;
export const tan = Math.tan;
export const asin = Math.asin;
export const acos = Math.acos;
export const atan = Math.atan;
export const atan2 = Math.atan2;
export const sinh = Math.sinh;
export const cosh = Math.cosh;
export const tanh = Math.tanh;

// Common math functions
export const abs = Math.abs;
export const ceil = Math.ceil;
export const floor = Math.floor;
export const round = Math.round;
export const trunc = Math.trunc;
export const sqrt = Math.sqrt;
export const pow = Math.pow;
export const exp = Math.exp;
export const log = Math.log;
export const log2 = Math.log2;
export const log10 = Math.log10;
export const min = Math.min;
export const max = Math.max;
export const random = Math.random;
