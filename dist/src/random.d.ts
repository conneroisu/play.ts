/**
 * Random number generation and noise utilities for creative coding and procedural generation.
 *
 * This module provides comprehensive random number generation tools including seeded generators,
 * noise functions, and specialized random distributions commonly used in creative coding,
 * generative art, and procedural content creation. All generators support both seeded
 * (deterministic) and unseeded (non-deterministic) operation.
 *
 * @remarks
 * The random system is built around several key concepts:
 *
 * **Seeded vs Unseeded Generation:**
 * - Seeded generators produce deterministic, reproducible sequences
 * - Unseeded generators use `Math.random()` for truly random values
 * - Seeded generation is essential for consistent procedural generation
 *
 * **Noise vs Random:**
 * - Random functions produce independent, uncorrelated values
 * - Noise functions produce smooth, continuous, correlated values
 * - Noise is ideal for natural-looking textures, terrain, and organic patterns
 *
 * **Distribution Types:**
 * - Uniform: Equal probability across the range (default)
 * - Gaussian/Normal: Bell curve distribution around a mean
 * - Custom: Weighted distributions for specific use cases
 *
 * @example
 * Basic random operations:
 * ```typescript
 * import { randomInt, randomFloat, randomChoice, setSeed } from 'play.ts';
 *
 * // Set seed for reproducible results
 * setSeed(12345);
 *
 * const dice = randomInt(1, 6);           // 1-6 inclusive
 * const position = randomFloat(-10, 10);  // Continuous range
 * const color = randomChoice(['red', 'green', 'blue']);
 * ```
 *
 * @example
 * Noise-based generation:
 * ```typescript
 * import { noise, fractalNoise } from 'play.ts';
 *
 * // 2D Perlin noise for terrain
 * const height = noise.noise2D(x * 0.01, y * 0.01);
 *
 * // Fractal noise for complex textures
 * const texture = fractalNoise(x * 0.005, y * 0.005, {
 *   octaves: 4,
 *   persistence: 0.5,
 *   lacunarity: 2.0
 * });
 * ```
 *
 * @example
 * Specialized distributions:
 * ```typescript
 * import { randomGaussian, randomInCircle, weightedChoice } from 'play.ts';
 *
 * // Normal distribution for natural variation
 * const variation = randomGaussian(0, 1);  // Mean=0, StdDev=1
 *
 * // Uniform distribution in circle
 * const position = randomInCircle();
 *
 * // Weighted random selection
 * const rarity = weightedChoice([
 *   { value: 'common', weight: 70 },
 *   { value: 'rare', weight: 25 },
 *   { value: 'legendary', weight: 5 }
 * ]);
 * ```
 *
 * @see {@link https://en.wikipedia.org/wiki/Pseudorandom_number_generator | Pseudorandom Number Generators}
 * @see {@link https://en.wikipedia.org/wiki/Perlin_noise | Perlin Noise}
 * @see {@link https://www.redblobgames.com/articles/noise/introduction.html | Introduction to Noise}
 */
import type { RandomGenerator, NoiseGenerator, Vector2 } from '../types/index.ts';
/**
 * Seeded random number generator using Linear Congruential Generator (LCG) algorithm.
 *
 * @remarks
 * This class provides deterministic random number generation, where the same seed
 * will always produce the same sequence of numbers. This is essential for:
 * - Reproducible procedural generation
 * - Testing and debugging
 * - Sharing generative art with consistent results
 * - Save/load functionality in games
 *
 * The implementation uses the Numerical Recipes LCG with parameters:
 * - Multiplier: 1664525
 * - Increment: 1013904223
 * - Modulus: 2^32
 *
 * These parameters provide a full period of 2^32 before repetition and good
 * statistical properties for most creative coding applications.
 *
 * @example
 * Basic seeded generation:
 * ```typescript
 * const rng = new SeededRandom(12345);
 *
 * console.log(rng.next());    // Always 0.123... for seed 12345
 * console.log(rng.int(1, 6)); // Deterministic dice roll
 * console.log(rng.float(0, 1)); // Deterministic float
 * ```
 *
 * @example
 * Reproducible procedural generation:
 * ```typescript
 * const generateWorld = (seed: number) => {
 *   const rng = new SeededRandom(seed);
 *   const terrain = [];
 *
 *   for (let i = 0; i < 1000; i++) {
 *     terrain.push({
 *       height: rng.gaussian(50, 10),
 *       type: rng.choice(['grass', 'stone', 'water'])
 *     });
 *   }
 *   return terrain;
 * };
 *
 * // Same seed = identical world
 * const world1 = generateWorld(42);
 * const world2 = generateWorld(42);
 * // world1 and world2 are identical
 * ```
 *
 * @see {@link https://en.wikipedia.org/wiki/Linear_congruential_generator | Linear Congruential Generator}
 * @see {@link setSeed} for global seeded generation
 */
export declare class SeededRandom implements RandomGenerator {
    private seed_;
    /**
     * Creates a new seeded random number generator.
     *
     * @param seed - Initial seed value (defaults to current timestamp)
     */
    constructor(seed?: number);
    /**
     * Generates the next random number in the sequence.
     *
     * @returns Random number between 0 and 1 (exclusive of 1)
     *
     * @remarks
     * This is the core generator method that all other random functions build upon.
     * It advances the internal state and returns a uniformly distributed value
     * in the range [0, 1).
     */
    next(): number;
    /**
     * Sets a new seed value, resetting the generator state.
     *
     * @param value - New seed value
     *
     * @remarks
     * This allows you to restart the sequence from a known point,
     * useful for creating variations or branches in procedural generation.
     */
    seed(value: number): void;
    /**
     * Generates a random integer within the specified range (inclusive).
     *
     * @param min - Minimum value (inclusive)
     * @param max - Maximum value (inclusive)
     * @returns Random integer between min and max
     *
     * @example
     * ```typescript
     * const rng = new SeededRandom();
     * const dice = rng.int(1, 6);      // 1, 2, 3, 4, 5, or 6
     * const index = rng.int(0, 9);     // Array index 0-9
     * const coord = rng.int(-50, 50);  // Coordinate -50 to 50
     * ```
     */
    int(min: number, max: number): number;
    /**
     * Generates a random floating-point number within the specified range.
     *
     * @param min - Minimum value (inclusive)
     * @param max - Maximum value (exclusive)
     * @returns Random float between min and max
     *
     * @example
     * ```typescript
     * const rng = new SeededRandom();
     * const position = rng.float(-10, 10);    // Continuous position
     * const opacity = rng.float(0, 1);        // Alpha value
     * const angle = rng.float(0, Math.PI * 2); // Full rotation
     * ```
     */
    float(min: number, max: number): number;
    /**
     * Generates a random boolean value with 50% probability for each.
     *
     * @returns Random boolean (true or false)
     *
     * @example
     * ```typescript
     * const rng = new SeededRandom();
     * const coinFlip = rng.bool();           // true or false
     * const shouldSpawn = rng.bool();        // 50% spawn chance
     * const direction = rng.bool() ? 1 : -1; // Random direction
     * ```
     */
    bool(): boolean;
    /**
     * Selects a random element from an array.
     *
     * @param array - Array to choose from
     * @returns Random element from the array
     * @throws {Error} If the array is empty
     *
     * @example
     * ```typescript
     * const rng = new SeededRandom();
     * const colors = ['red', 'green', 'blue', 'yellow'];
     * const randomColor = rng.choice(colors);
     *
     * const directions = [vec2(1, 0), vec2(0, 1), vec2(-1, 0), vec2(0, -1)];
     * const randomDirection = rng.choice(directions);
     * ```
     */
    choice<T>(array: T[]): T;
    /**
     * Generates a random sign value (-1 or 1).
     *
     * @returns Either -1 or 1 with equal probability
     *
     * @example
     * ```typescript
     * const rng = new SeededRandom();
     * const velocity = rng.sign() * speed;     // Random direction
     * const offset = rng.sign() * variation;  // Random offset
     * const flip = rng.sign() > 0;            // Random boolean as sign
     * ```
     */
    sign(): number;
    /**
     * Generates a random angle in radians (0 to 2π).
     *
     * @returns Random angle in radians
     *
     * @example
     * ```typescript
     * const rng = new SeededRandom();
     * const rotation = rng.angle();           // Full rotation range
     * const direction = vec2FromAngle(rng.angle()); // Random unit vector
     *
     * // Position objects in a circle
     * const radius = 100;
     * const angle = rng.angle();
     * const pos = vec2(
     *   centerX + Math.cos(angle) * radius,
     *   centerY + Math.sin(angle) * radius
     * );
     * ```
     */
    angle(): number;
    /**
     * Generates a random point uniformly distributed inside a unit circle.
     *
     * @returns Random vector with magnitude ≤ 1
     *
     * @remarks
     * This method uses the correct algorithm for uniform distribution within a circle,
     * applying square root to the radius to ensure equal area coverage. Simply using
     * a linear radius would cluster points toward the center.
     *
     * @example
     * ```typescript
     * const rng = new SeededRandom();
     * const randomPoint = rng.inCircle();     // Point in unit circle
     *
     * // Scale to custom radius
     * const radius = 50;
     * const scaledPoint = vec2Mul(rng.inCircle(), radius);
     *
     * // Random spawn position in circular area
     * const spawnRadius = 100;
     * const spawnOffset = vec2Mul(rng.inCircle(), spawnRadius);
     * const spawnPos = vec2Add(centerPos, spawnOffset);
     * ```
     */
    inCircle(): Vector2;
    /**
     * Generates a random point on the circumference of a unit circle.
     *
     * @returns Random unit vector (magnitude = 1)
     *
     * @example
     * ```typescript
     * const rng = new SeededRandom();
     * const direction = rng.onCircle();       // Random unit direction
     *
     * // Random velocity with fixed speed
     * const speed = 200;
     * const velocity = vec2Mul(rng.onCircle(), speed);
     *
     * // Position objects on circle perimeter
     * const radius = 80;
     * const circlePoint = vec2Mul(rng.onCircle(), radius);
     * const worldPos = vec2Add(center, circlePoint);
     * ```
     */
    onCircle(): Vector2;
    /**
     * Generates a random number from a Gaussian (normal) distribution.
     *
     * @param mean - Mean (center) of the distribution (default: 0)
     * @param standardDeviation - Standard deviation (spread) of the distribution (default: 1)
     * @returns Random number following the specified normal distribution
     *
     * @remarks
     * This method implements the Box-Muller transform to convert uniform random numbers
     * into normally distributed values. The Gaussian distribution creates a bell curve
     * where:
     * - ~68% of values fall within 1 standard deviation of the mean
     * - ~95% of values fall within 2 standard deviations
     * - ~99.7% of values fall within 3 standard deviations
     *
     * This is ideal for creating natural-looking variation in size, position,
     * timing, and other parameters where extreme values should be rare.
     *
     * @example
     * Natural variation in procedural generation:
     * ```typescript
     * const rng = new SeededRandom();
     *
     * // Tree heights with average 10, varying by ~2
     * const treeHeight = rng.gaussian(10, 2);
     *
     * // Particle lifetimes centered at 3 seconds
     * const lifetime = Math.max(0, rng.gaussian(3, 0.5));
     *
     * // Natural timing variation (±0.1 seconds)
     * const timing = rng.gaussian(1.0, 0.1);
     * ```
     *
     * @example
     * Character attribute generation:
     * ```typescript
     * const generateCharacter = (rng: SeededRandom) => {
     *   return {
     *     strength: Math.max(1, Math.round(rng.gaussian(10, 2))),  // 1-20, mostly 8-12
     *     intelligence: Math.max(1, Math.round(rng.gaussian(10, 3))), // More variation
     *     luck: Math.max(1, Math.round(rng.gaussian(5, 1)))        // Lower average
     *   };
     * };
     * ```
     *
     * @see {@link https://en.wikipedia.org/wiki/Normal_distribution | Normal Distribution}
     * @see {@link https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform | Box-Muller Transform}
     */
    gaussian(mean?: number, standardDeviation?: number): number;
    private hasNextGaussian;
    private nextGaussian;
}
/**
 * Simple hash-based noise generator for smooth, continuous random values.
 *
 * @remarks
 * Unlike pure random functions that produce independent values, noise functions
 * generate smooth, continuous fields where nearby inputs produce similar outputs.
 * This creates natural-looking patterns ideal for:
 *
 * - **Terrain generation**: Heights, moisture, temperature maps
 * - **Texture synthesis**: Organic-looking surface patterns
 * - **Animation**: Smooth parameter variation over time
 * - **Procedural content**: Natural-looking randomness
 *
 * This implementation uses fast hash functions with smoothstep interpolation
 * to balance performance with visual quality. For higher-quality noise,
 * consider using {@link PerlinNoise} or {@link FractalNoise}.
 *
 * **Key characteristics:**
 * - Output range: [0, 1]
 * - Smooth transitions between sample points
 * - Deterministic (same input = same output)
 * - Fast computation suitable for real-time applications
 *
 * @example
 * Basic noise sampling:
 * ```typescript
 * const noise = new SimpleNoise();
 *
 * // 1D noise for animation
 * const wave = noise.noise1D(time * 0.01);
 *
 * // 2D noise for terrain
 * const height = noise.noise2D(x * 0.01, y * 0.01);
 *
 * // 3D noise for volumetric effects
 * const density = noise.noise3D(x * 0.05, y * 0.05, z * 0.05);
 * ```
 *
 * @example
 * Terrain generation:
 * ```typescript
 * const generateTerrain = (width: number, height: number) => {
 *   const noise = new SimpleNoise();
 *   const terrain = [];
 *
 *   for (let y = 0; y < height; y++) {
 *     const row = [];
 *     for (let x = 0; x < width; x++) {
 *       // Multiple octaves for complex terrain
 *       const elevation =
 *         noise.noise2D(x * 0.01, y * 0.01) * 0.5 +     // Large features
 *         noise.noise2D(x * 0.02, y * 0.02) * 0.3 +     // Medium features
 *         noise.noise2D(x * 0.05, y * 0.05) * 0.2;      // Small details
 *
 *       row.push(elevation);
 *     }
 *     terrain.push(row);
 *   }
 *   return terrain;
 * };
 * ```
 *
 * @see {@link PerlinNoise} for higher-quality gradient noise
 * @see {@link FractalNoise} for multi-octave noise patterns
 * @see {@link https://en.wikipedia.org/wiki/Value_noise | Value Noise}
 */
export declare class SimpleNoise implements NoiseGenerator {
    /**
     * Fast hash function for converting integers to pseudo-random values.
     * @private
     */
    private hash;
    private hash2;
    private hash3;
    private interpolate;
    /**
     * Generates 1D noise value at the specified coordinate.
     *
     * @param x - Input coordinate
     * @returns Noise value between 0 and 1
     *
     * @remarks
     * 1D noise is ideal for:
     * - Time-based animation parameters
     * - Audio waveform generation
     * - Smooth value transitions
     * - Path displacement
     *
     * @example
     * ```typescript
     * const noise = new SimpleNoise();
     *
     * // Animate object position
     * const time = Date.now() * 0.001;
     * const offset = (noise.noise1D(time) - 0.5) * 50; // ±25 pixel offset
     * object.y = baseY + offset;
     * ```
     */
    noise1D(x: number): number;
    /**
     * Generates 2D noise value at the specified coordinates.
     *
     * @param x - X coordinate
     * @param y - Y coordinate
     * @returns Noise value between 0 and 1
     *
     * @remarks
     * 2D noise is the most common form, perfect for:
     * - Terrain height maps
     * - Texture generation
     * - Cloud patterns
     * - Surface displacement
     * - Procedural patterns
     *
     * @example
     * ```typescript
     * const noise = new SimpleNoise();
     *
     * // Generate height map
     * const terrainHeight = noise.noise2D(worldX * 0.01, worldY * 0.01) * 100;
     *
     * // Animate cloud movement
     * const time = Date.now() * 0.0001;
     * const cloudDensity = noise.noise2D(x * 0.005 + time, y * 0.005);
     * ```
     */
    noise2D(x: number, y: number): number;
    noise3D(x: number, y: number, z: number): number;
}
export declare class FractalNoise implements NoiseGenerator {
    private noise;
    private octaves;
    private persistence;
    private lacunarity;
    constructor(baseNoise?: NoiseGenerator, octaves?: number, persistence?: number, lacunarity?: number);
    noise1D(x: number): number;
    noise2D(x: number, y: number): number;
    noise3D(x: number, y: number, z: number): number;
}
export declare class PerlinNoise implements NoiseGenerator {
    private permutation;
    private p;
    constructor(seed?: number);
    private fade;
    private grad;
    noise1D(x: number): number;
    noise2D(x: number, y: number): number;
    noise3D(x: number, y: number, z: number): number;
    private lerp;
}
export declare const random: SeededRandom;
export declare const noise: PerlinNoise;
export declare const fractalNoise: FractalNoise;
export declare const randomInt: (min: number, max: number) => number;
export declare const randomFloat: (min: number, max: number) => number;
export declare const randomBool: () => boolean;
export declare const randomChoice: <T>(array: T[]) => T;
export declare const randomSign: () => number;
export declare const randomAngle: () => number;
export declare const randomInCircle: () => Vector2;
export declare const randomOnCircle: () => Vector2;
export declare const randomGaussian: (mean?: number, standardDeviation?: number) => number;
export declare const setSeed: (seed: number) => void;
export declare const weightedChoice: <T>(choices: T[], weights: number[]) => T;
export declare const shuffle: <T>(array: T[]) => T[];
export declare const randomColor: () => {
    r: number;
    g: number;
    b: number;
};
export declare const randomColorHSL: (hueMin?: number, hueMax?: number, saturationMin?: number, saturationMax?: number, lightnessMin?: number, lightnessMax?: number) => {
    h: number;
    s: number;
    l: number;
};
export declare const randomDistribution: (count: number, min: number, max: number) => number[];
export declare const randomWalk: (steps: number, stepSize?: number, dimensions?: number) => number[][];
export declare const sample: <T>(array: T[], count: number) => T[];
export declare const sampleWeighted: <T>(array: T[], weights: number[], count: number) => T[];
//# sourceMappingURL=random.d.ts.map