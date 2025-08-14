import { test, expect, describe, beforeEach } from 'bun:test';
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
} from '../src/random.ts';
import { vec2Length, PI, TWO_PI } from '../src/math.ts';

describe('Random utilities', () => {
  describe('SeededRandom', () => {
    test('creates seeded random generator', () => {
      const rng = new SeededRandom(12345);
      expect(rng).toBeInstanceOf(SeededRandom);
    });

    test('produces deterministic results with same seed', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      expect(rng1.next()).toBe(rng2.next());
      expect(rng1.next()).toBe(rng2.next());
      expect(rng1.next()).toBe(rng2.next());
    });

    test('produces different results with different seeds', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(54321);

      expect(rng1.next()).not.toBe(rng2.next());
    });

    test('next() returns values between 0 and 1', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    test('int() returns integers in range', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.int(5, 10);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(10);
      }
    });

    test('float() returns floats in range', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.float(2.5, 7.5);
        expect(value).toBeGreaterThanOrEqual(2.5);
        expect(value).toBeLessThanOrEqual(7.5);
      }
    });

    test('bool() returns boolean', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.bool();
        expect(typeof value).toBe('boolean');
      }
    });

    test('choice() returns element from array', () => {
      const rng = new SeededRandom(12345);
      const array = ['a', 'b', 'c', 'd', 'e'];

      for (let i = 0; i < 100; i++) {
        const value = rng.choice(array);
        expect(array).toContain(value);
      }
    });

    test('sign() returns -1 or 1', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.sign();
        expect(value === 1 || value === -1).toBe(true);
      }
    });

    test('angle() returns angle between 0 and 2π', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.angle();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(TWO_PI);
      }
    });

    test('inCircle() returns point inside unit circle', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const point = rng.inCircle();
        const distance = vec2Length(point);
        expect(distance).toBeLessThanOrEqual(1);
      }
    });

    test('onCircle() returns point on unit circle', () => {
      const rng = new SeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const point = rng.onCircle();
        const distance = vec2Length(point);
        expect(distance).toBeCloseTo(1, 5);
      }
    });

    test('gaussian() produces normal distribution', () => {
      const rng = new SeededRandom(12345);
      const values: number[] = [];

      // Generate a large sample
      for (let i = 0; i < 1000; i++) {
        values.push(rng.gaussian(0, 1));
      }

      // Calculate mean and standard deviation
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Should be approximately normal distribution
      expect(mean).toBeCloseTo(0, 0.1);
      expect(stdDev).toBeCloseTo(1, 0.1);
    });

    test('seed() resets generator', () => {
      const rng = new SeededRandom(12345);
      const value1 = rng.next();
      const value2 = rng.next();

      rng.seed(12345);
      const value3 = rng.next();
      const value4 = rng.next();

      expect(value1).toBe(value3);
      expect(value2).toBe(value4);
    });
  });

  describe('Noise generators', () => {
    test('SimpleNoise produces values between 0 and 1', () => {
      const simpleNoise = new SimpleNoise();

      for (let i = 0; i < 100; i++) {
        const value1D = simpleNoise.noise1D(i * 0.1);
        const value2D = simpleNoise.noise2D(i * 0.1, i * 0.2);
        const value3D = simpleNoise.noise3D(i * 0.1, i * 0.2, i * 0.3);

        expect(value1D).toBeGreaterThanOrEqual(0);
        expect(value1D).toBeLessThanOrEqual(1);
        expect(value2D).toBeGreaterThanOrEqual(0);
        expect(value2D).toBeLessThanOrEqual(1);
        expect(value3D).toBeGreaterThanOrEqual(0);
        expect(value3D).toBeLessThanOrEqual(1);
      }
    });

    test('SimpleNoise is deterministic', () => {
      const noise1 = new SimpleNoise();
      const noise2 = new SimpleNoise();

      expect(noise1.noise1D(1.5)).toBe(noise2.noise1D(1.5));
      expect(noise1.noise2D(1.5, 2.5)).toBe(noise2.noise2D(1.5, 2.5));
      expect(noise1.noise3D(1.5, 2.5, 3.5)).toBe(noise2.noise3D(1.5, 2.5, 3.5));
    });

    test('PerlinNoise produces values between approximately -1 and 1', () => {
      const perlin = new PerlinNoise(12345);

      for (let i = 0; i < 100; i++) {
        const value1D = perlin.noise1D(i * 0.1);
        const value2D = perlin.noise2D(i * 0.1, i * 0.2);
        const value3D = perlin.noise3D(i * 0.1, i * 0.2, i * 0.3);

        expect(value1D).toBeGreaterThanOrEqual(-1.5);
        expect(value1D).toBeLessThanOrEqual(1.5);
        expect(value2D).toBeGreaterThanOrEqual(-1.5);
        expect(value2D).toBeLessThanOrEqual(1.5);
        expect(value3D).toBeGreaterThanOrEqual(-1.5);
        expect(value3D).toBeLessThanOrEqual(1.5);
      }
    });

    test('PerlinNoise with same seed produces same results', () => {
      const perlin1 = new PerlinNoise(12345);
      const perlin2 = new PerlinNoise(12345);

      expect(perlin1.noise1D(1.5)).toBe(perlin2.noise1D(1.5));
      expect(perlin1.noise2D(1.5, 2.5)).toBe(perlin2.noise2D(1.5, 2.5));
      expect(perlin1.noise3D(1.5, 2.5, 3.5)).toBe(perlin2.noise3D(1.5, 2.5, 3.5));
    });

    test('FractalNoise combines multiple octaves', () => {
      const simpleNoise = new SimpleNoise();
      const fractal = new FractalNoise(simpleNoise, 4, 0.5, 2);

      for (let i = 0; i < 50; i++) {
        const value1D = fractal.noise1D(i * 0.1);
        const value2D = fractal.noise2D(i * 0.1, i * 0.2);
        const value3D = fractal.noise3D(i * 0.1, i * 0.2, i * 0.3);

        expect(typeof value1D).toBe('number');
        expect(typeof value2D).toBe('number');
        expect(typeof value3D).toBe('number');
        expect(isNaN(value1D)).toBe(false);
        expect(isNaN(value2D)).toBe(false);
        expect(isNaN(value3D)).toBe(false);
      }
    });
  });

  describe('Global utility functions', () => {
    beforeEach(() => {
      setSeed(12345);
    });

    test('randomInt produces integers in range', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomInt(5, 10);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(10);
      }
    });

    test('randomFloat produces floats in range', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomFloat(2.5, 7.5);
        expect(value).toBeGreaterThanOrEqual(2.5);
        expect(value).toBeLessThanOrEqual(7.5);
      }
    });

    test('randomBool produces boolean', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomBool();
        expect(typeof value).toBe('boolean');
      }
    });

    test('randomChoice returns element from array', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];

      for (let i = 0; i < 100; i++) {
        const value = randomChoice(array);
        expect(array).toContain(value);
      }
    });

    test('randomSign returns -1 or 1', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomSign();
        expect(value === 1 || value === -1).toBe(true);
      }
    });

    test('randomAngle returns angle between 0 and 2π', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomAngle();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(TWO_PI);
      }
    });

    test('randomInCircle returns point inside unit circle', () => {
      for (let i = 0; i < 100; i++) {
        const point = randomInCircle();
        const distance = vec2Length(point);
        expect(distance).toBeLessThanOrEqual(1);
      }
    });

    test('randomOnCircle returns point on unit circle', () => {
      for (let i = 0; i < 100; i++) {
        const point = randomOnCircle();
        const distance = vec2Length(point);
        expect(distance).toBeCloseTo(1, 5);
      }
    });

    test('randomGaussian produces normal distribution', () => {
      const values: number[] = [];

      for (let i = 0; i < 1000; i++) {
        values.push(randomGaussian(0, 1));
      }

      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
      const stdDev = Math.sqrt(variance);

      expect(mean).toBeCloseTo(0, 0.1);
      expect(stdDev).toBeCloseTo(1, 0.1);
    });

    test('weightedChoice respects weights', () => {
      const choices = ['a', 'b', 'c'];
      const weights = [0.1, 0.1, 0.8]; // 'c' should be chosen most often
      const results: Record<string, number> = { a: 0, b: 0, c: 0 };

      for (let i = 0; i < 1000; i++) {
        const choice = weightedChoice(choices, weights);
        results[choice]++;
      }

      // 'c' should have been chosen significantly more often
      expect(results.c).toBeGreaterThan(results.a + results.b);
    });

    test('shuffle returns array of same length', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);

      expect(shuffled.length).toBe(original.length);
      expect(shuffled).not.toBe(original); // Should be a new array
    });

    test('shuffle preserves all elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);

      for (const element of original) {
        expect(shuffled).toContain(element);
      }
    });

    test('randomColor produces valid RGB', () => {
      for (let i = 0; i < 50; i++) {
        const color = randomColor();
        expect(color.r).toBeGreaterThanOrEqual(0);
        expect(color.r).toBeLessThanOrEqual(255);
        expect(color.g).toBeGreaterThanOrEqual(0);
        expect(color.g).toBeLessThanOrEqual(255);
        expect(color.b).toBeGreaterThanOrEqual(0);
        expect(color.b).toBeLessThanOrEqual(255);
      }
    });

    test('randomColorHSL produces valid HSL', () => {
      for (let i = 0; i < 50; i++) {
        const color = randomColorHSL(0, 360, 0, 100, 0, 100);
        expect(color.h).toBeGreaterThanOrEqual(0);
        expect(color.h).toBeLessThanOrEqual(360);
        expect(color.s).toBeGreaterThanOrEqual(0);
        expect(color.s).toBeLessThanOrEqual(100);
        expect(color.l).toBeGreaterThanOrEqual(0);
        expect(color.l).toBeLessThanOrEqual(100);
      }
    });

    test('randomDistribution produces array of correct length', () => {
      const distribution = randomDistribution(50, 0, 100);
      expect(distribution.length).toBe(50);

      for (const value of distribution) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });

    test('randomWalk produces array of correct length', () => {
      const walk = randomWalk(20, 1, 2);
      expect(walk.length).toBe(21); // 20 steps + initial position

      for (const position of walk) {
        expect(position.length).toBe(2); // 2D walk
      }
    });

    test('sample returns correct number of elements', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const sampled = sample(array, 5);

      expect(sampled.length).toBe(5);

      for (const element of sampled) {
        expect(array).toContain(element);
      }

      // Should not have duplicates
      const unique = new Set(sampled);
      expect(unique.size).toBe(sampled.length);
    });

    test('sampleWeighted returns correct number of elements', () => {
      const array = ['a', 'b', 'c'];
      const weights = [0.5, 0.3, 0.2];
      const sampled = sampleWeighted(array, weights, 10);

      expect(sampled.length).toBe(10);

      for (const element of sampled) {
        expect(array).toContain(element);
      }
    });
  });

  describe('Global instances', () => {
    test('global random instance exists', () => {
      expect(random).toBeInstanceOf(SeededRandom);
    });

    test('global noise instance exists', () => {
      expect(noise).toBeInstanceOf(PerlinNoise);
    });

    test('global fractalNoise instance exists', () => {
      expect(fractalNoise).toBeInstanceOf(FractalNoise);
    });

    test('setSeed affects global random', () => {
      setSeed(12345);
      const value1 = random.next();

      setSeed(12345);
      const value2 = random.next();

      expect(value1).toBe(value2);
    });
  });
});
