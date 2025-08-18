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

import type {
  NoiseGenerator,
  RandomGenerator,
  Vector2,
} from "../types/index.ts";
import { floor, vec2 } from "./math.ts";

// ============================================================================
// Seeded Random Number Generation
// ============================================================================

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
export class SeededRandom implements RandomGenerator {
  private seed_: number;

  /**
   * Creates a new seeded random number generator.
   *
   * @param seed - Initial seed value (defaults to current timestamp)
   */
  constructor(seed: number = Date.now()) {
    this.seed_ = seed;
  }

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
  next(): number {
    this.seed_ = (this.seed_ * 1664525 + 1013904223) % 4294967296;
    return this.seed_ / 4294967296;
  }

  /**
   * Sets a new seed value, resetting the generator state.
   *
   * @param value - New seed value
   *
   * @remarks
   * This allows you to restart the sequence from a known point,
   * useful for creating variations or branches in procedural generation.
   */
  seed(value: number): void {
    this.seed_ = value;
  }

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
  int(min: number, max: number): number {
    return floor(this.next() * (max - min + 1)) + min;
  }

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
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

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
  bool(): boolean {
    return this.next() > 0.5;
  }

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
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot choose from empty array");
    }
    return array[this.int(0, array.length - 1)]!;
  }

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
  sign(): number {
    return this.bool() ? 1 : -1;
  }

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
  angle(): number {
    return this.float(0, Math.PI * 2);
  }

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
  inCircle(): Vector2 {
    const angle = this.angle();
    const radius = Math.sqrt(this.next());
    return vec2(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }

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
  onCircle(): Vector2 {
    const angle = this.angle();
    return vec2(Math.cos(angle), Math.sin(angle));
  }

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
  gaussian(mean: number = 0, standardDeviation: number = 1): number {
    if (this.hasNextGaussian) {
      this.hasNextGaussian = false;
      return this.nextGaussian * standardDeviation + mean;
    }

    const u = this.next();
    const v = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const z1 = Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v);

    this.nextGaussian = z1;
    this.hasNextGaussian = true;

    return z0 * standardDeviation + mean;
  }

  private hasNextGaussian = false;
  private nextGaussian = 0;
}

// ============================================================================
// Noise Generation
// ============================================================================

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
export class SimpleNoise implements NoiseGenerator {
  /**
   * Fast hash function for converting integers to pseudo-random values.
   * @private
   */
  private hash(x: number): number {
    x = ((x >> 16) ^ x) * 0x45d9f3b;
    x = ((x >> 16) ^ x) * 0x45d9f3b;
    x = (x >> 16) ^ x;
    return x / 4294967296;
  }

  private hash2(x: number, y: number): number {
    return this.hash(x + y * 57);
  }

  private hash3(x: number, y: number, z: number): number {
    return this.hash(x + y * 57 + z * 113);
  }

  private interpolate(a: number, b: number, t: number): number {
    return a + t * t * (3 - 2 * t) * (b - a);
  }

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
  noise1D(x: number): number {
    const i = floor(x);
    const f = x - i;

    const a = this.hash(i);
    const b = this.hash(i + 1);

    return this.interpolate(a, b, f);
  }

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
  noise2D(x: number, y: number): number {
    const i = floor(x);
    const j = floor(y);
    const fx = x - i;
    const fy = y - j;

    const a = this.hash2(i, j);
    const b = this.hash2(i + 1, j);
    const c = this.hash2(i, j + 1);
    const d = this.hash2(i + 1, j + 1);

    const i1 = this.interpolate(a, b, fx);
    const i2 = this.interpolate(c, d, fx);

    return this.interpolate(i1, i2, fy);
  }

  noise3D(x: number, y: number, z: number): number {
    const i = floor(x);
    const j = floor(y);
    const k = floor(z);
    const fx = x - i;
    const fy = y - j;
    const fz = z - k;

    const a = this.hash3(i, j, k);
    const b = this.hash3(i + 1, j, k);
    const c = this.hash3(i, j + 1, k);
    const d = this.hash3(i + 1, j + 1, k);
    const e = this.hash3(i, j, k + 1);
    const f = this.hash3(i + 1, j, k + 1);
    const g = this.hash3(i, j + 1, k + 1);
    const h = this.hash3(i + 1, j + 1, k + 1);

    const i1 = this.interpolate(a, b, fx);
    const i2 = this.interpolate(c, d, fx);
    const i3 = this.interpolate(e, f, fx);
    const i4 = this.interpolate(g, h, fx);

    const j1 = this.interpolate(i1, i2, fy);
    const j2 = this.interpolate(i3, i4, fy);

    return this.interpolate(j1, j2, fz);
  }
}

// Fractal noise generator
export class FractalNoise implements NoiseGenerator {
  private noise: NoiseGenerator;
  private octaves: number;
  private persistence: number;
  private lacunarity: number;

  constructor(
    baseNoise: NoiseGenerator = new SimpleNoise(),
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2,
  ) {
    this.noise = baseNoise;
    this.octaves = octaves;
    this.persistence = persistence;
    this.lacunarity = lacunarity;
  }

  noise1D(x: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      value += this.noise.noise1D(x * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return value / maxValue;
  }

  noise2D(x: number, y: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      value += this.noise.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return value / maxValue;
  }

  noise3D(x: number, y: number, z: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      value +=
        this.noise.noise3D(x * frequency, y * frequency, z * frequency) *
        amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return value / maxValue;
  }
}

// Perlin noise implementation
export class PerlinNoise implements NoiseGenerator {
  private permutation: number[];
  private p: number[];

  constructor(seed?: number) {
    // Initialize permutation table
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Shuffle using seed if provided
    if (seed !== undefined) {
      const random = new SeededRandom(seed);
      for (let i = 255; i > 0; i--) {
        const j = random.int(0, i);
        [this.permutation[i], this.permutation[j]] = [
          this.permutation[j],
          this.permutation[i],
        ];
      }
    } else {
      // Fisher-Yates shuffle
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.permutation[i], this.permutation[j]] = [
          this.permutation[j],
          this.permutation[i],
        ];
      }
    }

    // Duplicate permutation table
    this.p = [];
    for (let i = 0; i < 512; i++) {
      this.p[i] = this.permutation[i & 255]!;
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise1D(x: number): number {
    return this.noise3D(x, 0, 0);
  }

  noise2D(x: number, y: number): number {
    return this.noise3D(x, y, 0);
  }

  noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X]! + Y;
    const AA = this.p[A]! + Z;
    const AB = this.p[A + 1]! + Z;
    const B = this.p[X + 1]! + Y;
    const BA = this.p[B]! + Z;
    const BB = this.p[B + 1]! + Z;

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.p[AA]!, x, y, z),
          this.grad(this.p[BA]!, x - 1, y, z),
        ),
        this.lerp(
          u,
          this.grad(this.p[AB]!, x, y - 1, z),
          this.grad(this.p[BB]!, x - 1, y - 1, z),
        ),
      ),
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.p[AA + 1]!, x, y, z - 1),
          this.grad(this.p[BA + 1]!, x - 1, y, z - 1),
        ),
        this.lerp(
          u,
          this.grad(this.p[AB + 1]!, x, y - 1, z - 1),
          this.grad(this.p[BB + 1]!, x - 1, y - 1, z - 1),
        ),
      ),
    );
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }
}

// Global instances
export const random = new SeededRandom();
export const noise = new PerlinNoise();
export const fractalNoise = new FractalNoise();

// Utility functions
export const randomInt = (min: number, max: number): number => {
  return random.int(min, max);
};

export const randomFloat = (min: number, max: number): number => {
  return random.float(min, max);
};

export const randomBool = (): boolean => {
  return random.bool();
};

export const randomChoice = <T>(array: T[]): T => {
  return random.choice(array);
};

export const randomSign = (): number => {
  return random.sign();
};

export const randomAngle = (): number => {
  return random.angle();
};

export const randomInCircle = (): Vector2 => {
  return random.inCircle();
};

export const randomOnCircle = (): Vector2 => {
  return random.onCircle();
};

export const randomGaussian = (
  mean: number = 0,
  standardDeviation: number = 1,
): number => {
  return random.gaussian(mean, standardDeviation);
};

export const setSeed = (seed: number): void => {
  random.seed(seed);
};

// Weighted random selection
export const weightedChoice = <T>(choices: T[], weights: number[]): T => {
  if (choices.length !== weights.length) {
    throw new Error("Choices and weights arrays must have the same length");
  }
  if (choices.length === 0) {
    throw new Error("Cannot choose from empty array");
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const randomValue = Math.random() * totalWeight;

  let currentWeight = 0;
  for (let i = 0; i < choices.length; i++) {
    currentWeight += weights[i]!;
    if (randomValue <= currentWeight) {
      return choices[i]!;
    }
  }

  return choices[choices.length - 1]!;
};

// Shuffle array using Fisher-Yates algorithm
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Random color generation
export const randomColor = () => {
  return {
    r: randomInt(0, 255),
    g: randomInt(0, 255),
    b: randomInt(0, 255),
  };
};

// Random color with constraints
export const randomColorHSL = (
  hueMin: number = 0,
  hueMax: number = 360,
  saturationMin: number = 0,
  saturationMax: number = 100,
  lightnessMin: number = 0,
  lightnessMax: number = 100,
) => {
  return {
    h: randomFloat(hueMin, hueMax),
    s: randomFloat(saturationMin, saturationMax),
    l: randomFloat(lightnessMin, lightnessMax),
  };
};

// Generate random distribution
export const randomDistribution = (
  count: number,
  min: number,
  max: number,
): number[] => {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    values.push(randomFloat(min, max));
  }
  return values;
};

// Generate random walk
export const randomWalk = (
  steps: number,
  stepSize: number = 1,
  dimensions: number = 2,
): number[][] => {
  const walk: number[][] = [];
  const position = new Array(dimensions).fill(0);

  walk.push([...position]);

  for (let i = 0; i < steps; i++) {
    for (let d = 0; d < dimensions; d++) {
      position[d] += (Math.random() - 0.5) * stepSize * 2;
    }
    walk.push([...position]);
  }

  return walk;
};

// Random sampling utilities
export const sample = <T>(array: T[], count: number): T[] => {
  if (array.length === 0) throw new Error("Cannot sample from empty array");
  if (count <= 0) return [];
  if (count >= array.length) return [...array];

  const result: T[] = [];
  const used = new Set<number>();

  while (result.length < count) {
    const index = randomInt(0, array.length - 1);
    if (!used.has(index)) {
      used.add(index);
      result.push(array[index]!);
    }
  }

  return result;
};

export const sampleWeighted = <T>(
  array: T[],
  weights: number[],
  count: number,
): T[] => {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(weightedChoice(array, weights));
  }
  return result;
};
