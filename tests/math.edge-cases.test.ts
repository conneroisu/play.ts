import { test, expect, describe } from 'bun:test';
import {
  clamp,
  lerp,
  map,
  normalize,
  smoothstep,
  smootherstep,
  degrees,
  radians,
  sign,
  fract,
  wrap,
  vec2,
  vec2Add,
  vec2Sub,
  vec2Mul,
  vec2Div,
  vec2Dot,
  vec2Length,
  vec2LengthSq,
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
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3LengthSq,
  vec3Normalize,
  vec3Distance,
  vec3Lerp,
  PI,
  TWO_PI
} from '../src/math.ts';
import {
  expectCloseTo,
  expectInRange,
  expectVec2CloseTo,
  expectVec3CloseTo,
  generateRandomNumbers,
  fuzzTest,
  expectError,
  expectNoError
} from './utils/test-helpers.ts';

describe('Math utilities - Edge Cases', () => {
  describe('Basic math functions edge cases', () => {
    test('clamp with extreme values', () => {
      expect(clamp(Infinity, 0, 100)).toBe(100);
      expect(clamp(-Infinity, 0, 100)).toBe(0);
      expect(clamp(NaN, 0, 100)).toBeNaN();
      expect(clamp(50, NaN, 100)).toBeNaN();
      expect(clamp(50, 0, NaN)).toBeNaN();
    });

    test('clamp with inverted min/max', () => {
      expect(clamp(50, 100, 0)).toBe(50); // Should swap min/max
      expect(clamp(-10, 100, 0)).toBe(0);
      expect(clamp(150, 100, 0)).toBe(100);
    });

    test('clamp with equal min/max', () => {
      expect(clamp(50, 75, 75)).toBe(75);
      expect(clamp(100, 75, 75)).toBe(75);
      expect(clamp(0, 75, 75)).toBe(75);
    });

    test('lerp with extreme t values', () => {
      expect(lerp(0, 100, -1)).toBe(-100);
      expect(lerp(0, 100, 2)).toBe(200);
      expect(lerp(0, 100, Infinity)).toBe(Infinity);
      expect(lerp(0, 100, -Infinity)).toBe(-Infinity);
      expect(lerp(0, 100, NaN)).toBeNaN();
    });

    test('lerp with extreme a/b values', () => {
      expect(lerp(Infinity, 0, 0.5)).toBe(Infinity);
      expect(lerp(0, Infinity, 0.5)).toBe(Infinity);
      expect(lerp(-Infinity, Infinity, 0.5)).toBeNaN();
      expect(lerp(NaN, 100, 0.5)).toBeNaN();
      expect(lerp(0, NaN, 0.5)).toBeNaN();
    });

    test('map with zero range', () => {
      expect(map(5, 0, 0, 10, 20)).toBe(Infinity);
      expect(map(5, 10, 10, 0, 100)).toBe(Infinity);
    });

    test('map with extreme values', () => {
      expect(map(Infinity, 0, 100, 0, 10)).toBe(Infinity);
      expect(map(5, -Infinity, Infinity, 0, 10)).toBeNaN();
      expect(map(NaN, 0, 100, 0, 10)).toBeNaN();
    });

    test('normalize with zero range', () => {
      expect(normalize(5, 10, 10)).toBe(Infinity);
      expect(normalize(10, 10, 10)).toBeNaN();
    });

    test('smoothstep edge behavior', () => {
      // Should clamp input to [0,1] range
      expect(smoothstep(0, 1, -0.5)).toBe(0);
      expect(smoothstep(0, 1, 1.5)).toBe(1);

      // Edge case: inverted edges
      expect(smoothstep(1, 0, 0.5)).toBe(0.5);
    });

    test('smootherstep edge behavior', () => {
      expect(smootherstep(0, 1, -0.5)).toBe(0);
      expect(smootherstep(0, 1, 1.5)).toBe(1);
    });

    test('degrees/radians with extreme values', () => {
      expect(degrees(Infinity)).toBe(Infinity);
      expect(degrees(-Infinity)).toBe(-Infinity);
      expect(degrees(NaN)).toBeNaN();
      expect(radians(Infinity)).toBe(Infinity);
      expect(radians(-Infinity)).toBe(-Infinity);
      expect(radians(NaN)).toBeNaN();
    });

    test('sign with special values', () => {
      expect(sign(0)).toBe(0);
      expect(sign(-0)).toBe(0);
      expect(sign(Infinity)).toBe(1);
      expect(sign(-Infinity)).toBe(-1);
      expect(sign(NaN)).toBe(0);
    });

    test('fract with special values', () => {
      expect(fract(Infinity)).toBeNaN();
      expect(fract(-Infinity)).toBeNaN();
      expect(fract(NaN)).toBeNaN();
      expect(fract(-0)).toBe(0);
    });

    test('wrap with edge cases', () => {
      expect(wrap(5, 0, 0)).toBe(0); // Zero range
      expect(wrap(Infinity, 0, 10)).toBeNaN();
      expect(wrap(5, Infinity, -Infinity)).toBeNaN();
      expect(wrap(NaN, 0, 10)).toBeNaN();
    });
  });

  describe('Vector2 edge cases', () => {
    test('vec2 with extreme values', () => {
      const v1 = vec2(Infinity, -Infinity);
      expect(v1.x).toBe(Infinity);
      expect(v1.y).toBe(-Infinity);

      const v2 = vec2(NaN, 0);
      expect(v2.x).toBeNaN();
      expect(v2.y).toBe(0);
    });

    test('vec2Add with extreme values', () => {
      const v1 = vec2(Infinity, 0);
      const v2 = vec2(-Infinity, 0);
      const result = vec2Add(v1, v2);
      expect(result.x).toBeNaN();
      expect(result.y).toBe(0);
    });

    test('vec2Mul with zero', () => {
      const v = vec2(100, -50);
      const result = vec2Mul(v, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    test('vec2Div with zero', () => {
      const v = vec2(100, -50);
      const result = vec2Div(v, 0);
      expect(result.x).toBe(Infinity);
      expect(result.y).toBe(-Infinity);
    });

    test('vec2Length with zero vector', () => {
      const v = vec2(0, 0);
      expect(vec2Length(v)).toBe(0);
      expect(vec2LengthSq(v)).toBe(0);
    });

    test('vec2Length with extreme values', () => {
      const v1 = vec2(Infinity, 0);
      expect(vec2Length(v1)).toBe(Infinity);

      const v2 = vec2(NaN, 0);
      expect(vec2Length(v2)).toBeNaN();
    });

    test('vec2Normalize with zero vector', () => {
      const v = vec2(0, 0);
      const normalized = vec2Normalize(v);
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });

    test('vec2Normalize with infinite vector', () => {
      const v = vec2(Infinity, 0);
      const normalized = vec2Normalize(v);
      expect(normalized.x).toBeNaN();
      expect(normalized.y).toBeNaN();
    });

    test('vec2Distance with same point', () => {
      const v = vec2(5, 3);
      expect(vec2Distance(v, v)).toBe(0);
    });

    test('vec2Angle with zero vector', () => {
      const v = vec2(0, 0);
      expect(vec2Angle(v)).toBe(0);
    });

    test('vec2Angle with extreme values', () => {
      const v1 = vec2(Infinity, 0);
      expect(vec2Angle(v1)).toBe(0);

      const v2 = vec2(0, Infinity);
      expectCloseTo(vec2Angle(v2), PI / 2);

      const v3 = vec2(-Infinity, 0);
      expectCloseTo(vec2Angle(v3), PI);
    });

    test('vec2FromAngle with extreme angles', () => {
      const v1 = vec2FromAngle(Infinity);
      expect(v1.x).toBeNaN();
      expect(v1.y).toBeNaN();

      const v2 = vec2FromAngle(NaN);
      expect(v2.x).toBeNaN();
      expect(v2.y).toBeNaN();
    });

    test('vec2Lerp with extreme t values', () => {
      const a = vec2(0, 0);
      const b = vec2(10, 20);

      const result1 = vec2Lerp(a, b, -1);
      expectVec2CloseTo(result1, { x: -10, y: -20 });

      const result2 = vec2Lerp(a, b, 2);
      expectVec2CloseTo(result2, { x: 20, y: 40 });
    });

    test('vec2Rotate with extreme angles', () => {
      const v = vec2(1, 0);

      const result1 = vec2Rotate(v, NaN);
      expect(result1.x).toBeNaN();
      expect(result1.y).toBeNaN();

      const result2 = vec2Rotate(v, Infinity);
      expect(result2.x).toBeNaN();
      expect(result2.y).toBeNaN();
    });
  });

  describe('Vector3 edge cases', () => {
    test('vec3 with extreme values', () => {
      const v = vec3(Infinity, -Infinity, NaN);
      expect(v.x).toBe(Infinity);
      expect(v.y).toBe(-Infinity);
      expect(v.z).toBeNaN();
    });

    test('vec3Cross with parallel vectors', () => {
      const v1 = vec3(1, 2, 3);
      const v2 = vec3(2, 4, 6); // Parallel to v1
      const result = vec3Cross(v1, v2);
      expectVec3CloseTo(result, { x: 0, y: 0, z: 0 });
    });

    test('vec3Cross with zero vectors', () => {
      const zero = vec3(0, 0, 0);
      const v = vec3(1, 2, 3);
      const result = vec3Cross(zero, v);
      expectVec3CloseTo(result, { x: 0, y: 0, z: 0 });
    });

    test('vec3Normalize with zero vector', () => {
      const v = vec3(0, 0, 0);
      const normalized = vec3Normalize(v);
      expectVec3CloseTo(normalized, { x: 0, y: 0, z: 0 });
    });

    test('vec3 with very small values', () => {
      const v = vec3(1e-15, 1e-15, 1e-15);
      const length = vec3Length(v);
      expect(length).toBeGreaterThan(0);
      expect(length).toBeLessThan(1e-14);
    });
  });

  describe('Property-based testing', () => {
    test('clamp properties', () => {
      fuzzTest(
        input => {
          const [value, min, max] = input;
          if (isNaN(value) || isNaN(min) || isNaN(max)) return;

          const clamped = clamp(value, min, max);
          const actualMin = Math.min(min, max);
          const actualMax = Math.max(min, max);

          if (!isNaN(clamped)) {
            expect(clamped).toBeGreaterThanOrEqual(actualMin);
            expect(clamped).toBeLessThanOrEqual(actualMax);
          }
        },
        () => generateRandomNumbers(3, -1000, 1000),
        500
      );
    });

    test('lerp properties', () => {
      fuzzTest(
        input => {
          const [a, b, t] = input;
          if (isNaN(a) || isNaN(b) || isNaN(t)) return;

          const result = lerp(a, b, t);

          // lerp(a, b, 0) should equal a
          expectCloseTo(lerp(a, b, 0), a, 10);

          // lerp(a, b, 1) should equal b
          expectCloseTo(lerp(a, b, 1), b, 10);

          // lerp should be linear
          if (Math.abs(t) < 1000 && Math.abs(a) < 1000 && Math.abs(b) < 1000) {
            const mid = lerp(a, b, 0.5);
            expectCloseTo(mid, (a + b) / 2, 10);
          }
        },
        () => generateRandomNumbers(3, -100, 100),
        500
      );
    });

    test('vector addition is commutative', () => {
      fuzzTest(
        vectors => {
          const [v1, v2] = vectors;
          const result1 = vec2Add(v1, v2);
          const result2 = vec2Add(v2, v1);

          if (!isNaN(result1.x) && !isNaN(result2.x)) {
            expectVec2CloseTo(result1, result2);
          }
        },
        () => [
          { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
          { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 }
        ],
        500
      );
    });

    test('vector addition is associative', () => {
      fuzzTest(
        vectors => {
          const [v1, v2, v3] = vectors;
          const result1 = vec2Add(vec2Add(v1, v2), v3);
          const result2 = vec2Add(v1, vec2Add(v2, v3));

          if (!isNaN(result1.x) && !isNaN(result2.x)) {
            expectVec2CloseTo(result1, result2, 3);
          }
        },
        () => [
          { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
          { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
          { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 }
        ],
        300
      );
    });

    test('vector dot product is commutative', () => {
      fuzzTest(
        vectors => {
          const [v1, v2] = vectors;
          const dot1 = vec2Dot(v1, v2);
          const dot2 = vec2Dot(v2, v1);

          if (!isNaN(dot1) && !isNaN(dot2)) {
            expectCloseTo(dot1, dot2);
          }
        },
        () => [
          { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
          { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 }
        ],
        500
      );
    });

    test('normalize creates unit vectors', () => {
      fuzzTest(
        v => {
          const normalized = vec2Normalize(v);
          const length = vec2Length(normalized);

          if (vec2Length(v) > 1e-10) {
            // Avoid zero vectors
            expectCloseTo(length, 1, 5);
          }
        },
        () => ({
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100
        }),
        500
      );
    });

    test('distance is symmetric', () => {
      fuzzTest(
        points => {
          const [p1, p2] = points;
          const dist1 = vec2Distance(p1, p2);
          const dist2 = vec2Distance(p2, p1);

          if (!isNaN(dist1) && !isNaN(dist2)) {
            expectCloseTo(dist1, dist2);
          }
        },
        () => [
          { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
          { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 }
        ],
        500
      );
    });

    test('triangle inequality for distance', () => {
      fuzzTest(
        points => {
          const [p1, p2, p3] = points;
          const d12 = vec2Distance(p1, p2);
          const d23 = vec2Distance(p2, p3);
          const d13 = vec2Distance(p1, p3);

          if (!isNaN(d12) && !isNaN(d23) && !isNaN(d13)) {
            expect(d13).toBeLessThanOrEqual(d12 + d23 + 1e-10); // Small epsilon for floating point
          }
        },
        () => [
          { x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 },
          { x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 },
          { x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 }
        ],
        300
      );
    });
  });

  describe('Precision and stability tests', () => {
    test('very small number handling', () => {
      const tiny = 1e-15;
      const v1 = vec2(tiny, tiny);
      const v2 = vec2(-tiny, -tiny);

      const added = vec2Add(v1, v2);
      expectVec2CloseTo(added, { x: 0, y: 0 }, 14);

      const length = vec2Length(v1);
      expect(length).toBeGreaterThan(0);
      expect(length).toBeLessThan(1e-14);
    });

    test('very large number handling', () => {
      const large = 1e15;
      const v1 = vec2(large, large);
      const v2 = vec2(1, 1);

      const added = vec2Add(v1, v2);
      // Due to floating point precision, adding 1 to 1e15 might not change it
      expect(added.x).toBeGreaterThanOrEqual(large);
      expect(added.y).toBeGreaterThanOrEqual(large);
    });

    test('accumulated rounding errors', () => {
      let v = vec2(1, 1);

      // Perform many operations that should theoretically return to the original value
      for (let i = 0; i < 1000; i++) {
        v = vec2Add(v, vec2(0.1, 0.1));
        v = vec2Sub(v, vec2(0.1, 0.1));
      }

      // Should be close to original, but may have accumulated error
      expectVec2CloseTo(v, { x: 1, y: 1 }, 10);
    });

    test('angle precision near boundaries', () => {
      // Test angles near 0, π/2, π, 3π/2, 2π
      const testAngles = [0, PI / 2, PI, (3 * PI) / 2, TWO_PI, -PI / 2, -PI];

      for (const angle of testAngles) {
        const v = vec2FromAngle(angle);
        const computedAngle = vec2Angle(v);

        // Normalize angles to [0, 2π) for comparison
        const normalizedExpected = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
        const normalizedComputed = ((computedAngle % TWO_PI) + TWO_PI) % TWO_PI;

        const angleDiff = Math.min(
          Math.abs(normalizedExpected - normalizedComputed),
          TWO_PI - Math.abs(normalizedExpected - normalizedComputed)
        );

        expect(angleDiff).toBeLessThan(1e-10);
      }
    });
  });

  describe('NaN and Infinity propagation', () => {
    test('NaN propagation in vector operations', () => {
      const nanVec = vec2(NaN, 0);
      const normalVec = vec2(1, 2);

      const added = vec2Add(nanVec, normalVec);
      expect(added.x).toBeNaN();
      expect(added.y).toBe(2);

      const dotProduct = vec2Dot(nanVec, normalVec);
      expect(dotProduct).toBeNaN();

      const length = vec2Length(nanVec);
      expect(length).toBeNaN();
    });

    test('Infinity propagation in vector operations', () => {
      const infVec = vec2(Infinity, 0);
      const normalVec = vec2(1, 2);

      const added = vec2Add(infVec, normalVec);
      expect(added.x).toBe(Infinity);
      expect(added.y).toBe(2);

      const length = vec2Length(infVec);
      expect(length).toBe(Infinity);

      const normalized = vec2Normalize(infVec);
      expect(normalized.x).toBeNaN();
      expect(normalized.y).toBeNaN();
    });
  });
});
